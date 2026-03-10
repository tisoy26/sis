<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Schedule;
use App\Models\SchoolYear;
use App\Models\TeacherAssignment;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $student = $user->student;
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        $schedules = collect();
        $sectionName = null;
        $yearLevelName = null;
        $schoolYearName = $activeSchoolYear?->name;

        if ($student && $activeSchoolYear) {
            $enrollment = Enrollment::with('section.yearLevel')
                ->where('student_id', $student->id)
                ->where('school_year_id', $activeSchoolYear->id)
                ->where('status', 'enrolled')
                ->first();

            if ($enrollment) {
                $sectionName = $enrollment->section->name;
                $yearLevelName = $enrollment->section->yearLevel?->name;

                // Get all teacher assignments for this section + school year
                $assignmentIds = TeacherAssignment::where('section_id', $enrollment->section_id)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->pluck('id');

                $schedules = Schedule::with(['teacherAssignment.subject', 'teacherAssignment.teacher'])
                    ->whereIn('teacher_assignment_id', $assignmentIds)
                    ->orderByRaw("FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')")
                    ->orderBy('start_time')
                    ->get()
                    ->map(fn ($s) => [
                        'id' => $s->id,
                        'day_of_week' => $s->day_of_week,
                        'start_time' => substr($s->start_time, 0, 5),
                        'end_time' => substr($s->end_time, 0, 5),
                        'subject_name' => $s->teacherAssignment->subject->name,
                        'subject_code' => $s->teacherAssignment->subject->code,
                        'teacher_name' => $s->teacherAssignment->teacher->full_name,
                    ]);
            }
        }

        return Inertia::render('student/schedule/index', [
            'schedules' => $schedules,
            'sectionName' => $sectionName,
            'yearLevelName' => $yearLevelName,
            'schoolYearName' => $schoolYearName,
        ]);
    }
}
