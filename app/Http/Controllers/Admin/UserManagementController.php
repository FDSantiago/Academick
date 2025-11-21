<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Role;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || ! $user->roles()->pluck('name')->contains('admin')) {
            abort(404);
        }

        return Inertia::render('admin/users/index', [
            'roles' => Role::select('name', 'description')
                ->orderBy('id')
                ->get()
                ->map(function ($r) {
                    return [
                        'label' => ucfirst(str_replace('_', ' ', $r->name)),
                        'value' => $r->name,
                    ];
                })
                ->values()
                ->toArray(),
        ]);
    }

    // store() moved to App\Http\Controllers\Api\UserManagementController::store
}