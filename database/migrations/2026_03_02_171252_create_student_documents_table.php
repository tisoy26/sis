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
        Schema::create('student_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->boolean('birth_certificate')->default(false);
            $table->boolean('report_card')->default(false);
            $table->boolean('good_moral')->default(false);
            $table->boolean('school_card')->default(false);
            $table->boolean('id_photos')->default(false);
            $table->boolean('medical_certificate')->default(false);
            $table->boolean('certificate_of_transfer')->default(false);
            $table->boolean('not_yet_available')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_documents');
    }
};
