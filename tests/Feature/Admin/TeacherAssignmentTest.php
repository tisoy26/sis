<?php

use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Models\User;
use App\Models\YearLevel;
use Inertia\Testing\AssertableInertia as Assert;

// ─── Index ───────────────────────────────────────────────

test('admin can view teacher assignments page', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->get(route('admin.teacher-assignments.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/teacher-assignments/index')
            ->has('assignments')
            ->has('schoolYears')
            ->has('teachers')
            ->has('sections')
            ->has('subjects')
        );
});

test('non-admin cannot view teacher assignments page', function () {
    $staff = User::factory()->create(['type' => 'staff']);

    $this->actingAs($staff)
        ->get(route('admin.teacher-assignments.index'))
        ->assertForbidden();
});

// ─── Store ───────────────────────────────────────────────

test('admin can create a teacher assignment', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $teacher = User::factory()->create(['type' => 'teacher']);
    $sy = SchoolYear::create(['name' => '2025-2026', 'start_date' => '2025-06-01', 'end_date' => '2026-03-31', 'status' => 'active']);
    $yl = YearLevel::create(['name' => 'Grade 1', 'category' => 'elementary', 'order' => 1, 'status' => 'active']);
    $section = Section::create(['name' => 'Section A', 'year_level_id' => $yl->id, 'status' => 'active']);
    $subject = Subject::create(['code' => 'MATH101', 'name' => 'Mathematics', 'status' => 'active']);

    $this->actingAs($admin)
        ->post(route('admin.teacher-assignments.store'), [
            'school_year_id' => $sy->id,
            'teacher_id' => $teacher->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(TeacherAssignment::count())->toBe(1);
});

test('creating an assignment requires all fields', function () {
    $admin = User::factory()->create(['type' => 'admin']);

    $this->actingAs($admin)
        ->post(route('admin.teacher-assignments.store'), [])
        ->assertSessionHasErrors(['school_year_id', 'teacher_id', 'section_id', 'subject_id']);
});

test('duplicate assignment is rejected', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $teacher = User::factory()->create(['type' => 'teacher']);
    $sy = SchoolYear::create(['name' => '2025-2026', 'start_date' => '2025-06-01', 'end_date' => '2026-03-31', 'status' => 'active']);
    $yl = YearLevel::create(['name' => 'Grade 1', 'category' => 'elementary', 'order' => 1, 'status' => 'active']);
    $section = Section::create(['name' => 'Section A', 'year_level_id' => $yl->id, 'status' => 'active']);
    $subject = Subject::create(['code' => 'MATH101', 'name' => 'Mathematics', 'status' => 'active']);

    TeacherAssignment::create([
        'school_year_id' => $sy->id,
        'teacher_id' => $teacher->id,
        'section_id' => $section->id,
        'subject_id' => $subject->id,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.teacher-assignments.store'), [
            'school_year_id' => $sy->id,
            'teacher_id' => $teacher->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
        ])
        ->assertSessionHasErrors('teacher_id');
});

// ─── Update ──────────────────────────────────────────────

test('admin can update a teacher assignment', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $teacher1 = User::factory()->create(['type' => 'teacher']);
    $teacher2 = User::factory()->create(['type' => 'teacher']);
    $sy = SchoolYear::create(['name' => '2025-2026', 'start_date' => '2025-06-01', 'end_date' => '2026-03-31', 'status' => 'active']);
    $yl = YearLevel::create(['name' => 'Grade 1', 'category' => 'elementary', 'order' => 1, 'status' => 'active']);
    $section = Section::create(['name' => 'Section A', 'year_level_id' => $yl->id, 'status' => 'active']);
    $subject = Subject::create(['code' => 'MATH101', 'name' => 'Mathematics', 'status' => 'active']);

    $assignment = TeacherAssignment::create([
        'school_year_id' => $sy->id,
        'teacher_id' => $teacher1->id,
        'section_id' => $section->id,
        'subject_id' => $subject->id,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.teacher-assignments.update', $assignment), [
            'school_year_id' => $sy->id,
            'teacher_id' => $teacher2->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $assignment->refresh();
    expect($assignment->teacher_id)->toBe($teacher2->id);
});

// ─── Destroy ─────────────────────────────────────────────

test('admin can delete a teacher assignment', function () {
    $admin = User::factory()->create(['type' => 'admin']);
    $teacher = User::factory()->create(['type' => 'teacher']);
    $sy = SchoolYear::create(['name' => '2025-2026', 'start_date' => '2025-06-01', 'end_date' => '2026-03-31', 'status' => 'active']);
    $yl = YearLevel::create(['name' => 'Grade 1', 'category' => 'elementary', 'order' => 1, 'status' => 'active']);
    $section = Section::create(['name' => 'Section A', 'year_level_id' => $yl->id, 'status' => 'active']);
    $subject = Subject::create(['code' => 'MATH101', 'name' => 'Mathematics', 'status' => 'active']);

    $assignment = TeacherAssignment::create([
        'school_year_id' => $sy->id,
        'teacher_id' => $teacher->id,
        'section_id' => $section->id,
        'subject_id' => $subject->id,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.teacher-assignments.destroy', $assignment))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(TeacherAssignment::find($assignment->id))->toBeNull();
});
