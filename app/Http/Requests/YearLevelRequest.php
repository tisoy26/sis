<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class YearLevelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $yearLevelId = $this->route('year_level')?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('year_levels')->ignore($yearLevelId),
            ],
            'category' => ['required', Rule::in(['preschool', 'elementary', 'junior_high', 'senior_high'])],
            'order' => ['required', 'integer', 'min:0'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
