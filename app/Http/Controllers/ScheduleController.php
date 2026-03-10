<?php

namespace App\Http\Controllers;

use App\Http\Requests\ScheduleRequest;
use App\Models\Schedule;
use App\Models\SchoolYear;
use App\Models\TeacherAssignment;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function index(): Response
    {
        $schedules = Schedule::with(['teacherAssignment.teacher', 'teacherAssignment.section.yearLevel', 'teacherAssignment.subject', 'teacherAssignment.schoolYear'])
            ->latest()
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'teacher_assignment_id' => $s->teacher_assignment_id,
                'day_of_week' => $s->day_of_week,
                'start_time' => substr($s->start_time, 0, 5),
                'end_time' => substr($s->end_time, 0, 5),
                'teacher_name' => $s->teacherAssignment->teacher->full_name,
                'section_name' => $s->teacherAssignment->section->name,
                'year_level_name' => $s->teacherAssignment->section->yearLevel?->name,
                'subject_name' => $s->teacherAssignment->subject->name,
                'subject_code' => $s->teacherAssignment->subject->code,
                'school_year_name' => $s->teacherAssignment->schoolYear->name,
                'created_at' => $s->created_at->toISOString(),
                'updated_at' => $s->updated_at->toISOString(),
            ]);

        // Get teacher assignments for the active school year for the dropdown
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();
        $teacherAssignments = collect();

        if ($activeSchoolYear) {
            $teacherAssignments = TeacherAssignment::with(['teacher', 'section.yearLevel', 'subject'])
                ->where('school_year_id', $activeSchoolYear->id)
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'label' => $a->subject->name . ' — ' . $a->section->name . ' (' . $a->teacher->full_name . ')',
                    'teacher_name' => $a->teacher->full_name,
                    'section_name' => $a->section->name,
                    'subject_name' => $a->subject->name,
                ]);
        }

        return Inertia::render('admin/schedules/index', [
            'schedules' => $schedules,
            'teacherAssignments' => $teacherAssignments,
        ]);
    }

    public function store(ScheduleRequest $request): RedirectResponse
    {
        Schedule::create($request->validated());

        return back()->with('success', 'Schedule created successfully.');
    }

    public function update(ScheduleRequest $request, Schedule $schedule): RedirectResponse
    {
        $schedule->update($request->validated());

        return back()->with('success', 'Schedule updated successfully.');
    }

    public function destroy(Schedule $schedule): RedirectResponse
    {
        $schedule->delete();

        return back()->with('success', 'Schedule deleted successfully.');
    }
}
