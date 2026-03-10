<?php

namespace App\Models;

use App\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Student extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'student_id',
        'first_name',
        'last_name',
        'middle_name',
        'gender',
        'birth_date',
        'contact_number',
        'email',
        'status',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    protected $appends = ['full_name', 'document_complete'];

    public function getDocumentCompleteAttribute(): bool
    {
        $docs = $this->documents;

        if (! $docs) {
            return false;
        }

        return $docs->birth_certificate
            && $docs->report_card
            && $docs->good_moral
            && $docs->school_card
            && $docs->id_photos
            && $docs->medical_certificate;
    }

    public function getFullNameAttribute(): string
    {
        $name = "{$this->last_name}, {$this->first_name}";
        if ($this->middle_name) {
            $name .= " {$this->middle_name}";
        }

        return $name;
    }

    public function address(): HasOne
    {
        return $this->hasOne(Address::class);
    }

    public function guardian(): HasOne
    {
        return $this->hasOne(StudentGuardian::class);
    }

    public function documents(): HasOne
    {
        return $this->hasOne(StudentDocument::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
