<?php

namespace App\Concerns;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait LogsActivity
{
    public static function bootLogsActivity(): void
    {
        static::created(function (Model $model) {
            static::logAction($model, 'created');
        });

        static::updated(function (Model $model) {
            static::logAction($model, 'updated');
        });

        static::deleted(function (Model $model) {
            static::logAction($model, 'deleted');
        });
    }

    protected static function logAction(Model $model, string $action): void
    {
        $user = Auth::user();

        // Exclude sensitive fields
        $hidden = $model->getHidden();
        $hidden[] = 'remember_token';

        $oldValues = null;
        $newValues = null;

        if ($action === 'updated') {
            $changed = $model->getChanges();
            $original = collect($model->getOriginal())
                ->only(array_keys($changed))
                ->toArray();

            // Remove hidden fields
            foreach ($hidden as $field) {
                unset($changed[$field], $original[$field]);
            }

            // Skip if only timestamps changed
            unset($changed['updated_at'], $original['updated_at']);
            if (empty($changed)) {
                return;
            }

            $oldValues = $original;
            $newValues = $changed;
        } elseif ($action === 'created') {
            $attrs = $model->getAttributes();
            foreach ($hidden as $field) {
                unset($attrs[$field]);
            }
            unset($attrs['updated_at'], $attrs['created_at']);
            $newValues = $attrs;
        } elseif ($action === 'deleted') {
            $attrs = $model->getAttributes();
            foreach ($hidden as $field) {
                unset($attrs[$field]);
            }
            unset($attrs['updated_at'], $attrs['created_at']);
            $oldValues = $attrs;
        }

        AuditLog::create([
            'user_id' => $user?->id,
            'user_name' => $user ? ($user->full_name ?? $user->username) : 'System',
            'action' => $action,
            'model_type' => get_class($model),
            'model_id' => $model->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
        ]);
    }
}
