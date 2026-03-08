import type { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FormModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    processing?: boolean;
    submitLabel?: string;
    className?: string;
}

export default function FormModal({
    open,
    onClose,
    title,
    description,
    children,
    onSubmit,
    processing = false,
    submitLabel = 'Save',
    className,
}: FormModalProps) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className={className}>
                <form onSubmit={onSubmit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {description && (
                            <DialogDescription>{description}</DialogDescription>
                        )}
                    </DialogHeader>

                    <div className="space-y-4">{children}</div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : submitLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
