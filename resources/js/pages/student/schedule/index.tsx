import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StudentLayout from '@/layouts/student-layout';
import type { User } from '@/types';

interface ScheduleEntry {
    id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    subject_name: string;
    subject_code: string;
    teacher_name: string;
}

type PageProps = {
    auth: { user: User };
    schedules: ScheduleEntry[];
    sectionName: string | null;
    yearLevelName: string | null;
    schoolYearName: string | null;
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const DAY_LABELS: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
};
const DAY_SHORT: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
};

function formatTime(time: string) {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

export default function StudentSchedule() {
    const { schedules, sectionName, yearLevelName, schoolYearName } = usePage<PageProps>().props;

    // Group by day
    const byDay = DAYS.reduce(
        (acc, day) => {
            acc[day] = schedules.filter((s) => s.day_of_week === day);
            return acc;
        },
        {} as Record<string, ScheduleEntry[]>,
    );

    // Find current day
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const daysWithSchedule = DAYS.filter((d) => byDay[d].length > 0);

    return (
        <StudentLayout>
            <Head title="My Schedule" />

            <div className="mx-auto max-w-5xl space-y-4 p-2 sm:p-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/student/dashboard">
                            <ArrowLeft className="size-5" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <CalendarClock className="size-5 text-primary" />
                            <h1 className="text-xl font-semibold">My Schedule</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {sectionName && yearLevelName
                                ? `${yearLevelName} — ${sectionName}`
                                : 'No enrollment found'}
                            {schoolYearName && ` · ${schoolYearName}`}
                        </p>
                    </div>
                </div>

                {/* Schedule content */}
                {schedules.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                            <div className="rounded-full bg-muted p-4">
                                <CalendarClock className="size-8 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">No schedule yet</p>
                                <p className="text-sm text-muted-foreground">
                                    Your class schedule will appear here once it's been set up by the admin.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {daysWithSchedule.map((day) => (
                            <Card key={day} className={day === today ? 'border-primary/50 ring-1 ring-primary/20' : ''}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        {DAY_LABELS[day]}
                                        {day === today && (
                                            <Badge variant="default" className="text-xs">
                                                Today
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 pt-0">
                                    {byDay[day].map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="rounded-lg border bg-muted/30 px-3 py-2.5"
                                        >
                                            <p className="truncate text-sm font-semibold">{entry.subject_name}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {formatTime(entry.start_time)} – {formatTime(entry.end_time)}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {entry.teacher_name}
                                            </p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
}
