<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class EnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'exists:students,id'],
            'school_year_id' => ['required', 'exists:school_years,id'],
            'section_id' => ['required', 'exists:sections,id'],
            'year_level_id' => ['required', 'exists:year_levels,id'],
            'status' => ['required', Rule::in(['enrolled', 'dropped', 'completed'])],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $enrollmentId = $this->route('enrollment')?->id;

            $exists = \App\Models\Enrollment::where('student_id', $this->student_id)
                ->where('school_year_id', $this->school_year_id)
                ->when($enrollmentId, fn ($q) => $q->where('id', '!=', $enrollmentId))
                ->exists();

            if ($exists) {
                $validator->errors()->add('student_id', 'This student is already enrolled in this school year.');
            }
        });
    }
}
