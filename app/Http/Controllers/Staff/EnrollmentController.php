<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\EnrollmentRequest;
use App\Mail\StudentEnrolledMail;
use App\Models\Enrollment;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use App\Models\YearLevel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    public function index(): Response
    {
        $enrollments = Enrollment::with(['student', 'schoolYear', 'section', 'yearLevel'])
            ->latest()
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'student_id' => $e->student_id,
                'school_year_id' => $e->school_year_id,
                'section_id' => $e->section_id,
                'year_level_id' => $e->year_level_id,
                'status' => $e->status,
                'enrolled_at' => $e->enrolled_at?->toDateString(),
                'remarks' => $e->remarks,
                'student_name' => $e->student->full_name,
                'student_number' => $e->student->student_id,
                'school_year_name' => $e->schoolYear->name,
                'section_name' => $e->section->name,
                'year_level_name' => $e->yearLevel?->name,
                'created_at' => $e->created_at->toISOString(),
            ]);

        return Inertia::render('staff/enrollment/index', [
            'enrollments' => $enrollments,
            'students' => Student::orderBy('last_name')
                ->get()
                ->map(fn ($s) => [
                    'value' => (string) $s->id,
                    'label' => "{$s->full_name} ({$s->student_id})",
                ]),
            'schoolYears' => SchoolYear::where('status', 'active')
                ->orderByDesc('start_date')
                ->get()
                ->map(fn ($sy) => [
                    'value' => (string) $sy->id,
                    'label' => $sy->name,
                ]),
            'yearLevels' => YearLevel::where('status', 'active')
                ->orderBy('order')
                ->get()
                ->map(fn ($yl) => [
                    'value' => (string) $yl->id,
                    'label' => $yl->name,
                ]),
            'sections' => Section::with('yearLevel')
                ->where('status', 'active')
                ->orderBy('name')
                ->get()
                ->map(fn ($s) => [
                    'value' => (string) $s->id,
                    'label' => $s->name,
                    'year_level_id' => $s->year_level_id ? (string) $s->year_level_id : null,
                    'year_level_name' => $s->yearLevel?->name,
                ]),
        ]);
    }

    public function store(EnrollmentRequest $request): RedirectResponse
    {
        $enrollment = Enrollment::create([
            ...$request->validated(),
            'enrolled_at' => now()->toDateString(),
        ]);

        // Auto-activate student on enrollment
        $enrollment->student()->update(['status' => 'active']);

        // Send enrollment confirmation email if student has an email
        $student = $enrollment->student;
        if ($student->email) {
            Mail::to($student->email)->send(new StudentEnrolledMail($enrollment));
        }

        return back()->with('success', 'Student enrolled successfully.');
    }

    public function update(EnrollmentRequest $request, Enrollment $enrollment): RedirectResponse
    {
        $enrollment->update($request->validated());

        // If enrollment is dropped, check if student has other active enrollments
        if ($request->validated()['status'] === 'dropped') {
            $activeEnrollments = Enrollment::where('student_id', $enrollment->student_id)
                ->where('id', '!=', $enrollment->id)
                ->where('status', 'enrolled')
                ->exists();

            if (! $activeEnrollments) {
                $enrollment->student()->update(['status' => 'inactive']);
            }
        }

        return back()->with('success', 'Enrollment updated successfully.');
    }

    public function destroy(Enrollment $enrollment): RedirectResponse
    {
        $studentId = $enrollment->student_id;
        $enrollment->delete();

        // If no remaining active enrollments, deactivate student
        $activeEnrollments = Enrollment::where('student_id', $studentId)
            ->where('status', 'enrolled')
            ->exists();

        if (! $activeEnrollments) {
            Student::where('id', $studentId)->update(['status' => 'inactive']);
        }

        return back()->with('success', 'Enrollment removed successfully.');
    }
}
