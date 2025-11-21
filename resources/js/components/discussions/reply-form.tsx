import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface ReplyFormProps {
    courseId: number;
    discussionId: number;
    parentId?: number;
    onSuccess?: () => void;
    onCancel?: () => void;
    placeholder?: string;
    buttonText?: string;
}

interface ReplyFormData {
    content: string;
}

export function ReplyForm({
    courseId,
    discussionId,
    parentId,
    onSuccess,
    onCancel,
    placeholder = 'Write your reply...',
    buttonText = 'Post Reply',
}: ReplyFormProps) {
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ReplyFormData>();

    const onSubmit = async (data: ReplyFormData) => {
        try {
            setSubmitting(true);

            await axios.post(
                `/api/courses/${courseId}/discussions/${discussionId}/replies`,
                {
                    content: data.content,
                    parent_id: parentId,
                }
            );

            toast.success('Reply posted successfully!');
            reset();
            
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error('Failed to post reply:', error);
            toast.error(error.response?.data?.message || 'Failed to post reply');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
                <Textarea
                    {...register('content', {
                        required: 'Reply content is required',
                        minLength: {
                            value: 1,
                            message: 'Reply must not be empty',
                        },
                    })}
                    placeholder={placeholder}
                    rows={4}
                    className="resize-y"
                />
                {errors.content && (
                    <p className="text-sm text-destructive mt-2">
                        {errors.content.message}
                    </p>
                )}
            </div>

            <div className="flex items-center justify-end gap-2">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={submitting}>
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Posting...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4 mr-2" />
                            {buttonText}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}