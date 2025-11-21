<?php

namespace App\Models;

use App\Traits\HasAcl;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory, HasAcl;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'course_id',
        'title',
        'description',
        'due_date',
        'points',
        'submission_type',
    ];

    /**
     * Get the course for this assignment.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the submissions for this assignment.
     */
    public function submissions()
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    /**
     * Get the attachments for this assignment.
     */
    public function attachments()
    {
        return $this->hasMany(AssignmentAttachment::class);
    }

    /**
     * Get the grades for this assignment.
     */
    public function grades()
    {
        return $this->hasMany(Grade::class);
    }
}