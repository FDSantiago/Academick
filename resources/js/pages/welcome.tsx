// import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, Users, Calendar, MessageSquare, Award, Zap } from 'lucide-react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    const features = [
        {
            icon: BookOpen,
            title: 'Course Management',
            description: 'Create and manage courses with rich content, modules, and resources.',
        },
        {
            icon: Users,
            title: 'Collaborative Learning',
            description: 'Engage students with discussions, group work, and peer interactions.',
        },
        {
            icon: Calendar,
            title: 'Assignment Tracking',
            description: 'Submit assignments, track deadlines, and receive timely feedback.',
        },
        {
            icon: MessageSquare,
            title: 'Real-time Communication',
            description: 'Stay connected with announcements, messages, and notifications.',
        },
        {
            icon: Award,
            title: 'Grading & Analytics',
            description: 'Comprehensive gradebook with detailed performance analytics.',
        },
        {
            icon: Zap,
            title: 'Interactive Quizzes',
            description: 'Create engaging assessments with multiple question types.',
        },
    ];

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-[#FDFDFC] via-[#F8F8F7] to-[#F3F3F1] dark:from-[#0a0a0a] dark:via-[#0f0f0f] dark:to-[#141414]">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-[#19140015] bg-white/80 backdrop-blur-md dark:border-[#3E3E3A]/50 dark:bg-[#0a0a0a]/80">
                    <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
                        <nav className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <span className="text-xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">
                                    { import.meta.env.VITE_APP_NAME }
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                {auth.user ? (
                                    <Link
                                        href={'/dashboard'}
                                        className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
                                    >
                                        Go to Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={'/login'}
                                            className="inline-block rounded-lg border border-transparent px-5 py-2 text-sm font-medium text-[#1b1b18] transition-colors hover:bg-[#19140008] dark:text-[#EDEDEC] dark:hover:bg-[#3E3E3A]/30"
                                        >
                                            Log in
                                        </Link>
                                        {canRegister && (
                                            <Link
                                                href={'/register'}
                                                className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
                                            >
                                                Get Started
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative overflow-hidden px-6 py-20 lg:px-8 lg:py-32">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/5"></div>
                        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-500/5"></div>
                    </div>
                    
                    <div className="mx-auto max-w-4xl text-center">
                        <h1 className="mb-6 text-5xl font-bold tracking-tight text-[#1b1b18] sm:text-6xl lg:text-7xl dark:text-[#EDEDEC]">
                            Transform Your
                            <span className="bg-blue-600 bg-clip-text text-transparent">
                                {' '}Learning Experience
                            </span>
                        </h1>
                        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-[#1b1b18]/70 sm:text-xl dark:text-[#EDEDEC]/70">
                            A modern, powerful learning management system designed for educators and students. 
                            Create engaging courses, collaborate seamlessly, and track progress effortlessly.
                        </p>
                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            {!auth.user && (
                                <>
                                    {canRegister && (
                                        <Link
                                            href={'/register'}
                                            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto"
                                        >
                                            Start Learning Today
                                        </Link>
                                    )}
                                    <Link
                                        href={'/login'}
                                        className="inline-flex w-full items-center justify-center rounded-lg border-2 border-[#19140035] bg-white px-8 py-4 text-base font-semibold text-[#1b1b18] transition-all hover:border-[#1915014a] hover:bg-[#19140008] sm:w-auto dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:text-[#EDEDEC] dark:hover:border-[#62605b] dark:hover:bg-[#3E3E3A]/30"
                                    >
                                        Sign In
                                    </Link>
                                </>
                            )}
                            {auth.user && (
                                <Link
                                    href={'/dashboard'}
                                    className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto"
                                >
                                    Go to Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="px-6 py-20 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-3xl font-bold text-[#1b1b18] sm:text-4xl dark:text-[#EDEDEC]">
                                Everything You Need to Succeed
                            </h2>
                            <p className="mx-auto max-w-2xl text-lg text-[#1b1b18]/70 dark:text-[#EDEDEC]/70">
                                Powerful features designed to enhance teaching and learning experiences
                            </p>
                        </div>
                        
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <div
                                        key={index}
                                        className="group relative overflow-hidden rounded-2xl border border-[#19140015] bg-white p-8 shadow-sm transition-all hover:shadow-xl dark:border-[#3E3E3A]/50 dark:bg-[#0a0a0a]/50"
                                    >
                                        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-blue-500/5 transition-transform group-hover:scale-150 dark:bg-blue-500/10"></div>
                                        <div className="relative">
                                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <h3 className="mb-2 text-xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">
                                                {feature.title}
                                            </h3>
                                            <p className="text-[#1b1b18]/70 dark:text-[#EDEDEC]/70">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                {/* <section className="px-6 py-20 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="rounded-3xl border border-[#19140015] bg-gradient-to-br from-blue-50 to-purple-50 p-12 shadow-xl dark:border-[#3E3E3A]/50 dark:from-blue-950/20 dark:to-purple-950/20">
                            <div className="grid gap-8 sm:grid-cols-3">
                                <div className="text-center">
                                    <div className="mb-2 text-4xl font-bold text-blue-600 dark:text-blue-400">
                                        10K+
                                    </div>
                                    <div className="text-[#1b1b18]/70 dark:text-[#EDEDEC]/70">
                                        Active Students
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="mb-2 text-4xl font-bold text-purple-600 dark:text-purple-400">
                                        500+
                                    </div>
                                    <div className="text-[#1b1b18]/70 dark:text-[#EDEDEC]/70">
                                        Courses Available
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="mb-2 text-4xl font-bold text-blue-600 dark:text-blue-400">
                                        98%
                                    </div>
                                    <div className="text-[#1b1b18]/70 dark:text-[#EDEDEC]/70">
                                        Satisfaction Rate
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section> */}

                {/* CTA Section */}
                <section className="px-6 py-20 lg:px-8">
                    <div className="mx-auto max-w-4xl text-center">
                        <h2 className="mb-6 text-3xl font-bold text-[#1b1b18] sm:text-4xl dark:text-[#EDEDEC]">
                            Ready to Get Started?
                        </h2>
                        <p className="mb-10 text-lg text-[#1b1b18]/70 dark:text-[#EDEDEC]/70">
                            Join thousands of students and educators already using { import.meta.env.VITE_APP_NAME }
                        </p>
                        {!auth.user && canRegister && (
                            <Link
                                href={'/register'}
                                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
                            >
                                Create Your Account
                            </Link>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-[#19140015] px-6 py-12 dark:border-[#3E3E3A]/50">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <span className="font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">
                                    { import.meta.env.VITE_APP_NAME }
                                </span>
                            </div>
                            <p className="text-sm text-[#1b1b18]/60 dark:text-[#EDEDEC]/60">
                                © {new Date().getFullYear()} { import.meta.env.VITE_APP_NAME }. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
