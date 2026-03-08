import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export type Column<T> = {
    key: string;
    label: string;
    render?: (item: T, index: number) => React.ReactNode;
    className?: string;
};

export type Filter<T> = {
    key: keyof T;
    label: string;
    options: { label: string; value: string }[];
    allLabel?: string;
};

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    searchable?: boolean;
    searchKeys?: (keyof T)[];
    searchPlaceholder?: string;
    filters?: Filter<T>[];
    onAdd?: () => void;
    addLabel?: string;
    emptyMessage?: string;
    perPage?: number;
}

export default function DataTable<T extends { id: number }>({
    columns,
    data,
    searchable = true,
    searchKeys = [],
    searchPlaceholder = 'Search...',
    filters = [],
    onAdd,
    addLabel = 'Add New',
    emptyMessage = 'No records found.',
    perPage = 10,
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);

    const updateFilter = (key: string, value: string) => {
        setActiveFilters((prev) => {
            const next = { ...prev };
            if (value === '__all__') {
                delete next[key];
            } else {
                next[key] = value;
            }
            return next;
        });
        setCurrentPage(1);
    };

    const hasActiveFilters = search.trim() !== '' || Object.keys(activeFilters).length > 0;

    const resetFilters = () => {
        setSearch('');
        setActiveFilters({});
        setCurrentPage(1);
    };

    const filtered = data.filter((item) => {
        // Search filter
        if (search.trim()) {
            const matches = searchKeys.some((key) => {
                const value = item[key];
                return (
                    value != null &&
                    String(value).toLowerCase().includes(search.toLowerCase())
                );
            });
            if (!matches) return false;
        }

        // Dropdown filters
        for (const [key, value] of Object.entries(activeFilters)) {
            if (String(item[key as keyof T]) !== value) return false;
        }

        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedData = filtered.slice((safePage - 1) * perPage, safePage * perPage);
    const startIndex = (safePage - 1) * perPage;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {searchable && (
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-8"
                            />
                        </div>
                    )}
                    {filters.map((filter) => (
                        <Select
                            key={String(filter.key)}
                            value={activeFilters[String(filter.key)] ?? '__all__'}
                            onValueChange={(v) => updateFilter(String(filter.key), v)}
                        >
                            <SelectTrigger className="w-full sm:w-[150px]">
                                <SelectValue placeholder={filter.label} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">
                                    {filter.allLabel ?? `All ${filter.label}`}
                                </SelectItem>
                                {filter.options.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ))}
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 px-2 text-muted-foreground">
                            <RotateCcw className="mr-1.5 size-3.5" />
                            Reset
                        </Button>
                    )}
                </div>
                {onAdd && (
                    <Button onClick={onAdd} size="sm">
                        {addLabel}
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col.key} className={col.className}>
                                    {col.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item, index) => (
                                <TableRow key={item.id}>
                                    {columns.map((col) => (
                                        <TableCell key={col.key} className={col.className}>
                                            {col.render
                                                ? col.render(item, startIndex + index)
                                                : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                    Showing {filtered.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + perPage, filtered.length)} of {filtered.length} record(s)
                </p>
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={safePage <= 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                                if (totalPages <= 5) return true;
                                if (page === 1 || page === totalPages) return true;
                                return Math.abs(page - safePage) <= 1;
                            })
                            .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                                if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                                    acc.push('ellipsis');
                                }
                                acc.push(page);
                                return acc;
                            }, [])
                            .map((item, idx) =>
                                item === 'ellipsis' ? (
                                    <span key={`e-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                                ) : (
                                    <Button
                                        key={item}
                                        variant={item === safePage ? 'default' : 'outline'}
                                        size="icon"
                                        className="size-8 text-xs"
                                        onClick={() => setCurrentPage(item)}
                                    >
                                        {item}
                                    </Button>
                                ),
                            )}
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            disabled={safePage >= totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
