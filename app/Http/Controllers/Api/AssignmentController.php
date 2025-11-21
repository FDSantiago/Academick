<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreAssignmentRequest;
use App\Models\Assignment;
use App\Models\Course;
use App\Services\AclService;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    protected $aclService;

    public function __construct(AclService $aclService)
    {
        $this->aclService = $aclService;
    }

    /**
     * Get all assignments for a course (instructor view) or all courses if no course specified
     */
    public function index(Request $request, Course $course = null)
    {
        $user = $request->user();

        if ($course) {
            // Course-specific assignments
            if (!$this->isInstructor($user, $course)) {
                return response()->json(['message' => 'Not authorized'], 403);
            }

            $assignments = Assignment::where('course_id', $course->id)
                ->with(['submissions', 'grades'])
                ->withCount(['submissions', 'grades'])
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            // All assignments for instructor's courses
            $courseIds = $this->getInstructorCourseIds($user);
            $assignments = Assignment::whereIn('course_id', $courseIds)
                ->with(['submissions', 'grades', 'course'])
                ->withCount(['submissions', 'grades'])
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json($assignments);
    }

    /**
     * Create a new assignment
     */
    public function store(StoreAssignmentRequest $request, Course $course = null)
    {
        $data = $request->validated();

        $targetCourse = $course ?? Course::find($data['course_id']);

        try {
            $assignment = Assignment::create([
                'title' => $data['title'],
                'description' => $data['description'],
                'course_id' => $targetCourse->id,
                'due_date' => $data['due_date'],
                'points' => $data['points'],
                'submission_type' => $data['submission_type'],
            ]);

            // Set default permissions
            $this->aclService->setupDefaultPermissions($assignment);

            return response()->json([
                'message' => 'Assignment created successfully.',
                'assignment' => $assignment,
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to create assignment.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an assignment
     */
    public function update(Request $request, Course $course, Assignment $assignment)
    {
        $user = $request->user();
        if (!$this->isInstructor($user, $course) || !$this->aclService->hasPermission($user, $assignment, 'manage')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        // Ensure assignment belongs to course
        if ($assignment->course_id !== $course->id) {
            return response()->json(['message' => 'Assignment not found for this course'], 404);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'due_date' => 'required|date',
            'points' => 'required|numeric|min:0',
            'submission_type' => 'required|string|in:text,file,both',
        ]);

        try {
            $assignment->update([
                'title' => $data['title'],
                'description' => $data['description'],
                'due_date' => $data['due_date'],
                'points' => $data['points'],
                'submission_type' => $data['submission_type'],
            ]);

            return response()->json([
                'message' => 'Assignment updated successfully.',
                'assignment' => $assignment,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to update assignment.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an assignment
     */
    public function destroy(Request $request, Course $course, Assignment $assignment)
    {
        $user = $request->user();
        if (!$this->isInstructor($user, $course) || !$this->aclService->hasPermission($user, $assignment, 'manage')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        // Ensure assignment belongs to course
        if ($assignment->course_id !== $course->id) {
            return response()->json(['message' => 'Assignment not found for this course'], 404);
        }

        try {
            $assignment->delete();

            return response()->json([
                'message' => 'Assignment deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to delete assignment.',
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