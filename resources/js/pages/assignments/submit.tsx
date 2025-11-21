import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SubmissionForm } from '@/components/assignments/submission-form';
import { 
    Calendar, 
    Clock, 
    FileText, 
    AlertCircle,
    CheckCircle,
    ArrowLeft
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import type { BreadcrumbItem, Assignment, AssignmentSubmission, Course } from '@/types';

interface SubmitAssignmentProps {
    assignment: Assignment;
    submission?: AssignmentSubmission;
    course: Course;
}

export default function SubmitAssignment({ assignment, submission, course }: SubmitAssignmentProps) {
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
            title: 'Assignments',
            href: `/courses/${course.id}/assignments`,
        },
        {
            title: assignment.title,
            href: `/courses/${course.id}/assignments/${assignment.id}`,
        },
        {
            title: 'Submit',
            href: `/courses/${course.id}/assignments/${assignment.id}/submit`,
        },
    ];

    const dueDate = new Date(assignment.due_date);
    const isOverdue = isPast(dueDate);
    const canSubmit = !isOverdue || assignment.allow_late_submissions;

    const handleSuccess = () => {
        router.visit(`/courses/${course.id}/assignments/${assignment.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Submit: ${assignment.title}`} />

            <div className="p-4 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.visit(`/courses/${course.id}/assignments/${assignment.id}`)}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Assignment
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold">{assignment.title}</h1>
                        <p className="text-muted-foreground mt-1">
                            {course.course_code} - {course.title}
                        </p>
                    </div>
                    {submission && (
                        <Badge variant={submission.grade !== undefined ? "default" : "secondary"}>
                            {submission.grade !== undefined ? 'Graded' : 'Submitted'}
                        </Badge>
                    )}
                </div>

                {/* Assignment Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Assignment Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Description */}
                        {assignment.description && (
                            <div>
                                <h3 className="font-medium mb-2">Description</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {assignment.description}
                                </p>
                            </div>
                        )}

                        {/* Assignment Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Due Date</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(dueDate, 'PPP p')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {isOverdue ? 'Overdue' : formatDistanceToNow(dueDate, { addSuffix: true })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Points</p>
                                    <p className="text-sm text-muted-foreground">
                                        {assignment.points} points possible
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Submission Types</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {assignment.submission_type.split(',').map((type) => (
                                            <Badge key={type} variant="outline" className="text-xs">
                                                {type.replace(/_/g, ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {assignment.allow_late_submissions && (
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Late Submissions</p>
                                        <p className="text-sm text-muted-foreground">
                                            Allowed
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status Alerts */}
                        {isOverdue && !assignment.allow_late_submissions && (
                            <div className="pt-4 border-t">
                                <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-destructive">Assignment Closed</p>
                                        <p className="text-sm text-destructive/80 mt-1">
                                            This assignment is past due and no longer accepts submissions.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isOverdue && assignment.allow_late_submissions && (
                            <div className="pt-4 border-t">
                                <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-yellow-800 dark:text-yellow-200">Late Submission</p>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                            This assignment is past due. Your submission will be marked as late.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Submission Form */}
                {canSubmit && (
                    <SubmissionForm
                        assignment={assignment}
                        submission={submission}
                        courseId={course.id}
                        onSuccess={handleSuccess}
                    />
                )}
            </div>
        </AppLayout>
    );
}