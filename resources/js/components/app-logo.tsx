import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { systemSettings } = usePage<{ systemSettings: { system_name: string; system_logo: string | null } }>().props;

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                {systemSettings.system_logo ? (
                    <img src={`/storage/${systemSettings.system_logo}`} alt="Logo" className="size-5 rounded object-contain" />
                ) : (
                    <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                )}
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {systemSettings.system_name}
                </span>
            </div>
        </>
    );
}
