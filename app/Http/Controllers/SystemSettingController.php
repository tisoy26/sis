<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SystemSettingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/settings/index', [
            'settings' => [
                'system_name' => SystemSetting::get('system_name', 'GOJAI SIS'),
                'system_logo' => SystemSetting::get('system_logo'),
                'login_background' => SystemSetting::get('login_background'),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'system_name' => ['required', 'string', 'max:100'],
            'system_logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
            'login_background' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:5120'],
            'remove_login_background' => ['nullable', 'boolean'],
        ]);

        // Update system name
        SystemSetting::set('system_name', $request->input('system_name'));

        // Handle file uploads
        $this->handleFileUpload($request, 'system_logo', 'system_logo', 'remove_logo', 'logos');
        $this->handleFileUpload($request, 'login_background', 'login_background', 'remove_login_background', 'backgrounds');

        SystemSetting::clearCache();

        return back()->with('success', 'System settings updated successfully.');
    }

    private function handleFileUpload(Request $request, string $field, string $settingKey, string $removeField, string $folder): void
    {
        if ($request->hasFile($field)) {
            $old = SystemSetting::get($settingKey);
            if ($old && Storage::disk('public')->exists($old)) {
                Storage::disk('public')->delete($old);
            }
            $path = $request->file($field)->store($folder, 'public');
            SystemSetting::set($settingKey, $path);
        } elseif ($request->boolean($removeField)) {
            $old = SystemSetting::get($settingKey);
            if ($old && Storage::disk('public')->exists($old)) {
                Storage::disk('public')->delete($old);
            }
            SystemSetting::set($settingKey, null);
        }
    }
}
