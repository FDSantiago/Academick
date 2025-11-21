<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\CourseManagementController;

Route::middleware(['auth', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/', function () {
        return redirect()->route('admin.users.index');
    })->name('admin.index');

    Route::get('users', [UserManagementController::class, 'index'])->name('admin.users.index');
    Route::post('users', [UserManagementController::class, 'store'])->name('admin.users.store');
    Route::get('courses', [CourseManagementController::class, 'index'])->name('admin.courses.index');
});