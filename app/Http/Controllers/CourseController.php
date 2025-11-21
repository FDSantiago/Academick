<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Course;
use App\Models\User;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Pass user role information to the frontend
        $userRoles = $user->roles()->pluck('name')->toArray();
        
        return Inertia::render('courses/index', [
            'userRoles' => $userRoles
        ]);
    }
    
    public function apiGetCoursesByRole(Request $request)
    {
        $user = $request->user();
        $userRoles = $user->roles()->pluck('name')->toArray();
        
        if (in_array('admin', $userRoles)) {
            // Admin: get all courses
            $courses = Course::with('instructor')->get();
        } elseif (in_array('instructor', $userRoles)) {
            // Instructor: get courses they manage
            $courses = $user->courses()->with('instructor')->get();
        } else {
            // Student: get courses they're enrolled in
            $courses = $user->enrolledCourses()->with('instructor')->get();
        }
        
        // Transform the data to match the frontend expectations
        $courses = $courses->map(function ($course) {
            return [
                'id' => $course->id,
                'title' => $course->title,
                'course_code' => $course->course_code,
                'description' => $course->description,
                'instructor_id' => $course->instructor_id,
                'instructor' => $course->instructor,
                'status' => $course->status,
                'created_at' => $course->created_at,
                'updated_at' => $course->updated_at,
                'color' => $course->color,
                'image_url' => $course->image_url
            ];
        });
        
        return response()->json($courses);
    }
    
    public function show(Request $request, $course_id)
    {
        $user = $request->user();
        $userRoles = $user->roles()->pluck('name')->toArray();

        // Fetch the specific course by ID with related data
        $course = Course::with(['instructor', 'announcements', 'assignments', 'modules', 'discussions'])->findOrFail($course_id);

        // Check if the user has permission to view this course
        if (in_array('admin', $userRoles)) {
            // Admins can view any course
        } elseif (in_array('instructor', $userRoles)) {
            // Instructors can only view courses they manage
            if ($course->instructor_id !== $user->id) {
                abort(403, 'You do not have permission to view this course.');
            }
        } else {
            // Students can only view courses they're enrolled in
            if (!$user->enrolledCourses()->where('course_id', $course_id)->exists()) {
                abort(403, 'You are not enrolled in this course.');
            }
        }

        // Get enrollment count for the course
        $enrollmentCount = $course->enrollments()->count();

        // Transform announcements for frontend
        $announcements = $course->announcements->map(function ($announcement) {
            return [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'content' => $announcement->content,
                'created_at' => $announcement->created_at,
                'author' => $announcement->user,
                'is_read' => false, // TODO: Implement read status tracking
            ];
        });

        // Transform assignments for frontend
        $assignments = $course->assignments->map(function ($assignment) use ($user, $course) {
            return [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'description' => $assignment->description,
                'due_date' => $assignment->due_date,
                'points_possible' => $assignment->points_possible,
                'submission_types' => $assignment->submission_types ?? [],
                'course_id' => $assignment->course_id,
                'course' => $course,
                'is_submitted' => $assignment->submissions()->where('user_id', $user->id)->exists(),
                'created_at' => $assignment->created_at,
                'updated_at' => $assignment->updated_at,
            ];
        });

        return Inertia::render('courses/course-page', [
            'course' => $course,
            'userRoles' => $userRoles,
            'announcements' => $announcements,
            'assignments' => $assignments,
            'modules' => $course->modules,
            'discussions' => $course->discussions,
            'enrollmentCount' => $enrollmentCount,
        ]);
    }
}