<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
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
use App\Services\Pdf\SectionReportPdf;
use App\Services\Pdf\StudentReportPdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Report index: filter options for generating reports.
     */
    public function index(Request $request): Response
    {
        $teacher = Auth::user();
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        $sections = collect();
        $subjects = collect();
        $students = collect();

        if ($activeSchoolYear) {
            $assignments = TeacherAssignment::where('teacher_id', $teacher->id)
                ->where('school_year_id', $activeSchoolYear->id)
                ->with(['section.yearLevel', 'subject'])
                ->get();

            $sections = $assignments->groupBy('section_id')->map(function ($group) {
                $section = $group->first()->section;

                return [
                    'id' => $section->id,
                    'name' => $section->name,
                    'year_level_name' => $section->yearLevel?->name ?? '—',
                ];
            })->values();

            $selectedSectionId = $request->get('section_id');

            if ($selectedSectionId) {
                $sectionAssignments = $assignments->where('section_id', (int) $selectedSectionId);

                $subjects = $sectionAssignments->map(fn ($a) => [
                    'id' => $a->subject->id,
                    'code' => $a->subject->code,
                    'name' => $a->subject->name,
                ])->values();

                // Get enrolled students for this section
                $enrollments = Enrollment::with('student')
                    ->where('section_id', $selectedSectionId)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->where('status', 'enrolled')
                    ->get();

                $students = $enrollments->map(fn ($e) => [
                    'id' => $e->student->id,
                    'student_id' => $e->student->student_id,
                    'full_name' => $e->student->full_name,
                ])->sortBy('full_name')->values();
            }
        }

        return Inertia::render('teacher/reports/index', [
            'sections' => $sections,
            'subjects' => $subjects,
            'students' => $students,
            'activeSchoolYear' => $activeSchoolYear?->name,
            'selectedSectionId' => $selectedSectionId ? (int) $selectedSectionId : null,
        ]);
    }

    /**
     * Section report: class roster with grades summary (PDF).
     */
    public function sectionReport(Request $request): HttpResponse
    {
        $request->validate([
            'section_id' => 'required|exists:sections,id',
            'subject_id' => 'required|exists:subjects,id',
            'quarter' => 'required|integer|min:1|max:4',
        ]);

        $teacher = Auth::user();
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        if (! $activeSchoolYear) {
            abort(404, 'No active school year.');
        }

        $sectionId = (int) $request->section_id;
        $subjectId = (int) $request->subject_id;
        $quarter = (int) $request->quarter;

        $this->authorizeAssignment($teacher, $activeSchoolYear, $sectionId, $subjectId);

        $section = Section::with('yearLevel')->findOrFail($sectionId);
        $subject = Subject::findOrFail($subjectId);
        $weightCategory = Grade::getWeightCategory($subject->code);
        $weights = Grade::getWeights($subject->code);

        // Get enrolled students
        $enrollments = Enrollment::with('student')
            ->where('section_id', $sectionId)
            ->where('school_year_id', $activeSchoolYear->id)
            ->where('status', 'enrolled')
            ->get();

        $students = $enrollments->map(fn ($e) => $e->student)->sortBy('full_name')->values();

        // Load grade items for this quarter
        $gradeItems = GradeItem::where('school_year_id', $activeSchoolYear->id)
            ->where('section_id', $sectionId)
            ->where('subject_id', $subjectId)
            ->where('quarter', $quarter)
            ->get();

        $itemIds = $gradeItems->pluck('id');
        $allScores = GradeScore::whereIn('grade_item_id', $itemIds)->get()->groupBy('student_id');

        $itemsByType = $gradeItems->groupBy('type');
        $hpsByType = [
            'WW' => $itemsByType->get('WW', collect())->sum('max_score'),
            'PT' => $itemsByType->get('PT', collect())->sum('max_score'),
            'QA' => $itemsByType->get('QA', collect())->sum('max_score'),
        ];

        $studentData = $students->map(function ($student) use ($allScores, $gradeItems, $hpsByType, $weights) {
            $studentScores = $allScores->get($student->id, collect());
            $scoreMap = $studentScores->keyBy('grade_item_id');

            $scoreTotals = ['WW' => 0, 'PT' => 0, 'QA' => 0];
            foreach ($gradeItems as $item) {
                $s = $scoreMap->get($item->id);
                if ($s && $s->score !== null) {
                    $scoreTotals[$item->type] += (float) $s->score;
                }
            }

            $wwPercent = $hpsByType['WW'] > 0 ? ($scoreTotals['WW'] / $hpsByType['WW']) * 100 : null;
            $ptPercent = $hpsByType['PT'] > 0 ? ($scoreTotals['PT'] / $hpsByType['PT']) * 100 : null;
            $qaPercent = $hpsByType['QA'] > 0 ? ($scoreTotals['QA'] / $hpsByType['QA']) * 100 : null;

            $initialGrade = null;
            $quarterlyGrade = null;
            if ($wwPercent !== null && $ptPercent !== null && $qaPercent !== null && $weights) {
                $initialGrade = Grade::computeInitialGrade($wwPercent, $ptPercent, $qaPercent, $weights);
                $quarterlyGrade = Grade::transmute($initialGrade);
            }

            return [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'full_name' => $student->full_name,
                'gender' => $student->gender,
                'ww_percent' => $wwPercent !== null ? round($wwPercent, 1) : null,
                'pt_percent' => $ptPercent !== null ? round($ptPercent, 1) : null,
                'qa_percent' => $qaPercent !== null ? round($qaPercent, 1) : null,
                'initial_grade' => $initialGrade !== null ? round($initialGrade, 2) : null,
                'quarterly_grade' => $quarterlyGrade,
            ];
        })->values();

        $pdfData = [
            'section' => [
                'id' => $section->id,
                'name' => $section->name,
                'year_level_name' => $section->yearLevel?->name ?? '---',
            ],
            'subject' => [
                'id' => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
            ],
            'quarter' => $quarter,
            'weights' => $weights,
            'weightCategory' => $weightCategory,
            'students' => $studentData->toArray(),
            'teacher' => $teacher->full_name,
            'activeSchoolYear' => $activeSchoolYear->name,
        ];

        $pdf = new SectionReportPdf();
        $content = $pdf->generate($pdfData);

        $filename = 'Section_Report_' . str_replace(' ', '_', $section->name) . '_Q' . $quarter . '.pdf';

        return new HttpResponse($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ]);
    }

    /**
     * Individual student report: info, attendance, grades with optional detail (PDF).
     */
    public function studentReport(Request $request): HttpResponse
    {
        $request->validate([
            'section_id' => 'required|exists:sections,id',
            'student_id' => 'required|exists:students,id',
            'include_detailed' => 'sometimes|boolean',
        ]);

        $teacher = Auth::user();
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        if (! $activeSchoolYear) {
            abort(404, 'No active school year.');
        }

        $sectionId = (int) $request->section_id;
        $studentId = (int) $request->student_id;
        $includeDetailed = (bool) $request->get('include_detailed', false);

        $section = Section::with('yearLevel')->findOrFail($sectionId);
        $student = Student::findOrFail($studentId);

        // Verify enrollment
        $enrollment = Enrollment::where('student_id', $studentId)
            ->where('section_id', $sectionId)
            ->where('school_year_id', $activeSchoolYear->id)
            ->first();

        if (! $enrollment) {
            abort(404, 'Student is not enrolled in this section.');
        }

        // Verify teacher is assigned to this section
        $assignments = TeacherAssignment::with('subject')
            ->where('teacher_id', $teacher->id)
            ->where('section_id', $sectionId)
            ->where('school_year_id', $activeSchoolYear->id)
            ->get();

        if ($assignments->isEmpty()) {
            abort(403, 'You are not assigned to this section.');
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
            'status' => $enrollment->status,
            'enrolled_at' => $enrollment->enrolled_at?->toDateString(),
        ];

        // --- Attendance ---
        $attendanceRecords = Attendance::with('subject')
            ->where('student_id', $studentId)
            ->where('section_id', $sectionId)
            ->where('school_year_id', $activeSchoolYear->id)
            ->orderBy('date', 'desc')
            ->get();

        $attendanceSummary = [
            'total_days' => $attendanceRecords->count(),
            'present' => $attendanceRecords->where('status', 'present')->count(),
            'absent' => $attendanceRecords->where('status', 'absent')->count(),
            'late' => $attendanceRecords->where('status', 'late')->count(),
            'excused' => $attendanceRecords->where('status', 'excused')->count(),
        ];

        // --- Grades per Subject ---
        $subjectGrades = $assignments->map(function ($assignment) use ($student, $activeSchoolYear, $sectionId, $includeDetailed) {
            $subject = $assignment->subject;
            $weightCategory = Grade::getWeightCategory($subject->code);
            $weights = Grade::getWeights($subject->code);

            $quarterlyGrades = [];
            $detailedScores = [];

            for ($q = 1; $q <= 4; $q++) {
                $gradeItems = GradeItem::where('school_year_id', $activeSchoolYear->id)
                    ->where('section_id', $sectionId)
                    ->where('subject_id', $subject->id)
                    ->where('quarter', $q)
                    ->orderBy('type')
                    ->orderBy('sort_order')
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

                // Detailed scores per item for this quarter
                if ($includeDetailed) {
                    $detailedScores[$q] = [
                        'ww_percent' => $wwPercent !== null ? round($wwPercent, 1) : null,
                        'pt_percent' => $ptPercent !== null ? round($ptPercent, 1) : null,
                        'qa_percent' => $qaPercent !== null ? round($qaPercent, 1) : null,
                        'items' => $gradeItems->map(function ($item) use ($scores) {
                            $s = $scores->get($item->id);

                            return [
                                'type' => $item->type,
                                'name' => $item->name,
                                'max_score' => (float) $item->max_score,
                                'score' => $s && $s->score !== null ? (float) $s->score : null,
                            ];
                        })->values(),
                    ];
                }
            }

            $gradedQuarters = collect($quarterlyGrades)->filter(fn ($g) => $g !== null);
            $finalGrade = $gradedQuarters->isNotEmpty() ? round($gradedQuarters->avg()) : null;

            $result = [
                'subject_id' => $subject->id,
                'subject_code' => $subject->code,
                'subject_name' => $subject->name,
                'weight_category' => $weightCategory,
                'weights' => $weights,
                'q1' => $quarterlyGrades[1],
                'q2' => $quarterlyGrades[2],
                'q3' => $quarterlyGrades[3],
                'q4' => $quarterlyGrades[4],
                'final_grade' => $finalGrade,
            ];

            if ($includeDetailed) {
                $result['detailed'] = $detailedScores;
            }

            return $result;
        })->values();

        $pdfData = [
            'student' => $studentInfo,
            'section' => [
                'id' => $section->id,
                'name' => $section->name,
                'year_level_name' => $section->yearLevel?->name ?? '---',
            ],
            'activeSchoolYear' => $activeSchoolYear->name,
            'teacher' => $teacher->full_name,
            'attendanceSummary' => $attendanceSummary,
            'subjectGrades' => $subjectGrades->toArray(),
            'includeDetailed' => $includeDetailed,
        ];

        $pdf = new StudentReportPdf();
        $content = $pdf->generate($pdfData);

        $filename = 'Student_Report_' . str_replace(' ', '_', $student->full_name) . '.pdf';

        return new HttpResponse($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ]);
    }

    private function authorizeAssignment($teacher, $activeSchoolYear, $sectionId, $subjectId): void
    {
        $isAssigned = TeacherAssignment::where('teacher_id', $teacher->id)
            ->where('school_year_id', $activeSchoolYear->id)
            ->where('section_id', $sectionId)
            ->where('subject_id', $subjectId)
            ->exists();

        if (! $isAssigned) {
            abort(403, 'You are not assigned to this section and subject.');
        }
    }
}
