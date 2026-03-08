<?php

use App\Models\User;
use App\Models\YearLevel;
use Inertia\Testing\AssertableInertia as Assert;

// ─── Index ───────────────────────────────────────────────

test('admin can view year levels page', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.year-levels.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/year-levels/index')
            ->has('yearLevels')
        );
});

test('non-admin cannot view year levels page', function () {
    $staff = User::factory()->create(['type' => 'staff']);

    $this->actingAs($staff)
        ->get(route('admin.year-levels.index'))
        ->assertForbidden();
});

// ─── Store ───────────────────────────────────────────────

test('admin can create a year level', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.year-levels.store'), [
            'name' => 'Grade 1',
            'category' => 'elementary',
            'order' => 1,
            'status' => 'active',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(YearLevel::where('name', 'Grade 1')->exists())->toBeTrue();
});

test('creating a year level requires all fields', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.year-levels.store'), [])
        ->assertSessionHasErrors(['name', 'category', 'order', 'status']);
});

test('year level name must be unique', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    YearLevel::create(['name' => 'Grade 1', 'category' => 'elementary', 'order' => 1, 'status' => 'active']);

    $this->actingAs($admin)
        ->post(route('admin.year-levels.store'), [
            'name' => 'Grade 1',
            'category' => 'elementary',
            'order' => 2,
            'status' => 'active',
        ])
        ->assertSessionHasErrors('name');
});

test('category must be valid', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.year-levels.store'), [
            'name' => 'Grade 1',
            'category' => 'invalid',
            'order' => 1,
            'status' => 'active',
        ])
        ->assertSessionHasErrors('category');
});

// ─── Update ──────────────────────────────────────────────

test('admin can update a year level', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $yl = YearLevel::create(['name' => 'Grade 1', 'category' => 'elementary', 'order' => 1, 'status' => 'active']);

    $this->actingAs($admin)
        ->put(route('admin.year-levels.update', $yl), [
            'name' => 'Grade 1 Updated',
            'category' => 'elementary',
            'order' => 1,
            'status' => 'inactive',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $yl->refresh();
    expect($yl->name)->toBe('Grade 1 Updated');
    expect($yl->status)->toBe('inactive');
});

// ─── Destroy ─────────────────────────────────────────────

test('admin can delete a year level', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $yl = YearLevel::create(['name' => 'Grade 1', 'category' => 'elementary', 'order' => 1, 'status' => 'active']);

    $this->actingAs($admin)
        ->delete(route('admin.year-levels.destroy', $yl))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(YearLevel::find($yl->id))->toBeNull();
});
