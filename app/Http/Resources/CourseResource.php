<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
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
            'title' => $this->title,
            'course_code' => $this->course_code,
            'description' => $this->description,
            'instructor_id' => $this->instructor_id,
            'instructor' => $this->whenLoaded('instructor'),
            'status' => $this->status,
            'color' => $this->color,
            'image_url' => $this->image_url,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'enrollments_count' => $this->whenCounted('enrollments'),
            'modules_count' => $this->whenCounted('modules'),
            'assignments_count' => $this->whenCounted('assignments'),
            'quizzes_count' => $this->whenCounted('quizzes'),
            'discussions_count' => $this->whenCounted('discussions'),
            'announcements_count' => $this->whenCounted('announcements'),
        ];
    }
}