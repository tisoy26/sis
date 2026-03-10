export type Schedule = {
    id: number;
    teacher_assignment_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    teacher_name: string;
    section_name: string;
    year_level_name: string | null;
    subject_name: string;
    subject_code: string;
    school_year_name: string;
    created_at: string;
    updated_at: string;
};

export type ScheduleAssignmentOption = {
    id: number;
    label: string;
    teacher_name: string;
    section_name: string;
    subject_name: string;
};
