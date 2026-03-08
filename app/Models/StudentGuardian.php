<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentGuardian extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'father_first_name',
        'father_middle_name',
        'father_last_name',
        'father_contact',
        'father_occupation',
        'mother_first_name',
        'mother_middle_name',
        'mother_last_name',
        'mother_contact',
        'mother_occupation',
        'guardian_first_name',
        'guardian_middle_name',
        'guardian_last_name',
        'guardian_contact',
        'guardian_relationship',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
