<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can access the dashboard', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('dashboard'));
});

test('staff cannot access admin dashboard', function () {
    $staff = User::factory()->create(['type' => 'staff']);

    $this->actingAs($staff)
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('teacher cannot access admin dashboard', function () {
    $teacher = User::factory()->create(['type' => 'teacher']);

    $this->actingAs($teacher)
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('guests are redirected to login', function () {
    $this->get(route('admin.dashboard'))
        ->assertRedirect(route('login'));
});
