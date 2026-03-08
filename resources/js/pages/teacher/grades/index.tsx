import { Head, Link, router, usePage } from '@inertiajs/react';
import { BookOpen, Check, ClipboardList, Eye, GraduationCap, Info, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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

// --- Types ---

interface SectionOption {
    id: number;
    name: string;
    year_level_name: string;
}

interface SubjectOption {
    id: number;
    code: string;
    name: string;
}

interface StudentSummary {
    id: number;
    student_id: string;
    full_name: string;
    gender: string;
    ww_percent: number | null;
    pt_percent: number | null;
    qa_percent: number | null;
    initial_grade: number | null;
    quarterly_grade: number | null;
}

interface Weights {
    ww: number;
    pt: number;
    qa: number;
}

type PageProps = {
    sections: SectionOption[];
    subjects: SubjectOption[];
    students: StudentSummary[];
    weights: Weights | null;
    weightCategory: string;
    selectedSectionId: number | null;
    selectedSubjectId: number | null;
    selectedQuarter: number;
    activeSchoolYear: string | null;
    auth: { user: User };
};

const quarters = [
    { value: 1, label: '1st Quarter' },
    { value: 2, label: '2nd Quarter' },
    { value: 3, label: '3rd Quarter' },
    { value: 4, label: '4th Quarter' },
];

const categoryLabels: Record<string, string> = {
    default: 'Language / Social Science / Values',
    performance: 'MAPEH / TLE / EPP / TVL',
    stem: 'Math / Science',
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

export default function TeacherGrades() {
    const {
        sections,
        subjects,
        students,
        weights,
        weightCategory,
        selectedSectionId,
        selectedSubjectId,
        selectedQuarter,
        activeSchoolYear,
    } = usePage<PageProps>().props;

    const navigate = (params: Record<string, string | number>) => {
        const query: Record<string, string | number> = {
            ...(selectedSectionId ? { section_id: selectedSectionId } : {}),
            ...(selectedSubjectId ? { subject_id: selectedSubjectId } : {}),
            quarter: selectedQuarter,
            ...params,
        };
        router.get('/teacher/grades', query, { preserveState: false });
    };

    const handleSectionChange = (value: string) => {
        navigate({ section_id: value, subject_id: '', quarter: selectedQuarter });
    };

    const handleSubjectChange = (value: string) => {
        navigate({ subject_id: value });
    };

    const handleQuarterChange = (value: string) => {
        navigate({ quarter: parseInt(value) });
    };

    const getShowUrl = (studentId: number) => {
        return `/teacher/grades/${studentId}?section_id=${selectedSectionId}&subject_id=${selectedSubjectId}&quarter=${selectedQuarter}`;
    };

    // Summary stats
    const gradeSummary = students.reduce(
        (acc, s) => {
            if (s.quarterly_grade !== null) {
                acc.graded++;
                acc.totalGrade += s.quarterly_grade;
                if (s.quarterly_grade >= 75) acc.passing++;
                else acc.failing++;
            } else {
                acc.ungraded++;
            }
            return acc;
        },
        { graded: 0, ungraded: 0, passing: 0, failing: 0, totalGrade: 0 },
    );
    const classAverage = gradeSummary.graded > 0 ? gradeSummary.totalGrade / gradeSummary.graded : null;

    return (
        <AppLayout
            title="Grades"
            breadcrumbs={[
                { label: 'Home', href: '/teacher/dashboard' },
                { label: 'Grades' },
            ]}
        >
            <Head title="Grades" />

            <div className="space-y-6">
                {/* School Year Header */}
                {activeSchoolYear && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="size-4" />
                        School Year: <span className="font-medium text-foreground">{activeSchoolYear}</span>
                    </div>
                )}

                {/* Section, Subject & Quarter Selectors */}
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
                            <div className="flex-1 space-y-2">
                                <Label>Subject</Label>
                                <Select
                                    value={selectedSubjectId?.toString() ?? ''}
                                    onValueChange={handleSubjectChange}
                                    disabled={!selectedSectionId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a subject..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subjects.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.code} — {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full space-y-2 sm:w-44">
                                <Label>Quarter</Label>
                                <Select
                                    value={selectedQuarter.toString()}
                                    onValueChange={handleQuarterChange}
                                    disabled={!selectedSectionId}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {quarters.map((q) => (
                                            <SelectItem key={q.value} value={q.value.toString()}>
                                                {q.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* No section selected */}
                {!selectedSectionId && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                            <ClipboardList className="size-10 text-muted-foreground" />
                            <p className="text-muted-foreground">Select a section and subject to manage grades.</p>
                        </CardContent>
                    </Card>
                )}

                {/* Student list with grades */}
                {selectedSectionId && selectedSubjectId && students.length > 0 && weights && (
                    <>
                        {/* Weight Info Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Info className="size-4" />
                                    DepEd Grading Components
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                                    <div className="text-sm text-muted-foreground">
                                        Category: <span className="font-medium text-foreground">{categoryLabels[weightCategory] ?? weightCategory}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <Badge variant="outline" className="gap-1">
                                            Written Work <span className="font-bold text-primary">{weights.ww}%</span>
                                        </Badge>
                                        <Badge variant="outline" className="gap-1">
                                            Performance Task <span className="font-bold text-primary">{weights.pt}%</span>
                                        </Badge>
                                        <Badge variant="outline" className="gap-1">
                                            Quarterly Assessment <span className="font-bold text-primary">{weights.qa}%</span>
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Cards */}
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <Card>
                                <CardContent className="flex items-center gap-3 pt-6">
                                    <div className="rounded-lg bg-muted p-2 text-primary">
                                        <ClipboardList className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{students.length}</p>
                                        <p className="text-xs text-muted-foreground">Total Students</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="flex items-center gap-3 pt-6">
                                    <div className="rounded-lg bg-muted p-2 text-green-600">
                                        <Check className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{gradeSummary.graded}</p>
                                        <p className="text-xs text-muted-foreground">Graded</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="flex items-center gap-3 pt-6">
                                    <div className="rounded-lg bg-muted p-2 text-amber-600">
                                        <Pencil className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{gradeSummary.ungraded}</p>
                                        <p className="text-xs text-muted-foreground">Ungraded</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="flex items-center gap-3 pt-6">
                                    <div className="rounded-lg bg-muted p-2 text-blue-600">
                                        <GraduationCap className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{gradeSummary.passing}</p>
                                        <p className="text-xs text-muted-foreground">Passing</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="flex items-center gap-3 pt-6">
                                    <div className="rounded-lg bg-muted p-2 text-red-600">
                                        <BookOpen className="size-4" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold">{gradeSummary.failing}</p>
                                        <p className="text-xs text-muted-foreground">Failing</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Class Average */}
                        {classAverage !== null && (
                            <div className="flex flex-wrap items-center gap-3">
                                <Badge variant="outline" className="gap-1 text-sm">
                                    Class Average: <span className={getGradeColor(classAverage)}>{classAverage.toFixed(2)}</span>
                                    <span className="ml-1 text-xs text-muted-foreground">({getGradeLabel(classAverage)})</span>
                                </Badge>
                            </div>
                        )}

                        {/* Student Table */}
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-10 text-center">#</TableHead>
                                                <TableHead className="min-w-[100px]">Student ID</TableHead>
                                                <TableHead className="min-w-[180px]">Name</TableHead>
                                                <TableHead className="w-20 text-center">
                                                    WW
                                                    <span className="block text-[10px] font-normal text-muted-foreground">{weights.ww}%</span>
                                                </TableHead>
                                                <TableHead className="w-20 text-center">
                                                    PT
                                                    <span className="block text-[10px] font-normal text-muted-foreground">{weights.pt}%</span>
                                                </TableHead>
                                                <TableHead className="w-20 text-center">
                                                    QA
                                                    <span className="block text-[10px] font-normal text-muted-foreground">{weights.qa}%</span>
                                                </TableHead>
                                                <TableHead className="w-20 text-center">Initial</TableHead>
                                                <TableHead className="w-20 text-center">QG</TableHead>
                                                <TableHead className="w-32">Description</TableHead>
                                                <TableHead className="w-20 text-center">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {students.map((student, index) => (
                                                <TableRow key={student.id}>
                                                    <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                                                    <TableCell className="font-mono text-xs">{student.student_id}</TableCell>
                                                    <TableCell className="font-medium">{student.full_name}</TableCell>
                                                    <TableCell className="text-center text-sm">
                                                        {student.ww_percent !== null ? `${student.ww_percent}%` : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-center text-sm">
                                                        {student.pt_percent !== null ? `${student.pt_percent}%` : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-center text-sm">
                                                        {student.qa_percent !== null ? `${student.qa_percent}%` : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-center text-sm text-muted-foreground">
                                                        {student.initial_grade !== null ? student.initial_grade.toFixed(2) : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`text-sm font-bold ${getGradeColor(student.quarterly_grade)}`}>
                                                            {student.quarterly_grade !== null ? student.quarterly_grade : '—'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`text-[11px] ${getGradeColor(student.quarterly_grade)}`}>
                                                            {getGradeLabel(student.quarterly_grade)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button size="sm" variant="outline" asChild>
                                                            <Link href={getShowUrl(student.id)}>
                                                                <Eye className="mr-1 size-3" />
                                                                View
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
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
                )}

                {/* Section selected but no students */}
                {selectedSectionId && selectedSubjectId && students.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                            <GraduationCap className="size-10 text-muted-foreground" />
                            <p className="text-muted-foreground">No enrolled students in this section.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
