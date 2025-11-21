import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    FileText, 
    Clock, 
    CheckCircle, 
    AlertCircle,
    Calendar,
    Trophy,
    Play
} from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import type { BreadcrumbItem, Quiz, QuizAttempt, Course } from '@/types';

interface QuizzesProps {
    course: Course;
    quizzes: (Quiz & { attempts?: QuizAttempt[]; best_score?: number })[];
}

export default function Quizzes({ course, quizzes }: QuizzesProps) {
    console.log(quizzes)
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
    ];

    const getQuizStatus = (quiz: Quiz & { attempts?: QuizAttempt[] }) => {
        const now = new Date();
        
        if (quiz.available_from && isFuture(new Date(quiz.available_from))) {
            return { status: 'upcoming', label: 'Upcoming', variant: 'secondary' as const };
        }
        
        if (quiz.available_until && isPast(new Date(quiz.available_until))) {
            return { status: 'closed', label: 'Closed', variant: 'destructive' as const };
        }

        const attempts = quiz.attempts || [];
        const completedAttempts = attempts.filter(a => a.is_completed).length;
        
        if (completedAttempts >= quiz.allowed_attempts) {
            return { status: 'completed', label: 'Completed', variant: 'default' as const };
        }

        if (attempts.some(a => !a.is_completed)) {
            return { status: 'in_progress', label: 'In Progress', variant: 'default' as const };
        }

        return { status: 'available', label: 'Available', variant: 'default' as const };
    };

    const canTakeQuiz = (quiz: Quiz & { attempts?: QuizAttempt[] }) => {
        const status = getQuizStatus(quiz);
        if (status.status === 'upcoming' || status.status === 'closed') return false;
        
        const attempts = quiz.attempts || [];
        const completedAttempts = attempts.filter(a => a.is_completed).length;
        
        return completedAttempts < quiz.allowed_attempts;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Quizzes - ${course.course_code}`} />

            <div className="p-4 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Quizzes</h1>
                    <p className="text-muted-foreground mt-1">
                        {course.course_code} - {course.title}
                    </p>
                </div>

                {/* Quizzes List */}
                {quizzes.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No quizzes available yet</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {quizzes.map((quiz) => {
                            const status = getQuizStatus(quiz);
                            const attempts = quiz.attempts || [];
                            const completedAttempts = attempts.filter(a => a.is_completed);
                            const inProgressAttempt = attempts.find(a => !a.is_completed);

                            return (
                                <Card key={quiz.id}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CardTitle>{quiz.title}</CardTitle>
                                                    <Badge variant={status.variant}>
                                                        {status.label}
                                                    </Badge>
                                                </div>
                                                {quiz.description && (
                                                    <CardDescription className="mt-2">
                                                        {quiz.description}
                                                    </CardDescription>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Quiz Info */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {quiz.time_limit && (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">{quiz.time_limit} min</p>
                                                        <p className="text-xs text-muted-foreground">Time Limit</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{quiz.questions_count || 0}</p>
                                                    <p className="text-xs text-muted-foreground">Questions</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Trophy className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{quiz.total_points || 0} pts</p>
                                                    <p className="text-xs text-muted-foreground">Total Points</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {completedAttempts.length}/{quiz.allowed_attempts}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Attempts</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Availability */}
                                        {(quiz.available_from || quiz.available_until) && (
                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2 border-t">
                                                {quiz.available_from && (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>
                                                            Available from {format(new Date(quiz.available_from), 'PPp')}
                                                        </span>
                                                    </div>
                                                )}
                                                {quiz.available_until && (
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle className="w-4 h-4" />
                                                        <span>
                                                            Due {format(new Date(quiz.available_until), 'PPp')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Best Score */}
                                        {quiz.best_score !== undefined && (
                                            <div className="pt-2 border-t">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">Best Score:</span>
                                                    <Badge variant="default">
                                                        {quiz.best_score}%
                                                    </Badge>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-2 border-t">
                                            {inProgressAttempt ? (
                                                <Button asChild>
                                                    <Link href={`/courses/${course.id}/quizzes/${quiz.id}/take`}>
                                                        <Play className="w-4 h-4 mr-2" />
                                                        Continue Quiz
                                                    </Link>
                                                </Button>
                                            ) : canTakeQuiz(quiz) ? (
                                                <Button asChild>
                                                    <Link href={`/courses/${course.id}/quizzes/${quiz.id}/take`}>
                                                        <Play className="w-4 h-4 mr-2" />
                                                        Start Quiz
                                                    </Link>
                                                </Button>
                                            ) : null}

                                            {completedAttempts.length > 0 && (
                                                <Button variant="outline" asChild>
                                                    <Link href={`/courses/${course.id}/quizzes/${quiz.id}/results/${completedAttempts[0].id}`}>
                                                        View Results
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}