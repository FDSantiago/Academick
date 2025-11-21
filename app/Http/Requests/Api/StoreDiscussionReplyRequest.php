<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreDiscussionReplyRequest extends FormRequest
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

        // Get course and discussion from route parameters
        $course = $this->route('course');
        $discussion = $this->route('discussion');

        if (!$course || !$discussion) {
            return false;
        }

        // Ensure discussion belongs to the course
        if ($discussion->course_id !== $course->id) {
            return false;
        }

        // Check if user is enrolled in the course (student or instructor)
        $isEnrolled = $course->students()->where('users.id', $user->id)->exists();
        $isInstructor = $course->instructor_id === $user->id;

        return $isEnrolled || $isInstructor;
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
            'parent_id' => 'nullable|integer|exists:discussion_replies,id',
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
            'parent_id.exists' => 'The parent reply does not exist.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $discussion = $this->route('discussion');
            $parentId = $this->input('parent_id');

            if (!$discussion) {
                return;
            }

            // Check if discussion is locked
            if ($discussion->is_locked) {
                $validator->errors()->add('discussion', 'This discussion is locked and no longer accepting replies.');
            }

            // If parent_id is provided, validate it belongs to the same discussion
            if ($parentId) {
                $parentReply = \App\Models\DiscussionReply::find($parentId);
                
                if ($parentReply && $parentReply->discussion_id !== $discussion->id) {
                    $validator->errors()->add('parent_id', 'The parent reply does not belong to this discussion.');
                }

                // Check if parent reply is deleted
                if ($parentReply && $parentReply->is_deleted) {
                    $validator->errors()->add('parent_id', 'Cannot reply to a deleted comment.');
                }
            }
        });
    }
}