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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('student_id', 30)->unique(); // e.g. 2025-0001
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->enum('gender', ['male', 'female']);
            $table->date('birth_date');
            $table->text('address')->nullable();
            $table->string('contact_number', 20)->nullable();
            $table->string('guardian_name', 200)->nullable();
            $table->string('guardian_contact', 20)->nullable();
            $table->enum('status', ['active', 'inactive', 'graduated', 'transferred'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
