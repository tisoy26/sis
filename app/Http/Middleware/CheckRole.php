<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Ensure the authenticated user has the required role type.
     */
    public function handle(Request $request, Closure $next, string ...$types): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->type, $types)) {
            abort(403, 'Unauthorized.');
        }

        return $next($request);
    }
}
