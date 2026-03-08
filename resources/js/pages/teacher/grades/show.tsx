import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, GraduationCap, Info, MoreHorizontal, Pencil, Plus, Save, Trash2, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { User } from '@/types';

// --- Types ---

interface StudentData {
    id: number;
    student_id: string;
    full_name: string;
    gender: string;
}

interface SectionData {
    id: number;
    name: string;
    year_level_name: string;
}

interface SubjectData {
    id: number;
    code: string;
    name: string;
}

interface GradeItemData {
    id: number;
    type: 'WW' | 'PT' | 'QA';
    name: string;
    max_score: number;
    sort_order: number;
}

interface Weights {
    ww: number;
    pt: number;
    qa: number;
}

type PageProps = {
    student: StudentData;
    section: SectionData;
    subject: SubjectData;
    quarter: number;
    gradeItems: GradeItemData[];
    scores: Record<string, number | null>; // itemId -> score
    weights: Weights;
    weightCategory: string;
    activeSchoolYear: string;
    auth: { user: User };
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

// DepEd Transmutation Table (DO No. 8, s. 2015)
function transmute(initialGrade: number): number {
    if (initialGrade >= 100) return 100;
    if (initialGrade >= 60) return Math.min(100, 75 + Math.floor((initialGrade - 60) / 1.6));
    if (initialGrade >= 0) return 60 + Math.floor(initialGrade / 4);
    return 60;
}

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

export default function TeacherGradeShow() {
    const {
        student,
        section,
        subject,
        quarter,
        gradeItems,
        scores: serverScores,
        weights,
        weightCategory,
        activeSchoolYear,
    } = usePage<PageProps>().props;

    // Local score state: { itemId: string }
    const [scoreData, setScoreData] = useState<Record<number, string>>(() => {
        const initial: Record<number, string> = {};
        gradeItems.forEach((item) => {
            const val = serverScores[item.id];
            initial[item.id] = val !== null && val !== undefined ? String(val) : '';
        });
        return initial;
    });

    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('WW');

    // Add/Edit item dialog
    const [itemDialogOpen, setItemDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<GradeItemData | null>(null);
    const [itemForm, setItemForm] = useState({ type: 'WW' as string, name: '', max_score: '' });
    const [itemSaving, setItemSaving] = useState(false);

    // Delete confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<GradeItemData | null>(null);

    const backUrl = `/teacher/grades?section_id=${section.id}&subject_id=${subject.id}&quarter=${quarter}`;

    // --- Score Input ---

    const setScore = (itemId: number, value: string) => {
        if (value === '' || /^\d{0,5}(\.\d{0,2})?$/.test(value)) {
            setScoreData((prev) => ({ ...prev, [itemId]: value }));
        }
    };

    // --- Item CRUD ---

    const openAddItem = (type: string) => {
        setEditingItem(null);
        setItemForm({ type, name: '', max_score: '' });
        setItemDialogOpen(true);
    };

    const openEditItem = (item: GradeItemData) => {
        setEditingItem(item);
        setItemForm({ type: item.type, name: item.name, max_score: String(item.max_score) });
        setItemDialogOpen(true);
    };

    const handleItemSubmit = () => {
        setItemSaving(true);

        if (editingItem) {
            router.put(`/teacher/grades/items/${editingItem.id}`, {
                name: itemForm.name,
                max_score: parseFloat(itemForm.max_score),
            }, {
                preserveScroll: true,
                onFinish: () => {
                    setItemSaving(false);
                    setItemDialogOpen(false);
                },
            });
        } else {
            router.post('/teacher/grades/items', {
                section_id: section.id,
                subject_id: subject.id,
                quarter,
                type: itemForm.type,
                name: itemForm.name,
                max_score: parseFloat(itemForm.max_score),
            }, {
                preserveScroll: true,
                onFinish: () => {
                    setItemSaving(false);
                    setItemDialogOpen(false);
                },
            });
        }
    };

    const handleDeleteItem = () => {
        if (!deletingItem) return;
        router.delete(`/teacher/grades/items/${deletingItem.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleteDialogOpen(false);
                setDeletingItem(null);
            },
        });
    };

    // --- Save Scores ---

    const handleSaveScores = () => {
        const scoresPayload: Record<number, Record<number, number | null>> = {};
        scoresPayload[student.id] = {};
        gradeItems.forEach((item) => {
            const val = scoreData[item.id];
            scoresPayload[student.id][item.id] = val !== '' && val !== undefined ? parseFloat(val) : null;
        });

        setSaving(true);
        router.post('/teacher/grades/scores', {
            section_id: section.id,
            subject_id: subject.id,
            quarter,
            scores: scoresPayload,
        }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    // --- Compute Grades ---

    const getItemsByType = (type: string) => gradeItems.filter((i) => i.type === type);

    const getComponentTotal = (type: string): { score: number; hps: number } => {
        const items = getItemsByType(type);
        let score = 0;
        let hps = 0;
        let hasAny = false;

        items.forEach((item) => {
            hps += item.max_score;
            const val = parseFloat(scoreData[item.id] ?? '');
            if (!isNaN(val)) {
                score += val;
                hasAny = true;
            }
        });

        return { score: hasAny ? score : 0, hps };
    };

    const getComponentPercent = (type: string): number | null => {
        const { score, hps } = getComponentTotal(type);
        if (hps <= 0) return null;
        return (score / hps) * 100;
    };

    const computeGrade = (): { initial: number | null; quarterly: number | null } => {
        const wwPercent = getComponentPercent('WW');
        const ptPercent = getComponentPercent('PT');
        const qaPercent = getComponentPercent('QA');

        if (wwPercent === null || ptPercent === null || qaPercent === null) {
            return { initial: null, quarterly: null };
        }

        const initial = (wwPercent * weights.ww + ptPercent * weights.pt + qaPercent * weights.qa) / 100;
        const quarterly = transmute(initial);
        return { initial: Math.round(initial * 100) / 100, quarterly };
    };

    const computed = computeGrade();

    // --- Component Tab Content ---

    const renderComponentTab = (type: 'WW' | 'PT' | 'QA') => {
        const items = getItemsByType(type);
        const { score: totalScore, hps: totalHps } = getComponentTotal(type);
        const percent = getComponentPercent(type);

        return (
            <div className="space-y-4">
                {/* Item management header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {items.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No {typeLabels[type]} items yet. Add one to start recording scores.</p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {items.length} item{items.length !== 1 ? 's' : ''} &middot; Total HPS: {items.reduce((sum, i) => sum + i.max_score, 0)}
                            </p>
                        )}
                    </div>
                    <Button size="sm" onClick={() => openAddItem(type)}>
                        <Plus className="mr-1 size-4" />
                        Add {typeLabels[type]}
                    </Button>
                </div>

                {/* Scores table */}
                {items.length > 0 && (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-10 text-center">#</TableHead>
                                            <TableHead className="min-w-[160px]">Activity</TableHead>
                                            <TableHead className="w-24 text-center">HPS</TableHead>
                                            <TableHead className="w-32 text-center">Score</TableHead>
                                            <TableHead className="w-16 text-center">%</TableHead>
                                            <TableHead className="w-12 text-center" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => {
                                            const val = parseFloat(scoreData[item.id] ?? '');
                                            const itemPercent = !isNaN(val) && item.max_score > 0 ? (val / item.max_score) * 100 : null;

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                                                    <TableCell className="font-medium">{item.name}</TableCell>
                                                    <TableCell className="text-center text-muted-foreground">{item.max_score}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            className="mx-auto h-8 w-24 text-center text-sm"
                                                            placeholder="—"
                                                            value={scoreData[item.id] ?? ''}
                                                            onChange={(e) => setScore(item.id, e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center text-sm">
                                                        {itemPercent !== null ? `${itemPercent.toFixed(1)}%` : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="size-7">
                                                                    <MoreHorizontal className="size-3.5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={() => openEditItem(item)}>
                                                                    <Pencil className="mr-2 size-3" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => {
                                                                        setDeletingItem(item);
                                                                        setDeleteDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Trash2 className="mr-2 size-3" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {/* Totals Row */}
                                        <TableRow className="bg-muted/50 font-medium">
                                            <TableCell />
                                            <TableCell className="font-semibold">Total</TableCell>
                                            <TableCell className="text-center">{totalHps}</TableCell>
                                            <TableCell className="text-center">{totalScore > 0 ? totalScore : '—'}</TableCell>
                                            <TableCell className="text-center">
                                                {percent !== null ? (
                                                    <span className="font-semibold">{percent.toFixed(1)}%</span>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell />
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    return (
        <AppLayout
            title={`Grades - ${student.full_name}`}
            breadcrumbs={[
                { label: 'Home', href: '/teacher/dashboard' },
                { label: 'Grades', href: backUrl },
                { label: student.full_name },
            ]}
        >
            <Head title={`Grades - ${student.full_name}`} />

            <div className="space-y-6">
                {/* Back + Header */}
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
                                {student.student_id} &middot; {section.name} ({section.year_level_name}) &middot; {subject.code} — {subject.name} &middot; {quarterLabels[quarter]}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="size-4" />
                        SY: <span className="font-medium text-foreground">{activeSchoolYear}</span>
                    </div>
                </div>

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

                {/* Grade Summary Stat Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <div className="rounded-lg bg-muted p-2 text-primary">
                                <Pencil className="size-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">
                                    {getComponentPercent('WW') !== null ? `${getComponentPercent('WW')!.toFixed(1)}%` : '—'}
                                </p>
                                <p className="text-xs text-muted-foreground">Written Work ({weights.ww}%)</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <div className="rounded-lg bg-muted p-2 text-blue-600">
                                <ClipboardList className="size-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">
                                    {getComponentPercent('PT') !== null ? `${getComponentPercent('PT')!.toFixed(1)}%` : '—'}
                                </p>
                                <p className="text-xs text-muted-foreground">Performance Task ({weights.pt}%)</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <div className="rounded-lg bg-muted p-2 text-amber-600">
                                <ClipboardList className="size-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">
                                    {getComponentPercent('QA') !== null ? `${getComponentPercent('QA')!.toFixed(1)}%` : '—'}
                                </p>
                                <p className="text-xs text-muted-foreground">Quarterly Assessment ({weights.qa}%)</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                                <TrendingUp className="size-4" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-muted-foreground">
                                    {computed.initial !== null ? computed.initial.toFixed(2) : '—'}
                                </p>
                                <p className="text-xs text-muted-foreground">Initial Grade</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-6">
                            <div className={`rounded-lg bg-muted p-2 ${computed.quarterly !== null && computed.quarterly >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                                <GraduationCap className="size-4" />
                            </div>
                            <div>
                                <p className={`text-xl font-bold ${getGradeColor(computed.quarterly)}`}>
                                    {computed.quarterly !== null ? computed.quarterly : '—'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {computed.quarterly !== null ? getGradeLabel(computed.quarterly) : 'Quarterly Grade'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs: WW | PT | QA | Summary */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="WW">
                            Written Work
                            <Badge variant="secondary" className="ml-1 text-[10px]">{getItemsByType('WW').length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="PT">
                            Performance Task
                            <Badge variant="secondary" className="ml-1 text-[10px]">{getItemsByType('PT').length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="QA">
                            Quarterly Assessment
                            <Badge variant="secondary" className="ml-1 text-[10px]">{getItemsByType('QA').length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                    </TabsList>

                    <TabsContent value="WW">{renderComponentTab('WW')}</TabsContent>
                    <TabsContent value="PT">{renderComponentTab('PT')}</TabsContent>
                    <TabsContent value="QA">{renderComponentTab('QA')}</TabsContent>

                    {/* Summary Tab */}
                    <TabsContent value="summary">
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="min-w-[120px]">Component</TableHead>
                                                <TableHead className="w-20 text-center">Weight</TableHead>
                                                <TableHead className="w-20 text-center">Score</TableHead>
                                                <TableHead className="w-20 text-center">HPS</TableHead>
                                                <TableHead className="w-20 text-center">%</TableHead>
                                                <TableHead className="w-24 text-center">Weighted</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(['WW', 'PT', 'QA'] as const).map((type) => {
                                                const { score, hps } = getComponentTotal(type);
                                                const percent = getComponentPercent(type);
                                                const weight = type === 'WW' ? weights.ww : type === 'PT' ? weights.pt : weights.qa;
                                                const weighted = percent !== null ? (percent * weight) / 100 : null;

                                                return (
                                                    <TableRow key={type}>
                                                        <TableCell className="font-medium">{typeLabels[type]}</TableCell>
                                                        <TableCell className="text-center">{weight}%</TableCell>
                                                        <TableCell className="text-center">{score > 0 ? score : '—'}</TableCell>
                                                        <TableCell className="text-center text-muted-foreground">{hps > 0 ? hps : '—'}</TableCell>
                                                        <TableCell className="text-center">
                                                            {percent !== null ? `${percent.toFixed(1)}%` : '—'}
                                                        </TableCell>
                                                        <TableCell className="text-center font-medium">
                                                            {weighted !== null ? weighted.toFixed(2) : '—'}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            <TableRow className="bg-muted/50 font-semibold">
                                                <TableCell>Initial Grade</TableCell>
                                                <TableCell className="text-center">100%</TableCell>
                                                <TableCell />
                                                <TableCell />
                                                <TableCell />
                                                <TableCell className="text-center">
                                                    {computed.initial !== null ? computed.initial.toFixed(2) : '—'}
                                                </TableCell>
                                            </TableRow>
                                            <TableRow className="bg-muted font-bold">
                                                <TableCell>Quarterly Grade</TableCell>
                                                <TableCell />
                                                <TableCell />
                                                <TableCell />
                                                <TableCell />
                                                <TableCell className="text-center">
                                                    <span className={getGradeColor(computed.quarterly)}>
                                                        {computed.quarterly !== null ? computed.quarterly : '—'}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Save Scores */}
                <div className="flex justify-end">
                    <Button onClick={handleSaveScores} disabled={saving || gradeItems.length === 0}>
                        <Save className="mr-1 size-4" />
                        {saving ? 'Saving...' : 'Save Scores'}
                    </Button>
                </div>
            </div>

            {/* Add/Edit Item Dialog */}
            <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Score Item' : 'Add Score Item'}</DialogTitle>
                        <DialogDescription>
                            {editingItem
                                ? 'Update the name or highest possible score for this item.'
                                : 'Create a new scoring activity for this component.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {!editingItem && (
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={itemForm.type} onValueChange={(v) => setItemForm((f) => ({ ...f, type: v }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WW">Written Work</SelectItem>
                                        <SelectItem value="PT">Performance Task</SelectItem>
                                        <SelectItem value="QA">Quarterly Assessment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                placeholder="e.g. Quiz 1, Project 1, Quarterly Exam"
                                value={itemForm.name}
                                onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Highest Possible Score (HPS)</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="e.g. 50"
                                value={itemForm.max_score}
                                onChange={(e) => setItemForm((f) => ({ ...f, max_score: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleItemSubmit}
                            disabled={itemSaving || !itemForm.name.trim() || !itemForm.max_score || parseFloat(itemForm.max_score) <= 0}
                        >
                            {itemSaving ? 'Saving...' : editingItem ? 'Update' : 'Add Item'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Score Item</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{deletingItem?.name}&quot;? This will also delete the student&apos;s score for this item. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteItem}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
