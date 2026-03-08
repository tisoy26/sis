export type Section = {
    id: number;
    name: string;
    year_level_id: number | null;
    year_level_name: string | null;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
};
