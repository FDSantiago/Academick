<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Course;
use App\Models\CourseModule;
use App\Services\AclService;
use App\Http\Requests\Api\StorePageRequest;
use App\Http\Requests\Api\UpdatePageRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PageController extends Controller
{
    protected $aclService;

    public function __construct(AclService $aclService)
    {
        $this->aclService = $aclService;
    }

    /**
     * Display a listing of pages for a course or module.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Page::with(['course', 'module', 'creator']);

        // Filter by course if provided
        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        // Filter by module if provided
        if ($request->has('module_id')) {
            $query->where('module_id', $request->module_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Only show pages the user has access to
        $query->where(function ($q) use ($user) {
            $q->where('is_public', true)
              ->orWhere('created_by', $user->id)
              ->orWhere(function ($subQ) use ($user) {
                  // Check ACL permissions using the new system
                  $subQ->whereHas('aclEntries', function ($aclQ) use ($user) {
                      $aclQ->ofType('view')->forUser($user);
                  });
              });
        });

        $pages = $query->orderBy('order')->orderBy('created_at', 'desc')->get();

        return response()->json($pages);
    }

    /**
     * Store a newly created page.
     */
    public function store(StorePageRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        // Generate slug if not provided
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
            // Ensure uniqueness
            $originalSlug = $data['slug'];
            $counter = 1;
            while (Page::where('slug', $data['slug'])->exists()) {
                $data['slug'] = $originalSlug . '-' . $counter;
                $counter++;
            }
        }

        $data['created_by'] = $user->id;

        // Auto-assign order if not provided and module is specified
        if (!isset($data['order']) && isset($data['module_id'])) {
            $maxOrder = Page::where('module_id', $data['module_id'])->max('order') ?? 0;
            $data['order'] = $maxOrder + 1;
        }

        try {
            $page = Page::create($data);
            $page->load(['course', 'module', 'creator']);

            // Set up default ACL permissions for the new page
            $this->aclService->setupDefaultPermissions($page);

            return response()->json([
                'message' => 'Page created successfully',
                'page' => $page
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create page',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified page.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();

        $page = Page::with(['course', 'module', 'creator'])->findOrFail($id);

        // Check access using ACL service
        if (!$this->aclService->hasPermission($user, $page, 'view')) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        return response()->json($page);
    }

    /**
     * Update the specified page.
     */
    public function update(UpdatePageRequest $request, Page $page)
    {
        $data = $request->validated();

        // Generate slug if title changed and slug not provided
        if (isset($data['title']) && !isset($data['slug'])) {
            $data['slug'] = Str::slug($data['title']);
            // Ensure uniqueness
            $originalSlug = $data['slug'];
            $counter = 1;
            while (Page::where('slug', $data['slug'])->where('id', '!=', $page->id)->exists()) {
                $data['slug'] = $originalSlug . '-' . $counter;
                $counter++;
            }
        }

        try {
            $page->update($data);
            $page->load(['course', 'module', 'creator']);

            return response()->json([
                'message' => 'Page updated successfully',
                'page' => $page
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update page',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified page.
     */
    public function destroy(Request $request, Page $page)
    {
        $user = $request->user();

        // Check if user can delete this page using ACL
        if (!$this->aclService->hasPermission($user, $page, 'delete')) {
            return response()->json(['message' => 'Not authorized to delete this page'], 403);
        }

        try {
            $page->delete();

            return response()->json([
                'message' => 'Page deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete page',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reorder pages within a module.
     */
    public function reorder(Request $request, $moduleId)
    {
        $user = $request->user();

        $data = $request->validate([
            'page_orders' => 'required|array',
            'page_orders.*.id' => 'required|exists:pages,id',
            'page_orders.*.order' => 'required|integer|min:0',
        ]);

        // Check if user can reorder pages for this module using ACL
        $module = CourseModule::findOrFail($moduleId);
        if (!$this->aclService->hasPermission($user, $module, 'manage')) {
            return response()->json(['message' => 'Not authorized to reorder pages for this module'], 403);
        }

        try {
            foreach ($data['page_orders'] as $pageOrder) {
                Page::where('id', $pageOrder['id'])
                    ->where('module_id', $moduleId)
                    ->update(['order' => $pageOrder['order']]);
            }

            return response()->json([
                'message' => 'Pages reordered successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reorder pages',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a page by slug.
     */
    public function showBySlug(Request $request, string $slug)
    {
        $user = $request->user();

        $page = Page::with(['course', 'module', 'creator'])
                   ->where('slug', $slug)
                   ->firstOrFail();

        // Check access using ACL service
        if (!$this->aclService->hasPermission($user, $page, 'view')) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        return response()->json($page);
    }

    /**
     * Publish a page.
     */
    public function publish(Request $request, Page $page)
    {
        $user = $request->user();

        // Check if user can publish this page using ACL
        if (!$this->aclService->hasPermission($user, $page, 'manage')) {
            return response()->json(['message' => 'Not authorized to publish this page'], 403);
        }

        $page->publish();

        return response()->json([
            'message' => 'Page published successfully',
            'page' => $page->load(['course', 'module', 'creator'])
        ]);
    }

    /**
     * Archive a page.
     */
    public function archive(Request $request, Page $page)
    {
        $user = $request->user();

        // Check if user can archive this page using ACL
        if (!$this->aclService->hasPermission($user, $page, 'manage')) {
            return response()->json(['message' => 'Not authorized to archive this page'], 403);
        }

        $page->archive();

        return response()->json([
            'message' => 'Page archived successfully',
            'page' => $page->load(['course', 'module', 'creator'])
        ]);
    }
}
