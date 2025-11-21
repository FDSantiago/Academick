<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

   /**
    * Get the roles for this user.
    */
   public function roles()
   {
       return $this->belongsToMany(Role::class, 'user_roles');
   }

   /**
    * Get the courses taught by this user (if instructor).
    */
   public function courses()
   {
       return $this->hasMany(Course::class, 'instructor_id');
   }

   /**
    * Get the enrollments for this user.
    */
   public function enrollments()
   {
       return $this->hasMany(CourseEnrollment::class);
   }

   /**
    * Get the courses this user is enrolled in.
    */
   public function enrolledCourses()
   {
       return $this->belongsToMany(Course::class, 'course_enrollments')
                   ->withPivot('status')
                   ->withTimestamps();
   }

   /**
    * Get the assignment submissions for this user.
    */
   public function assignmentSubmissions()
   {
       return $this->hasMany(AssignmentSubmission::class);
   }

   /**
    * Get the quiz attempts for this user.
    */
   public function quizAttempts()
   {
       return $this->hasMany(QuizAttempt::class);
   }

   /**
    * Get the discussions created by this user.
    */
   public function discussions()
   {
       return $this->hasMany(Discussion::class);
   }

   /**
    * Get the discussion replies made by this user.
    */
   public function discussionReplies()
   {
       return $this->hasMany(DiscussionReply::class);
   }

   /**
    * Get the announcements created by this user.
    */
   public function announcements()
   {
       return $this->hasMany(Announcement::class);
   }

   /**
    * Get the grades for this user.
    */
   public function grades()
   {
       return $this->hasMany(Grade::class);
   }

   /**
    * Get the chat room participants for this user.
    */
   public function chatRoomParticipants()
   {
       return $this->hasMany(ChatRoomParticipant::class);
   }

   /**
    * Get the chat messages sent by this user.
    */
   public function chatMessages()
   {
       return $this->hasMany(ChatMessage::class);
   }
}
