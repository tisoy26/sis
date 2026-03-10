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
import type { Event, User } from '@/types';

type PageProps = {
    auth: { user: User };
    events: Event[];
};

interface ImagePreview {
    id?: number;
    url: string;
    file?: File;
}

export default function EventIndex() {
    const { auth, events } = usePage<PageProps>().props;
    const user = auth.user;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Event | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);
    const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<{
        title: string;
        body: string;
        event_date: string;
        location: string;
        status: 'published' | 'draft';
    }>({
        title: '',
        body: '',
        event_date: '',
        location: '',
        status: 'draft',
    });

    const [newFiles, setNewFiles] = useState<File[]>([]);

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setImagePreviews([]);
        setNewFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setModalOpen(true);
    };

    const openEdit = (event: Event) => {
        setEditing(event);
        form.setData({
            title: event.title,
            body: event.body,
            event_date: event.event_date ?? '',
            location: event.location ?? '',
            status: event.status,
        });
        setImagePreviews(event.images.map((img) => ({ id: img.id, url: img.url })));
        setNewFiles([]);
        form.clearErrors();
        if (fileInputRef.current) fileInputRef.current.value = '';
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setImagePreviews([]);
        setNewFiles([]);
        form.reset();
        form.clearErrors();
    };

    const addFiles = (files: FileList | File[]) => {
        const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
        const newPreviews: ImagePreview[] = [];
        fileArray.forEach((file) => {
            const url = URL.createObjectURL(file);
            newPreviews.push({ url, file });
        });
        setImagePreviews((prev) => [...prev, ...newPreviews]);
        setNewFiles((prev) => [...prev, ...fileArray]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(e.target.files);
            e.target.value = '';
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length) {
            addFiles(e.dataTransfer.files);
        }
    }, []);

    const removePreview = (index: number) => {
        const preview = imagePreviews[index];
        if (preview.id && editing) {
            // Delete existing image from server
            router.delete(`/admin/events/${editing.id}/images/${preview.id}`, {
                preserveScroll: true,
            });
        }
        if (preview.file) {
            setNewFiles((prev) => prev.filter((f) => f !== preview.file));
        }
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('title', form.data.title);
        formData.append('body', form.data.body);
        formData.append('event_date', form.data.event_date);
        formData.append('location', form.data.location);
        formData.append('status', form.data.status);

        newFiles.forEach((file) => {
            formData.append('images[]', file);
        });

        if (editing) {
            formData.append('_method', 'PUT');
            router.post(`/admin/events/${editing.id}`, formData, {
                onSuccess: () => closeModal(),
                onError: (errors) => {
                    Object.entries(errors).forEach(([key, value]) => {
                        form.setError(key as keyof typeof form.data, value as string);
                    });
                },
                preserveScroll: true,
            });
        } else {
            router.post('/admin/events', formData, {
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
        router.delete(`/admin/events/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const columns: Column<Event>[] = [
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
            key: 'images',
            label: 'Images',
            className: 'w-24',
            render: (item) =>
                item.images.length > 0 ? (
                    <div className="flex -space-x-2">
                        {item.images.slice(0, 3).map((img) => (
                            <img
                                key={img.id}
                                src={img.url}
                                alt=""
                                className="size-8 rounded-md border-2 border-background object-cover"
                            />
                        ))}
                        {item.images.length > 3 && (
                            <span className="flex size-8 items-center justify-center rounded-md border-2 border-background bg-muted text-xs">
                                +{item.images.length - 3}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                ),
        },
        {
            key: 'event_date',
            label: 'Date',
            render: (item) =>
                item.event_date
                    ? new Date(item.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—',
        },
        {
            key: 'location',
            label: 'Location',
            render: (item) => item.location || '—',
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
            title="Events"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'Events' },
            ]}
        >
            <Head title="Events" />

            <DataTable
                columns={columns}
                data={events}
                searchable
                searchKeys={['title', 'body', 'location']}
                searchPlaceholder="Search events..."
                filters={[
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { label: 'Published', value: 'published' },
                            { label: 'Draft', value: 'draft' },
                        ],
                    },
                ] satisfies Filter<Event>[]}
                onAdd={openCreate}
                addLabel="Add Event"
                emptyMessage="No events found."
            />

            {/* Create / Edit Modal */}
            <FormModal
                open={modalOpen}
                onClose={closeModal}
                title={editing ? 'Edit Event' : 'Add Event'}
                description={editing ? 'Update the event details.' : 'Create a new event.'}
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
                            placeholder="Event title"
                            value={form.data.title}
                            onChange={(e) => form.setData('title', e.target.value)}
                        />
                        {form.errors.title && (
                            <p className="text-sm text-destructive">{form.errors.title}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="body">Description</Label>
                        <textarea
                            id="body"
                            rows={4}
                            placeholder="Event description..."
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            value={form.data.body}
                            onChange={(e) => form.setData('body', e.target.value)}
                        />
                        {form.errors.body && (
                            <p className="text-sm text-destructive">{form.errors.body}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="event_date">Event Date</Label>
                            <Input
                                id="event_date"
                                type="date"
                                value={form.data.event_date}
                                onChange={(e) => form.setData('event_date', e.target.value)}
                            />
                            {form.errors.event_date && (
                                <p className="text-sm text-destructive">{form.errors.event_date}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                placeholder="e.g. School Gym"
                                value={form.data.location}
                                onChange={(e) => form.setData('location', e.target.value)}
                            />
                            {form.errors.location && (
                                <p className="text-sm text-destructive">{form.errors.location}</p>
                            )}
                        </div>
                    </div>

                    {/* Multi-image drop zone */}
                    <div className="space-y-2">
                        <Label>Images (optional, up to 10)</Label>
                        <div
                            className={`relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
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
                                multiple
                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {imagePreviews.length > 0 ? (
                                <div
                                    className="grid w-full grid-cols-3 gap-2 p-3"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="group relative">
                                            <img
                                                src={preview.url}
                                                alt={`Preview ${index + 1}`}
                                                className="h-24 w-full rounded-md object-cover"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute right-1 top-1 size-5 opacity-0 transition-opacity group-hover:opacity-100"
                                                onClick={() => removePreview(index)}
                                            >
                                                <X className="size-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-muted-foreground/50"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <span className="text-2xl">+</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 p-6 text-muted-foreground">
                                    <ImageIcon className="size-8" />
                                    <p className="text-sm font-medium">Drag & drop images here</p>
                                    <p className="text-xs">or click to browse (JPEG, PNG, WebP, max 2MB each)</p>
                                </div>
                            )}
                        </div>
                        {(form.errors as Record<string, string>).images && (
                            <p className="text-sm text-destructive">{(form.errors as Record<string, string>).images}</p>
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
                title="Delete Event"
                description={`Are you sure you want to delete "${deleteTarget?.title}"? This will also remove all associated images. This action cannot be undone.`}
                confirmLabel="Delete"
            />
        </AppLayout>
    );
}
