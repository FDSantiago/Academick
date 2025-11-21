import React, { useState, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuizTimer } from '@/components/quizzes/quiz-timer';
import { QuestionRenderer } from '@/components/quizzes/question-renderer';
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    ChevronLeft, 
    ChevronRight, 
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import type { BreadcrumbItem, Quiz, QuizAttempt, QuizQuestion, Course } from '@/types';

interface TakeQuizProps {
    course: Course;
    quiz: Quiz;
    attempt?: QuizAttempt;
    questions: QuizQuestion[];
}

export default function TakeQuiz({ course, quiz, attempt, questions }: TakeQuizProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>(attempt?.answers || {});
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [attemptId, setAttemptId] = useState<number | undefined>(attempt?.id);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Courses',
            href: '/courses',
        },
        {
            title: `${course.title} (${course.course_code})`,
            href: `/courses/${course.id}`,
        },
        {
            title: 'Quizzes',
            href: `/courses/${course.id}/quizzes`,
        },
        {
            title: quiz.title,
            href: `/courses/${course.id}/quizzes/${quiz.id}`,
        },
        {
            title: 'Take Quiz',
            href: `/courses/${course.id}/quizzes/${quiz.id}/take`,
        },
    ];

    // Start quiz attempt if not already started
    useEffect(() => {
        const startAttempt = async () => {
            if (!attemptId) {
                try {
                    const response = await axios.post(
                        `/api/courses/${course.id}/quizzes/${quiz.id}/attempts`
                    );
                    console.dir(response, { depth: null })
                    setAttemptId(response.data.attempt.id);
                    toast.success('Quiz started!');
                } catch (error: any) {
                    console.error('Failed to start quiz:', error);
                    toast.error(error.response?.data?.message || 'Failed to start quiz');
                    router.visit(`/courses/${course.id}/quizzes`);
                }
            }
        };

        startAttempt();
    }, [attemptId, course.id, quiz.id]);

    // Auto-save answers every 30 seconds
    useEffect(() => {
        if (!attemptId) return;

        const autoSave = async () => {
            try {
                setAutoSaving(true);
                await axios.put(
                    `/api/courses/${course.id}/quizzes/${quiz.id}/attempts/${attemptId}/answers`,
                    { answers }
                );
                setLastSaved(new Date());
            } catch (error) {
                console.error('Auto-save failed:', error);
            } finally {
                setAutoSaving(false);
            }
        };

        const interval = setInterval(autoSave, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [attemptId, answers, course.id, quiz.id]);

    const handleAnswerChange = useCallback((questionId: number, answer: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    }, []);

    const handleTimeUp = useCallback(() => {
        toast.info('Time is up! Submitting quiz...');
        handleSubmit();
    }, []);

    const handleSubmit = async () => {
        if (!attemptId) {
            toast.error('No active attempt found');
            return;
        }

        try {
            setSubmitting(true);
            
            // Save answers one last time before submitting
            await axios.put(
                `/api/courses/${course.id}/quizzes/${quiz.id}/attempts/${attemptId}/answers`,
                { answers }
            );

            // Submit the quiz
            const response = await axios.post(
                `/api/courses/${course.id}/quizzes/${quiz.id}/attempts/${attemptId}/submit`
            );

            toast.success('Quiz submitted successfully!');
            router.visit(`/courses/${course.id}/quizzes/${quiz.id}/results/${attemptId}`);
        } catch (error: any) {
            console.error('Failed to submit quiz:', error);
            toast.error(error.response?.data?.message || 'Failed to submit quiz');
        } finally {
            setSubmitting(false);
            setShowSubmitDialog(false);
        }
    };

    const currentQuestion = questions[currentQuestionIndex];
    console.log(currentQuestion)
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = questions.length;

    const goToQuestion = (index: number) => {
        if (index >= 0 && index < questions.length) {
            setCurrentQuestionIndex(index);
        }
    };

    const isQuestionAnswered = (questionId: number) => {
        const answer = answers[questionId];
        if (!answer) return false;
        
        if (typeof answer === 'object') {
            if (answer.option_id) return true;
            if (answer.value) return true;
            if (answer.text && answer.text.trim()) return true;
        }
        
        return false;
    };

    if (!attemptId) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Take Quiz: ${quiz.title}`} />
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Take Quiz: ${quiz.title}`} />

            <div className="p-4 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{quiz.title}</h1>
                        <p className="text-muted-foreground mt-1">
                            {course.course_code} - {course.title}
                        </p>
                    </div>
                    <Badge variant="secondary">
                        {answeredCount} / {totalQuestions} Answered
                    </Badge>
                </div>

                {/* Timer */}
                {quiz.time_limit && attempt && (
                    <QuizTimer
                        timeLimit={quiz.time_limit}
                        startTime={attempt.started_at}
                        onTimeUp={handleTimeUp}
                    />
                )}

                {/* Auto-save indicator */}
                {lastSaved && (
                    <div className="text-xs text-muted-foreground text-right">
                        {autoSaving ? (
                            <span className="flex items-center justify-end gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                        )}
                    </div>
                )}

                {/* Question */}
                {currentQuestion && (
                    <QuestionRenderer
                        question={currentQuestion}
                        questionNumber={currentQuestionIndex + 1}
                        answer={answers[currentQuestion.id]}
                        onAnswerChange={handleAnswerChange}
                    />
                )}

                {/* Navigation */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Question Navigation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Question Grid */}
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                            {questions.map((q, index) => (
                                <Button
                                    key={q.id}
                                    variant={
                                        index === currentQuestionIndex
                                            ? 'default'
                                            : isQuestionAnswered(q.id)
                                            ? 'secondary'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => goToQuestion(index)}
                                    className="relative"
                                >
                                    {index + 1}
                                    {isQuestionAnswered(q.id) && index !== currentQuestionIndex && (
                                        <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-green-500" />
                                    )}
                                </Button>
                            ))}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                                disabled={currentQuestionIndex === 0}
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Previous
                            </Button>

                            {currentQuestionIndex === questions.length - 1 ? (
                                <Button
                                    onClick={() => setShowSubmitDialog(true)}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit Quiz
                                            <CheckCircle className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => goToQuestion(currentQuestionIndex + 1)}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Submit Confirmation Dialog */}
            <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Quiz?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to submit your quiz? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-3 py-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Total Questions:</span>
                            <span className="text-sm">{totalQuestions}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Answered:</span>
                            <span className="text-sm">{answeredCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Unanswered:</span>
                            <span className="text-sm text-destructive">
                                {totalQuestions - answeredCount}
                            </span>
                        </div>
                    </div>

                    {answeredCount < totalQuestions && (
                        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                You have {totalQuestions - answeredCount} unanswered question(s). 
                                Unanswered questions will receive 0 points.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowSubmitDialog(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Quiz'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}