<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentDocument extends Model
{
    protected $fillable = [
        'student_id',
        'birth_certificate',
        'report_card',
        'good_moral',
        'school_card',
        'id_photos',
        'medical_certificate',
        'not_yet_available',
    ];

    protected $casts = [
        'birth_certificate' => 'boolean',
        'report_card' => 'boolean',
        'good_moral' => 'boolean',
        'school_card' => 'boolean',
        'id_photos' => 'boolean',
        'medical_certificate' => 'boolean',
        'not_yet_available' => 'boolean',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
