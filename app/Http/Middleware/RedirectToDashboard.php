<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectToDashboard
{
    /**
     * Redirect authenticated users to their role-specific dashboard.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()) {
            $type = $request->user()->type;

            return redirect("/{$type}/dashboard");
        }

        return $next($request);
    }
}
