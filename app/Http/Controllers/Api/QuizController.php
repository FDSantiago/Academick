<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Quiz;
use App\Models\Course;
use App\Services\AclService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class QuizController extends Controller
{
    protected $aclService;

    public function __construct(AclService $aclService)
    {
        $this->aclService = $aclService;
    }

    /**
     * Get all quizzes for a course (instructor view) or all courses if no course specified
     */
    public function index(Request $request, Course $course = null)
    {
        $user = $request->user();

        $courseIds = $this->getInstructorCourseIds($user);
        $query = Quiz::whereIn('course_id', $courseIds);

        if ($course) {
            // Course-specific quizzes
            if (!$this->isInstructor($user, $course)) {
                return response()->json(['message' => 'Not authorized'], 403);
            }

            $query->where('course_id', $course->id);
        }

        $quizzes = $query->with(['questions', 'attempts', 'course'])
            ->withCount(['questions', 'attempts'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($quizzes);
    }

    /**
     * Create a new quiz
     */
    public function store(Request $request, Course $course)
    {
        $user = $request->user();
        if (!$user || !$this->isInstructor($user, $course)) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'open_date' => 'required|date',
            'due_date' => 'required|date|after:open_date',
            'time_limit' => 'nullable|integer|min:1',
            'attempts_allowed' => 'required|integer|min:1',
            'shuffle_questions' => 'boolean',
            'shuffle_answers' => 'boolean',
            'show_results' => 'boolean',
            'questions' => 'present|array',
            'questions.*.id' => 'nullable|integer|exists:quiz_questions,id',
            'questions.*.question' => 'required|string|max:65535',
            'questions.*.type' => ['required', Rule::in(['multiple_choice', 'true_false', 'short_answer'])],
            'questions.*.points' => 'required|integer|min:0',
            'questions.*.options' => 'nullable|array',
            'questions.*.options.*' => 'nullable|string|max:65535',
            'questions.*.correct_answer' => 'required|string|max:65535',
        ]);

        try {
            $quiz = DB::transaction(function () use ($data, $course) {
                $quiz = Quiz::create([
                    'title' => $data['title'],
                    'description' => $data['description'],
                    'course_id' => $course->id,
                    'open_date' => $data['open_date'],
                    'close_date' => $data['due_date'],
                    'time_limit' => $data['time_limit'],
                    'attempts_allowed' => $data['attempts_allowed'],
                    'shuffle_questions' => $data['shuffle_questions'] ?? false,
                    'shuffle_answers' => $data['shuffle_answers'] ?? false,
                    'show_results' => $data['show_results'] ?? false,
                ]);

                if (isset($data['questions'])) {
                    $this->syncQuestions($quiz, $data['questions']);
                }

                // Set default permissions
                $this->aclService->setupDefaultPermissions($quiz);

                return $quiz;
            });


            return response()->json([
                'message' => 'Quiz created successfully.',
                'quiz' => $quiz->load('questions.options'),
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to create quiz.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a quiz
     */
    public function update(Request $request, Course $course, Quiz $quiz)
    {
        $user = $request->user();
        if (!$user || !$this->isInstructor($user, $course) || !$this->aclService->hasPermission($user, $quiz, 'manage')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        // Ensure quiz belongs to course
        if ($quiz->course_id !== $course->id) {
            return response()->json(['message' => 'Quiz not found for this course'], 404);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'open_date' => 'required|date',
            'due_date' => 'required|date|after:open_date',
            'time_limit' => 'nullable|integer|min:1',
            'attempts_allowed' => 'required|integer|min:1',
            'shuffle_questions' => 'boolean',
            'shuffle_answers' => 'boolean',
            'show_results' => 'boolean',
            'questions' => 'present|array',
            'questions.*.id' => 'nullable|integer|exists:quiz_questions,id',
            'questions.*.question' => 'required|string|max:65535',
            'questions.*.type' => ['required', Rule::in(['multiple_choice', 'true_false', 'short_answer'])],
            'questions.*.points' => 'required|integer|min:0',
            'questions.*.options' => 'nullable|array',
            'questions.*.options.*' => 'nullable|string|max:65535',
            'questions.*.correct_answer' => 'required|string|max:65535',
        ]);

        try {
            DB::transaction(function () use ($quiz, $data) {
                $quiz->update([
                    'title' => $data['title'],
                    'description' => $data['description'],
                    'open_date' => $data['open_date'],
                    'close_date' => $data['due_date'],
                    'time_limit' => $data['time_limit'],
                    'attempts_allowed' => $data['attempts_allowed'],
                    'shuffle_questions' => $data['shuffle_questions'] ?? $quiz->shuffle_questions,
                    'shuffle_answers' => $data['shuffle_answers'] ?? $quiz->shuffle_answers,
                    'show_results' => $data['show_results'] ?? $quiz->show_results,
                ]);

                if (isset($data['questions'])) {
                    $this->syncQuestions($quiz, $data['questions']);
                }
            });


            return response()->json([
                'message' => 'Quiz updated successfully.',
                'quiz' => $quiz->fresh()->load('questions.options'),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to update quiz.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a quiz
     */
    public function destroy(Request $request, Course $course, Quiz $quiz)
    {
        $user = $request->user();
        if (!$user || !$this->isInstructor($user, $course)) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        try {
            $quiz->delete();

            return response()->json([
                'message' => 'Quiz deleted successfully.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to delete quiz.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check if user is instructor for the course
     */
    private function isInstructor($user, Course $course): bool
    {
        return $course->instructor_id === $user->id ||
                $user->roles()->where('name', 'instructor')->exists();
    }

    /**
     * Get course IDs for which the user is an instructor
     */
    private function getInstructorCourseIds($user): array
    {
        if ($user->roles()->where('name', 'admin')->exists()) {
            return Course::pluck('id')->toArray();
        }

        return Course::where('instructor_id', $user->id)->pluck('id')->toArray();
    }

    private function syncQuestions(Quiz $quiz, array $questionsData)
    {
        $existingQuestionIds = $quiz->questions->pluck('id')->toArray();
        $incomingQuestionIds = [];

        foreach ($questionsData as $index => $questionData) {
            $questionData['order'] = $index;
            $question = $quiz->questions()->updateOrCreate(
                ['id' => $questionData['id'] ?? null],
                [
                    'question_text' => $questionData['question'], // Adjusted from 'question_text' to 'question'
                    'question_type' => $questionData['type'],
                    'points' => $questionData['points'],
                    'order' => $index,
                    'correct_answer' => $questionData['correct_answer'],
                ]
            );

            $incomingQuestionIds[] = $question->id;

            if (in_array($question->question_type, ['multiple_choice', 'multiple_answer']) && isset($questionData['options'])) {
                $question->options()->delete();
                $correctAnswers = is_array($questionData['correct_answer'])
                    ? array_map('strtolower', $questionData['correct_answer'])
                    : [strtolower($questionData['correct_answer'])];

                foreach ($questionData['options'] as $optionIndex => $optionText) {
                    if ($optionText !== null) {
                        $question->options()->create([
                            'option_text' => $optionText,
                            'order' => $optionIndex,
                            'is_correct' => in_array(strtolower($optionText), $correctAnswers),
                        ]);
                    }
                }
            } elseif ($question->question_type === 'true_false') {
                $question->options()->delete();
                $correctAnswer = strtolower($questionData['correct_answer']);
                $question->options()->create([
                    'option_text' => 'True',
                    'order' => 0,
                    'is_correct' => $correctAnswer === 'true',
                ]);
                $question->options()->create([
                    'option_text' => 'False',
                    'order' => 1,
                    'is_correct' => $correctAnswer === 'false',
                ]);
            } else {
                $question->options()->delete();
            }
        }

        $questionsToDelete = array_diff($existingQuestionIds, $incomingQuestionIds);
        if (!empty($questionsToDelete)) {
            $quiz->questions()->whereIn('id', $questionsToDelete)->delete();
        }
    }
}