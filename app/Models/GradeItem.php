<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GradeItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_year_id',
        'section_id',
        'subject_id',
        'teacher_id',
        'quarter',
        'type',
        'name',
        'max_score',
        'sort_order',
    ];

    protected $casts = [
        'max_score' => 'decimal:2',
        'quarter' => 'integer',
        'sort_order' => 'integer',
    ];

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function scores(): HasMany
    {
        return $this->hasMany(GradeScore::class);
    }
}
