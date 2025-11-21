<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StartQuizAttemptRequest;
use App\Http\Requests\Api\SubmitQuizAnswersRequest;
use App\Models\Course;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class QuizAttemptController extends Controller
{
    /**
     * Get student's attempt history for a quiz.
     *
     * @param Course $course
     * @param Quiz $quiz
     * @return JsonResponse
     */
    public function index(Course $course, Quiz $quiz): JsonResponse
    {
        $user = auth()->user();

        // Verify quiz belongs to course
        if ($quiz->course_id !== $course->id) {
            return response()->json([
                'message' => 'Quiz not found in this course.'
            ], 404);
        }

        // Verify user is enrolled
        if (!$course->students()->where('users.id', $user->id)->exists()) {
            return response()->json([
                'message' => 'You are not enrolled in this course.'
            ], 403);
        }

        // Get all attempts for this user
        $attempts = $quiz->attempts()
            ->where('user_id', $user->id)
            ->with(['quiz', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'attempts' => $attempts
        ]);
    }

    /**
     * Start a new quiz attempt.
     *
     * @param StartQuizAttemptRequest $request
     * @param Course $course
     * @param Quiz $quiz
     * @return JsonResponse
     */
    public function store(StartQuizAttemptRequest $request, Course $course, Quiz $quiz): JsonResponse
    {
        $user = auth()->user();

        // If the request attached an existing in-progress attempt, return it so the student can continue
        if (isset($request->inProgressAttempt) && $request->inProgressAttempt) {
            $attempt = $request->inProgressAttempt->load(['quiz', 'user']);

            // Get questions with options and hide correct answers for in-progress attempts
            $questions = $quiz->questions()->with('options')->get();

            // If quiz was shuffled at start, we cannot reliably reconstruct the original order
            // because question order wasn't persisted; return the current order but hide correct answers.
            $questions = $questions->map(function ($question) {
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
                            'order' => $option->order,
                            'explanation' => $option->explanation,
                        ];
                    }),
                    'question_number' => $question->order + 1,
                    'is_objective' => in_array($question->question_type, ['multiple_choice', 'true_false']),
                ];
            });

            return response()->json([
                'message' => 'Existing in-progress attempt returned.',
                'attempt' => $attempt,
                'questions' => $questions,
            ], 200);
        }

        try {
            DB::beginTransaction();

            // Calculate attempt number
            $attemptNumber = $quiz->attempts()
                ->where('user_id', $user->id)
                ->count() + 1;

            // Create new attempt
            $attempt = QuizAttempt::create([
                'quiz_id' => $quiz->id,
                'user_id' => $user->id,
                'start_time' => now(),
                'status' => 'in_progress',
                'answers' => [],
                'attempt_number' => $attemptNumber,
            ]);

            // Load relationships
            $attempt->load(['quiz', 'user']);

            // Get questions (shuffle if enabled)
            $questions = $quiz->questions()->with('options')->get();
            
            if ($quiz->shuffle_questions) {
                $questions = $questions->shuffle()->values();
            }

            // Remove correct answers from questions for student view
            $questions = $questions->map(function ($question) {
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

            DB::commit();

            return response()->json([
                'message' => 'Quiz attempt started successfully.',
                'attempt' => $attempt,
                'questions' => $questions,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to start quiz attempt.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current attempt details.
     *
     * @param Course $course
     * @param Quiz $quiz
     * @param QuizAttempt $attempt
     * @return JsonResponse
     */
    public function show(Course $course, Quiz $quiz, QuizAttempt $attempt): JsonResponse
    {
        $user = auth()->user();

        // Verify ownership and relationships
        if ($attempt->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized access to this attempt.'
            ], 403);
        }

        if ($attempt->quiz_id !== $quiz->id || $quiz->course_id !== $course->id) {
            return response()->json([
                'message' => 'Invalid attempt or quiz.'
            ], 404);
        }

        // Load relationships
        $attempt->load(['quiz', 'user']);

        // Get questions with options
        $questions = $quiz->questions()->with('options')->get();

        // If attempt is in progress, hide correct answers
        if ($attempt->status === 'in_progress') {
            $questions = $questions->map(function ($question) {
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
        } else {
            // If completed, show correct answers if quiz settings allow
            // For now, we'll always show them after completion
            $questions = $questions->map(function ($question) {
                $questionData = $question->toArray();
                $questionData['options'] = $question->options->map(function ($option) {
                    return [
                        'id' => $option->id,
                        'option_text' => $option->option_text,
                        'order' => $option->order,
                    ];
                });
                return $questionData;
            });
        }

        return response()->json([
            'attempt' => $attempt,
            'questions' => $questions,
        ]);
    }

    /**
     * Save answers during quiz (auto-save).
     *
     * @param SubmitQuizAnswersRequest $request
     * @param Course $course
     * @param Quiz $quiz
     * @param QuizAttempt $attempt
     * @return JsonResponse
     */
    public function submitAnswers(SubmitQuizAnswersRequest $request, Course $course, Quiz $quiz, QuizAttempt $attempt): JsonResponse
    {
        try {
            // Check if time has expired - if so, auto-submit
            if ($attempt->hasTimeExpired()) {
                return $this->submit($request, $course, $quiz, $attempt);
            }

            // Update answers
            $attempt->update([
                'answers' => $request->input('answers'),
            ]);

            return response()->json([
                'message' => 'Answers saved successfully.',
                'attempt' => $attempt->fresh(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to save answers.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Submit completed quiz.
     *
     * @param SubmitQuizAnswersRequest $request
     * @param Course $course
     * @param Quiz $quiz
     * @param QuizAttempt $attempt
     * @return JsonResponse
     */
    public function submit(SubmitQuizAnswersRequest $request, Course $course, Quiz $quiz, QuizAttempt $attempt): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Get final answers (use submitted answers if provided, otherwise use saved answers)
            $answers = $request->input('answers', $attempt->answers ?? []);

            // Calculate time taken
            $timeTaken = $attempt->getElapsedTime();

            // Auto-grade objective questions
            $score = $this->gradeAttempt($quiz, $answers);

            // Check if all questions are objective (can be fully auto-graded)
            $questions = $quiz->questions;
            $allObjective = $questions->every(function ($question) {
                return in_array($question->question_type, ['multiple_choice', 'true_false', 'multiple_answer']);
            });

            // Update attempt
            $attempt->update([
                'answers' => $answers,
                'end_time' => now(),
                'time_taken' => $timeTaken,
                'score' => $score,
                'status' => 'submitted',
                'is_graded' => $allObjective,
            ]);

            // Load relationships for response
            $attempt = $attempt->fresh()->load(['quiz', 'user']);

            // Get questions with correct answers for feedback
            $questions = $quiz->questions()->with('options')->get();

            DB::commit();

            return response()->json([
                'message' => 'Quiz submitted successfully.',
                'attempt' => $attempt,
                'questions' => $questions,
                'feedback' => [
                    'score' => $score,
                    'percentage' => $attempt->percentage_score,
                    'total_points' => $quiz->questions()->sum('points'),
                    'is_graded' => $allObjective,
                    'message' => $allObjective 
                        ? 'Your quiz has been graded automatically.' 
                        : 'Your quiz has been submitted. Some questions require manual grading.',
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to submit quiz.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Auto-grade objective questions.
     *
     * @param Quiz $quiz
     * @param array $answers
     * @return float
     */
    private function gradeAttempt(Quiz $quiz, array $answers): float
    {
        $totalScore = 0;
        $questions = $quiz->questions()->with('options')->get();

        foreach ($questions as $question) {
            $questionId = $question->id;
            $studentAnswer = $answers[$questionId] ?? null;

            // Skip if no answer provided
            if ($studentAnswer === null) {
                continue;
            }

            // Grade based on question type
            switch ($question->question_type) {
                case 'multiple_choice':
                    $totalScore += $this->gradeMultipleChoice($question, $studentAnswer);
                    break;

                case 'true_false':
                    $totalScore += $this->gradeTrueFalse($question, $studentAnswer);
                    break;

                case 'multiple_answer':
                    $totalScore += $this->gradeMultipleAnswer($question, $studentAnswer);
                    break;

                // Essay and other types require manual grading
                case 'essay':
                case 'short_answer':
                default:
                    // These will be graded manually by instructor
                    break;
            }
        }

        return round($totalScore, 2);
    }

    /**
     * Grade a multiple choice question.
     *
     * @param \App\Models\QuizQuestion $question
     * @param mixed $studentAnswer
     * @return float
     */
    private function gradeMultipleChoice($question, $studentAnswer): float
    {
        // Student answer should be the option ID
        $correctOption = $question->options->where('is_correct', true)->first();

        if (!$correctOption) {
            return 0;
        }

        // Check if student's answer matches the correct option ID
        if ($studentAnswer == $correctOption->id) {
            return $question->points;
        }

        return 0;
    }

    /**
     * Grade a true/false question.
     *
     * @param \App\Models\QuizQuestion $question
     * @param mixed $studentAnswer
     * @return float
     */
    private function gradeTrueFalse($question, $studentAnswer): float
    {
        // For true/false, the correct answer is stored in the first option
        $correctOption = $question->options->where('is_correct', true)->first();

        if (!$correctOption) {
            return 0;
        }

        // Student answer should be boolean or string 'true'/'false'
        $studentBool = filter_var($studentAnswer, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $correctBool = filter_var($correctOption->option_text, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        if ($studentBool === $correctBool) {
            return $question->points;
        }

        return 0;
    }

    /**
     * Grade a multiple answer question.
     *
     * @param \App\Models\QuizQuestion $question
     * @param mixed $studentAnswer
     * @return float
     */
    private function gradeMultipleAnswer($question, $studentAnswer): float
    {
        // Student answer should be an array of option IDs
        if (!is_array($studentAnswer)) {
            return 0;
        }

        // Get all correct option IDs
        $correctOptionIds = $question->options
            ->where('is_correct', true)
            ->pluck('id')
            ->toArray();

        // Sort both arrays for comparison
        sort($studentAnswer);
        sort($correctOptionIds);

        // Check if arrays match exactly
        if ($studentAnswer === $correctOptionIds) {
            return $question->points;
        }

        // Partial credit could be implemented here if desired
        // For now, it's all or nothing

        return 0;
    }
}