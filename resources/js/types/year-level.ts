export type YearLevel = {
    id: number;
    name: string;
    category: 'preschool' | 'elementary' | 'junior_high' | 'senior_high';
    order: number;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
};
