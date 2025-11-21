<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssignmentAttachment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'assignment_id',
        'submission_id',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
    ];

    /**
     * Get the assignment for this attachment.
     */
    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    /**
     * Get the submission for this attachment.
     */
    public function submission()
    {
        return $this->belongsTo(AssignmentSubmission::class);
    }
}