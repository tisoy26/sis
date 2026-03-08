import { Head, router, usePage } from '@inertiajs/react';
import { FileText, GraduationCap, Printer, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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

interface StudentOption {
    id: number;
    student_id: string;
    full_name: string;
}

type PageProps = {
    sections: SectionOption[];
    subjects: SubjectOption[];
    students: StudentOption[];
    activeSchoolYear: string | null;
    selectedSectionId: number | null;
    auth: { user: User };
};

const quarters = [
    { value: 1, label: '1st Quarter' },
    { value: 2, label: '2nd Quarter' },
    { value: 3, label: '3rd Quarter' },
    { value: 4, label: '4th Quarter' },
];

export default function TeacherReports() {
    const { sections, subjects, students, activeSchoolYear, selectedSectionId: initialSectionId } = usePage<PageProps>().props;

    const [selectedSectionId, setSelectedSectionId] = useState<string>(
        initialSectionId ? initialSectionId.toString() : '',
    );
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
    const [selectedQuarter, setSelectedQuarter] = useState<string>('1');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [includeDetailed, setIncludeDetailed] = useState(false);

    const handleSectionChange = (value: string) => {
        setSelectedSectionId(value);
        setSelectedSubjectId('');
        setSelectedStudentId('');
        // Reload subjects and students for the selected section
        router.get('/teacher/reports', { section_id: value }, { preserveState: true, preserveScroll: true });
    };

    const handleGenerateSectionReport = () => {
        if (!selectedSectionId || !selectedSubjectId) return;
        const params = new URLSearchParams({
            section_id: selectedSectionId,
            subject_id: selectedSubjectId,
            quarter: selectedQuarter,
        });
        window.open(`/teacher/reports/section?${params.toString()}`, '_blank');
    };

    const handleGenerateStudentReport = () => {
        if (!selectedSectionId || !selectedStudentId) return;
        const params = new URLSearchParams({
            section_id: selectedSectionId,
            student_id: selectedStudentId,
            include_detailed: includeDetailed ? '1' : '0',
        });
        window.open(`/teacher/reports/student?${params.toString()}`, '_blank');
    };

    return (
        <AppLayout
            title="Reports"
            breadcrumbs={[
                { label: 'Home', href: '/teacher/dashboard' },
                { label: 'Reports' },
            ]}
        >
            <Head title="Reports" />

            <div className="space-y-6">
                {/* School Year Header */}
                {activeSchoolYear && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="size-4" />
                        School Year: <span className="font-medium text-foreground">{activeSchoolYear}</span>
                    </div>
                )}

                {/* Section Selector */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Select Section</CardTitle>
                        <CardDescription>Choose a section to generate reports for.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-w-sm space-y-2">
                            <Label>Section</Label>
                            <Select value={selectedSectionId} onValueChange={handleSectionChange}>
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
                    </CardContent>
                </Card>

                {!selectedSectionId && (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                            <FileText className="size-10 text-muted-foreground" />
                            <p className="text-muted-foreground">Select a section to see available reports.</p>
                        </CardContent>
                    </Card>
                )}

                {selectedSectionId && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Section Grades Report */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Users className="size-4" />
                                    Section Grade Report
                                </CardTitle>
                                <CardDescription>
                                    Print a class list with grade summary for all students in the selected section and subject.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Subject</Label>
                                    <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
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
                                <div className="space-y-2">
                                    <Label>Quarter</Label>
                                    <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
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
                                <Button
                                    className="w-full"
                                    onClick={handleGenerateSectionReport}
                                    disabled={!selectedSubjectId}
                                >
                                    <Printer className="mr-1 size-4" />
                                    Generate Section Report
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Individual Student Report */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="size-4" />
                                    Individual Student Report
                                </CardTitle>
                                <CardDescription>
                                    Print a comprehensive report for a specific student including info, attendance, and grades.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Student</Label>
                                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a student..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {students.map((s) => (
                                                <SelectItem key={s.id} value={s.id.toString()}>
                                                    {s.student_id} — {s.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="include-detailed"
                                        checked={includeDetailed}
                                        onCheckedChange={(checked) => setIncludeDetailed(checked === true)}
                                    />
                                    <Label htmlFor="include-detailed" className="cursor-pointer text-sm">
                                        Include detailed scores (individual quizzes, PTs, exams)
                                    </Label>
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={handleGenerateStudentReport}
                                    disabled={!selectedStudentId}
                                >
                                    <Printer className="mr-1 size-4" />
                                    Generate Student Report
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
