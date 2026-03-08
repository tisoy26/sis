<?php

namespace App\Models;

use App\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Section extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'name',
        'year_level_id',
        'status',
    ];

    public function yearLevel(): BelongsTo
    {
        return $this->belongsTo(YearLevel::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
