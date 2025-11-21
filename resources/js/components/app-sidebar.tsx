import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Book, BookOpen, Folder, LayoutGrid, Users, BookMarked   } from 'lucide-react';
import AppLogo from './app-logo';
import { NavAdmin } from './nav-admin';

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: Folder,
    // },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

export function AppSidebar() {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const roles = (auth?.user?.roles as string[]) ?? [];
    const isAdmin = Array.isArray(roles) && roles.includes('admin');
    const isInstructor = Array.isArray(roles) && roles.includes('instructor');

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Courses',
            href: '/courses',
            icon: Book,
        },
        {
            title: 'Assignments',
            href: '/assignments',
            icon: BookMarked,
        },
    ];

    const adminNavItems: NavItem[] = [
        {
            title: 'User Management',
            href: '/admin/users',
            icon: Users,
        },
        {
            title: 'Course Management',
            href: '/admin/courses',
            icon: BookOpen,
        },
    ];

    const instructorNavItems: NavItem[] = [
        {
            title: 'Instructor Dashboard',
            href: '/instructor/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Assignments',
            href: '/instructor/assignments',
            icon: BookMarked,
        },
        {
            title: 'Announcements',
            href: '/instructor/announcements',
            icon: BookOpen,
        },
        {
            title: 'Quizzes',
            href: '/instructor/quizzes',
            icon: BookMarked,
        },
        {
            title: 'Discussions',
            href: '/instructor/discussions',
            icon: BookOpen,
        },
        // {
        //     title: 'Grading',
        //     href: '/instructor/grading',
        //     icon: Users,
        // },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={'/dashboard'} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                {isInstructor && <NavAdmin items={instructorNavItems} />}
                {isAdmin && <NavAdmin items={adminNavItems} />}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
