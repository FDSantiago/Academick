<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;

class UpdateAssignmentSubmissionRequest extends FormRequest
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

        // Get course and assignment from route parameters
        $course = $this->route('course');
        $assignment = $this->route('assignment');

        if (!$course || !$assignment) {
            return false;
        }

        // Ensure assignment belongs to the course
        if ($assignment->course_id !== $course->id) {
            return false;
        }

        // Check if user is enrolled in the course
        $isEnrolled = $course->students()->where('users.id', $user->id)->exists();

        if (!$isEnrolled) {
            return false;
        }

        // Check if user has an existing submission
        $submission = $assignment->submissions()->where('user_id', $user->id)->first();
        
        if (!$submission) {
            return false;
        }

        // User can only update their own submission
        return $submission->user_id === $user->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $assignment = $this->route('assignment');
        $submissionType = $assignment ? $assignment->submission_type : 'text';

        $rules = [
            'submission_text' => 'nullable|string|max:50000',
            'submission_url' => 'nullable|url|max:2048',
            'files' => 'nullable|array|max:10',
            'files.*' => 'file|max:10240|mimes:pdf,doc,docx,txt,jpg,jpeg,png,gif,zip,rar,ppt,pptx,xls,xlsx',
            'remove_files' => 'nullable|array',
            'remove_files.*' => 'integer|exists:assignment_attachments,id',
        ];

        // Make fields required based on submission type
        if ($submissionType === 'online_text' || $submissionType === 'text') {
            $rules['submission_text'] = 'required|string|max:50000';
        } elseif ($submissionType === 'online_upload' || $submissionType === 'file') {
            // For file uploads, either keep existing files or upload new ones
            $rules['submission_text'] = 'nullable|string|max:50000';
        } elseif ($submissionType === 'online_url') {
            $rules['submission_url'] = 'required|url|max:2048';
        } elseif ($submissionType === 'both') {
            // For 'both', at least one of text or files must be provided
            $rules['submission_text'] = 'nullable|string|max:50000';
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'submission_text.required' => 'Submission text is required for this assignment.',
            'submission_text.max' => 'Submission text cannot exceed 50,000 characters.',
            'submission_url.required' => 'Submission URL is required for this assignment.',
            'submission_url.url' => 'Please provide a valid URL.',
            'files.*.max' => 'Each file must not exceed 10MB.',
            'files.*.mimes' => 'Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF, ZIP, RAR, PPT, PPTX, XLS, XLSX.',
            'remove_files.*.exists' => 'One or more attachment IDs are invalid.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $assignment = $this->route('assignment');
            $user = $this->user();

            if (!$assignment || !$user) {
                return;
            }

            // Check if the submission has been graded
            $submission = $assignment->submissions()->where('user_id', $user->id)->first();
            
            if ($submission && $submission->status === 'graded') {
                // Optionally prevent updates to graded submissions
                // Uncomment the line below to enforce this rule
                // $validator->errors()->add('submission', 'Cannot update a graded submission.');
            }

            // Validate that remove_files belong to this user's submission
            if ($this->has('remove_files') && $submission) {
                $removeFileIds = $this->input('remove_files', []);
                $validAttachments = $submission->assignment->attachments()
                    ->whereIn('id', $removeFileIds)
                    ->pluck('id')
                    ->toArray();
                
                $invalidIds = array_diff($removeFileIds, $validAttachments);
                if (!empty($invalidIds)) {
                    $validator->errors()->add('remove_files', 'Some attachment IDs do not belong to this submission.');
                }
            }
        });
    }
}