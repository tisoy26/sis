export type TeacherAssignment = {
    id: number;
    school_year_id: number;
    teacher_id: number;
    section_id: number;
    subject_id: number;
    school_year_name: string;
    teacher_name: string;
    section_name: string;
    subject_name: string;
    subject_code: string;
    created_at: string;
    updated_at: string;
};

export type SelectOption = {
    id: number;
    name: string;
};

export type SubjectOption = {
    id: number;
    code: string;
    name: string;
};
