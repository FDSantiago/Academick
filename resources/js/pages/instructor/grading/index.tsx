import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Download, Eye, FileText, MessageSquare, Users, CheckCircle, Clock, AlertCircle, History } from 'lucide-react';
import { format } from 'date-fns';
import SubmissionViewer from '@/components/grading/submission-viewer';
import BulkGradingDialog from '@/components/grading/bulk-grading-dialog';
import GradeHistory from '@/components/grading/grade-history';
import AppLayout from '@/layouts/app-layout';

interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  points: number;
  submission_type: string;
  submissions_count: number;
  graded_count: number;
}

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

interface Course {
  id: number;
  title: string;
  course_code: string;
}

interface GradingPageProps {
  course?: Course;
  assignments?: Assignment[];
  submissions?: Submission[];
  currentAssignment?: Assignment;
  filters?: {
    assignment_id?: number;
    status?: string;
    search?: string;
  };
}

export default function GradingIndex({ course, assignments, submissions, currentAssignment, filters }: GradingPageProps) {
  const { auth } = usePage().props as any;
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(currentAssignment || null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [gradeValue, setGradeValue] = useState('');
  const [feedback, setFeedback] = useState('');
  const [bulkGrading, setBulkGrading] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<number[]>([]);

  const safeAssignments = assignments || [];
  const safeSubmissions = submissions || [];
  const safeCourse = course || { id: 0, title: 'Unknown Course', course_code: 'N/A' };
  const safeFilters = filters || {};

  const handleAssignmentChange = (assignmentId: string) => {
    const assignment = safeAssignments.find(a => a.id === parseInt(assignmentId));
    setSelectedAssignment(assignment || null);
    setSelectedSubmission(null); // Clear selected submission when assignment changes
    router.get(`/courses/${safeCourse.id}/grading`, {
      assignment_id: assignmentId,
      ...safeFilters
    }, {
      preserveState: true,
      replace: true
    });
  };

  const handleSubmissionSelect = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeValue(submission.grade?.toString() || '');
    setFeedback(submission.feedback || '');
    setGradingDialogOpen(true);
  };

  const handleGradeSubmit = (grade?: number, feedback?: string, rubric?: any[]) => {
    if (!selectedSubmission) return;

    const gradeToSubmit = grade !== undefined ? grade : parseFloat(gradeValue);
    const feedbackToSubmit = feedback !== undefined ? feedback : '';

    router.post(`/courses/${safeCourse.id}/submissions/${selectedSubmission.id}/grade`, {
      grade: gradeToSubmit,
      feedback: feedbackToSubmit,
      rubric_ratings: rubric,
    }, {
      onSuccess: () => {
        setGradingDialogOpen(false);
        setSelectedSubmission(null);
        setGradeValue('');
        setFeedback('');
      }
    });
  };

  const handleBulkGrade = () => {
    if (selectedSubmissions.length === 0) return;

    router.post(`/courses/${safeCourse.id}/submissions/bulk-grade`, {
      submission_ids: selectedSubmissions,
      grade: parseFloat(gradeValue),
      feedback: feedback,
    }, {
      onSuccess: () => {
        setBulkGrading(false);
        setSelectedSubmissions([]);
        setGradeValue('');
        setFeedback('');
      }
    });
  };

  const getSubmissionStatus = (submission: Submission) => {
    if (submission.graded) {
      return { label: 'Graded', variant: 'default' as const, icon: CheckCircle };
    }
    return { label: 'Pending', variant: 'secondary' as const, icon: Clock };
  };

  const filteredSubmissions = safeSubmissions.filter(submission => {
    if (selectedAssignment && submission.assignment_id !== selectedAssignment.id) return false;
    if (safeFilters.status === 'graded' && !submission.graded) return false;
    if (safeFilters.status === 'pending' && submission.graded) return false;
    if (safeFilters.search) {
      const searchTerm = safeFilters.search.toLowerCase();
      return submission.user.name.toLowerCase().includes(searchTerm) ||
             submission.user.email.toLowerCase().includes(searchTerm);
    }
    return true;
  });

  const breadcrumbs = [
    {
      title: 'Courses',
      href: '/courses'
    },
    {
      title: `${safeCourse.title} (${safeCourse.course_code})`,
      href: `/courses/${safeCourse.id}`
    },
    {
      title: 'Grading',
      href: `/courses/${safeCourse.id}/grading`
    }
  ]

  return (
    <AppLayout {...{ breadcrumbs }}>
      <Head title={`Grade Submissions - ${safeCourse.title}`} />

      <div className="space-y-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Grade Submissions</h1>
            <p className="text-muted-foreground">
              {safeCourse.course_code} - {safeCourse.title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setBulkGrading(true)}
              disabled={selectedSubmissions.length === 0}
            >
              <Users className="mr-2 h-4 w-4" />
              Bulk Grade ({selectedSubmissions.length})
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignment">Assignment</Label>
                <Select value={selectedAssignment?.id.toString()} onValueChange={handleAssignmentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignments</SelectItem>
                    {safeAssignments.map((assignment) => (
                      <SelectItem key={assignment.id} value={assignment.id.toString()}>
                        {assignment.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={safeFilters.status || ''}
                  onValueChange={(value) => {
                    router.get(`/courses/${safeCourse.id}/grading`, {
                      ...safeFilters,
                      status: value || undefined
                    }, { preserveState: true, replace: true });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="graded">Graded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search">Search Students</Label>
                <Input
                  id="search"
                  placeholder="Search by name or email"
                  value={safeFilters.search || ''}
                  onChange={(e) => {
                    router.get(`/courses/${safeCourse.id}/grading`, {
                      ...safeFilters,
                      search: e.target.value || undefined
                    }, { preserveState: true, replace: true });
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Summary */}
        {selectedAssignment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedAssignment.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedAssignment.submissions_count}</div>
                  <div className="text-sm text-muted-foreground">Total Submissions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedAssignment.graded_count}</div>
                  <div className="text-sm text-muted-foreground">Graded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedAssignment.submissions_count - selectedAssignment.graded_count}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{selectedAssignment.points}</div>
                  <div className="text-sm text-muted-foreground">Points Possible</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submissions List */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions ({filteredSubmissions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => {
                const status = getSubmissionStatus(submission);
                const StatusIcon = status.icon;

                return (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {bulkGrading && (
                        <input
                          type="checkbox"
                          checked={selectedSubmissions.includes(submission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubmissions([...selectedSubmissions, submission.id]);
                            } else {
                              setSelectedSubmissions(selectedSubmissions.filter(id => id !== submission.id));
                            }
                          }}
                          className="rounded"
                        />
                      )}

                      <Avatar>
                        <AvatarImage src={submission.user.avatar} />
                        <AvatarFallback>
                          {submission.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="font-medium">{submission.user.name}</div>
                        <div className="text-sm text-muted-foreground">{submission.user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          Submitted {format(new Date(submission.submitted_at), 'MMM d, yyyy \'at\' h:mm a')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge variant={status.variant} className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>

                      {submission.graded && (
                        <div className="text-right">
                          <div className="font-medium">
                            {submission.grade}/{selectedAssignment?.points || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {selectedAssignment ? Math.round((submission.grade! / selectedAssignment.points) * 100) : 0}%
                          </div>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSubmissionSelect(submission)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {submission.graded ? 'View Grade' : 'Grade'}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {filteredSubmissions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No submissions found matching your criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grading Dialog */}
        <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {selectedSubmission?.graded ? 'View Submission & Grade' : 'Grade Submission'}
              </DialogTitle>
            </DialogHeader>

            {selectedSubmission && selectedAssignment && (
              <Tabs defaultValue="viewer" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="viewer">Submission</TabsTrigger>
                  <TabsTrigger value="grading">Grading</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="viewer" className="mt-4">
                  <SubmissionViewer
                    submission={selectedSubmission}
                    assignment={selectedAssignment}
                    readOnly={true}
                  />
                </TabsContent>

                <TabsContent value="grading" className="mt-4">
                  <SubmissionViewer
                    submission={selectedSubmission}
                    assignment={selectedAssignment}
                    onGrade={(grade, feedback, rubric) => {
                      handleGradeSubmit(grade, feedback, rubric);
                    }}
                    readOnly={false}
                  />
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <GradeHistory
                    history={[
                      {
                        id: 1,
                        grade: selectedSubmission.grade || 0,
                        max_score: selectedAssignment.points,
                        percentage: selectedSubmission.grade ?
                          Math.round((selectedSubmission.grade / selectedAssignment.points) * 100) : 0,
                        feedback: selectedSubmission.feedback,
                        graded_at: selectedSubmission.graded_at || selectedSubmission.submitted_at,
                        graded_by: {
                          id: 1,
                          name: 'Instructor',
                          email: 'instructor@example.com'
                        }
                      }
                    ]}
                    assignmentPoints={selectedAssignment.points}
                  />
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Bulk Grading Dialog */}
        <BulkGradingDialog
          open={bulkGrading}
          onOpenChange={setBulkGrading}
          selectedSubmissions={selectedSubmissions.map(id => {
            const submission = safeSubmissions.find(s => s.id === id);
            return submission ? { id: submission.id, user: submission.user } : { id, user: { id: 0, name: 'Unknown', email: '' } };
          })}
          assignmentPoints={selectedAssignment?.points || 100}
          onBulkGrade={handleBulkGrade}
        />
      </div>
    </AppLayout>
  );
}