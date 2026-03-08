<?php

use App\Models\Section;
use App\Models\User;
use App\Models\YearLevel;
use Inertia\Testing\AssertableInertia as Assert;

// ─── Index ───────────────────────────────────────────────

test('admin can view sections page', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.sections.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/sections/index')
            ->has('sections')
            ->has('yearLevels')
        );
});

test('non-admin cannot view sections page', function () {
    $staff = User::factory()->create(['type' => 'staff']);

    $this->actingAs($staff)
        ->get(route('admin.sections.index'))
        ->assertForbidden();
});

// ─── Store ───────────────────────────────────────────────

test('admin can create a section', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $yl = YearLevel::create(['name' => 'Grade 1', 'category' => 'elementary', 'order' => 1, 'status' => 'active']);

    $this->actingAs($admin)
        ->post(route('admin.sections.store'), [
            'name' => 'Section A',
            'year_level_id' => $yl->id,
            'status' => 'active',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Section::where('name', 'Section A')->exists())->toBeTrue();
});

test('creating a section requires name and status', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.sections.store'), [])
        ->assertSessionHasErrors(['name', 'status']);
});

test('section name must be unique', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    Section::create(['name' => 'Section A', 'status' => 'active']);

    $this->actingAs($admin)
        ->post(route('admin.sections.store'), [
            'name' => 'Section A',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('name');
});

// ─── Update ──────────────────────────────────────────────

test('admin can update a section', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $yl = YearLevel::create(['name' => 'Grade 1', 'category' => 'elementary', 'order' => 1, 'status' => 'active']);
    $section = Section::create(['name' => 'Section A', 'year_level_id' => $yl->id, 'status' => 'active']);

    $this->actingAs($admin)
        ->put(route('admin.sections.update', $section), [
            'name' => 'Section B',
            'year_level_id' => $yl->id,
            'status' => 'inactive',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $section->refresh();
    expect($section->name)->toBe('Section B');
    expect($section->status)->toBe('inactive');
});

// ─── Destroy ─────────────────────────────────────────────

test('admin can delete a section', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $section = Section::create(['name' => 'Section A', 'status' => 'active']);

    $this->actingAs($admin)
        ->delete(route('admin.sections.destroy', $section))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Section::find($section->id))->toBeNull();
});
