<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('student_guardians', function (Blueprint $table) {
            // Drop old single-name columns
            $table->dropColumn(['father_name', 'mother_name', 'guardian_name']);
        });

        Schema::table('student_guardians', function (Blueprint $table) {
            // Father normalized names
            $table->string('father_first_name', 100)->nullable()->after('student_id');
            $table->string('father_middle_name', 100)->nullable()->after('father_first_name');
            $table->string('father_last_name', 100)->nullable()->after('father_middle_name');

            // Mother normalized names
            $table->string('mother_first_name', 100)->nullable()->after('father_occupation');
            $table->string('mother_middle_name', 100)->nullable()->after('mother_first_name');
            $table->string('mother_last_name', 100)->nullable()->after('mother_middle_name');

            // Guardian normalized names
            $table->string('guardian_first_name', 100)->nullable()->after('mother_occupation');
            $table->string('guardian_middle_name', 100)->nullable()->after('guardian_first_name');
            $table->string('guardian_last_name', 100)->nullable()->after('guardian_middle_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_guardians', function (Blueprint $table) {
            $table->dropColumn([
                'father_first_name', 'father_middle_name', 'father_last_name',
                'mother_first_name', 'mother_middle_name', 'mother_last_name',
                'guardian_first_name', 'guardian_middle_name', 'guardian_last_name',
            ]);
        });

        Schema::table('student_guardians', function (Blueprint $table) {
            $table->string('father_name', 200)->nullable()->after('student_id');
            $table->string('mother_name', 200)->nullable()->after('father_occupation');
            $table->string('guardian_name', 200)->nullable()->after('mother_occupation');
        });
    }
};
