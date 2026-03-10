<?php

namespace App\Http\Controllers;

use App\Http\Requests\EventRequest;
use App\Models\Event;
use App\Models\EventImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(): Response
    {
        $events = Event::with(['creator:id,first_name,last_name', 'images'])
            ->latest()
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
                'status' => $e->status,
                'created_by_name' => $e->creator?->full_name ?? 'Unknown',
                'published_at' => $e->published_at?->toISOString(),
                'created_at' => $e->created_at->toISOString(),
                'updated_at' => $e->updated_at->toISOString(),
            ]);

        return Inertia::render('admin/events/index', [
            'events' => $events,
        ]);
    }

    public function store(EventRequest $request): RedirectResponse
    {
        $data = $request->safe()->only(['title', 'body', 'event_date', 'location', 'status']);
        $data['created_by'] = $request->user()->id;

        if ($data['status'] === 'published') {
            $data['published_at'] = now();
        }

        $event = Event::create($data);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $i => $file) {
                $event->images()->create([
                    'image_path' => $file->store('events', 'public'),
                    'sort_order' => $i,
                ]);
            }
        }

        return back()->with('success', 'Event created successfully.');
    }

    public function update(EventRequest $request, Event $event): RedirectResponse
    {
        $data = $request->safe()->only(['title', 'body', 'event_date', 'location', 'status']);

        if ($data['status'] === 'published' && !$event->published_at) {
            $data['published_at'] = now();
        } elseif ($data['status'] === 'draft') {
            $data['published_at'] = null;
        }

        $event->update($data);

        if ($request->hasFile('images')) {
            $maxSort = $event->images()->max('sort_order') ?? -1;
            foreach ($request->file('images') as $i => $file) {
                $event->images()->create([
                    'image_path' => $file->store('events', 'public'),
                    'sort_order' => $maxSort + $i + 1,
                ]);
            }
        }

        return back()->with('success', 'Event updated successfully.');
    }

    public function destroy(Event $event): RedirectResponse
    {
        foreach ($event->images as $image) {
            Storage::disk('public')->delete($image->image_path);
        }

        $event->delete();

        return back()->with('success', 'Event deleted successfully.');
    }

    public function destroyImage(Event $event, EventImage $image): RedirectResponse
    {
        if ($image->event_id !== $event->id) {
            abort(403);
        }

        Storage::disk('public')->delete($image->image_path);
        $image->delete();

        return back()->with('success', 'Image removed.');
    }
}
