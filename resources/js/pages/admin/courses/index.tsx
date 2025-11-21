import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

import { Badge } from "@/components/ui/badge"
import CreateCourseForm from '@/components/admin/course-management/create-course-form';
import EditCourseForm from '@/components/admin/course-management/edit-course-form';
import AddStudentsDialog from '@/components/admin/course-management/add-students-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircleIcon, CheckCircle2Icon, Plus, Edit, Trash2, UserPlus } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Table components
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '',
    },
    {
        title: 'Course Management',
        href: '/admin/courses',
    },
];

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

export default function AdminCourses() {
    const [apiMessage, setApiMessage] = useState<null | {
        type: 'success' | 'error';
        text: string;
    }>(null);
    
    const [courses, setCourses] = useState<Course[]>([]);
    const [instructors, setInstructors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isAddStudentsDialogOpen, setIsAddStudentsDialogOpen] = useState(false);

    // Fetch courses and instructors
    useEffect(() => {
        fetchCourses();
        fetchInstructors();
    }, []);

    async function fetchCourses() {
        try {
            setLoading(true);
            await axios.get('/sanctum/csrf-cookie');
            const res = await axios.get('/api/admin/courses');
            
            if (res.status === 200) {
                setCourses(res.data);
            }
        } catch (err: any) {
            setApiMessage({
                type: 'error',
                text: err?.message ?? 'Failed to fetch courses',
            });
        } finally {
            setLoading(false);
        }
    }

    async function fetchInstructors() {
        try {
            await axios.get('/sanctum/csrf-cookie');
            // For now, we'll fetch all users and filter for instructors
            // In a real application, you might have a specific endpoint for instructors
            const res = await axios.get('/api/admin/users');
            
            if (res.status === 200) {
                // Filter for users who could be instructors
                const instructorList = res.data.filter((user: any) => 
                    user.role_name === 'instructor'
                );
                setInstructors(instructorList);
            }
        } catch (err: any) {
            console.error('Failed to fetch instructors:', err);
        }
    }

    function handleSuccess(payload: any) {
        setApiMessage({
            type: 'success',
            text: payload?.message ?? 'Operation completed successfully.',
        });
        
        // Close dialogs
        setIsEditDialogOpen(false);
        setIsDeleteDialogOpen(false);
        
        // Refresh courses
        fetchCourses();
    }

    function handleError(err: any) {
        const text =
            err?.message ??
            (err?.error
                ? String(err.error)
                : 'Operation failed. Please try again.');
        setApiMessage({ type: 'error', text });
    }

    function handleEdit(course: Course) {
        setSelectedCourse(course);
        setIsEditDialogOpen(true);
    }

    function handleDelete(course: Course) {
        setSelectedCourse(course);
        setIsDeleteDialogOpen(true);
    }

    function handleAddStudents(course: Course) {
        setSelectedCourse(course);
        setIsAddStudentsDialogOpen(true);
    }

    async function confirmDelete() {
        if (!selectedCourse) return;
        
        try {
            await axios.get('/sanctum/csrf-cookie');
            const res = await axios.delete(`/api/admin/courses/${selectedCourse.id}`);
            
            if (res.status === 200) {
                handleSuccess(res.data);
            } else {
                handleError(res.data);
            }
        } catch (err: any) {
            handleError({ message: err?.message ?? 'Network error' });
        }
    }

    return (
        <>
            <Head title="Course Management" />
            <AppLayout {...{ breadcrumbs }}>
                <div className="space-y-6 p-4">
                    {/* API Message */}
                    {apiMessage && (
                        <Alert variant={apiMessage.type === 'success' ? 'default' : 'destructive'}>
                            {apiMessage.type === 'success' ? <CheckCircle2Icon /> : <AlertCircleIcon />}
                            <AlertDescription>
                                {apiMessage.text}
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    {/* Create Course Dialog */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus />
                                Create Course
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Course</DialogTitle>
                                <DialogDescription>
                                    Fill out the form below to create a new course.
                                </DialogDescription>
                            </DialogHeader>

                            <CreateCourseForm
                                instructors={instructors}
                                onSuccess={handleSuccess}
                                onError={handleError}
                            />
                        </DialogContent>
                    </Dialog>
                    
                    {/* Courses Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Course Code</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Instructor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center">
                                            Loading courses...
                                        </TableCell>
                                    </TableRow>
                                ) : courses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center">
                                            No courses found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    courses.map((course) => (
                                        <TableRow key={course.id}>
                                            <TableCell className="font-medium">{course.course_code}</TableCell>
                                            <TableCell>{course.title}</TableCell>
                                            <TableCell>
                                                {course.instructor ? course.instructor.name : 'Not assigned'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                                                    {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleAddStudents(course)}
                                                    >
                                                        <UserPlus className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(course)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(course)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    
                    {/* Edit Course Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Course</DialogTitle>
                                <DialogDescription>
                                    Update the course details below.
                                </DialogDescription>
                            </DialogHeader>

                            {selectedCourse && (
                                <EditCourseForm
                                    course={selectedCourse}
                                    instructors={instructors}
                                    onSuccess={handleSuccess}
                                    onError={handleError}
                                    onCancel={() => setIsEditDialogOpen(false)}
                                />
                            )}
                        </DialogContent>
                    </Dialog>
                    
                    {/* Delete Course Dialog */}
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Course</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this course? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            
                            {selectedCourse && (
                                <div className="space-y-4">
                                    <div className="rounded-md border p-4">
                                        <div className="font-medium">{selectedCourse.title}</div>
                                        <div className="text-sm text-gray-500">Code: {selectedCourse.course_code}</div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsDeleteDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={confirmDelete}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                    
                    {/* Add Students Dialog */}
                    <AddStudentsDialog
                        course={selectedCourse}
                        isOpen={isAddStudentsDialogOpen}
                        onClose={() => setIsAddStudentsDialogOpen(false)}
                        onSuccess={handleSuccess}
                        onError={handleError}
                    />
                </div>
            </AppLayout>
        </>
    );
}