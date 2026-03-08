export type Subject = {
    id: number;
    code: string;
    name: string;
    description: string | null;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
};
