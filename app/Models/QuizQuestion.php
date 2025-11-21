<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizQuestion extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'quiz_id',
        'question_text',
        'question_type',
        'points',
        'order',
        'correct_answer',
    ];

    /**
     * Get the quiz for this question.
     */
    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    /**
     * Get the options for this question.
     */
    public function options()
    {
        return $this->hasMany(QuizQuestionOption::class, 'question_id');
    }
}