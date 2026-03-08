<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\Enrollment;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\StudentGuardian;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $schoolYear = SchoolYear::where('status', 'active')->first();

        if (! $schoolYear) {
            $this->command->warn('No active school year found. Skipping students.');
            return;
        }

        $sections = Section::with('yearLevel')->orderBy('year_level_id')->get();

        if ($sections->isEmpty()) {
            $this->command->warn('No sections found. Skipping students.');
            return;
        }

        $firstNames = [
            'male' => [
                'Andrei', 'Bryan', 'Carlo', 'Daniel', 'Ethan', 'Francis', 'Gabriel', 'Harold',
                'Ivan', 'Jerome', 'Kevin', 'Lance', 'Miguel', 'Nathan', 'Oliver', 'Patrick',
                'Rafael', 'Sean', 'Timothy', 'Vincent', 'Wesley', 'Xander', 'Yohan', 'Zack',
                'Aldrich', 'Benedict', 'Cedric', 'Dominic', 'Elijah', 'Felix',
            ],
            'female' => [
                'Angela', 'Bianca', 'Camille', 'Denise', 'Elaine', 'Faith', 'Gabrielle', 'Hannah',
                'Iris', 'Julia', 'Katrina', 'Leah', 'Michelle', 'Nicole', 'Olivia', 'Patricia',
                'Rachel', 'Samantha', 'Trisha', 'Vanessa', 'Wendy', 'Ximena', 'Yasmin', 'Zoe',
                'Althea', 'Beatrice', 'Christine', 'Diana', 'Erica', 'Francesca',
            ],
        ];

        $lastNames = [
            'Santos', 'Reyes', 'Cruz', 'Bautista', 'Gonzales', 'Garcia', 'Mendoza', 'Torres',
            'Ramos', 'Aquino', 'Fernandez', 'Castillo', 'Rivera', 'Navarro', 'Mercado',
            'Villanueva', 'Soriano', 'De Leon', 'Dela Cruz', 'Flores', 'Manalo', 'Pascual',
            'Salvador', 'Ignacio', 'Dizon', 'Pineda', 'Salazar', 'Tolentino', 'Aguilar', 'Francisco',
        ];

        $middleNames = [
            'Alvarez', 'Bernardo', 'Concepcion', 'David', 'Espinosa', 'Fernando',
            'Gutierrez', 'Herrera', 'Ilagan', 'Jimenez', 'Katigbak', 'Lapuz',
            'Magno', 'Nicolas', 'Ocampo', 'Panganiban', 'Quiambao', 'Rosario',
            'Sison', 'Tan', null, null, null, null,
        ];

        $occupations = [
            'Driver', 'Teacher', 'Vendor', 'Farmer', 'OFW', 'Construction Worker',
            'Nurse', 'Electrician', 'Carpenter', 'Fisherman', 'Mechanic', 'Security Guard',
            'Sales Clerk', 'Tricycle Driver', 'Housewife', 'Laundrywoman', 'Dressmaker',
            'Cook', 'Office Staff', 'Factory Worker',
        ];

        $relationships = ['Father', 'Mother', 'Grandmother', 'Grandfather', 'Aunt', 'Uncle'];

        $counter = 1;

        // How many students per section based on category
        $studentsPerSection = [
            'preschool' => 15,
            'elementary' => 25,
            'junior_high' => 30,
            'senior_high' => 25,
        ];

        foreach ($sections as $section) {
            $category = $section->yearLevel->category ?? 'elementary';
            $count = $studentsPerSection[$category] ?? 20;

            for ($i = 0; $i < $count; $i++) {
                $gender = $i % 2 === 0 ? 'male' : 'female';
                $firstName = $firstNames[$gender][array_rand($firstNames[$gender])];
                $lastName = $lastNames[array_rand($lastNames)];
                $middleName = $middleNames[array_rand($middleNames)];

                // Generate unique student ID: SY prefix + sequential
                $studentId = '2025-' . str_pad($counter, 5, '0', STR_PAD_LEFT);

                // Age ranges based on category
                $birthYear = match ($category) {
                    'preschool' => rand(2019, 2020),
                    'elementary' => rand(2013, 2019),
                    'junior_high' => rand(2009, 2013),
                    'senior_high' => rand(2007, 2010),
                };

                $student = Student::create([
                    'student_id' => $studentId,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'middle_name' => $middleName,
                    'gender' => $gender,
                    'birth_date' => sprintf('%d-%02d-%02d', $birthYear, rand(1, 12), rand(1, 28)),
                    'contact_number' => '09' . rand(100000000, 999999999),
                    'status' => 'active',
                ]);

                // Address
                Address::create([
                    'student_id' => $student->id,
                    'region_code' => '040000000',
                    'region_name' => 'CALABARZON',
                    'province_code' => '041000000',
                    'province_name' => 'Batangas',
                    'city_code' => '041005000',
                    'city_name' => 'Calaca',
                    'barangay_code' => '04100500' . str_pad(rand(1, 30), 2, '0', STR_PAD_LEFT),
                    'barangay_name' => collect(['Poblacion', 'Bagong Silang', 'San Rafael', 'Lumbang', 'Dacanlao', 'Iba', 'Carenahan', 'Balimbing', 'Sampaga', 'Tambo'])->random(),
                    'street' => rand(1, 500) . ' ' . collect(['Rizal', 'Mabini', 'Bonifacio', 'Aguinaldo', 'Luna'])->random() . ' St.',
                    'zip_code' => '4212',
                ]);

                // Guardian
                $fatherLast = $lastName;
                $motherLast = $lastNames[array_rand($lastNames)];

                StudentGuardian::create([
                    'student_id' => $student->id,
                    'father_first_name' => $firstNames['male'][array_rand($firstNames['male'])],
                    'father_middle_name' => $middleNames[array_rand($middleNames)],
                    'father_last_name' => $fatherLast,
                    'father_contact' => '09' . rand(100000000, 999999999),
                    'father_occupation' => $occupations[array_rand($occupations)],
                    'mother_first_name' => $firstNames['female'][array_rand($firstNames['female'])],
                    'mother_middle_name' => $middleNames[array_rand($middleNames)],
                    'mother_last_name' => $motherLast,
                    'mother_contact' => '09' . rand(100000000, 999999999),
                    'mother_occupation' => $occupations[array_rand($occupations)],
                    'guardian_first_name' => $firstNames[$gender][array_rand($firstNames[$gender])],
                    'guardian_middle_name' => $middleNames[array_rand($middleNames)],
                    'guardian_last_name' => $fatherLast,
                    'guardian_contact' => '09' . rand(100000000, 999999999),
                    'guardian_relationship' => $relationships[array_rand($relationships)],
                ]);

                // Documents (random completion)
                StudentDocument::create([
                    'student_id' => $student->id,
                    'birth_certificate' => (bool) rand(0, 1),
                    'report_card' => (bool) rand(0, 1),
                    'good_moral' => (bool) rand(0, 1),
                    'school_card' => (bool) rand(0, 1),
                    'id_photos' => (bool) rand(0, 1),
                    'medical_certificate' => (bool) rand(0, 1),
                    'not_yet_available' => false,
                ]);

                // Enrollment
                Enrollment::create([
                    'student_id' => $student->id,
                    'school_year_id' => $schoolYear->id,
                    'section_id' => $section->id,
                    'year_level_id' => $section->year_level_id,
                    'status' => collect(['enrolled', 'enrolled', 'enrolled', 'enrolled', 'enrolled', 'enrolled', 'enrolled', 'dropped', 'completed'])->random(),
                    'enrolled_at' => $schoolYear->start_date->copy()->addDays(rand(0, 14)),
                    'remarks' => null,
                ]);

                $counter++;
            }
        }

        $this->command->info("Seeded {$counter} students with enrollments.");
    }
}
