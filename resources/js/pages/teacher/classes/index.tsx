import { Head, router, usePage } from '@inertiajs/react';
import { BookOpen, GraduationCap, Users } from 'lucide-react';
import DataTable, { type Column, type Filter } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { User } from '@/types';

interface SubjectItem {
    id: number;
    code: string;
    name: string;
    assignment_id: number;
}

interface ClassItem {
    id: number;
    section_id: number;
    section_name: string;
    year_level_name: string;
    year_level_category: string;
    subjects: SubjectItem[];
    subject_count: number;
    student_count: number;
}

type PageProps = {
    classes: ClassItem[];
    activeSchoolYear: string | null;
    auth: { user: User };
};

const categoryColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    preschool: 'secondary',
    elementary: 'default',
    junior_high: 'outline',
    senior_high: 'destructive',
};

export default function TeacherClasses() {
    const { classes, activeSchoolYear, auth: { user } } = usePage<PageProps>().props;

    const columns: Column<ClassItem>[] = [
        {
            key: '#',
            label: '#',
            className: 'w-12',
            render: (_item, index) => index + 1,
        },
        {
            key: 'section_name',
            label: 'Section',
            render: (item) => (
                <span className="font-medium">{item.section_name}</span>
            ),
        },
        {
            key: 'year_level_name',
            label: 'Year Level',
            render: (item) => (
                <div className="flex items-center gap-2">
                    <span>{item.year_level_name}</span>
                    <Badge variant={categoryColors[item.year_level_category] ?? 'default'} className="text-[10px]">
                        {item.year_level_category.replace('_', ' ')}
                    </Badge>
                </div>
            ),
        },
        {
            key: 'subjects',
            label: 'Subjects',
            render: (item) => (
                <div className="flex flex-wrap gap-1">
                    {item.subjects.map((s) => (
                        <Badge key={s.id} variant="outline" className="text-[10px]">
                            {s.code}
                        </Badge>
                    ))}
                </div>
            ),
        },
        {
            key: 'student_count',
            label: 'Students',
            className: 'w-24 text-center',
            render: (item) => (
                <span className="font-medium">{item.student_count}</span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'w-28',
            render: (item) => (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.visit(`/teacher/classes/${item.section_id}`)}
                >
                    <Users className="mr-1 size-4" />
                    View
                </Button>
            ),
        },
    ];

    const filters: Filter<ClassItem>[] = [
        {
            key: 'year_level_category',
            label: 'Category',
            options: [
                { label: 'Preschool', value: 'preschool' },
                { label: 'Elementary', value: 'elementary' },
                { label: 'Junior High', value: 'junior_high' },
                { label: 'Senior High', value: 'senior_high' },
            ],
        },
    ];

    return (
        <AppLayout
            title="My Classes"
            breadcrumbs={[
                { label: 'Home', href: '/teacher/dashboard' },
                { label: 'My Classes' },
            ]}
        >
            <Head title="My Classes" />

            {activeSchoolYear && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="size-4" />
                    School Year: <span className="font-medium text-foreground">{activeSchoolYear}</span>
                </div>
            )}

            {classes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                        <BookOpen className="size-10 text-muted-foreground" />
                        <p className="text-muted-foreground">No classes assigned for this school year.</p>
                    </CardContent>
                </Card>
            ) : (
                <DataTable
                    columns={columns}
                    data={classes}
                    searchable
                    searchKeys={['section_name', 'year_level_name']}
                    searchPlaceholder="Search sections..."
                    filters={filters}
                    perPage={10}
                />
            )}
        </AppLayout>
    );
}
