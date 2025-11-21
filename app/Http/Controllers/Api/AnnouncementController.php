<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Announcement;
use App\Models\Course;
use App\Services\AclService;

class AnnouncementController extends Controller
{
    protected $aclService;

    public function __construct(AclService $aclService)
    {
        $this->aclService = $aclService;
    }

    /**
     * Get all announcements for a course (instructor view) or all courses if no course specified
     */
    public function index(Request $request, Course $course = null)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        if ($course) {
            // Course-specific announcements
            if (!$this->isInstructor($user, $course)) {
                return response()->json(['message' => 'Not authorized'], 403);
            }

            $announcements = Announcement::where('course_id', $course->id)
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            // All announcements for instructor's courses
            $courseIds = $this->getInstructorCourseIds($user);
            $announcements = Announcement::whereIn('course_id', $courseIds)
                ->with(['user', 'course'])
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json($announcements);
    }

    /**
     * Create a new announcement
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
            'is_pinned' => 'boolean',
        ]);

        try {
            $announcement = Announcement::create([
                'title' => $data['title'],
                'content' => $data['content'],
                'course_id' => $course->id,
                'user_id' => $user->id,
                'is_pinned' => $data['is_pinned'] ?? false,
            ]);

            // Set default permissions
            $this->aclService->setupDefaultPermissions($announcement);

            $announcement->load('user');

            return response()->json([
                'message' => 'Announcement created successfully.',
                'announcement' => $announcement,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to create announcement.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an announcement
     */
    public function update(Request $request, Course $course, Announcement $announcement)
    {
        $user = $request->user();
        if (!$user || !$this->isInstructor($user, $course) || !$this->aclService->hasPermission($user, $announcement, 'manage')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        // Ensure announcement belongs to course
        if ($announcement->course_id !== $course->id) {
            return response()->json(['message' => 'Announcement not found for this course'], 404);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_pinned' => 'boolean',
        ]);

        try {
            $announcement->update([
                'title' => $data['title'],
                'content' => $data['content'],
                'is_pinned' => $data['is_pinned'] ?? $announcement->is_pinned,
            ]);

            $announcement->load('user');

            return response()->json([
                'message' => 'Announcement updated successfully.',
                'announcement' => $announcement,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to update announcement.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an announcement
     */
    public function destroy(Request $request, Course $course, Announcement $announcement)
    {
        $user = $request->user();
        if (!$user || !$this->isInstructor($user, $course) || !$this->aclService->hasPermission($user, $announcement, 'manage')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        // Ensure announcement belongs to course
        if ($announcement->course_id !== $course->id) {
            return response()->json(['message' => 'Announcement not found for this course'], 404);
        }

        try {
            $announcement->delete();

            return response()->json([
                'message' => 'Announcement deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to delete announcement.',
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
                $user->roles()->where('name', 'admin')->exists();
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