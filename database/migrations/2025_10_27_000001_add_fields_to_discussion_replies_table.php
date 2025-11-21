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
        Schema::table('discussion_replies', function (Blueprint $table) {
            $table->timestamp('edited_at')->nullable()->after('content');
            $table->boolean('is_deleted')->default(false)->after('edited_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('discussion_replies', function (Blueprint $table) {
            $table->dropColumn(['edited_at', 'is_deleted']);
        });
    }
};