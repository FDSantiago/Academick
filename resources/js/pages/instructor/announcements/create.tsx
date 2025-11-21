import React from 'react';
import AppLayout from '@/layouts/app-layout';
import AnnouncementForm from '@/components/instructor/announcement-form';
import { type BreadcrumbItem, type Course } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';

interface CreateAnnouncementProps {
    courses: Course[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Instructor Dashboard',
        href: '/instructor/dashboard',
    },
    {
        title: 'Announcements',
        href: '/instructor/announcements',
    },
    {
        title: 'Create Announcement',
        href: '/instructor/announcements/create',
    },
];

export default function CreateAnnouncement({ courses }: CreateAnnouncementProps) {
    const { auth } = usePage().props as any;

    const handleSuccess = (announcement: any) => {
        router.visit('/instructor/announcements', {
            data: { success: 'Announcement created successfully!' }
        });
    };

    const handleCancel = () => {
        router.visit('/instructor/announcements');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Announcement" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Create Announcement</h1>
                        <p className="text-muted-foreground mt-1">
                            Share important updates with your students.
                        </p>
                    </div>
                </div>

                <AnnouncementForm
                    courses={courses}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </div>
        </AppLayout>
    );
}