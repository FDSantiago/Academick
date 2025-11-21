import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';

interface QuizTimerProps {
    timeLimit: number; // in minutes
    startTime: string;
    onTimeUp?: () => void;
}

export function QuizTimer({ timeLimit, startTime, onTimeUp }: QuizTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isWarning, setIsWarning] = useState(false);
    const [isCritical, setIsCritical] = useState(false);

    useEffect(() => {
        const calculateTimeRemaining = () => {
            const start = new Date(startTime).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - start) / 1000); // seconds elapsed
            const totalSeconds = timeLimit * 60;
            const remaining = Math.max(0, totalSeconds - elapsed);

            setTimeRemaining(remaining);

            // Warning at 5 minutes or 25% remaining (whichever is less)
            const warningThreshold = Math.min(300, totalSeconds * 0.25);
            setIsWarning(remaining <= warningThreshold && remaining > 60);
            
            // Critical at 1 minute
            setIsCritical(remaining <= 60 && remaining > 0);

            if (remaining === 0 && onTimeUp) {
                onTimeUp();
            }
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [timeLimit, startTime, onTimeUp]);

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const getVariant = () => {
        if (isCritical) return 'destructive';
        if (isWarning) return 'default';
        return 'secondary';
    };

    const getBackgroundColor = () => {
        if (isCritical) return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
        if (isWarning) return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800';
        return 'bg-muted';
    };

    return (
        <Card className={`${getBackgroundColor()} transition-colors`}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isCritical ? (
                            <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
                        ) : (
                            <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                            <p className="text-sm font-medium">Time Remaining</p>
                            <p className="text-xs text-muted-foreground">
                                {timeLimit} minute time limit
                            </p>
                        </div>
                    </div>
                    <Badge 
                        variant={getVariant()} 
                        className="text-lg font-mono px-4 py-2"
                    >
                        {formatTime(timeRemaining)}
                    </Badge>
                </div>
                {isCritical && (
                    <p className="text-xs text-destructive mt-2 font-medium">
                        ⚠️ Less than 1 minute remaining!
                    </p>
                )}
                {isWarning && !isCritical && (
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 font-medium">
                        ⏰ Time is running low
                    </p>
                )}
            </CardContent>
        </Card>
    );
}