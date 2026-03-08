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
import type { Subject, User } from '@/types';

type PageProps = {
    auth: { user: User };
    subjects: Subject[];
};

export default function SubjectIndex() {
    const { auth, subjects } = usePage<PageProps>().props;
    const user = auth.user;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Subject | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

    const form = useForm({
        code: '',
        name: '',
        description: '',
        status: 'active' as 'active' | 'inactive',
    });

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (subject: Subject) => {
        setEditing(subject);
        form.setData({
            code: subject.code,
            name: subject.name,
            description: subject.description ?? '',
            status: subject.status,
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
            form.put(`/admin/subjects/${editing.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else {
            form.post('/admin/subjects', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/admin/subjects/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const columns: Column<Subject>[] = [
        {
            key: '#',
            label: '#',
            className: 'w-12',
            render: (_item, index) => index + 1,
        },
        {
            key: 'code',
            label: 'Code',
        },
        {
            key: 'name',
            label: 'Name',
        },
        {
            key: 'description',
            label: 'Description',
            render: (item) => (
                <span className="max-w-xs truncate">
                    {item.description || '—'}
                </span>
            ),
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
            title="Subjects"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'Subjects' },
            ]}
        >
            <Head title="Subjects" />

            <DataTable
                columns={columns}
                data={subjects}
                searchable
                searchKeys={['code', 'name']}
                searchPlaceholder="Search subjects..."
                filters={[
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { label: 'Active', value: 'active' },
                            { label: 'Inactive', value: 'inactive' },
                        ],
                    },
                ] satisfies Filter<Subject>[]}
                onAdd={openCreate}
                addLabel="Add Subject"
                emptyMessage="No subjects found."
            />

            {/* Create / Edit Modal */}
            <FormModal
                open={modalOpen}
                onClose={closeModal}
                title={editing ? 'Edit Subject' : 'Add Subject'}
                description={editing ? 'Update the subject details.' : 'Create a new subject.'}
                onSubmit={handleSubmit}
                processing={form.processing}
                submitLabel={editing ? 'Update' : 'Create'}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Code</Label>
                            <Input
                                id="code"
                                placeholder="e.g. MATH101"
                                value={form.data.code}
                                onChange={(e) => form.setData('code', e.target.value)}
                            />
                            {form.errors.code && (
                                <p className="text-sm text-destructive">{form.errors.code}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Mathematics"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                            />
                            {form.errors.name && (
                                <p className="text-sm text-destructive">{form.errors.name}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            placeholder="Optional description"
                            value={form.data.description}
                            onChange={(e) => form.setData('description', e.target.value)}
                        />
                        {form.errors.description && (
                            <p className="text-sm text-destructive">{form.errors.description}</p>
                        )}
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
                title="Delete Subject"
                description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
            />
        </AppLayout>
    );
}
