<?php

use App\Http\Controllers\Api\DiscussionReplyController;
use App\Http\Controllers\Api\QuizAttemptController;
use App\Http\Controllers\Api\QuizQuestionController;
use App\Http\Controllers\StudentCourseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/student/courses', [StudentCourseController::class, 'apiGetAllCourses']);
    Route::get('/student/courses/deadlines', [StudentCourseController::class, 'apiGetAllDeadlines']);
    Route::get('/student/courses/announcements', [StudentCourseController::class, 'apiGetAnnouncements']);
    Route::get('/student/courses/assignments', [StudentCourseController::class, 'apiGetAssignments']);

    Route::put('/student/courses/enroll', [StudentCourseController::class, 'apiEnrollCourse']);

    // Admin user management (API)
    Route::get('/admin/users', [\App\Http\Controllers\Api\UserManagementController::class, 'getUsers']);
    Route::post('/admin/users', [\App\Http\Controllers\Api\UserManagementController::class, 'store']);
    Route::put('/admin/users/{id}', [\App\Http\Controllers\Api\UserManagementController::class, 'update']);
    Route::delete('/admin/users/{id}', [\App\Http\Controllers\Api\UserManagementController::class, 'destroy']);

    // Admin course management (API)
    Route::get('/admin/courses', [\App\Http\Controllers\Api\CourseManagementController::class, 'getCourses']);
    Route::post('/admin/courses', [\App\Http\Controllers\Api\CourseManagementController::class, 'store']);
    Route::put('/admin/courses/{id}', [\App\Http\Controllers\Api\CourseManagementController::class, 'update']);
    Route::delete('/admin/courses/{id}', [\App\Http\Controllers\Api\CourseManagementController::class, 'destroy']);
    
    // Course enrollment management
    Route::get('/admin/courses/{id}/students', [\App\Http\Controllers\Api\CourseManagementController::class, 'getStudentsInCourse']);
    Route::post('/admin/courses/{id}/students', [\App\Http\Controllers\Api\CourseManagementController::class, 'addStudentsToCourse']);
    Route::delete('/admin/courses/{courseId}/students/{studentId}', [\App\Http\Controllers\Api\CourseManagementController::class, 'removeStudentFromCourse']);
    
    // Get courses based on user role
    Route::get('/courses', [\App\Http\Controllers\CourseController::class, 'apiGetCoursesByRole']);

    // Module management
    Route::apiResource('modules', \App\Http\Controllers\Api\CourseModuleController::class);
    Route::patch('/modules/{id}/publish', [\App\Http\Controllers\Api\CourseModuleController::class, 'publish']);
    Route::patch('/modules/{id}/archive', [\App\Http\Controllers\Api\CourseModuleController::class, 'archive']);
    Route::post('/courses/{courseId}/modules/reorder', [\App\Http\Controllers\Api\CourseModuleController::class, 'reorder']);

    // Page management
    Route::apiResource('pages', \App\Http\Controllers\Api\PageController::class);
    Route::get('/pages/slug/{slug}', [\App\Http\Controllers\Api\PageController::class, 'showBySlug']);
    Route::patch('/pages/{id}/publish', [\App\Http\Controllers\Api\PageController::class, 'publish']);
    Route::patch('/pages/{id}/archive', [\App\Http\Controllers\Api\PageController::class, 'archive']);
    Route::post('/modules/{moduleId}/pages/reorder', [\App\Http\Controllers\Api\PageController::class, 'reorder']);

    // Student submission routes
    Route::prefix('courses/{course}')->group(function () {
        Route::post('/assignments/{assignment}/submit', [\App\Http\Controllers\Api\AssignmentSubmissionController::class, 'store']);
        Route::get('/assignments/{assignment}/submission', [\App\Http\Controllers\Api\AssignmentSubmissionController::class, 'show']);
        Route::put('/assignments/{assignment}/submission', [\App\Http\Controllers\Api\AssignmentSubmissionController::class, 'update']);

        // Quiz attempt routes
        Route::get('/quizzes/{quiz}/attempts', [QuizAttemptController::class, 'index']);
        Route::post('/quizzes/{quiz}/attempts', [QuizAttemptController::class, 'store']);
        Route::get('/quizzes/{quiz}/attempts/{attempt}', [QuizAttemptController::class, 'show']);
        Route::put('/quizzes/{quiz}/attempts/{attempt}/answers', [QuizAttemptController::class, 'submitAnswers']);
        Route::post('/quizzes/{quiz}/attempts/{attempt}/submit', [QuizAttemptController::class, 'submit']);

        // Discussion reply routes
        Route::get('/discussions/{discussion}/replies', [DiscussionReplyController::class, 'index']);
        Route::post('/discussions/{discussion}/replies', [DiscussionReplyController::class, 'store']);
        Route::put('/discussions/{discussion}/replies/{reply}', [DiscussionReplyController::class, 'update']);
        Route::delete('/discussions/{discussion}/replies/{reply}', [DiscussionReplyController::class, 'destroy']);
    });

    // Instructor API routes
    Route::prefix('instructor')->group(function () {
        // General instructor routes (all courses)
        Route::get('/announcements', [\App\Http\Controllers\Api\AnnouncementController::class, 'index']);
        Route::get('/assignments', [\App\Http\Controllers\Api\AssignmentController::class, 'index']);
        Route::get('/quizzes', [\App\Http\Controllers\Api\QuizController::class, 'index']);
        Route::get('/discussions', [\App\Http\Controllers\Api\DiscussionController::class, 'index']);

        Route::post('/assignments', [\App\Http\Controllers\Api\AssignmentController::class, 'store']);
        Route::post('/discussions', [\App\Http\Controllers\Api\DiscussionController::class, 'store']);

        Route::delete('/quizzes/{quiz}', [\App\Http\Controllers\Api\QuizController::class, 'destroy']);

        // Quiz question management routes (not nested under courses)
        Route::get('/quizzes/{quiz}/questions', [QuizQuestionController::class, 'index']);
        Route::post('/quizzes/{quiz}/questions', [QuizQuestionController::class, 'store']);
        Route::get('/quizzes/{quiz}/questions/{question}', [QuizQuestionController::class, 'show']);
        Route::put('/quizzes/{quiz}/questions/{question}', [QuizQuestionController::class, 'update']);
        Route::delete('/quizzes/{quiz}/questions/{question}', [QuizQuestionController::class, 'destroy']);
        Route::post('/quizzes/{quiz}/questions/reorder', [QuizQuestionController::class, 'reorder']);

        // Course-specific instructor routes
        Route::prefix('courses/{course}')->group(function () {
            // Announcements
            Route::apiResource('announcements', \App\Http\Controllers\Api\AnnouncementController::class);

            // Assignments
            Route::apiResource('assignments', \App\Http\Controllers\Api\AssignmentController::class);

            // Quizzes
            Route::apiResource('quizzes', \App\Http\Controllers\Api\QuizController::class);

            // Discussions
            Route::apiResource('discussions', \App\Http\Controllers\Api\DiscussionController::class);
        });
    });
});