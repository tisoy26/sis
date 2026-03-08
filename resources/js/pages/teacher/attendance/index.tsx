import { Head, router, usePage } from '@inertiajs/react';
import { CalendarCheck, CalendarIcon, Check, GraduationCap, Pencil, Save, UserCheck, UserMinus, UserX, Clock } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import AppLayout from '@/layouts/app-layout';
import type { User } from '@/types';

interface SectionOption {
    id: number;
    name: string;
    year_level_name: string;
}

interface StudentItem {
    id: number;
    student_id: string;
    full_name: string;
    gender: string;
}

interface AttendanceRecord {
    student_id: number;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks: string;
    saved: boolean;
}

type PageProps = {
    sections: SectionOption[];
    students: StudentItem[];
    attendanceRecords: Record<string, AttendanceRecord>;
    selectedSectionId: number | null;
    selectedDate: string;
    activeSchoolYear: string | null;
    monthlySummary: Record<string, number>;
    datesWithAttendance: string[];
    auth: { user: User };
};

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
type AttendanceStatusOrNull = AttendanceStatus | null;

const statusConfig: Record<AttendanceStatus, { label: string; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
    present: { label: 'Present', color: 'text-green-600', variant: 'default', icon: UserCheck },
    absent: { label: 'Absent', color: 'text-red-600', variant: 'destructive', icon: UserX },
    late: { label: 'Late', color: 'text-amber-600', variant: 'secondary', icon: Clock },
    excused: { label: 'Excused', color: 'text-blue-600', variant: 'outline', icon: UserMinus },
};

const statusKeys = Object.keys(statusConfig) as AttendanceStatus[];

