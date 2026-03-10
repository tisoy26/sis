import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    LayoutGrid,
    UserCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { User } from '@/types';

interface DashboardStats {
    totalUsers: number;
    totalTeachers: number;
    totalStaff: number;
    totalSubjects: number;
    totalSections: number;
    totalSchoolYears: number;
    totalAssignments: number;
    activeSchoolYear: string | null;
}

interface RecentActivity {
    id: number;
    user_name: string;
    action: 'created' | 'updated' | 'deleted';
    model_label: string;
    model_id: number | null;
    created_at: string;
}

type PageProps = {
    auth: { user: User };
    stats: DashboardStats;
    recentActivity: RecentActivity[];
};

function StatCard({
    title,
    value,
    icon: Icon,
    description,
    href,
}: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
    href?: string;
}) {
    const content = (
        <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
}

const actionColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    created: 'default',
    updated: 'secondary',
    deleted: 'destructive',
};

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

export default function AdminDashboard() {
    const { auth, stats, recentActivity = [] } = usePage<PageProps>().props;
    const user = auth.user;
    const [activityPage, setActivityPage] = useState(1);
    const perPage = 5;
    const totalPages = Math.max(1, Math.ceil(recentActivity.length / perPage));
    const paginatedActivity = recentActivity.slice(
        (activityPage - 1) * perPage,
        activityPage * perPage,
    );

    return (
        <AppLayout
            title="Dashboard"
            breadcrumbs={[
                { label: 'Home', href: '/admin/dashboard' },
                { label: 'Dashboard' },
            ]}
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Welcome card */}
                <Card>
                    <CardContent className="pt-6">
                        <h2 className="text-lg font-semibold">
                            Welcome back, {user.full_name}!
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            You are logged in as{' '}
                            <span className="font-medium capitalize">Admin</span>.
                            {stats.activeSchoolYear && (
                                <>
                                    {' '}Active school year:{' '}
                                    <span className="font-medium">{stats.activeSchoolYear}</span>.
                                </>
                            )}
                        </p>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers}
                        icon={Users}
                        description={`${stats.totalTeachers} teachers, ${stats.totalStaff} staff`}
                        href="/admin/users"
                    />
                    <StatCard
                        title="Active Subjects"
                        value={stats.totalSubjects}
                        icon={BookOpen}
                        description="Currently active"
                        href="/admin/subjects"
                    />
                    <StatCard
                        title="Active Sections"
                        value={stats.totalSections}
                        icon={LayoutGrid}
                        description="Currently active"
                        href="/admin/sections"
                    />
                    <StatCard
                        title="Assignments"
                        value={stats.totalAssignments}
                        icon={UserCheck}
                        description={stats.activeSchoolYear ?? 'No active school year'}
                        href="/admin/teacher-assignments"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        title="School Years"
                        value={stats.totalSchoolYears}
                        icon={CalendarDays}
                        description={stats.activeSchoolYear ? `Active: ${stats.activeSchoolYear}` : 'None active'}
                        href="/admin/school-years"
                    />
                    <StatCard
                        title="Teachers"
                        value={stats.totalTeachers}
                        icon={ClipboardList}
                        description="Registered teachers"
                        href="/admin/users"
                    />
                    <StatCard
                        title="Staff"
                        value={stats.totalStaff}
                        icon={Users}
                        description="Registered staff"
                        href="/admin/users"
                    />
                </div>

                {/* Recent Activity + Quick Actions */}
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Recent Activity */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Recent Activity</CardTitle>
                            <Link href="/admin/audit-logs">
                                <Button variant="ghost" size="sm">
                                    View All
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {recentActivity.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No recent activity to display.
                                </p>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Action</TableHead>
                                                <TableHead>Module</TableHead>
                                                <TableHead className="text-right">When</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedActivity.map((activity) => (
                                                <TableRow key={activity.id}>
                                                    <TableCell className="font-medium">
                                                        {activity.user_name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={actionColors[activity.action] ?? 'default'}>
                                                            {activity.action}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{activity.model_label}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">
                                                        {timeAgo(activity.created_at)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between pt-4">
                                            <p className="text-xs text-muted-foreground">
                                                Page {activityPage} of {totalPages}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-8"
                                                    disabled={activityPage <= 1}
                                                    onClick={() => setActivityPage((p) => p - 1)}
                                                >
                                                    <ChevronLeft className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="size-8"
                                                    disabled={activityPage >= totalPages}
                                                    onClick={() => setActivityPage((p) => p + 1)}
                                                >
                                                    <ChevronRight className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Link href="/admin/users">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <Users className="size-4" />
                                    Manage Users
                                </Button>
                            </Link>
                            <Link href="/admin/school-years">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <CalendarDays className="size-4" />
                                    School Years
                                </Button>
                            </Link>
                            <Link href="/admin/sections">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <LayoutGrid className="size-4" />
                                    Manage Sections
                                </Button>
                            </Link>
                            <Link href="/admin/subjects">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <BookOpen className="size-4" />
                                    Manage Subjects
                                </Button>
                            </Link>
                            <Link href="/admin/teacher-assignments">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <UserCheck className="size-4" />
                                    Teacher Assignments
                                </Button>
                            </Link>
                            <Link href="/admin/audit-logs">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <ClipboardList className="size-4" />
                                    Audit Logs
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
