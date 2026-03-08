<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'user_name',
        'action',
        'model_type',
        'model_id',
        'old_values',
        'new_values',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get a human-readable model name.
     */
    public function getModelLabelAttribute(): string
    {
        $map = [
            User::class => 'User',
            SchoolYear::class => 'School Year',
            Section::class => 'Section',
            Subject::class => 'Subject',
            TeacherAssignment::class => 'Teacher Assignment',
        ];

        return $map[$this->model_type] ?? class_basename($this->model_type);
    }

    protected $appends = ['model_label'];
}
