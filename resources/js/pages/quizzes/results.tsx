import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QuestionRenderer } from '@/components/quizzes/question-renderer';
import { 
    Trophy, 
    Clock, 
    CheckCircle, 
    XCircle,
    ArrowLeft,
    Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import type { BreadcrumbItem, Quiz, QuizAttempt, QuizQuestion, Course } from '@/types';

interface QuizResultsProps {
    course: Course;
    quiz: Quiz;
    attempt: QuizAttempt;
    questions: QuizQuestion[];
}

export default function QuizResults({ course, quiz, attempt, questions, total_points }: QuizResultsProps) {
    console.dir({ course, quiz, attempt, questions }, { depth: null });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Courses',
            href: '/courses',
        },
        {
            title: course.course_code,
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
            title: 'Results',
            href: `/courses/${course.id}/quizzes/${quiz.id}/results/${attempt.id}`,
        },
    ];

    const score = attempt.score || 0;
    const totalPoints = total_points || 0;
    const percentage = (score / total_points) * 100 || 0;
    const passed = percentage >= (total_points / 2);

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        }
        if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        }
        return `${secs}s`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Results: ${quiz.title}`} />

            <div className="max-w-5xl mx-auto p-4 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="mb-2"
                        >
                            <Link href={`/courses/${course.id}/quizzes`}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Quizzes
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold">{quiz.title}</h1>
                        <p className="text-muted-foreground mt-1">
                            {course.course_code} - {course.title}
                        </p>
                    </div>
                    <Badge variant={passed ? 'default' : 'destructive'} className="text-lg px-4 py-2">
                        {passed ? 'Passed' : 'Failed'}
                    </Badge>
                </div>

                {/* Score Summary */}
                <Card className={passed ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5" />
                            Your Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className={`text-4xl font-bold ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {percentage.toFixed(1)}%
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">Percentage</p>
                            </div>

                            <div className="text-center">
                                <div className="text-4xl font-bold">
                                    {score} / {totalPoints}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">Points</p>
                            </div>

                            {attempt.time_taken && (
                                <div className="text-center">
                                    <div className="text-4xl font-bold">
                                        {formatTime(attempt.time_taken)}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">Time Taken</p>
                                </div>
                            )}

                            {quiz.passing_score && (
                                <div className="text-center">
                                    <div className="text-4xl font-bold">
                                        {quiz.passing_score}%
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">Passing Score</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t">
                            {attempt.completed_at && (
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                            Completed: {format(new Date(attempt.completed_at), 'PPp')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Questions Review */}
                {quiz.show_correct_answers && (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Question Review</CardTitle>
                                <CardDescription>
                                    Review your answers and see the correct solutions
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        {questions.map((question, index) => (
                            <QuestionRenderer
                                key={question.id}
                                question={question}
                                questionNumber={index + 1}
                                answer={attempt.answers[question.id]}
                                onAnswerChange={() => {}}
                                showCorrectAnswer={true}
                                disabled={true}
                            />
                        ))}
                    </div>
                )}

                {!quiz.show_correct_answers && (
                    <Card>
                        <CardContent className="p-6 text-center">
                            <p className="text-muted-foreground">
                                Correct answers are not available for this quiz.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex items-center justify-center gap-3">
                    <Button variant="outline" asChild>
                        <Link href={`/courses/${course.id}/quizzes`}>
                            Back to Quizzes
                        </Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}