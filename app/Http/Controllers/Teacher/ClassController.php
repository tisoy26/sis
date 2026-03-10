<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\GradeItem;
use App\Models\GradeScore;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ClassController extends Controller
{
    /**
     * List all classes (assignments) for the logged-in teacher in the active school year.
     */
    public function index(): Response
    {
        $teacher = Auth::user();
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        $classes = collect();

        if ($activeSchoolYear) {
            $assignments = TeacherAssignment::with(['section.yearLevel', 'subject'])
                ->where('teacher_id', $teacher->id)
                ->where('school_year_id', $activeSchoolYear->id)
                ->get();

            // Group by section to get unique classes with their subjects
            $grouped = $assignments->groupBy('section_id');

            $classes = $grouped->map(function ($group) {
                $first = $group->first();
                $section = $first->section;

                $enrolledCount = Enrollment::where('section_id', $section->id)
                    ->where('status', 'enrolled')
                    ->count();

                return [
                    'id' => $section->id,
                    'section_id' => $section->id,
                    'section_name' => $section->name,
                    'year_level_name' => $section->yearLevel?->name ?? '—',
                    'year_level_category' => $section->yearLevel?->category ?? '—',
                    'subjects' => $group->map(fn ($a) => [
                        'id' => $a->subject->id,
                        'code' => $a->subject->code,
                        'name' => $a->subject->name,
                        'assignment_id' => $a->id,
                    ])->values(),
                    'subject_count' => $group->count(),
                    'student_count' => $enrolledCount,
                ];
            })->values();
        }

        return Inertia::render('teacher/classes/index', [
            'classes' => $classes,
            'activeSchoolYear' => $activeSchoolYear?->name,
        ]);
    }

    /**
     * Show students enrolled in a specific section (class detail).
     */
    public function show(int $sectionId): Response
    {
        $teacher = Auth::user();
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        // Verify teacher is assigned to this section
        $assignments = TeacherAssignment::with(['subject'])
            ->where('teacher_id', $teacher->id)
            ->where('section_id', $sectionId)
            ->when($activeSchoolYear, fn ($q) => $q->where('school_year_id', $activeSchoolYear->id))
            ->get();

        if ($assignments->isEmpty()) {
            abort(403, 'You are not assigned to this section.');
        }

        $section = $assignments->first()->section()->with('yearLevel')->first();

        // Get enrolled students
        $enrollments = Enrollment::with(['student'])
            ->where('section_id', $sectionId)
            ->when($activeSchoolYear, fn ($q) => $q->where('school_year_id', $activeSchoolYear->id))
            ->get();

        $students = $enrollments->map(function ($enrollment) {
            $student = $enrollment->student;

            return [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'full_name' => $student->full_name,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'gender' => $student->gender,
                'contact_number' => $student->contact_number,
                'email' => $student->email,
                'status' => $enrollment->status,
                'enrolled_at' => $enrollment->enrolled_at?->toDateString(),
            ];
        })->sortBy('full_name')->values();

        $subjects = $assignments->map(fn ($a) => [
            'id' => $a->subject->id,
            'code' => $a->subject->code,
            'name' => $a->subject->name,
        ])->values();

        $genderCounts = $students->groupBy('gender')->map->count();

        return Inertia::render('teacher/classes/show', [
            'section' => [
                'id' => $section->id,
                'name' => $section->name,
                'year_level_name' => $section->yearLevel?->name ?? '—',
            ],
            'students' => $students,
            'subjects' => $subjects,
            'activeSchoolYear' => $activeSchoolYear?->name,
            'summary' => [
                'total' => $students->count(),
                'male' => $genderCounts->get('male', 0),
                'female' => $genderCounts->get('female', 0),
                'enrolled' => $students->where('status', 'enrolled')->count(),
                'dropped' => $students->where('status', 'dropped')->count(),
            ],
        ]);
    }

    /**
     * Show detailed student profile: info, attendance, and grades for this section.
     */
    public function showStudent(int $sectionId, Student $student): Response
    {
        $teacher = Auth::user();
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        if (! $activeSchoolYear) {
            abort(404, 'No active school year.');
        }

        // Verify teacher is assigned to this section
        $assignments = TeacherAssignment::with(['subject'])
            ->where('teacher_id', $teacher->id)
            ->where('section_id', $sectionId)
            ->where('school_year_id', $activeSchoolYear->id)
            ->get();

        if ($assignments->isEmpty()) {
            abort(403, 'You are not assigned to this section.');
        }

        $section = \App\Models\Section::with('yearLevel')->findOrFail($sectionId);

        // Verify student is enrolled in this section
        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('section_id', $sectionId)
            ->where('school_year_id', $activeSchoolYear->id)
            ->first();

        if (! $enrollment) {
            abort(404, 'Student is not enrolled in this section.');
        }

        // --- Student Info ---
        $studentInfo = [
            'id' => $student->id,
            'student_id' => $student->student_id,
            'full_name' => $student->full_name,
            'first_name' => $student->first_name,
            'last_name' => $student->last_name,
            'middle_name' => $student->middle_name,
            'gender' => $student->gender,
            'birth_date' => $student->birth_date?->toDateString(),
            'contact_number' => $student->contact_number,
            'email' => $student->email,
            'status' => $enrollment->status,
            'enrolled_at' => $enrollment->enrolled_at?->toDateString(),
        ];

        // --- Attendance Summary ---
        $attendanceRecords = Attendance::with('subject')
            ->where('student_id', $student->id)
            ->where('section_id', $sectionId)
            ->where('school_year_id', $activeSchoolYear->id)
            ->orderBy('date', 'desc')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'date' => $a->date->toDateString(),
                'status' => $a->status,
                'remarks' => $a->remarks,
                'subject_name' => $a->subject?->name ?? '—',
            ]);

        $attendanceSummary = [
            'total_days' => $attendanceRecords->count(),
            'present' => $attendanceRecords->where('status', 'present')->count(),
            'absent' => $attendanceRecords->where('status', 'absent')->count(),
            'late' => $attendanceRecords->where('status', 'late')->count(),
            'excused' => $attendanceRecords->where('status', 'excused')->count(),
        ];

        // --- Grades per Subject (all subjects teacher teaches in this section) ---
        $subjectGrades = $assignments->map(function ($assignment) use ($student, $activeSchoolYear, $sectionId) {
            $subject = $assignment->subject;
            $weightCategory = Grade::getWeightCategory($subject->code);
            $weights = Grade::getWeights($subject->code);

            $quarterlyGrades = [];

            for ($q = 1; $q <= 4; $q++) {
                $gradeItems = GradeItem::where('school_year_id', $activeSchoolYear->id)
                    ->where('section_id', $sectionId)
                    ->where('subject_id', $subject->id)
                    ->where('quarter', $q)
                    ->get();

                if ($gradeItems->isEmpty()) {
                    $quarterlyGrades[$q] = null;

                    continue;
                }

                $itemIds = $gradeItems->pluck('id');
                $scores = GradeScore::whereIn('grade_item_id', $itemIds)
                    ->where('student_id', $student->id)
                    ->get()
                    ->keyBy('grade_item_id');

                $itemsByType = $gradeItems->groupBy('type');
                $hpsByType = [
                    'WW' => $itemsByType->get('WW', collect())->sum('max_score'),
                    'PT' => $itemsByType->get('PT', collect())->sum('max_score'),
                    'QA' => $itemsByType->get('QA', collect())->sum('max_score'),
                ];

                $scoreTotals = ['WW' => 0, 'PT' => 0, 'QA' => 0];
                foreach ($gradeItems as $item) {
                    $s = $scores->get($item->id);
                    if ($s && $s->score !== null) {
                        $scoreTotals[$item->type] += (float) $s->score;
                    }
                }

                $wwPercent = $hpsByType['WW'] > 0 ? ($scoreTotals['WW'] / $hpsByType['WW']) * 100 : null;
                $ptPercent = $hpsByType['PT'] > 0 ? ($scoreTotals['PT'] / $hpsByType['PT']) * 100 : null;
                $qaPercent = $hpsByType['QA'] > 0 ? ($scoreTotals['QA'] / $hpsByType['QA']) * 100 : null;

                if ($wwPercent !== null && $ptPercent !== null && $qaPercent !== null) {
                    $initialGrade = Grade::computeInitialGrade($wwPercent, $ptPercent, $qaPercent, $weights);
                    $quarterlyGrades[$q] = Grade::transmute($initialGrade);
                } else {
                    $quarterlyGrades[$q] = null;
                }
            }

            // Compute final grade (average of quarters that have grades)
            $gradedQuarters = collect($quarterlyGrades)->filter(fn ($g) => $g !== null);
            $finalGrade = $gradedQuarters->isNotEmpty() ? round($gradedQuarters->avg()) : null;

            return [
                'subject_id' => $subject->id,
                'subject_code' => $subject->code,
                'subject_name' => $subject->name,
                'weight_category' => $weightCategory,
                'q1' => $quarterlyGrades[1],
                'q2' => $quarterlyGrades[2],
                'q3' => $quarterlyGrades[3],
                'q4' => $quarterlyGrades[4],
                'final_grade' => $finalGrade,
            ];
        })->values();

        return Inertia::render('teacher/classes/student-detail', [
            'student' => $studentInfo,
            'section' => [
                'id' => $section->id,
                'name' => $section->name,
                'year_level_name' => $section->yearLevel?->name ?? '—',
            ],
            'activeSchoolYear' => $activeSchoolYear->name,
            'attendanceSummary' => $attendanceSummary,
            'attendanceRecords' => $attendanceRecords->values(),
            'subjectGrades' => $subjectGrades,
        ]);
    }
}
