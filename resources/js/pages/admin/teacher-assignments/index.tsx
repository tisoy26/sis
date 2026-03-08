import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from '@/components/confirm-modal';
import DataTable, { type Column, type Filter } from '@/components/data-table';
import FormModal from '@/components/form-modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { SelectOption, SubjectOption, TeacherAssignment, User } from '@/types';

type PageProps = {
    auth: { user: User };
    assignments: TeacherAssignment[];
    schoolYears: SelectOption[];
    teachers: SelectOption[];
    sections: (SelectOption & { year_level_name?: string | null })[];
    subjects: SubjectOption[];
};

export default function TeacherAssignmentIndex() {
    const { auth, assignments, schoolYears, teachers, sections, subjects } =
        usePage<PageProps>().props;
    const user = auth.user;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<TeacherAssignment | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TeacherAssignment | null>(null);

    const form = useForm({
        school_year_id: '',
        teacher_id: '',
        section_id: '',
        subject_id: '',
    });

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (assignment: TeacherAssignment) => {
        setEditing(assignment);
        form.setData({
            school_year_id: String(assignment.school_year_id),
            teacher_id: String(assignment.teacher_id),
            section_id: String(assignment.section_id),
            subject_id: String(assignment.subject_id),
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
            form.put(`/admin/teacher-assignments/${editing.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else {
            form.post('/admin/teacher-assignments', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/admin/teacher-assignments/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const columns: Column<TeacherAssignment>[] = [
        {
            key: '#',
            label: '#',
            className: 'w-12',
            render: (_item, index) => index + 1,
        },
        {
            key: 'school_year_name',
            label: 'School Year',
        },
        {
            key: 'teacher_name',
            label: 'Teacher',
        },
        {
            key: 'section_name',
            label: 'Section',
        },
        {
            key: 'subject',
            label: 'Subject',
            render: (item) => (
                <span>
                    <span className="font-medium">{item.subject_code}</span>
                    <span className="text-muted-foreground"> — {item.subject_name}</span>
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'w-24',
            render: (item) => (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(item)}
                    >
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

    // Build filter options from the data
    const schoolYearFilterOptions = schoolYears.map((sy) => ({
        label: sy.name,
        value: String(sy.id),
    }));
    const teacherFilterOptions = teachers.map((t) => ({
        label: t.name,
        value: String(t.id),
    }));
    const sectionFilterOptions = sections.map((s) => ({
        label: s.year_level_name ? `${s.name} — ${s.year_level_name}` : s.name,
        value: String(s.id),
    }));

    return (
        <AppLayout
            title="Teacher Assignments"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'Teacher Assignments' },
            ]}
        >
            <Head title="Teacher Assignments" />

            <DataTable
                columns={columns}
                data={assignments}
                searchable
                searchKeys={['teacher_name', 'section_name', 'subject_name', 'subject_code', 'school_year_name']}
                searchPlaceholder="Search assignments..."
                filters={[
                    {
                        key: 'school_year_id' as keyof TeacherAssignment,
                        label: 'School Year',
                        options: schoolYearFilterOptions,
                    },
                    {
                        key: 'teacher_id' as keyof TeacherAssignment,
                        label: 'Teacher',
                        options: teacherFilterOptions,
                    },
                    {
                        key: 'section_id' as keyof TeacherAssignment,
                        label: 'Section',
                        options: sectionFilterOptions,
                    },
                ]}
                onAdd={openCreate}
                addLabel="Add Assignment"
                emptyMessage="No assignments found."
            />

            {/* Create / Edit Modal */}
            <FormModal
                open={modalOpen}
                onClose={closeModal}
                title={editing ? 'Edit Assignment' : 'Add Assignment'}
                description={editing ? 'Update the assignment details.' : 'Assign a teacher to a section and subject.'}
                onSubmit={handleSubmit}
                processing={form.processing}
                submitLabel={editing ? 'Update' : 'Create'}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="school_year_id">School Year</Label>
                        <Select
                            value={form.data.school_year_id}
                            onValueChange={(v) => form.setData('school_year_id', v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select school year" />
                            </SelectTrigger>
                            <SelectContent>
                                {schoolYears.map((sy) => (
                                    <SelectItem key={sy.id} value={String(sy.id)}>
                                        {sy.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.errors.school_year_id && (
                            <p className="text-sm text-destructive">{form.errors.school_year_id}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="teacher_id">Teacher</Label>
                        <Select
                            value={form.data.teacher_id}
                            onValueChange={(v) => form.setData('teacher_id', v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                            <SelectContent>
                                {teachers.map((t) => (
                                    <SelectItem key={t.id} value={String(t.id)}>
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.errors.teacher_id && (
                            <p className="text-sm text-destructive">{form.errors.teacher_id}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="section_id">Section</Label>
                            <Select
                                value={form.data.section_id}
                                onValueChange={(v) => form.setData('section_id', v)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.errors.section_id && (
                                <p className="text-sm text-destructive">{form.errors.section_id}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject_id">Subject</Label>
                            <Select
                                value={form.data.subject_id}
                                onValueChange={(v) => form.setData('subject_id', v)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.code} — {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.errors.subject_id && (
                                <p className="text-sm text-destructive">{form.errors.subject_id}</p>
                            )}
                        </div>
                    </div>
                </div>
            </FormModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Assignment"
                description={`Are you sure you want to remove ${deleteTarget?.teacher_name} from ${deleteTarget?.subject_code} — ${deleteTarget?.section_name}?`}
                confirmLabel="Delete"
            />
        </AppLayout>
    );
}
