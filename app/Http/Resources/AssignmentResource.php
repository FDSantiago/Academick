<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssignmentResource extends JsonResource
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
            'title' => $this->title,
            'description' => $this->description,
            'instructions' => $this->instructions,
            'due_date' => $this->due_date,
            'points' => $this->points,
            'published' => $this->published,
            'attachments' => AssignmentAttachmentResource::collection($this->whenLoaded('attachments')),
            'submissions_count' => $this->whenCounted('submissions'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}