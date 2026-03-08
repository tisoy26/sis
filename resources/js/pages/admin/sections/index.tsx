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
import type { Section, User } from '@/types';

type DropdownOption = { value: string; label: string };

type PageProps = {
    auth: { user: User };
    sections: Section[];
    yearLevels: DropdownOption[];
};

export default function SectionIndex() {
    const { auth, sections, yearLevels } = usePage<PageProps>().props;
    const user = auth.user;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Section | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);

    const form = useForm({
        name: '',
        year_level_id: '' as string,
        status: 'active' as 'active' | 'inactive',
    });

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (section: Section) => {
        setEditing(section);
        form.setData({
            name: section.name,
            year_level_id: section.year_level_id ? String(section.year_level_id) : '',
            status: section.status,
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
            form.put(`/admin/sections/${editing.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else {
            form.post('/admin/sections', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/admin/sections/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const columns: Column<Section>[] = [
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
            key: 'year_level_name',
            label: 'Year Level',
            render: (item) => item.year_level_name ?? <span className="text-muted-foreground">—</span>,
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
            title="Sections"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'Sections' },
            ]}
        >
            <Head title="Sections" />

            <DataTable
                columns={columns}
                data={sections}
                searchable
                searchKeys={['name']}
                searchPlaceholder="Search sections..."
                filters={[
                    {
                        key: 'year_level_id' as keyof Section,
                        label: 'Year Level',
                        options: yearLevels.map((yl) => ({
                            label: yl.label,
                            value: yl.value,
                        })),
                    },
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { label: 'Active', value: 'active' },
                            { label: 'Inactive', value: 'inactive' },
                        ],
                    },
                ] satisfies Filter<Section>[]}
                onAdd={openCreate}
                addLabel="Add Section"
                emptyMessage="No sections found."
            />

            {/* Create / Edit Modal */}
            <FormModal
                open={modalOpen}
                onClose={closeModal}
                title={editing ? 'Edit Section' : 'Add Section'}
                description={editing ? 'Update the section details.' : 'Create a new section.'}
                onSubmit={handleSubmit}
                processing={form.processing}
                submitLabel={editing ? 'Update' : 'Create'}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Section A"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                        />
                        {form.errors.name && (
                            <p className="text-sm text-destructive">{form.errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="year_level_id">Year Level</Label>
                        <Select
                            value={form.data.year_level_id}
                            onValueChange={(v) => form.setData('year_level_id', v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select year level (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {yearLevels.map((yl) => (
                                    <SelectItem key={yl.value} value={yl.value}>
                                        {yl.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.errors.year_level_id && (
                            <p className="text-sm text-destructive">{form.errors.year_level_id}</p>
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
                title="Delete Section"
                description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
            />
        </AppLayout>
    );
}
