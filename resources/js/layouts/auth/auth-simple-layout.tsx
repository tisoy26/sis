import { Link, usePage } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { systemSettings } = usePage<{ systemSettings: { system_name: string; system_logo: string | null; login_background: string | null } }>().props;

    const bgSrc = systemSettings.login_background
        ? `/storage/${systemSettings.login_background}`
        : '/images/background.jpg';

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Left — Background Image */}
            <div className="relative hidden lg:block">
                <img
                    src={bgSrc}
                    alt="School background"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Title overlay */}
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-6 left-6 z-10 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                        {systemSettings.system_logo ? (
                            <img src={`/storage/${systemSettings.system_logo}`} alt="Logo" className="size-6 rounded object-contain" />
                        ) : (
                            <GraduationCap className="size-6 text-white" />
                        )}
                    </div>
                    <span className="text-lg font-bold tracking-wide text-white">{systemSettings.system_name}</span>
                </div>
            </div>

            {/* Right — Login Form */}
            <div className="flex flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href={home()}
                                className="flex flex-col items-center gap-2 font-medium"
                            >
                                <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-md">
                                    {systemSettings.system_logo ? (
                                        <img src={`/storage/${systemSettings.system_logo}`} alt="Logo" className="size-12 rounded object-contain" />
                                    ) : (
                                        <AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />
                                    )}
                                </div>
                                <span className="sr-only">{title}</span>
                            </Link>

                            <div className="space-y-2 text-center">
                                <h1 className="text-xl font-medium">{title}</h1>
                                <p className="text-center text-sm text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
