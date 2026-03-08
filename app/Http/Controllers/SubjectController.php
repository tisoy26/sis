<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubjectRequest;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function index(): Response
    {
        $subjects = Subject::latest()->get();

        return Inertia::render('admin/subjects/index', [
            'subjects' => $subjects,
        ]);
    }

    public function store(SubjectRequest $request): RedirectResponse
    {
        Subject::create($request->validated());

        return back()->with('success', 'Subject created successfully.');
    }

    public function update(SubjectRequest $request, Subject $subject): RedirectResponse
    {
        $subject->update($request->validated());

        return back()->with('success', 'Subject updated successfully.');
    }

    public function destroy(Subject $subject): RedirectResponse
    {
        $subject->delete();

        return back()->with('success', 'Subject deleted successfully.');
    }
}
