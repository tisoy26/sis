import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    CheckCircle,
    Clock,
    GraduationCap,
    ShieldCheck,
    User,
    UserRound,
    XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { User as UserType } from '@/types';

// --- Types ---

interface StudentData {
    id: number;
    student_id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    gender: string;
    birth_date: string | null;
    contact_number: string | null;
    email: string | null;
    status: string;
    enrolled_at: string | null;
}

interface SectionInfo {
    id: number;
    name: string;
    year_level_name: string;
}

interface AttendanceSummary {
    total_days: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
}

interface AttendanceRecord {
    id: number;
    date: string;
    status: string;
    remarks: string | null;
    subject_name: string;
}

interface SubjectGrade {
    subject_id: number;
    subject_code: string;
    subject_name: string;
    weight_category: string;
    q1: number | null;
    q2: number | null;
    q3: number | null;
    q4: number | null;
    final_grade: number | null;
}

type PageProps = {
    student: StudentData;
    section: SectionInfo;
    activeSchoolYear: string;
    attendanceSummary: AttendanceSummary;
    attendanceRecords: AttendanceRecord[];
    subjectGrades: SubjectGrade[];
    auth: { user: UserType };
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    present: 'default',
    absent: 'destructive',
    late: 'secondary',
    excused: 'outline',
};

const enrollmentStatusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
    enrolled: 'default',
    completed: 'secondary',
    dropped: 'destructive',
};

function getGradeColor(grade: number | null): string {
    if (grade === null) return '';
    if (grade >= 90) return 'text-green-600 font-bold';
    if (grade >= 85) return 'text-blue-600 font-semibold';
    if (grade >= 80) return 'text-primary font-medium';
    if (grade >= 75) return 'text-amber-600';
    return 'text-red-600 font-bold';
}

