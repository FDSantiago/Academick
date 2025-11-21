<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $page = $this->route('page'); // Assuming the route parameter is 'page'

        if (!$page) {
            return false;
        }

        // Check if user can edit this page
        $canEdit = $user->id === $page->created_by ||
                  $user->roles()->where('name', 'admin')->exists() ||
                  $user->id === $page->course->instructor_id;

        return $canEdit;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $pageId = $this->route('page') ? $this->route('page')->id : null;

        return [
            'title' => 'sometimes|required|string|max:255',
            'slug' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('pages')->ignore($pageId)],
            'content' => 'sometimes|required|string',
            'content_type' => 'sometimes|required|in:html,markdown,text',
            'status' => 'sometimes|required|in:draft,published,archived',
            'is_public' => 'boolean',
            'acl_permissions' => 'nullable|array',
            'acl_permissions.roles' => 'nullable|array',
            'acl_permissions.roles.*' => 'string',
            'acl_permissions.users' => 'nullable|array',
            'acl_permissions.users.*' => 'integer|exists:users,id',
            'order' => 'integer',
        ];
    }
}
