import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Eye, MessageSquare, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';
import { format } from 'date-fns';

interface Submission {
  id: number;
  assignment_id: number;
  user_id: number;
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  file_path?: string;
  attachments?: any[];
  submitted_at: string;
  graded: boolean;
  grade?: number;
  feedback?: string;
  graded_at?: string;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  points: number;
  rubric?: RubricItem[];
}

interface RubricItem {
  id: number;
  criterion: string;
  description: string;
  points: number;
  rating?: number;
  comments?: string;
}

interface SubmissionViewerProps {
  submission: Submission;
  assignment: Assignment;
  onGrade?: (grade: number, feedback: string, rubric?: RubricItem[]) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

export default function SubmissionViewer({
  submission,
  assignment,
  onGrade,
  onClose,
  readOnly = false
}: SubmissionViewerProps) {
  const [grade, setGrade] = useState(submission.grade?.toString() || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [rubricRatings, setRubricRatings] = useState<RubricItem[]>(
    assignment.rubric?.map(item => ({
      ...item,
      rating: item.rating || 0,
      comments: item.comments || ''
    })) || []
  );

  const handleRubricChange = (index: number, field: 'rating' | 'comments', value: string | number) => {
    const updatedRubric = [...rubricRatings];
    updatedRubric[index] = { ...updatedRubric[index], [field]: value };
    setRubricRatings(updatedRubric);
  };

  const calculateTotalRubricScore = () => {
    return rubricRatings.reduce((total, item) => total + (item.rating || 0), 0);
  };

  const handleSubmitGrade = () => {
    const totalGrade = rubricRatings.length > 0 ? calculateTotalRubricScore() : parseFloat(grade);
    onGrade?.(totalGrade, feedback, rubricRatings);
  };

  const getSubmissionStatus = () => {
    if (submission.graded) {
      return { label: 'Graded', variant: 'default' as const, icon: CheckCircle };
    }
    const submittedDate = new Date(submission.submitted_at);
    const dueDate = new Date(assignment.due_date || '');
    if (submittedDate > dueDate) {
      return { label: 'Late', variant: 'destructive' as const, icon: AlertCircle };
    }
    return { label: 'On Time', variant: 'secondary' as const, icon: Clock };
  };

  const status = getSubmissionStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={submission.user.avatar} />
            <AvatarFallback>
              {submission.user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{submission.user.name}</h3>
            <p className="text-sm text-muted-foreground">{submission.user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusIcon className="h-4 w-4" />
              <Badge variant={status.variant} className="text-xs">
                {status.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Submitted {format(new Date(submission.submitted_at), 'MMM d, yyyy \'at\' h:mm a')}
              </span>
            </div>
          </div>
        </div>

        {submission.graded && (
          <div className="text-right">
            <div className="text-2xl font-bold">
              {submission.grade}/{assignment.points}
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round((submission.grade! / assignment.points) * 100)}%
            </div>
          </div>
        )}
      </div>

      <Separator />

      <Tabs defaultValue="submission" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submission">Submission</TabsTrigger>
          <TabsTrigger value="rubric">Rubric</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="submission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submitted Content</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {submission.content ? (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: submission.content }}
                  />
                ) : (
                  <p className="text-muted-foreground">No text content submitted.</p>
                )}

                {submission.attachments && submission.attachments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Attachments</h4>
                    <div className="space-y-2">
                      {submission.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{attachment.filename}</p>
                              <p className="text-sm text-muted-foreground">
                                {(attachment.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rubric" className="space-y-4">
          {assignment.rubric && assignment.rubric.length > 0 ? (
            <div className="space-y-4">
              {rubricRatings.map((item, index) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.criterion}</CardTitle>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label htmlFor={`rating-${index}`}>Rating (out of {item.points})</Label>
                        <Input
                          id={`rating-${index}`}
                          type="number"
                          min="0"
                          max={item.points}
                          value={item.rating || ''}
                          onChange={(e) => handleRubricChange(index, 'rating', parseFloat(e.target.value) || 0)}
                          disabled={readOnly}
                          className="mt-1"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.rating ? `${Math.round((item.rating / item.points) * 100)}%` : '0%'}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`comments-${index}`}>Comments</Label>
                      <Textarea
                        id={`comments-${index}`}
                        placeholder="Additional comments for this criterion..."
                        value={item.comments || ''}
                        onChange={(e) => handleRubricChange(index, 'comments', e.target.value)}
                        disabled={readOnly}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Score:</span>
                    <span className="text-2xl font-bold">
                      {calculateTotalRubricScore()}/{assignment.points}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {Math.round((calculateTotalRubricScore() / assignment.points) * 100)}% of total points
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No rubric has been set up for this assignment.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grade & Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!assignment.rubric && (
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="grade"
                      type="number"
                      min="0"
                      max={assignment.points}
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      disabled={readOnly}
                    />
                    <span className="text-sm text-muted-foreground">
                      / {assignment.points} points
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide feedback for the student..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={readOnly}
                  rows={6}
                />
              </div>

              {submission.graded && (
                <div className="text-sm text-muted-foreground">
                  Last graded on {format(new Date(submission.graded_at!), 'MMM d, yyyy \'at\' h:mm a')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {!readOnly && (
        <div className="flex justify-end gap-2">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSubmitGrade} disabled={!grade && rubricRatings.length === 0}>
            {submission.graded ? 'Update Grade' : 'Submit Grade'}
          </Button>
        </div>
      )}
    </div>
  );
}