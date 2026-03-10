import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CalendarCheck,
    CalendarClock,
    CalendarDays,
    ChevronRight,
    ClipboardList,
    GraduationCap,
    LayoutGrid,
    Megaphone,
    PartyPopper,
    Users,
} from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import StudentLayout from '@/layouts/student-layout';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

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

interface ChartDataItem {
    name: string;
    value: number;
}

type PageProps = {
    auth: { user: User };
    studentInfo: StudentInfo | null;
    currentEnrollment: CurrentEnrollment | null;
    subjects: SubjectInfo[];
    attendanceSummary: AttendanceSummary;
    quarterlyGrades: QuarterlyGrade[];
};

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const statusColors: Record<string, string> = {
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

export default function StudentDashboard() {
    const {
        auth,
        studentInfo,
        currentEnrollment,
        subjects = [],
        attendanceSummary,
        quarterlyGrades = [],
    } = usePage<PageProps>().props;
    const user = auth.user;
    const getInitials = useInitials();

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
                                {currentEnrollment?.school_year && (
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        S.Y. {currentEnrollment.school_year}
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
