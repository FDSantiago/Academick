import React from 'react';
import AppLayout from '@/layouts/app-layout';
import QuizForm from '@/components/instructor/quiz-form';
import { type BreadcrumbItem, type Course } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';

interface CreateQuizProps {
    courses: Course[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Instructor Dashboard',
        href: '/instructor/dashboard',
    },
    {
        title: 'Quizzes',
        href: '/instructor/quizzes',
    },
    {
        title: 'Create Quiz',
        href: '/instructor/quizzes/create',
    },
];

export default function CreateQuiz({ courses }: CreateQuizProps) {
    const { auth } = usePage().props as any;

    const handleSuccess = (quiz: any) => {
        router.visit('/instructor/quizzes', {
            data: { success: 'Quiz created successfully!' }
        });
    };

    const handleCancel = () => {
        router.visit('/instructor/quizzes');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Quiz" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Create Quiz</h1>
                        <p className="text-muted-foreground mt-1">
                            Create quizzes and assessments for your students.
                        </p>
                    </div>
                </div>

                <QuizForm
                    courses={courses}
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                />
            </div>
        </AppLayout>
    );
}