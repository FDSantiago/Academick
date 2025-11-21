<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Carbon\Carbon;

class StartQuizAttemptRequest extends FormRequest
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

        // Get course and quiz from route parameters
        $course = $this->route('course');
        $quiz = $this->route('quiz');

        if (!$course || !$quiz) {
            return false;
        }

        // Ensure quiz belongs to the course
        if ($quiz->course_id !== $course->id) {
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
        return [
            // No additional fields required to start an attempt
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $quiz = $this->route('quiz');
            $user = $this->user();

            if (!$quiz || !$user) {
                return;
            }

            // Check if quiz is published (using ACL)
            if (!$quiz->isPublished()) {
                $validator->errors()->add('quiz', 'This quiz is not yet available.');
                return;
            }

            // Check if quiz is within available date range
            $now = Carbon::now();
            
            if ($quiz->open_date && Carbon::parse($quiz->open_date)->isFuture()) {
                $validator->errors()->add('quiz', 'This quiz is not yet open. It will be available on ' . Carbon::parse($quiz->open_date)->format('M d, Y g:i A') . '.');
                return;
            }

            if ($quiz->close_date && Carbon::parse($quiz->close_date)->isPast()) {
                $validator->errors()->add('quiz', 'This quiz has closed. The deadline was ' . Carbon::parse($quiz->close_date)->format('M d, Y g:i A') . '.');
                return;
            }

            // Check if student has an in-progress attempt
            $inProgressAttempt = $quiz->attempts()
                ->where('user_id', $user->id)
                ->where('status', 'in_progress')
                ->first();
 
            if ($inProgressAttempt) {
                // Attach the existing in-progress attempt to the request so the controller can return it
                // instead of creating a new one. Do not add a validation error here.
                // Store it in the request attributes to avoid dynamic property/deprecation issues.
                $this->attributes->set('inProgressAttempt', $inProgressAttempt);
                return;
            }

            // Check attempt limit (if quiz has max_attempts field)
            // Note: This assumes there might be a max_attempts field in the future
            // For now, we'll allow unlimited attempts unless specified
            $attemptCount = $quiz->attempts()
                ->where('user_id', $user->id)
                ->whereIn('status', ['completed', 'submitted'])
                ->count();

            // If quiz has a max_attempts property (to be added in future)
            if (property_exists($quiz, 'max_attempts') && $quiz->max_attempts > 0) {
                if ($attemptCount >= $quiz->max_attempts) {
                    $validator->errors()->add('quiz', 'You have reached the maximum number of attempts (' . $quiz->max_attempts . ') for this quiz.');
                    return;
                }
            }
        });
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'quiz.required' => 'Quiz not found.',
        ];
    }
}