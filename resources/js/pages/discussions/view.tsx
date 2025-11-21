import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReplyForm } from '@/components/discussions/reply-form';
import { ReplyThread } from '@/components/discussions/reply-thread';
import { 
    ArrowLeft,
    Pin,
    Lock,
    MessageSquare,
    User,
    Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import type { BreadcrumbItem, Discussion, DiscussionReply, Course } from '@/types';

interface ViewDiscussionProps {
    course: Course;
    discussion: Discussion;
    replies: DiscussionReply[];
}

export default function ViewDiscussion({ course, discussion, replies: initialReplies }: ViewDiscussionProps) {
    const [replies, setReplies] = useState<DiscussionReply[]>(initialReplies);
    const [loading, setLoading] = useState(false);

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
        {
            title: discussion.title,
            href: `/courses/${course.id}/discussions/${discussion.id}`,
        },
    ];

    const fetchReplies = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/courses/${course.id}/discussions/${discussion.id}/replies`
            );
            setReplies(response.data.data);
        } catch (error) {
            console.error('Failed to fetch replies:', error);
            toast.error('Failed to load replies');
        } finally {
            setLoading(false);
        }
    };

    const handleReplySuccess = () => {
        fetchReplies();
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={discussion.title} />

            <div className="p-4 space-y-6">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.visit(`/courses/${course.id}/discussions`)}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Discussions
                </Button>

                {/* Discussion Post */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <CardTitle className="text-2xl">{discussion.title}</CardTitle>
                                    {discussion.is_pinned && (
                                        <Badge variant="secondary">
                                            <Pin className="w-3 h-3 mr-1" />
                                            Pinned
                                        </Badge>
                                    )}
                                    {discussion.is_locked && (
                                        <Badge variant="outline">
                                            <Lock className="w-3 h-3 mr-1" />
                                            Locked
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Author Info */}
                        <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src={discussion.user?.avatar} />
                                <AvatarFallback>
                                    {discussion.user ? getInitials(discussion.user.name) : <User className="w-5 h-5" />}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{discussion.user?.name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="prose prose-sm dark:prose-invert max-w-none pt-4 border-t">
                            <p className="whitespace-pre-wrap">{discussion.content}</p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                            <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                <span>{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Reply Form */}
                {!discussion.is_locked && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Add a Reply</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ReplyForm
                                courseId={course.id}
                                discussionId={discussion.id}
                                onSuccess={handleReplySuccess}
                                placeholder="Share your thoughts..."
                                buttonText="Post Reply"
                            />
                        </CardContent>
                    </Card>
                )}

                {discussion.is_locked && (
                    <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                                <Lock className="w-4 h-4" />
                                <p className="text-sm font-medium">
                                    This discussion is locked. No new replies can be added.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Replies */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                            Replies ({replies.length})
                        </h2>
                        {loading && (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                    </div>

                    {replies.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">
                                    No replies yet. Be the first to reply!
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {replies.map((reply) => (
                                <ReplyThread
                                    key={reply.id}
                                    reply={reply}
                                    courseId={course.id}
                                    discussionId={discussion.id}
                                    onUpdate={fetchReplies}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}