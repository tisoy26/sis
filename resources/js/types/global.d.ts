import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            systemSettings: {
                system_name: string;
                system_logo: string | null;
                login_background: string | null;
            };
            sidebarOpen: boolean;
            flash: {
                success?: string;
                error?: string;
                info?: string;
                warning?: string;
            };
            [key: string]: unknown;
        };
    }
}
