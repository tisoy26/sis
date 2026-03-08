<?php

namespace Database\Seeders;

use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Models\User;
use Illuminate\Database\Seeder;

class TeacherAssignmentSeeder extends Seeder
{
    public function run(): void
    {
        $schoolYear = SchoolYear::where('status', 'active')->first();

        if (! $schoolYear) {
            $this->command->warn('No active school year found. Skipping teacher assignments.');
            return;
        }

        $teachers = User::where('type', 'teacher')->get();

        if ($teachers->isEmpty()) {
            $this->command->warn('No teachers found. Skipping teacher assignments.');
            return;
        }

        $sections = Section::with('yearLevel')->orderBy('year_level_id')->get();
        $subjects = Subject::all();

        if ($sections->isEmpty() || $subjects->isEmpty()) {
            $this->command->warn('No sections or subjects found. Skipping teacher assignments.');
            return;
        }

        // Map subjects appropriate per category
        $subjectsByCategory = [
            'preschool' => $subjects->whereIn('code', ['FIL', 'ENG', 'MATH', 'MT', 'MAPEH', 'ESP'])->pluck('id')->toArray(),
            'elementary' => $subjects->whereIn('code', ['FIL', 'ENG', 'MATH', 'SCI', 'AP', 'ESP', 'MAPEH', 'MT', 'EPP', 'COMP'])->pluck('id')->toArray(),
            'junior_high' => $subjects->whereIn('code', ['FIL', 'ENG', 'MATH', 'SCI', 'AP', 'ESP', 'MAPEH', 'TLE', 'COMP'])->pluck('id')->toArray(),
            'senior_high' => $subjects->whereIn('code', ['OC', 'RWS', 'KOMFIL', 'GMATH', 'STATS', 'EARTSC', 'PHYSCI', 'PERDEV', 'UCSP', 'CPAR', 'PE1', 'PE2', 'INTPHILO', 'MEDINFO', 'ENTREP', 'RESEARCH'])->pluck('id')->toArray(),
        ];

        $teacherIds = $teachers->pluck('id')->toArray();
        $teacherIndex = 0;

        foreach ($sections as $section) {
            $category = $section->yearLevel->category ?? 'elementary';
            $subjectIds = $subjectsByCategory[$category] ?? [];

            foreach ($subjectIds as $subjectId) {
                $teacherId = $teacherIds[$teacherIndex % count($teacherIds)];

                TeacherAssignment::firstOrCreate(
                    [
                        'school_year_id' => $schoolYear->id,
                        'teacher_id' => $teacherId,
                        'section_id' => $section->id,
                        'subject_id' => $subjectId,
                    ],
                );

                $teacherIndex++;
            }
        }
    }
}
