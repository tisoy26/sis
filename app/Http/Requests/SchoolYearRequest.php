<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SchoolYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $schoolYearId = $this->route('school_year')?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('school_years')->ignore($schoolYearId),
            ],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ];
    }
}
