import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

type User = {
    id: number;
    name: string;
    email: string;
    role_name?: string;
};

type Course = {
    id: number;
    title: string;
    course_code: string;
};

export default function AddStudentsDialog({
    course,
    isOpen,
    onClose,
    onSuccess,
    onError,
}: {
    course: Course | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (payload: any) => void;
    onError: (error: any) => void;
}) {
    const [students, setStudents] = useState<User[]>([]);
    const [enrolledStudents, setEnrolledStudents] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch students and current enrollments
    useEffect(() => {
        if (isOpen && course) {
            fetchStudents();
            fetchEnrolledStudents();
        }
    }, [isOpen, course]);

    async function fetchStudents() {
        try {
            setLoading(true);
            await axios.get('/sanctum/csrf-cookie');
            // Fetch all users with student role
            const res = await axios.get('/api/admin/users');
            
            if (res.status === 200) {
                // Filter for students only
                const studentList = res.data.filter((user: any) => 
                    user.role_name === 'student'
                );
                setStudents(studentList);
            }
        } catch (err: any) {
            onError({ message: err?.message ?? 'Failed to fetch students' });
        } finally {
            setLoading(false);
        }
    }

    async function fetchEnrolledStudents() {
        if (!course) return;
        
        try {
            await axios.get('/sanctum/csrf-cookie');
            const res = await axios.get(`/api/admin/courses/${course.id}/students`);
            
            if (res.status === 200) {
                setEnrolledStudents(res.data.map((student: any) => student.id));
            }
        } catch (err: any) {
            onError({ message: err?.message ?? 'Failed to fetch enrolled students' });
        }
    }

    function handleStudentToggle(studentId: number) {
        if (enrolledStudents.includes(studentId)) {
            setEnrolledStudents(enrolledStudents.filter(id => id !== studentId));
        } else {
            setEnrolledStudents([...enrolledStudents, studentId]);
        }
    }

    async function handleSave() {
        if (!course) return;
        
        setProcessing(true);
        try {
            await axios.get('/sanctum/csrf-cookie');
            const res = await axios.post(`/api/admin/courses/${course.id}/students`, {
                student_ids: enrolledStudents
            });
            
            if (res.status === 200) {
                onSuccess(res.data);
                onClose();
            } else {
                onError(res.data);
            }
        } catch (err: any) {
            onError({ message: err?.message ?? 'Network error' });
        } finally {
            setProcessing(false);
        }
    }

    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Add Students to Course</DialogTitle>
                    <DialogDescription>
                        {course && `Add students to "${course.title}" (${course.course_code})`}
                    </DialogDescription>
                </DialogHeader>

                {course && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="search">Search Students</Label>
                            <Input
                                id="search"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="rounded-md border max-h-96 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <span className="sr-only">Select</span>
                                        </TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center">
                                                Loading students...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredStudents.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center">
                                                {searchTerm ? 'No students found matching your search.' : 'No students available.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <TableRow 
                                                key={student.id}
                                                className={enrolledStudents.includes(student.id) ? 'bg-muted' : ''}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={enrolledStudents.includes(student.id)}
                                                        onCheckedChange={() => handleStudentToggle(student.id)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                <TableCell>{student.email}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                                {enrolledStudents.length} student{enrolledStudents.length !== 1 ? 's' : ''} selected
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}