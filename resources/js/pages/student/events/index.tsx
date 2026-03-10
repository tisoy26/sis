import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, PartyPopper, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useInitials } from '@/hooks/use-initials';
import StudentLayout from '@/layouts/student-layout';
import type { User } from '@/types';

interface EventImage {
    id: number;
    url: string;
}

interface EventItem {
    id: number;
    title: string;
    body: string;
    event_date: string | null;
    location: string | null;
    images: EventImage[];
    created_by_name: string;
    published_at: string | null;
}

type PageProps = {
    auth: { user: User };
    events: EventItem[];
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function ImageGallery({ images }: { images: EventImage[] }) {
    const [lightbox, setLightbox] = useState<number | null>(null);

    const close = useCallback(() => setLightbox(null), []);
    const prev = useCallback(() => setLightbox((i) => (i !== null ? (i === 0 ? images.length - 1 : i - 1) : null)), [images.length]);
    const next = useCallback(() => setLightbox((i) => (i !== null ? (i === images.length - 1 ? 0 : i + 1) : null)), [images.length]);

    useEffect(() => {
        if (lightbox === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [lightbox, close, prev, next]);

    if (images.length === 0) return null;

    const Lightbox = lightbox !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={close}>
            <button onClick={close} className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70">
                <X className="size-5" />
            </button>
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prev(); }}
                        className="absolute left-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                    >
                        <ChevronLeft className="size-6" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); next(); }}
                        className="absolute right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                    >
                        <ChevronRight className="size-6" />
                    </button>
                </>
            )}
            <img
                src={images[lightbox].url}
                alt=""
                className="h-[85vh] w-[90vw] object-contain"
                onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
                <div className="absolute bottom-4 text-sm text-white/70">
                    {lightbox + 1} / {images.length}
                </div>
            )}
        </div>
    );

    // Single image
    if (images.length === 1) {
        return (
            <>
                <img
                    src={images[0].url}
                    alt=""
                    className="w-full cursor-pointer object-cover"
                    onClick={() => setLightbox(0)}
                />
                {Lightbox}
            </>
        );
    }

    // 2 images — side by side
    if (images.length === 2) {
        return (
            <>
                <div className="grid grid-cols-2 gap-0.5">
                    {images.map((img, i) => (
                        <img
                            key={img.id}
                            src={img.url}
                            alt=""
                            className="h-64 w-full cursor-pointer object-cover"
                            onClick={() => setLightbox(i)}
                        />
                    ))}
                </div>
                {Lightbox}
            </>
        );
    }

    // 3+ images — first large, rest in grid with "+N" overlay
    const remaining = images.length - 3;
    return (
        <>
            <div className="grid grid-cols-2 gap-0.5">
                <img
                    src={images[0].url}
                    alt=""
                    className="col-span-2 h-64 w-full cursor-pointer object-cover"
                    onClick={() => setLightbox(0)}
                />
                <img
                    src={images[1].url}
                    alt=""
                    className="h-40 w-full cursor-pointer object-cover"
                    onClick={() => setLightbox(1)}
                />
                <div className="relative cursor-pointer" onClick={() => setLightbox(2)}>
                    <img src={images[2].url} alt="" className="h-40 w-full object-cover" />
                    {remaining > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <span className="text-2xl font-bold text-white">+{remaining}</span>
                        </div>
                    )}
                </div>
            </div>
            {Lightbox}
        </>
    );
}

export default function StudentEvents() {
    const { events } = usePage<PageProps>().props;
    const getInitials = useInitials();

    return (
        <StudentLayout>
            <Head title="Events" />

            <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/student/dashboard">
                            <ArrowLeft className="size-5" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <PartyPopper className="size-5 text-primary" />
                            <h1 className="text-xl font-semibold">Events</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">Upcoming and recent school events</p>
                    </div>
                    <Badge variant="secondary" className="hidden sm:flex">
                        {events.length} {events.length === 1 ? 'event' : 'events'}
                    </Badge>
                </div>

                {/* Events feed */}
                {events.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <div className="rounded-full bg-muted p-4">
                                <PartyPopper className="size-8 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">No events yet</p>
                                <p className="text-sm text-muted-foreground">Check back later for upcoming school events.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {events.map((item) => (
                            <Card key={item.id} className="overflow-hidden">
                                {/* Post header — avatar + name + time */}
                                <div className="flex items-center gap-3 px-4 pt-4">
                                    <Avatar className="size-10">
                                        <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                                            {getInitials(item.created_by_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">{item.created_by_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.published_at ? timeAgo(item.published_at) : 'Draft'}
                                            {item.location && (
                                                <> &middot; <MapPin className="mb-0.5 inline size-3" /> {item.location}</>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Post body text */}
                                <div className="px-4 py-3">
                                    <h2 className="text-[15px] font-semibold leading-snug">{item.title}</h2>
                                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                                        {item.body}
                                    </p>
                                </div>

                                {/* Image gallery */}
                                <ImageGallery images={item.images} />

                                {/* Event details bar */}
                                {item.event_date && (
                                    <div className="mx-4 my-3 flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2.5">
                                        <div className="flex size-10 flex-col items-center justify-center rounded-md bg-primary text-primary-foreground">
                                            <span className="text-[10px] font-semibold uppercase leading-none">
                                                {new Date(item.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-lg font-bold leading-none">
                                                {new Date(item.event_date + 'T00:00:00').getDate()}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(item.event_date + 'T00:00:00').toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                                {item.location && ` \u00B7 ${item.location}`}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Reactions / engagement bar (visual only) */}
                                <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
                                    <span>
                                        {item.published_at &&
                                            new Date(item.published_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                            })}
                                    </span>
                                </div>
                            </Card>
                        ))}

                        <p className="py-4 text-center text-xs text-muted-foreground">
                            You&apos;ve reached the end of events
                        </p>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
