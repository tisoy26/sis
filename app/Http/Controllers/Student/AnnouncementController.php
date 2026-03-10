<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(): Response
    {
        $announcements = Announcement::with('creator:id,first_name,last_name')
            ->where('status', 'published')
            ->latest('published_at')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'title' => $a->title,
                'body' => $a->body,
                'image_url' => $a->image_path ? Storage::url($a->image_path) : null,
                'created_by_name' => $a->creator?->full_name ?? 'Unknown',
                'published_at' => $a->published_at?->toISOString(),
            ]);

        return Inertia::render('student/announcements/index', [
            'announcements' => $announcements,
        ]);
    }
}
