<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            ['name' => 'admin', 'description' => 'Full system access'],
            ['name' => 'instructor', 'description' => 'Can create courses, assignments, grade students'],
            ['name' => 'student', 'description' => 'Can enroll in courses, submit assignments, view grades'],
            ['name' => 'teaching_assistant', 'description' => 'Limited instructor capabilities'],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['name' => $role['name']],
                $role
            );
        }
    }
}