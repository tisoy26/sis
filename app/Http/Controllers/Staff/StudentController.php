<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\StudentRequest;
use App\Models\Enrollment;
use App\Models\Grade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\GradeItem;
use App\Models\GradeScore;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\TeacherAssignment;
use App\Services\Pdf\StudentGradesPdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('staff/students/index', [
            'students' => Student::with(['address', 'guardian', 'documents'])->latest()->get(),
        ]);
    }

    /**
     * Search students by name or student ID (for AJAX combobox).
     */
    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q'));

        if (mb_strlen($q) < 2) {
            return response()->json([]);
        }

        $students = Student::query()
            ->with(['enrollments' => function ($eq) {
                $eq->whereHas('schoolYear', fn ($sy) => $sy->where('status', 'active'))
                    ->with(['section', 'section.yearLevel'])
                    ->limit(1);
            }])
            ->where(function ($query) use ($q) {
                $query->where('student_id', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%")
                    ->orWhere('first_name', 'like', "%{$q}%")
                    ->orWhere('middle_name', 'like', "%{$q}%")
                    ->orWhereRaw("CONCAT(last_name, ', ', first_name) LIKE ?", ["%{$q}%"])
                    ->orWhereRaw("CONCAT(last_name, ', ', first_name, ' ', COALESCE(middle_name, '')) LIKE ?", ["%{$q}%"])
                    ->orWhereRaw("CONCAT(last_name, ' ', first_name) LIKE ?", ["%{$q}%"])
                    ->orWhereRaw("CONCAT(last_name, ' ', first_name, ' ', COALESCE(middle_name, '')) LIKE ?", ["%{$q}%"])
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$q}%"])
                    ->orWhereRaw("CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) LIKE ?", ["%{$q}%"]);
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->limit(20)
            ->get()
            ->map(function ($s) {
                $enrollment = $s->enrollments->first();
                $section = $enrollment?->section;
                $yearLevel = $section?->yearLevel;
                $subtitle = collect([
                    $yearLevel?->name,
                    $section?->name,
                ])->filter()->implode(' — ');

                return [
                    'value' => (string) $s->id,
                    'label' => $s->student_id . ' — ' . $s->full_name,
                    'subtitle' => $subtitle ?: null,
                ];
            });

        return response()->json($students);
    }

    public function show(Student $student): Response
    {
        $student->load(['address', 'guardian', 'documents']);

        $activeSchoolYear = SchoolYear::where('status', 'active')->first();
        $gradesData = [];

        if ($activeSchoolYear) {
            // Get student's enrollment for the active SY
            $enrollment = Enrollment::with('section.yearLevel')
                ->where('student_id', $student->id)
                ->where('school_year_id', $activeSchoolYear->id)
                ->first();

            if ($enrollment) {
                // Get all subjects assigned to this section
                $assignments = TeacherAssignment::with(['subject', 'teacher'])
                    ->where('section_id', $enrollment->section_id)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->get();

                $gradesData = $assignments->map(function ($assignment) use ($student, $activeSchoolYear, $enrollment) {
                    $subject = $assignment->subject;
                    $weights = Grade::getWeights($subject->code);

                    $quarterlyGrades = [];
                    for ($q = 1; $q <= 4; $q++) {
                        $gradeItems = GradeItem::where('school_year_id', $activeSchoolYear->id)
                            ->where('section_id', $enrollment->section_id)
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

                    $gradedQuarters = collect($quarterlyGrades)->filter(fn ($g) => $g !== null);
                    $finalGrade = $gradedQuarters->isNotEmpty() ? round($gradedQuarters->avg()) : null;

                    return [
                        'subject_code' => $subject->code,
                        'subject_name' => $subject->name,
                        'teacher' => $assignment->teacher?->full_name ?? '---',
                        'q1' => $quarterlyGrades[1],
                        'q2' => $quarterlyGrades[2],
                        'q3' => $quarterlyGrades[3],
                        'q4' => $quarterlyGrades[4],
                        'final_grade' => $finalGrade,
                    ];
                })->values()->toArray();
            }
        }

        return Inertia::render('staff/students/show', [
            'student' => $student,
            'activeSchoolYear' => $activeSchoolYear?->name,
            'enrollment' => $activeSchoolYear && isset($enrollment) && $enrollment ? [
                'section_name' => $enrollment->section?->name,
                'year_level_name' => $enrollment->section?->yearLevel?->name ?? $enrollment->yearLevel?->name ?? '---',
                'status' => $enrollment->status,
            ] : null,
            'subjectGrades' => $gradesData,
        ]);
    }

    private const ADDRESS_FIELDS = [
        'region_code', 'region_name', 'province_code', 'province_name',
        'city_code', 'city_name', 'barangay_code', 'barangay_name',
        'street', 'zip_code',
    ];

    private const GUARDIAN_FIELDS = [
        'father_first_name', 'father_middle_name', 'father_last_name',
        'father_contact', 'father_occupation',
        'mother_first_name', 'mother_middle_name', 'mother_last_name',
        'mother_contact', 'mother_occupation',
        'guardian_first_name', 'guardian_middle_name', 'guardian_last_name',
        'guardian_contact', 'guardian_relationship',
    ];

    private const DOCUMENT_FIELDS = [
        'birth_certificate', 'report_card', 'good_moral', 'school_card',
        'id_photos', 'medical_certificate',
        'not_yet_available',
    ];

    public function store(StudentRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $student = Student::create($request->safe()->except(
                array_merge(self::ADDRESS_FIELDS, self::GUARDIAN_FIELDS, self::DOCUMENT_FIELDS)
            ));

            $student->address()->create($request->safe()->only(self::ADDRESS_FIELDS));
            $student->guardian()->create($request->safe()->only(self::GUARDIAN_FIELDS));
            $student->documents()->create($request->safe()->only(self::DOCUMENT_FIELDS));
        });

        return back()->with('success', 'Student added successfully.');
    }

    public function update(StudentRequest $request, Student $student): RedirectResponse
    {
        DB::transaction(function () use ($request, $student) {
            $student->update($request->safe()->except(
                array_merge(self::ADDRESS_FIELDS, self::GUARDIAN_FIELDS, self::DOCUMENT_FIELDS)
            ));

            $student->address()->updateOrCreate(
                ['student_id' => $student->id],
                $request->safe()->only(self::ADDRESS_FIELDS)
            );

            $student->guardian()->updateOrCreate(
                ['student_id' => $student->id],
                $request->safe()->only(self::GUARDIAN_FIELDS)
            );

            $student->documents()->updateOrCreate(
                ['student_id' => $student->id],
                $request->safe()->only(self::DOCUMENT_FIELDS)
            );
        });

        return back()->with('success', 'Student updated successfully.');
    }

    public function destroy(Student $student): RedirectResponse
    {
        if ($student->enrollments()->exists()) {
            return back()->with('error', 'Cannot delete student with existing enrollments.');
        }

        $student->delete();

        return back()->with('success', 'Student deleted successfully.');
    }

    public function exportGrades(Student $student): HttpResponse
    {
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        if (! $activeSchoolYear) {
            abort(404, 'No active school year.');
        }

        $enrollment = Enrollment::with('section.yearLevel')
            ->where('student_id', $student->id)
            ->where('school_year_id', $activeSchoolYear->id)
            ->first();

        if (! $enrollment) {
            abort(404, 'Student is not enrolled in the active school year.');
        }

        $assignments = TeacherAssignment::with(['subject', 'teacher'])
            ->where('section_id', $enrollment->section_id)
            ->where('school_year_id', $activeSchoolYear->id)
            ->get();

        $gradesData = $assignments->map(function ($assignment) use ($student, $activeSchoolYear, $enrollment) {
            $subject = $assignment->subject;
            $weights = Grade::getWeights($subject->code);

            $quarterlyGrades = [];
            for ($q = 1; $q <= 4; $q++) {
                $gradeItems = GradeItem::where('school_year_id', $activeSchoolYear->id)
                    ->where('section_id', $enrollment->section_id)
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

            $gradedQuarters = collect($quarterlyGrades)->filter(fn ($g) => $g !== null);
            $finalGrade = $gradedQuarters->isNotEmpty() ? round($gradedQuarters->avg()) : null;

            return [
                'subject_code' => $subject->code,
                'subject_name' => $subject->name,
                'teacher' => $assignment->teacher?->full_name ?? '---',
                'q1' => $quarterlyGrades[1],
                'q2' => $quarterlyGrades[2],
                'q3' => $quarterlyGrades[3],
                'q4' => $quarterlyGrades[4],
                'final_grade' => $finalGrade,
            ];
        })->values()->toArray();

        $pdf = new StudentGradesPdf();
        $content = $pdf->generate([
            'activeSchoolYear' => $activeSchoolYear->name,
            'student_id' => $student->student_id,
            'student_name' => $student->full_name,
            'section_name' => $enrollment->section?->name ?? '---',
            'year_level_name' => $enrollment->section?->yearLevel?->name ?? '---',
            'subjectGrades' => $gradesData,
        ]);

        $filename = 'Grades_' . str_replace(' ', '_', $student->full_name) . '.pdf';

        return new HttpResponse($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ]);
    }
}
