<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'region_code',
        'region_name',
        'province_code',
        'province_name',
        'city_code',
        'city_name',
        'barangay_code',
        'barangay_name',
        'street',
        'zip_code',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->street,
            $this->barangay_name,
            $this->city_name,
            $this->province_name,
            $this->region_name,
            $this->zip_code,
        ]);

        return implode(', ', $parts) ?: '—';
    }
}
