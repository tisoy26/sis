<?php

namespace Database\Seeders;

use App\Models\YearLevel;
use Illuminate\Database\Seeder;

class YearLevelSeeder extends Seeder
{
    public function run(): void
    {
        $yearLevels = [
            ['name' => 'Kinder 1', 'category' => 'preschool', 'order' => 1],
            ['name' => 'Kinder 2', 'category' => 'preschool', 'order' => 2],
            ['name' => 'Grade 1', 'category' => 'elementary', 'order' => 3],
            ['name' => 'Grade 2', 'category' => 'elementary', 'order' => 4],
            ['name' => 'Grade 3', 'category' => 'elementary', 'order' => 5],
            ['name' => 'Grade 4', 'category' => 'elementary', 'order' => 6],
            ['name' => 'Grade 5', 'category' => 'elementary', 'order' => 7],
            ['name' => 'Grade 6', 'category' => 'elementary', 'order' => 8],
            ['name' => 'Grade 7', 'category' => 'junior_high', 'order' => 9],
            ['name' => 'Grade 8', 'category' => 'junior_high', 'order' => 10],
            ['name' => 'Grade 9', 'category' => 'junior_high', 'order' => 11],
            ['name' => 'Grade 10', 'category' => 'junior_high', 'order' => 12],
            ['name' => 'Grade 11', 'category' => 'senior_high', 'order' => 13],
            ['name' => 'Grade 12', 'category' => 'senior_high', 'order' => 14],
        ];

        foreach ($yearLevels as $level) {
            YearLevel::firstOrCreate(
                ['name' => $level['name']],
                [...$level, 'status' => 'active'],
            );
        }
    }
}
