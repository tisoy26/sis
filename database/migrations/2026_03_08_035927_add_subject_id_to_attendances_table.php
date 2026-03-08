<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (! Schema::hasColumn('attendances', 'subject_id')) {
                $table->foreignId('subject_id')->nullable()->after('section_id')->constrained()->cascadeOnDelete();
            }
        });

        // Check current state of constraints
        $existingKeys = collect(DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendances' AND CONSTRAINT_TYPE = 'FOREIGN KEY'"))->pluck('CONSTRAINT_NAME');
        $existingIndexes = collect(DB::select("SHOW INDEX FROM attendances WHERE Key_name = 'attendance_unique'"));

        Schema::table('attendances', function (Blueprint $table) use ($existingKeys, $existingIndexes) {
            // Must drop school_year FK before dropping the unique index it depends on
            if ($existingKeys->contains('attendances_school_year_id_foreign') && $existingIndexes->isNotEmpty()) {
                $table->dropForeign(['school_year_id']);
            }
        });

        Schema::table('attendances', function (Blueprint $table) use ($existingKeys, $existingIndexes) {
            if ($existingIndexes->isNotEmpty()) {
                $table->dropUnique('attendance_unique');
            }

            // Re-add school_year FK and any other missing FKs
            $refreshKeys = collect(DB::select("SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendances' AND CONSTRAINT_TYPE = 'FOREIGN KEY'"))->pluck('CONSTRAINT_NAME');

            if (! $refreshKeys->contains('attendances_school_year_id_foreign')) {
                $table->foreign('school_year_id')->references('id')->on('school_years')->cascadeOnDelete();
            }
            if (! $refreshKeys->contains('attendances_section_id_foreign')) {
                $table->foreign('section_id')->references('id')->on('sections')->cascadeOnDelete();
            }
            if (! $refreshKeys->contains('attendances_student_id_foreign')) {
                $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
            }

            $table->unique(['school_year_id', 'section_id', 'subject_id', 'student_id', 'date'], 'attendance_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique('attendance_unique');
            $table->dropForeign(['subject_id']);
            $table->dropColumn('subject_id');
            $table->unique(['school_year_id', 'section_id', 'student_id', 'date'], 'attendance_unique');
        });
    }
};
