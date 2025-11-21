<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GradeCategory extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'course_id',
        'name',
        'weight',
    ];

    /**
     * Get the course for this grade category.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the grades for this category.
     */
    public function grades()
    {
        return $this->hasMany(Grade::class);
    }
}