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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { SchoolYear, User } from '@/types';

type PageProps = {
    auth: { user: User };
    schoolYears: SchoolYear[];
};

export default function SchoolYearIndex() {
    const { auth, schoolYears } = usePage<PageProps>().props;
    const user = auth.user;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<SchoolYear | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SchoolYear | null>(null);

    const form = useForm({
        name: '',
        start_date: '',
        end_date: '',
        status: 'inactive' as 'active' | 'inactive',
    });

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (sy: SchoolYear) => {
        setEditing(sy);
        form.setData({
            name: sy.name,
            start_date: sy.start_date.split('T')[0],
            end_date: sy.end_date.split('T')[0],
            status: sy.status,
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
            form.put(`/admin/school-years/${editing.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else {
            form.post('/admin/school-years', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/admin/school-years/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const columns: Column<SchoolYear>[] = [
        {
            key: '#',
            label: '#',
            className: 'w-12',
            render: (_item, index) => index + 1,
        },
        {
            key: 'name',
            label: 'Name',
        },
        {
            key: 'start_date',
            label: 'Start Date',
            render: (item) => new Date(item.start_date).toLocaleDateString(),
        },
        {
            key: 'end_date',
            label: 'End Date',
            render: (item) => new Date(item.end_date).toLocaleDateString(),
        },
        {
            key: 'status',
            label: 'Status',
            render: (item) => (
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                    {item.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
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

    return (
        <AppLayout
            title="School Years"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'School Years' },
            ]}
        >
            <Head title="School Years" />

            <DataTable
                columns={columns}
                data={schoolYears}
                searchable
                searchKeys={['name']}
                searchPlaceholder="Search school years..."
                filters={[
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { label: 'Active', value: 'active' },
                            { label: 'Inactive', value: 'inactive' },
                        ],
                    },
                ] satisfies Filter<SchoolYear>[]}
                onAdd={openCreate}
                addLabel="Add School Year"
                emptyMessage="No school years found."
            />

            {/* Create / Edit Modal */}
            <FormModal
                open={modalOpen}
                onClose={closeModal}
                title={editing ? 'Edit School Year' : 'Add School Year'}
                description={editing ? 'Update the school year details.' : 'Create a new school year.'}
                onSubmit={handleSubmit}
                processing={form.processing}
                submitLabel={editing ? 'Update' : 'Create'}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. 2025-2026"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                        />
                        {form.errors.name && (
                            <p className="text-sm text-destructive">{form.errors.name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={form.data.start_date}
                                onChange={(e) => form.setData('start_date', e.target.value)}
                            />
                            {form.errors.start_date && (
                                <p className="text-sm text-destructive">{form.errors.start_date}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_date">End Date</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={form.data.end_date}
                                onChange={(e) => form.setData('end_date', e.target.value)}
                            />
                            {form.errors.end_date && (
                                <p className="text-sm text-destructive">{form.errors.end_date}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={form.data.status}
                            onValueChange={(v) => form.setData('status', v as 'active' | 'inactive')}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        {form.errors.status && (
                            <p className="text-sm text-destructive">{form.errors.status}</p>
                        )}
                    </div>
                </div>
            </FormModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete School Year"
                description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
            />
        </AppLayout>
    );
}
