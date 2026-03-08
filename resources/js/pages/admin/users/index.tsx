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
import type { User } from '@/types';

type PageProps = {
    auth: { user: User };
    users: User[];
};

const typeColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    admin: 'destructive',
    staff: 'default',
    teacher: 'secondary',
};

export default function UserIndex() {
    const { auth, users } = usePage<PageProps>().props;
    const currentUser = auth.user;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

    const form = useForm({
        first_name: '',
        last_name: '',
        username: '',
        type: 'staff' as 'admin' | 'staff' | 'teacher',
        password: '',
        password_confirmation: '',
    });

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (user: User) => {
        setEditing(user);
        form.setData({
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            type: user.type,
            password: '',
            password_confirmation: '',
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
            form.put(`/admin/users/${editing.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else {
            form.post('/admin/users', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/admin/users/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const columns: Column<User>[] = [
        {
            key: '#',
            label: '#',
            className: 'w-12',
            render: (_item, index) => index + 1,
        },
        {
            key: 'full_name',
            label: 'Name',
        },
        {
            key: 'username',
            label: 'Username',
            render: (item) => <span className="text-muted-foreground">@{item.username}</span>,
        },
        {
            key: 'type',
            label: 'Role',
            render: (item) => (
                <Badge variant={typeColors[item.type] ?? 'secondary'} className="capitalize">
                    {item.type}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            label: 'Created',
            render: (item) => new Date(item.created_at).toLocaleDateString(),
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
                        disabled={item.id === currentUser.id}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppLayout
            title="Users"
            breadcrumbs={[
                { label: 'Home', href: `/${currentUser.type}/dashboard` },
                { label: 'Users' },
            ]}
        >
            <Head title="Users" />

            <DataTable
                columns={columns}
                data={users}
                searchable
                searchKeys={['first_name', 'last_name', 'username', 'full_name']}
                searchPlaceholder="Search users..."
                filters={[
                    {
                        key: 'type',
                        label: 'Role',
                        options: [
                            { label: 'Admin', value: 'admin' },
                            { label: 'Staff', value: 'staff' },
                            { label: 'Teacher', value: 'teacher' },
                        ],
                    },
                ] satisfies Filter<User>[]}
                onAdd={openCreate}
                addLabel="Add User"
                emptyMessage="No users found."
            />

            {/* Create / Edit Modal */}
            <FormModal
                open={modalOpen}
                onClose={closeModal}
                title={editing ? 'Edit User' : 'Add User'}
                description={editing ? 'Update the user details.' : 'Create a new user account.'}
                onSubmit={handleSubmit}
                processing={form.processing}
                submitLabel={editing ? 'Update' : 'Create'}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input
                                id="first_name"
                                placeholder="John"
                                value={form.data.first_name}
                                onChange={(e) => form.setData('first_name', e.target.value)}
                            />
                            {form.errors.first_name && (
                                <p className="text-sm text-destructive">{form.errors.first_name}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input
                                id="last_name"
                                placeholder="Doe"
                                value={form.data.last_name}
                                onChange={(e) => form.setData('last_name', e.target.value)}
                            />
                            {form.errors.last_name && (
                                <p className="text-sm text-destructive">{form.errors.last_name}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                placeholder="johndoe"
                                value={form.data.username}
                                onChange={(e) => form.setData('username', e.target.value)}
                            />
                            {form.errors.username && (
                                <p className="text-sm text-destructive">{form.errors.username}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Role</Label>
                            <Select
                                value={form.data.type}
                                onValueChange={(v) => form.setData('type', v as 'admin' | 'staff' | 'teacher')}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                </SelectContent>
                            </Select>
                            {form.errors.type && (
                                <p className="text-sm text-destructive">{form.errors.type}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                Password {editing && <span className="text-xs text-muted-foreground">(leave blank to keep)</span>}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={editing ? '••••••••' : 'Min 8 characters'}
                                value={form.data.password}
                                onChange={(e) => form.setData('password', e.target.value)}
                            />
                            {form.errors.password && (
                                <p className="text-sm text-destructive">{form.errors.password}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                placeholder="Confirm password"
                                value={form.data.password_confirmation}
                                onChange={(e) => form.setData('password_confirmation', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </FormModal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete User"
                description={`Are you sure you want to delete "${deleteTarget?.full_name}"? This action cannot be undone.`}
                confirmLabel="Delete"
            />
        </AppLayout>
    );
}
