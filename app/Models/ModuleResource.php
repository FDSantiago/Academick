<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ModuleResource extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'module_id',
        'title',
        'description',
        'resource_type',
        'file_path',
    ];

    /**
     * Get the module for this resource.
     */
    public function module()
    {
        return $this->belongsTo(CourseModule::class, 'module_id');
    }
}