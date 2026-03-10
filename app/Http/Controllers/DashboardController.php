<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Attendance;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\GradeItem;
use App\Models\GradeScore;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Models\User;
use App\Models\YearLevel;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $user = auth()->user();

        $data = [];

        if ($user->type === 'admin') {
            $activeSchoolYear = SchoolYear::where('status', 'active')->first();

            $data = [
                'stats' => [
                    'totalUsers' => User::count(),
                    'totalTeachers' => User::where('type', 'teacher')->count(),
                    'totalStaff' => User::where('type', 'staff')->count(),
                    'totalSubjects' => Subject::where('status', 'active')->count(),
                    'totalSections' => Section::where('status', 'active')->count(),
                    'totalSchoolYears' => SchoolYear::count(),
                    'totalAssignments' => $activeSchoolYear
                        ? TeacherAssignment::where('school_year_id', $activeSchoolYear->id)->count()
                        : 0,
                    'activeSchoolYear' => $activeSchoolYear?->name,
                ],
                'recentActivity' => AuditLog::latest()
                    ->take(20)
                    ->get()
                    ->map(fn ($log) => [
                        'id' => $log->id,
                        'user_name' => $log->user_name ?? 'System',
                        'action' => $log->action,
                        'model_label' => $log->model_label,
                        'model_id' => $log->model_id,
                        'created_at' => $log->created_at->toISOString(),
                    ]),
            ];
        }

        if ($user->type === 'staff') {
            $activeSchoolYear = SchoolYear::where('status', 'active')->first();

            // Student counts by status
            $studentsByStatus = Student::select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            $totalStudents = array_sum($studentsByStatus);

            // Enrollment counts by status (for active SY)
            $enrollmentQuery = Enrollment::query();
            if ($activeSchoolYear) {
                $enrollmentQuery->where('school_year_id', $activeSchoolYear->id);
            }
            $enrollmentsByStatus = (clone $enrollmentQuery)
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            $totalEnrollments = array_sum($enrollmentsByStatus);

            // Gender distribution
            $genderDistribution = Student::select('gender', DB::raw('count(*) as count'))
                ->groupBy('gender')
                ->pluck('count', 'gender')
                ->toArray();

            // Section enrollment counts (active SY)
            $sectionEnrollments = Section::with('yearLevel')
                ->where('status', 'active')
                ->withCount(['enrollments as enrolled_count' => function ($q) use ($activeSchoolYear) {
                    $q->where('status', 'enrolled');
                    if ($activeSchoolYear) {
                        $q->where('school_year_id', $activeSchoolYear->id);
                    }
                }])
                ->orderByDesc('enrolled_count')
                ->get()
                ->map(fn ($s) => [
                    'name' => $s->name,
                    'count' => $s->enrolled_count,
                    'year_level' => $s->yearLevel?->name,
                ]);

            // Recent enrollments
            $recentEnrollments = Enrollment::with(['student', 'section', 'schoolYear'])
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'student_name' => $e->student->full_name,
                    'student_number' => $e->student->student_id,
                    'section_name' => $e->section->name,
                    'school_year_name' => $e->schoolYear->name,
                    'status' => $e->status,
                    'enrolled_at' => $e->enrolled_at?->toISOString(),
                    'created_at' => $e->created_at->toISOString(),
                ]);

            $data = [
                'staffStats' => [
                    'totalStudents' => $totalStudents,
                    'activeStudents' => $studentsByStatus['active'] ?? 0,
                    'totalEnrollments' => $totalEnrollments,
                    'totalSections' => Section::where('status', 'active')->count(),
                    'activeSchoolYear' => $activeSchoolYear?->name,
                ],
                'studentsByStatus' => collect($studentsByStatus)->map(fn ($count, $status) => [
                    'name' => ucfirst($status),
                    'value' => $count,
                ])->values(),
                'enrollmentsByStatus' => collect($enrollmentsByStatus)->map(fn ($count, $status) => [
                    'name' => ucfirst($status),
                    'value' => $count,
                ])->values(),
                'genderDistribution' => collect($genderDistribution)->map(fn ($count, $gender) => [
                    'name' => ucfirst($gender),
                    'value' => $count,
                ])->values(),
                'sectionEnrollments' => $sectionEnrollments,
                'recentEnrollments' => $recentEnrollments,
                'enrollmentTrend' => SchoolYear::orderBy('start_date')
                    ->get()
                    ->map(fn ($sy) => [
                        'name' => $sy->name,
                        'value' => Enrollment::where('school_year_id', $sy->id)->count(),
                    ]),
            ];
        }

        if ($user->type === 'teacher') {
            $activeSchoolYear = SchoolYear::where('status', 'active')->first();

            $assignments = collect();
            $totalStudents = 0;
            $sectionIds = [];

            if ($activeSchoolYear) {
                $assignments = TeacherAssignment::with(['section.yearLevel', 'subject'])
                    ->where('teacher_id', $user->id)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->get();

                $sectionIds = $assignments->pluck('section_id')->unique()->toArray();

                $totalStudents = Enrollment::whereIn('section_id', $sectionIds)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->where('status', 'enrolled')
                    ->count();
            }

            $uniqueSections = $assignments->groupBy('section_id')->count();
            $uniqueSubjects = $assignments->pluck('subject_id')->unique()->count();

            // Gender distribution across teacher's sections
            $genderDistribution = [];
            if (! empty($sectionIds) && $activeSchoolYear) {
                $genderDistribution = Enrollment::join('students', 'enrollments.student_id', '=', 'students.id')
                    ->whereIn('enrollments.section_id', $sectionIds)
                    ->where('enrollments.school_year_id', $activeSchoolYear->id)
                    ->where('enrollments.status', 'enrolled')
                    ->select('students.gender', DB::raw('count(*) as count'))
                    ->groupBy('students.gender')
                    ->pluck('count', 'gender')
                    ->toArray();
            }

            // Per-section student counts
            $sectionStudentCounts = collect();
            if (! empty($sectionIds) && $activeSchoolYear) {
                $sectionStudentCounts = Section::with('yearLevel')
                    ->whereIn('id', $sectionIds)
                    ->withCount(['enrollments as enrolled_count' => function ($q) use ($activeSchoolYear) {
                        $q->where('status', 'enrolled')
                            ->where('school_year_id', $activeSchoolYear->id);
                    }])
                    ->get()
                    ->map(fn ($s) => [
                        'name' => $s->name,
                        'year_level' => $s->yearLevel?->name ?? '—',
                        'count' => $s->enrolled_count,
                    ]);
            }

            $data = [
                'teacherStats' => [
                    'totalSections' => $uniqueSections,
                    'totalSubjects' => $uniqueSubjects,
                    'totalStudents' => $totalStudents,
                    'totalAssignments' => $assignments->count(),
                    'activeSchoolYear' => $activeSchoolYear?->name,
                ],
                'genderDistribution' => collect($genderDistribution)->map(fn ($count, $gender) => [
                    'name' => ucfirst($gender),
                    'value' => $count,
                ])->values(),
                'sectionStudentCounts' => $sectionStudentCounts,
            ];
        }

        if ($user->type === 'student') {
            $student = $user->student;
            $activeSchoolYear = SchoolYear::where('status', 'active')->first();

            // Current enrollment
            $currentEnrollment = null;
            if ($student && $activeSchoolYear) {
                $currentEnrollment = Enrollment::with(['section.yearLevel', 'schoolYear'])
                    ->where('student_id', $student->id)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->where('status', 'enrolled')
                    ->first();
            }

            // Subjects in current section
            $subjects = [];
            if ($currentEnrollment) {
                $subjects = TeacherAssignment::with('subject')
                    ->where('section_id', $currentEnrollment->section_id)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->get()
                    ->pluck('subject')
                    ->unique('id')
                    ->map(fn ($s) => [
                        'id' => $s->id,
                        'code' => $s->code,
                        'name' => $s->name,
                    ])
                    ->values();
            }

            // Attendance summary
            $attendanceSummary = [];
            if ($student && $activeSchoolYear) {
                $attendanceSummary = Attendance::where('student_id', $student->id)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->select('status', DB::raw('count(*) as count'))
                    ->groupBy('status')
                    ->pluck('count', 'status')
                    ->toArray();
            }

            // Quarterly grades per subject
            $quarterlyGrades = [];
            if ($student && $currentEnrollment && $activeSchoolYear) {
                $gradeItems = GradeItem::where('school_year_id', $activeSchoolYear->id)
                    ->where('section_id', $currentEnrollment->section_id)
                    ->with(['scores' => fn ($q) => $q->where('student_id', $student->id)])
                    ->get();

                foreach ($subjects as $subject) {
                    $subjectGrades = [];
                    foreach ([1, 2, 3, 4] as $quarter) {
                        $items = $gradeItems->where('subject_id', $subject['id'])->where('quarter', $quarter);

                        if ($items->isEmpty()) {
                            $subjectGrades[$quarter] = null;
                            continue;
                        }

                        $grouped = $items->groupBy('type');
                        $subjectCode = $subject['code'];
                        $weights = Grade::getWeights($subjectCode);

                        $percentages = ['WW' => 0.0, 'PT' => 0.0, 'QA' => 0.0];
                        $hasAllTypes = true;

                        foreach (['WW', 'PT', 'QA'] as $type) {
                            $typeItems = $grouped->get($type, collect());
                            if ($typeItems->isEmpty()) {
                                $hasAllTypes = false;
                                continue;
                            }

                            $totalScore = 0;
                            $totalMax = 0;
                            foreach ($typeItems as $item) {
                                $score = $item->scores->first();
                                if ($score) {
                                    $totalScore += $score->score;
                                    $totalMax += $item->max_score;
                                }
                            }

                            $percentages[$type] = $totalMax > 0 ? ($totalScore / $totalMax) * 100 : 0;
                        }

                        if (! $hasAllTypes) {
                            $subjectGrades[$quarter] = null;
                            continue;
                        }

                        $initialGrade = Grade::computeInitialGrade($percentages['WW'], $percentages['PT'], $percentages['QA'], $weights);
                        $subjectGrades[$quarter] = Grade::transmute($initialGrade);
                    }

                    $quarterlyGrades[] = [
                        'subject_code' => $subject['code'],
                        'subject_name' => $subject['name'],
                        'grades' => $subjectGrades,
                    ];
                }
            }

            // Enrollment history
            $enrollmentHistory = [];
            if ($student) {
                $enrollmentHistory = Enrollment::with(['section.yearLevel', 'schoolYear'])
                    ->where('student_id', $student->id)
                    ->orderByDesc('created_at')
                    ->get()
                    ->map(fn ($e) => [
                        'id' => $e->id,
                        'school_year' => $e->schoolYear->name,
                        'year_level' => $e->section->yearLevel?->name,
                        'section' => $e->section->name,
                        'status' => $e->status,
                    ]);
            }

            $data = [
                'studentInfo' => $student ? [
                    'student_id' => $student->student_id,
                    'full_name' => $student->full_name,
                    'gender' => $student->gender,
                    'status' => $student->status,
                ] : null,
                'currentEnrollment' => $currentEnrollment ? [
                    'school_year' => $currentEnrollment->schoolYear->name,
                    'year_level' => $currentEnrollment->section->yearLevel?->name,
                    'section' => $currentEnrollment->section->name,
                    'status' => $currentEnrollment->status,
                ] : null,
                'subjects' => $subjects,
                'attendanceSummary' => [
                    'present' => $attendanceSummary['present'] ?? 0,
                    'absent' => $attendanceSummary['absent'] ?? 0,
                    'late' => $attendanceSummary['late'] ?? 0,
                    'excused' => $attendanceSummary['excused'] ?? 0,
                ],
                'quarterlyGrades' => $quarterlyGrades,
                'enrollmentHistory' => $enrollmentHistory,
            ];
        }

        return Inertia::render("{$user->type}/dashboard", $data);
    }
}
