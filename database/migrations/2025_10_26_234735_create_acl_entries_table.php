<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Only create the table if it doesn't exist
        if (!Schema::hasTable('acl_entries')) {
            Schema::create('acl_entries', function (Blueprint $table) {
                $table->id();
                $table->morphs('content'); // content_type and content_id for polymorphic relationship
                $table->enum('permission_type', ['view', 'edit', 'delete', 'manage']); // Type of permission
                $table->enum('grantee_type', ['role', 'user']); // Whether permission is granted to a role or specific user
                $table->unsignedBigInteger('grantee_id'); // ID of the role or user
                $table->timestamps();

                // Indexes for performance
                $table->index(['content_type', 'content_id']);
                $table->index(['grantee_type', 'grantee_id']);
                $table->index(['permission_type']);

                // Unique constraint to prevent duplicate entries
                $table->unique(['content_type', 'content_id', 'permission_type', 'grantee_type', 'grantee_id'], 'unique_acl_entry');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('acl_entries');
    }
};