export default function TeacherAttendance() {
    const {
        sections,
        students,
        attendanceRecords,
        selectedSectionId,
        selectedDate,
        activeSchoolYear,
        monthlySummary,
        datesWithAttendance,
        auth: { user },
    } = usePage<PageProps>().props;

    const [attendance, setAttendance] = useState<Record<number, { status: AttendanceStatusOrNull; remarks: string }>>(() => {
        const initial: Record<number, { status: AttendanceStatusOrNull; remarks: string }> = {};
        students.forEach((s) => {
            const existing = attendanceRecords[s.id];
            initial[s.id] = {
                status: existing?.saved ? (existing.status as AttendanceStatus) : null,
                remarks: existing?.remarks ?? '',
            };
        });
        return initial;
    });

    const [saving, setSaving] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);

    const hasSavedRecords = Object.values(attendanceRecords).some((r) => r.saved);
    const [editing, setEditing] = useState(!hasSavedRecords);

    const handleSectionChange = (value: string) => {
        router.get('/teacher/attendance', { section_id: value, date: selectedDate }, {
            preserveState: false,
        });
    };

    const handleDateChange = (date: Date | undefined) => {
        if (date && selectedSectionId) {
            const dateStr = date.toLocaleDateString('en-CA');
            setCalendarOpen(false);
            router.get('/teacher/attendance', { section_id: selectedSectionId, date: dateStr }, {
                preserveState: false,
            });
        }
    };

    const setStudentStatus = (studentId: number, status: AttendanceStatusOrNull) => {
        setAttendance((prev) => ({
            ...prev,
            [studentId]: { ...prev[studentId], status: prev[studentId]?.status === status ? null : status },
        }));
    };

    const setStudentRemarks = (studentId: number, remarks: string) => {
        setAttendance((prev) => ({
            ...prev,
            [studentId]: { ...prev[studentId], remarks },
        }));
    };

    const markAll = (status: AttendanceStatus) => {
        setAttendance((prev) => {
            const updated = { ...prev };
            students.forEach((s) => {
                updated[s.id] = { ...updated[s.id], status };
            });
            return updated;
        });
    };

    const handleSave = () => {
        if (!selectedSectionId) return;

        // Only save students that have a status selected
        const entries = students
            .filter((s) => attendance[s.id]?.status !== null && attendance[s.id]?.status !== undefined)
            .map((s) => ({
                student_id: s.id,
                status: attendance[s.id].status!,
                remarks: attendance[s.id]?.remarks ?? '',
            }));

        if (entries.length === 0) return;

        const data = {
            section_id: selectedSectionId,
            date: selectedDate,
            attendance: entries,
        };

        setSaving(true);
        router.post('/teacher/attendance', data, {
            preserveScroll: true,
            onFinish: () => {
                setSaving(false);
                setEditing(false);
            },
        });
    };

    // Summary counts from current form state
    const currentSummary = students.reduce(
        (acc, s) => {
            const status = attendance[s.id]?.status;
            if (status) {
                acc[status] = (acc[status] || 0) + 1;
            } else {
                acc['unmarked'] = (acc['unmarked'] || 0) + 1;
            }
            return acc;
        },
        {} as Record<string, number>,
    );

    return (
        <AppLayout
            title="Attendance"
            breadcrumbs={[
                { label: 'Home', href: '/teacher/dashboard' },
                { label: 'Attendance' },
            ]}
        >
            <Head title="Attendance" />

            <div className="space-y-6">
                {/* Header */}
                {activeSchoolYear && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="size-4" />
                        School Year: <span className="font-medium text-foreground">{activeSchoolYear}</span>
                    </div>
                )}

                {/* Section & Date Selectors */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            <div className="flex-1 space-y-2">
                                <Label>Section</Label>
                                <Select
                                    value={selectedSectionId?.toString() ?? ''}
                                    onValueChange={handleSectionChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a section..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sections.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name} — {s.year_level_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full space-y-2 sm:w-auto">
                                <Label>Date</Label>
                                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal sm:w-52"
                                            disabled={!selectedSectionId}
                                        >
                                            <CalendarIcon className="mr-2 size-4" />
                                            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-PH', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={new Date(selectedDate + 'T00:00:00')}
                                            onSelect={handleDateChange}
                                            defaultMonth={new Date(selectedDate + 'T00:00:00')}
                                            modifiers={{
                                                hasAttendance: datesWithAttendance.map((d) => new Date(d + 'T00:00:00')),
                                            }}
                                            modifiersClassNames={{
                                                hasAttendance: 'bg-green-100 text-green-800 font-bold dark:bg-green-900 dark:text-green-200',
                                            }}
                                        />
                                        <div className="border-t px-3 py-2">
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <span className="inline-block size-3 rounded-sm bg-green-100 border border-green-300" />
                                                    Has attendance
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="inline-block size-3 rounded-sm bg-muted border" />
                                                    No attendance
                                                </span>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* No section selected */}
                {!selectedSectionId && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                            <CalendarCheck className="size-10 text-muted-foreground" />
                            <p className="text-muted-foreground">Select a section to take attendance.</p>
                        </CardContent>
                    </Card>
                )}

                {/* Attendance form */}
                {selectedSectionId && students.length > 0 && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {statusKeys.map((status) => {
                                const cfg = statusConfig[status];
                                return (
                                    <Card key={status}>
                                        <CardContent className="flex items-center gap-3 pt-6">
                                            <div className={`rounded-lg bg-muted p-2 ${cfg.color}`}>
                                                <cfg.icon className="size-4" />
                                            </div>
                                            <div>
                                                <p className="text-xl font-bold">{currentSummary[status] ?? 0}</p>
                                                <p className="text-xs text-muted-foreground">{cfg.label}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Guide + Save/Edit */}
                        <div className="flex flex-wrap items-center gap-2">
                            {editing ? (
                                <p className="text-sm text-muted-foreground">
                                    Click a status button for each student to mark their attendance. Click again to unmark.
                                </p>
                            ) : (
                                <Badge variant="secondary" className="gap-1">
                                    <Check className="size-3" />
                                    Attendance saved
                                </Badge>
                            )}
                            <div className="ml-auto flex items-center gap-2">
                                {editing ? (
                                    <Button onClick={handleSave} disabled={saving}>
                                        <Save className="mr-1 size-4" />
                                        {saving ? 'Saving...' : 'Save Attendance'}
                                    </Button>
                                ) : (
                                    <Button variant="outline" onClick={() => setEditing(true)}>
                                        <Pencil className="mr-1 size-4" />
                                        Edit Attendance
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Student table */}
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">#</TableHead>
                                                <TableHead>Student ID</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="w-20">Gender</TableHead>
                                                <TableHead className="w-72">Status</TableHead>
                                                <TableHead>Remarks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {students.map((student, index) => (
                                                <TableRow key={student.id}>
                                                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                                    <TableCell className="font-mono text-xs">{student.student_id}</TableCell>
                                                    <TableCell className="font-medium">{student.full_name}</TableCell>
                                                    <TableCell className="capitalize">{student.gender}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            {statusKeys.map((status) => {
                                                                const isActive = attendance[student.id]?.status === status;
                                                                if (!editing && !isActive) return null;
                                                                return (
                                                                    <Button
                                                                        key={status}
                                                                        size="sm"
                                                                        variant={isActive ? statusConfig[status].variant : 'outline'}
                                                                        className={`h-7 rounded-full border-2 px-3 text-xs ${isActive ? 'ring-2 ring-offset-1' : 'opacity-50'} ${!editing ? 'pointer-events-none' : ''}`}
                                                                        onClick={() => editing && setStudentStatus(student.id, status)}
                                                                    >
                                                                        {statusConfig[status].label}
                                                                    </Button>
                                                                );
                                                            })}
                                                            {!editing && !attendance[student.id]?.status && (
                                                                <span className="text-xs text-muted-foreground">—</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            className="h-7 text-xs"
                                                            placeholder="Optional remarks..."
                                                            value={attendance[student.id]?.remarks ?? ''}
                                                            onChange={(e) => setStudentRemarks(student.id, e.target.value)}
                                                            disabled={!editing}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>


                    </>
                )}

                {/* Section selected but no students */}
                {selectedSectionId && students.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                            <UserX className="size-10 text-muted-foreground" />
                            <p className="text-muted-foreground">No enrolled students in this section.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
