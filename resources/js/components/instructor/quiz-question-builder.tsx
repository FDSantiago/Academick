import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QuestionTypeSelector } from './question-type-selector';
import { 
    Plus, 
    Trash2, 
    GripVertical, 
    Loader2,
    Save,
    X
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import type { QuizQuestion, QuizQuestionOption } from '@/types';

interface QuizQuestionBuilderProps {
    quizId: number;
    question?: QuizQuestion;
    onSuccess?: () => void;
    onCancel?: () => void;
}

interface QuestionFormData {
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    points: number;
    correct_answer?: string;
    options?: { text: string; is_correct: boolean }[];
}

export default function QuizQuestionBuilder({ 
    quizId, 
    question, 
    onSuccess, 
    onCancel 
}: QuizQuestionBuilderProps) {
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch, setValue, control } = useForm<QuestionFormData>({
        defaultValues: question ? {
            question_text: question.question_text,
            question_type: question.question_type,
            points: question.points,
            correct_answer: question.correct_answer,
            options: question.options?.map(o => ({ text: o.option_text, is_correct: o.is_correct })) || [],
        } : {
            question_text: '',
            question_type: 'multiple_choice',
            points: 1,
            options: [
                { text: '', is_correct: false },
                { text: '', is_correct: false },
            ],
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'options',
    });

    const questionType = watch('question_type');
    const options = watch('options');

    const onSubmit = async (data: QuestionFormData) => {
        try {
            setSubmitting(true);

            // Validation
            if (data.question_type === 'multiple_choice') {
                if (!data.options || data.options.length < 2) {
                    toast.error('Multiple choice questions must have at least 2 options');
                    return;
                }
                
                const hasCorrect = data.options.some(o => o.is_correct);
                if (!hasCorrect) {
                    toast.error('Please mark at least one option as correct');
                    return;
                }

                const hasEmptyOption = data.options.some(o => !o.text.trim());
                if (hasEmptyOption) {
                    toast.error('All options must have text');
                    return;
                }
            }

            const url = question
                ? `/api/instructor/quizzes/${quizId}/questions/${question.id}`
                : `/api/instructor/quizzes/${quizId}/questions`;

            const method = question ? 'put' : 'post';

            await axios[method](url, data);

            toast.success(question ? 'Question updated successfully!' : 'Question created successfully!');
            
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error('Failed to save question:', error);
            toast.error(error.response?.data?.message || 'Failed to save question');
        } finally {
            setSubmitting(false);
        }
    };

    const renderQuestionTypeFields = () => {
        switch (questionType) {
            case 'multiple_choice':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Answer Options</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ text: '', is_correct: false })}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Option
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-start gap-3">
                                    <div className="flex items-center gap-2 pt-2">
                                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                                        <Checkbox
                                            checked={options?.[index]?.is_correct || false}
                                            onCheckedChange={(checked) => {
                                                setValue(`options.${index}.is_correct`, checked as boolean);
                                            }}
                                        />
                                    </div>
                                    <Input
                                        {...register(`options.${index}.text` as const, {
                                            required: 'Option text is required'
                                        })}
                                        placeholder={`Option ${index + 1}`}
                                        className="flex-1"
                                    />
                                    {fields.length > 2 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Check the box next to the correct answer(s)
                        </p>
                    </div>
                );

            case 'true_false':
                return (
                    <div className="space-y-3">
                        <Label>Correct Answer</Label>
                        <RadioGroup
                            value={watch('correct_answer')}
                            onValueChange={(value) => setValue('correct_answer', value)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="true" />
                                <Label htmlFor="true" className="font-normal cursor-pointer">
                                    True
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="false" />
                                <Label htmlFor="false" className="font-normal cursor-pointer">
                                    False
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                );

            case 'short_answer':
                return (
                    <div className="space-y-3">
                        <Label>Correct Answer (Optional)</Label>
                        <Input
                            {...register('correct_answer')}
                            placeholder="Enter the correct answer for reference"
                        />
                        <p className="text-xs text-muted-foreground">
                            This will be used for auto-grading if provided, otherwise manual grading is required
                        </p>
                    </div>
                );

            case 'essay':
                return (
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            Essay questions require manual grading. Students will be able to write a detailed response.
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Question Type Selection */}
            {!question && (
                <Card>
                    <CardHeader>
                        <CardTitle>Select Question Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <QuestionTypeSelector
                            selectedType={questionType}
                            onSelect={(type) => setValue('question_type', type as any)}
                        />
                    </CardContent>
                </Card>
            )}

            {question && (
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                        {questionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                </div>
            )}

            {/* Question Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Question Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Question Text */}
                    <div className="space-y-2">
                        <Label htmlFor="question_text">Question Text *</Label>
                        <Textarea
                            id="question_text"
                            {...register('question_text', {
                                required: 'Question text is required'
                            })}
                            placeholder="Enter your question..."
                            rows={4}
                            className="resize-y"
                        />
                        {errors.question_text && (
                            <p className="text-sm text-destructive">
                                {errors.question_text.message}
                            </p>
                        )}
                    </div>

                    {/* Points */}
                    <div className="space-y-2">
                        <Label htmlFor="points">Points *</Label>
                        <Input
                            id="points"
                            type="number"
                            min="0"
                            step="0.5"
                            {...register('points', {
                                required: 'Points are required',
                                min: { value: 0, message: 'Points must be at least 0' }
                            })}
                            className="w-32"
                        />
                        {errors.points && (
                            <p className="text-sm text-destructive">
                                {errors.points.message}
                            </p>
                        )}
                    </div>

                    {/* Type-specific fields */}
                    {renderQuestionTypeFields()}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={submitting}>
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            {question ? 'Update Question' : 'Create Question'}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}