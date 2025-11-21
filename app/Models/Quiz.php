<?php

namespace App\Models;

use App\Traits\HasAcl;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
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
        'open_date',
        'close_date',
        'time_limit',
        'shuffle_questions',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'questions',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'questions_count',
        'total_points',
    ];

    /**
     * Get the course for this quiz.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the questions for this quiz.
     */
    public function questions()
    {
        return $this->hasMany(QuizQuestion::class);
    }

    /**
     * Get the attempts for this quiz.
     */
    public function attempts()
    {
        return $this->hasMany(QuizAttempt::class);
    }

    /**
     * Get the attachments for this quiz.
     */
    public function attachments()
    {
        return $this->hasMany(QuizAttachment::class);
    }

    /**
     * Get the grades for this quiz.
     */
    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    /**
     * Get the number of questions for the quiz.
     *
     * @return int
     */
    public function getQuestionsCountAttribute(): int
    {
        if ($this->relationLoaded('questions')) {
            return $this->questions->count();
        }
        return 0;
    }

    /**
     * Get the total points for the quiz.
     *
     * @return int
     */
    public function getTotalPointsAttribute(): int
    {
        if ($this->relationLoaded('questions')) {
            return $this->questions->sum('points');
        }
        return 0;
    }

    /**
     * Check if the quiz is published (has view permissions for students).
     */
    public function isPublished(): bool
    {
        // Check if students have view permission through ACL
        $studentRole = \App\Models\Role::where('name', 'student')->first();
        
        if (!$studentRole) {
            return false;
        }

        return $this->aclEntries()
            ->where('permission_type', 'view')
            ->where('grantee_type', 'role')
            ->where('grantee_id', $studentRole->id)
            ->exists();
    }
}