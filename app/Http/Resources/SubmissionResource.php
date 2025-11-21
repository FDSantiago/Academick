<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubmissionResource extends JsonResource
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
            'assignment_id' => $this->assignment_id,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user'),
            'content' => $this->content,
            'attachments' => $this->attachments,
            'submitted_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'graded' => $this->graded,
            'grade' => $this->when($this->graded, $this->grade),
            'feedback' => $this->when($this->graded, $this->feedback),
            'graded_at' => $this->graded_at,
        ];
    }
}