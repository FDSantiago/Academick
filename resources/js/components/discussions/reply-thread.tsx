import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ReplyForm } from './reply-form';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    MessageSquare, 
    Edit, 
    Trash2, 
    MoreVertical,
    Loader2,
    Check,
    X
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import type { DiscussionReply } from '@/types';

interface ReplyThreadProps {
    reply: DiscussionReply;
    courseId: number;
    discussionId: number;
    onUpdate?: () => void;
    depth?: number;
}

export function ReplyThread({ 
    reply, 
    courseId, 
    discussionId, 
    onUpdate,
    depth = 0 
}: ReplyThreadProps) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(reply.content);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [updating, setUpdating] = useState(false);

    const maxDepth = 3; // Maximum nesting level

    const handleEdit = async () => {
        try {
            setUpdating(true);

            await axios.put(
                `/api/courses/${courseId}/discussions/${discussionId}/replies/${reply.id}`,
                { content: editContent }
            );

            toast.success('Reply updated successfully!');
            setIsEditing(false);
            
            if (onUpdate) {
                onUpdate();
            }
        } catch (error: any) {
            console.error('Failed to update reply:', error);
            toast.error(error.response?.data?.message || 'Failed to update reply');
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);

            await axios.delete(
                `/api/courses/${courseId}/discussions/${discussionId}/replies/${reply.id}`
            );

            toast.success('Reply deleted successfully!');
            setShowDeleteDialog(false);
            
            if (onUpdate) {
                onUpdate();
            }
        } catch (error: any) {
            console.error('Failed to delete reply:', error);
            toast.error(error.response?.data?.message || 'Failed to delete reply');
        } finally {
            setDeleting(false);
        }
    };

    const handleReplySuccess = () => {
        setShowReplyForm(false);
        if (onUpdate) {
            onUpdate();
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (reply.is_deleted) {
        return (
            <div className={`${depth > 0 ? 'ml-8 md:ml-12' : ''}`}>
                <Card className="bg-muted/50">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground italic">
                            This reply has been deleted
                        </p>
                    </CardContent>
                </Card>
                
                {/* Show children even if parent is deleted */}
                {reply.children && reply.children.length > 0 && (
                    <div className="mt-4 space-y-4">
                        {reply.children.map((child) => (
                            <ReplyThread
                                key={child.id}
                                reply={child}
                                courseId={courseId}
                                discussionId={discussionId}
                                onUpdate={onUpdate}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`${depth > 0 ? 'ml-8 md:ml-12' : ''}`}>
            <Card>
                <CardContent className="p-4">
                    {/* Reply Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={reply.user?.avatar} />
                                <AvatarFallback>{getInitials(reply.user?.name || 'DU')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-sm">{reply.user?.name || 'Deleted User'}</p>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                    </span>
                                    {reply.edited_at && (
                                        <Badge variant="outline" className="text-xs">
                                            Edited
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions Menu */}
                        {(reply.can_edit || reply.can_delete) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {reply.can_edit && (
                                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                    )}
                                    {reply.can_delete && (
                                        <DropdownMenuItem 
                                            onClick={() => setShowDeleteDialog(true)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Reply Content */}
                    {isEditing ? (
                        <div className="space-y-3">
                            <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={4}
                                className="resize-y"
                            />
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleEdit}
                                    disabled={updating || !editContent.trim()}
                                >
                                    {updating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            Save
                                        </>
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditContent(reply.content);
                                    }}
                                    disabled={updating}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p className="whitespace-pre-wrap">{reply.content}</p>
                        </div>
                    )}

                    {/* Reply Button */}
                    {!isEditing && depth < maxDepth && (
                        <div className="mt-3 pt-3 border-t">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowReplyForm(!showReplyForm)}
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Reply
                            </Button>
                        </div>
                    )}

                    {/* Reply Form */}
                    {showReplyForm && (
                        <div className="mt-4 pt-4 border-t">
                            <ReplyForm
                                courseId={courseId}
                                discussionId={discussionId}
                                parentId={reply.id}
                                onSuccess={handleReplySuccess}
                                onCancel={() => setShowReplyForm(false)}
                                placeholder={`Reply to ${reply.user?.name || 'user'}...`}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Nested Replies */}
            {reply.children && reply.children.length > 0 && (
                <div className="mt-4 space-y-4">
                    {reply.children.map((child) => (
                        <ReplyThread
                            key={child.id}
                            reply={child}
                            courseId={courseId}
                            discussionId={discussionId}
                            onUpdate={onUpdate}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Reply?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this reply? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}