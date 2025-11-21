<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Assignment;
use App\Models\Course;

class AssignmentController extends Controller
{
    public function indexx(Request $request)
    {
        $user = $request->user();
        $userRoles = $user->roles()->pluck('name')->toArray();

        // Get courses and assignments based on user role
        if (in_array('admin', $userRoles)) {
            $courses = Course::select('id', 'title', 'course_code')->get();
            $assignments = Assignment::with('course:id,title')->get();
        } elseif (in_array('instructor', $userRoles)) {
            $courses = $user->courses()->select('id', 'title', 'course_code')->get();
            $courseIds = $courses->pluck('id');
            $assignments = Assignment::whereIn('course_id', $courseIds)->with('course:id,title')->get();
        } else { // Student
            $courses = $user->enrolledCourses()->select('courses.id', 'title', 'course_code')->get();
            $courseIds = $courses->pluck('id');
            $assignments = Assignment::whereIn('course_id', $courseIds)->with('course:id,title')->get();
        }

        return Inertia::render('assignments/index', [
            'courses' => $courses,
            'assignments' => $assignments,
            'userRoles' => $userRoles,
        ]);
    }

    public function submit() {
        Inertia::render('assignments/submit');
    }
}
