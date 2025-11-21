<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreAssignmentSubmissionRequest;
use App\Http\Requests\Api\UpdateAssignmentSubmissionRequest;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AssignmentAttachment;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class AssignmentSubmissionController extends Controller
{
    /**
     * Submit a new assignment
     * 
     * POST /api/courses/{course}/assignments/{assignment}/submit
     */
    public function store(StoreAssignmentSubmissionRequest $request, Course $course, Assignment $assignment)
    {
        $user = $request->user();

        // Check if assignment accepts submissions
        if (!$this->canSubmit($assignment)) {
            return response()->json([
                'message' => 'This assignment is no longer accepting submissions.',
            ], 403);
        }

        // Check for existing submission
        $existingSubmission = $assignment->submissions()
            ->where('user_id', $user->id)
            ->first();

        if ($existingSubmission) {
            return response()->json([
                'message' => 'You have already submitted this assignment. Use the update endpoint to resubmit.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Determine if submission is late
            $isLate = Carbon::now()->isAfter($assignment->due_date);
            $daysLate = $isLate ? Carbon::now()->diffInDays($assignment->due_date) : 0;

            // Create submission
            $submission = AssignmentSubmission::create([
                'assignment_id' => $assignment->id,
                'user_id' => $user->id,
                'content' => $request->input('submission_text'),
                'file_path' => $request->input('submission_url'), // Store URL in file_path for URL submissions
                'status' => $isLate ? 'late' : 'submitted',
            ]);

            // Handle file uploads
            if ($request->hasFile('files')) {
                $this->handleFileUploads($request->file('files'), $assignment, $submission);
            }

            DB::commit();

            // Load relationships for response
            $submission->load(['assignment', 'attachments']);

            // Add computed fields
            $submissionData = $submission->toArray();
            $submissionData['is_late'] = $isLate;
            $submissionData['days_late'] = $daysLate;
            $submissionData['penalty_applied'] = $isLate ? $this->calculateLatePenalty($assignment, $daysLate) : 0;

            return response()->json([
                'message' => 'Assignment submitted successfully.',
                'submission' => $submissionData,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to submit assignment.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * View student's own submission
     * 
     * GET /api/courses/{course}/assignments/{assignment}/submission
     */
    public function show(Request $request, Course $course, Assignment $assignment)
    {
        $user = $request->user();

        // Ensure user is enrolled in the course
        if (!$this->isEnrolled($user, $course)) {
            return response()->json([
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

        // Ensure assignment belongs to the course
        if ($assignment->course_id !== $course->id) {
            return response()->json([
                'message' => 'Assignment not found for this course.',
            ], 404);
        }

        // Get student's submission
        $submission = $assignment->submissions()
            ->where('user_id', $user->id)
            ->with(['assignment', 'attachments'])
            ->first();

        if (!$submission) {
            return response()->json([
                'message' => 'No submission found.',
                'submission' => null,
            ], 404);
        }

        // Add computed fields
        $isLate = Carbon::parse($submission->created_at)->isAfter($assignment->due_date);
        $daysLate = $isLate ? Carbon::parse($submission->created_at)->diffInDays($assignment->due_date) : 0;

        $submissionData = $submission->toArray();
        $submissionData['is_late'] = $isLate;
        $submissionData['days_late'] = $daysLate;
        $submissionData['penalty_applied'] = $isLate ? $this->calculateLatePenalty($assignment, $daysLate) : 0;

        return response()->json([
            'submission' => $submissionData,
        ]);
    }

    /**
     * Update/resubmit assignment
     * 
     * PUT /api/courses/{course}/assignments/{assignment}/submission
     */
    public function update(UpdateAssignmentSubmissionRequest $request, Course $course, Assignment $assignment)
    {
        $user = $request->user();

        // Get existing submission
        $submission = $assignment->submissions()
            ->where('user_id', $user->id)
            ->first();

        if (!$submission) {
            return response()->json([
                'message' => 'No submission found to update.',
            ], 404);
        }

        // Check if assignment still accepts submissions
        if (!$this->canSubmit($assignment)) {
            return response()->json([
                'message' => 'This assignment is no longer accepting submissions.',
            ], 403);
        }

        DB::beginTransaction();
        try {
            // Update submission content
            $updateData = [];
            
            if ($request->has('submission_text')) {
                $updateData['content'] = $request->input('submission_text');
            }
            
            if ($request->has('submission_url')) {
                $updateData['file_path'] = $request->input('submission_url');
            }

            // Determine if resubmission is late
            $isLate = Carbon::now()->isAfter($assignment->due_date);
            $daysLate = $isLate ? Carbon::now()->diffInDays($assignment->due_date) : 0;
            
            // Update status if it was previously submitted and now is late
            if ($isLate && $submission->status === 'submitted') {
                $updateData['status'] = 'late';
            }

            $submission->update($updateData);

            // Handle file removals
            if ($request->has('remove_files')) {
                $removeFileIds = $request->input('remove_files', []);
                $attachments = $submission->attachments()
                    ->whereIn('id', $removeFileIds)
                    ->get();

                foreach ($attachments as $attachment) {
                    // Delete file from storage
                    if (Storage::exists($attachment->file_path)) {
                        Storage::delete($attachment->file_path);
                    }
                    $attachment->delete();
                }
            }

            // Handle new file uploads
            if ($request->hasFile('files')) {
                $this->handleFileUploads($request->file('files'), $assignment, $submission);
            }

            DB::commit();

            // Load relationships for response
            $submission->load(['assignment', 'attachments']);

            // Add computed fields
            $submissionData = $submission->toArray();
            $submissionData['is_late'] = $isLate;
            $submissionData['days_late'] = $daysLate;
            $submissionData['penalty_applied'] = $isLate ? $this->calculateLatePenalty($assignment, $daysLate) : 0;

            return response()->json([
                'message' => 'Assignment updated successfully.',
                'submission' => $submissionData,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to update assignment.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle file uploads for submission
     * 
     * @param array $files
     * @param Assignment $assignment
     * @param AssignmentSubmission $submission
     * @return void
     */
    private function handleFileUploads(array $files, Assignment $assignment, AssignmentSubmission $submission): void
    {
        foreach ($files as $file) {
            // Store file in submissions directory
            $path = $file->store('submissions/' . $assignment->id . '/' . $submission->user_id, 'private');

            // Create attachment record
            AssignmentAttachment::create([
                'assignment_id' => $assignment->id,
                'submission_id' => $submission->id,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
            ]);
        }
    }

    /**
     * Check if assignment can accept submissions
     * 
     * @param Assignment $assignment
     * @return bool
     */
    private function canSubmit(Assignment $assignment): bool
    {
        // For now, we allow late submissions
        // This can be customized based on assignment settings
        // Example: Check if assignment has a lock_date or allows_late_submissions flag
        
        return true;
    }

    /**
     * Calculate late penalty
     * 
     * @param Assignment $assignment
     * @param int $daysLate
     * @return float
     */
    private function calculateLatePenalty(Assignment $assignment, int $daysLate): float
    {
        // Default penalty: 10% per day late, max 50%
        // This can be customized based on assignment settings
        $penaltyPerDay = 0.10;
        $maxPenalty = 0.50;
        
        $penalty = min($daysLate * $penaltyPerDay, $maxPenalty);
        
        return round($penalty * 100, 2); // Return as percentage
    }

    /**
     * Check if user is enrolled in the course
     * 
     * @param \App\Models\User $user
     * @param Course $course
     * @return bool
     */
    private function isEnrolled($user, Course $course): bool
    {
        return $course->students()->where('users.id', $user->id)->exists();
    }
}