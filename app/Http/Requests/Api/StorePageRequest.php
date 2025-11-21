<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        // Check if user has permission to create pages in this course
        if ($this->has('course_id')) {
            $courseId = $this->input('course_id');
            $course = \App\Models\Course::find($courseId);

            if (!$course) {
                return false;
            }

            $canCreate = $user->id === $course->instructor_id ||
                        $user->roles()->where('name', 'admin')->exists() ||
                        $course->students()->where('users.id', $user->id)->exists();

            return $canCreate;
        }

        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'course_id' => 'required|exists:courses,id',
            'module_id' => 'nullable|exists:course_modules,id',
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:pages,slug',
            'content' => 'required|string',
            'content_type' => 'required|in:html,markdown,text',
            'status' => 'required|in:draft,published,archived',
            'is_public' => 'boolean',
            'acl_permissions' => 'nullable|array',
            'acl_permissions.roles' => 'nullable|array',
            'acl_permissions.roles.*' => 'string',
            'acl_permissions.users' => 'nullable|array',
            'acl_permissions.users.*' => 'integer|exists:users,id',
            'order' => 'integer',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // If module_id is provided, ensure it belongs to the course
            if ($this->filled('module_id') && $this->filled('course_id')) {
                $module = \App\Models\CourseModule::find($this->input('module_id'));
                if ($module && $module->course_id !== (int)$this->input('course_id')) {
                    $validator->errors()->add('module_id', 'The selected module does not belong to the specified course.');
                }
            }
        });
    }
}
