<?php

namespace App\Models;

use App\Traits\HasAcl;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
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
        'is_global',
    ];

    /**
     * Get the course for this announcement.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the user who created this announcement.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}