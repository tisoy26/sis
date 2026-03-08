<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sectionId = $this->route('section')?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('sections')->ignore($sectionId),
            ],
            'year_level_id' => ['nullable', 'exists:year_levels,id'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
