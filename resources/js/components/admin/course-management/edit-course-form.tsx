import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormEvent, useState } from 'react';
import axios from 'axios';

type Course = {
    id: number;
    title: string;
    description: string;
    course_code: string;
    status: string;
    instructor?: {
        id: number;
        name: string;
    };
};

type User = {
    id: number;
    name: string;
};

export default function EditCourseForm({
    course,
    instructors,
    onSuccess,
    onError,
    onCancel,
}: {
    course: Course;
    instructors: User[];
    onSuccess: (payload: any) => void;
    onError: (error: any) => void;
    onCancel: () => void;
}) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    
    const [data, setData] = useState({
        title: course.title,
        description: course.description,
        course_code: course.course_code,
        instructor_id: course.instructor?.id?.toString() || '',
        status: course.status,
    });

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErrors({});
        setProcessing(true);
        
        try {
            await axios.get('/sanctum/csrf-cookie');
            const res = await axios.put(`/api/admin/courses/${course.id}`, data);
            
            if (res.status === 200) {
                onSuccess(res.data);
            } else {
                onError(res.data);
            }
        } catch (err: any) {
            if (err.response?.status === 422) {
                // Validation errors
                setErrors(err.response.data.errors || {});
            } else {
                const text = err?.message ?? 'Network error';
                onError({ message: text });
            }
        } finally {
            setProcessing(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData({ ...data, title: e.target.value })}
                    placeholder="Course title"
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                    placeholder="Course description"
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="course_code">Course Code</Label>
                <Input
                    id="course_code"
                    value={data.course_code}
                    onChange={(e) => setData({ ...data, course_code: e.target.value })}
                    placeholder="e.g., CS101"
                />
                {errors.course_code && <p className="text-sm text-red-500">{errors.course_code}</p>}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="instructor_id">Instructor</Label>
                <Select
                    value={data.instructor_id}
                    onValueChange={(value) => setData({ ...data, instructor_id: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                        {instructors.map((instructor) => (
                            <SelectItem key={instructor.id} value={String(instructor.id)}>
                                {instructor.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.instructor_id && <p className="text-sm text-red-500">{errors.instructor_id}</p>}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                    value={data.status}
                    onValueChange={(value) => setData({ ...data, status: value })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
            </div>
            
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Updating...' : 'Update Course'}
                </Button>
            </div>
        </form>
    );
}