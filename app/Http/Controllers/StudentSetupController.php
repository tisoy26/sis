<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentSetupController extends Controller
{
    public function show(Request $request, Student $student): Response|RedirectResponse
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'This setup link has expired or is invalid.');
        }

        // If account already exists, redirect to login
        if ($student->user) {
            return redirect()->route('home')->with('status', 'Your account has already been set up. Please log in.');
        }

        return Inertia::render('auth/student-setup', [
            'student' => [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'full_name' => $student->full_name,
            ],
            'signature' => $request->query('signature'),
            'expires' => $request->query('expires'),
        ]);
    }

    public function store(Request $request, Student $student): RedirectResponse
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'This setup link has expired or is invalid.');
        }

        if ($student->user) {
            return redirect()->route('home')->with('status', 'Your account has already been set up.');
        }

        $validated = $request->validate([
            'username' => ['required', 'string', 'min:4', 'max:50', 'unique:users,username'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        User::create([
            'first_name' => $student->first_name,
            'last_name' => $student->last_name,
            'username' => $validated['username'],
            'password' => $validated['password'],
            'type' => 'student',
            'student_id' => $student->id,
        ]);

        return redirect()->route('home')->with('status', 'Account created successfully! You can now log in with your credentials.');
    }
}
