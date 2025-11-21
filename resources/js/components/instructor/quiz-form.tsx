import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Trophy, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

type Course = {
    id: number;
    title: string;
    course_code: string;
};

interface QuizQuestion {
    id?: number;
    question: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    options?: string[];
    correct_answer: string;
    points: number;
}

interface QuizFormProps {
    courses?: Course[];
    quiz?: any;
    onSuccess: (quiz: any) => void;
    onCancel: () => void;
}

export default function QuizForm({
    courses,
    quiz,
    onSuccess,
    onCancel
}: QuizFormProps) {
    const safeCourses = courses || [];
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [questions, setQuestions] = useState<QuizQuestion[]>(quiz?.questions || []);

    const initialShowResults = typeof quiz?.show_results === 'boolean'
        ? (quiz.show_results ? 'after_due_date' : 'never')
        : (quiz?.show_results || 'after_due_date');

    const { data, setData, processing } = useForm({
        title: quiz?.title || '',
        description: quiz?.description || '',
        course_id: quiz?.course_id || '',
        open_date: quiz?.open_date || '',
        due_date: quiz?.due_date || '',
        time_limit: quiz?.time_limit || '',
        attempts_allowed: quiz?.attempts_allowed || 1,
        shuffle_questions: quiz?.shuffle_questions || false,
        show_results: initialShowResults,
        is_draft: quiz?.is_draft || false,
        instructions: quiz?.instructions || '',
    });

    const addQuestion = () => {
        setQuestions([...questions, {
            question: '',
            type: 'multiple_choice',
            options: ['', '', '', ''],
            correct_answer: '',
            points: 1,
        }]);
    };

    const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
        const updatedQuestions = [...questions];
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
        setQuestions(updatedQuestions);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const addOption = (questionIndex: number) => {
        const updatedQuestions = [...questions];
        if (updatedQuestions[questionIndex].options) {
            updatedQuestions[questionIndex].options!.push('');
        }
        setQuestions(updatedQuestions);
    };

    const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const updatedQuestions = [...questions];
        if (updatedQuestions[questionIndex].options) {
            updatedQuestions[questionIndex].options![optionIndex] = value;
        }
        setQuestions(updatedQuestions);
    };

    const removeOption = (questionIndex: number, optionIndex: number) => {
        const updatedQuestions = [...questions];
        if (updatedQuestions[questionIndex].options) {
            updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options!.filter((_, i) => i !== optionIndex);
        }
        setQuestions(updatedQuestions);
    };

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErrors({});

        try {
            await axios.get('/sanctum/csrf-cookie');
            const url = quiz
                ? `/api/instructor/courses/${data.course_id}/quizzes/${quiz.id}`
                : `/api/instructor/courses/${data.course_id}/quizzes`;
            const method = quiz ? 'put' : 'post';

            const payload = {
                ...data,
                show_results: data.show_results === 'immediately' || data.show_results === 'after_due_date',
                questions: questions,
            };

            const res = await axios[method](url, payload);

            if (res.status === 200 || res.status === 201) {
                onSuccess(res.data);
            } else {
                throw new Error('Failed to save quiz');
            }
        } catch (err: any) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
            } else {
                const text = err?.message ?? 'Network error';
                setErrors({ general: text });
            }
        }
    }

    return (
        <Card className="w-full max-w-6xl mx-auto">
            <CardHeader>
                <CardTitle>
                    {quiz ? 'Edit Quiz' : 'Create New Quiz'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {errors.general}
                        </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Quiz title"
                                    required
                                />
                                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="course_id">Course *</Label>
                                <Select
                                    value={data.course_id}
                                    onValueChange={(value) => setData('course_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {safeCourses.map((course) => (
                                            <SelectItem key={course.id} value={String(course.id)}>
                                                {course.course_code} - {course.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.course_id && <p className="text-sm text-red-500">{errors.course_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="open_date">Open Date *</Label>
                                <Input
                                    id="open_date"
                                    type="datetime-local"
                                    value={data.open_date}
                                    onChange={(e) => setData('open_date', e.target.value)}
                                    required
                                />
                                {errors.open_date && <p className="text-sm text-red-500">{errors.open_date}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="due_date">Due Date *</Label>
                                <Input
                                    id="due_date"
                                    type="datetime-local"
                                    value={data.due_date}
                                    onChange={(e) => setData('due_date', e.target.value)}
                                    required
                                />
                                {errors.due_date && <p className="text-sm text-red-500">{errors.due_date}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                                <Input
                                    id="time_limit"
                                    type="number"
                                    value={data.time_limit}
                                    onChange={(e) => setData('time_limit', e.target.value)}
                                    placeholder="60"
                                    min="1"
                                />
                                {errors.time_limit && <p className="text-sm text-red-500">{errors.time_limit}</p>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="attempts_allowed">Attempts Allowed</Label>
                                <Select
                                    value={String(data.attempts_allowed)}
                                    onValueChange={(value) => setData('attempts_allowed', parseInt(value))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 attempt</SelectItem>
                                        <SelectItem value="2">2 attempts</SelectItem>
                                        <SelectItem value="3">3 attempts</SelectItem>
                                        <SelectItem value="unlimited">Unlimited</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="show_results">Show Results</Label>
                                <Select
                                    value={data.show_results}
                                    onValueChange={(value) => setData('show_results', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="immediately">Immediately</SelectItem>
                                        <SelectItem value="after_due_date">After due date</SelectItem>
                                        <SelectItem value="never">Never</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="shuffle_questions"
                                    checked={data.shuffle_questions}
                                    onCheckedChange={(checked) => setData('shuffle_questions', !!checked)}
                                />
                                <Label htmlFor="shuffle_questions">
                                    Shuffle questions for each attempt
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_draft"
                                    checked={data.is_draft}
                                    onCheckedChange={(checked) => setData('is_draft', !!checked)}
                                />
                                <Label htmlFor="is_draft" className="flex items-center gap-2">
                                    <EyeOff className="h-4 w-4" />
                                    Save as draft
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Brief description of the quiz..."
                            rows={3}
                            required
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instructions">Instructions</Label>
                        <Textarea
                            id="instructions"
                            value={data.instructions}
                            onChange={(e) => setData('instructions', e.target.value)}
                            placeholder="Special instructions for students..."
                            rows={3}
                        />
                        {errors.instructions && <p className="text-sm text-red-500">{errors.instructions}</p>}
                    </div>

                    {/* Questions Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Questions</h3>
                            <Button type="button" onClick={addQuestion} variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Question
                            </Button>
                        </div>

                        {questions.length === 0 ? (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">No questions added yet</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((question, index) => (
                                    <Card key={index}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-4">
                                                <h4 className="font-medium">Question {index + 1}</h4>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeQuestion(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2 mb-4">
                                                <div className="space-y-2">
                                                    <Label>Question Type</Label>
                                                    <Select
                                                        value={question.type}
                                                        onValueChange={(value: any) => updateQuestion(index, 'type', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                                            <SelectItem value="true_false">True/False</SelectItem>
                                                            <SelectItem value="short_answer">Short Answer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Points</Label>
                                                    <Input
                                                        type="number"
                                                        value={question.points}
                                                        onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value))}
                                                        min="1"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <Label>Question</Label>
                                                <Textarea
                                                    value={question.question}
                                                    onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                                    placeholder="Enter your question..."
                                                    rows={2}
                                                />
                                            </div>

                                            {question.type === 'multiple_choice' && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label>Options</Label>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => addOption(index)}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    {question.options?.map((option, optionIndex) => (
                                                        <div key={optionIndex} className="flex items-center gap-2">
                                                            <Input
                                                                value={option}
                                                                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                                                placeholder={`Option ${optionIndex + 1}`}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => removeOption(index, optionIndex)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label>Correct Answer</Label>
                                                {question.type === 'true_false' ? (
                                                    <Select
                                                        value={question.correct_answer}
                                                        onValueChange={(value) => updateQuestion(index, 'correct_answer', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select answer" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="true">True</SelectItem>
                                                            <SelectItem value="false">False</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input
                                                        value={question.correct_answer}
                                                        onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                                                        placeholder="Enter the correct answer..."
                                                    />
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? (quiz ? 'Updating...' : 'Creating...')
                                : (quiz ? 'Update Quiz' : 'Create Quiz')
                            }
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}