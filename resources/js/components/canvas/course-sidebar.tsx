import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    BookOpen,
    Users,
    Calendar,
    FileText,
    MessageSquare,
    BarChart3,
    Settings,
    ChevronRight,
    GraduationCap,
    BookMarked
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { router } from '@inertiajs/react';

interface CourseSidebarProps {
    course: {
        id: number;
        title: string;
        course_code: string;
        description: string;
        instructor?: {
            name: string;
        };
        color: string;
    };
    activeSection?: string;
    enrollmentCount?: number;
    userRole?: string;
    onTabChange?: (tab: string) => void;
}

export function CourseSidebar({ course, activeSection = 'home', enrollmentCount = 0, userRole, onTabChange }: CourseSidebarProps) {
    const isInstructor = userRole === 'instructor';
    const navigationItems = [
        {
            id: 'home',
            label: 'Home',
            icon: BookOpen,
            href: `/courses/${course.id}`,
        },
        {
            id: 'announcements',
            label: 'Announcements',
            icon: MessageSquare,
            href: `/courses/${course.id}/announcements`,
            onClick: () => onTabChange && onTabChange('announcements'),
        },
        {
            id: 'assignments',
            label: 'Assignments',
            icon: FileText,
            href: `/courses/${course.id}/assignments`,
            onClick: () => onTabChange && onTabChange('assignments'),
        },
        {
            id: 'quizzes',
            label: 'Quizzes',
            icon: BookMarked,
            href: `/courses/${course.id}/quizzes`,
        },
        {
            id: 'discussions',
            label: 'Discussions',
            icon: MessageSquare,
            href: `/courses/${course.id}/discussions`,
        },
        {
            id: 'grades',
            label: 'Grades',
            icon: BarChart3,
            href: `/courses/${course.id}/grades`,
        },
        ...(isInstructor ? [{
            id: 'grading',
            label: 'Grade Submissions',
            icon: GraduationCap,
            href: `/courses/${course.id}/grading`,
        }] : []),
        {
            id: 'people',
            label: 'People',
            icon: Users,
            href: `/courses/${course.id}/people`,
        },
    ];

    return (
        <div className="space-y-4">
            {/* Course Info Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <Badge variant="secondary">{course.course_code}</Badge>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                        {course.instructor && (
                            <div className="flex items-center text-muted-foreground">
                                <Users className="w-4 h-4 mr-2" />
                                <span>{course.instructor.name}</span>
                            </div>
                        )}
                        <div className="flex items-center text-muted-foreground">
                            <Users className="w-4 h-4 mr-2" />
                            <span>{enrollmentCount} students</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Navigation */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Course Navigation</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[300px]">
                        <div className="space-y-1 p-2">
                            {navigationItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeSection === item.id;

                                return item.onClick ? (
                                    <Button
                                        key={item.id}
                                        variant={isActive ? "secondary" : "ghost"}
                                        className={`w-full justify-start ${
                                            isActive ? 'bg-secondary' : ''
                                        }`}
                                        size="sm"
                                        onClick={item.onClick}
                                    >
                                        <Icon className="w-4 h-4 mr-3" />
                                        <span className="flex-1 text-left">{item.label}</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                ) : (
                                    <Link key={item.id} href={item.href}>
                                        <Button
                                            variant={isActive ? "secondary" : "ghost"}
                                            className={`w-full justify-start ${
                                                isActive ? 'bg-secondary' : ''
                                            }`}
                                            size="sm"
                                        >
                                            <Icon className="w-4 h-4 mr-3" />
                                            <span className="flex-1 text-left">{item.label}</span>
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                        <Calendar className="w-4 h-4 mr-2" />
                        View Calendar
                    </Button>
                    {isInstructor && (
                        <Button variant="outline" size="sm" className="w-full justify-start">
                            <FileText className="w-4 h-4 mr-2" />
                            Create Assignment
                        </Button>
                    )}
                    {isInstructor && (
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => router.visit(`/instructor/announcements/create`)}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Create Announcement
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="w-full justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        Course Settings
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}