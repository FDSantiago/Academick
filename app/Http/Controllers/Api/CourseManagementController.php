<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Course;
use App\Models\User;

class CourseManagementController extends Controller
{
    public function getCourses(Request $request)
    {
        $user = $request->user();
        if (!$user || ! $user->roles()->pluck('name')->contains('admin')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }
        
        // Get all courses with their instructors
        $courses = Course::all();
        
        return $courses;
    }

    /**
     * Handle creating a new course.
     *
     * Returns JSON with a success message on success, or validation/errors
     * are returned as JSON with appropriate status codes so the frontend
     * (dialog) can display them without a full redirect.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || ! $user->roles()->pluck('name')->contains('admin')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'course_code' => 'required|string|unique:courses,course_code|max:20',
            'instructor_id' => 'required|exists:users,id',
            'status' => 'required|string|in:active,inactive',
        ]);

        try {
            $course = Course::create([
                'title' => $data['title'],
                'description' => $data['description'],
                'course_code' => $data['course_code'],
                'instructor_id' => $data['instructor_id'],
                'status' => $data['status'],
            ]);

            // Load the instructor relationship
            $course->load('instructor');

            return response()->json([
                'message' => 'Course created successfully.',
                'course' => [
                    'id' => $course->id,
                    'title' => $course->title,
                    'description' => $course->description,
                    'course_code' => $course->course_code,
                    'instructor' => $course->instructor,
                    'status' => $course->status,
                ],
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to create course.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Update an existing course
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || ! $user->roles()->pluck('name')->contains('admin')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'course_code' => 'required|string|unique:courses,course_code,'.$id.'|max:20',
            'instructor_id' => 'required|exists:users,id',
            'status' => 'required|string|in:active,inactive',
        ]);

        try {
            $course = Course::findOrFail($id);
            
            $course->update([
                'title' => $data['title'],
                'description' => $data['description'],
                'course_code' => $data['course_code'],
                'instructor_id' => $data['instructor_id'],
                'status' => $data['status'],
            ]);

            // Load the instructor relationship
            $course->load('instructor');

            return response()->json([
                'message' => 'Course updated successfully.',
                'course' => [
                    'id' => $course->id,
                    'title' => $course->title,
                    'description' => $course->description,
                    'course_code' => $course->course_code,
                    'instructor' => $course->instructor,
                    'status' => $course->status,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to update course.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Delete a course
     */
    public function destroy($id, Request $request)
    {
        $user = $request->user();
        if (!$user || ! $user->roles()->pluck('name')->contains('admin')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        try {
            $course = Course::findOrFail($id);
            $course->delete();

            return response()->json([
                'message' => 'Course deleted successfully.',
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to delete course.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Get students enrolled in a course
     */
    public function getStudentsInCourse(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || ! $user->roles()->pluck('name')->contains('admin')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        try {
            $course = Course::findOrFail($id);
            $students = $course->students()->get();
            
            return response()->json($students, 200);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to fetch students.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Add students to a course
     */
    public function addStudentsToCourse(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || ! $user->roles()->pluck('name')->contains('admin')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        $data = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:users,id',
        ]);

        try {
            $course = Course::findOrFail($id);
            
            // Sync students with the course (this will replace existing enrollments)
            $course->students()->sync($data['student_ids']);
            
            return response()->json([
                'message' => 'Students updated for course successfully.',
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to update students for course.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Remove a student from a course
     */
    public function removeStudentFromCourse(Request $request, $courseId, $studentId)
    {
        $user = $request->user();
        if (!$user || ! $user->roles()->pluck('name')->contains('admin')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        try {
            $course = Course::findOrFail($courseId);
            
            // Detach student from the course
            $course->students()->detach($studentId);
            
            return response()->json([
                'message' => 'Student removed from course successfully.',
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to remove student from course.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}