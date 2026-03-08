import { Link } from '@inertiajs/react';
import { useState, useEffect, type ReactNode } from 'react';
import AppFooter from '@/components/app-footer';
import AppNavbar from '@/components/app-navbar';
import AppSidebar from '@/components/app-sidebar';
import FlashAlerts from '@/components/flash-alerts';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
    breadcrumbs?: { label: string; href?: string }[];
}

export default function AppLayout({ children, title, breadcrumbs = [] }: AppLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Close mobile sidebar on window resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        if (window.innerWidth < 1024) {
            setMobileSidebarOpen(!mobileSidebarOpen);
        } else {
            setSidebarCollapsed(!sidebarCollapsed);
        }
    };

    const closeMobileSidebar = () => {
        setMobileSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-muted/40">
            {/* Mobile Backdrop */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={closeMobileSidebar}
                />
            )}

            {/* Sidebar */}
            <AppSidebar
                collapsed={sidebarCollapsed}
                mobileOpen={mobileSidebarOpen}
                onMobileClose={closeMobileSidebar}
            />

            {/* Navbar */}
            <AppNavbar
                onToggleSidebar={toggleSidebar}
                sidebarCollapsed={sidebarCollapsed}
            />

            {/* Main Content */}
            <main
                className={cn(
                    'relative z-10 min-h-screen pt-[60px] pb-[60px] transition-all duration-300',
                    'ml-0 lg:ml-[250px]',
                    sidebarCollapsed && 'lg:ml-[70px]',
                )}
            >
                {/* Content Header */}
                {(title || breadcrumbs.length > 0) && (
                    <div className="px-4 py-4 md:px-6">
                        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                            {title && (
                                <h1 className="text-xl font-semibold md:text-2xl">
                                    {title}
                                </h1>
                            )}
                            {breadcrumbs.length > 0 && (
                                <nav className="text-sm">
                                    <ol className="flex items-center gap-2">
                                        {breadcrumbs.map((crumb, index) => (
                                            <li key={index} className="flex items-center gap-2">
                                                {index > 0 && (
                                                    <span className="text-muted-foreground">/</span>
                                                )}
                                                {crumb.href ? (
                                                    <Link
                                                        href={crumb.href}
                                                        className="text-primary hover:underline"
                                                    >
                                                        {crumb.label}
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        {crumb.label}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                </nav>
                            )}
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <div className="p-4 md:p-6">{children}</div>
            </main>

            {/* Footer */}
            <AppFooter sidebarCollapsed={sidebarCollapsed} />

            {/* Flash → Sonner bridge */}
            <FlashAlerts />
            <Toaster position="top-right" richColors closeButton />
        </div>
    );
}
