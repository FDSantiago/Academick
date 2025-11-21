<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseEnrollment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'course_id',
        'user_id',
        'status',
    ];

    /**
     * Get the course for this enrollment.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the user for this enrollment.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}