<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $studentId = $this->route('student')?->id;

        return [
            'student_id' => [
                'required',
                'string',
                'max:30',
                Rule::unique('students', 'student_id')->ignore($studentId),
            ],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'gender' => ['required', Rule::in(['male', 'female'])],
            'birth_date' => ['required', 'date'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('students', 'email')->ignore($studentId),
            ],
            'status' => ['required', Rule::in(['active', 'inactive', 'graduated', 'transferred'])],

            // Address fields
            'region_code' => ['nullable', 'string', 'max:20'],
            'region_name' => ['nullable', 'string', 'max:100'],
            'province_code' => ['nullable', 'string', 'max:20'],
            'province_name' => ['nullable', 'string', 'max:100'],
            'city_code' => ['nullable', 'string', 'max:20'],
            'city_name' => ['nullable', 'string', 'max:100'],
            'barangay_code' => ['nullable', 'string', 'max:20'],
            'barangay_name' => ['nullable', 'string', 'max:100'],
            'street' => ['nullable', 'string', 'max:255'],
            'zip_code' => ['nullable', 'string', 'max:10'],

            // Parent / Guardian fields
            'father_first_name' => ['nullable', 'string', 'max:100'],
            'father_middle_name' => ['nullable', 'string', 'max:100'],
            'father_last_name' => ['nullable', 'string', 'max:100'],
            'father_contact' => ['nullable', 'string', 'max:20'],
            'father_occupation' => ['nullable', 'string', 'max:100'],
            'mother_first_name' => ['nullable', 'string', 'max:100'],
            'mother_middle_name' => ['nullable', 'string', 'max:100'],
            'mother_last_name' => ['nullable', 'string', 'max:100'],
            'mother_contact' => ['nullable', 'string', 'max:20'],
            'mother_occupation' => ['nullable', 'string', 'max:100'],
            'guardian_first_name' => ['nullable', 'string', 'max:100'],
            'guardian_middle_name' => ['nullable', 'string', 'max:100'],
            'guardian_last_name' => ['nullable', 'string', 'max:100'],
            'guardian_contact' => ['nullable', 'string', 'max:20'],
            'guardian_relationship' => ['nullable', 'string', 'max:100'],

            // Document fields
            'birth_certificate' => ['boolean'],
            'report_card' => ['boolean'],
            'good_moral' => ['boolean'],
            'school_card' => ['boolean'],
            'id_photos' => ['boolean'],
            'medical_certificate' => ['boolean'],
            'not_yet_available' => ['boolean'],
        ];
    }
}
