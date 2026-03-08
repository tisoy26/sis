<?php

use App\Models\SchoolYear;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

// ─── Index ───────────────────────────────────────────────

test('admin can view school years page', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.school-years.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/school-years/index')
            ->has('schoolYears')
        );
});

test('non-admin cannot view school years page', function () {
    $staff = User::factory()->create(['type' => 'staff']);

    $this->actingAs($staff)
        ->get(route('admin.school-years.index'))
        ->assertForbidden();
});

// ─── Store ───────────────────────────────────────────────

test('admin can create a school year', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.school-years.store'), [
            'name' => '2025-2026',
            'start_date' => '2025-06-01',
            'end_date' => '2026-03-31',
            'status' => 'active',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(SchoolYear::where('name', '2025-2026')->exists())->toBeTrue();
});

test('creating a school year requires all fields', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.school-years.store'), [])
        ->assertSessionHasErrors(['name', 'start_date', 'end_date', 'status']);
});

test('school year name must be unique', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    SchoolYear::create([
        'name' => '2025-2026',
        'start_date' => '2025-06-01',
        'end_date' => '2026-03-31',
        'status' => 'active',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.school-years.store'), [
            'name' => '2025-2026',
            'start_date' => '2025-07-01',
            'end_date' => '2026-04-30',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('name');
});

test('end date must be after start date', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.school-years.store'), [
            'name' => '2025-2026',
            'start_date' => '2026-06-01',
            'end_date' => '2025-03-31',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('end_date');
});

// ─── Update ──────────────────────────────────────────────

test('admin can update a school year', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $sy = SchoolYear::create([
        'name' => '2025-2026',
        'start_date' => '2025-06-01',
        'end_date' => '2026-03-31',
        'status' => 'active',
    ]);

    $this->actingAs($admin)
        ->put(route('admin.school-years.update', $sy), [
            'name' => '2025-2026 Updated',
            'start_date' => '2025-06-01',
            'end_date' => '2026-03-31',
            'status' => 'inactive',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $sy->refresh();
    expect($sy->name)->toBe('2025-2026 Updated');
    expect($sy->status)->toBe('inactive');
});

// ─── Destroy ─────────────────────────────────────────────

test('admin can delete a school year', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $sy = SchoolYear::create([
        'name' => '2025-2026',
        'start_date' => '2025-06-01',
        'end_date' => '2026-03-31',
        'status' => 'active',
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.school-years.destroy', $sy))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(SchoolYear::find($sy->id))->toBeNull();
});
