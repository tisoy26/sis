<?php

namespace App\Http\Controllers;

use App\Http\Requests\SchoolYearRequest;
use App\Models\SchoolYear;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SchoolYearController extends Controller
{
    public function index(): Response
    {
        $schoolYears = SchoolYear::latest()->get();

        return Inertia::render('admin/school-years/index', [
            'schoolYears' => $schoolYears,
        ]);
    }

    public function store(SchoolYearRequest $request): RedirectResponse
    {
        SchoolYear::create($request->validated());

        return back()->with('success', 'School year created successfully.');
    }

    public function update(SchoolYearRequest $request, SchoolYear $schoolYear): RedirectResponse
    {
        $schoolYear->update($request->validated());

        return back()->with('success', 'School year updated successfully.');
    }

    public function destroy(SchoolYear $schoolYear): RedirectResponse
    {
        $schoolYear->delete();

        return back()->with('success', 'School year deleted successfully.');
    }
}
