<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class SubmitQuizAnswersRequest extends FormRequest
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

        // Get course, quiz, and attempt from route parameters
        $course = $this->route('course');
        $quiz = $this->route('quiz');
        $attempt = $this->route('attempt');

        if (!$course || !$quiz || !$attempt) {
            return false;
        }

        // Ensure quiz belongs to the course
        if ($quiz->course_id !== $course->id) {
            return false;
        }

        // Ensure attempt belongs to the quiz
        if ($attempt->quiz_id !== $quiz->id) {
            return false;
        }

        // Ensure attempt belongs to the current user
        if ($attempt->user_id !== $user->id) {
            return false;
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // For the final submission, answers are optional in the payload,
        // as the system can use the last saved answers.
        if ($this->is('*/submit')) {
            return [
                'answers' => 'sometimes|array',
                'answers.*' => 'nullable',
            ];
        }

        // For auto-saving answers during the quiz, the answers payload is required.
        return [
            'answers' => 'required|array',
            'answers.*' => 'nullable', // Each answer can be null, string, array, or boolean
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $attempt = $this->route('attempt');
            $quiz = $this->route('quiz');

            if (!$attempt || !$quiz) {
                return;
            }

            // Check if attempt is still in progress
            if ($attempt->status !== 'in_progress') {
                $validator->errors()->add('attempt', 'This quiz attempt has already been submitted.');
                return;
            }

            // Check if time limit has expired
            if ($attempt->hasTimeExpired()) {
                $validator->errors()->add('attempt', 'The time limit for this quiz has expired. Your current answers will be auto-submitted.');
                return;
            }

            // Validate that all answer keys correspond to valid question IDs
            $questionIds = $quiz->questions()->pluck('id')->toArray();
            $answers = $this->input('answers', []);

            foreach (array_keys($answers) as $questionId) {
                if (!in_array($questionId, $questionIds)) {
                    $validator->errors()->add('answers.' . $questionId, 'Invalid question ID.');
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
            'answers.required' => 'Answers are required.',
            'answers.array' => 'Answers must be provided as an object/array.',
        ];
    }
}