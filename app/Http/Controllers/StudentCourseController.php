<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Course;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentCourseController extends Controller
{
    public function __invoke()
    {
        //
    }

    public function quizzes(Request $request, Course $course) {
        $user = $request->user();

        // Eager-load quizzes with their questions and the current user's attempts
        $course->load(['quizzes.questions', 'quizzes.attempts' => function ($query) use ($user) {
            $query->where('user_id', $user->id);
        }]);

        $quizzes = $course->quizzes->map(function ($quiz) {
            $completedAttempts = $quiz->attempts->where('is_completed', true);

            $bestScore = null;
            if ($completedAttempts->isNotEmpty()) {
                $totalPoints = $quiz->total_points; // Use the accessor
                if ($totalPoints > 0) {
                    $bestScore = $completedAttempts->max(function ($attempt) use ($totalPoints) {
                        return round(($attempt->score / $totalPoints) * 100);
                    });
                } else {
                    $bestScore = 0;
                }
            }

            // Convert quiz model to array, which includes appended accessors, and add best_score
            $quizData = $quiz->toArray();
            $quizData['best_score'] = $bestScore;

            return $quizData;
        });

        return Inertia::render('quizzes/index', [
            'course' => $course,
            'quizzes' => $quizzes,
        ]);
    }

    public function takeQuiz(Request $request, Course $course, Quiz $quiz) {
        return Inertia::render('quizzes/take', [
            'course' => $course,    
            'quiz' => $quiz,
            'attempt' => null,
            'questions' => $quiz->questions()->with('options')->get()
        ]);
    }

    public function discussions(Request $request, $course_id)
    {
        $user = $request->user();
        $userRoles = $user->roles()->pluck('name')->toArray();

        $course = Course::with(['discussions.user'])->findOrFail($course_id);

        // Allow admins, allow instructors who own the course, otherwise require enrollment
        if (in_array('admin', $userRoles)) {
            // admins may view any course
        } elseif (in_array('instructor', $userRoles)) {
            // instructors may view courses they teach
            if ($course->instructor_id !== $user->id) {
                abort(403, 'You do not have permission to view this course.');
            }
        } else {
            // students must be enrolled
            if (!$user->enrolledCourses()->where('course_id', $course->id)->exists()) {
                abort(403, 'You are not enrolled in this course.');
            }
        }

        return Inertia::render('discussions/index', [
            'course' => $course,
            'discussions' => $course->discussions,
        ]);
    }
    public function quizResults(Request $request, \App\Models\Course $course, Quiz $quiz, QuizAttempt $attempt)
    {
        return Inertia::render('quizzes/results', [
            'course' => $course,
            'quiz' => $quiz,
            'attempt' => $attempt,
            'questions' => $quiz->questions,
            'total_points' => $quiz->questions()->sum('points'),
        ]);
    }

    public function viewDiscussion(Request $request, $course_id, $discussion_id) {
        $user = $request->user();
        $userRoles = $user->roles()->pluck('name')->toArray();

        $course = Course::with(['discussions.user'])->findOrFail($course_id);
        $discussion = $course->discussions()->findOrFail($discussion_id);

        return Inertia::render('discussions/view', [
            'course' => $course,
            'discussion' => $discussion,
            'replies' => $discussion->replies
        ]);
    }

    public function apiGetAllCourses(Request $request) {
        $user = $request->user();

        return $user->courses()->get();
    }

    public function apiGetAllDeadlines(Request $request) {
        $user = $request->user();

        return $user->enrolledCourses()->with('assignments')->get()->pluck('assignments')->flatten();
    }

    public function apiGetAnnouncements(Request $request) {
        $user = $request->user();

        return $user->enrolledCourses()->with('announcements')->get()->pluck('announcements')->flatten();
    }

    public function apiGetAssignments(Request $request) {
        $user = $request->user();

        return $user->enrolledCourses()->with('assignments')->get()->pluck('assignments')->flatten()
            ->map(function ($assignment) use ($user) {
                return [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'description' => $assignment->description,
                    'due_date' => $assignment->due_date,
                    'points_possible' => $assignment->points_possible,
                    'submission_types' => $assignment->submission_types ?? [],
                    'course_id' => $assignment->course_id,
                    'course' => $assignment->course,
                    'is_submitted' => $assignment->submissions()->where('user_id', $user->id)->exists(),
                    'created_at' => $assignment->created_at,
                    'updated_at' => $assignment->updated_at,
                ];
            });
    }

    public function apiEnrollCourse(Request $request) {
        $user = $request->user();
        $course = $request->course;

        return $user->courses()->attach($course);
    }

    public function submitAssignment(Request $request, Course $course, Assignment $assignment)
    {
        $submission = $assignment->submissions()->where('user_id', $request->user()->id)->first();

        return Inertia::render('assignments/submit', [
            'course' => $course,
            'assignment' => $assignment,
            'submission' => $submission,
        ]);
    }

    public function showAssignment(Request $request, Course $course, Assignment $assignment)
    {
        $submission = $assignment->submissions()->where('user_id', $request->user()->id)->first();

        return Inertia::render('assignments/show', [
            'course' => $course,
            'assignment' => $assignment,
            'submission' => $submission,
        ]);
    }
}
