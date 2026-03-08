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
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('school_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['enrolled', 'dropped', 'completed'])->default('enrolled');
            $table->date('enrolled_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'school_year_id'], 'enrollments_student_sy_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
