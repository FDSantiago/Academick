<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class CourseModule extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'course_id',
        'title',
        'description',
        'order',
        'status',
        'is_public',
        'acl_permissions',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'acl_permissions' => 'array',
        'is_public' => 'boolean',
    ];

    /**
     * Get the course for this module.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the resources for this module.
     */
    public function resources()
    {
        return $this->hasMany(ModuleResource::class, 'module_id');
    }

    /**
     * Get the pages for this module.
     */
    public function pages()
    {
        return $this->hasMany(Page::class, 'module_id')->orderBy('order');
    }

    /**
     * Check if a user has access to this module based on ACL.
     */
    public function hasAccess(User $user): bool
    {
        // Public modules are accessible to everyone
        if ($this->is_public) {
            return true;
        }

        // Admins have access to all modules
        if ($user->roles()->where('name', 'admin')->exists()) {
            return true;
        }

        // Course instructors have access to modules in their courses
        if ($this->course && $this->course->instructor_id === $user->id) {
            return true;
        }

        // Check ACL permissions if they exist
        if ($this->acl_permissions) {
            $permissions = $this->acl_permissions;

            // Check role-based access
            if (isset($permissions['roles'])) {
                $userRoles = $user->roles()->pluck('name')->toArray();
                if (array_intersect($userRoles, $permissions['roles'])) {
                    return true;
                }
            }

            // Check user-based access
            if (isset($permissions['users']) && in_array($user->id, $permissions['users'])) {
                return true;
            }
        }

        // Check if user is enrolled in the course (for non-public modules)
        if ($this->course && $this->course->students()->where('users.id', $user->id)->exists()) {
            return true;
        }

        return false;
    }

    /**
     * Scope to get published modules.
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Scope to get draft modules.
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    /**
     * Scope to get archived modules.
     */
    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    /**
     * Publish the module.
     */
    public function publish()
    {
        $this->update(['status' => 'published']);
        return $this;
    }

    /**
     * Archive the module.
     */
    public function archive()
    {
        $this->update(['status' => 'archived']);
        return $this;
    }

    /**
     * Move module to draft.
     */
    public function draft()
    {
        $this->update(['status' => 'draft']);
        return $this;
    }

    /**
     * Check if module is published.
     */
    public function isPublished()
    {
        return $this->status === 'published';
    }

    /**
     * Check if module is a draft.
     */
    public function isDraft()
    {
        return $this->status === 'draft';
    }

    /**
     * Check if module is archived.
     */
    public function isArchived()
    {
        return $this->status === 'archived';
    }

    /**
     * Get status label.
     */
    public function getStatusLabel()
    {
        return match($this->status) {
            'draft' => 'Draft',
            'published' => 'Published',
            'archived' => 'Archived',
            default => 'Unknown'
        };
    }

    /**
     * Scope to get modules accessible by a user.
     */
    public function scopeAccessibleBy($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            // Public modules
            $q->where('is_public', true)
              // Modules where user is admin
              ->orWhere(function ($adminQ) use ($user) {
                  $adminQ->whereHas('course', function ($courseQ) use ($user) {
                      $courseQ->where('instructor_id', $user->id);
                  });
              })
              // Modules with specific ACL permissions
              ->orWhere(function ($aclQ) use ($user) {
                  $aclQ->whereNotNull('acl_permissions')
                       ->where(function ($permQ) use ($user) {
                           // Role-based access
                           $permQ->whereRaw('JSON_CONTAINS(acl_permissions, ?)', [json_encode(['roles' => ['admin']])])
                                 ->orWhereRaw('JSON_CONTAINS(acl_permissions, ?)', [json_encode(['users' => [$user->id]])]);
                       });
              })
              // Modules in courses where user is enrolled
              ->orWhere(function ($enrolledQ) use ($user) {
                  $enrolledQ->whereHas('course.students', function ($studentQ) use ($user) {
                      $studentQ->where('users.id', $user->id);
                  });
              });
        });
    }
}