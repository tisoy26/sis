import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CalendarClock,
    CalendarDays,
    CalendarCheck,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    FileText,
    GraduationCap,
    LayoutGrid,
    Megaphone,
    PartyPopper,
    UserCheck,
    UserPlus,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppLayout from '@/layouts/app-layout';
import StudentLayout from '@/layouts/student-layout';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useInitials } from '@/hooks/use-initials';
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

interface RecentActivity {
    id: number;
    user_name: string;
    action: 'created' | 'updated' | 'deleted';
    model_label: string;
    model_id: number | null;
    created_at: string;
}

interface TeacherDashboardStats {
    totalSections: number;
    totalSubjects: number;
    totalStudents: number;
    totalAssignments: number;
    activeSchoolYear: string | null;
}

interface SectionStudentCount {
    name: string;
    year_level: string;
    count: number;
}

interface StudentInfo {
    student_id: string;
    full_name: string;
    gender: string;
    status: string;
}

interface CurrentEnrollment {
    school_year: string;
    year_level: string | null;
    section: string;
    status: string;
}

interface SubjectInfo {
    id: number;
    code: string;
    name: string;
}

interface AttendanceSummary {
    present: number;
    absent: number;
    late: number;
    excused: number;
}

interface QuarterlyGrade {
    subject_code: string;
    subject_name: string;
    grades: Record<number, number | null>;
}

type PageProps = {
    auth: { user: User };
    stats?: DashboardStats;
    recentActivity?: RecentActivity[];
    staffStats?: StaffDashboardStats;
    studentsByStatus?: ChartDataItem[];
    enrollmentsByStatus?: ChartDataItem[];
    genderDistribution?: ChartDataItem[];
    sectionEnrollments?: SectionEnrollment[];
    recentEnrollments?: RecentEnrollment[];
    enrollmentTrend?: ChartDataItem[];
    teacherStats?: TeacherDashboardStats;
    sectionStudentCounts?: SectionStudentCount[];
    studentInfo?: StudentInfo | null;
    currentEnrollment?: CurrentEnrollment | null;
    subjects?: SubjectInfo[];
    attendanceSummary?: AttendanceSummary;
    quarterlyGrades?: QuarterlyGrade[];
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
    Present: '#22c55e',
    Absent: '#ef4444',
    Late: '#f59e0b',
    Excused: '#8b5cf6',
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

const actionColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    created: 'default',
    updated: 'secondary',
    deleted: 'destructive',
};

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

