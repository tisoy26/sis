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
        Schema::create('student_guardians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();

            // Father
            $table->string('father_name', 200)->nullable();
            $table->string('father_contact', 20)->nullable();
            $table->string('father_occupation', 100)->nullable();

            // Mother
            $table->string('mother_name', 200)->nullable();
            $table->string('mother_contact', 20)->nullable();
            $table->string('mother_occupation', 100)->nullable();

            // Guardian (optional — used when parents are not available)
            $table->string('guardian_name', 200)->nullable();
            $table->string('guardian_contact', 20)->nullable();
            $table->string('guardian_relationship', 100)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_guardians');
    }
};
