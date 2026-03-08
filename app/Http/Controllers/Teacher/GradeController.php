<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\GradeItem;
use App\Models\GradeScore;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class GradeController extends Controller
{
    /**
     * Index: student list with grade summary per student.
     */
    public function index(Request $request): Response
    {
        $teacher = Auth::user();
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        $sections = collect();
        $subjects = collect();
        $studentSummaries = [];
        $weights = null;
        $weightCategory = 'default';
        $selectedSectionId = $request->get('section_id');
        $selectedSubjectId = $request->get('subject_id');
        $selectedQuarter = (int) $request->get('quarter', 1);

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

            if ($selectedSectionId) {
                $sectionAssignments = $assignments->where('section_id', (int) $selectedSectionId);

                $subjects = $sectionAssignments->map(fn ($a) => [
                    'id' => $a->subject->id,
                    'code' => $a->subject->code,
                    'name' => $a->subject->name,
                ])->values();

                if (! $selectedSubjectId && $subjects->isNotEmpty()) {
                    $selectedSubjectId = $subjects->first()['id'];
                }

                $isAssigned = $sectionAssignments->where('subject_id', (int) $selectedSubjectId)->isNotEmpty();

                if ($selectedSubjectId && $isAssigned) {
                    $subject = Subject::find($selectedSubjectId);
                    $weightCategory = Grade::getWeightCategory($subject->code);
                    $weights = Grade::getWeights($subject->code);

                    // Get enrolled students
                    $enrollments = Enrollment::with('student')
                        ->where('section_id', $selectedSectionId)
                        ->where('school_year_id', $activeSchoolYear->id)
                        ->where('status', 'enrolled')
                        ->get();

                    $students = $enrollments->map(fn ($e) => $e->student)->sortBy('full_name')->values();

                    // Load grade items
                    $gradeItems = GradeItem::where('school_year_id', $activeSchoolYear->id)
                        ->where('section_id', $selectedSectionId)
                        ->where('subject_id', $selectedSubjectId)
                        ->where('quarter', $selectedQuarter)
                        ->get();

                    // Load all scores
                    $itemIds = $gradeItems->pluck('id');
                    $allScores = GradeScore::whereIn('grade_item_id', $itemIds)->get()->groupBy('student_id');

                    // Group items by type and compute HPS totals
                    $itemsByType = $gradeItems->groupBy('type');
                    $hpsByType = [
                        'WW' => $itemsByType->get('WW', collect())->sum('max_score'),
                        'PT' => $itemsByType->get('PT', collect())->sum('max_score'),
                        'QA' => $itemsByType->get('QA', collect())->sum('max_score'),
                    ];

                    // Build per-student summaries
                    $studentSummaries = $students->map(function ($student) use ($allScores, $gradeItems, $hpsByType, $weights) {
                        $studentScores = $allScores->get($student->id, collect());
                        $scoreMap = $studentScores->keyBy('grade_item_id');

                        // Sum scores per type
                        $scoreTotals = ['WW' => 0, 'PT' => 0, 'QA' => 0];
                        foreach ($gradeItems as $item) {
                            $s = $scoreMap->get($item->id);
                            if ($s && $s->score !== null) {
                                $scoreTotals[$item->type] += (float) $s->score;
                            }
                        }

                        // Compute percentages
                        $wwPercent = $hpsByType['WW'] > 0 ? ($scoreTotals['WW'] / $hpsByType['WW']) * 100 : null;
                        $ptPercent = $hpsByType['PT'] > 0 ? ($scoreTotals['PT'] / $hpsByType['PT']) * 100 : null;
                        $qaPercent = $hpsByType['QA'] > 0 ? ($scoreTotals['QA'] / $hpsByType['QA']) * 100 : null;

                        // Compute initial + quarterly grade
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
                            'initial_grade' => $initialGrade,
                            'quarterly_grade' => $quarterlyGrade,
                        ];
                    })->values()->toArray();
                }
            }
        }

        return Inertia::render('teacher/grades/index', [
            'sections' => $sections,
            'subjects' => $subjects,
            'students' => $studentSummaries,
            'weights' => $weights,
            'weightCategory' => $weightCategory,
            'selectedSectionId' => $selectedSectionId ? (int) $selectedSectionId : null,
            'selectedSubjectId' => $selectedSubjectId ? (int) $selectedSubjectId : null,
            'selectedQuarter' => $selectedQuarter,
            'activeSchoolYear' => $activeSchoolYear?->name,
        ]);
    }

    /**
     * Show: per-student grade management with tabs (WW/PT/QA/Summary).
     */
    public function show(Request $request, Student $student): Response
    {
        $teacher = Auth::user();
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        $sectionId = (int) $request->get('section_id');
        $subjectId = (int) $request->get('subject_id');
        $quarter = (int) $request->get('quarter', 1);

        if (! $activeSchoolYear) {
            abort(404, 'No active school year.');
        }

        $this->authorizeAssignment($teacher, $activeSchoolYear, $sectionId, $subjectId);

        // Verify student is enrolled
        $enrolled = Enrollment::where('student_id', $student->id)
            ->where('section_id', $sectionId)
            ->where('school_year_id', $activeSchoolYear->id)
            ->where('status', 'enrolled')
            ->exists();

        if (! $enrolled) {
            abort(404, 'Student is not enrolled in this section.');
        }

        $subject = Subject::findOrFail($subjectId);
        $section = \App\Models\Section::with('yearLevel')->findOrFail($sectionId);
        $weightCategory = Grade::getWeightCategory($subject->code);
        $weights = Grade::getWeights($subject->code);

        // Load grade items
        $gradeItems = GradeItem::where('school_year_id', $activeSchoolYear->id)
            ->where('section_id', $sectionId)
            ->where('subject_id', $subjectId)
            ->where('quarter', $quarter)
            ->orderBy('type')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'type' => $item->type,
                'name' => $item->name,
                'max_score' => (float) $item->max_score,
                'sort_order' => $item->sort_order,
            ]);

        // Load this student's scores
        $itemIds = $gradeItems->pluck('id');
        $studentScores = GradeScore::whereIn('grade_item_id', $itemIds)
            ->where('student_id', $student->id)
            ->get()
            ->mapWithKeys(fn ($s) => [$s->grade_item_id => $s->score !== null ? (float) $s->score : null])
            ->toArray();

        return Inertia::render('teacher/grades/show', [
            'student' => [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'full_name' => $student->full_name,
                'gender' => $student->gender,
            ],
            'section' => [
                'id' => $section->id,
                'name' => $section->name,
                'year_level_name' => $section->yearLevel?->name ?? '—',
            ],
            'subject' => [
                'id' => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
            ],
            'quarter' => $quarter,
            'gradeItems' => $gradeItems,
            'scores' => (object) $studentScores,
            'weights' => $weights,
            'weightCategory' => $weightCategory,
            'activeSchoolYear' => $activeSchoolYear->name,
        ]);
    }

    /**
     * Create a new grade item (score column).
     */
    public function storeItem(Request $request): RedirectResponse
    {
        $request->validate([
            'section_id' => 'required|exists:sections,id',
            'subject_id' => 'required|exists:subjects,id',
            'quarter' => 'required|integer|min:1|max:4',
            'type' => 'required|in:WW,PT,QA',
            'name' => 'required|string|max:100',
            'max_score' => 'required|numeric|min:1|max:99999',
        ]);

        $teacher = Auth::user();
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        if (! $activeSchoolYear) {
            return back()->with('error', 'No active school year.');
        }

        $this->authorizeAssignment($teacher, $activeSchoolYear, $request->section_id, $request->subject_id);

        // Determine sort order
        $maxSort = GradeItem::where('school_year_id', $activeSchoolYear->id)
            ->where('section_id', $request->section_id)
            ->where('subject_id', $request->subject_id)
            ->where('quarter', $request->quarter)
            ->where('type', $request->type)
            ->max('sort_order') ?? 0;

        GradeItem::create([
            'school_year_id' => $activeSchoolYear->id,
            'section_id' => $request->section_id,
            'subject_id' => $request->subject_id,
            'teacher_id' => $teacher->id,
            'quarter' => $request->quarter,
            'type' => $request->type,
            'name' => $request->name,
            'max_score' => $request->max_score,
            'sort_order' => $maxSort + 1,
        ]);

        return back()->with('success', "Score item \"{$request->name}\" added.");
    }

    /**
     * Update an existing grade item.
     */
    public function updateItem(Request $request, GradeItem $item): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'max_score' => 'required|numeric|min:1|max:99999',
        ]);

        $teacher = Auth::user();

        if ((int) $item->teacher_id !== (int) $teacher->id) {
            abort(403, 'You are not the owner of this grade item.');
        }

        $item->update([
            'name' => $request->name,
            'max_score' => $request->max_score,
        ]);

        return back()->with('success', "Score item \"{$request->name}\" updated.");
    }

    /**
     * Delete a grade item and all its scores.
     */
    public function destroyItem(GradeItem $item): RedirectResponse
    {
        $teacher = Auth::user();

        if ((int) $item->teacher_id !== (int) $teacher->id) {
            abort(403, 'You are not the owner of this grade item.');
        }

        $name = $item->name;
        $item->delete(); // cascade deletes scores

        return back()->with('success', "Score item \"{$name}\" deleted.");
    }

    /**
     * Bulk save scores for all students across all items.
     */
    public function storeScores(Request $request): RedirectResponse
    {
        $request->validate([
            'section_id' => 'required|exists:sections,id',
            'subject_id' => 'required|exists:subjects,id',
            'quarter' => 'required|integer|min:1|max:4',
            'scores' => 'required|array',
            'scores.*' => 'array',
            'scores.*.*' => 'nullable|numeric|min:0',
        ]);

        $teacher = Auth::user();
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        if (! $activeSchoolYear) {
            return back()->with('error', 'No active school year.');
        }

        $this->authorizeAssignment($teacher, $activeSchoolYear, $request->section_id, $request->subject_id);

        // Get valid item IDs for this context
        $validItemIds = GradeItem::where('school_year_id', $activeSchoolYear->id)
            ->where('section_id', $request->section_id)
            ->where('subject_id', $request->subject_id)
            ->where('quarter', $request->quarter)
            ->pluck('id')
            ->toArray();

        // scores format: { studentId: { itemId: score } }
        foreach ($request->scores as $studentId => $itemScores) {
            foreach ($itemScores as $itemId => $score) {
                if (! in_array((int) $itemId, $validItemIds)) {
                    continue;
                }

                GradeScore::updateOrCreate(
                    [
                        'grade_item_id' => $itemId,
                        'student_id' => $studentId,
                    ],
                    [
                        'score' => $score !== null && $score !== '' ? (float) $score : null,
                    ]
                );
            }
        }

        return back()->with('success', 'Scores saved successfully.');
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
