<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();
        $home = "/{$user->type}/dashboard";

        return $request->wantsJson()
            ? new JsonResponse(['two_factor' => false], 200)
            : redirect()->intended($home);
    }
}
