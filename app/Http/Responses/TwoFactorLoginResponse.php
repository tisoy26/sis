<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;

class TwoFactorLoginResponse implements TwoFactorLoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();
        $home = "/{$user->type}/dashboard";

        return $request->wantsJson()
            ? new JsonResponse(['two_factor' => true], 200)
            : redirect()->intended($home);
    }
}
