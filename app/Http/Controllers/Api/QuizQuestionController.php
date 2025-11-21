<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreQuizQuestionRequest;
use App\Http\Requests\Api\UpdateQuizQuestionRequest;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\QuizQuestionOption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizQuestionController extends Controller
{
    /**
     * Get all questions for a quiz
     */
    public function index(Request $request, Quiz $quiz)
    {
        $user = $request->user();
        
        // Verify user is instructor of the course
        if (!$this->isInstructor($user, $quiz)) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        $questions = $quiz->questions()
            ->with('options')
            ->orderBy('order')
            ->get()
            ->map(function ($question) {
                return [
                    'id' => $question->id,
                    'quiz_id' => $question->quiz_id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'points' => $question->points,
                    'order' => $question->order,
                    'correct_answer' => $question->correct_answer,
                    'options' => $question->options->map(function ($option) {
                        return [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                            'is_correct' => $option->is_correct,
                            'order' => $option->order,
                            'explanation' => $option->explanation,
                        ];
                    }),
                    'question_number' => $question->order + 1,
                    'is_objective' => in_array($question->question_type, ['multiple_choice', 'true_false']),
                ];
            });

        $totalPoints = $questions->sum('points');

        return response()->json([
            'questions' => $questions,
            'question_count' => $questions->count(),
            'total_points' => $totalPoints,
        ]);
    }

    /**
     * Create a new question
     */
    public function store(StoreQuizQuestionRequest $request, Quiz $quiz)
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Get the next order number
            $maxOrder = $quiz->questions()->max('order') ?? -1;
            
            // Create the question
            $question = $quiz->questions()->create([
                'question_text' => $validated['question_text'],
                'question_type' => $validated['question_type'],
                'points' => $validated['points'],
                'order' => $maxOrder + 1,
                'correct_answer' => $validated['correct_answer'] ?? null,
            ]);

            // Handle options for multiple choice questions
            if ($validated['question_type'] === 'multiple_choice' && isset($validated['options'])) {
                foreach ($validated['options'] as $index => $optionData) {
                    $question->options()->create([
                        'option_text' => $optionData['text'],
                        'is_correct' => $optionData['is_correct'] ?? false,
                        'order' => $index,
                        'explanation' => $optionData['explanation'] ?? null,
                    ]);
                }
            }

            // Update quiz total points (if quiz has a total_points field)
            // Note: This assumes Quiz model might have total_points field in future
            
            DB::commit();

            // Load options for response
            $question->load('options');

            return response()->json([
                'message' => 'Question created successfully',
                'question' => [
                    'id' => $question->id,
                    'quiz_id' => $question->quiz_id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'points' => $question->points,
                    'order' => $question->order,
                    'correct_answer' => $question->correct_answer,
                    'options' => $question->options->map(function ($option) {
                        return [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                            'is_correct' => $option->is_correct,
                            'order' => $option->order,
                            'explanation' => $option->explanation,
                        ];
                    }),
                    'question_number' => $question->order + 1,
                    'is_objective' => in_array($question->question_type, ['multiple_choice', 'true_false']),
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create question',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific question
     */
    public function show(Request $request, Quiz $quiz, QuizQuestion $question)
    {
        $user = $request->user();
        
        // Verify user is instructor of the course
        if (!$this->isInstructor($user, $quiz)) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        // Ensure question belongs to quiz
        if ($question->quiz_id !== $quiz->id) {
            return response()->json(['message' => 'Question not found for this quiz'], 404);
        }

        $question->load('options');

        return response()->json([
            'id' => $question->id,
            'quiz_id' => $question->quiz_id,
            'question_text' => $question->question_text,
            'question_type' => $question->question_type,
            'points' => $question->points,
            'order' => $question->order,
            'correct_answer' => $question->correct_answer,
            'options' => $question->options->map(function ($option) {
                return [
                    'id' => $option->id,
                    'option_text' => $option->option_text,
                    'is_correct' => $option->is_correct,
                    'order' => $option->order,
                    'explanation' => $option->explanation,
                ];
            }),
            'question_number' => $question->order + 1,
            'is_objective' => in_array($question->question_type, ['multiple_choice', 'true_false']),
        ]);
    }

    /**
     * Update a question
     */
    public function update(UpdateQuizQuestionRequest $request, Quiz $quiz, QuizQuestion $question)
    {
        // Ensure question belongs to quiz
        if ($question->quiz_id !== $quiz->id) {
            return response()->json(['message' => 'Question not found for this quiz'], 404);
        }

        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Update question
            $question->update([
                'question_text' => $validated['question_text'],
                'question_type' => $validated['question_type'],
                'points' => $validated['points'],
                'correct_answer' => $validated['correct_answer'] ?? null,
            ]);

            // Handle options for multiple choice questions
            if ($validated['question_type'] === 'multiple_choice' && isset($validated['options'])) {
                // Get existing option IDs
                $existingOptionIds = $question->options->pluck('id')->toArray();
                $updatedOptionIds = [];

                // Update or create options
                foreach ($validated['options'] as $index => $optionData) {
                    if (isset($optionData['id']) && in_array($optionData['id'], $existingOptionIds)) {
                        // Update existing option
                        $option = QuizQuestionOption::find($optionData['id']);
                        $option->update([
                            'option_text' => $optionData['text'],
                            'is_correct' => $optionData['is_correct'] ?? false,
                            'order' => $index,
                            'explanation' => $optionData['explanation'] ?? null,
                        ]);
                        $updatedOptionIds[] = $optionData['id'];
                    } else {
                        // Create new option
                        $newOption = $question->options()->create([
                            'option_text' => $optionData['text'],
                            'is_correct' => $optionData['is_correct'] ?? false,
                            'order' => $index,
                            'explanation' => $optionData['explanation'] ?? null,
                        ]);
                        $updatedOptionIds[] = $newOption->id;
                    }
                }

                // Delete removed options
                $optionsToDelete = array_diff($existingOptionIds, $updatedOptionIds);
                if (!empty($optionsToDelete)) {
                    QuizQuestionOption::whereIn('id', $optionsToDelete)->delete();
                }
            } else {
                // If not multiple choice, delete all options
                $question->options()->delete();
            }

            DB::commit();

            // Reload options
            $question->load('options');

            return response()->json([
                'message' => 'Question updated successfully',
                'question' => [
                    'id' => $question->id,
                    'quiz_id' => $question->quiz_id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'points' => $question->points,
                    'order' => $question->order,
                    'correct_answer' => $question->correct_answer,
                    'options' => $question->options->map(function ($option) {
                        return [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                            'is_correct' => $option->is_correct,
                            'order' => $option->order,
                            'explanation' => $option->explanation,
                        ];
                    }),
                    'question_number' => $question->order + 1,
                    'is_objective' => in_array($question->question_type, ['multiple_choice', 'true_false']),
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update question',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a question
     */
    public function destroy(Request $request, Quiz $quiz, QuizQuestion $question)
    {
        $user = $request->user();
        
        // Verify user is instructor of the course
        if (!$this->isInstructor($user, $quiz)) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        // Ensure question belongs to quiz
        if ($question->quiz_id !== $quiz->id) {
            return response()->json(['message' => 'Question not found for this quiz'], 404);
        }

        try {
            DB::beginTransaction();

            $deletedOrder = $question->order;

            // Delete the question (options will be cascade deleted)
            $question->delete();

            // Reorder remaining questions
            QuizQuestion::where('quiz_id', $quiz->id)
                ->where('order', '>', $deletedOrder)
                ->decrement('order');

            DB::commit();

            return response()->json([
                'message' => 'Question deleted successfully',
            ], 204);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete question',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reorder questions
     */
    public function reorder(Request $request, Quiz $quiz)
    {
        $user = $request->user();
        
        // Verify user is instructor of the course
        if (!$this->isInstructor($user, $quiz)) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        $validated = $request->validate([
            'question_ids' => 'required|array',
            'question_ids.*' => 'required|integer|exists:quiz_questions,id',
        ]);

        try {
            DB::beginTransaction();

            // Verify all questions belong to this quiz
            $questionIds = $validated['question_ids'];
            $questionsCount = QuizQuestion::where('quiz_id', $quiz->id)
                ->whereIn('id', $questionIds)
                ->count();

            if ($questionsCount !== count($questionIds)) {
                return response()->json([
                    'message' => 'Some questions do not belong to this quiz',
                ], 400);
            }

            // Update order for each question
            foreach ($questionIds as $index => $questionId) {
                QuizQuestion::where('id', $questionId)->update(['order' => $index]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Questions reordered successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to reorder questions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check if user is instructor for the course that owns the quiz
     */
    private function isInstructor($user, Quiz $quiz): bool
    {
        $course = $quiz->course;
        return $course->instructor_id === $user->id ||
               $user->roles()->where('name', 'admin')->exists();
    }
}