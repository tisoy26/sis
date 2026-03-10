import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Eye, GraduationCap, Users, UserRound } from 'lucide-react';
import DataTable, { type Column, type Filter } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { User } from '@/types';

interface StudentItem {
    id: number;
    student_id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    gender: string;
    contact_number: string | null;
    email: string | null;
    status: string;
    enrolled_at: string | null;
}

interface SubjectItem {
    id: number;
    code: string;
    name: string;
}

interface SectionInfo {
    id: number;
    name: string;
    year_level_name: string;
}

interface Summary {
    total: number;
    male: number;
    female: number;
    enrolled: number;
    dropped: number;
}

type PageProps = {
    section: SectionInfo;
    students: StudentItem[];
    subjects: SubjectItem[];
    activeSchoolYear: string | null;
    summary: Summary;
    auth: { user: User };
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    enrolled: 'default',
    completed: 'secondary',
    dropped: 'destructive',
};

export default function TeacherClassShow() {
    const { section, students, subjects, activeSchoolYear, summary, auth: { user } } = usePage<PageProps>().props;

    const columns: Column<StudentItem>[] = [
        {
            key: '#',
            label: '#',
            className: 'w-12',
            render: (_item, index) => index + 1,
        },
        { key: 'student_id', label: 'Student ID' },
        {
            key: 'full_name',
            label: 'Name',
            render: (item) => (
                <span className="font-medium">{item.full_name}</span>
            ),
        },
        {
            key: 'gender',
            label: 'Gender',
            render: (item) => <span className="capitalize">{item.gender}</span>,
        },
        {
            key: 'contact_number',
            label: 'Contact',
            render: (item) => item.contact_number || '—',
        },
        {
            key: 'status',
            label: 'Status',
            render: (item) => (
                <Badge variant={statusColors[item.status] ?? 'default'}>
                    {item.status}
                </Badge>
            ),
        },
        {
            key: 'enrolled_at',
            label: 'Enrolled',
            render: (item) => item.enrolled_at ? new Date(item.enrolled_at).toLocaleDateString() : '—',
        },
        {
            key: 'id' as keyof StudentItem,
            label: 'Action',
            className: 'w-20 text-center',
            render: (item) => (
                <Button size="sm" variant="outline" asChild>
                    <Link href={`/teacher/classes/${section.id}/students/${item.id}`}>
                        <Eye className="mr-1 size-3" />
                        View
                    </Link>
                </Button>
            ),
        },
    ];

    const filters: Filter<StudentItem>[] = [
        {
            key: 'gender',
            label: 'Gender',
            options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
            ],
        },
        {
            key: 'status',
            label: 'Status',
            options: [
                { label: 'Enrolled', value: 'enrolled' },
                { label: 'Dropped', value: 'dropped' },
                { label: 'Completed', value: 'completed' },
            ],
        },
    ];

    const statCards = [
        { label: 'Total Students', value: summary.total, icon: Users },
        { label: 'Male', value: summary.male, icon: UserRound },
        { label: 'Female', value: summary.female, icon: UserRound },
        { label: 'Enrolled', value: summary.enrolled, icon: GraduationCap },
    ];

    return (
        <AppLayout
            title={`${section.name} — ${section.year_level_name}`}
            breadcrumbs={[
                { label: 'Home', href: '/teacher/dashboard' },
                { label: 'My Classes', href: '/teacher/classes' },
                { label: section.name },
            ]}
        >
            <Head title={`${section.name} - ${section.year_level_name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="size-4" />
                            {activeSchoolYear} &middot; {section.year_level_name}
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.visit('/teacher/classes')}>
                        <ArrowLeft className="mr-1 size-4" />
                        Back to Classes
                    </Button>
                </div>

                {/* Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="flex items-center gap-4 pt-6">
                                <div className="rounded-lg bg-muted p-2.5">
                                    <stat.icon className="size-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Subjects */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Assigned Subjects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {subjects.map((s) => (
                                <Badge key={s.id} variant="outline" className="text-sm">
                                    {s.code} — {s.name}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Student Roster */}
                <DataTable
                    columns={columns}
                    data={students}
                    searchable
                    searchKeys={['student_id', 'full_name', 'first_name', 'last_name']}
                    searchPlaceholder="Search students..."
                    filters={filters}
                    perPage={15}
                />
            </div>
        </AppLayout>
    );
}
