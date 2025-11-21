import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Course } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    Trophy,
    Clock,
    Users,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface Quiz {
    id: number;
    title: string;
    description: string;
    course_id: number;
    course?: Course;
    due_date: string;
    time_limit?: number;
    attempts_allowed: number;
    is_draft: boolean;
    created_at: string;
    updated_at: string;
    attempts_count?: number;
    average_score?: number;
}

interface QuizzesIndexProps {
    quizzes: Quiz[];
    courses: Course[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Instructor Dashboard',
        href: '/instructor/dashboard',
    },
    {
        title: 'Quizzes',
        href: '/instructor/quizzes',
    },
];

export default function QuizzesIndex({ quizzes: initialQuizzes, courses }: QuizzesIndexProps) {
    const { auth } = usePage().props as any;
    const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const safeQuizzes = quizzes || [];
    const safeCourses = courses || [];
    const filteredQuizzes = safeQuizzes.filter(quiz => {
        const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCourse = !courseFilter || quiz.course_id.toString() === courseFilter;
        const matchesStatus = !statusFilter ||
                             (statusFilter === 'draft' && quiz.is_draft) ||
                             (statusFilter === 'published' && !quiz.is_draft) ||
                             (statusFilter === 'overdue' && new Date(quiz.due_date) < new Date());

        return matchesSearch && matchesCourse && matchesStatus;
    });

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this quiz?')) {
            try {
                await axios.get('/sanctum/csrf-cookie');
                await axios.delete(`/api/instructor/quizzes/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${auth?.user?.api_token}`,
                        'Accept': 'application/json',
                    },
                });
                setQuizzes(safeQuizzes.filter(q => q.id !== id));
            } catch (error) {
                console.error('Failed to delete quiz:', error);
            }
        }
    };

    const getStatusBadge = (quiz: Quiz) => {
        const now = new Date();
        const dueDate = new Date(quiz.due_date);

        if (quiz.is_draft) {
            return <Badge variant="outline">Draft</Badge>;
        }

        if (dueDate < now) {
            return <Badge variant="destructive">Closed</Badge>;
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
            <Head title="Manage Quizzes" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Quizzes</h1>
                        <p className="text-muted-foreground mt-1">
                            Create and manage course quizzes and assessments.
                        </p>
                    </div>
                    <Button onClick={() => router.visit('/instructor/quizzes/create')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Quiz
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
                                        placeholder="Search quizzes..."
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
                                    <SelectItem value="overdue">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Quizzes List */}
                <div className="space-y-4">
                    {filteredQuizzes.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No quizzes found</h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchTerm || courseFilter || statusFilter
                                        ? 'Try adjusting your filters'
                                        : 'Create your first quiz to get started'
                                    }
                                </p>
                                <Button onClick={() => router.visit('/instructor/quizzes/create')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Quiz
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredQuizzes.map((quiz) => (
                            <Card key={quiz.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold">{quiz.title}</h3>
                                                {getStatusBadge(quiz)}
                                            </div>
                                            <p className="text-muted-foreground mb-3 line-clamp-2">
                                                {quiz.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                                <span>{quiz.course?.course_code}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                </span>
                                                {quiz.time_limit && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{quiz.time_limit} min</span>
                                                    </>
                                                )}
                                                <span>•</span>
                                                <span>{quiz.attempts_allowed === 'unlimited' ? 'Unlimited' : `${quiz.attempts_allowed}`} attempts</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span>{quiz.attempts_count || 0} attempts</span>
                                                </div>
                                                {quiz.average_score !== undefined && (
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                        <span>Avg: {quiz.average_score}%</span>
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
                                                onClick={() => router.visit(`/instructor/quizzes/${quiz.id}/edit`)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDelete(quiz.id)}
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