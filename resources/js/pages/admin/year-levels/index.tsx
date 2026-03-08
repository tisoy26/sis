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
import type { User, YearLevel } from '@/types';

type PageProps = {
    auth: { user: User };
    yearLevels: YearLevel[];
};

const categoryLabels: Record<YearLevel['category'], string> = {
    preschool: 'Pre-School',
    elementary: 'Elementary',
    junior_high: 'Junior High School',
    senior_high: 'Senior High School',
};

const categoryColors: Record<YearLevel['category'], 'default' | 'secondary' | 'outline'> = {
    preschool: 'outline',
    elementary: 'default',
    junior_high: 'secondary',
    senior_high: 'default',
};

export default function YearLevelIndex() {
    const { auth, yearLevels } = usePage<PageProps>().props;
    const user = auth.user;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<YearLevel | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<YearLevel | null>(null);

    const form = useForm({
        name: '',
        category: 'elementary' as YearLevel['category'],
        order: 0,
        status: 'active' as 'active' | 'inactive',
    });

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        // Auto-set order to next available
        const maxOrder = yearLevels.length > 0 ? Math.max(...yearLevels.map((yl) => yl.order)) : 0;
        form.setData('order', maxOrder + 1);
        setModalOpen(true);
    };

    const openEdit = (yearLevel: YearLevel) => {
        setEditing(yearLevel);
        form.setData({
            name: yearLevel.name,
            category: yearLevel.category,
            order: yearLevel.order,
            status: yearLevel.status,
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
            form.put(`/admin/year-levels/${editing.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else {
            form.post('/admin/year-levels', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/admin/year-levels/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const columns: Column<YearLevel>[] = [
        {
            key: '#',
            label: '#',
            className: 'w-12',
            render: (_item, index) => index + 1,
        },
        {
            key: 'order',
            label: 'Order',
            className: 'w-16',
        },
        {
            key: 'name',
            label: 'Name',
        },
        {
            key: 'category',
            label: 'Category',
            render: (item) => (
                <Badge variant={categoryColors[item.category]}>
                    {categoryLabels[item.category]}
                </Badge>
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
            title="Year Levels"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'Year Levels' },
            ]}
        >
            <Head title="Year Levels" />

            <DataTable
                columns={columns}
                data={yearLevels}
                searchable
                searchKeys={['name']}
                searchPlaceholder="Search year levels..."
                filters={[
                    {
                        key: 'category',
                        label: 'Category',
                        options: [
                            { label: 'Pre-School', value: 'preschool' },
                            { label: 'Elementary', value: 'elementary' },
                            { label: 'Junior High School', value: 'junior_high' },
                            { label: 'Senior High School', value: 'senior_high' },
                        ],
                    },
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { label: 'Active', value: 'active' },
                            { label: 'Inactive', value: 'inactive' },
                        ],
                    },
                ] satisfies Filter<YearLevel>[]}
                onAdd={openCreate}
                addLabel="Add Year Level"
                emptyMessage="No year levels found."
            />

            {/* Create / Edit Modal */}
            <FormModal
                open={modalOpen}
                onClose={closeModal}
                title={editing ? 'Edit Year Level' : 'Add Year Level'}
                description={editing ? 'Update the year level details.' : 'Create a new year level.'}
                onSubmit={handleSubmit}
                processing={form.processing}
                submitLabel={editing ? 'Update' : 'Create'}
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Grade 1, Kinder 1"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                        />
                        {form.errors.name && (
                            <p className="text-sm text-destructive">{form.errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={form.data.category}
                            onValueChange={(v) => form.setData('category', v as YearLevel['category'])}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="preschool">Pre-School</SelectItem>
                                <SelectItem value="elementary">Elementary</SelectItem>
                                <SelectItem value="junior_high">Junior High School</SelectItem>
                                <SelectItem value="senior_high">Senior High School</SelectItem>
                            </SelectContent>
                        </Select>
                        {form.errors.category && (
                            <p className="text-sm text-destructive">{form.errors.category}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="order">Sort Order</Label>
                        <Input
                            id="order"
                            type="number"
                            min={0}
                            value={form.data.order}
                            onChange={(e) => form.setData('order', parseInt(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Lower numbers appear first. e.g. Kinder 1 = 1, Grade 1 = 3, Grade 7 = 9.
                        </p>
                        {form.errors.order && (
                            <p className="text-sm text-destructive">{form.errors.order}</p>
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
                title="Delete Year Level"
                description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
            />
        </AppLayout>
    );
}
