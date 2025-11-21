import React from 'react';
import { DashboardCard } from '@/components/canvas/dashboard-card';
import { AnnouncementFeed } from '@/components/canvas/announcement-feed';
import { AssignmentList } from '@/components/canvas/assignment-list';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type Course } from '@/types';
import { Head, usePage } from '@inertiajs/react';

interface DashboardProps {
    courses: Course[];
    announcements: any[];
    assignments: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({ courses, announcements, assignments }: DashboardProps) {
    const { auth } = usePage().props as any;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Welcome Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Welcome back, {auth?.user?.name}!</h1>
                        <p className="text-muted-foreground mt-1">
                            Here's what's happening in your courses today.
                        </p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-card rounded-lg border p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">Enrolled Courses</p>
                                <p className="text-2xl font-bold">{courses.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-lg border p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">Upcoming Assignments</p>
                                <p className="text-2xl font-bold">{assignments.filter((a: any) => new Date(a.due_date) > new Date()).length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-lg border p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-muted-foreground">Unread Announcements</p>
                                <p className="text-2xl font-bold">{announcements.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Activity */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Recent Announcements</h2>
                            <AnnouncementFeed
                                announcements={announcements}
                                maxHeight="400px"
                            />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold mb-4">Activity Summary</h2>
                            <div className="bg-card rounded-lg border p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Assignments Submitted</span>
                                    <span className="text-lg font-bold">{assignments.filter((a: any) => a.is_submitted).length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Pending Assignments</span>
                                    <span className="text-lg font-bold">{assignments.filter((a: any) => !a.is_submitted && new Date(a.due_date) > new Date()).length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Overdue Assignments</span>
                                    <span className="text-lg font-bold text-red-600">{assignments.filter((a: any) => !a.is_submitted && new Date(a.due_date) < new Date()).length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Assignments */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Upcoming Assignments</h2>
                        <AssignmentList
                            assignments={assignments}
                            showCourseInfo={true}
                            maxHeight="600px"
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
