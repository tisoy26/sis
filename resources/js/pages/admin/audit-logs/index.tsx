import { Head, usePage } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import DataTable, { type Column, type Filter } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { AuditLog, User } from '@/types';

type PageProps = {
    auth: { user: User };
    logs: AuditLog[];
};

const actionColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    created: 'default',
    updated: 'secondary',
    deleted: 'destructive',
};

function ChangesView({ label, data }: { label: string; data: Record<string, unknown> | null }) {
    if (!data || Object.keys(data).length === 0) return null;

    return (
        <div className="space-y-1">
            <p className="text-sm font-medium">{label}</p>
            <div className="rounded-md border bg-muted/50 p-3">
                <pre className="text-xs whitespace-pre-wrap break-all">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    );
}

export default function AuditLogIndex() {
    const { auth, logs } = usePage<PageProps>().props;
    const user = auth.user;

    const [viewing, setViewing] = useState<AuditLog | null>(null);

    const columns: Column<AuditLog>[] = [
        {
            key: '#',
            label: '#',
            className: 'w-12',
            render: (_item, index) => index + 1,
        },
        {
            key: 'created_at',
            label: 'Date',
            render: (item) => new Date(item.created_at).toLocaleString(),
        },
        {
            key: 'user_name',
            label: 'User',
            render: (item) => item.user_name ?? 'System',
        },
        {
            key: 'action',
            label: 'Action',
            render: (item) => (
                <Badge variant={actionColors[item.action]} className="capitalize">
                    {item.action}
                </Badge>
            ),
        },
        {
            key: 'model_label',
            label: 'Module',
        },
        {
            key: 'model_id',
            label: 'Record ID',
            render: (item) => item.model_id ?? '—',
        },
        {
            key: 'ip_address',
            label: 'IP Address',
            render: (item) => (
                <span className="font-mono text-xs">{item.ip_address ?? '—'}</span>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'w-12',
            render: (item) => (
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setViewing(item)}
                >
                    <Eye className="size-4" />
                </Button>
            ),
        },
    ];

    // Unique values for filters
    const actionOptions = [
        { label: 'Created', value: 'created' },
        { label: 'Updated', value: 'updated' },
        { label: 'Deleted', value: 'deleted' },
    ];

    const moduleOptions = [...new Set(logs.map((l) => l.model_label))].sort().map((m) => ({
        label: m,
        value: m,
    }));

    return (
        <AppLayout
            title="Audit Logs"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'Audit Logs' },
            ]}
        >
            <Head title="Audit Logs" />

            <DataTable
                columns={columns}
                data={logs}
                searchable
                searchKeys={['user_name', 'model_label', 'ip_address']}
                searchPlaceholder="Search logs..."
                filters={[
                    {
                        key: 'action',
                        label: 'Action',
                        options: actionOptions,
                    },
                    {
                        key: 'model_label',
                        label: 'Module',
                        options: moduleOptions,
                    },
                ] satisfies Filter<AuditLog>[]}
                emptyMessage="No audit logs found."
            />

            {/* Detail Modal */}
            <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                    </DialogHeader>
                    {viewing && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Date</p>
                                    <p className="font-medium">{new Date(viewing.created_at).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">User</p>
                                    <p className="font-medium">{viewing.user_name ?? 'System'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Action</p>
                                    <Badge variant={actionColors[viewing.action]} className="capitalize">
                                        {viewing.action}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Module</p>
                                    <p className="font-medium">{viewing.model_label}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Record ID</p>
                                    <p className="font-medium">{viewing.model_id ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">IP Address</p>
                                    <p className="font-mono text-xs">{viewing.ip_address ?? '—'}</p>
                                </div>
                            </div>

                            {viewing.action === 'updated' && (
                                <div className="space-y-3">
                                    <ChangesView label="Old Values" data={viewing.old_values} />
                                    <ChangesView label="New Values" data={viewing.new_values} />
                                </div>
                            )}
                            {viewing.action === 'created' && (
                                <ChangesView label="Values" data={viewing.new_values} />
                            )}
                            {viewing.action === 'deleted' && (
                                <ChangesView label="Deleted Values" data={viewing.old_values} />
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
