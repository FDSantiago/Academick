
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    FileText, 
    Upload, 
    Link as LinkIcon, 
    X, 
    AlertCircle, 
    CheckCircle,
    Loader2 
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import type { Assignment, AssignmentSubmission } from '@/types';

interface SubmissionFormProps {
    assignment: Assignment;
    submission?: AssignmentSubmission;
    courseId: number;
    onSuccess?: () => void;
}

interface SubmissionFormData {
    submission_text?: string;
    submission_url?: string;
    files?: FileList;
}

export function SubmissionForm({ 
    assignment, 
    submission, 
    courseId,
    onSuccess 
}: SubmissionFormProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting }, watch, reset } = useForm<SubmissionFormData>({
        defaultValues: {
            submission_text: submission?.submission_text || '',
            submission_url: submission?.submission_url || '',
        }
    });
 
    const submissionTypes = assignment.submission_type ? assignment.submission_type.split(',') : [];
    const allowText = submissionTypes.includes('text') || submissionTypes.includes('online_text_entry');
    const allowFile = submissionTypes.includes('file') || submissionTypes.includes('online_upload');
    const allowUrl = submissionTypes.includes('url') || submissionTypes.includes('online_url');

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files);
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const onSubmit = async (data: SubmissionFormData) => {
        try {
            const formData = new FormData();

            if (data.submission_text) {
                formData.append('submission_text', data.submission_text);
            }

            if (data.submission_url) {
                formData.append('submission_url', data.submission_url);
            }

            selectedFiles.forEach((file, index) => {
                formData.append(`files[${index}]`, file);
            });

            setUploading(true);
            setUploadProgress(0);

            const url = submission
                ? `/api/courses/${courseId}/assignments/${assignment.id}/submission`
                : `/api/courses/${courseId}/assignments/${assignment.id}/submit`;

            const method = submission ? 'put' : 'post';

            const response = await axios[method](url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    setUploadProgress(percentCompleted);
                },
            });

            toast.success(submission ? 'Submission updated successfully!' : 'Assignment submitted successfully!');
            
            if (onSuccess) {
                onSuccess();
            }

            // Reset form if new submission
            if (!submission) {
                reset();
                setSelectedFiles([]);
            }
        } catch (error: any) {
            console.error('Submission error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit assignment');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const isLate = () => {
        if (!assignment.due_date) return false;
        return new Date() > new Date(assignment.due_date);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {isLate() && assignment.allow_late_submissions && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        This assignment is past due. Your submission will be marked as late.
                    </AlertDescription>
                </Alert>
            )}

            {isLate() && !assignment.allow_late_submissions && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        This assignment is past due and no longer accepts submissions.
                    </AlertDescription>
                </Alert>
            )}

            {/* Text Submission */}
            {allowText && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Text Submission
                        </CardTitle>
                        <CardDescription>
                            Enter your submission text below
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            {...register('submission_text')}
                            placeholder="Type your submission here..."
                            rows={10}
                            className="resize-y"
                        />
                        {errors.submission_text && (
                            <p className="text-sm text-destructive mt-2">
                                {errors.submission_text.message}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* File Upload */}
            {allowFile && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            File Upload
                        </CardTitle>
                        <CardDescription>
                            Upload files for your submission
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                dragActive 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-muted-foreground/25 hover:border-primary/50'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-sm font-medium mb-2">
                                Drag and drop files here, or click to select
                            </p>
                            <p className="text-xs text-muted-foreground mb-4">
                                Support for multiple files
                            </p>
                            <Input
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                                id="file-upload"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                Select Files
                            </Button>
                        </div>

                        {/* Selected Files List */}
                        {selectedFiles.length > 0 && (
                            <div className="space-y-2">
                                <Label>Selected Files ({selectedFiles.length})</Label>
                                {selectedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <FileText className="w-4 h-4 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Progress */}
                        {uploading && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Existing Attachments */}
                        {submission?.attachments && submission.attachments.length > 0 && (
                            <div className="space-y-2">
                                <Label>Previously Uploaded Files</Label>
                                {submission.attachments.map((attachment) => (
                                    <div
                                        key={attachment.id}
                                        className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                                    >
                                        <FileText className="w-4 h-4" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {attachment.filename}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(attachment.file_size)}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">Uploaded</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* URL Submission */}
            {allowUrl && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LinkIcon className="w-5 h-5" />
                            URL Submission
                        </CardTitle>
                        <CardDescription>
                            Enter a URL for your submission
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input
                            {...register('submission_url', {
                                pattern: {
                                    value: /^https?:\/\/.+/,
                                    message: 'Please enter a valid URL starting with http:// or https://'
                                }
                            })}
                            type="url"
                            placeholder="https://example.com/your-submission"
                        />
                        {errors.submission_url && (
                            <p className="text-sm text-destructive mt-2">
                                {errors.submission_url.message}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Submission Status */}
            {submission && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Submission Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge variant={submission.is_late ? "destructive" : "default"}>
                                {submission.is_late ? 'Late Submission' : 'Submitted'}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Submitted:</span>
                            <span className="text-sm text-muted-foreground">
                                {new Date(submission.submitted_at).toLocaleString()}
                            </span>
                        </div>
                        {submission.is_late && submission.days_late && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Days Late:</span>
                                <span className="text-sm text-destructive">
                                    {submission.days_late} day{submission.days_late !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}
                        {submission.grade !== undefined && submission.grade !== null && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Grade:</span>
                                <Badge variant="default">
                                    {submission.grade} / {assignment.points}
                                </Badge>
                            </div>
                        )}
                        {submission.feedback && (
                            <div className="space-y-2">
                                <Label>Instructor Feedback</Label>
                                <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">
                                        {submission.feedback}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3">
                <Button
                    type="submit"
                    disabled={isSubmitting || uploading || (isLate() && !assignment.allow_late_submissions)}
                >
                    {isSubmitting || uploading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {uploading ? 'Uploading...' : 'Submitting...'}
                        </>
                    ) : (
                        <>
                            {submission ? 'Update Submission' : 'Submit Assignment'}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}