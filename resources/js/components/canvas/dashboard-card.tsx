import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, BookOpen } from 'lucide-react';

interface DashboardCardProps {
    course: {
        id: number;
        title: string;
        course_code: string;
        description: string;
        instructor?: {
            name: string;
        };
        color: string;
        image_url?: string;
    };
    upcomingAssignments?: number;
    unreadAnnouncements?: number;
}

export function DashboardCard({ course, upcomingAssignments = 0, unreadAnnouncements = 0 }: DashboardCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg font-semibold line-clamp-2">
                            {course.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {course.course_code}
                        </p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                        {course.course_code}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    {course.instructor && (
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="w-4 h-4 mr-2" />
                            <span>{course.instructor.name}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-muted-foreground">
                            <BookOpen className="w-4 h-4 mr-2" />
                            <span>Assignments</span>
                        </div>
                        <Badge variant={upcomingAssignments > 0 ? "destructive" : "secondary"}>
                            {upcomingAssignments}
                        </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-muted-foreground">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>Announcements</span>
                        </div>
                        <Badge variant={unreadAnnouncements > 0 ? "destructive" : "secondary"}>
                            {unreadAnnouncements}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}