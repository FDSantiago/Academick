<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\AclEntry;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ContentAclSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get roles
        $adminRole = Role::where('name', 'admin')->first();
        $instructorRole = Role::where('name', 'instructor')->first();
        $teachingAssistantRole = Role::where('name', 'teaching_assistant')->first();
        $studentRole = Role::where('name', 'student')->first();

        if (!$adminRole || !$instructorRole || !$teachingAssistantRole || !$studentRole) {
            $this->command->error('Required roles not found. Please run RoleSeeder first.');
            return;
        }

        // Seed default ACL permissions for different content types
        $this->seedDefaultPermissions($adminRole, $instructorRole, $teachingAssistantRole, $studentRole);
    }

    /**
     * Seed default permissions for content types.
     */
    private function seedDefaultPermissions($adminRole, $instructorRole, $teachingAssistantRole, $studentRole): void
    {
        // Note: This seeder sets up default permissions that will be applied to new content.
        // Existing content will need to be migrated separately.

        $this->command->info('Content ACL seeder completed. Default permissions will be set when content is created.');
        $this->command->info('For existing content, you may need to run a migration script to set appropriate permissions.');

        // Example of how permissions could be set for existing content:
        // This is commented out as it would need to be customized based on existing data

        /*
        // For all existing pages, grant manage permission to creators and instructors
        $pages = \App\Models\Page::all();
        foreach ($pages as $page) {
            // Grant manage permission to creator
            if ($page->created_by) {
                AclEntry::updateOrCreate([
                    'content_type' => \App\Models\Page::class,
                    'content_id' => $page->id,
                    'permission_type' => 'manage',
                    'grantee_type' => 'user',
                    'grantee_id' => $page->created_by,
                ]);
            }

            // Grant manage permission to course instructor
            if ($page->course && $page->course->instructor_id) {
                AclEntry::updateOrCreate([
                    'content_type' => \App\Models\Page::class,
                    'content_id' => $page->id,
                    'permission_type' => 'manage',
                    'grantee_type' => 'user',
                    'grantee_id' => $page->course->instructor_id,
                ]);
            }

            // Grant view permission to students if page is public or course-based
            if ($page->is_public || $page->course) {
                AclEntry::updateOrCreate([
                    'content_type' => \App\Models\Page::class,
                    'content_id' => $page->id,
                    'permission_type' => 'view',
                    'grantee_type' => 'role',
                    'grantee_id' => $studentRole->id,
                ]);
            }
        }
        */
    }
}
