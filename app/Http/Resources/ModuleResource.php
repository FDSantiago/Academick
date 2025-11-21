<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ModuleResource extends JsonResource
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
            'order' => $this->order,
            'published' => $this->published,
            'resources' => ModuleResourceResource::collection($this->whenLoaded('resources')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}