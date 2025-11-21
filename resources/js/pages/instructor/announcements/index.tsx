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
    Pin,
    Clock,
    Megaphone
} from 'lucide-react';
import { format } from 'date-fns';

interface Announcement {
    id: number;
    title: string;
    content: string;
    course_id: number;
    course?: Course;
    is_pinned: boolean;
    is_draft: boolean;
    scheduled_at?: string;
    visibility: string;
    created_at: string;
    updated_at: string;
}

interface AnnouncementsIndexProps {
    announcements: Announcement[];
    courses: Course[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Instructor Dashboard',
        href: '/instructor/dashboard',
    },
    {
        title: 'Announcements',
        href: '/instructor/announcements',
    },
];

export default function AnnouncementsIndex({ announcements: initialAnnouncements, courses }: AnnouncementsIndexProps) {
    const { auth } = usePage().props as any;
    const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const safeAnnouncements = announcements || [];
    const safeCourses = courses || [];
    const filteredAnnouncements = safeAnnouncements.filter(announcement => {
        const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCourse = !courseFilter || announcement.course_id.toString() === courseFilter;
        const matchesStatus = !statusFilter ||
                             (statusFilter === 'draft' && announcement.is_draft) ||
                             (statusFilter === 'published' && !announcement.is_draft) ||
                             (statusFilter === 'scheduled' && announcement.scheduled_at);

        return matchesSearch && matchesCourse && matchesStatus;
    });

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this announcement?')) {
            try {
                await fetch(`/api/instructor/announcements/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${auth?.user?.api_token}`,
                        'Accept': 'application/json',
                    },
                });
                setAnnouncements(safeAnnouncements.filter(a => a.id !== id));
            } catch (error) {
                console.error('Failed to delete announcement:', error);
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manage Announcements" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Announcements</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage course announcements and communications.
                        </p>
                    </div>
                    <Button onClick={() => router.visit('/instructor/announcements/create')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Announcement
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
                                        placeholder="Search announcements..."
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
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Announcements List */}
                <div className="space-y-4">
                    {filteredAnnouncements.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchTerm || courseFilter || statusFilter
                                        ? 'Try adjusting your filters'
                                        : 'Create your first announcement to get started'
                                    }
                                </p>
                                <Button onClick={() => router.visit('/instructor/announcements/create')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Announcement
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredAnnouncements.map((announcement) => (
                            <Card key={announcement.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold">{announcement.title}</h3>
                                                {announcement.is_pinned && (
                                                    <Badge variant="secondary">
                                                        <Pin className="h-3 w-3 mr-1" />
                                                        Pinned
                                                    </Badge>
                                                )}
                                                {announcement.is_draft && (
                                                    <Badge variant="outline">Draft</Badge>
                                                )}
                                                {announcement.scheduled_at && (
                                                    <Badge variant="outline">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        Scheduled
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground mb-3 line-clamp-2">
                                                {announcement.content}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>{announcement.course?.course_code}</span>
                                                <span>•</span>
                                                <span>
                                                    {announcement.scheduled_at
                                                        ? `Scheduled for ${format(new Date(announcement.scheduled_at), 'PPp')}`
                                                        : `Created ${format(new Date(announcement.created_at), 'PP')}`
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.visit(`/instructor/announcements/${announcement.id}/edit`)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(announcement.id)}
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