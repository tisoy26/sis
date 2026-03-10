<?php

namespace App\Http\Controllers;

use App\Http\Requests\AnnouncementRequest;
use App\Models\Announcement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(): Response
    {
        $announcements = Announcement::with('creator:id,first_name,last_name')
            ->latest()
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'title' => $a->title,
                'body' => $a->body,
                'image_url' => $a->image_path ? Storage::url($a->image_path) : null,
                'status' => $a->status,
                'created_by_name' => $a->creator?->full_name ?? 'Unknown',
                'published_at' => $a->published_at?->toISOString(),
                'created_at' => $a->created_at->toISOString(),
                'updated_at' => $a->updated_at->toISOString(),
            ]);

        return Inertia::render('admin/announcements/index', [
            'announcements' => $announcements,
        ]);
    }

    public function store(AnnouncementRequest $request): RedirectResponse
    {
        $data = $request->safe()->only(['title', 'body', 'status']);
        $data['created_by'] = $request->user()->id;

        if ($data['status'] === 'published') {
            $data['published_at'] = now();
        }

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('announcements', 'public');
        }

        Announcement::create($data);

        return back()->with('success', 'Announcement created successfully.');
    }

    public function update(AnnouncementRequest $request, Announcement $announcement): RedirectResponse
    {
        $data = $request->safe()->only(['title', 'body', 'status']);

        if ($data['status'] === 'published' && !$announcement->published_at) {
            $data['published_at'] = now();
        } elseif ($data['status'] === 'draft') {
            $data['published_at'] = null;
        }

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($announcement->image_path) {
                Storage::disk('public')->delete($announcement->image_path);
            }
            $data['image_path'] = $request->file('image')->store('announcements', 'public');
        }

        $announcement->update($data);

        return back()->with('success', 'Announcement updated successfully.');
    }

    public function destroy(Announcement $announcement): RedirectResponse
    {
        if ($announcement->image_path) {
            Storage::disk('public')->delete($announcement->image_path);
        }

        $announcement->delete();

        return back()->with('success', 'Announcement deleted successfully.');
    }
}
