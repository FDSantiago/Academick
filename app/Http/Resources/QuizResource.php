<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuizResource extends JsonResource
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
            'time_limit' => $this->time_limit,
            'attempts_allowed' => $this->attempts_allowed,
            'published' => $this->published,
            'due_date' => $this->due_date,
            'questions' => QuizQuestionResource::collection($this->whenLoaded('questions')),
            'attempts_count' => $this->whenCounted('attempts'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}