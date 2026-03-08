import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from '@/components/confirm-modal';
import DataTable, { type Column, type Filter } from '@/components/data-table';
import FormModal from '@/components/form-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { Enrollment, User } from '@/types';

type DropdownOption = { value: string; label: string };
type SectionOption = { value: string; label: string; year_level_id: string | null };

type PageProps = {
    auth: { user: User };
    enrollments: Enrollment[];
    students: DropdownOption[];
    schoolYears: DropdownOption[];
    yearLevels: DropdownOption[];
    sections: SectionOption[];
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    enrolled: 'default',
    dropped: 'destructive',
    completed: 'secondary',
};

export default function EnrollmentIndex() {
    const { auth, enrollments, students, schoolYears, yearLevels, sections } =
        usePage<PageProps>().props;
    const user = auth.user;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Enrollment | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Enrollment | null>(null);

    const form = useForm({
        student_id: '',
        school_year_id: '',
        year_level_id: '',
        section_id: '',
        status: 'enrolled' as Enrollment['status'],
        remarks: '',
    });

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (enrollment: Enrollment) => {
        setEditing(enrollment);
        form.setData({
            student_id: String(enrollment.student_id),
            school_year_id: String(enrollment.school_year_id),
            year_level_id: enrollment.year_level_id ? String(enrollment.year_level_id) : '',
            section_id: String(enrollment.section_id),
            status: enrollment.status,
            remarks: enrollment.remarks ?? '',
        });
        form.clearErrors();
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        form.reset();
        form.clearErrors();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            form.put(`/staff/enrollment/${editing.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else {
            form.post('/staff/enrollment', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/staff/enrollment/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    // Build filter options from dropdown data
    const schoolYearFilterOptions = schoolYears.map((sy) => ({
        label: sy.label,
        value: sy.value,
    }));

    const sectionFilterOptions = sections.map((s) => {
        const yl = yearLevels.find((y) => y.value === s.year_level_id);
        return {
            label: yl ? `${s.label} — ${yl.label}` : s.label,
            value: s.value,
        };
    });

    const columns: Column<Enrollment>[] = [
        {
            key: '#',
            label: '#',
            className: 'w-12',
            render: (_item, index) => index + 1,
        },
        { key: 'student_number', label: 'Student ID' },
        { key: 'student_name', label: 'Student Name' },
        { key: 'school_year_name', label: 'School Year' },
        {
            key: 'year_level_name',
            label: 'Year Level',
            render: (item) => item.year_level_name ?? <span className="text-muted-foreground">—</span>,
        },
        { key: 'section_name', label: 'Section' },
        {
            key: 'enrolled_at',
            label: 'Enrolled Date',
            render: (item) =>
                item.enrolled_at
                    ? new Date(item.enrolled_at).toLocaleDateString()
                    : '—',
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
            key: 'actions',
            label: 'Actions',
            className: 'w-24',
            render: (item) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(item)}>
                        <Pencil className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const filters: Filter<Enrollment>[] = [
        {
            key: 'school_year_id' as keyof Enrollment,
            label: 'School Year',
            options: schoolYearFilterOptions,
        },
        {
            key: 'year_level_id' as keyof Enrollment,
            label: 'Year Level',
            options: yearLevels.map((yl) => ({ label: yl.label, value: yl.value })),
        },
        {
            key: 'section_id' as keyof Enrollment,
            label: 'Section',
            options: sectionFilterOptions,
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

    return (
        <AppLayout
            title="Enrollment"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'Enrollment' },
            ]}
        >
            <Head title="Enrollment" />

            <DataTable
                columns={columns}
                data={enrollments}
                searchable
                searchKeys={['student_name', 'student_number', 'school_year_name', 'section_name']}
                searchPlaceholder="Search enrollments..."
                filters={filters}
                onAdd={openCreate}
                addLabel="Enroll Student"
            />

            <FormModal
                open={modalOpen}
                onClose={closeModal}
                title={editing ? 'Edit Enrollment' : 'Enroll Student'}
                description={editing ? 'Update enrollment details.' : 'Select student, school year, and section.'}
                onSubmit={handleSubmit}
                processing={form.processing}
                submitLabel={editing ? 'Update' : 'Enroll'}
            >
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="student_id">Student</Label>
                        <SearchableSelect
                            id="student_id"
                            options={students}
                            value={form.data.student_id}
                            onChange={(v) => form.setData('student_id', v)}
                            placeholder="Select student..."
                            searchPlaceholder="Search by name or ID..."
                        />
                        {form.errors.student_id && <p className="text-xs text-destructive">{form.errors.student_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="school_year_id">School Year</Label>
                        <Select
                            value={form.data.school_year_id}
                            onValueChange={(v) => form.setData('school_year_id', v)}
                        >
                            <SelectTrigger id="school_year_id">
                                <SelectValue placeholder="Select school year..." />
                            </SelectTrigger>
                            <SelectContent>
                                {schoolYears.map((sy) => (
                                    <SelectItem key={sy.value} value={sy.value}>
                                        {sy.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.errors.school_year_id && <p className="text-xs text-destructive">{form.errors.school_year_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="year_level_id">Year Level</Label>
                        <Select
                            value={form.data.year_level_id}
                            onValueChange={(v) => {
                                form.setData((prev) => ({
                                    ...prev,
                                    year_level_id: v,
                                    section_id: '',
                                }));
                            }}
                        >
                            <SelectTrigger id="year_level_id">
                                <SelectValue placeholder="Select year level..." />
                            </SelectTrigger>
                            <SelectContent>
                                {yearLevels.map((yl) => (
                                    <SelectItem key={yl.value} value={yl.value}>
                                        {yl.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.errors.year_level_id && <p className="text-xs text-destructive">{form.errors.year_level_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="section_id">Section</Label>
                        <Select
                            value={form.data.section_id}
                            onValueChange={(v) => form.setData('section_id', v)}
                        >
                            <SelectTrigger id="section_id">
                                <SelectValue placeholder="Select section..." />
                            </SelectTrigger>
                            <SelectContent>
                                {sections
                                    .filter((s) =>
                                        !form.data.year_level_id || s.year_level_id === form.data.year_level_id
                                    )
                                    .map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        {form.errors.section_id && <p className="text-xs text-destructive">{form.errors.section_id}</p>}
                    </div>

                    {editing && (
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={form.data.status}
                                onValueChange={(v) => form.setData('status', v as Enrollment['status'])}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="enrolled">Enrolled</SelectItem>
                                    <SelectItem value="dropped">Dropped</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Input
                            id="remarks"
                            value={form.data.remarks}
                            onChange={(e) => form.setData('remarks', e.target.value)}
                            placeholder="Optional notes..."
                        />
                    </div>
                </div>
            </FormModal>

            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Remove Enrollment"
                description={`Are you sure you want to remove the enrollment of "${deleteTarget?.student_name}" from ${deleteTarget?.section_name}?`}
                confirmLabel="Remove"
                variant="destructive"
            />
        </AppLayout>
    );
}
