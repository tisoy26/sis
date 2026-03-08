<?php

namespace App\Http\Controllers;

use App\Http\Requests\SectionRequest;
use App\Models\Section;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
    public function index(): Response
    {
        $sections = Section::with('yearLevel')
            ->latest()
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'year_level_id' => $s->year_level_id,
                'year_level_name' => $s->yearLevel?->name,
                'status' => $s->status,
                'created_at' => $s->created_at->toISOString(),
                'updated_at' => $s->updated_at->toISOString(),
            ]);

        $yearLevels = \App\Models\YearLevel::where('status', 'active')
            ->orderBy('order')
            ->get()
            ->map(fn ($yl) => [
                'value' => (string) $yl->id,
                'label' => $yl->name,
            ]);

        return Inertia::render('admin/sections/index', [
            'sections' => $sections,
            'yearLevels' => $yearLevels,
        ]);
    }

    public function store(SectionRequest $request): RedirectResponse
    {
        Section::create($request->validated());

        return back()->with('success', 'Section created successfully.');
    }

    public function update(SectionRequest $request, Section $section): RedirectResponse
    {
        $section->update($request->validated());

        return back()->with('success', 'Section updated successfully.');
    }

    public function destroy(Section $section): RedirectResponse
    {
        $section->delete();

        return back()->with('success', 'Section deleted successfully.');
    }
}
