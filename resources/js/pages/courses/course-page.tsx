import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { CourseSidebar } from '@/components/canvas/course-sidebar';
import { AnnouncementFeed } from '@/components/canvas/announcement-feed';
import { AssignmentList } from '@/components/canvas/assignment-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, Calendar, MessageSquare, FileText } from 'lucide-react';
import { type BreadcrumbItem, type Course } from '@/types';
import { Head, usePage } from '@inertiajs/react';

interface CourseShowProps {
    course: Course;
    announcements?: any[];
    assignments?: any[];
    modules?: any[];
    discussions?: any[];
    enrollmentCount?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Courses',
        href: '/courses',
    },
];

const CourseShow: React.FC<CourseShowProps> = ({
    course,
    announcements = [],
    assignments = [],
    modules = [],
    discussions = [],
    enrollmentCount = 0
}) => {
    const { auth } = usePage().props as any;
    const roles = (auth?.user?.roles as string[]) ?? [];
    const userRole = roles.includes('instructor') ? 'instructor' : roles.includes('admin') ? 'admin' : 'student';
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);

    if (breadcrumbs.length === 1) {
        breadcrumbs.push({
            title: `${course.title} (${course.course_code})`,
            href: `/courses/${course.id}`,
        });
    }

    useEffect(() => {
        // Fetch course data if needed
        const fetchCourseData = async () => {
            setLoading(true);
            try {
                // API calls would go here
                // For now, using props data
            } catch (error) {
                console.error('Failed to fetch course data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, [course.id]);

    return (
        <AppLayout course={course} breadcrumbs={breadcrumbs}>
            <Head title={`${course.course_code} - ${course.title}`} />

            <div className="flex gap-6 p-4">
                {/* Sidebar */}
                <div className="w-80 flex-shrink-0">
                    <CourseSidebar
                        course={course}
                        activeSection={activeTab}
                        enrollmentCount={enrollmentCount}
                        userRole={userRole}
                        onTabChange={setActiveTab}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="announcements">Announcements</TabsTrigger>
                            <TabsTrigger value="assignments">Assignments</TabsTrigger>
                            {/* <TabsTrigger value="discussions">Discussions</TabsTrigger> */}
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6 mt-6">
                            {/* Course Header */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-2xl">{course.title}</CardTitle>
                                            <p className="text-muted-foreground mt-2">{course.description}</p>
                                            <div className="flex items-center gap-4 mt-4">
                                                <Badge variant="secondary">{course.course_code}</Badge>
                                                {course.instructor && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Users className="w-4 h-4" />
                                                        <span>Instructor: {course.instructor.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center">
                                            <FileText className="w-8 h-8 text-blue-500 mr-3" />
                                            <div>
                                                <p className="text-2xl font-bold">{assignments.length}</p>
                                                <p className="text-sm text-muted-foreground">Assignments</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center">
                                            <MessageSquare className="w-8 h-8 text-green-500 mr-3" />
                                            <div>
                                                <p className="text-2xl font-bold">{announcements.length}</p>
                                                <p className="text-sm text-muted-foreground">Announcements</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center">
                                            <Users className="w-8 h-8 text-purple-500 mr-3" />
                                            <div>
                                                <p className="text-2xl font-bold">{enrollmentCount}</p>
                                                <p className="text-sm text-muted-foreground">Students</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Recent Activity */}
                            <div className="grid gap-6 lg:grid-cols-2">
                                <AnnouncementFeed
                                    announcements={announcements.slice(0, 3)}
                                    maxHeight="300px"
                                />
                                <AssignmentList
                                    assignments={assignments.slice(0, 3)}
                                    maxHeight="300px"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="announcements" className="mt-6">
                            <AnnouncementFeed announcements={announcements} />
                        </TabsContent>

                        <TabsContent value="assignments" className="mt-6">
                            <AssignmentList assignments={assignments} />
                        </TabsContent>

                        <TabsContent value="discussions" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Course Discussions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {discussions.length === 0 ? (
                                        <p className="text-muted-foreground">No discussions yet.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {discussions.map((discussion: any) => (
                                                <div key={discussion.id} className="border rounded-lg p-4">
                                                    <h4 className="font-medium">{discussion.title}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {discussion.description}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
};

export default CourseShow;
