import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from '@/components/confirm-modal';
import DataTable, { type Column, type Filter } from '@/components/data-table';
import FormModal from '@/components/form-modal';
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
import type { Schedule, ScheduleAssignmentOption, User } from '@/types';

const DAYS = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
];

function formatTime(time: string) {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

function capitalizeFirst(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

type PageProps = {
    auth: { user: User };
    schedules: Schedule[];
    teacherAssignments: ScheduleAssignmentOption[];
};

export default function ScheduleIndex() {
    const { auth, schedules, teacherAssignments } = usePage<PageProps>().props;
    const user = auth.user;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Schedule | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);

    const form = useForm({
        teacher_assignment_id: '',
        day_of_week: '',
        start_time: '',
        end_time: '',
    });

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (schedule: Schedule) => {
        setEditing(schedule);
        form.setData({
            teacher_assignment_id: String(schedule.teacher_assignment_id),
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
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
            form.put(`/admin/schedules/${editing.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else {
            form.post('/admin/schedules', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/admin/schedules/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const columns: Column<Schedule>[] = [
        {
            key: '#',
            label: '#',
            className: 'w-12',
            render: (_item, index) => index + 1,
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
            key: 'section_name',
            label: 'Section',
            render: (item) => (
                <span>
                    <span className="font-medium">{item.section_name}</span>
                    {item.year_level_name && (
                        <span className="text-muted-foreground"> — {item.year_level_name}</span>
                    )}
                </span>
            ),
        },
        {
            key: 'teacher_name',
            label: 'Teacher',
        },
        {
            key: 'day_of_week',
            label: 'Day',
            render: (item) => capitalizeFirst(item.day_of_week),
        },
        {
            key: 'time',
            label: 'Time',
            render: (item) => `${formatTime(item.start_time)} – ${formatTime(item.end_time)}`,
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

    const dayFilterOptions = DAYS.map((d) => ({ label: d.label, value: d.value }));
    const sectionFilterOptions = [...new Set(schedules.map((s) => s.section_name))].map((name) => ({
        label: name,
        value: name,
    }));

    return (
        <AppLayout
            title="Schedules"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'Schedules' },
            ]}
        >
            <Head title="Schedules" />

            <DataTable
                columns={columns}
                data={schedules}
                searchable
                searchKeys={['subject_name', 'subject_code', 'section_name', 'teacher_name', 'year_level_name']}
                searchPlaceholder="Search schedules..."
                filters={[
                    {
                        key: 'day_of_week' as keyof Schedule,
                        label: 'Day',
                        options: dayFilterOptions,
                    },
                    {
                        key: 'section_name' as keyof Schedule,
                        label: 'Section',
                        options: sectionFilterOptions,
                    },
                ]}
                onAdd={openCreate}
                addLabel="Add Schedule"
                emptyMessage="No schedules found."
            />

            {/* Create / Edit Modal */}
            <FormModal
                open={modalOpen}
                onClose={closeModal}
                title={editing ? 'Edit Schedule' : 'Add Schedule'}
                description={editing ? 'Update the schedule details.' : 'Create a new class schedule entry.'}
                onSubmit={handleSubmit}
                processing={form.processing}
                submitLabel={editing ? 'Update' : 'Create'}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="teacher_assignment_id">Class (Subject — Section — Teacher)</Label>
                        <SearchableSelect
                            id="teacher_assignment_id"
                            options={teacherAssignments.map((a) => ({ value: String(a.id), label: a.label }))}
                            value={form.data.teacher_assignment_id}
                            onChange={(v) => form.setData('teacher_assignment_id', v)}
                            placeholder="Select class assignment"
                            searchPlaceholder="Search subject, section, or teacher..."
                        />
                        {form.errors.teacher_assignment_id && (
                            <p className="text-sm text-destructive">{form.errors.teacher_assignment_id}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="day_of_week">Day of Week</Label>
                        <Select
                            value={form.data.day_of_week}
                            onValueChange={(v) => form.setData('day_of_week', v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                            <SelectContent>
                                {DAYS.map((d) => (
                                    <SelectItem key={d.value} value={d.value}>
                                        {d.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.errors.day_of_week && (
                            <p className="text-sm text-destructive">{form.errors.day_of_week}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_time">Start Time</Label>
                            <Input
                                id="start_time"
                                type="time"
                                value={form.data.start_time}
                                onChange={(e) => form.setData('start_time', e.target.value)}
                            />
                            {form.errors.start_time && (
                                <p className="text-sm text-destructive">{form.errors.start_time}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_time">End Time</Label>
                            <Input
                                id="end_time"
                                type="time"
                                value={form.data.end_time}
                                onChange={(e) => form.setData('end_time', e.target.value)}
                            />
                            {form.errors.end_time && (
                                <p className="text-sm text-destructive">{form.errors.end_time}</p>
                            )}
                        </div>
                    </div>
                </div>
            </FormModal>

            {/* Delete Confirmation */}
            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Schedule"
                description="Are you sure you want to delete this schedule entry? This action cannot be undone."
            />
        </AppLayout>
    );
}
