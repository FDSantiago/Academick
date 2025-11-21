<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AclEntry extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'content_type',
        'content_id',
        'permission_type',
        'grantee_type',
        'grantee_id',
    ];

    /**
     * Get the content this ACL entry applies to (polymorphic relationship).
     */
    public function content()
    {
        return $this->morphTo();
    }

    /**
     * Get the role this ACL entry grants permission to (if grantee_type is 'role').
     */
    public function role()
    {
        return $this->belongsTo(Role::class, 'grantee_id')->where('grantee_type', 'role');
    }

    /**
     * Get the user this ACL entry grants permission to (if grantee_type is 'user').
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'grantee_id')->where('grantee_type', 'user');
    }

    /**
     * Scope to filter ACL entries by permission type.
     */
    public function scopeOfType($query, $permissionType)
    {
        return $query->where('permission_type', $permissionType);
    }

    /**
     * Scope to filter ACL entries by grantee type.
     */
    public function scopeForGranteeType($query, $granteeType)
    {
        return $query->where('grantee_type', $granteeType);
    }

    /**
     * Scope to filter ACL entries for a specific content item.
     */
    public function scopeForContent($query, $content)
    {
        return $query->where('content_type', get_class($content))
                    ->where('content_id', $content->id);
    }

    /**
     * Scope to filter ACL entries for a specific user.
     */
    public function scopeForUser($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where(function ($roleQ) use ($user) {
                $roleQ->where('grantee_type', 'role')
                      ->whereIn('grantee_id', $user->roles()->pluck('id'));
            })->orWhere(function ($userQ) use ($user) {
                $userQ->where('grantee_type', 'user')
                      ->where('grantee_id', $user->id);
            });
        });
    }
}