export default function Dashboard() {
    const {
        auth,
        stats,
        recentActivity = [],
        staffStats,
        studentsByStatus = [],
        enrollmentsByStatus = [],
        genderDistribution = [],
        sectionEnrollments = [],
        recentEnrollments = [],
        enrollmentTrend = [],
        teacherStats,
        sectionStudentCounts = [],
        studentInfo,
        currentEnrollment,
        subjects = [],
        attendanceSummary,
        quarterlyGrades = [],
    } = usePage<PageProps>().props;
    const user = auth.user;
    const [activityPage, setActivityPage] = useState(1);
    const [enrollmentPage, setEnrollmentPage] = useState(1);
    const perPage = 5;
    const totalPages = Math.max(1, Math.ceil(recentActivity.length / perPage));
    const paginatedActivity = recentActivity.slice(
        (activityPage - 1) * perPage,
        activityPage * perPage,
    );
    const enrollmentTotalPages = Math.max(1, Math.ceil(recentEnrollments.length / perPage));
    const paginatedEnrollments = recentEnrollments.slice(
        (enrollmentPage - 1) * perPage,
        enrollmentPage * perPage,
    );

    const roleLabel = user.type.charAt(0).toUpperCase() + user.type.slice(1);

    const activeSchoolYear = stats?.activeSchoolYear ?? staffStats?.activeSchoolYear ?? teacherStats?.activeSchoolYear ?? currentEnrollment?.school_year;

    const getInitials = useInitials();

    // Student uses a different layout
    if (user.type === 'student') {
        const totalAttendance = (attendanceSummary?.present ?? 0) + (attendanceSummary?.absent ?? 0) + (attendanceSummary?.late ?? 0) + (attendanceSummary?.excused ?? 0);

        return (
            <StudentLayout title="Dashboard">
                <Head title="Dashboard" />

                <div className="mx-auto max-w-7xl space-y-6">
                    {/* Row 1: Profile card + Stats/Enrollment info card */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Profile Card */}
                        <Card className="bg-primary text-primary-foreground">
                            <CardContent className="flex flex-col items-center pt-8 pb-6">
                                <Avatar className="mb-4 size-20">
                                    <AvatarFallback className="bg-primary-foreground text-2xl text-primary">
                                        {getInitials(user.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <h2 className="text-lg font-semibold">{user.full_name}</h2>
                                {studentInfo && (
                                    <>
                                        <p className="text-sm text-primary-foreground/70">{studentInfo.student_id}</p>
                                        <Badge variant="secondary" className="mt-2 capitalize">{studentInfo.status}</Badge>
                                    </>
                                )}
                                {currentEnrollment && (
                                    <div className="mt-4 w-full space-y-1 border-t border-primary-foreground/20 pt-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-primary-foreground/70">Year Level</span>
                                            <span className="font-medium">{currentEnrollment.year_level ?? 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-primary-foreground/70">Section</span>
                                            <span className="font-medium">{currentEnrollment.section}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Stats grid card */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Overview
                                    {activeSchoolYear && (
                                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                                            S.Y. {activeSchoolYear}
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    <div className="rounded-lg border p-3 text-center">
                                        <BookOpen className="mx-auto mb-1 size-5 text-muted-foreground" />
                                        <p className="text-2xl font-bold">{subjects.length}</p>
                                        <p className="text-xs text-muted-foreground">Subjects</p>
                                    </div>
                                    <div className="rounded-lg border p-3 text-center">
                                        <CalendarCheck className="mx-auto mb-1 size-5 text-green-500" />
                                        <p className="text-2xl font-bold">{attendanceSummary?.present ?? 0}</p>
                                        <p className="text-xs text-muted-foreground">Present</p>
                                    </div>
                                    <div className="rounded-lg border p-3 text-center">
                                        <CalendarDays className="mx-auto mb-1 size-5 text-red-500" />
                                        <p className="text-2xl font-bold">{attendanceSummary?.absent ?? 0}</p>
                                        <p className="text-xs text-muted-foreground">Absent</p>
                                    </div>
                                    <div className="rounded-lg border p-3 text-center">
                                        <ClipboardList className="mx-auto mb-1 size-5 text-yellow-500" />
                                        <p className="text-2xl font-bold">{attendanceSummary?.late ?? 0}</p>
                                        <p className="text-xs text-muted-foreground">Late</p>
                                    </div>
                                    {currentEnrollment && (
                                        <>
                                            <div className="rounded-lg border p-3 text-center">
                                                <GraduationCap className="mx-auto mb-1 size-5 text-muted-foreground" />
                                                <p className="text-sm font-semibold">{currentEnrollment.section}</p>
                                                <p className="text-xs text-muted-foreground">Section</p>
                                            </div>
                                            <div className="rounded-lg border p-3 text-center">
                                                <LayoutGrid className="mx-auto mb-1 size-5 text-muted-foreground" />
                                                <p className="text-sm font-semibold">{currentEnrollment.year_level ?? 'N/A'}</p>
                                                <p className="text-xs text-muted-foreground">Year Level</p>
                                            </div>
                                            <div className="rounded-lg border p-3 text-center">
                                                <Users className="mx-auto mb-1 size-5 text-muted-foreground" />
                                                <p className="text-sm font-semibold capitalize">{currentEnrollment.status}</p>
                                                <p className="text-xs text-muted-foreground">Enrollment</p>
                                            </div>
                                            <div className="rounded-lg border p-3 text-center">
                                                <CalendarDays className="mx-auto mb-1 size-5 text-muted-foreground" />
                                                <p className="text-sm font-semibold">{totalAttendance}</p>
                                                <p className="text-xs text-muted-foreground">Total Days</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Row 2: Quick Actions + Attendance | My Subjects */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Left column: Quick Actions + Attendance */}
                        <div className="flex flex-col gap-4">
                            {/* Quick Actions */}
                            <div className="flex flex-col gap-3">
                                <Button variant="outline" size="lg" className="w-full cursor-pointer justify-center gap-2 rounded-xl border bg-card px-4 py-6 text-card-foreground shadow-sm" asChild>
                                    <Link href="/student/events">
                                        <PartyPopper className="size-5" />
                                        Events
                                    </Link>
                                </Button>
                                <Button variant="outline" size="lg" className="w-full cursor-pointer justify-center gap-2 rounded-xl border bg-card px-4 py-6 text-card-foreground shadow-sm" asChild>
                                    <Link href="/student/announcements">
                                        <Megaphone className="size-5" />
                                        Announcements
                                    </Link>
                                </Button>
                                <Button variant="outline" size="lg" className="w-full cursor-pointer justify-center gap-2 rounded-xl border bg-card px-4 py-6 text-card-foreground shadow-sm" asChild>
                                    <Link href="/student/schedule">
                                        <CalendarClock className="size-5" />
                                        View Schedule
                                    </Link>
                                </Button>
                            </div>

                            {/* Attendance chart */}
                            {totalAttendance > 0 ? (
                                <DonutChart
                                    data={[
                                        { name: 'Present', value: attendanceSummary?.present ?? 0 },
                                        ...(attendanceSummary && attendanceSummary.absent > 0 ? [{ name: 'Absent', value: attendanceSummary.absent }] : []),
                                        ...(attendanceSummary && attendanceSummary.late > 0 ? [{ name: 'Late', value: attendanceSummary.late }] : []),
                                        ...(attendanceSummary && attendanceSummary.excused > 0 ? [{ name: 'Excused', value: attendanceSummary.excused }] : []),
                                    ]}
                                    title="Attendance Overview"
                                />
                            ) : (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Attendance Overview</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex h-[250px] items-center justify-center">
                                        <p className="text-sm text-muted-foreground">No attendance data yet</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Clickable subjects */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base">My Subjects</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {subjects.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No subjects assigned yet.</p>
                                ) : (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {subjects.map((subject) => {
                                            const subjectGrade = quarterlyGrades.find((g) => g.subject_code === subject.code);
                                            const grades = subjectGrade ? [subjectGrade.grades[1], subjectGrade.grades[2], subjectGrade.grades[3], subjectGrade.grades[4]] : [];
                                            const validGrades = grades.filter((g): g is number => g !== null);
                                            const latestGrade = validGrades.length > 0 ? validGrades[validGrades.length - 1] : null;

                                            return (
                                                <Link
                                                    key={subject.id}
                                                    href={`/student/subjects/${subject.id}`}
                                                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                                                >
                                                    <BookOpen className="size-5 shrink-0 text-muted-foreground" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium">{subject.name}</p>
                                                        <p className="text-xs text-muted-foreground">{subject.code}</p>
                                                    </div>
                                                    {latestGrade !== null && (
                                                        <span className={`text-sm font-semibold ${latestGrade < 75 ? 'text-destructive' : ''}`}>
                                                            {latestGrade}
                                                        </span>
                                                    )}
                                                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>


                </div>
            </StudentLayout>
        );
    }

    return (
        <AppLayout
            title="Dashboard"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
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
                            <span className="font-medium capitalize">{roleLabel}</span>.
                            {activeSchoolYear && (
                                <>
                                    {' '}Active school year:{' '}
                                    <span className="font-medium">{activeSchoolYear}</span>.
                                </>
                            )}
                        </p>
                    </CardContent>
                </Card>

                {/* Admin stats */}
                {user.type === 'admin' && stats && (
                    <>
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
                    </>
                )}

                {/* Staff Dashboard */}
                {user.type === 'staff' && staffStats && (
                    <>
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
                            {/* Section Enrollment Overview */}
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
                    </>
                )}

                {/* Teacher Dashboard */}
                {user.type === 'teacher' && teacherStats && (
                    <>
                        {/* Stat Cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title="My Sections"
                                value={teacherStats.totalSections}
                                icon={LayoutGrid}
                                href="/teacher/classes"
                            />
                            <StatCard
                                title="My Subjects"
                                value={teacherStats.totalSubjects}
                                icon={BookOpen}
                            />
                            <StatCard
                                title="Total Students"
                                value={teacherStats.totalStudents}
                                icon={Users}
                            />
                            <StatCard
                                title="Assignments"
                                value={teacherStats.totalAssignments}
                                icon={ClipboardList}
                            />
                        </div>

                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Gender Distribution */}
                            <DonutChart data={genderDistribution} title="Student Gender Distribution" />

                            {/* Section Student Counts */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-base">Students per Section</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {sectionStudentCounts.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No sections assigned.</p>
                                    ) : (
                                        <div className="max-h-80 space-y-3 overflow-y-auto pr-2">
                                            {sectionStudentCounts.map((section, idx) => {
                                                const maxCount = Math.max(...sectionStudentCounts.map((s) => s.count), 1);
                                                const pct = (section.count / maxCount) * 100;
                                                return (
                                                    <div key={`${section.name}-${section.year_level}-${idx}`}>
                                                        <div className="mb-1 flex items-center justify-between text-sm">
                                                            <span className="font-medium">{section.name}</span>
                                                            <span className="text-muted-foreground">{section.count} students</span>
                                                        </div>
                                                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="h-full rounded-full bg-primary transition-all"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">{section.year_level}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
