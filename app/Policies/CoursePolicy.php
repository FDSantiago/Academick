<?php

namespace App\Policies;

use App\Models\Course;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CoursePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->roles()->whereIn('name', ['admin', 'instructor', 'student'])->exists();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Course $course): bool
    {
        if ($user->roles()->where('name', 'admin')->exists()) {
            return true;
        }

        if ($user->roles()->where('name', 'instructor')->exists()) {
            return $course->instructor_id === $user->id;
        }

        if ($user->roles()->where('name', 'student')->exists()) {
            return $course->students()->where('user_id', $user->id)->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->roles()->where('name', 'admin')->exists();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Course $course): bool
    {
        if ($user->roles()->where('name', 'admin')->exists()) {
            return true;
        }

        if ($user->roles()->where('name', 'instructor')->exists()) {
            return $course->instructor_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Course $course): bool
    {
        return $user->roles()->where('name', 'admin')->exists();
    }

    /**
     * Determine whether the user can view enrollments for the course.
     */
    public function viewEnrollments(User $user, Course $course): bool
    {
        if ($user->roles()->where('name', 'admin')->exists()) {
            return true;
        }

        if ($user->roles()->where('name', 'instructor')->exists()) {
            return $course->instructor_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can manage enrollments for the course.
     */
    public function manageEnrollments(User $user, Course $course): bool
    {
        if ($user->roles()->where('name', 'admin')->exists()) {
            return true;
        }

        if ($user->roles()->where('name', 'instructor')->exists()) {
            return $course->instructor_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can view submissions for the course.
     */
    public function viewSubmissions(User $user, Course $course): bool
    {
        if ($user->roles()->where('name', 'admin')->exists()) {
            return true;
        }

        if ($user->roles()->where('name', 'instructor')->exists()) {
            return $course->instructor_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can view gradebook for the course.
     */
    public function viewGradebook(User $user, Course $course): bool
    {
        if ($user->roles()->where('name', 'admin')->exists()) {
            return true;
        }

        if ($user->roles()->where('name', 'instructor')->exists()) {
            return $course->instructor_id === $user->id;
        }

        if ($user->roles()->where('name', 'student')->exists()) {
            return $course->students()->where('user_id', $user->id)->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can manage gradebook for the course.
     */
    public function manageGradebook(User $user, Course $course): bool
    {
        if ($user->roles()->where('name', 'admin')->exists()) {
            return true;
        }

        if ($user->roles()->where('name', 'instructor')->exists()) {
            return $course->instructor_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can manage grades for the course.
     */
    public function manageGrades(User $user, Course $course): bool
    {
        if ($user->roles()->where('name', 'admin')->exists()) {
            return true;
        }

        if ($user->roles()->where('name', 'instructor')->exists()) {
            return $course->instructor_id === $user->id;
        }

        return false;
    }
}