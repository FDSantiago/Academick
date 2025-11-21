import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Course {
    id: number;
    title: string;
    course_code: string;
    description: string;
    instructor_id: number;
    instructor?: User;
    status: string;
    created_at: string;
    updated_at: string;
    color: string;
    image_url: string;
    announcements_count?: number;
    assignments_count?: number;
    discussions_count?: number;
    quizzes_count?: number;
    modules_count?: number;
    enrollments_count?: number;
    announcements?: Announcement[];
    assignments?: Assignment[];
    discussions?: Discussion[];
}

export interface Announcement {
    id: number;
    course_id: number;
    user_id: number;
    user?: User;
    title: string;
    content: string;
    published: boolean;
    created_at: string;
    updated_at: string;
}

export interface Assignment {
    id: number;
    course_id: number;
    title: string;
    description: string;
    instructions?: string;
    due_date: string;
    points: number;
    published: boolean;
    attachments?: AssignmentAttachment[];
    submissions_count?: number;
    created_at: string;
    updated_at: string;
    submission_type: string;
    submission_types: string[];
    submission?: AssignmentSubmission;
}

export interface AssignmentAttachment {
    id: number;
    assignment_id?: number;
    submission_id?: number;
    filename: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_by: number;
    created_at: string;
}

export interface AssignmentSubmission {
    id: number;
    assignment_id: number;
    user_id: number;
    submission_text?: string;
    submission_url?: string;
    submitted_at: string;
    is_late: boolean;
    days_late?: number;
    grade?: number;
    feedback?: string;
    attachments: AssignmentAttachment[];
}

export interface Quiz {
    id: number;
    course_id: number;
    title: string;
    description: string;
    time_limit?: number;
    allowed_attempts: number;
    passing_score?: number;
    shuffle_questions: boolean;
    show_correct_answers: boolean;
    available_from?: string;
    available_until?: string;
    created_at: string;
    updated_at: string;
    questions_count?: number;
    total_points?: number;
}

export interface QuizQuestion {
    id: number;
    quiz_id: number;
    question_text: string;
    question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
    points: number;
    order: number;
    correct_answer?: string;
    options?: QuizQuestionOption[];
}

export interface QuizQuestionOption {
    id: number;
    question_id: number;
    option_text: string;
    is_correct: boolean;
    order: number;
}

export interface QuizAttempt {
    id: number;
    quiz_id: number;
    user_id: number;
    started_at: string;
    completed_at?: string;
    score?: number;
    percentage_score?: number;
    time_taken?: number;
    time_remaining?: number;
    is_completed: boolean;
    answers: Record<number, any>;
}

export interface Discussion {
    id: number;
    course_id: number;
    title: string;
    content: string;
    user_id: number;
    user?: User;
    pinned: boolean;
    is_locked?: boolean;
    created_at: string;
    updated_at: string;
    replies_count?: number;
    replies?: DiscussionReply[];
}

export interface DiscussionReply {
    id: number;
    discussion_id: number;
    user_id: number;
    parent_id?: number;
    content: string;
    created_at: string;
    edited_at?: string;
    is_deleted: boolean;
    user: User;
    children: DiscussionReply[];
    can_edit: boolean;
    can_delete: boolean;
}
