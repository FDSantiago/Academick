<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentResource extends JsonResource
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
            'role' => $this->role,
            'status' => $this->status,
            'enrolled_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}