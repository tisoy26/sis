import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Megaphone, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StudentLayout from '@/layouts/student-layout';
import type { User } from '@/types';

interface AnnouncementItem {
    id: number;
    title: string;
    body: string;
    image_url: string | null;
    created_by_name: string;
    published_at: string | null;
}

type PageProps = {
    auth: { user: User };
    announcements: AnnouncementItem[];
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

export default function StudentAnnouncements() {
    const { announcements } = usePage<PageProps>().props;

    return (
        <StudentLayout>
            <Head title="Announcements" />

            <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/student/dashboard">
                            <ArrowLeft className="size-5" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Megaphone className="size-5 text-primary" />
                            <h1 className="text-xl font-semibold">Announcements</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">Stay updated with the latest school news and updates</p>
                    </div>
                    <Badge variant="secondary" className="hidden sm:flex">
                        {announcements.length} {announcements.length === 1 ? 'post' : 'posts'}
                    </Badge>
                </div>

                {/* Announcements list */}
                {announcements.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <div className="rounded-full bg-muted p-4">
                                <Megaphone className="size-8 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">No announcements yet</p>
                                <p className="text-sm text-muted-foreground">Check back later for updates from your school.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((item, index) => (
                            <Card key={item.id} className="overflow-hidden">
                                {item.image_url && (
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="max-h-[300px] w-full object-cover"
                                    />
                                )}
                                <CardContent className="space-y-3 p-5">
                                    {/* Title row */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h2 className="text-base font-semibold leading-tight">{item.title}</h2>
                                        </div>
                                        {item.published_at && (
                                            <Badge variant="outline" className="shrink-0 text-xs font-normal">
                                                {timeAgo(item.published_at)}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Body */}
                                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                                        {item.body}
                                    </p>

                                    {/* Footer meta */}
                                    <div className="flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <UserCircle className="size-3.5" />
                                            {item.created_by_name}
                                        </span>
                                        {item.published_at && (
                                            <span className="flex items-center gap-1">
                                                <CalendarDays className="size-3.5" />
                                                {new Date(item.published_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* End label */}
                        <p className="py-4 text-center text-xs text-muted-foreground">
                            You&apos;ve reached the end of announcements
                        </p>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
