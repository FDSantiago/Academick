<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Assignment;
use App\Models\Course;

class StoreAssignmentSubmissionRequest extends FormRequest
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

        return $isEnrolled;
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
        ];

        // Make fields required based on submission type
        if ($submissionType === 'online_text' || $submissionType === 'text') {
            $rules['submission_text'] = 'required|string|max:50000';
        } elseif ($submissionType === 'online_upload' || $submissionType === 'file') {
            $rules['files'] = 'required|array|min:1|max:10';
        } elseif ($submissionType === 'online_url') {
            $rules['submission_url'] = 'required|url|max:2048';
        } elseif ($submissionType === 'both') {
            // For 'both', at least one of text or files must be provided
            $rules['submission_text'] = 'required_without:files|string|max:50000';
            $rules['files'] = 'required_without:submission_text|array|max:10';
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
            'files.required' => 'At least one file must be uploaded for this assignment.',
            'files.*.max' => 'Each file must not exceed 10MB.',
            'files.*.mimes' => 'Invalid file type. Allowed types: PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF, ZIP, RAR, PPT, PPTX, XLS, XLSX.',
            'submission_text.required_without' => 'Either submission text or files must be provided.',
            'files.required_without' => 'Either files or submission text must be provided.',
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

            // Check if assignment is locked or past due (if late submissions not allowed)
            // For now, we'll allow late submissions but flag them
            // This can be customized based on assignment settings

            // Check if student has already submitted and resubmissions are not allowed
            $existingSubmission = $assignment->submissions()
                ->where('user_id', $user->id)
                ->first();

            if ($existingSubmission) {
                // If assignment doesn't allow resubmissions, add error
                // For now, we'll allow resubmissions by default
                // This can be customized based on assignment settings
                $validator->errors()->add('submission', 'You have already submitted this assignment. Use the update endpoint to resubmit.');
            }
        });
    }
}