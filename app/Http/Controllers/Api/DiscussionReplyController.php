<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreDiscussionReplyRequest;
use App\Http\Requests\Api\UpdateDiscussionReplyRequest;
use App\Models\Course;
use App\Models\Discussion;
use App\Models\DiscussionReply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DiscussionReplyController extends Controller
{
    /**
     * Get all replies for a discussion with threaded structure
     * 
     * GET /api/courses/{course}/discussions/{discussion}/replies
     */
    public function index(Request $request, Course $course, Discussion $discussion)
    {
        // Verify user is enrolled or is instructor
        $user = $request->user();
        $isEnrolled = $course->students()->where('users.id', $user->id)->exists();
        $isInstructor = $course->instructor_id === $user->id;

        if (!$isEnrolled && !$isInstructor) {
            return response()->json([
                'message' => 'You are not enrolled in this course.',
            ], 403);
        }

        // Get all replies with user information and nested children
        // We'll fetch top-level replies (parent_id is null) and eager load children recursively
        // Define the recursive relationship loader
        $withChildren = function ($query) use (&$withChildren) {
            $query->with([
                'user:id,name,email,avatar',
                'children' => $withChildren
            ]);
        };

        $replies = $discussion->replies()
            ->whereNull('parent_id')
            ->with([
                'user:id,name,email,avatar',
                'children' => $withChildren
            ])
            ->orderBy('created_at', 'asc')
            ->get();

        // Transform replies to include computed fields
        $transformedReplies = $replies->map(function ($reply) use ($user) {
            return $this->transformReply($reply, $user);
        });

        return response()->json([
            'replies' => $transformedReplies,
            'total' => $discussion->replies()->notDeleted()->count(),
        ], 200);
    }

    /**
     * Create a new reply
     * 
     * POST /api/courses/{course}/discussions/{discussion}/replies
     */
    public function store(StoreDiscussionReplyRequest $request, Course $course, Discussion $discussion)
    {
        $user = $request->user();

        DB::beginTransaction();
        try {
            // Create the reply
            $reply = DiscussionReply::create([
                'discussion_id' => $discussion->id,
                'user_id' => $user->id,
                'parent_id' => $request->input('parent_id'),
                'content' => $request->input('content'),
            ]);

            // Update discussion's reply count (if you have this field)
            // $discussion->increment('reply_count');

            // Track unique participants
            $this->trackParticipant($discussion, $user);

            DB::commit();

            // Load relationships for response
            $reply->load(['user:id,name,email,avatar', 'parent']);

            return response()->json([
                'message' => 'Reply posted successfully.',
                'reply' => $this->transformReply($reply, $user),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to post reply.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an existing reply
     * 
     * PUT /api/courses/{course}/discussions/{discussion}/replies/{reply}
     */
    public function update(UpdateDiscussionReplyRequest $request, Course $course, Discussion $discussion, DiscussionReply $reply)
    {
        $user = $request->user();

        DB::beginTransaction();
        try {
            // Update the reply content and mark as edited
            $reply->update([
                'content' => $request->input('content'),
                'edited_at' => now(),
            ]);

            DB::commit();

            // Reload relationships
            $reply->load(['user:id,name,email,avatar', 'parent']);

            return response()->json([
                'message' => 'Reply updated successfully.',
                'reply' => $this->transformReply($reply, $user),
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to update reply.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a reply
     * 
     * DELETE /api/courses/{course}/discussions/{discussion}/replies/{reply}
     */
    public function destroy(Request $request, Course $course, Discussion $discussion, DiscussionReply $reply)
    {
        $user = $request->user();

        // Check authorization
        if (!$reply->canDelete($user)) {
            return response()->json([
                'message' => 'You are not authorized to delete this reply.',
            ], 403);
        }

        DB::beginTransaction();
        try {
            // Check if reply has children
            $hasChildren = $reply->replies()->notDeleted()->exists();

            if ($hasChildren) {
                // Soft delete: mark as deleted but keep structure for threading
                $reply->update([
                    'is_deleted' => true,
                    'content' => '[This reply has been deleted]',
                ]);

                $message = 'Reply marked as deleted.';
            } else {
                // Hard delete: no children, safe to remove completely
                $reply->delete();

                $message = 'Reply deleted successfully.';
            }

            // Update discussion's reply count (if you have this field)
            // $discussion->decrement('reply_count');

            DB::commit();

            return response()->json([
                'message' => $message,
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to delete reply.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Transform a reply with computed fields and nested children
     */
    private function transformReply(DiscussionReply $reply, $currentUser): array
    {
        $data = [
            'id' => $reply->id,
            'discussion_id' => $reply->discussion_id,
            'user_id' => $reply->user_id,
            'parent_id' => $reply->parent_id,
            'content' => $reply->content,
            'is_deleted' => $reply->is_deleted,
            'created_at' => $reply->created_at,
            'updated_at' => $reply->updated_at,
            'edited_at' => $reply->edited_at,
            'user' => $reply->user ? [
                'id' => $reply->user->id,
                'name' => $reply->user->name,
                'email' => $reply->user->email,
                'avatar' => $reply->user->avatar,
            ] : null,
            'is_edited' => $reply->isEdited(),
            'can_edit' => $reply->canEdit($currentUser),
            'can_delete' => $reply->canDelete($currentUser),
            'reply_count' => $reply->reply_count,
        ];

        // Recursively transform children
        if ($reply->relationLoaded('children') && $reply->children) {
            $data['children'] = $reply->children->map(function ($child) use ($currentUser) {
                return $this->transformReply($child, $currentUser);
            })->values()->toArray();
        } else {
            $data['children'] = [];
        }

        return $data;
    }

    /**
     * Track unique participants in a discussion
     */
    private function trackParticipant(Discussion $discussion, $user): void
    {
        // This could be implemented with a pivot table or a JSON field
        // For now, we'll skip this implementation as it requires additional schema
        // You could add a discussion_participants table or use a JSON field on discussions
    }
}