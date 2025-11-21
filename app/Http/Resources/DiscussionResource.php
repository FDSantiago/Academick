<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DiscussionResource extends JsonResource
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
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user'),
            'title' => $this->title,
            'content' => $this->content,
            'pinned' => $this->pinned,
            'replies' => DiscussionReplyResource::collection($this->whenLoaded('replies')),
            'replies_count' => $this->whenCounted('replies'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}