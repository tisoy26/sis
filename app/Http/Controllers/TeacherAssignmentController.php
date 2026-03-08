<?php

namespace App\Http\Controllers;

use App\Http\Requests\TeacherAssignmentRequest;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TeacherAssignmentController extends Controller
{
    public function index(): Response
    {
        $assignments = TeacherAssignment::with(['schoolYear', 'teacher', 'section', 'subject'])
            ->latest()
            ->get()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'school_year_id' => $a->school_year_id,
                    'teacher_id' => $a->teacher_id,
                    'section_id' => $a->section_id,
                    'subject_id' => $a->subject_id,
                    'school_year_name' => $a->schoolYear->name,
                    'teacher_name' => $a->teacher->full_name,
                    'section_name' => $a->section->name,
                    'subject_name' => $a->subject->name,
                    'subject_code' => $a->subject->code,
                    'created_at' => $a->created_at,
                    'updated_at' => $a->updated_at,
                ];
            });

        $schoolYears = SchoolYear::where('status', 'active')->orderBy('name')->get(['id', 'name']);
        $teachers = User::where('type', 'teacher')->orderBy('first_name')->get(['id', 'first_name', 'last_name']);
        $sections = Section::with('yearLevel')->where('status', 'active')->orderBy('name')->get();
        $subjects = Subject::where('status', 'active')->orderBy('name')->get(['id', 'code', 'name']);

        return Inertia::render('admin/teacher-assignments/index', [
            'assignments' => $assignments,
            'schoolYears' => $schoolYears,
            'teachers' => $teachers->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->full_name,
            ]),
            'sections' => $sections->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'year_level_name' => $s->yearLevel?->name,
            ]),
            'subjects' => $subjects,
        ]);
    }

    public function store(TeacherAssignmentRequest $request): RedirectResponse
    {
        TeacherAssignment::create($request->validated());

        return back()->with('success', 'Assignment created successfully.');
    }

    public function update(TeacherAssignmentRequest $request, TeacherAssignment $teacherAssignment): RedirectResponse
    {
        $teacherAssignment->update($request->validated());

        return back()->with('success', 'Assignment updated successfully.');
    }

    public function destroy(TeacherAssignment $teacherAssignment): RedirectResponse
    {
        $teacherAssignment->delete();

        return back()->with('success', 'Assignment deleted successfully.');
    }
}
