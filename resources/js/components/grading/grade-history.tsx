import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, User, MessageSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface GradeHistoryEntry {
  id: number;
  grade: number;
  max_score: number;
  percentage: number;
  feedback?: string;
  graded_at: string;
  graded_by?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  rubric_ratings?: Array<{
    criterion: string;
    rating: number;
    max_rating: number;
    comments?: string;
  }>;
}

interface GradeHistoryProps {
  history: GradeHistoryEntry[];
  assignmentPoints: number;
}

export default function GradeHistory({ history, assignmentPoints }: GradeHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No grade history available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Grade History</h3>
        <Badge variant="secondary">{history.length} entries</Badge>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-4">
          {history.map((entry, index) => (
            <Card key={entry.id} className={index === 0 ? 'border-primary' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {entry.graded_by ? (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.graded_by.avatar} />
                          <AvatarFallback>
                            {entry.graded_by.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{entry.graded_by.name}</p>
                          <p className="text-xs text-muted-foreground">{entry.graded_by.email}</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">System</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {entry.grade}/{assignmentPoints}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.percentage}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(entry.graded_at), 'MMM d, yyyy \'at\' h:mm a')}
                  {index === 0 && (
                    <Badge variant="default" className="text-xs">Latest</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {entry.feedback && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Feedback</span>
                    </div>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {entry.feedback}
                    </p>
                  </div>
                )}

                {entry.rubric_ratings && entry.rubric_ratings.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Rubric Breakdown</div>
                    <div className="space-y-2">
                      {entry.rubric_ratings.map((rating, ratingIndex) => (
                        <div key={ratingIndex} className="flex items-center justify-between text-sm">
                          <span className="flex-1">{rating.criterion}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {rating.rating}/{rating.max_rating}
                            </span>
                            <span className="text-muted-foreground">
                              ({Math.round((rating.rating / rating.max_rating) * 100)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}