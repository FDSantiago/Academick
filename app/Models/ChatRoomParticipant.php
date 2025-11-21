<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatRoomParticipant extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'chat_room_id',
        'user_id',
        'is_active',
    ];

    /**
     * Get the chat room for this participant.
     */
    public function chatRoom()
    {
        return $this->belongsTo(ChatRoom::class);
    }

    /**
     * Get the user for this participant.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}