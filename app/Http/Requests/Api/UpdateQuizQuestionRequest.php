<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuizQuestionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $quiz = $this->route('quiz');
        $user = $this->user();
        
        // Check if user is instructor of the course that owns the quiz
        $course = $quiz->course;
        return $course->instructor_id === $user->id ||
               $user->roles()->where('name', 'admin')->exists();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'question_text' => 'required|string|min:1',
            'question_type' => 'required|string|in:multiple_choice,true_false,short_answer,essay',
            'points' => 'required|numeric|min:0',
        ];

        // Add validation based on question type
        if ($this->input('question_type') === 'multiple_choice') {
            $rules['options'] = 'required|array|min:2';
            $rules['options.*.id'] = 'nullable|integer|exists:quiz_question_options,id';
            $rules['options.*.text'] = 'required|string';
            $rules['options.*.is_correct'] = 'required|boolean';
            $rules['options.*.explanation'] = 'nullable|string';
        } elseif ($this->input('question_type') === 'true_false') {
            $rules['correct_answer'] = 'required|in:true,false';
        } elseif ($this->input('question_type') === 'short_answer') {
            $rules['correct_answer'] = 'nullable|string';
        }

        return $rules;
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // For multiple choice, ensure exactly one option is marked as correct
            if ($this->input('question_type') === 'multiple_choice' && $this->has('options')) {
                $correctCount = collect($this->input('options'))
                    ->filter(fn($option) => $option['is_correct'] ?? false)
                    ->count();

                if ($correctCount < 1) {
                    $validator->errors()->add(
                        'options',
                        'At least one option must be marked as correct for multiple choice questions.'
                    );
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
            'question_text.required' => 'Question text is required.',
            'question_text.min' => 'Question text must be at least 5 characters.',
            'question_type.required' => 'Question type is required.',
            'question_type.in' => 'Invalid question type. Must be one of: multiple_choice, true_false, short_answer, essay.',
            'points.required' => 'Points value is required.',
            'points.numeric' => 'Points must be a number.',
            'points.min' => 'Points must be at least 0.',
            'options.required' => 'Options are required for multiple choice questions.',
            'options.min' => 'Multiple choice questions must have at least 2 options.',
            'options.*.text.required' => 'Each option must have text.',
            'options.*.is_correct.required' => 'Each option must specify if it is correct.',
            'options.*.id.exists' => 'Invalid option ID.',
            'correct_answer.required' => 'Correct answer is required for this question type.',
            'correct_answer.in' => 'Correct answer must be either true or false.',
        ];
    }
}