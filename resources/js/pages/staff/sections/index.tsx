import { Head, usePage } from '@inertiajs/react';
import { LayoutGrid, Users } from 'lucide-react';
import DataTable, { type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { User } from '@/types';

interface SectionView {
    id: number;
    name: string;
    year_level_name: string | null;
    status: 'active' | 'inactive';
    enrolled_count: number;
}

type PageProps = {
    auth: { user: User };
    sections: SectionView[];
    activeSchoolYear: string | null;
};

export default function StaffSectionIndex() {
    const { auth, sections, activeSchoolYear } = usePage<PageProps>().props;
    const user = auth.user;

    const totalEnrolled = sections.reduce((sum, s) => sum + s.enrolled_count, 0);

    const columns: Column<SectionView>[] = [
        {
            key: '#',
            label: '#',
            className: 'w-12',
            render: (_item, index) => index + 1,
        },
        { key: 'name', label: 'Section Name' },
        {
            key: 'year_level_name',
            label: 'Year Level',
            render: (item) => item.year_level_name ?? <span className="text-muted-foreground">—</span>,
        },
        {
            key: 'enrolled_count',
            label: 'Enrolled Students',
            render: (item) => (
                <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    <span className="font-medium">{item.enrolled_count}</span>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (item) => (
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                    {item.status}
                </Badge>
            ),
        },
    ];

    return (
        <AppLayout
            title="Sections"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'Sections' },
            ]}
        >
            <Head title="Sections" />

            <div className="space-y-4">
                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <LayoutGrid className="size-8 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">{sections.length}</p>
                                <p className="text-xs text-muted-foreground">Active Sections</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <Users className="size-8 text-muted-foreground" />
                            <div>
                                <p className="text-2xl font-bold">{totalEnrolled}</p>
                                <p className="text-xs text-muted-foreground">Total Enrolled</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <div>
                                <p className="text-2xl font-bold">{activeSchoolYear ?? '—'}</p>
                                <p className="text-xs text-muted-foreground">Active School Year</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DataTable
                    columns={columns}
                    data={sections}
                    searchable
                    searchKeys={['name']}
                    searchPlaceholder="Search sections..."
                    emptyMessage="No active sections found."
                />
            </div>
        </AppLayout>
    );
}
