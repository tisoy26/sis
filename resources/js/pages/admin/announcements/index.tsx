import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ImageIcon, Pencil, Trash2, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
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
import type { Announcement, User } from '@/types';

type PageProps = {
    auth: { user: User };
    announcements: Announcement[];
};

export default function AnnouncementIndex() {
    const { auth, announcements } = usePage<PageProps>().props;
    const user = auth.user;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Announcement | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<{
        title: string;
        body: string;
        image: File | null;
        status: 'published' | 'draft';
    }>({
        title: '',
        body: '',
        image: null,
        status: 'draft',
    });

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setModalOpen(true);
    };

    const openEdit = (announcement: Announcement) => {
        setEditing(announcement);
        form.setData({
            title: announcement.title,
            body: announcement.body,
            image: null,
            status: announcement.status,
        });
        setImagePreview(announcement.image_url);
        form.clearErrors();
        if (fileInputRef.current) fileInputRef.current.value = '';
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setImagePreview(null);
        form.reset();
        form.clearErrors();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        applyImage(file);
    };

    const applyImage = (file: File | null) => {
        form.setData('image', file);
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(editing?.image_url ?? null);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            applyImage(file);
        }
    }, [editing]);

    const removeImage = () => {
        form.setData('image', null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('title', form.data.title);
        formData.append('body', form.data.body);
        formData.append('status', form.data.status);
        if (form.data.image) {
            formData.append('image', form.data.image);
        }

        if (editing) {
            formData.append('_method', 'PUT');
            router.post(`/admin/announcements/${editing.id}`, formData, {
                onSuccess: () => closeModal(),
                onError: (errors) => {
                    Object.entries(errors).forEach(([key, value]) => {
                        form.setError(key as keyof typeof form.data, value as string);
                    });
                },
                preserveScroll: true,
            });
        } else {
            router.post('/admin/announcements', formData, {
                onSuccess: () => closeModal(),
                onError: (errors) => {
                    Object.entries(errors).forEach(([key, value]) => {
                        form.setError(key as keyof typeof form.data, value as string);
                    });
                },
                preserveScroll: true,
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/admin/announcements/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const columns: Column<Announcement>[] = [
        {
            key: '#',
            label: '#',
            className: 'w-12',
            render: (_item, index) => index + 1,
        },
        {
            key: 'title',
            label: 'Title',
            render: (item) => (
                <div className="max-w-xs">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.body}</p>
                </div>
            ),
        },
        {
            key: 'image',
            label: 'Image',
            className: 'w-20',
            render: (item) =>
                item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.title}
                        className="size-10 rounded-md object-cover"
                    />
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (item) => (
                <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                    {item.status === 'published' ? 'Published' : 'Draft'}
                </Badge>
            ),
        },
        {
            key: 'created_by_name',
            label: 'Author',
        },
        {
            key: 'published_at',
            label: 'Published',
            render: (item) =>
                item.published_at
                    ? new Date(item.published_at).toLocaleDateString()
                    : '—',
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
            title="Announcements"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'Announcements' },
            ]}
        >
            <Head title="Announcements" />

            <DataTable
                columns={columns}
                data={announcements}
                searchable
                searchKeys={['title', 'body']}
                searchPlaceholder="Search announcements..."
                filters={[
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { label: 'Published', value: 'published' },
                            { label: 'Draft', value: 'draft' },
                        ],
                    },
                ] satisfies Filter<Announcement>[]}
                onAdd={openCreate}
                addLabel="Add Announcement"
                emptyMessage="No announcements found."
            />

            {/* Create / Edit Modal */}
            <FormModal
                open={modalOpen}
                onClose={closeModal}
                title={editing ? 'Edit Announcement' : 'Add Announcement'}
                description={editing ? 'Update the announcement details.' : 'Create a new announcement.'}
                onSubmit={handleSubmit}
                processing={form.processing}
                submitLabel={editing ? 'Update' : 'Create'}
                className="sm:max-w-lg"
            >
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="Announcement title"
                            value={form.data.title}
                            onChange={(e) => form.setData('title', e.target.value)}
                        />
                        {form.errors.title && (
                            <p className="text-sm text-destructive">{form.errors.title}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="body">Body</Label>
                        <textarea
                            id="body"
                            rows={4}
                            placeholder="Announcement content..."
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            value={form.data.body}
                            onChange={(e) => form.setData('body', e.target.value)}
                        />
                        {form.errors.body && (
                            <p className="text-sm text-destructive">{form.errors.body}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Image (optional)</Label>
                        <div
                            className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                                dragging
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            {imagePreview ? (
                                <>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="max-h-[200px] rounded-md object-contain p-2"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute right-2 top-2 size-6"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeImage();
                                        }}
                                    >
                                        <X className="size-3" />
                                    </Button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-2 p-6 text-muted-foreground">
                                    <ImageIcon className="size-8" />
                                    <p className="text-sm font-medium">Drag & drop an image here</p>
                                    <p className="text-xs">or click to browse (JPEG, PNG, WebP, max 2MB)</p>
                                </div>
                            )}
                        </div>
                        {form.errors.image && (
                            <p className="text-sm text-destructive">{form.errors.image}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={form.data.status}
                            onValueChange={(v) => form.setData('status', v as 'published' | 'draft')}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
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
                title="Delete Announcement"
                description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
            />
        </AppLayout>
    );
}
