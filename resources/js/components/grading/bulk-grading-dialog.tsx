import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, AlertTriangle } from 'lucide-react';

interface Submission {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface BulkGradingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSubmissions: Submission[];
  assignmentPoints: number;
  onBulkGrade: (grade: number, feedback: string) => void;
}

export default function BulkGradingDialog({
  open,
  onOpenChange,
  selectedSubmissions,
  assignmentPoints,
  onBulkGrade
}: BulkGradingDialogProps) {
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    const gradeValue = parseFloat(grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > assignmentPoints) {
      return;
    }
    onBulkGrade(gradeValue, feedback);
    handleClose();
  };

  const handleClose = () => {
    setGrade('');
    setFeedback('');
    onOpenChange(false);
  };

  const percentage = grade ? Math.round((parseFloat(grade) / assignmentPoints) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Grade Submissions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Bulk Grading Warning</p>
              <p className="text-amber-700 mt-1">
                The same grade and feedback will be applied to all {selectedSubmissions.length} selected submissions.
                This action cannot be easily undone.
              </p>
            </div>
          </div>

          {/* Selected Students */}
          <div>
            <Label className="text-sm font-medium">Selected Students ({selectedSubmissions.length})</Label>
            <Card className="mt-2">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {selectedSubmissions.map((submission) => (
                    <div key={submission.id} className="flex items-center gap-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={submission.user.avatar} />
                        <AvatarFallback className="text-xs">
                          {submission.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{submission.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{submission.user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grade Input */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-grade">Grade</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="bulk-grade"
                  type="number"
                  min="0"
                  max={assignmentPoints}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="0"
                />
                <span className="text-sm text-muted-foreground">
                  / {assignmentPoints}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Percentage</Label>
              <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                <span className="text-sm font-medium">{percentage}%</span>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <Label htmlFor="bulk-feedback">Feedback</Label>
            <Textarea
              id="bulk-feedback"
              placeholder="Provide feedback that will be applied to all selected submissions..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This feedback will be visible to all selected students.
            </p>
          </div>

          {/* Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Submissions to grade:</span>
                  <Badge variant="secondary">{selectedSubmissions.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Grade to apply:</span>
                  <span className="font-medium">{grade || '0'} / {assignmentPoints} points</span>
                </div>
                <div className="flex justify-between">
                  <span>Percentage:</span>
                  <span className="font-medium">{percentage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!grade || parseFloat(grade) < 0 || parseFloat(grade) > assignmentPoints}
            >
              Apply Grade to {selectedSubmissions.length} Submissions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}