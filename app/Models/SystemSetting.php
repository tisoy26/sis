<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    protected $fillable = ['key', 'value'];

    /**
     * Get a setting value by key, with optional default.
     */
    public static function get(string $key, ?string $default = null): ?string
    {
        return Cache::rememberForever("system_setting.{$key}", function () use ($key, $default) {
            return static::where('key', $key)->value('value') ?? $default;
        });
    }

    /**
     * Set a setting value by key.
     */
    public static function set(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget("system_setting.{$key}");
    }

    /**
     * Get all settings as key-value pairs.
     */
    public static function allSettings(): array
    {
        return Cache::rememberForever('system_settings.all', function () {
            return static::pluck('value', 'key')->toArray();
        });
    }

    /**
     * Clear all settings cache.
     */
    public static function clearCache(): void
    {
        $keys = static::pluck('key');
        foreach ($keys as $key) {
            Cache::forget("system_setting.{$key}");
        }
        Cache::forget('system_settings.all');
    }
}
