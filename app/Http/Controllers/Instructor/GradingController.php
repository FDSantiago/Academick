<?php

namespace App\Http\Controllers\Instructor;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Grade;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class GradingController extends Controller
{
    /**
     * Display the grading interface for a course.
     */
    public function index(Request $request, Course $course): Response
    {
        Gate::authorize('view', $course);

        // Get assignments for this course
        $assignments = Assignment::where('course_id', $course->id)
            ->withCount(['submissions', 'grades'])
            ->get()
            ->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'description' => $assignment->description,
                    'due_date' => $assignment->due_date,
                    'points' => $assignment->points,
                    'submission_type' => $assignment->submission_type,
                    'submissions_count' => $assignment->submissions_count,
                    'graded_count' => $assignment->grades_count,
                ];
            });

        // Get submissions based on filters
        $query = AssignmentSubmission::with(['user', 'assignment'])
            ->whereHas('assignment', function ($q) use ($course) {
                $q->where('course_id', $course->id);
            });

        // Apply assignment filter
        if ($request->has('assignment_id') && $request->assignment_id) {
            $query->where('assignment_id', $request->assignment_id);
        }

        // Apply status filter
        if ($request->has('status')) {
            if ($request->status === 'graded') {
                $query->where('graded', true);
            } elseif ($request->status === 'pending') {
                $query->where('graded', false);
            }
        }

        // Apply search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $submissions = $query->orderBy('created_at', 'desc')->get();

        $currentAssignment = null;
        if ($request->has('assignment_id') && $request->assignment_id) {
            $currentAssignment = $assignments->find($request->assignment_id);
        }

        return Inertia::render('instructor/grading/index', [
            'course' => $course,
            'assignments' => $assignments,
            'submissions' => $submissions,
            'currentAssignment' => $currentAssignment,
            'filters' => [
                'assignment_id' => $request->assignment_id,
                'status' => $request->status,
                'search' => $request->search,
            ],
        ]);
    }

    /**
     * Grade a specific submission.
     */
    public function gradeSubmission(Request $request, Course $course, AssignmentSubmission $submission): JsonResponse
    {
        Gate::authorize('manageGrades', $course);

        // Validate the request
        $request->validate([
            'grade' => 'required|numeric|min:0',
            'feedback' => 'nullable|string',
        ]);

        // Ensure the submission belongs to this course
        if ($submission->assignment->course_id !== $course->id) {
            return response()->json(['message' => 'Submission not found for this course'], 404);
        }

        // Update the submission
        $submission->update([
            'graded' => true,
            'grade' => $request->grade,
            'feedback' => $request->feedback,
            'graded_at' => now(),
        ]);

        // Create or update grade record
        Grade::updateOrCreate(
            [
                'user_id' => $submission->user_id,
                'assignment_id' => $submission->assignment_id,
            ],
            [
                'course_id' => $course->id,
                'points_earned' => $request->grade,
                'points_possible' => $submission->assignment->points,
                'comments' => $request->feedback,
            ]
        );

        return response()->json([
            'message' => 'Submission graded successfully',
            'submission' => $submission->load(['user', 'assignment']),
        ]);
    }

    /**
     * Bulk grade multiple submissions.
     */
    public function bulkGrade(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('manageGrades', $course);

        $request->validate([
            'submission_ids' => 'required|array',
            'submission_ids.*' => 'integer|exists:assignment_submissions,id',
            'grade' => 'required|numeric|min:0',
            'feedback' => 'nullable|string',
        ]);

        $submissions = AssignmentSubmission::whereIn('id', $request->submission_ids)
            ->whereHas('assignment', function ($q) use ($course) {
                $q->where('course_id', $course->id);
            })
            ->with(['assignment'])
            ->get();

        if ($submissions->isEmpty()) {
            return response()->json(['message' => 'No valid submissions found'], 404);
        }

        $gradedCount = 0;
        foreach ($submissions as $submission) {
            $submission->update([
                'graded' => true,
                'grade' => $request->grade,
                'feedback' => $request->feedback,
                'graded_at' => now(),
            ]);

            // Create or update grade record
            Grade::updateOrCreate(
                [
                    'user_id' => $submission->user_id,
                    'assignment_id' => $submission->assignment_id,
                ],
                [
                    'course_id' => $course->id,
                    'points_earned' => $request->grade,
                    'points_possible' => $submission->assignment->points,
                    'comments' => $request->feedback,
                ]
            );

            $gradedCount++;
        }

        return response()->json([
            'message' => "Successfully graded {$gradedCount} submissions",
        ]);
    }

    /**
     * Get grading statistics for a course.
     */
    public function getStatistics(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('view', $course);

        $assignments = Assignment::where('course_id', $course->id)
            ->with(['submissions', 'grades'])
            ->get();

        $stats = $assignments->map(function ($assignment) {
            $totalSubmissions = $assignment->submissions->count();
            $gradedSubmissions = $assignment->submissions->where('graded', true)->count();
            $averageGrade = $gradedSubmissions > 0
                ? $assignment->submissions->where('graded', true)->avg('grade')
                : null;

            return [
                'assignment_id' => $assignment->id,
                'assignment_title' => $assignment->title,
                'total_submissions' => $totalSubmissions,
                'graded_submissions' => $gradedSubmissions,
                'pending_submissions' => $totalSubmissions - $gradedSubmissions,
                'average_grade' => $averageGrade,
                'average_percentage' => $averageGrade ? round(($averageGrade / $assignment->points) * 100, 2) : null,
            ];
        });

        $overallStats = [
            'total_assignments' => $assignments->count(),
            'total_submissions' => $assignments->sum(function ($a) { return $a->submissions->count(); }),
            'total_graded' => $assignments->sum(function ($a) { return $a->submissions->where('graded', true)->count(); }),
            'average_grade_overall' => $stats->whereNotNull('average_grade')->avg('average_grade'),
        ];

        return response()->json([
            'assignment_stats' => $stats,
            'overall_stats' => $overallStats,
        ]);
    }

    /**
     * Get grade history for a specific submission.
     */
    public function getGradeHistory(Request $request, Course $course, AssignmentSubmission $submission): JsonResponse
    {
        Gate::authorize('view', $course);

        // Ensure the submission belongs to this course
        if ($submission->assignment->course_id !== $course->id) {
            return response()->json(['message' => 'Submission not found for this course'], 404);
        }

        // For now, return the current grade. In a full implementation,
        // you might want to track grade history in a separate table
        $history = [
            [
                'id' => 1,
                'grade' => $submission->grade,
                'feedback' => $submission->feedback,
                'graded_at' => $submission->graded_at,
                'graded_by' => 'Instructor', // You might want to track this
            ]
        ];

        return response()->json([
            'submission_id' => $submission->id,
            'history' => $history,
        ]);
    }
}