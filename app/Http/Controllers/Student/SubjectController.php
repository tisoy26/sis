<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Grade;
use App\Models\GradeItem;
use App\Models\GradeScore;
use App\Models\SchoolYear;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function show(Request $request, Subject $subject): Response
    {
        $user = auth()->user();
        $student = $user->student;
        $quarter = (int) $request->get('quarter', 1);
        $quarter = max(1, min(4, $quarter));

        abort_if(! $student, 403);

        $activeSchoolYear = SchoolYear::where('status', 'active')->first();
        abort_if(! $activeSchoolYear, 404, 'No active school year.');

        $enrollment = Enrollment::with('section.yearLevel')
            ->where('student_id', $student->id)
            ->where('school_year_id', $activeSchoolYear->id)
            ->where('status', 'enrolled')
            ->first();

        abort_if(! $enrollment, 404, 'You are not currently enrolled.');

        // Verify subject is assigned to this section
        $assigned = TeacherAssignment::where('section_id', $enrollment->section_id)
            ->where('subject_id', $subject->id)
            ->where('school_year_id', $activeSchoolYear->id)
            ->exists();

        abort_if(! $assigned, 404, 'This subject is not assigned to your section.');

        $weightCategory = Grade::getWeightCategory($subject->code);
        $weights = Grade::getWeights($subject->code);

        // Load grade items for this quarter
        $gradeItems = GradeItem::where('school_year_id', $activeSchoolYear->id)
            ->where('section_id', $enrollment->section_id)
            ->where('subject_id', $subject->id)
            ->where('quarter', $quarter)
            ->orderBy('type')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        // Load student's scores
        $itemIds = $gradeItems->pluck('id');
        $scores = GradeScore::whereIn('grade_item_id', $itemIds)
            ->where('student_id', $student->id)
            ->get()
            ->mapWithKeys(fn ($s) => [$s->grade_item_id => $s->score !== null ? (float) $s->score : null])
            ->toArray();

        // Compute summary per type
        $itemsByType = $gradeItems->groupBy('type');
        $summary = [];
        foreach (['WW', 'PT', 'QA'] as $type) {
            $typeItems = $itemsByType->get($type, collect());
            $totalScore = 0;
            $totalMax = 0;

            foreach ($typeItems as $item) {
                $score = $scores[$item->id] ?? null;
                if ($score !== null) {
                    $totalScore += $score;
                    $totalMax += $item->max_score;
                }
            }

            $percentage = $totalMax > 0 ? ($totalScore / $totalMax) * 100 : null;

            $summary[$type] = [
                'total_score' => round($totalScore, 1),
                'total_max' => round($totalMax, 1),
                'percentage' => $percentage !== null ? round($percentage, 1) : null,
            ];
        }

        // Compute initial + quarterly grade
        $initialGrade = null;
        $quarterlyGrade = null;
        if ($summary['WW']['percentage'] !== null && $summary['PT']['percentage'] !== null && $summary['QA']['percentage'] !== null) {
            $initialGrade = Grade::computeInitialGrade(
                $summary['WW']['percentage'],
                $summary['PT']['percentage'],
                $summary['QA']['percentage'],
                $weights,
            );
            $quarterlyGrade = Grade::transmute($initialGrade);
        }

        return Inertia::render('student/subjects/show', [
            'subject' => [
                'id' => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
            ],
            'section' => [
                'name' => $enrollment->section->name,
                'year_level' => $enrollment->section->yearLevel?->name,
            ],
            'quarter' => $quarter,
            'gradeItems' => $gradeItems->map(fn ($item) => [
                'id' => $item->id,
                'type' => $item->type,
                'name' => $item->name,
                'max_score' => (float) $item->max_score,
            ]),
            'scores' => (object) $scores,
            'summary' => $summary,
            'weights' => $weights,
            'weightCategory' => $weightCategory,
            'initialGrade' => $initialGrade !== null ? round($initialGrade, 2) : null,
            'quarterlyGrade' => $quarterlyGrade,
            'activeSchoolYear' => $activeSchoolYear->name,
        ]);
    }
}
