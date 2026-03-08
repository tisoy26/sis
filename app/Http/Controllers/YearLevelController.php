<?php

namespace App\Http\Controllers;

use App\Http\Requests\YearLevelRequest;
use App\Models\YearLevel;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class YearLevelController extends Controller
{
    public function index(): Response
    {
        $yearLevels = YearLevel::orderBy('order')->get();

        return Inertia::render('admin/year-levels/index', [
            'yearLevels' => $yearLevels,
        ]);
    }

    public function store(YearLevelRequest $request): RedirectResponse
    {
        YearLevel::create($request->validated());

        return back()->with('success', 'Year level created successfully.');
    }

    public function update(YearLevelRequest $request, YearLevel $yearLevel): RedirectResponse
    {
        $yearLevel->update($request->validated());

        return back()->with('success', 'Year level updated successfully.');
    }

    public function destroy(YearLevel $yearLevel): RedirectResponse
    {
        $yearLevel->delete();

        return back()->with('success', 'Year level deleted successfully.');
    }
}
