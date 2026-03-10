import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useState } from 'react';
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
import StudentLayout from '@/layouts/student-layout';
import type { User } from '@/types';

interface SubjectData {
    id: number;
    code: string;
    name: string;
}

interface SectionData {
    name: string;
    year_level: string | null;
}

interface GradeItemData {
    id: number;
    type: 'WW' | 'PT' | 'QA';
    name: string;
    max_score: number;
}

interface TypeSummary {
    total_score: number;
    total_max: number;
    percentage: number | null;
}

interface Weights {
    ww: number;
    pt: number;
    qa: number;
}

type PageProps = {
    auth: { user: User };
    subject: SubjectData;
    section: SectionData;
    quarter: number;
    gradeItems: GradeItemData[];
    scores: Record<string, number | null>;
    summary: Record<string, TypeSummary>;
    weights: Weights;
    weightCategory: string;
    initialGrade: number | null;
    quarterlyGrade: number | null;
    activeSchoolYear: string;
};

const typeLabels: Record<string, string> = {
    WW: 'Written Work',
    PT: 'Performance Task',
    QA: 'Quarterly Assessment',
};

const categoryLabels: Record<string, string> = {
    default: 'Language / Social Science / Values',
    performance: 'MAPEH / TLE / EPP / TVL',
    stem: 'Math / Science',
};

const quarterLabels: Record<number, string> = {
    1: '1st Quarter',
    2: '2nd Quarter',
    3: '3rd Quarter',
    4: '4th Quarter',
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
    if (grade === null) return 'No grades yet';
    if (grade >= 90) return 'Outstanding';
    if (grade >= 85) return 'Very Satisfactory';
    if (grade >= 80) return 'Satisfactory';
    if (grade >= 75) return 'Fairly Satisfactory';
    return 'Did Not Meet Expectations';
}

