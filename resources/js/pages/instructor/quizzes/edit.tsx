import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuizQuestionBuilder from '@/components/instructor/quiz-question-builder';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    Plus, 
    Edit, 
    Trash2, 
    GripVertical,
    ArrowLeft,
    Loader2,
    FileText
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import type { BreadcrumbItem, Quiz, QuizQuestion, Course } from '@/types';

interface EditQuizProps {
    quiz: Quiz;
    course: Course;
    questions: QuizQuestion[];
}

export default function EditQuiz({ quiz, course, questions: initialQuestions }: EditQuizProps) {
    const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
    const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | undefined>();
    const [deletingQuestion, setDeletingQuestion] = useState<QuizQuestion | undefined>();
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(false);

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
            title: `Editing quiz "${quiz.title}"`,
            href: `/instructor/quizzes/${quiz.id}/edit`,
        },
    ];

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/instructor/quizzes/${quiz.id}/questions`);
            setQuestions(response.data.questions);
        } catch (error) {
            console.error('Failed to fetch questions:', error);
            toast.error('Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

    const handleQuestionSuccess = () => {
        setShowQuestionBuilder(false);
        setEditingQuestion(undefined);
        fetchQuestions();
    };

    const handleDeleteQuestion = async () => {
        if (!deletingQuestion) return;

        try {
            setDeleting(true);
            await axios.delete(`/api/instructor/quizzes/${quiz.id}/questions/${deletingQuestion.id}`);
            toast.success('Question deleted successfully!');
            setDeletingQuestion(undefined);
            fetchQuestions();
        } catch (error: any) {
            console.error('Failed to delete question:', error);
            toast.error(error.response?.data?.message || 'Failed to delete question');
        } finally {
            setDeleting(false);
        }
    };

    const handleReorder = async (newOrder: QuizQuestion[]) => {
        try {
            const questionIds = newOrder.map(q => q.id);
            await axios.post(`/api/instructor/quizzes/${quiz.id}/questions/reorder`, {
                question_ids: questionIds
            });
            setQuestions(newOrder);
            toast.success('Questions reordered successfully!');
        } catch (error: any) {
            console.error('Failed to reorder questions:', error);
            toast.error(error.response?.data?.message || 'Failed to reorder questions');
        }
    };

    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        const newQuestions = [...questions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex < 0 || targetIndex >= newQuestions.length) return;
        
        [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
        handleReorder(newQuestions);
    };

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Quiz: ${quiz.title}`} />

            <div className="    p-4 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.visit('/instructor/quizzes')}
                            className="mb-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Quizzes
                        </Button>
                        <h1 className="text-3xl font-bold">{quiz.title}</h1>
                        <p className="text-muted-foreground mt-1">
                            {course.course_code} - {course.title}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{totalPoints}</div>
                        <div className="text-sm text-muted-foreground">Total Points</div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="questions" className="w-full">
                    <TabsList>
                        <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="questions" className="space-y-4">
                        {/* Add Question Button */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Questions</h2>
                            <Button
                                onClick={() => {
                                    setEditingQuestion(undefined);
                                    setShowQuestionBuilder(true);
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Question
                            </Button>
                        </div>

                        {/* Questions List */}
                        {loading ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                                    <p className="text-muted-foreground">Loading questions...</p>
                                </CardContent>
                            </Card>
                        ) : questions.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                    <p className="text-muted-foreground mb-4">No questions yet</p>
                                    <Button
                                        onClick={() => {
                                            setEditingQuestion(undefined);
                                            setShowQuestionBuilder(true);
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Your First Question
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {questions.map((question, index) => (
                                    <Card key={question.id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-4">
                                                {/* Reorder Controls */}
                                                <div className="flex flex-col gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => moveQuestion(index, 'up')}
                                                        disabled={index === 0}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        ▲
                                                    </Button>
                                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => moveQuestion(index, 'down')}
                                                        disabled={index === questions.length - 1}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        ▼
                                                    </Button>
                                                </div>

                                                {/* Question Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge variant="outline">Q{index + 1}</Badge>
                                                            <Badge variant="secondary">
                                                                {question.question_type.replace(/_/g, ' ')}
                                                            </Badge>
                                                            <Badge>{question.points} pts</Badge>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-medium mb-2">
                                                        {question.question_text}
                                                    </p>
                                                    {question.options && question.options.length > 0 && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {question.options.length} options
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingQuestion(question);
                                                            setShowQuestionBuilder(true);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => setDeletingQuestion(question)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                </Tabs>
            </div>

            {/* Question Builder Dialog */}
            <Dialog open={showQuestionBuilder} onOpenChange={setShowQuestionBuilder}>
                <DialogContent className="min-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingQuestion ? 'Edit Question' : 'Add Question'}
                        </DialogTitle>
                    </DialogHeader>
                    <QuizQuestionBuilder
                        quizId={quiz.id}
                        question={editingQuestion}
                        onSuccess={handleQuestionSuccess}
                        onCancel={() => {
                            setEditingQuestion(undefined);
                            setShowQuestionBuilder(false);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingQuestion} onOpenChange={() => setDeletingQuestion(undefined)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Question?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this question? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeletingQuestion(undefined)}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteQuestion}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}