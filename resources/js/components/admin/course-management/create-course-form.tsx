import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import axios from 'axios';

type User = {
    id: number;
    name: string;
};

export default function CreateCourseForm({
    instructors,
    onSuccess,
    onError,
}: {
    instructors: User[];
    onSuccess: (payload: any) => void;
    onError: (error: any) => void;
}) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const { data, setData, processing } = useForm({
        title: '',
        description: '',
        course_code: '',
        instructor_id: '',
        status: 'active',
    });

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErrors({});
        
        try {
            await axios.get('/sanctum/csrf-cookie');
            const res = await axios.post('/api/admin/courses', data);
            
            if (res.status === 201) {
                onSuccess(res.data);
                
                // Reset form
                setData({
                    title: '',
                    description: '',
                    course_code: '',
                    instructor_id: '',
                    status: 'active',
                });
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
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    placeholder="Course title"
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Course description"
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="course_code">Course Code</Label>
                <Input
                    id="course_code"
                    value={data.course_code}
                    onChange={(e) => setData('course_code', e.target.value)}
                    placeholder="e.g., CS101"
                />
                {errors.course_code && <p className="text-sm text-red-500">{errors.course_code}</p>}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="instructor_id">Instructor</Label>
                <Select
                    value={data.instructor_id}
                    onValueChange={(value) => setData('instructor_id', value)}
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
                    onValueChange={(value) => setData('status', value)}
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
            
            <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                    {processing ? 'Creating...' : 'Create Course'}
                </Button>
            </div>
        </form>
    );
}