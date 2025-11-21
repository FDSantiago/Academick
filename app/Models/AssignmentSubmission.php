<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssignmentSubmission extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'assignment_id',
        'user_id',
        'content',
        'file_path',
        'status',
        'graded',
        'grade',
        'feedback',
        'graded_at',
    ];

    /**
     * Get the assignment for this submission.
     */
    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    /**
     * Get the student who made this submission.
     */
    public function student()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the attachments for this submission.
     */
    public function attachments()
    {
        return $this->hasMany(AssignmentAttachment::class, 'submission_id');
    }
}