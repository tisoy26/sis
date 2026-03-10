export type StudentAddress = {
    id: number;
    student_id: number;
    region_code: string | null;
    region_name: string | null;
    province_code: string | null;
    province_name: string | null;
    city_code: string | null;
    city_name: string | null;
    barangay_code: string | null;
    barangay_name: string | null;
    street: string | null;
    zip_code: string | null;
};

export type StudentGuardian = {
    id: number;
    student_id: number;
    father_first_name: string | null;
    father_middle_name: string | null;
    father_last_name: string | null;
    father_contact: string | null;
    father_occupation: string | null;
    mother_first_name: string | null;
    mother_middle_name: string | null;
    mother_last_name: string | null;
    mother_contact: string | null;
    mother_occupation: string | null;
    guardian_first_name: string | null;
    guardian_middle_name: string | null;
    guardian_last_name: string | null;
    guardian_contact: string | null;
    guardian_relationship: string | null;
};

export type StudentDocuments = {
    id: number;
    student_id: number;
    birth_certificate: boolean;
    report_card: boolean;
    good_moral: boolean;
    school_card: boolean;
    id_photos: boolean;
    medical_certificate: boolean;
    not_yet_available: boolean;
};

export type Student = {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    full_name: string;
    gender: 'male' | 'female';
    birth_date: string;
    contact_number: string | null;
    email: string | null;
    status: 'active' | 'inactive' | 'graduated' | 'transferred';
    document_complete: boolean;
    address: StudentAddress | null;
    guardian: StudentGuardian | null;
    documents: StudentDocuments | null;
    created_at: string;
    updated_at: string;
};
