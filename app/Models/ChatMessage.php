<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
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
        'reply_to_message_id',
        'content',
    ];

    /**
     * Get the chat room for this message.
     */
    public function chatRoom()
    {
        return $this->belongsTo(ChatRoom::class);
    }

    /**
     * Get the user who sent this message.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the message this message is replying to.
     */
    public function parent()
    {
        return $this->belongsTo(ChatMessage::class, 'reply_to_message_id');
    }

    /**
     * Get the replies to this message.
     */
    public function replies()
    {
        return $this->hasMany(ChatMessage::class, 'reply_to_message_id');
    }
}