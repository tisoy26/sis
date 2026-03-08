<?php

use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

// ─── Index ───────────────────────────────────────────────

test('admin can view subjects page', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.subjects.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/subjects/index')
            ->has('subjects')
        );
});

test('non-admin cannot view subjects page', function () {
    $staff = User::factory()->create(['type' => 'staff']);

    $this->actingAs($staff)
        ->get(route('admin.subjects.index'))
        ->assertForbidden();
});

// ─── Store ───────────────────────────────────────────────

test('admin can create a subject', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.subjects.store'), [
            'code' => 'MATH101',
            'name' => 'Mathematics',
            'description' => 'Basic math course',
            'status' => 'active',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Subject::where('code', 'MATH101')->exists())->toBeTrue();
});

test('creating a subject requires code, name, and status', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.subjects.store'), [])
        ->assertSessionHasErrors(['code', 'name', 'status']);
});

test('subject code must be unique', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    Subject::create(['code' => 'MATH101', 'name' => 'Mathematics', 'status' => 'active']);

    $this->actingAs($admin)
        ->post(route('admin.subjects.store'), [
            'code' => 'MATH101',
            'name' => 'Another Math',
            'status' => 'active',
        ])
        ->assertSessionHasErrors('code');
});

// ─── Update ──────────────────────────────────────────────

test('admin can update a subject', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $subject = Subject::create(['code' => 'MATH101', 'name' => 'Mathematics', 'status' => 'active']);

    $this->actingAs($admin)
        ->put(route('admin.subjects.update', $subject), [
            'code' => 'MATH102',
            'name' => 'Advanced Math',
            'description' => 'Updated description',
            'status' => 'inactive',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $subject->refresh();
    expect($subject->code)->toBe('MATH102');
    expect($subject->name)->toBe('Advanced Math');
    expect($subject->status)->toBe('inactive');
});

// ─── Destroy ─────────────────────────────────────────────

test('admin can delete a subject', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $subject = Subject::create(['code' => 'MATH101', 'name' => 'Mathematics', 'status' => 'active']);

    $this->actingAs($admin)
        ->delete(route('admin.subjects.destroy', $subject))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Subject::find($subject->id))->toBeNull();
});
