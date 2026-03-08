import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

type FlashType = 'success' | 'error' | 'info' | 'warning';

export default function FlashAlerts() {
    const { flash } = usePage<{ flash?: Partial<Record<FlashType, string>> }>().props;
    const lastFlashRef = useRef<string | null>(null);

    useEffect(() => {
        if (!flash) return;

        // Build a fingerprint to avoid duplicate toasts on re-renders
        const fingerprint = JSON.stringify(flash);
        if (fingerprint === lastFlashRef.current || fingerprint === '{}') return;
        lastFlashRef.current = fingerprint;

        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
        if (flash.info) toast.info(flash.info);
        if (flash.warning) toast.warning(flash.warning);
    }, [flash]);

    return null;
}
