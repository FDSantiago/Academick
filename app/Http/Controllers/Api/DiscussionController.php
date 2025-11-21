<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Discussion;
use App\Models\Course;
use App\Services\AclService;

class DiscussionController extends Controller
{
    protected $aclService;

    public function __construct(AclService $aclService)
    {
        $this->aclService = $aclService;
    }

    /**
     * Get all discussions for a course (instructor view) or all courses if no course specified
     */
    public function index(Request $request, Course $course = null)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        if ($course) {
            // Course-specific discussions
            if (!$this->isInstructor($user, $course)) {
                return response()->json(['message' => 'Not authorized'], 403);
            }

            $discussions = Discussion::where('course_id', $course->id)
                ->with(['user', 'replies'])
                ->withCount(['replies'])
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            // All discussions for instructor's courses
            $courseIds = $this->getInstructorCourseIds($user);
            $discussions = Discussion::whereIn('course_id', $courseIds)
                ->with(['user', 'replies', 'course'])
                ->withCount(['replies'])
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json($discussions);
    }

    /**
     * Create a new discussion
     */
    public function store(Request $request, Course $course)
    {
        $user = $request->user();
        if (!$user || !$this->isInstructor($user, $course)) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'course_id' => 'required|string',
            'is_pinned' => 'boolean',
            'is_locked' => 'boolean',
        ]);

        try {
            $discussion = Discussion::create([
                'title' => $data['title'],
                'content' => $data['content'],
                'course_id' => $data['course_id'],
                'user_id' => $user->id,
                'is_pinned' => $data['is_pinned'] ?? false,
                'is_locked' => $data['is_locked'] ?? false,
            ]);

            // Set default permissions
            $this->aclService->setupDefaultPermissions($discussion);

            $discussion->load('user');

            return response()->json([
                'message' => 'Discussion created successfully.',
                'discussion' => $discussion,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to create discussion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a discussion
     */
    public function update(Request $request, Course $course, Discussion $discussion)
    {
        $user = $request->user();
        if (!$user || !$this->isInstructor($user, $course) || !$this->aclService->hasPermission($user, $discussion, 'manage')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        // Ensure discussion belongs to course
        if ($discussion->course_id !== $course->id) {
            return response()->json(['message' => 'Discussion not found for this course'], 404);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_pinned' => 'boolean',
            'is_locked' => 'boolean',
        ]);

        try {
            $discussion->update([
                'title' => $data['title'],
                'content' => $data['content'],
                'is_pinned' => $data['is_pinned'] ?? $discussion->is_pinned,
                'is_locked' => $data['is_locked'] ?? $discussion->is_locked,
            ]);

            $discussion->load('user');

            return response()->json([
                'message' => 'Discussion updated successfully.',
                'discussion' => $discussion,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to update discussion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a discussion
     */
    public function destroy(Request $request, Course $course, Discussion $discussion)
    {
        $user = $request->user();
        if (!$user || !$this->isInstructor($user, $course) || !$this->aclService->hasPermission($user, $discussion, 'manage')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        // Ensure discussion belongs to course
        if ($discussion->course_id !== $course->id) {
            return response()->json(['message' => 'Discussion not found for this course'], 404);
        }

        try {
            $discussion->delete();

            return response()->json([
                'message' => 'Discussion deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to delete discussion.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check if user is instructor for the course
     */
    private function isInstructor($user, Course $course): bool
    {
        return $course->instructor_id === $user->id ||
                $user->roles()->where('name', 'instructor')->exists();
    }

    /**
     * Get course IDs for which the user is an instructor
     */
    private function getInstructorCourseIds($user): array
    {
        if ($user->roles()->where('name', 'admin')->exists()) {
            return Course::pluck('id')->toArray();
        }

        return Course::where('instructor_id', $user->id)->pluck('id')->toArray();
    }
}