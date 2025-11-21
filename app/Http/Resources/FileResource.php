<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FileResource extends JsonResource
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
            'folder_id' => $this->folder_id,
            'user_id' => $this->user_id,
            'user' => $this->whenLoaded('user'),
            'name' => $this->name,
            'original_name' => $this->original_name,
            'path' => $this->path,
            'file_type' => $this->file_type,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'download_url' => route('files.download', $this->id),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}