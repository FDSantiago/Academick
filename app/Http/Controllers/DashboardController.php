<?php

namespace App\Http\Controllers;

use App\Http\Controllers\StudentCourseController;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $studentCourseController = new StudentCourseController();

        $courses = $studentCourseController->apiGetAllCourses($request);
        $announcements = $studentCourseController->apiGetAnnouncements($request);
        $assignments = $studentCourseController->apiGetAssignments($request);

        return Inertia::render('dashboard', [
            'courses' => $courses,
            'announcements' => $announcements,
            'assignments' => $assignments,
        ]);
    }
}
