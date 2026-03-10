<?php

use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\SchoolYearController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\Staff\EnrollmentController;
use App\Http\Controllers\Staff\ReportController;
use App\Http\Controllers\Staff\SectionViewController;
use App\Http\Controllers\Staff\StudentController;
use App\Http\Controllers\StudentSetupController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\SystemSettingController;
use App\Http\Controllers\Teacher\AttendanceController as TeacherAttendanceController;
use App\Http\Controllers\Teacher\ClassController as TeacherClassController;
use App\Http\Controllers\Teacher\GradeController as TeacherGradeController;
use App\Http\Controllers\Teacher\ReportController as TeacherReportController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\TeacherAssignmentController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\YearLevelController;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\RedirectToDashboard;
use Illuminate\Support\Facades\Route;

// Guest: show login page (redirect if already logged in)
Route::inertia('/', 'auth/login')
    ->middleware(RedirectToDashboard::class)
    ->name('home');

// Student account setup (signed URL, no auth required)
Route::get('student-setup/{student}', [StudentSetupController::class, 'show'])->name('student.setup');
Route::post('student-setup/{student}', [StudentSetupController::class, 'store'])->name('student.setup.store');

// Authenticated routes
Route::middleware(['auth'])->group(function () {
    // Admin routes
    Route::middleware(CheckRole::class . ':admin')
        ->prefix('admin')
        ->name('admin.')
        ->group(function () {
            Route::get('dashboard', DashboardController::class)->name('dashboard');
            Route::resource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::resource('school-years', SchoolYearController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::resource('sections', SectionController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::resource('subjects', SubjectController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::resource('year-levels', YearLevelController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::resource('teacher-assignments', TeacherAssignmentController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::resource('schedules', ScheduleController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::resource('announcements', AnnouncementController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::resource('events', EventController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::delete('events/{event}/images/{image}', [EventController::class, 'destroyImage'])->name('events.images.destroy');
            Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
            Route::get('settings', [SystemSettingController::class, 'index'])->name('settings.index');
            Route::put('settings', [SystemSettingController::class, 'update'])->name('settings.update');
        });

    // Staff routes
    Route::middleware(CheckRole::class . ':staff')
        ->prefix('staff')
        ->name('staff.')
        ->group(function () {
            Route::get('dashboard', DashboardController::class)->name('dashboard');
            Route::resource('students', StudentController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::get('students/search', [StudentController::class, 'search'])->name('students.search');
            Route::get('students/{student}', [StudentController::class, 'show'])->name('students.show');
            Route::get('students/{student}/export-grades', [StudentController::class, 'exportGrades'])->name('students.export-grades');
            Route::resource('enrollment', EnrollmentController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::get('sections', [SectionViewController::class, 'index'])->name('sections.index');
            Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
            Route::get('reports/students', [ReportController::class, 'studentList'])->name('reports.students');
            Route::get('reports/enrollment', [ReportController::class, 'enrollmentReport'])->name('reports.enrollment');
            Route::get('reports/sections', [ReportController::class, 'sectionSummary'])->name('reports.sections');
        });

    // Student routes
    Route::middleware(CheckRole::class . ':student')
        ->prefix('student')
        ->name('student.')
        ->group(function () {
            Route::get('dashboard', DashboardController::class)->name('dashboard');
            Route::get('announcements', [\App\Http\Controllers\Student\AnnouncementController::class, 'index'])->name('announcements.index');
            Route::get('events', [\App\Http\Controllers\Student\EventController::class, 'index'])->name('events.index');
            Route::get('subjects/{subject}', [\App\Http\Controllers\Student\SubjectController::class, 'show'])->name('subjects.show');
            Route::get('schedule', [\App\Http\Controllers\Student\ScheduleController::class, 'index'])->name('schedule.index');
        });

    // Teacher routes
    Route::middleware(CheckRole::class . ':teacher')
        ->prefix('teacher')
        ->name('teacher.')
        ->group(function () {
            Route::get('dashboard', DashboardController::class)->name('dashboard');
            Route::get('classes', [TeacherClassController::class, 'index'])->name('classes.index');
            Route::get('classes/{section}', [TeacherClassController::class, 'show'])->name('classes.show');
            Route::get('classes/{section}/students/{student}', [TeacherClassController::class, 'showStudent'])->name('classes.student');
            Route::get('attendance', [TeacherAttendanceController::class, 'index'])->name('attendance.index');
            Route::post('attendance', [TeacherAttendanceController::class, 'store'])->name('attendance.store');
            Route::get('grades', [TeacherGradeController::class, 'index'])->name('grades.index');
            Route::get('grades/{student}', [TeacherGradeController::class, 'show'])->name('grades.show');
            Route::post('grades/items', [TeacherGradeController::class, 'storeItem'])->name('grades.items.store');
            Route::put('grades/items/{item}', [TeacherGradeController::class, 'updateItem'])->name('grades.items.update');
            Route::delete('grades/items/{item}', [TeacherGradeController::class, 'destroyItem'])->name('grades.items.destroy');
            Route::post('grades/scores', [TeacherGradeController::class, 'storeScores'])->name('grades.scores.store');
            Route::get('reports', [TeacherReportController::class, 'index'])->name('reports.index');
            Route::get('reports/section', [TeacherReportController::class, 'sectionReport'])->name('reports.section');
            Route::get('reports/student', [TeacherReportController::class, 'studentReport'])->name('reports.student');
        });
});
