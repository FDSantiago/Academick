<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDiscussionReplyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        
        if (!$user) {
            return false;
        }

        // Get course, discussion, and reply from route parameters
        $course = $this->route('course');
        $discussion = $this->route('discussion');
        $reply = $this->route('reply');

        if (!$course || !$discussion || !$reply) {
            return false;
        }

        // Ensure discussion belongs to the course
        if ($discussion->course_id !== $course->id) {
            return false;
        }

        // Ensure reply belongs to the discussion
        if ($reply->discussion_id !== $discussion->id) {
            return false;
        }

        // User can only edit their own reply
        return $reply->user_id === $user->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'content' => 'required|string|min:10|max:10000',
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
            'content.required' => 'Reply content is required.',
            'content.min' => 'Reply must be at least 10 characters.',
            'content.max' => 'Reply cannot exceed 10,000 characters.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $discussion = $this->route('discussion');
            $reply = $this->route('reply');

            if (!$discussion || !$reply) {
                return;
            }

            // Check if discussion is locked
            if ($discussion->is_locked) {
                $validator->errors()->add('discussion', 'This discussion is locked and replies cannot be edited.');
            }

            // Check if reply is deleted
            if ($reply->is_deleted) {
                $validator->errors()->add('reply', 'Cannot edit a deleted reply.');
            }
        });
    }
}