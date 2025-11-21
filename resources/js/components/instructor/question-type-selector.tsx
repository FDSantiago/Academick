import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    CheckSquare, 
    ToggleLeft, 
    Type, 
    FileText 
} from 'lucide-react';

interface QuestionTypeSelectorProps {
    selectedType?: string;
    onSelect: (type: string) => void;
}

const questionTypes = [
    {
        type: 'multiple_choice',
        label: 'Multiple Choice',
        description: 'Students select one correct answer from multiple options',
        icon: CheckSquare,
        color: 'text-blue-500',
    },
    {
        type: 'true_false',
        label: 'True/False',
        description: 'Students choose between true or false',
        icon: ToggleLeft,
        color: 'text-green-500',
    },
    {
        type: 'short_answer',
        label: 'Short Answer',
        description: 'Students provide a brief text response',
        icon: Type,
        color: 'text-purple-500',
    },
    {
        type: 'essay',
        label: 'Essay',
        description: 'Students write a detailed response (manually graded)',
        icon: FileText,
        color: 'text-orange-500',
    },
];

export function QuestionTypeSelector({ selectedType, onSelect }: QuestionTypeSelectorProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questionTypes.map((qt) => {
                const Icon = qt.icon;
                const isSelected = selectedType === qt.type;

                return (
                    <Card
                        key={qt.type}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                            isSelected 
                                ? 'border-primary shadow-md' 
                                : 'hover:border-primary/50'
                        }`}
                        onClick={() => onSelect(qt.type)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg bg-muted ${qt.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold">{qt.label}</h3>
                                        {isSelected && (
                                            <Badge variant="default" className="text-xs">
                                                Selected
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {qt.description}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}