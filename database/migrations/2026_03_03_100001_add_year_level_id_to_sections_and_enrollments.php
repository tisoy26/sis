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
        Schema::table('sections', function (Blueprint $table) {
            $table->foreignId('year_level_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->foreignId('year_level_id')->nullable()->after('section_id')->constrained()->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            $table->dropForeign(['year_level_id']);
            $table->dropColumn('year_level_id');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['year_level_id']);
            $table->dropColumn('year_level_id');
        });
    }
};
