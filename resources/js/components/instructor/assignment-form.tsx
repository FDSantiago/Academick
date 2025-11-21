import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText, Upload, Users, Eye, EyeOff } from 'lucide-react';

type Course = {
    id: number;
    title: string;
    course_code: string;
};

interface AssignmentFormProps {
    courses?: Course[];
    assignment?: any;
    onSuccess: (assignment: any) => void;
    onCancel: () => void;
}

export default function AssignmentForm({
    courses,
    assignment,
    onSuccess,
    onCancel
}: AssignmentFormProps) {
    const safeCourses = courses || [];
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [attachments, setAttachments] = useState<File[]>([]);

    const { data, setData, processing } = useForm({
        title: assignment?.title || '',
        description: assignment?.description || '',
        course_id: assignment?.course_id || '',
        due_date: assignment?.due_date || '',
        points: assignment?.points || '',
        submission_type: assignment?.submission_type || 'text',
        allow_late_submissions: assignment?.allow_late_submissions || false,
        is_draft: assignment?.is_draft || false,
        instructions: assignment?.instructions || '',
        rubric: assignment?.rubric || '',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(Array.from(e.target.files));
        }
    };

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErrors({});

        try {
            await axios.get('/sanctum/csrf-cookie');
            const url = assignment
                ? `/api/instructor/assignments/${assignment.id}`
                : '/api/instructor/assignments';
            const method = assignment ? 'put' : 'post';

            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                formData.append(key, String(value));
            });

            attachments.forEach((file, index) => {
                formData.append(`attachments[${index}]`, file);
            });

            const res = await axios[method](url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (res.status === 200 || res.status === 201) {
                onSuccess(res.data);
            } else {
                throw new Error('Failed to save assignment');
            }
        } catch (err: any) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
            } else {
                const text = err?.message ?? 'Network error';
                setErrors({ general: text });
            }
        }
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>
                    {assignment ? 'Edit Assignment' : 'Create New Assignment'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {errors.general}
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Assignment title"
                                    required
                                />
                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="course_id">Course *</Label>
                                <Select
                                    value={data.course_id}
                                    onValueChange={(value) => setData('course_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {safeCourses.map((course) => (
                                            <SelectItem key={course.id} value={String(course.id)}>
                                                {course.course_code} - {course.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.course_id && <p className="text-sm text-red-500">{errors.course_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="due_date">Due Date *</Label>
                                <Input
                                    id="due_date"
                                    type="datetime-local"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                    required
                                />
                                {errors.due_date && <p className="text-sm text-red-500">{errors.due_date}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="points">Points</Label>
                                <Input
                                    id="points"
                                    type="number"
                                    value={data.points}
                                    onChange={(e) => setData('points', e.target.value)}
                                    placeholder="100"
                                    min="0"
                                />
                                {errors.points && <p className="text-sm text-red-500">{errors.points}</p>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="submission_type">Submission Type</Label>
                                <Select
                                    value={data.submission_type}
                                    onValueChange={(value) => setData('submission_type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Text Entry</SelectItem>
                                        <SelectItem value="file">File Upload</SelectItem>
                                        <SelectItem value="both">Text & File</SelectItem>
                                        <SelectItem value="url">URL</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="allow_late_submissions"
                                    checked={data.allow_late_submissions}
                                    onCheckedChange={(checked) => setData('allow_late_submissions', !!checked)}
                                />
                                <Label htmlFor="allow_late_submissions">
                                    Allow late submissions
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_draft"
                                    checked={data.is_draft}
                                    onCheckedChange={(checked) => setData('is_draft', !!checked)}
                                />
                                <Label htmlFor="is_draft" className="flex items-center gap-2">
                                    <EyeOff className="h-4 w-4" />
                                    Save as draft
                                </Label>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="attachments">Attachments</Label>
                                <Input
                                    id="attachments"
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.txt,.zip"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Upload assignment files, rubrics, or resources
                                </p>
                                {attachments.length > 0 && (
                                    <div className="space-y-1">
                                        {attachments.map((file, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {file.name}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Brief description of the assignment..."
                            rows={3}
                            required
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instructions">Detailed Instructions</Label>
                        <Textarea
                            id="instructions"
                            value={data.instructions}
                            onChange={(e) => setData('instructions', e.target.value)}
                            placeholder="Provide detailed instructions for students..."
                            rows={6}
                        />
                        {errors.instructions && <p className="text-sm text-red-500">{errors.instructions}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="rubric">Grading Rubric (Optional)</Label>
                        <Textarea
                            id="rubric"
                            value={data.rubric}
                            onChange={(e) => setData('rubric', e.target.value)}
                            placeholder="Define grading criteria..."
                            rows={4}
                        />
                        {errors.rubric && <p className="text-sm text-red-500">{errors.rubric}</p>}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? (assignment ? 'Updating...' : 'Creating...')
                                : (assignment ? 'Update Assignment' : 'Create Assignment')
                            }
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}