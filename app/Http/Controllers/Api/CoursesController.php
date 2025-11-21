<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCourseRequest;
use App\Http\Requests\Api\UpdateCourseRequest;
use App\Http\Resources\CourseResource;
use App\Http\Resources\EnrollmentResource;
use App\Http\Resources\ModuleResource;
use App\Http\Resources\AssignmentResource;
use App\Http\Resources\QuizResource;
use App\Http\Resources\SubmissionResource;
use App\Http\Resources\DiscussionResource;
use App\Http\Resources\AnnouncementResource;
use App\Http\Resources\GradebookResource;
use App\Http\Resources\CalendarEventResource;
use App\Http\Resources\FileResource;
use App\Http\Resources\MessageResource;
use App\Models\Course;
use App\Models\Assignment;
use App\Models\Quiz;
use App\Models\Discussion;
use App\Models\Announcement;
use App\Models\Grade;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Database\Eloquent\Builder;

class CoursesController extends Controller
{
    /**
     * Display a listing of courses.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Course::query();

        // Apply role-based filtering
        if (Gate::denies('viewAny', Course::class)) {
            if ($user->roles()->where('name', 'instructor')->exists()) {
                $query->where('instructor_id', $user->id);
            } elseif ($user->roles()->where('name', 'student')->exists()) {
                $query->whereHas('enrollments', function (Builder $q) use ($user) {
                    $q->where('user_id', $user->id)->where('status', 'active');
                });
            } else {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        // Apply filters
        if ($request->has('search')) {
            $query->where(function (Builder $q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('course_code', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('instructor_id')) {
            $query->where('instructor_id', $request->instructor_id);
        }

        // Paginate results
        $perPage = $request->get('per_page', 15);
        $courses = $query->with(['instructor', 'enrollments'])->paginate($perPage);

        return response()->json(CourseResource::collection($courses));
    }

    /**
     * Display the specified course.
     */
    public function show(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('view', $course);

        $course->load(['instructor', 'enrollments.user', 'modules', 'assignments', 'quizzes', 'discussions', 'announcements']);

        return response()->json(new CourseResource($course));
    }

    /**
     * Update the specified course.
     */
    public function update(UpdateCourseRequest $request, Course $course): JsonResponse
    {
        Gate::authorize('update', $course);

        try {
            $course->update($request->validated());
            $course->load(['instructor', 'enrollments']);

            return response()->json([
                'message' => 'Course updated successfully.',
                'course' => new CourseResource($course)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update course.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get enrollments for the specified course.
     */
    public function getEnrollments(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('viewEnrollments', $course);

        $query = $course->enrollments()->with('user');

        // Apply filters
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 15);
        $enrollments = $query->paginate($perPage);

        return response()->json(EnrollmentResource::collection($enrollments));
    }

    /**
     * Get modules for the specified course.
     */
    public function getModules(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('view', $course);

        $query = $course->modules()->with(['resources']);

        // Apply filters
        if ($request->has('published')) {
            $query->where('published', $request->boolean('published'));
        }

        $perPage = $request->get('per_page', 15);
        $modules = $query->paginate($perPage);

        return response()->json(ModuleResource::collection($modules));
    }

    /**
     * Get assignments for the specified course.
     */
    public function getAssignments(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('view', $course);

        $query = $course->assignments()->with(['attachments', 'submissions']);

        // Apply filters
        if ($request->has('published')) {
            $query->where('published', $request->boolean('published'));
        }

        if ($request->has('due_after')) {
            $query->where('due_date', '>', $request->due_after);
        }

        if ($request->has('due_before')) {
            $query->where('due_date', '<', $request->due_before);
        }

        $perPage = $request->get('per_page', 15);
        $assignments = $query->paginate($perPage);

        return response()->json(AssignmentResource::collection($assignments));
    }

    /**
     * Get quizzes for the specified course.
     */
    public function getQuizzes(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('view', $course);

        $query = $course->quizzes()->with(['questions.options', 'attempts']);

        // Apply filters
        if ($request->has('published')) {
            $query->where('published', $request->boolean('published'));
        }

        $perPage = $request->get('per_page', 15);
        $quizzes = $query->paginate($perPage);

        return response()->json(QuizResource::collection($quizzes));
    }

    /**
     * Get submissions for the specified course.
     */
    public function getSubmissions(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('viewSubmissions', $course);

        $query = \App\Models\AssignmentSubmission::whereHas('assignment', function (Builder $q) use ($course) {
            $q->where('course_id', $course->id);
        })->with(['assignment', 'user']);

        // Apply filters
        if ($request->has('assignment_id')) {
            $query->where('assignment_id', $request->assignment_id);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('graded')) {
            $graded = $request->boolean('graded');
            $query->where('graded', $graded);
        }

        $perPage = $request->get('per_page', 15);
        $submissions = $query->paginate($perPage);

        return response()->json(SubmissionResource::collection($submissions));
    }

    /**
     * Get discussions for the specified course.
     */
    public function getDiscussions(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('view', $course);

        $query = $course->discussions()->with(['replies.user', 'user']);

        // Apply filters
        if ($request->has('pinned')) {
            $query->where('pinned', $request->boolean('pinned'));
        }

        $perPage = $request->get('per_page', 15);
        $discussions = $query->paginate($perPage);

        return response()->json(DiscussionResource::collection($discussions));
    }

    /**
     * Get announcements for the specified course.
     */
    public function getAnnouncements(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('view', $course);

        $query = $course->announcements()->with('user');

        // Apply filters
        if ($request->has('published')) {
            $query->where('published', $request->boolean('published'));
        }

        $perPage = $request->get('per_page', 15);
        $announcements = $query->paginate($perPage);

        return response()->json(AnnouncementResource::collection($announcements));
    }

    /**
     * Get gradebook for the specified course.
     */
    public function getGradebook(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('viewGradebook', $course);

        $query = Grade::whereHas('assignment', function (Builder $q) use ($course) {
            $q->where('course_id', $course->id);
        })->with(['assignment', 'user']);

        // Apply filters
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('assignment_id')) {
            $query->where('assignment_id', $request->assignment_id);
        }

        $perPage = $request->get('per_page', 15);
        $grades = $query->paginate($perPage);

        return response()->json(GradebookResource::collection($grades));
    }

    /**
     * Get calendar events for the specified course.
     */
    public function getCalendar(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('view', $course);

        // Placeholder for calendar events - would need CalendarEvent model
        return response()->json([
            'message' => 'Calendar events feature not yet implemented',
            'data' => []
        ], 200);
    }

    /**
     * Get files for the specified course.
     */
    public function getFiles(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('view', $course);

        // Placeholder for files - would need File model
        return response()->json([
            'message' => 'Files feature not yet implemented',
            'data' => []
        ], 200);
    }

    /**
     * Get inbox messages for the specified course.
     */
    public function getInbox(Request $request, Course $course): JsonResponse
    {
        Gate::authorize('view', $course);

        // Placeholder for inbox messages - would need Message model
        return response()->json([
            'message' => 'Inbox feature not yet implemented',
            'data' => []
        ], 200);
    }
}