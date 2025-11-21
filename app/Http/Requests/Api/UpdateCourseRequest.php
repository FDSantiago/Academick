<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCourseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('course'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'course_code' => 'sometimes|required|string|unique:courses,course_code,' . $this->route('course')->id . '|max:20',
            'instructor_id' => 'sometimes|required|exists:users,id',
            'status' => 'sometimes|required|string|in:active,inactive',
            'color' => 'nullable|string|max:7',
            'image_url' => 'nullable|url',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Course title is required.',
            'course_code.required' => 'Course code is required.',
            'course_code.unique' => 'This course code is already in use.',
            'instructor_id.exists' => 'Selected instructor does not exist.',
            'status.in' => 'Status must be either active or inactive.',
        ];
    }
}