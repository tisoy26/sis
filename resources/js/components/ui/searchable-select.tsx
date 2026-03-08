import { ChevronsUpDown, Search, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Option = { value: string; label: string };

type SearchableSelectProps = {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    id?: string;
};

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    disabled = false,
    id,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedLabel = useMemo(
        () => options.find((o) => o.value === value)?.label,
        [options, value],
    );

    const filtered = useMemo(() => {
        if (!search) return options;
        const q = search.toLowerCase();
        return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, search]);

    const handleSelect = useCallback(
        (val: string) => {
            onChange(val);
            setOpen(false);
            setSearch('');
        },
        [onChange],
    );

    const handleClear = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onChange('');
            setSearch('');
        },
        [onChange],
    );

    const handleBlur = useCallback((e: React.FocusEvent) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setOpen(false);
            setSearch('');
        }
    }, []);

    return (
        <div ref={containerRef} className="relative" onBlur={handleBlur}>
            <button
                type="button"
                id={id}
                disabled={disabled}
                className={cn(
                    'border-input bg-background ring-offset-background flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
                    'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    !selectedLabel && 'text-muted-foreground',
                )}
                onClick={() => {
                    setOpen((prev) => !prev);
                    setTimeout(() => inputRef.current?.focus(), 0);
                }}
            >
                <span className="truncate">{selectedLabel ?? placeholder}</span>
                <div className="flex items-center gap-1">
                    {value && (
                        <X className="text-muted-foreground hover:text-foreground size-3.5 shrink-0" onClick={handleClear} />
                    )}
                    <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
                </div>
            </button>

            {open && (
                <div className="bg-popover text-popover-foreground absolute z-50 mt-1 w-full rounded-md border shadow-md">
                    <div className="flex items-center gap-2 border-b px-3 py-2">
                        <Search className="text-muted-foreground size-4 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="placeholder:text-muted-foreground h-6 w-full bg-transparent text-sm outline-none"
                        />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                            <div className="text-muted-foreground py-4 text-center text-sm">No results found.</div>
                        ) : (
                            filtered.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={cn(
                                        'hover:bg-accent hover:text-accent-foreground w-full rounded-sm px-2 py-1.5 text-left text-sm',
                                        option.value === value && 'bg-accent text-accent-foreground',
                                    )}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelect(option.value);
                                    }}
                                >
                                    {option.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
