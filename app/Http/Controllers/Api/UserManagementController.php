<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserManagementController extends Controller
{

    public function getUsers(Request $request)
    {
        $user = $request->user();
        if (!$user || ! $user->roles()->pluck('name')->contains('admin')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }
        
        // Get all users with their roles
        $users = User::with('roles')->get();
        
        // Add role name to each user for easier frontend handling
        $users->each(function ($user) {
            $user->role_name = $user->roles->first()->name ?? null;
        });
        
        return $users;
    }

    /**
     * Handle creating a new user and assigning a role.
     *
     * Returns JSON with a success message on success, or validation/errors
     * are returned as JSON with appropriate status codes so the frontend
     * (dialog) can display them without a full redirect.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || ! $user->roles()->pluck('name')->contains('admin')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|confirmed|min:8',
            'role' => 'required|string|exists:roles,name',
        ]);

        try {
            $newUser = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
            ]);

            $role = Role::where('name', $data['role'])->first();
            if ($role) {
                $newUser->roles()->syncWithoutDetaching([$role->id]);
            }

            return response()->json([
                'message' => 'User created successfully.',
                'user' => [
                    'id' => $newUser->id,
                    'name' => $newUser->name,
                    'email' => $newUser->email,
                ],
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to create user.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Update an existing user
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || ! $user->roles()->pluck('name')->contains('admin')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$id,
            'password' => 'nullable|string|confirmed|min:8',
            'role' => 'required|string|exists:roles,name',
        ]);

        try {
            $existingUser = User::findOrFail($id);
            
            $updateData = [
                'name' => $data['name'],
                'email' => $data['email'],
            ];
            
            // Only update password if provided
            if (!empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }
            
            $existingUser->update($updateData);
            
            // Update role
            $role = Role::where('name', $data['role'])->first();
            if ($role) {
                $existingUser->roles()->sync([$role->id]);
            }

            return response()->json([
                'message' => 'User updated successfully.',
                'user' => [
                    'id' => $existingUser->id,
                    'name' => $existingUser->name,
                    'email' => $existingUser->email,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to update user.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Delete a user
     */
    public function destroy($id, Request $request)
    {
        $user = $request->user();
        if (!$user || ! $user->roles()->pluck('name')->contains('admin')) {
            return response()->json(['message' => 'Not authorized'], 403);
        }
        
        // Prevent deleting self
        if ($user->id == $id) {
            return response()->json(['message' => 'You cannot delete yourself.'], 400);
        }

        try {
            $existingUser = User::findOrFail($id);
            $existingUser->delete();

            return response()->json([
                'message' => 'User deleted successfully.',
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to delete user.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}