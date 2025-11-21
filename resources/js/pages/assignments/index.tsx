import React, { useState } from 'react';
import { AssignmentList } from '@/components/canvas/assignment-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Filter, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Course } from '@/types';
import { Head, Page, usePage } from '@inertiajs/react';

interface Assignment {
    id: number;
    title: string;
    description: string;
    due_date: string;
    points_possible?: number;
    submission_types: string[];
    course_id: number;
    course?: Course;
    is_submitted?: boolean;
    created_at: string;
    updated_at: string;
}

interface AssignmentsProps extends Page<{
    assignments: Assignment[];
    courses: Course[];
}> {
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Assignments',
        href: '/assignments',
    },
];

export default function Assignments() {
    const { props: { assignments = [], courses = [] } } = usePage<AssignmentsProps>();
    const { auth } = usePage().props as any;
    const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'overdue'>('all');
    const [courseFilter, setCourseFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'due_date' | 'course' | 'title'>('due_date');

    const filteredAssignments = assignments.filter(assignment => {
        // Course filter
        if (courseFilter !== 'all' && assignment.course_id.toString() !== courseFilter) {
            return false;
        }

        // Status filter
        const now = new Date();
        const dueDate = new Date(assignment.due_date);

        switch (filter) {
            case 'pending':
                return !assignment.is_submitted && now <= dueDate;
            case 'submitted':
                return assignment.is_submitted;
            case 'overdue':
                return !assignment.is_submitted && now > dueDate;
            default:
                return true;
        }
    }).sort((a, b) => {
        switch (sortBy) {
            case 'due_date':
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            case 'course':
                return (a.course?.title || '').localeCompare(b.course?.title || '');
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });

    const getStats = () => {
        const now = new Date();
        const pending = assignments.filter(a => !a.is_submitted && new Date(a.due_date) >= now).length;
        const submitted = assignments.filter(a => a.is_submitted).length;
        const overdue = assignments.filter(a => !a.is_submitted && new Date(a.due_date) < now).length;

        return { pending, submitted, overdue, total: assignments.length };
    };

    const stats = getStats();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Assignments" />

            <div className="space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Assignments</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage and track your course assignments
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <FileText className="w-8 h-8 text-blue-500 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                    <p className="text-sm text-muted-foreground">Total</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Clock className="w-8 h-8 text-yellow-500 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.pending}</p>
                                    <p className="text-sm text-muted-foreground">Pending</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.submitted}</p>
                                    <p className="text-sm text-muted-foreground">Submitted</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.overdue}</p>
                                    <p className="text-sm text-muted-foreground">Overdue</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Filters & Sorting
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Status:</span>
                                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="submitted">Submitted</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Course:</span>
                                <Select value={courseFilter} onValueChange={setCourseFilter}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Courses</SelectItem>
                                        {courses.map(course => (
                                            <SelectItem key={course.id} value={course.id.toString()}>
                                                {course.course_code} - {course.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Sort by:</span>
                                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="due_date">Due Date</SelectItem>
                                        <SelectItem value="course">Course</SelectItem>
                                        <SelectItem value="title">Title</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assignments List */}
                <AssignmentList
                    assignments={filteredAssignments}
                    showCourseInfo={courseFilter === 'all'}
                />
            </div>
        </AppLayout>
    );
}
