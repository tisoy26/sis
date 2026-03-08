export type AuditLog = {
    id: number;
    user_id: number | null;
    user_name: string | null;
    action: 'created' | 'updated' | 'deleted';
    model_type: string;
    model_id: number | null;
    model_label: string;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
    updated_at: string;
};
