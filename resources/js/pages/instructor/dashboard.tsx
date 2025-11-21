import React, { useEffect, useState } from 'react';
import { DashboardCard } from '@/components/canvas/dashboard-card';
import { AnnouncementFeed } from '@/components/canvas/announcement-feed';
import { AssignmentList } from '@/components/canvas/assignment-list';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type Course } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BookOpen,
    Users,
    FileText,
    MessageSquare,
    Trophy,
    Megaphone,
    Plus,
    Settings,
    BarChart3
} from 'lucide-react';

interface InstructorDashboardProps {
    courses?: Course[];
    announcements?: any[];
    assignments?: any[];
    stats?: {
        total_students: number;
        total_assignments: number;
        total_announcements: number;
        total_discussions: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Instructor Dashboard',
        href: '/instructor/dashboard',
    },
];

export default function InstructorDashboard({
    courses = [],
    announcements = [],
    assignments = [],
    stats = {
        total_students: 0,
        total_assignments: 0,
        total_announcements: 0,
        total_discussions: 0
    }
}: InstructorDashboardProps) {
    const { auth } = usePage().props as any;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch instructor dashboard data
        const fetchDashboardData = async () => {
            try {
                const [coursesResponse, announcementsResponse, assignmentsResponse, statsResponse] = await Promise.all([
                    fetch('/api/instructor/courses', {
                        headers: {
                            'Authorization': `Bearer ${auth?.user?.api_token}`,
                            'Accept': 'application/json',
                        },
                    }),
                    fetch('/api/instructor/announcements', {
                        headers: {
                            'Authorization': `Bearer ${auth?.user?.api_token}`,
                            'Accept': 'application/json',
                        },
                    }),
                    fetch('/api/instructor/assignments', {
                        headers: {
                            'Authorization': `Bearer ${auth?.user?.api_token}`,
                            'Accept': 'application/json',
                        },
                    }),
                    fetch('/api/instructor/stats', {
                        headers: {
                            'Authorization': `Bearer ${auth?.user?.api_token}`,
                            'Accept': 'application/json',
                        },
                    }),
                ]);

                if (coursesResponse.ok) {
                    const coursesData = await coursesResponse.json();
                    // Update courses via Inertia if needed
                }

                if (announcementsResponse.ok) {
                    const announcementsData = await announcementsResponse.json();
                    // Update announcements via Inertia if needed
                }

                if (assignmentsResponse.ok) {
                    const assignmentsData = await assignmentsResponse.json();
                    // Update assignments via Inertia if needed
                }

                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    // Update stats via Inertia if needed
                }
            } catch (error) {
                console.error('Failed to fetch instructor dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [auth?.user?.api_token]);

    const quickActions = [
        {
            title: 'Create Announcement',
            icon: Megaphone,
            href: '/instructor/announcements/create',
            color: 'bg-blue-500',
        },
        {
            title: 'Create Assignment',
            icon: FileText,
            href: '/instructor/assignments/create',
            color: 'bg-green-500',
        },
        {
            title: 'Create Quiz',
            icon: Trophy,
            href: '/instructor/quizzes/create',
            color: 'bg-purple-500',
        },
        {
            title: 'Start Discussion',
            icon: MessageSquare,
            href: '/instructor/discussions/create',
            color: 'bg-orange-500',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Instructor Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Welcome Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your courses and engage with students.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                        </Button>
                        <Button>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                        </Button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_students}</div>
                            <p className="text-xs text-muted-foreground">
                                Across all courses
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_assignments}</div>
                            <p className="text-xs text-muted-foreground">
                                Active assignments
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                            <Megaphone className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_announcements}</div>
                            <p className="text-xs text-muted-foreground">
                                Published this month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Discussions</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_discussions}</div>
                            <p className="text-xs text-muted-foreground">
                                Active discussions
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {quickActions.map((action) => (
                                <Button
                                    key={action.title}
                                    variant="outline"
                                    className="h-20 flex-col gap-2"
                                    onClick={() => router.visit(action.href)}
                                >
                                    <div className={`p-2 rounded-lg ${action.color}`}>
                                        <action.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="text-sm">{action.title}</span>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Dashboard Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* My Courses */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">My Courses</h2>
                        </div>
                        <div className="space-y-4">
                            {courses.map((course) => (
                                <Card key={course.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                                                    style={{ backgroundColor: course.color }}
                                                >
                                                    {course.course_code.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{course.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{course.course_code}</p>
                                                </div>
                                            </div>
                                            <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                                                {course.status}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="text-center text-muted-foreground">
                                        <BookOpen className="h-12 w-12 mx-auto mb-4" />
                                        <p>Recent activity will appear here</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Recent Content */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Recent Announcements</h2>
                            <AnnouncementFeed
                                announcements={announcements.slice(0, 5)}
                                maxHeight="300px"
                            />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold mb-4">Upcoming Assignments</h2>
                            <AssignmentList
                                assignments={assignments.filter(a => new Date(a.due_date) > new Date()).slice(0, 5)}
                                showCourseInfo={true}
                                maxHeight="300px"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}