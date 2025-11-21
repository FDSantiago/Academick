<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseManagementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || ! $user->roles()->pluck('name')->contains('admin')) {
            abort(404);
        }

        return Inertia::render('admin/courses/index');
    }
}