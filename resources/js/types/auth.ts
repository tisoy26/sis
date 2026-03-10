export type User = {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    username: string;
    type: 'admin' | 'staff' | 'teacher' | 'student';
    avatar?: string;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
