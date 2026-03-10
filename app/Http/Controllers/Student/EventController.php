<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(): Response
    {
        $events = Event::with(['creator:id,first_name,last_name', 'images'])
            ->where('status', 'published')
            ->latest('published_at')
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'title' => $e->title,
                'body' => $e->body,
                'event_date' => $e->event_date?->toDateString(),
                'location' => $e->location,
                'images' => $e->images->map(fn ($img) => [
                    'id' => $img->id,
                    'url' => Storage::url($img->image_path),
                ]),
                'created_by_name' => $e->creator?->full_name ?? 'Unknown',
                'published_at' => $e->published_at?->toISOString(),
            ]);

        return Inertia::render('student/events/index', [
            'events' => $events,
        ]);
    }
}
