<?php

use App\Models\Course;
use App\Models\Discussion;
use App\Models\Assignment;
use App\Models\Quiz;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified', 'role:instructor'])->prefix('instructor')->name('instructor.')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('instructor/dashboard');
    })->name('dashboard');

    Route::get('/courses', function () {
        return Inertia::render('instructor/courses/index');
    })->name('courses.index');

    Route::get('/assignments', function () {
        $user = Auth::user();
        $assignments = \App\Models\Assignment::where('instructor_id', $user->id)
            ->orWhere(function ($query) use ($user) {
                if ($user->roles()->where('name', 'admin')->exists()) {
                    $query->whereRaw('1 = 1'); // Return all assignments for admin
                }
            })
            ->get();

        $user = Auth::user();
        $assignments = \App\Models\Assignment::where('instructor_id', $user->id)
            ->orWhere(function ($query) use ($user) {
                if ($user->roles()->where('name', 'admin')->exists()) {
                    $query->whereRaw('1 = 1'); // Return all assignments for admin
                }
            })
            ->get();

        $courses = \App\Models\Course::where('instructor_id', $user->id)
            ->orWhere(function ($query) use ($user) {
                if ($user->roles()->where('name', 'admin')->exists()) {
                    $query->whereRaw('1 = 1'); // Return all courses for admin
                }
            })
            ->get();

        return Inertia::render('instructor/assignments/index', [
            'assignments' => $assignments,
            'courses' => $courses
        ]);
    })->name('assignments.index');

    Route::get('/assignments/create', function () {
        $user = Auth::user();
        $courses = \App\Models\Course::where('instructor_id', $user->id)
            ->orWhere(function ($query) use ($user) {
                if ($user->roles()->where('name', 'admin')->exists()) {
                    $query->whereRaw('1 = 1'); // Return all courses for admin
                }
            })
            ->get();

        return Inertia::render('instructor/assignments/create', [
            'courses' => $courses
        ]);
    })->name('assignments.create');

    Route::get('/announcements', function () {
        return Inertia::render('instructor/announcements/index');
    })->name('announcements.index');

    Route::get('/announcements/create', function () {
        $user = Auth::user();
        $courses = \App\Models\Course::where('instructor_id', $user->id)
            ->orWhere(function ($query) use ($user) {
                if ($user->roles()->where('name', 'admin')->exists()) {
                    $query->whereRaw('1 = 1'); // Return all courses for admin
                }
            })
            ->get();

        return Inertia::render('instructor/announcements/create', [
            'courses' => $courses
        ]);
    })->name('announcements.create');

    Route::get('/quizzes', function () {
        return Inertia::render('instructor/quizzes/index', [
            'quizzes' => \App\Models\Quiz::all()
        ]);
    })->name('quizzes.index');

    Route::get('/quizzes/create', function () {
        $user = Auth::user();
        $courses = \App\Models\Course::where('instructor_id', $user->id)
            ->orWhere(function ($query) use ($user) {
                if ($user->roles()->where('name', 'admin')->exists()) {
                    $query->whereRaw('1 = 1'); // Return all courses for admin
                }
            })
            ->get();

        return Inertia::render('instructor/quizzes/create', [
            'courses' => $courses
        ]);
    })->name('quizzes.create');

    Route::get('/quizzes/{quiz}/edit', function(Quiz $quiz) {
        $course = $quiz->course_id;
        $questions = $quiz->questions;

        return Inertia::render('instructor/quizzes/edit', [
            'quiz' => $quiz,
            'course' => $course,
            'questions' => $questions
        ]);
    })->name('quizzes.edit');

    Route::get('/discussions', function () {
        $user = Auth::user();
        $courses = \App\Models\Course::where('instructor_id', $user->id)
            ->orWhere(function ($query) use ($user) {
                if ($user->roles()->where('name', 'admin')->exists()) {
                    $query->whereRaw('1 = 1'); // Return all courses for admin
                }
            })
            ->get();

        $discussions = Discussion::whereHas('course', function ($query) use ($user) {
            $query->where('instructor_id', $user->id);
        })->get();

        return Inertia::render('instructor/discussions/index', [
            'discussions' => $discussions,
            'courses' => $courses
        ]);
    })->name('discussions.index');

    Route::get('/discussions/create', function () {
        $user = Auth::user();
        $courses = \App\Models\Course::where('instructor_id', $user->id)
            ->orWhere(function ($query) use ($user) {
                if ($user->roles()->where('name', 'admin')->exists()) {
                    $query->whereRaw('1 = 1'); // Return all courses for admin
                }
            })
            ->get();

        return Inertia::render('instructor/discussions/create', [
            'courses' => $courses
        ]);
    })->name('discussions.create');

    // Route::get('/grading', function () {
    //     return Inertia::render('instructor/grading/index');
    // })->name('grading.index');
});