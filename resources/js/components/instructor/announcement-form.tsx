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
import { Calendar, Clock, Users, Eye, EyeOff } from 'lucide-react';

type Course = {
    id: number;
    title: string;
    course_code: string;
};

interface AnnouncementFormProps {
    courses?: Course[];
    announcement?: any;
    onSuccess: (announcement: any) => void;
    onCancel: () => void;
}

export default function AnnouncementForm({
    courses,
    announcement,
    onSuccess,
    onCancel
}: AnnouncementFormProps) {
    const safeCourses = courses || [];
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isScheduled, setIsScheduled] = useState(false);

    const { data, setData, processing } = useForm({
        title: announcement?.title || '',
        content: announcement?.content || '',
        course_id: announcement?.course_id || '',
        is_pinned: announcement?.is_pinned || false,
        is_draft: announcement?.is_draft || false,
        scheduled_at: announcement?.scheduled_at || '',
        visibility: announcement?.visibility || 'all',
    });

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErrors({});

        try {
            await axios.get('/sanctum/csrf-cookie');
            const url = announcement
                ? `/api/instructor/courses/${data.course_id}/announcements/${announcement.id}`
                : `/api/instructor/courses/${data.course_id}/announcements`;
            const method = announcement ? 'put' : 'post';

            const res = await axios[method](url, data);

            if (res.status === 200 || res.status === 201) {
                onSuccess(res.data);
            } else {
                throw new Error('Failed to save announcement');
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
                    {announcement ? 'Edit Announcement' : 'Create New Announcement'}
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
                                    placeholder="Announcement title"
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
                                                <Users className="h-4 w-4" />
                                                All students
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="enrolled">
                                            <div className="flex items-center gap-2">
                                                <Eye className="h-4 w-4" />
                                                Enrolled students only
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
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
                                    Keep this announcement at the top of the feed
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

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_scheduled"
                                    checked={isScheduled}
                                    onCheckedChange={(checked) => setIsScheduled(!!checked)}
                                />
                                <Label htmlFor="is_scheduled" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Schedule for later
                                </Label>
                            </div>

                            {isScheduled && (
                                <div className="space-y-2">
                                    <Label htmlFor="scheduled_at">Publish Date & Time</Label>
                                    <Input
                                        id="scheduled_at"
                                        type="datetime-local"
                                        value={data.scheduled_at}
                                        onChange={(e) => setData('scheduled_at', e.target.value)}
                                    />
                                    {errors.scheduled_at && <p className="text-sm text-red-500">{errors.scheduled_at}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">Content *</Label>
                        <Textarea
                            id="content"
                            value={data.content}
                            onChange={(e) => setData('content', e.target.value)}
                            placeholder="Write your announcement here..."
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
                                ? (announcement ? 'Updating...' : 'Creating...')
                                : (announcement ? 'Update Announcement' : 'Create Announcement')
                            }
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}