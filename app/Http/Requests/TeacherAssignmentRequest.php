<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TeacherAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $assignmentId = $this->route('teacher_assignment')?->id;

        return [
            'school_year_id' => ['required', 'exists:school_years,id'],
            'teacher_id' => ['required', 'exists:users,id'],
            'section_id' => ['required', 'exists:sections,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $assignmentId = $this->route('teacher_assignment')?->id;

            $exists = \App\Models\TeacherAssignment::where('school_year_id', $this->school_year_id)
                ->where('teacher_id', $this->teacher_id)
                ->where('section_id', $this->section_id)
                ->where('subject_id', $this->subject_id)
                ->when($assignmentId, fn ($q) => $q->where('id', '!=', $assignmentId))
                ->exists();

            if ($exists) {
                $validator->errors()->add('teacher_id', 'This assignment already exists.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'school_year_id.required' => 'Please select a school year.',
            'teacher_id.required' => 'Please select a teacher.',
            'section_id.required' => 'Please select a section.',
            'subject_id.required' => 'Please select a subject.',
        ];
    }
}
