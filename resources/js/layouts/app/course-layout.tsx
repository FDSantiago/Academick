import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { type BreadcrumbItem, type Course } from '@/types';
import { type PropsWithChildren } from 'react';
import {
    Home,
    Megaphone,
    Video,
    BookOpen,
    MessageSquare,
    FileText,
    Trophy,
    GraduationCap,
    Users,
    FileStack,
    Cloud,
    File,
    ExternalLink,
    Flag,
    Calendar,
    Settings,
    RefreshCw,
    CheckCircle2,
    Circle,
    Plus,
    BarChart3,
    Bell
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const courseNavItems = [
    { title: 'Home', icon: Home, href: '#' },
    { title: 'Announcements', icon: Megaphone, href: '#' },
    { title: 'BigBlueButton', icon: Video, href: '#' },
    { title: 'Modules', icon: BookOpen, href: '#' },
    { title: 'Discussions', icon: MessageSquare, href: '#' },
    { title: 'Assignments', icon: FileText, href: '#' },
    { title: 'Quizzes', icon: Trophy, href: '#' },
    { title: 'Grades', icon: GraduationCap, href: '#' },
    { title: 'People', icon: Users, href: '#' },
    { title: 'Syllabus', icon: FileStack, href: '#' },
    { title: 'Collaborations', icon: Users, href: '#' },
    { title: 'Google Drive', icon: Cloud, href: '#' },
    { title: 'Pages', icon: File, href: '#' },
    { title: 'Canvas LMS Satisfactory Survey', icon: ExternalLink, href: '#' },
    { title: 'Report Problem on BigBlueButton', icon: Flag, href: '#' },
    { title: 'Outcomes', icon: BarChart3, href: '#' },
    { title: 'TIP Manila Library Video Presentation', icon: Video, href: '#' },
    { title: 'Credentials', icon: FileText, href: '#' },
];

interface CourseLayoutProps extends PropsWithChildren {
    course: Course;
    breadcrumbs?: BreadcrumbItem[];
}

export default function CourseLayout({
    children,
    course,
    breadcrumbs = [],
}: CourseLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            
            <div className="flex flex-1 h-screen overflow-hidden">
                {/* Left Sidebar - Course Navigation */}
                <aside className="w-64 border-r bg-card flex flex-col overflow-hidden">
                    {/* Course Header */}
                    <div className="p-4 border-b shrink-0">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <Home className="h-4 w-4" />
                            </Button>
                            <h2 className="text-sm font-semibold text-primary truncate">
                                {course.course_code} - {course.title}
                            </h2>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 overflow-y-auto p-2">
                        <div className="space-y-1">
                            {courseNavItems.map((item, index) => (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                                        index === 0
                                            ? "bg-accent text-accent-foreground font-medium"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{item.title}</span>
                                </Link>
                            ))}
                        </div>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto">
                    <AppContent variant="sidebar" className="overflow-x-hidden">
                        <div className="container max-w-5xl mx-auto p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h1 className="text-3xl font-bold">
                                    {course.course_code} - {course.title}
                                </h1>
                                <Button variant="outline" size="sm">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Immersive Reader
                                </Button>
                            </div>

                            {children}
                        </div>
                    </AppContent>
                </main>

                {/* Right Sidebar - To-Do */}
                <aside className="w-80 border-l bg-card flex flex-col overflow-hidden">
                    {/* To-Do Header */}
                    <div className="p-4 border-b shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">To-Do</h3>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Week Selector */}
                        <div className="flex items-center justify-between text-sm">
                            <Button variant="outline" size="sm">
                                Week
                            </Button>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <span>←</span>
                                </Button>
                                <span className="text-sm font-medium">Oct 26 - Nov 1</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <span>→</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* To-Do Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {/* Progress Card */}
                        <Card className="mb-4">
                            <CardContent className="pt-6">
                                <div className="text-center mb-4">
                                    <div className="text-4xl font-bold mb-1">100%</div>
                                    <div className="text-sm text-muted-foreground">0/0</div>
                                </div>
                                <Separator className="mb-4" />
                                <div className="flex justify-around text-center text-sm">
                                    <div>
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <MessageSquare className="h-4 w-4" />
                                            <span className="font-medium">0</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <FileText className="h-4 w-4" />
                                            <span className="font-medium">0</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span className="font-medium">0</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* No Tasks Message */}
                        <div className="text-center py-8">
                            <Circle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-4">No tasks</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Assignment
                            </Button>
                            <Button variant="outline" className="w-full justify-start" size="sm">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Course Stream
                            </Button>
                            <Button variant="outline" className="w-full justify-start" size="sm">
                                <Calendar className="h-4 w-4 mr-2" />
                                View Course Calendar
                            </Button>
                            <Button variant="outline" className="w-full justify-start" size="sm">
                                <Bell className="h-4 w-4 mr-2" />
                                View Course Notifications
                            </Button>
                        </div>

                        {/* Recent Feedback */}
                        <div className="mt-6">
                            <h4 className="text-sm font-semibold mb-2">Recent Feedback</h4>
                            <p className="text-sm text-muted-foreground">Nothing for now</p>
                        </div>
                    </div>
                </aside>
            </div>
        </AppShell>
    );
}