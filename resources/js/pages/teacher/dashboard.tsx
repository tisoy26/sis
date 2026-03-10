import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    ClipboardList,
    LayoutGrid,
    Users,
} from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { User } from '@/types';

interface TeacherDashboardStats {
    totalSections: number;
    totalSubjects: number;
    totalStudents: number;
    totalAssignments: number;
    activeSchoolYear: string | null;
}

interface ChartDataItem {
    name: string;
    value: number;
}

interface SectionStudentCount {
    name: string;
    year_level: string;
    count: number;
}

type PageProps = {
    auth: { user: User };
    teacherStats: TeacherDashboardStats;
    genderDistribution: ChartDataItem[];
    sectionStudentCounts: SectionStudentCount[];
};

function StatCard({
    title,
    value,
    icon: Icon,
    href,
}: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
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

export default function TeacherDashboard() {
    const {
        auth,
        teacherStats,
        genderDistribution = [],
        sectionStudentCounts = [],
    } = usePage<PageProps>().props;
    const user = auth.user;

    return (
        <AppLayout
            title="Dashboard"
            breadcrumbs={[
                { label: 'Home', href: '/teacher/dashboard' },
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
                            <span className="font-medium capitalize">Teacher</span>.
                            {teacherStats.activeSchoolYear && (
                                <>
                                    {' '}Active school year:{' '}
                                    <span className="font-medium">{teacherStats.activeSchoolYear}</span>.
                                </>
                            )}
                        </p>
                    </CardContent>
                </Card>

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
            </div>
        </AppLayout>
    );
}
