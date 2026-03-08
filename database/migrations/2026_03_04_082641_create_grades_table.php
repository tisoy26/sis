<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Grade items define each scoring activity (e.g., "Quiz 1" WW, "Project 1" PT)
        Schema::create('grade_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_year_id')->constrained()->cascadeOnDelete();
            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('teacher_id');
            $table->foreign('teacher_id')->references('id')->on('users')->cascadeOnDelete();
            $table->tinyInteger('quarter'); // 1-4
            $table->enum('type', ['WW', 'PT', 'QA']); // Written Work, Performance Task, Quarterly Assessment
            $table->string('name'); // e.g. "Quiz 1", "Project 1", "Quarterly Exam"
            $table->decimal('max_score', 8, 2); // HPS for this item
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Individual student scores per grade item
        Schema::create('grade_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->decimal('score', 8, 2)->nullable();
            $table->timestamps();

            $table->unique(['grade_item_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_scores');
        Schema::dropIfExists('grade_items');
    }
};
