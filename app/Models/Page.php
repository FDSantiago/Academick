<?php

namespace App\Models;

use App\Traits\HasAcl;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Page extends Model
{
    use HasFactory, HasAcl;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'course_id',
        'module_id',
        'created_by',
        'title',
        'slug',
        'content',
        'content_type',
        'status',
        'is_public',
        'acl_permissions',
        'order',
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
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($page) {
            if (empty($page->slug)) {
                $page->slug = Str::slug($page->title);
            }
        });

        static::updating(function ($page) {
            if ($page->isDirty('title') && empty($page->slug)) {
                $page->slug = Str::slug($page->title);
            }
        });
    }

    /**
     * Get the course for this page.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the module for this page.
     */
    public function module()
    {
        return $this->belongsTo(CourseModule::class, 'module_id');
    }

    /**
     * Get the user who created this page.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Check if a user has access to this page based on ACL.
     */
    public function hasAccess(User $user): bool
    {
        // Public pages are accessible to everyone
        if ($this->is_public) {
            return true;
        }

        // Admins have access to all pages
        if ($user->roles()->where('name', 'admin')->exists()) {
            return true;
        }

        // Course instructors have access to pages in their courses
        if ($this->course && $this->course->instructor_id === $user->id) {
            return true;
        }

        // Page creator has access
        if ($user->id === $this->created_by) {
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

        // Check if user is enrolled in the course (for non-public pages)
        if ($this->course && $this->course->students()->where('users.id', $user->id)->exists()) {
            return true;
        }

        return false;
    }

    /**
     * Scope to get published pages.
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Scope to get draft pages.
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    /**
     * Scope to get archived pages.
     */
    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    /**
     * Publish the page.
     */
    public function publish()
    {
        $this->update(['status' => 'published']);
        return $this;
    }

    /**
     * Archive the page.
     */
    public function archive()
    {
        $this->update(['status' => 'archived']);
        return $this;
    }

    /**
     * Move page to draft.
     */
    public function draft()
    {
        $this->update(['status' => 'draft']);
        return $this;
    }

    /**
     * Check if page is published.
     */
    public function isPublished()
    {
        return $this->status === 'published';
    }

    /**
     * Check if page is a draft.
     */
    public function isDraft()
    {
        return $this->status === 'draft';
    }

    /**
     * Check if page is archived.
     */
    public function isArchived()
    {
        return $this->status === 'archived';
    }

    /**
     * Get the rendered content based on content type.
     */
    public function getRenderedContent()
    {
        switch ($this->content_type) {
            case 'markdown':
                return $this->renderMarkdown($this->content);
            case 'html':
                return $this->content; // HTML is already rendered
            case 'text':
            default:
                return nl2br(e($this->content)); // Escape and convert line breaks
        }
    }

    /**
     * Render markdown content to HTML.
     */
    protected function renderMarkdown($content)
    {
        // For now, return the content as-is. In a real implementation,
        // you would use a markdown parser like Parsedown or CommonMark
        // For example: return (new Parsedown())->text($content);
        return nl2br(e($content)); // Basic fallback
    }

    /**
     * Get content type label.
     */
    public function getContentTypeLabel()
    {
        return match($this->content_type) {
            'html' => 'HTML',
            'markdown' => 'Markdown',
            'text' => 'Plain Text',
            default => 'Unknown'
        };
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
     * Scope to get pages accessible by a user.
     */
    public function scopeAccessibleBy($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            // Public pages
            $q->where('is_public', true)
              // Pages created by the user
              ->orWhere('created_by', $user->id)
              // Pages where user is admin
              ->orWhere(function ($adminQ) use ($user) {
                  $adminQ->whereHas('course', function ($courseQ) use ($user) {
                      $courseQ->where('instructor_id', $user->id);
                  });
              })
              // Pages with specific ACL permissions
              ->orWhere(function ($aclQ) use ($user) {
                  $aclQ->whereNotNull('acl_permissions')
                       ->where(function ($permQ) use ($user) {
                           // Role-based access
                           $permQ->whereRaw('JSON_CONTAINS(acl_permissions, ?)', [json_encode(['roles' => ['admin']])])
                                 ->orWhereRaw('JSON_CONTAINS(acl_permissions, ?)', [json_encode(['users' => [$user->id]])]);
                       });
              })
              // Pages in courses where user is enrolled
              ->orWhere(function ($enrolledQ) use ($user) {
                  $enrolledQ->whereHas('course.students', function ($studentQ) use ($user) {
                      $studentQ->where('users.id', $user->id);
                  });
              });
        });
    }
}
