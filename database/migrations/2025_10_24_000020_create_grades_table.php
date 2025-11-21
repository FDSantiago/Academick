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
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->foreignId('grade_category_id')->constrained()->onDelete('cascade');
            $table->foreignId('assignment_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('quiz_id')->nullable()->constrained()->onDelete('cascade');
            $table->decimal('points_earned', 8, 2);
            $table->decimal('points_possible', 8, 2);
            $table->string('letter_grade')->nullable();
            $table->text('comments')->nullable();
            $table->timestamps();
            
            // Ensure a user can only have one grade per assignment or quiz
            $table->unique(['user_id', 'assignment_id'], 'user_assignment_unique');
            $table->unique(['user_id', 'quiz_id'], 'user_quiz_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};