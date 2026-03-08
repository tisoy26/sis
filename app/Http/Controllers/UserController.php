<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::latest()->get();

        return Inertia::render('admin/users/index', [
            'users' => $users,
        ]);
    }

    public function store(UserRequest $request): RedirectResponse
    {
        $data = $request->validated();

        User::create($data);

        return back()->with('success', 'User created successfully.');
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        // Remove password if not provided on update
        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }
}
