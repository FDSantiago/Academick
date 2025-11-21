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
    MessageSquare,
    Pin,
    Lock,
    Users,
    Clock,
    CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface Discussion {
    id: number;
    title: string;
    content: string;
    course_id: number;
    course?: Course;
    is_pinned: boolean;
    is_locked: boolean;
    allow_replies: boolean;
    graded: boolean;
    points?: number;
    due_date?: string;
    is_draft: boolean;
    visibility: string;
    created_at: string;
    updated_at: string;
    replies_count?: number;
    participants_count?: number;
}

interface DiscussionsIndexProps {
    discussions: Discussion[];
    courses: Course[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Instructor Dashboard',
        href: '/instructor/dashboard',
    },
    {
        title: 'Discussions',
        href: '/instructor/discussions',
    },
];

export default function DiscussionsIndex({ discussions: initialDiscussions, courses }: DiscussionsIndexProps) {
    const { auth } = usePage().props as any;
    const [discussions, setDiscussions] = useState<Discussion[]>(initialDiscussions || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const safeDiscussions = discussions || [];
    const safeCourses = courses || [];
    const filteredDiscussions = safeDiscussions.filter(discussion => {
        const matchesSearch = discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             discussion.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCourse = !courseFilter || discussion.course_id.toString() === courseFilter;
        const matchesStatus = !statusFilter ||
                             (statusFilter === 'draft' && discussion.is_draft) ||
                             (statusFilter === 'published' && !discussion.is_draft) ||
                             (statusFilter === 'locked' && discussion.is_locked) ||
                             (statusFilter === 'graded' && discussion.graded);

        return matchesSearch && matchesCourse && matchesStatus;
    });

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this discussion?')) {
            try {
                await fetch(`/api/instructor/discussions/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${auth?.user?.api_token}`,
                        'Accept': 'application/json',
                    },
                });
                setDiscussions(safeDiscussions.filter(d => d.id !== id));
            } catch (error) {
                console.error('Failed to delete discussion:', error);
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Discussions" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Discussions</h1>
                        <p className="text-muted-foreground mt-1">
                            Create and manage course discussions.
                        </p>
                    </div>
                    <Button onClick={() => router.visit('/instructor/discussions/create')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Discussion
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
                                        placeholder="Search discussions..."
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
                                    <SelectItem value="locked">Locked</SelectItem>
                                    <SelectItem value="graded">Graded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Discussions List */}
                <div className="space-y-4">
                    {filteredDiscussions.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No discussions found</h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchTerm || courseFilter || statusFilter
                                        ? 'Try adjusting your filters'
                                        : 'Create your first discussion to get started'
                                    }
                                </p>
                                <Button onClick={() => router.visit('/instructor/discussions/create')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Discussion
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredDiscussions.map((discussion) => (
                            <Card key={discussion.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold">{discussion.title}</h3>
                                                {discussion.is_pinned && (
                                                    <Badge variant="secondary">
                                                        <Pin className="h-3 w-3 mr-1" />
                                                        Pinned
                                                    </Badge>
                                                )}
                                                {discussion.is_locked && (
                                                    <Badge variant="destructive">
                                                        <Lock className="h-3 w-3 mr-1" />
                                                        Locked
                                                    </Badge>
                                                )}
                                                {discussion.graded && (
                                                    <Badge variant="secondary">Graded</Badge>
                                                )}
                                                {discussion.is_draft && (
                                                    <Badge variant="outline">Draft</Badge>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground mb-3 line-clamp-2">
                                                {discussion.content}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                                <span>{discussion.course?.course_code}</span>
                                                <span>•</span>
                                                <span>Created {format(new Date(discussion.created_at), 'PP')}</span>
                                                {discussion.due_date && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4" />
                                                            Due {format(new Date(discussion.due_date), 'PP')}
                                                        </span>
                                                    </>
                                                )}
                                                {discussion.points && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{discussion.points} points</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                    <span>{discussion.replies_count || 0} replies</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <span>{discussion.participants_count || 0} participants</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => router.visit(`/courses/${discussion.course_id}/discussions/${discussion.id}`)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.visit(`/instructor/discussions/${discussion.id}/edit`)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(discussion.id)}
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