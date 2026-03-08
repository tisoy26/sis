<?php

use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

// ─── Index ───────────────────────────────────────────────

test('admin can view settings page', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.settings.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/settings/index')
            ->has('settings')
        );
});

test('non-admin cannot view settings page', function () {
    $staff = User::factory()->create(['type' => 'staff']);

    $this->actingAs($staff)
        ->get(route('admin.settings.index'))
        ->assertForbidden();
});

// ─── Update ──────────────────────────────────────────────

test('admin can update system name', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->put(route('admin.settings.update'), [
            'system_name' => 'My School SIS',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(SystemSetting::get('system_name'))->toBe('My School SIS');
});

test('system name is required', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->put(route('admin.settings.update'), [
            'system_name' => '',
        ])
        ->assertSessionHasErrors('system_name');
});

test('admin can upload system logo', function () {
    Storage::fake('public');
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->put(route('admin.settings.update'), [
            'system_name' => 'Test SIS',
            'system_logo' => UploadedFile::fake()->image('logo.png', 200, 200),
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $logoPath = SystemSetting::get('system_logo');
    expect($logoPath)->not->toBeNull();
    Storage::disk('public')->assertExists($logoPath);
});

test('admin can remove system logo', function () {
    Storage::fake('public');
    $admin = User::factory()->create(['type' => 'admin']);

    // First upload a logo
    $path = UploadedFile::fake()->image('logo.png')->store('logos', 'public');
    SystemSetting::set('system_logo', $path);

    $this->actingAs($admin)
        ->put(route('admin.settings.update'), [
            'system_name' => 'Test SIS',
            'remove_logo' => true,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(SystemSetting::get('system_logo'))->toBeNull();
});

test('admin can upload login background', function () {
    Storage::fake('public');
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->put(route('admin.settings.update'), [
            'system_name' => 'Test SIS',
            'login_background' => UploadedFile::fake()->image('bg.jpg', 1920, 1080),
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $bgPath = SystemSetting::get('login_background');
    expect($bgPath)->not->toBeNull();
    Storage::disk('public')->assertExists($bgPath);
});

// ─── Audit Log ───────────────────────────────────────────

test('admin can view audit logs page', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.audit-logs.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/audit-logs/index')
            ->has('logs')
        );
});

test('non-admin cannot view audit logs', function () {
    $staff = User::factory()->create(['type' => 'staff']);

    $this->actingAs($staff)
        ->get(route('admin.audit-logs.index'))
        ->assertForbidden();
});
