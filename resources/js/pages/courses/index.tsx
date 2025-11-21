import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { Course } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { FileQuestion, LoaderCircle, Flag, FileText, MessageSquare, Folder, Megaphone, BookCheck, MessagesSquare } from 'lucide-react';

interface CoursesPageProps {
    userRoles: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Courses',
        href: '/courses',
    },
];

const CoursesPage: React.FC = () => {
    const { props } = usePage<CoursesPageProps>();
    const { userRoles } = props;
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await fetch('/api/courses');
                const data = await response.json();

                const coursesWithDetails = await Promise.all(
                    data.map(async (course: Course) => {
                        const [announcements, assignments, discussions] = await Promise.all([
                            fetch(`/api/instructor/courses/${course.id}/announcements`).then((res) => res.json()),
                            fetch(`/api/instructor/courses/${course.id}/assignments`).then((res) => res.json()),
                            fetch(`/api/instructor/courses/${course.id}/discussions`).then((res) => res.json()),
                        ]);
                        return { ...course, announcements, assignments, discussions };
                    }),
                );

                setCourses(coursesWithDetails);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching courses:', error);
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const getRoleDisplay = () => {
        if (userRoles.includes('admin')) {
            return 'Admin';
        } else if (userRoles.includes('instructor')) {
            return 'Instructor';
        } else {
            return 'Student';
        }
    };

    const getTitle = () => {
        if (userRoles.includes('admin')) {
            return 'All Courses';
        } else if (userRoles.includes('instructor')) {
            return 'Courses You Manage';
        } else {
            return 'Your Enrolled Courses';
        }
    };

    const getEmptyMessages = () => {
        if (userRoles.includes('admin')) {
            return {  
                title: 'No courses created',
                description: 'You can create a new course by clicking the "Create Course" button.',
            };
        } else if (userRoles.includes('instructor')) {
            return {
                title: 'You aren\'t teaching any courses',
                description: 'Ask an admin to assign you to a course.',
            };
        } else if (userRoles.includes('teaching_assistant')) {
          return {
              title: 'You aren\'t associated with any courses',
              description: 'Ask an instructor or admin to assign you to a course.',
          };
        } else {
            return {
                title: 'You aren\'t enrolled in any courses',
                description: 'Please check with the registrar if you\'re enrolled. Or contact the IT department.',
            };
        }
    };

    const emptyMessageData = getEmptyMessages();

    return (
        <>
            <Head title="Courses" />
            <AppSidebarLayout {...{ breadcrumbs }}>
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <LoaderCircle className="animate-spin size-16" />
                    </div>
                ) : courses.length === 0 ? (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <FileQuestion />
                            </EmptyMedia>
                            <EmptyTitle>{emptyMessageData.title}</EmptyTitle>
                            <EmptyDescription>{emptyMessageData.description}</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {courses.map((course) => (
                            <a
                                key={course.id}
                                className="group relative flex flex-col overflow-hidden rounded-lg border border-border hover:border-white/50 bg-card shadow-sm transition-all hover:shadow-md"
                                href={`/courses/${course.id}`}
                            >
                                {/* Header with image and overlay */}
                                <div className="relative h-40 overflow-hidden">
                                    {/* Background image with overlay */}
                                    <div
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{
                                            backgroundImage: course.image_url
                                                ? `url(${course.image_url})`
                                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        }}
                                    >
                                        <div
                                            className="absolute inset-0 opacity-60"
                                            style={{ backgroundColor: course.color || '#667eea' }}
                                        />
                                    </div>
                                    
                                    {/* Progress badge */}
                                    {/* <div className="absolute left-3 top-3 rounded-md bg-cyan-500 px-2 py-1 text-xs font-semibold text-white">
                                        92.75%
                                    </div> */}
                                    
                                    {/* Three dots menu */}
                                    {/* <button className="absolute right-3 top-3 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                        </svg>
                                    </button> */}
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col p-4">
                                    {/* Course code and title */}
                                    <div className="mb-2">
                                        <h3 className="text-sm font-semibold text-primary">
                                            {course.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {course.course_code}
                                        </p>
                                        {/* <p className="mt-1 text-xs text-muted-foreground">
                                            First Semester SY 2025-2026 (College)
                                        </p> */}
                                    </div>

                                    {/* Action icons */}
                                    <div className="mb-3 flex items-center gap-4 border-b border-border pb-3">
                                        <div className="flex items-center gap-4">
                                            <a
                                                href={`/courses/${course.id}/announcements`}
                                                className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                <Megaphone className="h-4 w-4" />
                                                <span className="text-xs">{course.announcements?.length ?? 0}</span>
                                            </a>
                                            <a
                                                href={`/courses/${course.id}/assignments`}
                                                className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                <BookCheck className="h-4 w-4" />
                                                <span className="text-xs">{course.assignments?.length ?? 0}</span>
                                            </a>
                                            <a
                                                href={`/courses/${course.id}/discussions`}
                                                className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                <MessagesSquare className="h-4 w-4" />
                                                <span className="text-xs">{course.discussions?.length ?? 0}</span>
                                            </a>
                                        </div>
                                    </div>

                                    {/* Due section */}
                                    <div className="mt-auto">
                                        <p className="text-sm font-semibold text-foreground">
                                            {course.assignments && course.assignments.length > 0
                                                ? 'Next Due Date'
                                                : 'No Due Dates'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {course.assignments && course.assignments.length > 0
                                                ? new Date(course.assignments[0].due_date).toLocaleDateString()
                                                : 'None'}
                                        </p>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </AppSidebarLayout>
        </>
    );
};

export default CoursesPage;
