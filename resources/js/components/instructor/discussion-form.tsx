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
import { Calendar, MessageSquare, Users, Eye, EyeOff, Lock, Globe } from 'lucide-react';

type Course = {
    id: number;
    title: string;
    course_code: string;
};

interface DiscussionFormProps {
    courses?: Course[];
    discussion?: any;
    onSuccess: (discussion: any) => void;
    onCancel: () => void;
}

export default function DiscussionForm({
    courses,
    discussion,
    onSuccess,
    onCancel
}: DiscussionFormProps) {
    const safeCourses = courses || [];
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data, setData, processing } = useForm({
        title: discussion?.title || '',
        content: discussion?.content || '',
        course_id: discussion?.course_id || '',
        is_pinned: discussion?.is_pinned || false,
        is_locked: discussion?.is_locked || false,
        allow_replies: discussion?.allow_replies !== false,
        require_initial_post: discussion?.require_initial_post || false,
        graded: discussion?.graded || false,
        points: discussion?.points || '',
        due_date: discussion?.due_date || '',
        is_draft: discussion?.is_draft || false,
        visibility: discussion?.visibility || 'all',
    });

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErrors({});

        try {
            await axios.get('/sanctum/csrf-cookie');
            const url = discussion
                ? `/api/instructor/discussions/${discussion.id}`
                : '/api/instructor/discussions';
            const method = discussion ? 'put' : 'post';

            const res = await axios[method](url, data);

            if (res.status === 200 || res.status === 201) {
                onSuccess(res.data);
            } else {
                throw new Error('Failed to save discussion');
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
                    {discussion ? 'Edit Discussion' : 'Create New Discussion'}
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
                                    placeholder="Discussion title"
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
                                <Label htmlFor="visibility">Visibility</Label>
                                <Select
                                    value={data.visibility}
                                    onValueChange={(value) => setData('visibility', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-4 w-4" />
                                                All students
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="enrolled">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                Enrolled students only
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {data.graded && (
                                <>
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

                                    <div className="space-y-2">
                                        <Label htmlFor="due_date">Due Date</Label>
                                        <Input
                                            id="due_date"
                                            type="datetime-local"
                                            value={data.due_date}
                                            onChange={(e) => setData('due_date', e.target.value)}
                                        />
                                        {errors.due_date && <p className="text-sm text-red-500">{errors.due_date}</p>}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_pinned"
                                    checked={data.is_pinned}
                                    onCheckedChange={(checked) => setData('is_pinned', !!checked)}
                                />
                                <Label htmlFor="is_pinned" className="flex items-center gap-2">
                                    <Badge variant="secondary">Pin to top</Badge>
                                    Keep this discussion at the top
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_locked"
                                    checked={data.is_locked}
                                    onCheckedChange={(checked) => setData('is_locked', !!checked)}
                                />
                                <Label htmlFor="is_locked" className="flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    Lock discussion
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="allow_replies"
                                    checked={data.allow_replies}
                                    onCheckedChange={(checked) => setData('allow_replies', !!checked)}
                                />
                                <Label htmlFor="allow_replies">
                                    Allow student replies
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="require_initial_post"
                                    checked={data.require_initial_post}
                                    onCheckedChange={(checked) => setData('require_initial_post', !!checked)}
                                />
                                <Label htmlFor="require_initial_post">
                                    Require initial post before seeing replies
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="graded"
                                    checked={data.graded}
                                    onCheckedChange={(checked) => setData('graded', !!checked)}
                                />
                                <Label htmlFor="graded" className="flex items-center gap-2">
                                    <Badge variant="secondary">Graded</Badge>
                                    Make this discussion graded
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
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">Initial Post *</Label>
                        <Textarea
                            id="content"
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            placeholder="Write the initial discussion post..."
                            rows={8}
                            required
                        />
                        {errors.content && <p className="text-sm text-red-500">{errors.content}</p>}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? (discussion ? 'Updating...' : 'Creating...')
                                : (discussion ? 'Update Discussion' : 'Create Discussion')
                            }
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}