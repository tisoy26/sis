<?php

namespace Database\Seeders;

use App\Models\Section;
use App\Models\YearLevel;
use Illuminate\Database\Seeder;

class SectionSeeder extends Seeder
{
    public function run(): void
    {
        // Filipino public school-style section names by category
        $namesByCategory = [
            'preschool' => ['Sampaguita', 'Rosal', 'Sunflower'],
            'elementary' => ['Narra', 'Molave', 'Acacia', 'Camia', 'Ilang-Ilang', 'Orchid'],
            'junior_high' => ['Rizal', 'Bonifacio', 'Mabini', 'Del Pilar', 'Luna', 'Silang', 'Jacinto', 'Aguinaldo'],
            'senior_high' => ['Malvar', 'Tandang Sora', 'Gabriela', 'Lapu-Lapu'],
        ];

        $yearLevels = YearLevel::orderBy('order')->get();

        foreach ($yearLevels as $yearLevel) {
            $names = $namesByCategory[$yearLevel->category] ?? ['A', 'B', 'C'];

            foreach ($names as $name) {
                Section::firstOrCreate(
                    [
                        'name' => $name,
                        'year_level_id' => $yearLevel->id,
                    ],
                    ['status' => 'active'],
                );
            }
        }
    }
}
