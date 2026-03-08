<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        $teachers = [
            ['first_name' => 'Maria', 'last_name' => 'Santos'],
            ['first_name' => 'Juan', 'last_name' => 'Dela Cruz'],
            ['first_name' => 'Ana', 'last_name' => 'Reyes'],
            ['first_name' => 'Jose', 'last_name' => 'Garcia'],
            ['first_name' => 'Rosa', 'last_name' => 'Mendoza'],
            ['first_name' => 'Pedro', 'last_name' => 'Gonzales'],
            ['first_name' => 'Elena', 'last_name' => 'Ramos'],
            ['first_name' => 'Carlos', 'last_name' => 'Bautista'],
            ['first_name' => 'Lorna', 'last_name' => 'Villanueva'],
            ['first_name' => 'Ricardo', 'last_name' => 'Torres'],
            ['first_name' => 'Gloria', 'last_name' => 'Aquino'],
            ['first_name' => 'Manuel', 'last_name' => 'Fernandez'],
            ['first_name' => 'Teresa', 'last_name' => 'Castillo'],
            ['first_name' => 'Roberto', 'last_name' => 'Navarro'],
            ['first_name' => 'Cristina', 'last_name' => 'Mercado'],
        ];

        foreach ($teachers as $teacher) {
            $username = strtolower($teacher['first_name'] . '.' . $teacher['last_name']);
            $username = str_replace(' ', '', $username);

            User::firstOrCreate(
                ['username' => $username],
                [
                    'first_name' => $teacher['first_name'],
                    'last_name' => $teacher['last_name'],
                    'username' => $username,
                    'type' => 'teacher',
                    'password' => 'password',
                ],
            );
        }
    }
}
