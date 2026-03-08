import { Head, usePage } from '@inertiajs/react';
import { BookOpen, Check, ChevronsUpDown, FileDown, FileText, GraduationCap, Loader2, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import type { User } from '@/types';

type DropdownOption = { value: string; label: string; yearLevel?: string | null };
type StudentOption = { value: string; label: string; subtitle?: string | null };

type PageProps = {
    auth: { user: User };
    schoolYears: DropdownOption[];
    sections: DropdownOption[];
    yearLevels: DropdownOption[];
};

export default function StaffReportsIndex() {
    const { auth, schoolYears, sections, yearLevels } = usePage<PageProps>().props;
    const user = auth.user;

    const [studentStatus, setStudentStatus] = useState('all');
    const [studentSY, setStudentSY] = useState('');
    const [studentSection, setStudentSection] = useState('');
    const [enrollSY, setEnrollSY] = useState('');
    const [enrollSection, setEnrollSection] = useState('');
    const [enrollYearLevel, setEnrollYearLevel] = useState('');
    const [sectionSY, setSectionSY] = useState('');

    // Student search combobox state
    const [studentOpen, setStudentOpen] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentResults, setStudentResults] = useState<StudentOption[]>([]);
    const [studentLoading, setStudentLoading] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const searchStudents = useCallback((query: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length < 2) {
            setStudentResults([]);
            setStudentLoading(false);
            return;
        }

        setStudentLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/staff/students/search?q=${encodeURIComponent(query.trim())}`);
                const data: StudentOption[] = await res.json();
                setStudentResults(data);
            } catch {
                setStudentResults([]);
            } finally {
                setStudentLoading(false);
            }
        }, 300);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const openReport = (url: string) => {
        window.open(url, '_blank');
    };

    return (
        <AppLayout
            title="Reports"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'Reports' },
            ]}
        >
            <Head title="Reports" />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Student Master List */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                                <Users className="text-primary size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Student Master List</CardTitle>
                                <CardDescription>List of all registered students</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="space-y-2">
                            <Label>School Year</Label>
                            <Select value={studentSY} onValueChange={setStudentSY}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select school year..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {schoolYears.map((sy) => (
                                        <SelectItem key={sy.value} value={sy.value}>
                                            {sy.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Section</Label>
                            <Select value={studentSection} onValueChange={setStudentSection}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All sections" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {sections.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}{s.yearLevel ? ` — ${s.yearLevel}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status Filter</Label>
                            <Select value={studentStatus} onValueChange={setStudentStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Students</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="graduated">Graduated</SelectItem>
                                    <SelectItem value="transferred">Transferred</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                        {!studentSY && (
                            <p className="text-xs text-muted-foreground">Please select a school year to generate the report.</p>
                        )}
                        <Button
                            className="w-full"
                            disabled={!studentSY}
                            onClick={() => {
                                const params = new URLSearchParams();
                                params.set('school_year_id', studentSY);
                                if (studentSection && studentSection !== 'all') params.set('section_id', studentSection);
                                if (studentStatus && studentStatus !== 'all') params.set('status', studentStatus);
                                openReport(`/staff/reports/students?${params.toString()}`);
                            }}
                        >
                            <FileDown className="mr-2 size-4" />
                            Generate PDF
                        </Button>
                    </CardFooter>
                </Card>

                {/* Enrollment Report */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                                <BookOpen className="text-primary size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Enrollment Report</CardTitle>
                                <CardDescription>Enrollment records with filters</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="space-y-2">
                            <Label>School Year</Label>
                            <Select value={enrollSY} onValueChange={setEnrollSY}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select school year..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {schoolYears.map((sy) => (
                                        <SelectItem key={sy.value} value={sy.value}>
                                            {sy.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Year Level</Label>
                            <Select value={enrollYearLevel} onValueChange={(v) => { setEnrollYearLevel(v); setEnrollSection(''); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All year levels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Year Levels</SelectItem>
                                    {yearLevels.map((yl) => (
                                        <SelectItem key={yl.value} value={yl.value}>
                                            {yl.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Section</Label>
                            <Select value={enrollSection} onValueChange={setEnrollSection}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All sections" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {sections
                                        .filter((s) => !enrollYearLevel || enrollYearLevel === 'all' || s.yearLevel === yearLevels.find((yl) => yl.value === enrollYearLevel)?.label)
                                        .map((s) => (
                                            <SelectItem key={s.value} value={s.value}>
                                                {s.label}{s.yearLevel ? ` — ${s.yearLevel}` : ''}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-2">
                        {!enrollSY && (
                            <p className="text-xs text-muted-foreground">Please select a school year to generate the report.</p>
                        )}
                        <Button
                            className="w-full"
                            disabled={!enrollSY}
                            onClick={() => {
                                const params = new URLSearchParams();
                                params.set('school_year_id', enrollSY);
                                if (enrollYearLevel && enrollYearLevel !== 'all') params.set('year_level_id', enrollYearLevel);
                                if (enrollSection && enrollSection !== 'all') params.set('section_id', enrollSection);
                                openReport(`/staff/reports/enrollment?${params.toString()}`);
                            }}
                        >
                            <FileDown className="mr-2 size-4" />
                            Generate PDF
                        </Button>
                    </CardFooter>
                </Card>

                {/* Section Summary */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                                <FileText className="text-primary size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Section Summary</CardTitle>
                                <CardDescription>Student count per section</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="space-y-2">
                            <Label>School Year</Label>
                            <Select value={sectionSY} onValueChange={setSectionSY}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All school years" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All School Years</SelectItem>
                                    {schoolYears.map((sy) => (
                                        <SelectItem key={sy.value} value={sy.value}>
                                            {sy.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (sectionSY && sectionSY !== 'all') params.set('school_year_id', sectionSY);
                                openReport(`/staff/reports/sections?${params.toString()}`);
                            }}
                        >
                            <FileDown className="mr-2 size-4" />
                            Generate PDF
                        </Button>
                    </CardFooter>
                </Card>

                {/* Individual Student Grade Report */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                                <GraduationCap className="text-primary size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Individual Student Grades</CardTitle>
                                <CardDescription>Grade report for a specific student</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        <div className="space-y-2">
                            <Label>Student</Label>
                            <Popover open={studentOpen} onOpenChange={setStudentOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={studentOpen}
                                        className="w-full justify-between font-normal"
                                    >
                                        {selectedStudent ? (
                                            <span className="truncate">{selectedStudent.label}</span>
                                        ) : (
                                            <span className="text-muted-foreground">Search student by name or ID...</span>
                                        )}
                                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[480px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Type name or student ID..."
                                            value={studentSearch}
                                            onValueChange={(val) => {
                                                setStudentSearch(val);
                                                searchStudents(val);
                                            }}
                                        />
                                        <CommandList>
                                            {studentLoading ? (
                                                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                                                    <Loader2 className="size-4 animate-spin" />
                                                    Searching...
                                                </div>
                                            ) : studentSearch.trim().length < 2 ? (
                                                <div className="py-6 text-center text-sm text-muted-foreground">
                                                    Type at least 2 characters to search
                                                </div>
                                            ) : (
                                                <>
                                                    <CommandEmpty>No student found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {studentResults.map((s) => (
                                                            <CommandItem
                                                                key={s.value}
                                                                value={s.value}
                                                                onSelect={() => {
                                                                    setSelectedStudent(s);
                                                                    setStudentOpen(false);
                                                                    setStudentSearch('');
                                                                    setStudentResults([]);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 size-4 shrink-0',
                                                                        selectedStudent?.value === s.value ? 'opacity-100' : 'opacity-0',
                                                                    )}
                                                                />
                                                                <div className="min-w-0">
                                                                    <div className="truncate">{s.label}</div>
                                                                    {s.subtitle && (
                                                                        <div className="text-xs text-muted-foreground truncate">{s.subtitle}</div>
                                                                    )}
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            disabled={!selectedStudent}
                            onClick={() => openReport(`/staff/students/${selectedStudent!.value}/export-grades`)}
                        >
                            <FileDown className="mr-2 size-4" />
                            Generate PDF
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}
