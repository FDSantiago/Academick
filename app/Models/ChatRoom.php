<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatRoom extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'type',
        'course_id',
    ];

    /**
     * Get the course for this chat room.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the participants for this chat room.
     */
    public function participants()
    {
        return $this->hasMany(ChatRoomParticipant::class);
    }

    /**
     * Get the messages for this chat room.
     */
    public function messages()
    {
        return $this->hasMany(ChatMessage::class);
    }
}