import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    MessageSquare, 
    Pin,
    Lock,
    User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { BreadcrumbItem, Discussion, Course } from '@/types';

interface DiscussionsProps {
    course: Course;
    discussions: Discussion[];
}

export default function Discussions({ course, discussions }: DiscussionsProps) {
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
            title: 'Discussions',
            href: `/courses/${course.id}/discussions`,
        },
    ];

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const pinnedDiscussions = (discussions || []).filter(d => d.is_pinned);
    const regularDiscussions = (discussions || []).filter(d => !d.is_pinned);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Discussions - ${course.course_code}`} />

            <div className="p-4 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Discussions</h1>
                    <p className="text-muted-foreground mt-1">
                        {course.course_code} - {course.title}
                    </p>
                </div>

                {/* Pinned Discussions */}
                {pinnedDiscussions.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Pin className="w-5 h-5" />
                            Pinned Discussions
                        </h2>
                        <div className="space-y-3">
                            {pinnedDiscussions.map((discussion) => (
                                <Card key={discussion.id} className="border-primary/50">
                                    <CardContent className="p-4">
                                        <Link
                                            href={`/courses/${course.id}/discussions/${discussion.id}`}
                                            className="block hover:opacity-80 transition-opacity"
                                        >
                                            <div className="flex items-start gap-4">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={discussion.user?.avatar} />
                                                    <AvatarFallback>
                                                        {discussion.user ? getInitials(discussion.user.name) : <User className="w-5 h-5" />}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                <h3 className="font-semibold text-base">
                                                                    {discussion.title}
                                                                </h3>
                                                                <Badge variant="secondary">
                                                                    <Pin className="w-3 h-3 mr-1" />
                                                                    Pinned
                                                                </Badge>
                                                                {discussion.is_locked && (
                                                                    <Badge variant="outline">
                                                                        <Lock className="w-3 h-3 mr-1" />
                                                                        Locked
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                                {discussion.content}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span>
                                                            by {discussion.user?.name || 'Unknown'}
                                                        </span>
                                                        <span>
                                                            {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <MessageSquare className="w-3 h-3" />
                                                            <span>{discussion.replies_count || 0} replies</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Regular Discussions */}
                <div className="space-y-4">
                    {pinnedDiscussions.length > 0 && (
                        <h2 className="text-lg font-semibold">All Discussions</h2>
                    )}
                    
                    {regularDiscussions.length === 0 && pinnedDiscussions.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">No discussions yet</p>
                            </CardContent>
                        </Card>
                    ) : regularDiscussions.length === 0 ? (
                        <Card>
                            <CardContent className="p-6 text-center">
                                <p className="text-muted-foreground text-sm">No other discussions</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {regularDiscussions.map((discussion) => (
                                <Card key={discussion.id}>
                                    <CardContent className="p-4">
                                        <Link
                                            href={`/courses/${course.id}/discussions/${discussion.id}`}
                                            className="block hover:opacity-80 transition-opacity"
                                        >
                                            <div className="flex items-start gap-4">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarImage src={discussion.user?.avatar} />
                                                    <AvatarFallback>
                                                        {discussion.user ? getInitials(discussion.user.name) : <User className="w-5 h-5" />}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                <h3 className="font-semibold text-base">
                                                                    {discussion.title}
                                                                </h3>
                                                                {discussion.is_locked && (
                                                                    <Badge variant="outline">
                                                                        <Lock className="w-3 h-3 mr-1" />
                                                                        Locked
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                                {discussion.content}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span>
                                                            by {discussion.user?.name || 'Unknown'}
                                                        </span>
                                                        <span>
                                                            {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <MessageSquare className="w-3 h-3" />
                                                            <span>{discussion.replies_count || 0} replies</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}