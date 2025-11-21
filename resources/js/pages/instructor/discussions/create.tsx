import React from 'react';
import AppLayout from '@/layouts/app-layout';
import DiscussionForm from '@/components/instructor/discussion-form';
import { type BreadcrumbItem, type Course } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';

interface CreateDiscussionProps {
    courses: Course[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Instructor Dashboard',
        href: '/instructor/dashboard',
    },
    {
        title: 'Discussions',
        href: '/instructor/discussions',
    },
    {
        title: 'Create Discussion',
        href: '/instructor/discussions/create',
    },
];

export default function CreateDiscussion({ courses }: CreateDiscussionProps) {
    const { auth } = usePage().props as any;

    const handleSuccess = (discussion: any) => {
        router.visit('/instructor/discussions', {
            data: { success: 'Discussion created successfully!' }
        });
    };

    const handleCancel = () => {
        router.visit('/instructor/discussions');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Discussion" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Create Discussion</h1>
                        <p className="text-muted-foreground mt-1">
                            Start discussions and foster student engagement.
                        </p>
                    </div>
                </div>

                <DiscussionForm
                    courses={courses}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </div>
        </AppLayout>
    );
}