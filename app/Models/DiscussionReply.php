<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiscussionReply extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'discussion_id',
        'user_id',
        'parent_id',
        'content',
        'edited_at',
        'is_deleted',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'edited_at' => 'datetime',
        'is_deleted' => 'boolean',
    ];

    /**
     * Get the discussion for this reply.
     */
    public function discussion()
    {
        return $this->belongsTo(Discussion::class);
    }

    /**
     * Get the user who made this reply.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent reply for this reply (if it's a nested reply).
     */
    public function parent()
    {
        return $this->belongsTo(DiscussionReply::class, 'parent_id');
    }

    /**
     * Get the child replies for this reply.
     */
    public function replies()
    {
        return $this->hasMany(DiscussionReply::class, 'parent_id');
    }

    /**
     * Get all child replies recursively (for nested threading).
     */
    public function children()
    {
        return $this->hasMany(DiscussionReply::class, 'parent_id')->with('children');
    }

    /**
     * Scope to exclude deleted replies.
     */
    public function scopeNotDeleted($query)
    {
        return $query->where('is_deleted', false);
    }

    /**
     * Check if the reply has been edited.
     */
    public function isEdited(): bool
    {
        return $this->edited_at !== null;
    }

    /**
     * Check if the user can edit this reply.
     */
    public function canEdit(User $user): bool
    {
        return $this->user_id === $user->id && !$this->discussion->is_locked;
    }

    /**
     * Check if the user can delete this reply.
     */
    public function canDelete(User $user): bool
    {
        // User can delete their own reply, or instructor can delete any reply
        if ($this->user_id === $user->id) {
            return true;
        }

        // Check if user is instructor of the course
        return $this->discussion->course->instructor_id === $user->id;
    }

    /**
     * Get the count of child replies.
     */
    public function getReplyCountAttribute(): int
    {
        return $this->replies()->notDeleted()->count();
    }
}