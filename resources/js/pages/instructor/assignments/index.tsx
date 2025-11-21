import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Course } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    Users
} from 'lucide-react';
import { format } from 'date-fns';

interface Assignment {
    id: number;
    title: string;
    description: string;
    course_id: number;
    course?: Course;
    due_date: string;
    points?: number;
    submission_type: string;
    allow_late_submissions: boolean;
    is_draft: boolean;
    created_at: string;
    updated_at: string;
    submissions_count?: number;
    pending_submissions?: number;
}

interface AssignmentsIndexProps {
    assignments: Assignment[];
    courses: Course[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Instructor Dashboard',
        href: '/instructor/dashboard',
    },
    {
        title: 'Assignments',
        href: '/instructor/assignments',
    },
];

export default function AssignmentsIndex({ assignments: initialAssignments, courses }: AssignmentsIndexProps) {
    const { auth } = usePage().props as any;
    const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const safeCourses = courses || [];
    const safeAssignments = assignments || [];

    const filteredAssignments = safeAssignments.filter(assignment => {
        const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCourse = !courseFilter || assignment.course_id.toString() === courseFilter;
        const matchesStatus = !statusFilter ||
                             (statusFilter === 'draft' && assignment.is_draft) ||
                             (statusFilter === 'published' && !assignment.is_draft) ||
                             (statusFilter === 'overdue' && new Date(assignment.due_date) < new Date());

        return matchesSearch && matchesCourse && matchesStatus;
    });

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this assignment?')) {
            try {
                await fetch(`/api/instructor/assignments/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${auth?.user?.api_token}`,
                        'Accept': 'application/json',
                    },
                });
                setAssignments(safeAssignments.filter(a => a.id !== id));
            } catch (error) {
                console.error('Failed to delete assignment:', error);
            }
        }
    };

    const getStatusBadge = (assignment: Assignment) => {
        const now = new Date();
        const dueDate = new Date(assignment.due_date);

        if (assignment.is_draft) {
            return <Badge variant="outline">Draft</Badge>;
        }

        if (dueDate < now) {
            return <Badge variant="destructive">Overdue</Badge>;
        }

        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= 1) {
            return <Badge variant="destructive">Due Soon</Badge>;
        } else if (daysUntilDue <= 7) {
            return <Badge variant="secondary">Due This Week</Badge>;
        }

        return <Badge variant="default">Active</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Assignments" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Assignments</h1>
                        <p className="text-muted-foreground mt-1">
                            Create and manage course assignments.
                        </p>
                    </div>
                    <Button onClick={() => router.visit('/instructor/assignments/create')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Assignment
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search assignments..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <Select value={courseFilter} onValueChange={setCourseFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="All courses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All courses</SelectItem>
                                    {safeCourses.map((course) => (
                                        <SelectItem key={course.id} value={String(course.id)}>
                                            {course.course_code}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="All status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All status</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Assignments List */}
                <div className="space-y-4">
                    {filteredAssignments.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchTerm || courseFilter || statusFilter
                                        ? 'Try adjusting your filters'
                                        : 'Create your first assignment to get started'
                                    }
                                </p>
                                <Button onClick={() => router.visit('/instructor/assignments/create')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Assignment
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredAssignments.map((assignment) => (
                            <Card key={assignment.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold">{assignment.title}</h3>
                                                {getStatusBadge(assignment)}
                                            </div>
                                            <p className="text-muted-foreground mb-3 line-clamp-2">
                                                {assignment.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                                <span>{assignment.course?.course_code}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    Due {format(new Date(assignment.due_date), 'PPp')}
                                                </span>
                                                {assignment.points && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{assignment.points} points</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span>{assignment.submissions_count || 0} submissions</span>
                                                </div>
                                                {assignment.pending_submissions && assignment.pending_submissions > 0 && (
                                                    <div className="flex items-center gap-1 text-orange-600">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <span>{assignment.pending_submissions} pending</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.visit(`/instructor/assignments/${assignment.id}/edit`)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(assignment.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}