export default function StudentSubjectShow() {
    const {
        subject,
        section,
        quarter,
        gradeItems,
        scores,
        summary,
        weights,
        weightCategory,
        initialGrade,
        quarterlyGrade,
        activeSchoolYear,
    } = usePage<PageProps>().props;

    const [activeTab, setActiveTab] = useState<string>('WW');

    const itemsByType = {
        WW: gradeItems.filter((i) => i.type === 'WW'),
        PT: gradeItems.filter((i) => i.type === 'PT'),
        QA: gradeItems.filter((i) => i.type === 'QA'),
    };

    function renderTypeTable(type: 'WW' | 'PT' | 'QA') {
        const items = itemsByType[type];
        const typeSummary = summary[type];

        if (items.length === 0) {
            return (
                <div className="flex h-32 items-center justify-center">
                    <p className="text-sm text-muted-foreground">No {typeLabels[type].toLowerCase()} items yet.</p>
                </div>
            );
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">HPS</TableHead>
                        <TableHead className="text-center">%</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, idx) => {
                        const score = scores[item.id];
                        const pct = score !== null && score !== undefined ? ((score / item.max_score) * 100).toFixed(1) : null;

                        return (
                            <TableRow key={item.id}>
                                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-center">
                                    {score !== null && score !== undefined ? (
                                        <span className="font-medium">{score}</span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">{item.max_score}</TableCell>
                                <TableCell className="text-center">
                                    {pct !== null ? (
                                        <span className={Number(pct) >= 75 ? 'text-green-600' : 'text-red-600'}>
                                            {pct}%
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}

                    {/* Totals row */}
                    <TableRow className="border-t-2 font-semibold">
                        <TableCell />
                        <TableCell>Total</TableCell>
                        <TableCell className="text-center">{typeSummary.total_score}</TableCell>
                        <TableCell className="text-center">{typeSummary.total_max}</TableCell>
                        <TableCell className="text-center">
                            {typeSummary.percentage !== null ? (
                                <span className={typeSummary.percentage >= 75 ? 'text-green-600' : 'text-red-600'}>
                                    {typeSummary.percentage}%
                                </span>
                            ) : (
                                <span className="text-muted-foreground">—</span>
                            )}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        );
    }

    return (
        <StudentLayout>
            <Head title={`${subject.name} — Grades`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/student/dashboard">
                            <Button variant="ghost" size="icon" className="size-8">
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold">{subject.name}</h1>
                            <p className="text-sm text-muted-foreground">
                                {subject.code} &middot; {section.name}{section.year_level ? ` — ${section.year_level}` : ''} &middot; S.Y. {activeSchoolYear}
                            </p>
                        </div>
                    </div>

                    {/* Quarter selector */}
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4].map((q) => (
                            <Link
                                key={q}
                                href={`/student/subjects/${subject.id}?quarter=${q}`}
                                preserveState
                            >
                                <Button
                                    variant={q === quarter ? 'default' : 'outline'}
                                    size="sm"
                                >
                                    Q{q}
                                </Button>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {(['WW', 'PT', 'QA'] as const).map((type) => (
                        <Card key={type}>
                            <CardContent className="pt-4 pb-4">
                                <p className="text-xs text-muted-foreground">{typeLabels[type]} ({weights[type.toLowerCase() as keyof Weights]}%)</p>
                                <p className={`text-2xl font-bold ${summary[type].percentage !== null && summary[type].percentage! < 75 ? 'text-red-600' : ''}`}>
                                    {summary[type].percentage !== null ? `${summary[type].percentage}%` : '—'}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-muted-foreground">Initial Grade</p>
                            <p className="text-2xl font-bold">
                                {initialGrade !== null ? initialGrade : '—'}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4 pb-4">
                            <p className="text-xs text-muted-foreground">Quarterly Grade</p>
                            <p className={`text-2xl font-bold ${getGradeColor(quarterlyGrade)}`}>
                                {quarterlyGrade !== null ? quarterlyGrade : '—'}
                            </p>
                            <p className="text-xs text-muted-foreground">{getGradeLabel(quarterlyGrade)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Weight info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BookOpen className="size-3.5" />
                    <span>
                        Weight category: <strong className="capitalize">{categoryLabels[weightCategory] ?? weightCategory}</strong>
                        {' '}— WW: {weights.ww}%, PT: {weights.pt}%, QA: {weights.qa}%
                    </span>
                </div>

                {/* Tabs: WW / PT / QA / Summary */}
                <Card>
                    <CardContent className="pt-6">
                        <Tabs defaultValue="WW" value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="h-auto w-full flex-wrap justify-start">
                                <TabsTrigger value="WW">
                                    <span className="hidden sm:inline">Written Work</span>
                                    <span className="sm:hidden">WW</span>
                                    <Badge variant="secondary" className="ml-1.5">{itemsByType.WW.length}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="PT">
                                    <span className="hidden sm:inline">Performance Task</span>
                                    <span className="sm:hidden">PT</span>
                                    <Badge variant="secondary" className="ml-1.5">{itemsByType.PT.length}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="QA">
                                    <span className="hidden sm:inline">Quarterly Assessment</span>
                                    <span className="sm:hidden">QA</span>
                                    <Badge variant="secondary" className="ml-1.5">{itemsByType.QA.length}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="summary">Summary</TabsTrigger>
                            </TabsList>

                            <TabsContent value="WW" className="mt-4">
                                {renderTypeTable('WW')}
                            </TabsContent>
                            <TabsContent value="PT" className="mt-4">
                                {renderTypeTable('PT')}
                            </TabsContent>
                            <TabsContent value="QA" className="mt-4">
                                {renderTypeTable('QA')}
                            </TabsContent>
                            <TabsContent value="summary" className="mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Component</TableHead>
                                            <TableHead className="text-center">Weight</TableHead>
                                            <TableHead className="text-center">Score</TableHead>
                                            <TableHead className="text-center">HPS</TableHead>
                                            <TableHead className="text-center">Percentage</TableHead>
                                            <TableHead className="text-center">Weighted Score</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(['WW', 'PT', 'QA'] as const).map((type) => {
                                            const s = summary[type];
                                            const weight = weights[type.toLowerCase() as keyof Weights];
                                            const weighted = s.percentage !== null ? ((s.percentage * weight) / 100).toFixed(2) : null;

                                            return (
                                                <TableRow key={type}>
                                                    <TableCell className="font-medium">{typeLabels[type]}</TableCell>
                                                    <TableCell className="text-center">{weight}%</TableCell>
                                                    <TableCell className="text-center">{s.total_score}</TableCell>
                                                    <TableCell className="text-center">{s.total_max}</TableCell>
                                                    <TableCell className="text-center">
                                                        {s.percentage !== null ? `${s.percentage}%` : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {weighted !== null ? weighted : '—'}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}

                                        {/* Initial Grade row */}
                                        <TableRow className="border-t-2 font-semibold">
                                            <TableCell colSpan={5} className="text-right">
                                                Initial Grade
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {initialGrade !== null ? initialGrade : '—'}
                                            </TableCell>
                                        </TableRow>

                                        {/* Quarterly Grade row */}
                                        <TableRow className="font-bold">
                                            <TableCell colSpan={5} className="text-right">
                                                Quarterly Grade
                                            </TableCell>
                                            <TableCell className={`text-center ${getGradeColor(quarterlyGrade)}`}>
                                                {quarterlyGrade !== null ? quarterlyGrade : '—'}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>

                                {quarterlyGrade !== null && (
                                    <div className="mt-4 flex justify-center">
                                        <Badge
                                            variant={quarterlyGrade >= 75 ? 'default' : 'destructive'}
                                            className="text-sm"
                                        >
                                            {getGradeLabel(quarterlyGrade)}
                                        </Badge>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </StudentLayout>
    );
}
