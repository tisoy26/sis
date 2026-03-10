<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'username' => 'admin',
            'type' => 'admin',
            'password' => 'password',
        ]);

        User::create([
            'first_name' => 'Staff',
            'last_name' => 'User',
            'username' => 'staff',
            'type' => 'staff',
            'password' => 'password',
        ]);

        User::create([
            'first_name' => 'Teacher',
            'last_name' => 'User',
            'username' => 'teacher',
            'type' => 'teacher',
            'password' => 'password',
        ]);

        $this->call([
            YearLevelSeeder::class,
            SectionSeeder::class,
            SubjectSeeder::class,
            SchoolYearSeeder::class,
            TeacherSeeder::class,
            TeacherAssignmentSeeder::class,
            ScheduleSeeder::class,
            StudentSeeder::class,
        ]);
    }
}
