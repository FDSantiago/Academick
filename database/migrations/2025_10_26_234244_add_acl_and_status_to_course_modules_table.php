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
        Schema::table('course_modules', function (Blueprint $table) {
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->boolean('is_public')->default(false);
            $table->json('acl_permissions')->nullable(); // Store ACL rules as JSON
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_modules', function (Blueprint $table) {
            $table->dropColumn(['status', 'is_public', 'acl_permissions']);
        });
    }
};
