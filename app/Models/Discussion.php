<?php

namespace App\Models;

use App\Traits\HasAcl;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Discussion extends Model
{
    use HasFactory, HasAcl;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'course_id',
        'user_id',
        'title',
        'content',
        'is_pinned',
        'is_locked',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_pinned' => 'boolean',
        'is_locked' => 'boolean',
    ];

    /**
     * Get the course for this discussion.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the user who created this discussion.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the replies for this discussion.
     */
    public function replies()
    {
        return $this->hasMany(DiscussionReply::class);
    }
}