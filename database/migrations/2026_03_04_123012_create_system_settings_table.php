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
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Seed default settings
        DB::table('system_settings')->insert([
            ['key' => 'system_name', 'value' => 'GOJAI SIS', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'system_logo', 'value' => null, 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'login_background', 'value' => null, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
