<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class QuizAttempt extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'quiz_id',
        'user_id',
        'start_time',
        'end_time',
        'score',
        'status',
        'answers',
        'time_taken',
        'is_graded',
        'attempt_number',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'answers' => 'array',
        'is_graded' => 'boolean',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'time_remaining',
        'is_completed',
        'percentage_score',
    ];

    /**
     * Get the quiz for this attempt.
     */
    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    /**
     * Get the user who made this attempt.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the time remaining for this attempt in minutes.
     */
    protected function timeRemaining(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->status !== 'in_progress' || !$this->quiz->time_limit) {
                    return null;
                }

                $elapsed = Carbon::parse($this->start_time)->diffInMinutes(now());
                $remaining = $this->quiz->time_limit - $elapsed;

                return max(0, $remaining);
            }
        );
    }

    /**
     * Check if the attempt is completed.
     */
    protected function isCompleted(): Attribute
    {
        return Attribute::make(
            get: fn () => in_array($this->status, ['completed', 'submitted'])
        );
    }

    /**
     * Get the percentage score for this attempt.
     */
    protected function percentageScore(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (!$this->score || !$this->quiz) {
                    return null;
                }

                $totalPoints = $this->quiz->questions()->sum('points');
                
                if ($totalPoints == 0) {
                    return 0;
                }

                return round(($this->score / $totalPoints) * 100, 2);
            }
        );
    }

    /**
     * Check if the time limit has expired.
     */
    public function hasTimeExpired(): bool
    {
        if (!$this->quiz->time_limit || $this->status !== 'in_progress') {
            return false;
        }

        $elapsed = Carbon::parse($this->start_time)->diffInMinutes(now());
        return $elapsed >= $this->quiz->time_limit;
    }

    /**
     * Get the elapsed time in minutes.
     */
    public function getElapsedTime(): int
    {
        if ($this->status === 'in_progress') {
            return Carbon::parse($this->start_time)->diffInMinutes(now());
        }

        return $this->time_taken ?? 0;
    }
}