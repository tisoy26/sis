<?php

namespace App\Models;

use App\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class YearLevel extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'name',
        'category',
        'order',
        'status',
    ];

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
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
