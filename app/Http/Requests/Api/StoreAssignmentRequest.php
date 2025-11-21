<?php

namespace App\Http\Requests\Api;

use App\Models\Course;
use Illuminate\Foundation\Http\FormRequest;

class StoreAssignmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if (!$user) {
            return false;
        }

        $courseId = $this->route('course') ? $this->route('course')->id : $this->input('course_id');
        $course = Course::find($courseId);

        if (!$course) {
            return false;
        }

        // Check if user is instructor for the course or an admin
        return $course->instructor_id === $user->id || $user->roles()->where('name', 'admin')->exists();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'due_date' => 'required|date|after:now',
            'points' => 'required|numeric|min:0',
            'submission_type' => 'required|string|in:text,file,both',
            'course_id' => 'required|exists:courses,id',
        ];
    }
}