import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CalendarCheck,
    CalendarClock,
    ChevronLeft,
    ClipboardList,
    GraduationCap,
    Layers,
    LayoutDashboard,
    Megaphone,
    PartyPopper,
    ScrollText,
    Settings,
    ShieldCheck,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

type NavItem = {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
    label: string;
    items: NavItem[];
};

const adminNav: NavGroup[] = [
    {
        label: 'General',
        items: [
            { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        label: 'User Management',
        items: [
            { title: 'Users', href: '/admin/users', icon: Users },
        ],
    },
    {
        label: 'Master Data',
        items: [
            { title: 'School Year', href: '/admin/school-years', icon: CalendarCheck },
            { title: 'Year Levels', href: '/admin/year-levels', icon: Layers },
            { title: 'Sections', href: '/admin/sections', icon: ClipboardList },
            { title: 'Subjects', href: '/admin/subjects', icon: BookOpen },
        ],
    },
    {
        label: 'Academic',
        items: [
            { title: 'Teacher Assignments', href: '/admin/teacher-assignments', icon: UserCheck },
            { title: 'Schedules', href: '/admin/schedules', icon: CalendarClock },
        ],
    },
    {
        label: 'Content',
        items: [
            { title: 'Announcements', href: '/admin/announcements', icon: Megaphone },
            { title: 'Events', href: '/admin/events', icon: PartyPopper },
        ],
    },
    {
        label: 'System',
        items: [
            { title: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck },
            { title: 'Settings', href: '/admin/settings', icon: Settings },
        ],
    },
];

const staffNav: NavGroup[] = [
    {
        label: 'General',
        items: [
            { title: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Student Management',
        items: [
            { title: 'Students', href: '/staff/students', icon: GraduationCap },
            { title: 'Enrollment', href: '/staff/enrollment', icon: ScrollText },
            { title: 'Sections', href: '/staff/sections', icon: ClipboardList },
        ],
    },
    {
        label: 'Reports',
        items: [
            { title: 'Reports', href: '/staff/reports', icon: ClipboardList },
        ],
    },
];

const studentNav: NavGroup[] = [
    {
        label: 'General',
        items: [
            { title: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
        ],
    },
];

const teacherNav: NavGroup[] = [
    {
        label: 'General',
        items: [
            { title: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Classroom',
        items: [
            { title: 'My Classes', href: '/teacher/classes', icon: BookOpen },
            { title: 'Attendance', href: '/teacher/attendance', icon: CalendarCheck },
            { title: 'Grades', href: '/teacher/grades', icon: ClipboardList },
        ],
    },
    {
        label: 'Reports',
        items: [
            { title: 'Reports', href: '/teacher/reports', icon: ScrollText },
        ],
    },
];

function getNavGroups(type: string): NavGroup[] {
    switch (type) {
        case 'admin':
            return adminNav;
        case 'staff':
            return staffNav;
        case 'teacher':
            return teacherNav;
        case 'student':
            return studentNav;
        default:
            return [];
    }
}

function getRoleLabel(type: string): string {
    switch (type) {
        case 'admin':
            return 'Administration';
        case 'staff':
            return 'Registrar / Staff';
        case 'teacher':
            return 'Teacher';
        case 'student':
            return 'Student Portal';
        default:
            return 'Navigation';
    }
}

interface AppSidebarProps {
    collapsed: boolean;
    mobileOpen: boolean;
    onMobileClose: () => void;
}

export default function AppSidebar({ collapsed, mobileOpen, onMobileClose }: AppSidebarProps) {
    const { auth, systemSettings } = usePage<{ auth: { user: User }; systemSettings: { system_name: string; system_logo: string | null } }>().props;
    const user = auth.user;
    const navGroups = getNavGroups(user.type);
    const currentUrl = usePage().url;

    return (
        <aside
            className={cn(
                'fixed top-0 left-0 z-50 flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300',
                // Desktop
                'hidden lg:flex',
                collapsed ? 'lg:w-[70px]' : 'lg:w-[250px]',
                // Mobile
                mobileOpen && 'flex w-[250px]',
            )}
        >
            {/* Header */}
            <div className="flex h-[60px] shrink-0 items-center border-b px-4">
                <Link
                    href={`/${user.type}/dashboard`}
                    className="flex items-center gap-2 overflow-hidden"
                >
                    {systemSettings.system_logo ? (
                        <img src={`/storage/${systemSettings.system_logo}`} alt="Logo" className="size-7 shrink-0 rounded object-contain" />
                    ) : (
                        <AppLogoIcon className="size-7 shrink-0 fill-current" />
                    )}
                    {!collapsed && (
                        <span className="truncate text-base font-bold">{systemSettings.system_name}</span>
                    )}
                </Link>

                {/* Mobile close */}
                <button
                    onClick={onMobileClose}
                    className="ml-auto rounded-md p-1 hover:bg-sidebar-accent lg:hidden"
                >
                    <X className="size-5" />
                </button>
            </div>

            {/* Navigation (scrollable) */}
            <nav className="flex-1 overflow-y-auto px-2 py-2">
                {navGroups.map((group) => (
                    <div key={group.label} className="mb-2">
                        {/* Group label */}
                        {!collapsed ? (
                            <div className="px-3 pt-3 pb-1.5">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                                    {group.label}
                                </span>
                            </div>
                        ) : (
                            <div className="my-2 border-t border-sidebar-foreground/10" />
                        )}

                        <ul className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive = currentUrl.startsWith(item.href);
                                return (
                                    <li key={item.title}>
                                        <Link
                                            href={item.href}
                                            onClick={onMobileClose}
                                            className={cn(
                                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                                isActive
                                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                                                collapsed && 'justify-center px-2',
                                            )}
                                            title={collapsed ? item.title : undefined}
                                        >
                                            <item.icon className="size-5 shrink-0" />
                                            {!collapsed && <span>{item.title}</span>}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Footer with user info (fixed at bottom) */}
            <div className="shrink-0 border-t p-3">
                <div
                    className={cn(
                        'flex items-center gap-2',
                        collapsed && 'justify-center',
                    )}
                >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {user.first_name.charAt(0).toUpperCase()}{user.last_name.charAt(0).toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate text-xs font-semibold">{user.full_name}</span>
                            <span className="truncate text-xs text-sidebar-foreground/50">@{user.username}</span>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
