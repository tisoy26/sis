<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        $rules = [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users')->ignore($userId),
            ],
            'type' => ['required', Rule::in(['admin', 'staff', 'teacher'])],
        ];

        if ($isUpdate) {
            $rules['password'] = ['nullable', 'string', Password::min(8), 'confirmed'];
        } else {
            $rules['password'] = ['required', 'string', Password::min(8), 'confirmed'];
        }

        return $rules;
    }
}
