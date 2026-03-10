import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    LayoutGrid,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { User } from '@/types';

interface StaffDashboardStats {
    totalStudents: number;
    activeStudents: number;
    totalEnrollments: number;
    totalSections: number;
    activeSchoolYear: string | null;
}

interface ChartDataItem {
    name: string;
    value: number;
}

interface SectionEnrollment {
    name: string;
    count: number;
    year_level?: string | null;
}

interface RecentEnrollment {
    id: number;
    student_name: string;
    student_number: string;
    section_name: string;
    school_year_name: string;
    status: string;
    enrolled_at: string | null;
    created_at: string;
}

type PageProps = {
    auth: { user: User };
    staffStats: StaffDashboardStats;
    studentsByStatus: ChartDataItem[];
    enrollmentsByStatus: ChartDataItem[];
    genderDistribution: ChartDataItem[];
    sectionEnrollments: SectionEnrollment[];
    recentEnrollments: RecentEnrollment[];
    enrollmentTrend: ChartDataItem[];
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

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const statusColors: Record<string, string> = {
    Active: '#22c55e',
    Inactive: '#94a3b8',
    Graduated: '#3b82f6',
    Transferred: '#f59e0b',
    Enrolled: '#3b82f6',
    Dropped: '#ef4444',
    Completed: '#22c55e',
    Pending: '#f59e0b',
    Male: '#3b82f6',
    Female: '#ec4899',
};

function DonutChart({ data, title }: { data: ChartDataItem[]; title: string }) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex h-[250px] items-center justify-center">
                    <p className="text-sm text-muted-foreground">No data available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, value, x, y, textAnchor }) => (
                                <text x={x} y={y} textAnchor={textAnchor} fill="hsl(var(--foreground))" fontSize={12}>
                                    {name}: {value}
                                </text>
                            )}
                            labelLine={false}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={entry.name}
                                    fill={statusColors[entry.name] ?? CHART_COLORS[index % CHART_COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                borderRadius: '8px',
                                border: '1px solid hsl(var(--border))',
                                backgroundColor: 'hsl(var(--popover))',
                                color: 'hsl(var(--popover-foreground))',
                            }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

const enrollmentStatusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    enrolled: 'default',
    completed: 'secondary',
    dropped: 'destructive',
    pending: 'secondary',
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

export default function StaffDashboard() {
    const {
        auth,
        staffStats,
        studentsByStatus = [],
        enrollmentsByStatus = [],
        genderDistribution = [],
        sectionEnrollments = [],
        recentEnrollments = [],
        enrollmentTrend = [],
    } = usePage<PageProps>().props;
    const user = auth.user;
    const [enrollmentPage, setEnrollmentPage] = useState(1);
    const perPage = 5;
    const enrollmentTotalPages = Math.max(1, Math.ceil(recentEnrollments.length / perPage));
    const paginatedEnrollments = recentEnrollments.slice(
        (enrollmentPage - 1) * perPage,
        enrollmentPage * perPage,
    );

    return (
        <AppLayout
            title="Dashboard"
            breadcrumbs={[
                { label: 'Home', href: '/staff/dashboard' },
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
                            <span className="font-medium capitalize">Staff</span>.
                            {staffStats.activeSchoolYear && (
                                <>
                                    {' '}Active school year:{' '}
                                    <span className="font-medium">{staffStats.activeSchoolYear}</span>.
                                </>
                            )}
                        </p>
                    </CardContent>
                </Card>

                {/* Stat Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Students"
                        value={staffStats.totalStudents}
                        icon={Users}
                        description={`${staffStats.activeStudents} active`}
                        href="/staff/students"
                    />
                    <StatCard
                        title="Enrollments"
                        value={staffStats.totalEnrollments}
                        icon={GraduationCap}
                        description={staffStats.activeSchoolYear ?? 'No active school year'}
                        href="/staff/enrollment"
                    />
                    <StatCard
                        title="Active Sections"
                        value={staffStats.totalSections}
                        icon={LayoutGrid}
                        description="Currently active"
                        href="/staff/sections"
                    />
                    <StatCard
                        title="School Year"
                        value={staffStats.activeSchoolYear ?? 'None'}
                        icon={CalendarDays}
                        description="Current active period"
                    />
                </div>

                {/* Charts */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <DonutChart data={studentsByStatus} title="Students by Status" />
                    <DonutChart data={enrollmentsByStatus} title="Enrollments by Status" />
                    <DonutChart data={genderDistribution} title="Gender Distribution" />
                </div>

                {/* Section Enrollment + Enrollment Trend */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {sectionEnrollments.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Section Enrollment Overview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
                                    {sectionEnrollments.map((section, idx) => {
                                        const maxCount = Math.max(...sectionEnrollments.map((s) => s.count), 1);
                                        const percentage = (section.count / maxCount) * 100;
                                        return (
                                            <div key={`${section.name}-${idx}`} className="space-y-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium">
                                                        {section.name}
                                                        {section.year_level && (
                                                            <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                                                                — {section.year_level}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {section.count} enrolled
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-muted">
                                                    <div
                                                        className="h-2 rounded-full bg-primary transition-all"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Enrollment Trend per School Year */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Enrollment Trend per School Year</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {enrollmentTrend.length === 0 ? (
                                <div className="flex h-[250px] items-center justify-center">
                                    <p className="text-sm text-muted-foreground">No data available</p>
                                </div>
                            ) : (
                                <ChartContainer
                                    config={{
                                        value: { label: 'Students', color: 'var(--primary)' },
                                    } satisfies ChartConfig}
                                    className="h-[350px] w-full"
                                >
                                    <BarChart data={enrollmentTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                            {enrollmentTrend.map((_, index) => (
                                                <Cell
                                                    key={`bar-${index}`}
                                                    fill={index === enrollmentTrend.length - 1 ? 'var(--color-value)' : 'var(--color-value)'}
                                                    fillOpacity={index === enrollmentTrend.length - 1 ? 1 : 0.5}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ChartContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Enrollments */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Recent Enrollments</CardTitle>
                        <Link href="/staff/enrollment">
                            <Button variant="ghost" size="sm">
                                View All
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentEnrollments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No recent enrollments to display.
                            </p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Section</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">When</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedEnrollments.map((enrollment) => (
                                            <TableRow key={enrollment.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{enrollment.student_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {enrollment.student_number}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{enrollment.section_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={enrollmentStatusColors[enrollment.status] ?? 'default'}>
                                                        {enrollment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {timeAgo(enrollment.created_at)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {enrollmentTotalPages > 1 && (
                                    <div className="flex items-center justify-between pt-4">
                                        <p className="text-xs text-muted-foreground">
                                            Page {enrollmentPage} of {enrollmentTotalPages}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="size-8"
                                                disabled={enrollmentPage <= 1}
                                                onClick={() => setEnrollmentPage((p) => p - 1)}
                                            >
                                                <ChevronLeft className="size-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="size-8"
                                                disabled={enrollmentPage >= enrollmentTotalPages}
                                                onClick={() => setEnrollmentPage((p) => p + 1)}
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
            </div>
        </AppLayout>
    );
}
