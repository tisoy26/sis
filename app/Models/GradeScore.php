<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeScore extends Model
{
    use HasFactory;

    protected $fillable = [
        'grade_item_id',
        'student_id',
        'score',
    ];

    protected $casts = [
        'score' => 'decimal:2',
    ];

    public function gradeItem(): BelongsTo
    {
        return $this->belongsTo(GradeItem::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
