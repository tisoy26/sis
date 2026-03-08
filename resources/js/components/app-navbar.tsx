import { router, usePage } from '@inertiajs/react';
import { ChevronDown, LogOut, Menu } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface AppNavbarProps {
    onToggleSidebar: () => void;
    sidebarCollapsed: boolean;
}

export default function AppNavbar({ onToggleSidebar, sidebarCollapsed }: AppNavbarProps) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const user = auth.user;
    const getInitials = useInitials();

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <header
            className={cn(
                'fixed top-0 right-0 z-40 flex h-[60px] items-center gap-4 border-b bg-background px-4 transition-all duration-300 lg:px-6',
                'left-0 lg:left-[250px]',
                sidebarCollapsed && 'lg:left-[70px]',
            )}
        >
            {/* Sidebar toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                className="size-8"
            >
                <Menu className="size-5" />
                <span className="sr-only">Toggle sidebar</span>
            </Button>

            <div className="flex-1" />

            {/* User dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative flex h-8 items-center gap-2 rounded-full px-2">
                        <Avatar className="size-8">
                            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                                {getInitials(user.full_name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="hidden text-sm font-medium md:inline-block">
                            {user.full_name}
                        </span>
                        <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                        <LogOut className="mr-2 size-4" />
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
