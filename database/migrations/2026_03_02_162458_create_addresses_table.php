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
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('region_code', 20)->nullable();
            $table->string('region_name', 100)->nullable();
            $table->string('province_code', 20)->nullable();
            $table->string('province_name', 100)->nullable();
            $table->string('city_code', 20)->nullable();
            $table->string('city_name', 100)->nullable();
            $table->string('barangay_code', 20)->nullable();
            $table->string('barangay_name', 100)->nullable();
            $table->string('street', 255)->nullable();
            $table->string('zip_code', 10)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
