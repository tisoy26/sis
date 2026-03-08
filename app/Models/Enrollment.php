<?php

namespace App\Models;

use App\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'student_id',
        'school_year_id',
        'section_id',
        'year_level_id',
        'status',
        'enrolled_at',
        'remarks',
    ];

    protected $casts = [
        'enrolled_at' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function schoolYear(): BelongsTo
    {
        return $this->belongsTo(SchoolYear::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function yearLevel(): BelongsTo
    {
        return $this->belongsTo(YearLevel::class);
    }
}
