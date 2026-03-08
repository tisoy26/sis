<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Enrollment;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\TeacherAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    /**
     * Show attendance page: section selector + date picker + student list with status.
     */
    public function index(Request $request): Response
    {
        $teacher = Auth::user();
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        $sections = collect();
        $students = collect();
        $attendanceRecords = [];
        $selectedDate = $request->get('date', now()->toDateString());
        $selectedSectionId = $request->get('section_id');

        if ($activeSchoolYear) {
            // Get teacher's assigned sections
            $sectionIds = TeacherAssignment::where('teacher_id', $teacher->id)
                ->where('school_year_id', $activeSchoolYear->id)
                ->pluck('section_id')
                ->unique();

            $sections = Section::with('yearLevel')
                ->whereIn('id', $sectionIds)
                ->orderBy('name')
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'year_level_name' => $s->yearLevel?->name ?? '—',
                ]);

            // If a section is selected, load students and their attendance
            if ($selectedSectionId && $sectionIds->contains($selectedSectionId)) {
                $enrollments = Enrollment::with('student')
                    ->where('section_id', $selectedSectionId)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->where('status', 'enrolled')
                    ->get();

                $students = $enrollments->map(fn ($e) => [
                    'id' => $e->student->id,
                    'student_id' => $e->student->student_id,
                    'full_name' => $e->student->full_name,
                    'gender' => $e->student->gender,
                ])->sortBy('full_name')->values();

                // Load existing attendance for the selected date
                $existing = Attendance::where('section_id', $selectedSectionId)
                    ->where('school_year_id', $activeSchoolYear->id)
                    ->where('date', $selectedDate)
                    ->get()
                    ->keyBy('student_id');

                $attendanceRecords = $students->map(function ($student) use ($existing) {
                    $record = $existing->get($student['id']);

                    return [
                        'student_id' => $student['id'],
                        'status' => $record?->status ?? 'present',
                        'remarks' => $record?->remarks ?? '',
                        'saved' => $record !== null,
                    ];
                })->keyBy('student_id')->toArray();
            }
        }

        // Attendance summary for the selected section & month
        $monthlySummary = [];
        $datesWithAttendance = [];
        if ($selectedSectionId && $activeSchoolYear) {
            $monthStart = date('Y-m-01', strtotime($selectedDate));
            $monthEnd = date('Y-m-t', strtotime($selectedDate));

            $monthlySummary = Attendance::where('section_id', $selectedSectionId)
                ->where('school_year_id', $activeSchoolYear->id)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            // Get distinct dates that have attendance records this month
            $datesWithAttendance = Attendance::where('section_id', $selectedSectionId)
                ->where('school_year_id', $activeSchoolYear->id)
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->distinct()
                ->pluck('date')
                ->map(fn ($d) => \Carbon\Carbon::parse($d)->toDateString())
                ->values()
                ->toArray();
        }

        return Inertia::render('teacher/attendance/index', [
            'sections' => $sections,
            'students' => $students,
            'attendanceRecords' => $attendanceRecords,
            'selectedSectionId' => $selectedSectionId ? (int) $selectedSectionId : null,
            'selectedDate' => $selectedDate,
            'activeSchoolYear' => $activeSchoolYear?->name,
            'monthlySummary' => $monthlySummary,
            'datesWithAttendance' => $datesWithAttendance,
        ]);
    }

    /**
     * Save attendance for all students in a section for a given date.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'section_id' => 'required|exists:sections,id',
            'date' => 'required|date',
            'attendance' => 'required|array',
            'attendance.*.student_id' => 'required|exists:students,id',
            'attendance.*.status' => 'required|in:present,absent,late,excused',
            'attendance.*.remarks' => 'nullable|string|max:255',
        ]);

        $teacher = Auth::user();
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        if (! $activeSchoolYear) {
            return back()->with('error', 'No active school year.');
        }

        // Verify teacher is assigned to this section
        $isAssigned = TeacherAssignment::where('teacher_id', $teacher->id)
            ->where('school_year_id', $activeSchoolYear->id)
            ->where('section_id', $request->section_id)
            ->exists();

        if (! $isAssigned) {
            abort(403, 'You are not assigned to this section.');
        }

        foreach ($request->attendance as $entry) {
            Attendance::updateOrCreate(
                [
                    'school_year_id' => $activeSchoolYear->id,
                    'section_id' => $request->section_id,
                    'student_id' => $entry['student_id'],
                    'date' => $request->date,
                ],
                [
                    'teacher_id' => $teacher->id,
                    'status' => $entry['status'],
                    'remarks' => $entry['remarks'] ?? null,
                ],
            );
        }

        return back()->with('success', 'Attendance saved successfully.');
    }
}
