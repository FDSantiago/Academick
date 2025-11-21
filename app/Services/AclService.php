<?php

namespace App\Services;

use App\Models\AclEntry;
use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Eloquent\Model;

class AclService
{
    /**
     * Check if a user has a specific permission on content.
     */
    public function hasPermission(User $user, Model $content, string $permission): bool
    {
        // Admins have all permissions
        if ($user->roles()->where('name', 'admin')->exists()) {
            return true;
        }

        return $content->hasPermission($user, $permission);
    }

    /**
     * Grant a permission to a role or user on specific content.
     */
    public function grantPermission(Model $content, string $permissionType, string $granteeType, int $granteeId): void
    {
        $content->grantPermission($permissionType, $granteeType, $granteeId);
    }

    /**
     * Revoke a permission from a role or user on specific content.
     */
    public function revokePermission(Model $content, string $permissionType, string $granteeType, int $granteeId): void
    {
        $content->revokePermission($permissionType, $granteeType, $granteeId);
    }

    /**
     * Get all permissions a user has on specific content.
     */
    public function getUserPermissions(User $user, Model $content): array
    {
        return $content->getUserPermissions($user);
    }

    /**
     * Set up default permissions for newly created content.
     * This method should be called when content is created.
     */
    public function setupDefaultPermissions(Model $content): void
    {
        // Call the content's setDefaultPermissions method
        if (method_exists($content, 'setDefaultPermissions')) {
            $content->setDefaultPermissions();
        }
    }

    /**
     * Make content public by granting view permission to students.
     */
    public function makeContentPublic(Model $content): void
    {
        $content->makePublic();
    }

    /**
     * Make content private by removing all ACL entries.
     */
    public function makeContentPrivate(Model $content): void
    {
        $content->makePrivate();
    }

    /**
     * Get all content accessible by a user with specific permissions.
     */
    public function getAccessibleContent(User $user, string $contentType, string $permission = 'view'): \Illuminate\Database\Eloquent\Collection
    {
        $modelClass = $this->getModelClass($contentType);

        if (!$modelClass) {
            return collect();
        }

        return $modelClass::whereHas('aclEntries', function ($query) use ($user, $permission) {
            $query->ofType($permission)->forUser($user);
        })->get();
    }

    /**
     * Get content created by a user (where they have manage permission).
     */
    public function getUserCreatedContent(User $user, string $contentType): \Illuminate\Database\Eloquent\Collection
    {
        $modelClass = $this->getModelClass($contentType);

        if (!$modelClass) {
            return collect();
        }

        return $modelClass::whereHas('aclEntries', function ($query) use ($user) {
            $query->ofType('manage')
                  ->where('grantee_type', 'user')
                  ->where('grantee_id', $user->id);
        })->get();
    }

    /**
     * Bulk grant permissions to multiple content items.
     */
    public function bulkGrantPermissions(array $contentIds, string $contentType, string $permissionType, string $granteeType, int $granteeId): void
    {
        $modelClass = $this->getModelClass($contentType);

        if (!$modelClass) {
            return;
        }

        $entries = [];
        foreach ($contentIds as $contentId) {
            $entries[] = [
                'content_type' => $modelClass,
                'content_id' => $contentId,
                'permission_type' => $permissionType,
                'grantee_type' => $granteeType,
                'grantee_id' => $granteeId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        AclEntry::insert($entries);
    }

    /**
     * Bulk revoke permissions from multiple content items.
     */
    public function bulkRevokePermissions(array $contentIds, string $contentType, string $permissionType, string $granteeType, int $granteeId): void
    {
        $modelClass = $this->getModelClass($contentType);

        if (!$modelClass) {
            return;
        }

        AclEntry::where('content_type', $modelClass)
            ->whereIn('content_id', $contentIds)
            ->where('permission_type', $permissionType)
            ->where('grantee_type', $granteeType)
            ->where('grantee_id', $granteeId)
            ->delete();
    }

    /**
     * Get model class from content type string.
     */
    protected function getModelClass(string $contentType): ?string
    {
        $modelMap = [
            'page' => \App\Models\Page::class,
            'assignment' => \App\Models\Assignment::class,
            'quiz' => \App\Models\Quiz::class,
            'discussion' => \App\Models\Discussion::class,
            'announcement' => \App\Models\Announcement::class,
            'module' => \App\Models\CourseModule::class,
        ];

        return $modelMap[$contentType] ?? null;
    }

    /**
     * Check if a user can perform an action on content based on course enrollment and role.
     */
    public function canAccessBasedOnCourse(User $user, Model $content, string $permission = 'view'): bool
    {
        // If content has explicit ACL permissions, use those
        if ($content->aclEntries()->exists()) {
            return $this->hasPermission($user, $content, $permission);
        }

        // Fallback to course-based access
        if (method_exists($content, 'course') && $content->course) {
            $course = $content->course;

            // Course instructors have access to all content in their courses
            if ($course->instructor_id === $user->id) {
                return true;
            }

            // Teaching assistants have access to content in courses they assist
            if ($user->roles()->where('name', 'teaching_assistant')->exists()) {
                // TODO: Implement teaching assistant course assignments
                // For now, assume they have access to all courses
                return true;
            }

            // Students have view access to content in enrolled courses
            if ($permission === 'view' && $course->students()->where('users.id', $user->id)->exists()) {
                return true;
            }
        }

        return false;
    }
}