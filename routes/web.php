<?php

use App\Http\Controllers\AssignmentController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    Route::get('courses', [App\Http\Controllers\CourseController::class, 'index'])->name('courses.index');
    Route::get('courses/{course_id}', [App\Http\Controllers\CourseController::class, 'show'])->name('courses.show');

    Route::get('/assignments', [AssignmentController::class, 'index'])->name('assignments.index');
    // Student Assignment Routes
    Route::prefix('courses/{course}')->group(function () {
        Route::get('assignments/{assignment}/submit', [App\Http\Controllers\StudentCourseController::class, 'submitAssignment'])->name('assignments.submit');
        Route::get('assignments/{assignment}', [App\Http\Controllers\StudentCourseController::class, 'showAssignment'])->name('assignments.show');
    });

    // Student Quiz Routes
    Route::prefix('courses/{course}')->group(function () {
        Route::get('quizzes', [App\Http\Controllers\StudentCourseController::class, 'quizzes'])->name('quizzes.index');
        Route::get('quizzes/{quiz}/take', [App\Http\Controllers\StudentCourseController::class, 'takeQuiz'])->name('quizzes.take');
        Route::get('quizzes/{quiz}/results/{attempt}', [App\Http\Controllers\StudentCourseController::class, 'quizResults'])->name('quizzes.results');
    });

    // Student Discussion Routes
    Route::prefix('courses/{course}')->group(function () {
        Route::get('discussions', [App\Http\Controllers\StudentCourseController::class, 'discussions'])->name('discussions.index');
        Route::get('discussions/{discussion}', [App\Http\Controllers\StudentCourseController::class, 'viewDiscussion'])->name('discussions.show');
    });


    // Instructor grading routes
    Route::prefix('courses/{course}/grading')->name('instructor.grading.')->group(function () {
        Route::get('/', [App\Http\Controllers\Instructor\GradingController::class, 'index'])->name('index');
        Route::post('submissions/{submission}/grade', [App\Http\Controllers\Instructor\GradingController::class, 'gradeSubmission'])->name('grade');
        Route::post('submissions/bulk-grade', [App\Http\Controllers\Instructor\GradingController::class, 'bulkGrade'])->name('bulk-grade');
        Route::get('statistics', [App\Http\Controllers\Instructor\GradingController::class, 'getStatistics'])->name('statistics');
        Route::get('submissions/{submission}/history', [App\Http\Controllers\Instructor\GradingController::class, 'getGradeHistory'])->name('history');
    });
    Route::get('/assignments', [AssignmentController::class, 'index'])->name('assignments.index');
});

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
require __DIR__.'/instructor.php';
