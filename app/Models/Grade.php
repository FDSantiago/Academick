<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'course_id',
        'grade_category_id',
        'assignment_id',
        'quiz_id',
        'points_earned',
        'points_possible',
        'letter_grade',
        'comments',
    ];

    /**
     * Get the student for this grade.
     */
    public function student()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the course for this grade.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the grade category for this grade.
     */
    public function gradeCategory()
    {
        return $this->belongsTo(GradeCategory::class);
    }

    /**
     * Get the assignment for this grade.
     */
    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    /**
     * Get the quiz for this grade.
     */
    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }
}