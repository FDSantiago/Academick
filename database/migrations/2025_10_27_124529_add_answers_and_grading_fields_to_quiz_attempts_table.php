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
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->json('answers')->nullable()->after('status');
            $table->integer('time_taken')->nullable()->after('answers'); // in minutes
            $table->boolean('is_graded')->default(false)->after('time_taken');
            $table->integer('attempt_number')->default(1)->after('is_graded');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropColumn(['answers', 'time_taken', 'is_graded', 'attempt_number']);
        });
    }
};
