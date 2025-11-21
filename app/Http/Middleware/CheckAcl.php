<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckAcl
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $permission  The permission to check (view, edit, delete, manage)
     * @param  string|null  $model  The model class name (optional, will try to infer from route)
     * @param  string|null  $param  The route parameter name containing the model ID (default: 'id')
     */
    public function handle(Request $request, Closure $next, string $permission, ?string $model = null, ?string $param = 'id'): Response
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // If no model specified, try to infer from route
        if (!$model) {
            $model = $this->inferModelFromRoute($request);
        }

        if (!$model) {
            return response()->json(['message' => 'Unable to determine content model'], 400);
        }

        // Get the model instance
        $modelId = $request->route($param);
        if (!$modelId) {
            return response()->json(['message' => 'Content ID not found in route'], 400);
        }

        $content = $model::find($modelId);
        if (!$content) {
            return response()->json(['message' => 'Content not found'], 404);
        }

        // Check if user has the required permission
        if (!$content->hasPermission($user, $permission)) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        return $next($request);
    }

    /**
     * Try to infer the model class from the current route.
     */
    protected function inferModelFromRoute(Request $request): ?string
    {
        $routeName = $request->route()->getName();

        // Map common route patterns to models
        $modelMap = [
            'pages' => \App\Models\Page::class,
            'assignments' => \App\Models\Assignment::class,
            'quizzes' => \App\Models\Quiz::class,
            'discussions' => \App\Models\Discussion::class,
            'announcements' => \App\Models\Announcement::class,
            'modules' => \App\Models\CourseModule::class,
        ];

        foreach ($modelMap as $key => $model) {
            if (str_contains($routeName, $key)) {
                return $model;
            }
        }

        return null;
    }
}
