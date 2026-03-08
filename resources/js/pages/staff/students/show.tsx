import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { Student, User } from '@/types';

interface SubjectGrade {
    subject_code: string;
    subject_name: string;
    teacher: string;
    q1: number | null;
    q2: number | null;
    q3: number | null;
    q4: number | null;
    final_grade: number | null;
}

interface EnrollmentInfo {
    section_name: string;
    year_level_name: string;
    status: string;
}

type PageProps = {
    auth: { user: User };
    student: Student;
    activeSchoolYear: string | null;
    enrollment: EnrollmentInfo | null;
    subjectGrades: SubjectGrade[];
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    inactive: 'secondary',
    graduated: 'outline',
    transferred: 'destructive',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="grid grid-cols-3 gap-2 py-2">
            <span className="text-muted-foreground text-sm font-medium">{label}</span>
            <span className="col-span-2 text-sm">{value || '—'}</span>
        </div>
    );
}

function buildFullName(first: string | null, middle: string | null, last: string | null): string {
    return [first, middle, last].filter(Boolean).join(' ') || '—';
}

function DocumentCheck({ label, checked }: { label: string; checked: boolean }) {
    return (
        <div className="flex items-center gap-3 rounded-md border p-3">
            <div className={`flex size-5 items-center justify-center rounded border ${checked ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                {checked && (
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </div>
            <span className="text-sm">{label}</span>
        </div>
    );
}

export default function StudentShow() {
    const { auth, student, activeSchoolYear, enrollment, subjectGrades } = usePage<PageProps>().props;
    const user = auth.user;
    const addr = student.address;
    const g = student.guardian;
    const docs = student.documents;

    const fullAddress = [
        addr?.street,
        addr?.barangay_name,
        addr?.city_name,
        addr?.province_name,
        addr?.region_name,
    ]
        .filter(Boolean)
        .join(', ');

    return (
        <AppLayout
            title="Student Details"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'Students', href: '/staff/students' },
                { label: 'Student Details' },
            ]}
        >
            <Head title="Student Details" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" className="size-8" onClick={() => router.visit('/staff/students')}>
                            <ArrowLeft className="size-4" />
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold">Student Details</h2>
                            <p className="text-muted-foreground text-sm">{student.full_name} &mdash; {student.student_id}</p>
                        </div>
                    </div>
                    <Badge variant={statusColors[student.status] ?? 'default'} className="w-fit capitalize">
                        {student.status}
                    </Badge>
                </div>

                {/* Tabbed content */}
                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="w-full justify-start">
                        <TabsTrigger value="info">Student Information</TabsTrigger>
                        <TabsTrigger value="parents">Parents & Guardian</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="grades">Grades</TabsTrigger>
                    </TabsList>

                    {/* Student Information Tab */}
                    <TabsContent value="info">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Personal Information</CardTitle>
                                </CardHeader>
                                <CardContent className="divide-y">
                                    <InfoRow label="First Name" value={student.first_name} />
                                    <InfoRow label="Middle Name" value={student.middle_name} />
                                    <InfoRow label="Last Name" value={student.last_name} />
                                    <InfoRow label="Gender" value={<span className="capitalize">{student.gender}</span>} />
                                    <InfoRow label="Birth Date" value={new Date(student.birth_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })} />
                                    <InfoRow label="Contact Number" value={student.contact_number} />
                                    <InfoRow label="Status" value={<Badge variant={statusColors[student.status] ?? 'default'} className="capitalize">{student.status}</Badge>} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Address</CardTitle>
                                </CardHeader>
                                <CardContent className="divide-y">
                                    <InfoRow label="Region" value={addr?.region_name} />
                                    <InfoRow label="Province" value={addr?.province_name} />
                                    <InfoRow label="City / Municipality" value={addr?.city_name} />
                                    <InfoRow label="Barangay" value={addr?.barangay_name} />
                                    <InfoRow label="Street" value={addr?.street} />
                                    <InfoRow label="Zip Code" value={addr?.zip_code} />
                                    <InfoRow label="Full Address" value={fullAddress || '—'} />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Parents & Guardian Tab */}
                    <TabsContent value="parents">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Father&apos;s Information</CardTitle>
                                </CardHeader>
                                <CardContent className="divide-y">
                                    <InfoRow label="Full Name" value={buildFullName(g?.father_first_name ?? null, g?.father_middle_name ?? null, g?.father_last_name ?? null)} />
                                    <InfoRow label="First Name" value={g?.father_first_name} />
                                    <InfoRow label="Middle Name" value={g?.father_middle_name} />
                                    <InfoRow label="Last Name" value={g?.father_last_name} />
                                    <InfoRow label="Contact" value={g?.father_contact} />
                                    <InfoRow label="Occupation" value={g?.father_occupation} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Mother&apos;s Information</CardTitle>
                                </CardHeader>
                                <CardContent className="divide-y">
                                    <InfoRow label="Full Name" value={buildFullName(g?.mother_first_name ?? null, g?.mother_middle_name ?? null, g?.mother_last_name ?? null)} />
                                    <InfoRow label="First Name" value={g?.mother_first_name} />
                                    <InfoRow label="Middle Name" value={g?.mother_middle_name} />
                                    <InfoRow label="Last Name" value={g?.mother_last_name} />
                                    <InfoRow label="Contact" value={g?.mother_contact} />
                                    <InfoRow label="Occupation" value={g?.mother_occupation} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Guardian Information</CardTitle>
                                </CardHeader>
                                <CardContent className="divide-y">
                                    <InfoRow label="Full Name" value={buildFullName(g?.guardian_first_name ?? null, g?.guardian_middle_name ?? null, g?.guardian_last_name ?? null)} />
                                    <InfoRow label="First Name" value={g?.guardian_first_name} />
                                    <InfoRow label="Middle Name" value={g?.guardian_middle_name} />
                                    <InfoRow label="Last Name" value={g?.guardian_last_name} />
                                    <InfoRow label="Contact" value={g?.guardian_contact} />
                                    <InfoRow label="Relationship" value={g?.guardian_relationship} />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Submitted Documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {docs?.not_yet_available ? (
                                    <div className="rounded-md border border-dashed p-4 text-center">
                                        <p className="text-muted-foreground text-sm">Documents are not yet available for this student.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        <DocumentCheck label="PSA / Birth Certificate" checked={docs?.birth_certificate ?? false} />
                                        <DocumentCheck label="Report Card (Form 138)" checked={docs?.report_card ?? false} />
                                        <DocumentCheck label="Good Moral Certificate" checked={docs?.good_moral ?? false} />
                                        <DocumentCheck label="School Card (Form 137)" checked={docs?.school_card ?? false} />
                                        <DocumentCheck label="2x2 ID Photos" checked={docs?.id_photos ?? false} />
                                        <DocumentCheck label="Medical Certificate" checked={docs?.medical_certificate ?? false} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Grades Tab */}
                    <TabsContent value="grades">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="size-5 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="text-base">Academic Grades</CardTitle>
                                            <CardDescription>
                                                {activeSchoolYear
                                                    ? `School Year ${activeSchoolYear}`
                                                    : 'No active school year'}
                                                {enrollment && (
                                                    <> &mdash; {enrollment.section_name} ({enrollment.year_level_name})</>
                                                )}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    {enrollment && subjectGrades.length > 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(`/staff/students/${student.id}/export-grades`, '_blank')}
                                        >
                                            <Download className="mr-1 size-4" />
                                            Export PDF
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!enrollment ? (
                                    <div className="rounded-md border border-dashed p-6 text-center">
                                        <p className="text-muted-foreground text-sm">
                                            This student is not enrolled in the active school year.
                                        </p>
                                    </div>
                                ) : subjectGrades.length === 0 ? (
                                    <div className="rounded-md border border-dashed p-6 text-center">
                                        <p className="text-muted-foreground text-sm">
                                            No subjects assigned to this section yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/50">
                                                    <th className="px-3 py-2 text-left font-medium">Subject</th>
                                                    <th className="px-3 py-2 text-left font-medium">Teacher</th>
                                                    <th className="px-3 py-2 text-center font-medium">Q1</th>
                                                    <th className="px-3 py-2 text-center font-medium">Q2</th>
                                                    <th className="px-3 py-2 text-center font-medium">Q3</th>
                                                    <th className="px-3 py-2 text-center font-medium">Q4</th>
                                                    <th className="px-3 py-2 text-center font-medium">Final</th>
                                                    <th className="px-3 py-2 text-left font-medium">Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {subjectGrades.map((sg) => (
                                                    <tr key={sg.subject_code} className="border-b">
                                                        <td className="px-3 py-2">
                                                            <span className="font-medium">{sg.subject_code}</span>
                                                            <span className="text-muted-foreground"> — {sg.subject_name}</span>
                                                        </td>
                                                        <td className="px-3 py-2 text-muted-foreground">{sg.teacher}</td>
                                                        {[sg.q1, sg.q2, sg.q3, sg.q4].map((grade, i) => (
                                                            <td key={i} className="px-3 py-2 text-center">
                                                                {grade !== null ? (
                                                                    <span className={grade < 75 ? 'font-medium text-destructive' : ''}>
                                                                        {grade}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground">—</span>
                                                                )}
                                                            </td>
                                                        ))}
                                                        <td className="px-3 py-2 text-center font-bold">
                                                            {sg.final_grade !== null ? (
                                                                <span className={sg.final_grade < 75 ? 'text-destructive' : ''}>
                                                                    {sg.final_grade}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-xs">
                                                            {sg.final_grade !== null
                                                                ? sg.final_grade >= 90
                                                                    ? 'Outstanding'
                                                                    : sg.final_grade >= 85
                                                                      ? 'Very Satisfactory'
                                                                      : sg.final_grade >= 80
                                                                        ? 'Satisfactory'
                                                                        : sg.final_grade >= 75
                                                                          ? 'Fairly Satisfactory'
                                                                          : 'Did Not Meet Expectations'
                                                                : ''}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            {(() => {
                                                const graded = subjectGrades.filter((s) => s.final_grade !== null);
                                                const avg = graded.length > 0
                                                    ? graded.reduce((sum, s) => sum + s.final_grade!, 0) / graded.length
                                                    : null;
                                                return (
                                                    <tfoot>
                                                        <tr className="bg-muted/50 font-bold">
                                                            <td className="px-3 py-2">General Average</td>
                                                            <td />
                                                            <td />
                                                            <td />
                                                            <td />
                                                            <td />
                                                            <td className="px-3 py-2 text-center">
                                                                {avg !== null ? avg.toFixed(2) : '—'}
                                                            </td>
                                                            <td className="px-3 py-2 text-xs font-normal">
                                                                {avg !== null
                                                                    ? Math.round(avg) >= 90
                                                                        ? 'Outstanding'
                                                                        : Math.round(avg) >= 85
                                                                          ? 'Very Satisfactory'
                                                                          : Math.round(avg) >= 80
                                                                            ? 'Satisfactory'
                                                                            : Math.round(avg) >= 75
                                                                              ? 'Fairly Satisfactory'
                                                                              : 'Did Not Meet Expectations'
                                                                    : ''}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                );
                                            })()}
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
