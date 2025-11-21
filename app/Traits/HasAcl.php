<?php

namespace App\Traits;

use App\Models\AclEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasAcl
{
    /**
     * Get the ACL entries for this content.
     */
    public function aclEntries(): MorphMany
    {
        return $this->morphMany(AclEntry::class, 'content');
    }

    /**
     * Grant a permission to a role or user.
     */
    public function grantPermission(string $permissionType, string $granteeType, int $granteeId): void
    {
        $this->aclEntries()->updateOrCreate([
            'permission_type' => $permissionType,
            'grantee_type' => $granteeType,
            'grantee_id' => $granteeId,
        ]);
    }

    /**
     * Revoke a permission from a role or user.
     */
    public function revokePermission(string $permissionType, string $granteeType, int $granteeId): void
    {
        $this->aclEntries()
            ->where('permission_type', $permissionType)
            ->where('grantee_type', $granteeType)
            ->where('grantee_id', $granteeId)
            ->delete();
    }

    /**
     * Check if a user has a specific permission on this content.
     */
    public function hasPermission(User $user, string $permissionType): bool
    {
        // Admins have all permissions
        if ($user->roles()->where('name', 'admin')->exists()) {
            return true;
        }

        // Check if user has the permission through ACL entries
        return $this->aclEntries()
            ->ofType($permissionType)
            ->forUser($user)
            ->exists();
    }

    /**
     * Check if a user can view this content.
     */
    public function canView(User $user): bool
    {
        return $this->hasPermission($user, 'view');
    }

    /**
     * Check if a user can edit this content.
     */
    public function canEdit(User $user): bool
    {
        return $this->hasPermission($user, 'edit');
    }

    /**
     * Check if a user can delete this content.
     */
    public function canDelete(User $user): bool
    {
        return $this->hasPermission($user, 'delete');
    }

    /**
     * Check if a user can manage this content (full access).
     */
    public function canManage(User $user): bool
    {
        return $this->hasPermission($user, 'manage');
    }

    /**
     * Get all permissions for a user on this content.
     */
    public function getUserPermissions(User $user): array
    {
        $permissions = [];

        if ($this->canView($user)) {
            $permissions[] = 'view';
        }
        if ($this->canEdit($user)) {
            $permissions[] = 'edit';
        }
        if ($this->canDelete($user)) {
            $permissions[] = 'delete';
        }
        if ($this->canManage($user)) {
            $permissions[] = 'manage';
        }

        return $permissions;
    }

    /**
     * Set default permissions for content creation.
     * This should be called when content is created.
     */
    public function setDefaultPermissions(): void
    {
        // Grant manage permission to the creator if available
        if (property_exists($this, 'created_by') && $this->created_by) {
            $this->grantPermission('manage', 'user', $this->created_by);
        }

        // Grant manage permission to course instructors if content belongs to a course
        if (method_exists($this, 'course') && $this->course && $this->course->instructor_id) {
            $this->grantPermission('manage', 'user', $this->course->instructor_id);
        }

        // Grant view permission to students enrolled in the course
        if (method_exists($this, 'course') && $this->course) {
            $studentRole = \App\Models\Role::where('name', 'student')->first();
            if ($studentRole) {
                $this->grantPermission('view', 'role', $studentRole->id);
            }
        }

        // If content is public, grant view permission to all students
        if (property_exists($this, 'is_public') && $this->is_public) {
            $studentRole = \App\Models\Role::where('name', 'student')->first();
            if ($studentRole) {
                $this->grantPermission('view', 'role', $studentRole->id);
            }
        }
    }

    /**
     * Make content public (grant view permission to all students).
     */
    public function makePublic(): void
    {
        // Grant view permission to student role
        $studentRole = \App\Models\Role::where('name', 'student')->first();
        if ($studentRole) {
            $this->grantPermission('view', 'role', $studentRole->id);
        }
    }

    /**
     * Make content private (remove all ACL entries).
     */
    public function makePrivate(): void
    {
        $this->aclEntries()->delete();
    }
}