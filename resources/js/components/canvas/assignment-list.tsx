import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { Link } from '@inertiajs/react';

interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string;
    points_possible?: number;
    submission_types: string[];
    course_id: number;
    course?: {
        title: string;
        course_code: string;
    };
    is_submitted?: boolean;
}

interface AssignmentListProps {
    assignments: Assignment[];
    showCourseInfo?: boolean;
    maxHeight?: string;
}

export function AssignmentList({
    assignments,
    showCourseInfo = false,
    maxHeight = "500px"
}: AssignmentListProps) {
    const getStatusBadge = (assignment: Assignment) => {
        const now = new Date();
        const dueDate = new Date(assignment.due_date);

        if (assignment.is_submitted) {
            return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Submitted
            </Badge>;
        }

        if (isAfter(now, dueDate)) {
            return <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                Overdue
            </Badge>;
        }

        if (isBefore(dueDate, addDays(now, 1))) {
            return <Badge variant="destructive">Due Soon</Badge>;
        }

        return <Badge variant="secondary">Pending</Badge>;
    };

    const sortedAssignments = [...assignments].sort((a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Assignments
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea style={{ height: maxHeight }}>
                    {sortedAssignments.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No assignments yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {sortedAssignments.map((assignment) => (
                                <div key={assignment.id} className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-medium text-sm line-clamp-1">
                                                    {assignment.title}
                                                </h4>
                                                {getStatusBadge(assignment)}
                                            </div>

                                            {showCourseInfo && assignment.course && (
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    {assignment.course.course_code} - {assignment.course.title}
                                                </p>
                                            )}

                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                {assignment.description}
                                            </p>

                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>
                                                        Due {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                                {assignment.points_possible && (
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        <span>{assignment.points_possible} pts</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {!assignment.is_submitted && (
                                                <Button variant="default" size="sm" asChild>
                                                    <Link href={`/courses/${assignment.course_id}/assignments/${assignment.id}/submit`}>
                                                        Submit
                                                    </Link>
                                                </Button>
                                            )}
                                            {/* <Button variant="outline" size="sm" asChild>
                                                <Link href={`/courses/${assignment.course_id}/assignments/${assignment.id}`}>
                                                    View
                                                </Link>
                                            </Button> */}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}