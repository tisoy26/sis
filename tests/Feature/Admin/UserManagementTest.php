<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

// ─── Index ───────────────────────────────────────────────

test('admin can view users page', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->has('users')
        );
});

test('non-admin cannot view users page', function () {
    $staff = User::factory()->create(['type' => 'staff']);

    $this->actingAs($staff)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

// ─── Store ───────────────────────────────────────────────

test('admin can create a user', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'username' => 'juandc',
            'type' => 'staff',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(User::where('username', 'juandc')->exists())->toBeTrue();
});

test('creating a user requires all fields', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [])
        ->assertSessionHasErrors(['first_name', 'last_name', 'username', 'type', 'password']);
});

test('creating a user requires unique username', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    User::factory()->create(['username' => 'existing']);

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'first_name' => 'Test',
            'last_name' => 'User',
            'username' => 'existing',
            'type' => 'staff',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertSessionHasErrors('username');
});

test('creating a user validates type', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'first_name' => 'Test',
            'last_name' => 'User',
            'username' => 'testuser',
            'type' => 'invalid_type',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertSessionHasErrors('type');
});

// ─── Update ──────────────────────────────────────────────

test('admin can update a user', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $user = User::factory()->create(['type' => 'staff']);

    $this->actingAs($admin)
        ->put(route('admin.users.update', $user), [
            'first_name' => 'Updated',
            'last_name' => 'Name',
            'username' => $user->username,
            'type' => 'teacher',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $user->refresh();
    expect($user->first_name)->toBe('Updated');
    expect($user->type)->toBe('teacher');
});

test('admin can update a user without changing password', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $user = User::factory()->create(['type' => 'staff']);
    $originalPassword = $user->password;

    $this->actingAs($admin)
        ->put(route('admin.users.update', $user), [
            'first_name' => 'Updated',
            'last_name' => 'Name',
            'username' => $user->username,
            'type' => 'staff',
        ])
        ->assertRedirect();

    $user->refresh();
    expect($user->password)->toBe($originalPassword);
});

// ─── Destroy ─────────────────────────────────────────────

test('admin can delete a user', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $user = User::factory()->create(['type' => 'staff']);

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $user))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(User::find($user->id))->toBeNull();
});

test('admin cannot delete their own account', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $admin))
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(User::find($admin->id))->not->toBeNull();
});
