export type Enrollment = {
    id: number;
    student_id: number;
    school_year_id: number;
    section_id: number;
    year_level_id: number | null;
    status: 'enrolled' | 'dropped' | 'completed';
    enrolled_at: string | null;
    remarks: string | null;
    student_name: string;
    student_number: string;
    school_year_name: string;
    section_name: string;
    year_level_name: string | null;
    created_at: string;
};
