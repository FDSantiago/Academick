<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseModule;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseModuleController extends Controller
{
    /**
     * Display a listing of modules for a course.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = CourseModule::with(['course', 'pages']);

        // Filter by course if provided
        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Only show modules the user has access to
        $query->accessibleBy($user);

        $modules = $query->orderBy('order')->orderBy('created_at', 'desc')->get();

        return response()->json($modules);
    }

    /**
     * Store a newly created module.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'order' => 'nullable|integer|min:0',
            'status' => 'nullable|string|in:draft,published,archived',
            'is_public' => 'nullable|boolean',
            'acl_permissions' => 'nullable|array',
        ]);

        // Check if user can create modules for this course
        $course = Course::findOrFail($data['course_id']);
        $canCreate = $user->roles()->where('name', 'admin')->exists() ||
                    $course->instructor_id === $user->id;

        if (!$canCreate) {
            return response()->json(['message' => 'Not authorized to create modules for this course'], 403);
        }

        // Set default values
        $data['status'] = $data['status'] ?? 'draft';
        $data['is_public'] = $data['is_public'] ?? false;

        // Auto-assign order if not provided
        if (!isset($data['order'])) {
            $maxOrder = CourseModule::where('course_id', $data['course_id'])->max('order') ?? 0;
            $data['order'] = $maxOrder + 1;
        }

        try {
            $module = CourseModule::create($data);
            $module->load(['course', 'pages']);

            return response()->json([
                'message' => 'Module created successfully',
                'module' => $module
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create module',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified module.
     */
    public function show(Request $request, CourseModule $module)
    {
        $user = $request->user();

        // Check access
        if (!$module->hasAccess($user)) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $module->load(['course', 'pages']);

        return response()->json($module);
    }

    /**
     * Update the specified module.
     */
    public function update(Request $request, CourseModule $module)
    {
        $user = $request->user();

        // Check if user can update this module
        $canUpdate = $user->roles()->where('name', 'admin')->exists() ||
                    $module->course->instructor_id === $user->id;

        if (!$canUpdate) {
            return response()->json(['message' => 'Not authorized to update this module'], 403);
        }

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'order' => 'sometimes|required|integer|min:0',
            'status' => 'sometimes|required|string|in:draft,published,archived',
            'is_public' => 'sometimes|required|boolean',
            'acl_permissions' => 'nullable|array',
        ]);

        try {
            $module->update($data);
            $module->load(['course', 'pages']);

            return response()->json([
                'message' => 'Module updated successfully',
                'module' => $module
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update module',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified module.
     */
    public function destroy(Request $request, CourseModule $module)
    {
        $user = $request->user();

        // Check if user can delete this module
        $canDelete = $user->roles()->where('name', 'admin')->exists() ||
                    $module->course->instructor_id === $user->id;

        if (!$canDelete) {
            return response()->json(['message' => 'Not authorized to delete this module'], 403);
        }

        try {
            $module->delete();

            return response()->json([
                'message' => 'Module deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete module',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Publish a module.
     */
    public function publish(Request $request, CourseModule $module)
    {
        $user = $request->user();

        // Check if user can publish this module
        $canPublish = $user->roles()->where('name', 'admin')->exists() ||
                     $module->course->instructor_id === $user->id;

        if (!$canPublish) {
            return response()->json(['message' => 'Not authorized to publish this module'], 403);
        }

        $module->publish();

        return response()->json([
            'message' => 'Module published successfully',
            'module' => $module->load(['course', 'pages'])
        ]);
    }

    /**
     * Archive a module.
     */
    public function archive(Request $request, CourseModule $module)
    {
        $user = $request->user();

        // Check if user can archive this module
        $canArchive = $user->roles()->where('name', 'admin')->exists() ||
                     $module->course->instructor_id === $user->id;

        if (!$canArchive) {
            return response()->json(['message' => 'Not authorized to archive this module'], 403);
        }

        $module->archive();

        return response()->json([
            'message' => 'Module archived successfully',
            'module' => $module->load(['course', 'pages'])
        ]);
    }

    /**
     * Reorder modules within a course.
     */
    public function reorder(Request $request, $courseId)
    {
        $user = $request->user();

        $data = $request->validate([
            'module_orders' => 'required|array',
            'module_orders.*.id' => 'required|exists:course_modules,id',
            'module_orders.*.order' => 'required|integer|min:0',
        ]);

        // Check if user can reorder modules for this course
        $course = Course::findOrFail($courseId);
        $canReorder = $user->roles()->where('name', 'admin')->exists() ||
                     $course->instructor_id === $user->id;

        if (!$canReorder) {
            return response()->json(['message' => 'Not authorized to reorder modules for this course'], 403);
        }

        try {
            foreach ($data['module_orders'] as $moduleOrder) {
                CourseModule::where('id', $moduleOrder['id'])
                           ->where('course_id', $courseId)
                           ->update(['order' => $moduleOrder['order']]);
            }

            return response()->json([
                'message' => 'Modules reordered successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reorder modules',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