function getGradeLabel(grade: number | null): string {
    if (grade === null) return '';
    if (grade >= 90) return 'Outstanding';
    if (grade >= 85) return 'Very Satisfactory';
    if (grade >= 80) return 'Satisfactory';
    if (grade >= 75) return 'Fairly Satisfactory';
    return 'Did Not Meet Expectations';
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default function TeacherClassStudentDetail() {
    const {
        student,
        section,
        activeSchoolYear,
        attendanceSummary,
        attendanceRecords,
        subjectGrades,
    } = usePage<PageProps>().props;

    const backUrl = `/teacher/classes/${section.id}`;

    // Compute general average from final grades
    const gradedSubjects = subjectGrades.filter((s) => s.final_grade !== null);
    const generalAverage = gradedSubjects.length > 0
        ? gradedSubjects.reduce((sum, s) => sum + s.final_grade!, 0) / gradedSubjects.length
        : null;

    // Attendance rate
    const attendanceRate = attendanceSummary.total_days > 0
        ? ((attendanceSummary.present + attendanceSummary.late + attendanceSummary.excused) / attendanceSummary.total_days * 100)
        : null;

    return (
        <AppLayout
            title={student.full_name}
            breadcrumbs={[
                { label: 'Home', href: '/teacher/dashboard' },
                { label: 'My Classes', href: '/teacher/classes' },
                { label: section.name, href: backUrl },
                { label: student.full_name },
            ]}
        >
            <Head title={`${student.full_name} — Student Detail`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={backUrl}>
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <h2 className="text-lg font-semibold">{student.full_name}</h2>
                            <p className="text-sm text-muted-foreground">
                                {student.student_id} &middot; {section.name} ({section.year_level_name})
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="size-4" />
                        SY: <span className="font-medium text-foreground">{activeSchoolYear}</span>
                    </div>
                </div>

                <Tabs defaultValue="info">
                    <TabsList>
                        <TabsTrigger value="info">
                            <User className="mr-1 size-3.5" />
                            Student Info
                        </TabsTrigger>
                        <TabsTrigger value="attendance">
                            <Calendar className="mr-1 size-3.5" />
                            Attendance
                        </TabsTrigger>
                        <TabsTrigger value="grades">
                            <BookOpen className="mr-1 size-3.5" />
                            Grades
                        </TabsTrigger>
                    </TabsList>

                    {/* === STUDENT INFO TAB === */}
                    <TabsContent value="info">
                        <div className="space-y-6">
                            {/* Personal Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <UserRound className="size-4" />
                                        Personal Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Student ID</p>
                                            <p className="font-mono font-medium">{student.student_id}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">First Name</p>
                                            <p className="font-medium">{student.first_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Last Name</p>
                                            <p className="font-medium">{student.last_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Middle Name</p>
                                            <p className="font-medium">{student.middle_name || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Gender</p>
                                            <p className="font-medium capitalize">{student.gender}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Birth Date</p>
                                            <p className="font-medium">{formatDate(student.birth_date)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Contact Number</p>
                                            <p className="font-medium">{student.contact_number || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Email</p>
                                            <p className="font-medium">{student.email || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Enrollment Status</p>
                                            <Badge variant={enrollmentStatusColors[student.status] ?? 'default'}>
                                                {student.status}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Date Enrolled</p>
                                            <p className="font-medium">{formatDate(student.enrolled_at)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Snapshot */}
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <Card>
                                    <CardContent className="flex items-center gap-3 pt-6">
                                        <div className="rounded-lg bg-muted p-2 text-green-600">
                                            <CheckCircle className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">
                                                {attendanceRate !== null ? `${attendanceRate.toFixed(1)}%` : '—'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Attendance Rate</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="flex items-center gap-3 pt-6">
                                        <div className="rounded-lg bg-muted p-2 text-primary">
                                            <GraduationCap className="size-4" />
                                        </div>
                                        <div>
                                            <p className={`text-xl font-bold ${getGradeColor(generalAverage !== null ? Math.round(generalAverage) : null)}`}>
                                                {generalAverage !== null ? generalAverage.toFixed(2) : '—'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">General Average</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="flex items-center gap-3 pt-6">
                                        <div className="rounded-lg bg-muted p-2 text-blue-600">
                                            <BookOpen className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">{subjectGrades.length}</p>
                                            <p className="text-xs text-muted-foreground">Subjects</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* === ATTENDANCE TAB === */}
                    <TabsContent value="attendance">
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <Card>
                                    <CardContent className="flex items-center gap-3 pt-6">
                                        <div className="rounded-lg bg-muted p-2 text-primary">
                                            <Calendar className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">{attendanceSummary.total_days}</p>
                                            <p className="text-xs text-muted-foreground">Total Days</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="flex items-center gap-3 pt-6">
                                        <div className="rounded-lg bg-muted p-2 text-green-600">
                                            <CheckCircle className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">{attendanceSummary.present}</p>
                                            <p className="text-xs text-muted-foreground">Present</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="flex items-center gap-3 pt-6">
                                        <div className="rounded-lg bg-muted p-2 text-red-600">
                                            <XCircle className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">{attendanceSummary.absent}</p>
                                            <p className="text-xs text-muted-foreground">Absent</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="flex items-center gap-3 pt-6">
                                        <div className="rounded-lg bg-muted p-2 text-amber-600">
                                            <Clock className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">{attendanceSummary.late}</p>
                                            <p className="text-xs text-muted-foreground">Late</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="flex items-center gap-3 pt-6">
                                        <div className="rounded-lg bg-muted p-2 text-blue-600">
                                            <ShieldCheck className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold">{attendanceSummary.excused}</p>
                                            <p className="text-xs text-muted-foreground">Excused</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Attendance Rate */}
                            {attendanceRate !== null && (
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="gap-1 text-sm">
                                        Attendance Rate: <span className={attendanceRate >= 90 ? 'font-bold text-green-600' : attendanceRate >= 75 ? 'font-bold text-amber-600' : 'font-bold text-red-600'}>{attendanceRate.toFixed(1)}%</span>
                                    </Badge>
                                </div>
                            )}

                            {/* Records Table */}
                            {attendanceRecords.length > 0 ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Attendance Records</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-10 text-center">#</TableHead>
                                                        <TableHead className="min-w-[120px]">Date</TableHead>
                                                        <TableHead>Subject</TableHead>
                                                        <TableHead className="w-24 text-center">Status</TableHead>
                                                        <TableHead>Remarks</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {attendanceRecords.map((record, index) => (
                                                        <TableRow key={record.id}>
                                                            <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                                                            <TableCell className="font-medium">
                                                                {new Date(record.date).toLocaleDateString('en-US', {
                                                                    weekday: 'short',
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                })}
                                                            </TableCell>
                                                            <TableCell>{record.subject_name}</TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant={statusColors[record.status] ?? 'default'}>
                                                                    {record.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">
                                                                {record.remarks || '—'}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                                        <Calendar className="size-10 text-muted-foreground" />
                                        <p className="text-muted-foreground">No attendance records found for this student.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* === GRADES TAB === */}
                    <TabsContent value="grades">
                        <div className="space-y-6">
                            {subjectGrades.length > 0 ? (
                                <>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Quarterly & Final Grades</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="min-w-[180px]">Subject</TableHead>
                                                            <TableHead className="w-20 text-center">Q1</TableHead>
                                                            <TableHead className="w-20 text-center">Q2</TableHead>
                                                            <TableHead className="w-20 text-center">Q3</TableHead>
                                                            <TableHead className="w-20 text-center">Q4</TableHead>
                                                            <TableHead className="w-24 text-center">Final</TableHead>
                                                            <TableHead className="w-40">Description</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {subjectGrades.map((sg) => (
                                                            <TableRow key={sg.subject_id}>
                                                                <TableCell>
                                                                    <div>
                                                                        <span className="font-medium">{sg.subject_code}</span>
                                                                        <span className="ml-1 text-xs text-muted-foreground">— {sg.subject_name}</span>
                                                                    </div>
                                                                </TableCell>
                                                                {([sg.q1, sg.q2, sg.q3, sg.q4] as (number | null)[]).map((grade, i) => (
                                                                    <TableCell key={i} className="text-center">
                                                                        <span className={`text-sm ${getGradeColor(grade)}`}>
                                                                            {grade !== null ? grade : '—'}
                                                                        </span>
                                                                    </TableCell>
                                                                ))}
                                                                <TableCell className="text-center">
                                                                    <span className={`text-sm font-bold ${getGradeColor(sg.final_grade)}`}>
                                                                        {sg.final_grade !== null ? sg.final_grade : '—'}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className={`text-[11px] ${getGradeColor(sg.final_grade)}`}>
                                                                        {getGradeLabel(sg.final_grade)}
                                                                    </span>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {/* General Average Row */}
                                                        <TableRow className="bg-muted/50 font-bold">
                                                            <TableCell>General Average</TableCell>
                                                            <TableCell />
                                                            <TableCell />
                                                            <TableCell />
                                                            <TableCell />
                                                            <TableCell className="text-center">
                                                                <span className={`text-sm ${getGradeColor(generalAverage !== null ? Math.round(generalAverage) : null)}`}>
                                                                    {generalAverage !== null ? generalAverage.toFixed(2) : '—'}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell>
                                                                <span className={`text-[11px] ${getGradeColor(generalAverage !== null ? Math.round(generalAverage) : null)}`}>
                                                                    {getGradeLabel(generalAverage !== null ? Math.round(generalAverage) : null)}
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Grading Legend */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium">DepEd Grading Scale (DO No. 8, s. 2015)</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-4 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <span className="inline-block size-3 rounded-sm bg-green-500" />
                                                    <span>90–100 Outstanding</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="inline-block size-3 rounded-sm bg-blue-500" />
                                                    <span>85–89 Very Satisfactory</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="inline-block size-3 rounded-sm bg-primary" />
                                                    <span>80–84 Satisfactory</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="inline-block size-3 rounded-sm bg-amber-500" />
                                                    <span>75–79 Fairly Satisfactory</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="inline-block size-3 rounded-sm bg-red-500" />
                                                    <span>Below 75 Did Not Meet Expectations</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                <Card>
                                    <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                                        <BookOpen className="size-10 text-muted-foreground" />
                                        <p className="text-muted-foreground">No grades recorded yet for this student.</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
