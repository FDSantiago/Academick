<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GradebookResource extends JsonResource
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
            'assignment' => $this->whenLoaded('assignment'),
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user'),
            'score' => $this->score,
            'max_score' => $this->whenLoaded('assignment', fn() => $this->assignment->points),
            'percentage' => $this->whenLoaded('assignment', fn() => $this->assignment->points ? round(($this->score / $this->assignment->points) * 100, 2) : null),
            'feedback' => $this->feedback,
            'graded_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}