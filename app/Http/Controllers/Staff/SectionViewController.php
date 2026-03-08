<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\SchoolYear;
use App\Models\Section;
use Inertia\Inertia;
use Inertia\Response;

class SectionViewController extends Controller
{
    public function index(): Response
    {
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        $sections = Section::with('yearLevel')
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(function ($section) use ($activeSchoolYear) {
                $enrolledCount = $activeSchoolYear
                    ? Enrollment::where('section_id', $section->id)
                        ->where('school_year_id', $activeSchoolYear->id)
                        ->where('status', 'enrolled')
                        ->count()
                    : 0;

                return [
                    'id' => $section->id,
                    'name' => $section->name,
                    'year_level_name' => $section->yearLevel?->name,
                    'status' => $section->status,
                    'enrolled_count' => $enrolledCount,
                ];
            });

        return Inertia::render('staff/sections/index', [
            'sections' => $sections,
            'activeSchoolYear' => $activeSchoolYear?->name,
        ]);
    }
}
