<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuizAttachment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'quiz_id',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
    ];

    /**
     * Get the quiz for this attachment.
     */
    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }
}