<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'instructor_id',
        'title',
        'description',
        'course_code',
        'status',
    ];

    /**
     * Get the instructor for the course.
     */
    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    /**
     * Get the students enrolled in this course.
     */
    public function students()
    {
        return $this->belongsToMany(User::class, 'course_enrollments')
                    ->withPivot('status')
                    ->withTimestamps();
    }

    /**
     * Get the enrollments for this course.
     */
    public function enrollments()
    {
        return $this->hasMany(CourseEnrollment::class);
    }

    /**
     * Get the modules for this course.
     */
    public function modules()
    {
        return $this->hasMany(CourseModule::class);
    }

    /**
     * Get the assignments for this course.
     */
    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }

    /**
     * Get the quizzes for this course.
     */
    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }

    /**
     * Get the discussions for this course.
     */
    public function discussions()
    {
        return $this->hasMany(Discussion::class);
    }

    /**
     * Get the announcements for this course.
     */
    public function announcements()
    {
        return $this->hasMany(Announcement::class);
    }

    /**
     * Get the syllabus for this course.
     */
    public function syllabus()
    {
        return $this->hasOne(Syllabus::class);
    }

    /**
     * Get the grade categories for this course.
     */
    public function gradeCategories()
    {
        return $this->hasMany(GradeCategory::class);
    }

    /**
     * Get the chat rooms for this course.
     */
    public function chatRooms()
    {
        return $this->hasMany(ChatRoom::class);
    }

    /**
     * Get the pages for this course.
     */
    public function pages()
    {
        return $this->hasMany(Page::class);
    }
}