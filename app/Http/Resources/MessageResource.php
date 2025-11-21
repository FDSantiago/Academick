<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'course_id' => $this->course_id,
            'sender_id' => $this->sender_id,
            'sender' => $this->whenLoaded('sender'),
            'recipient_id' => $this->recipient_id,
            'recipient' => $this->whenLoaded('recipient'),
            'subject' => $this->subject,
            'content' => $this->content,
            'read_at' => $this->read_at,
            'is_read' => !is_null($this->read_at),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}