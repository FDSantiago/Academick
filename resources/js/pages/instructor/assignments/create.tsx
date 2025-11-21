import React from 'react';
import AppLayout from '@/layouts/app-layout';
import AssignmentForm from '@/components/instructor/assignment-form';
import { type BreadcrumbItem, type Course } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';

interface CreateAssignmentProps {
    courses: Course[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Instructor Dashboard',
        href: '/instructor/dashboard',
    },
    {
        title: 'Assignments',
        href: '/instructor/assignments',
    },
    {
        title: 'Create Assignment',
        href: '/instructor/assignments/create',
    },
];

export default function CreateAssignment({ courses }: CreateAssignmentProps) {
    const { auth } = usePage().props as any;

    const handleSuccess = (assignment: any) => {
        router.visit('/instructor/assignments', {
            data: { success: 'Assignment created successfully!' }
        });
    };

    const handleCancel = () => {
        router.visit('/instructor/assignments');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Assignment" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Create Assignment</h1>
                        <p className="text-muted-foreground mt-1">
                            Create assignments and manage student submissions.
                        </p>
                    </div>
                </div>

                <AssignmentForm
                    courses={courses}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </div>
        </AppLayout>
    );
}