<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    public function run(): void
    {
        $subjects = [
            // Core K-12 subjects
            ['code' => 'FIL', 'name' => 'Filipino', 'description' => 'Filipino language and literature'],
            ['code' => 'ENG', 'name' => 'English', 'description' => 'English language and literature'],
            ['code' => 'MATH', 'name' => 'Mathematics', 'description' => 'Mathematics'],
            ['code' => 'SCI', 'name' => 'Science', 'description' => 'Science and technology'],
            ['code' => 'AP', 'name' => 'Araling Panlipunan', 'description' => 'Social studies / Philippine history and government'],
            ['code' => 'ESP', 'name' => 'Edukasyon sa Pagpapakatao', 'description' => 'Values education'],
            ['code' => 'MAPEH', 'name' => 'MAPEH', 'description' => 'Music, Arts, Physical Education, and Health'],
            ['code' => 'MT', 'name' => 'Mother Tongue', 'description' => 'Mother tongue-based multilingual education (Grades 1-3)'],
            ['code' => 'TLE', 'name' => 'Technology and Livelihood Education', 'description' => 'Technical-vocational and livelihood skills'],
            ['code' => 'EPP', 'name' => 'Edukasyong Pantahanan at Pangkabuhayan', 'description' => 'Home economics and livelihood (Grades 4-6)'],
            ['code' => 'COMP', 'name' => 'Computer Education', 'description' => 'Basic computer literacy and ICT'],

            // Senior High core subjects
            ['code' => 'OC', 'name' => 'Oral Communication', 'description' => 'Oral communication in context'],
            ['code' => 'RWS', 'name' => 'Reading and Writing Skills', 'description' => 'Reading and writing across disciplines'],
            ['code' => 'KOMFIL', 'name' => 'Komunikasyon at Pananaliksik sa Wika at Kulturang Filipino', 'description' => 'Filipino communication and research'],
            ['code' => 'GMATH', 'name' => 'General Mathematics', 'description' => 'General mathematics for SHS'],
            ['code' => 'STATS', 'name' => 'Statistics and Probability', 'description' => 'Statistics and probability'],
            ['code' => 'EARTSC', 'name' => 'Earth and Life Science', 'description' => 'Earth and life science'],
            ['code' => 'PHYSCI', 'name' => 'Physical Science', 'description' => 'Physical science'],
            ['code' => 'PERDEV', 'name' => 'Personal Development', 'description' => 'Personal development / Pansariling Kaunlaran'],
            ['code' => 'UCSP', 'name' => 'Understanding Culture, Society, and Politics', 'description' => 'Culture, society, and politics'],
            ['code' => 'CPAR', 'name' => 'Contemporary Philippine Arts from the Regions', 'description' => 'Philippine contemporary arts'],
            ['code' => 'PE1', 'name' => 'Physical Education and Health 1', 'description' => 'PE and health for SHS (1st semester)'],
            ['code' => 'PE2', 'name' => 'Physical Education and Health 2', 'description' => 'PE and health for SHS (2nd semester)'],
            ['code' => 'INTPHILO', 'name' => 'Introduction to the Philosophy of the Human Person', 'description' => 'Philosophy for SHS'],
            ['code' => 'MEDINFO', 'name' => 'Media and Information Literacy', 'description' => 'Media and information literacy'],
            ['code' => 'ENTREP', 'name' => 'Entrepreneurship', 'description' => 'Entrepreneurship'],
            ['code' => 'RESEARCH', 'name' => 'Inquiries, Investigations, and Immersion', 'description' => 'Research methods and immersion'],
        ];

        foreach ($subjects as $subject) {
            Subject::firstOrCreate(
                ['code' => $subject['code']],
                [...$subject, 'status' => 'active'],
            );
        }
    }
}
