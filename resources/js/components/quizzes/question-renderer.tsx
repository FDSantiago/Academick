import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { QuizQuestion } from '@/types';

interface QuestionRendererProps {
    question: QuizQuestion;
    questionNumber: number;
    answer?: any;
    onAnswerChange: (questionId: number, answer: any) => void;
    showCorrectAnswer?: boolean;
    disabled?: boolean;
}

export function QuestionRenderer({
    question,
    questionNumber,
    answer,
    onAnswerChange,
    showCorrectAnswer = false,
    disabled = false,
}: QuestionRendererProps) {
    const renderMultipleChoice = () => {
        const options = question.options || [];
        const selectedOptionId = answer?.option_id || answer;

        return (
            <RadioGroup
                value={selectedOptionId?.toString()}
                onValueChange={(value) => onAnswerChange(question.id, { option_id: parseInt(value) })}
                disabled={disabled}
                className="space-y-3"
            >
                {options.map((option) => {
                    const isSelected = selectedOptionId?.toString() === option.id.toString();
                    const isCorrect = option.is_correct;
                    const showFeedback = showCorrectAnswer && (isSelected || isCorrect);

                    return (
                        <div
                            key={option.id}
                            className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                                showCorrectAnswer
                                    ? isCorrect
                                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                        : isSelected && !isCorrect
                                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                        : 'border-muted'
                                    : isSelected
                                    ? 'bg-primary/5 border-primary'
                                    : 'border-muted hover:border-primary/50'
                            }`}
                        >
                            <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                            <Label
                                htmlFor={`option-${option.id}`}
                                className="flex-1 cursor-pointer font-normal"
                            >
                                <span className="block">{option.option_text}</span>
                                {showFeedback && (
                                    <Badge
                                        variant={isCorrect ? 'default' : 'destructive'}
                                        className="mt-2"
                                    >
                                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                    </Badge>
                                )}
                            </Label>
                        </div>
                    );
                })}
            </RadioGroup>
        );
    };

    const renderTrueFalse = () => {
        const selectedValue = answer?.value || answer;

        return (
            <RadioGroup
                value={selectedValue?.toString()}
                onValueChange={(value) => onAnswerChange(question.id, { value })}
                disabled={disabled}
                className="space-y-3"
            >
                {['true', 'false'].map((value) => {
                    const isSelected = selectedValue?.toString() === value;
                    const isCorrect = question.correct_answer === value;
                    const showFeedback = showCorrectAnswer && (isSelected || isCorrect);

                    return (
                        <div
                            key={value}
                            className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                                showCorrectAnswer
                                    ? isCorrect
                                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                        : isSelected && !isCorrect
                                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                        : 'border-muted'
                                    : isSelected
                                    ? 'bg-primary/5 border-primary'
                                    : 'border-muted hover:border-primary/50'
                            }`}
                        >
                            <RadioGroupItem value={value} id={`tf-${value}`} />
                            <Label htmlFor={`tf-${value}`} className="flex-1 cursor-pointer font-normal">
                                <span className="block capitalize">{value}</span>
                                {showFeedback && (
                                    <Badge
                                        variant={isCorrect ? 'default' : 'destructive'}
                                        className="mt-2"
                                    >
                                        {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                    </Badge>
                                )}
                            </Label>
                        </div>
                    );
                })}
            </RadioGroup>
        );
    };

    const renderShortAnswer = () => {
        const value = answer?.text || answer || '';

        return (
            <div className="space-y-3">
                <Input
                    value={value}
                    onChange={(e) => onAnswerChange(question.id, { text: e.target.value })}
                    placeholder="Enter your answer..."
                    disabled={disabled}
                    className="w-full"
                />
                {showCorrectAnswer && question.correct_answer && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                            Correct Answer:
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            {question.correct_answer}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    const renderEssay = () => {
        const value = answer?.text || answer || '';

        return (
            <div className="space-y-3">
                <Textarea
                    value={value}
                    onChange={(e) => onAnswerChange(question.id, { text: e.target.value })}
                    placeholder="Enter your essay response..."
                    disabled={disabled}
                    rows={8}
                    className="resize-y"
                />
                <p className="text-xs text-muted-foreground">
                    Essay questions are manually graded by the instructor.
                </p>
            </div>
        );
    };

    const renderQuestion = () => {
        switch (question.question_type) {
            case 'multiple_choice':
                return renderMultipleChoice();
            case 'true_false':
                return renderTrueFalse();
            case 'short_answer':
                return renderShortAnswer();
            case 'essay':
                return renderEssay();
            default:
                return <p className="text-muted-foreground">Unknown question type</p>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <CardTitle className="flex-1">
                        <div className="flex items-start gap-3">
                            <Badge variant="outline" className="mt-1">
                                Q{questionNumber}
                            </Badge>
                            <div className="flex-1">
                                <p className="text-base font-medium leading-relaxed">
                                    {question.question_text}
                                </p>
                            </div>
                        </div>
                    </CardTitle>
                    <Badge variant="secondary">{question.points} pts</Badge>
                </div>
            </CardHeader>
            <CardContent>{renderQuestion()}</CardContent>
        </Card>
    );
}