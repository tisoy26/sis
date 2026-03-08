import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    processing?: boolean;
    variant?: 'default' | 'destructive';
}

export default function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    description = 'This action cannot be undone.',
    confirmLabel = 'Confirm',
    processing = false,
    variant = 'destructive',
}: ConfirmModalProps) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant={variant}
                        onClick={onConfirm}
                        disabled={processing}
                    >
                        {processing ? 'Processing...' : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
