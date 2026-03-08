<?php

namespace Database\Seeders;

use App\Models\SchoolYear;
use Illuminate\Database\Seeder;

class SchoolYearSeeder extends Seeder
{
    public function run(): void
    {
        $schoolYears = [
            ['name' => '2023-2024', 'start_date' => '2023-08-28', 'end_date' => '2024-06-14', 'status' => 'inactive'],
            ['name' => '2024-2025', 'start_date' => '2024-07-29', 'end_date' => '2025-06-13', 'status' => 'inactive'],
            ['name' => '2025-2026', 'start_date' => '2025-07-28', 'end_date' => '2026-06-12', 'status' => 'active'],
        ];

        foreach ($schoolYears as $sy) {
            SchoolYear::firstOrCreate(
                ['name' => $sy['name']],
                $sy,
            );
        }
    }
}
