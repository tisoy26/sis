import { cn } from '@/lib/utils';

interface AppFooterProps {
    sidebarCollapsed: boolean;
}

export default function AppFooter({ sidebarCollapsed }: AppFooterProps) {
    return (
        <footer
            className={cn(
                'fixed bottom-0 right-0 z-30 border-t bg-background px-4 py-3  text-xs text-muted-foreground transition-all duration-300 lg:px-6',
                'left-0 lg:left-[250px]',
                sidebarCollapsed && 'lg:left-[70px]',
            )}
        >
            &copy; {new Date().getFullYear()} GOJAI School Information System. All rights reserved.
        </footer>
    );
}
