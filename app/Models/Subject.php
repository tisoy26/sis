<?php

namespace App\Models;

use App\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'code',
        'name',
        'description',
        'status',
    ];

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
