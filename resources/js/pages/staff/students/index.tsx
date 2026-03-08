import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from '@/components/confirm-modal';
import DataTable, { type Column, type Filter } from '@/components/data-table';
import PhAddressPicker, { type AddressData } from '@/components/ph-address-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { Student, User } from '@/types';

type PageProps = {
    auth: { user: User };
    students: Student[];
};

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    inactive: 'secondary',
    graduated: 'outline',
    transferred: 'destructive',
};

export default function StudentIndex() {
    const { auth, students } = usePage<PageProps>().props;
    const user = auth.user;

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Student | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
    const [step, setStep] = useState(1);

    const emptyAddress: AddressData = {
        region_code: '',
        region_name: '',
        province_code: '',
        province_name: '',
        city_code: '',
        city_name: '',
        barangay_code: '',
        barangay_name: '',
        street: '',
        zip_code: '',
    };

    const form = useForm({
        student_id: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        gender: 'male' as 'male' | 'female',
        birth_date: '',
        contact_number: '',
        status: '' as string,
        ...emptyAddress,
        // Parent / Guardian
        father_first_name: '',
        father_middle_name: '',
        father_last_name: '',
        father_contact: '',
        father_occupation: '',
        mother_first_name: '',
        mother_middle_name: '',
        mother_last_name: '',
        mother_contact: '',
        mother_occupation: '',
        guardian_first_name: '',
        guardian_middle_name: '',
        guardian_last_name: '',
        guardian_contact: '',
        guardian_relationship: '',
        // Documents
        birth_certificate: false,
        report_card: false,
        good_moral: false,
        school_card: false,
        id_photos: false,
        medical_certificate: false,
        not_yet_available: false,
    });

    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

    const validateStep = (currentStep: number): boolean => {
        const errors: Record<string, string> = {};

        if (currentStep === 1) {
            if (!form.data.student_id.trim()) {
                errors.student_id = 'Student ID is required.';
            } else {
                const duplicate = students.find(
                    (s) => s.student_id === form.data.student_id.trim() && s.id !== editing?.id,
                );
                if (duplicate) errors.student_id = 'This Student ID already exists.';
            }
            if (!form.data.first_name.trim()) errors.first_name = 'First name is required.';
            if (!form.data.last_name.trim()) errors.last_name = 'Last name is required.';
            if (!form.data.gender) errors.gender = 'Gender is required.';
            if (!form.data.birth_date) errors.birth_date = 'Birth date is required.';
        }

        setStepErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const addressValue: AddressData = {
        region_code: form.data.region_code,
        region_name: form.data.region_name,
        province_code: form.data.province_code,
        province_name: form.data.province_name,
        city_code: form.data.city_code,
        city_name: form.data.city_name,
        barangay_code: form.data.barangay_code,
        barangay_name: form.data.barangay_name,
        street: form.data.street,
        zip_code: form.data.zip_code,
    };

    const handleAddressChange = (data: AddressData) => {
        form.setData((prev) => ({ ...prev, ...data }));
    };

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setStepErrors({});
        setEditing(null);
        setStep(1);
        setModalOpen(true);
    };

    const openEdit = (student: Student) => {
        setEditing(student);
        const addr = student.address;
        const g = student.guardian;
        const d = student.documents;
        form.setData({
            student_id: student.student_id,
            first_name: student.first_name,
            last_name: student.last_name,
            middle_name: student.middle_name ?? '',
            gender: student.gender,
            birth_date: student.birth_date.split('T')[0],
            contact_number: student.contact_number ?? '',
            status: student.status,
            region_code: addr?.region_code ?? '',
            region_name: addr?.region_name ?? '',
            province_code: addr?.province_code ?? '',
            province_name: addr?.province_name ?? '',
            city_code: addr?.city_code ?? '',
            city_name: addr?.city_name ?? '',
            barangay_code: addr?.barangay_code ?? '',
            barangay_name: addr?.barangay_name ?? '',
            street: addr?.street ?? '',
            zip_code: addr?.zip_code ?? '',
            father_first_name: g?.father_first_name ?? '',
            father_middle_name: g?.father_middle_name ?? '',
            father_last_name: g?.father_last_name ?? '',
            father_contact: g?.father_contact ?? '',
            father_occupation: g?.father_occupation ?? '',
            mother_first_name: g?.mother_first_name ?? '',
            mother_middle_name: g?.mother_middle_name ?? '',
            mother_last_name: g?.mother_last_name ?? '',
            mother_contact: g?.mother_contact ?? '',
            mother_occupation: g?.mother_occupation ?? '',
            guardian_first_name: g?.guardian_first_name ?? '',
            guardian_middle_name: g?.guardian_middle_name ?? '',
            guardian_last_name: g?.guardian_last_name ?? '',
            guardian_contact: g?.guardian_contact ?? '',
            guardian_relationship: g?.guardian_relationship ?? '',
            birth_certificate: d?.birth_certificate ?? false,
            report_card: d?.report_card ?? false,
            good_moral: d?.good_moral ?? false,
            school_card: d?.school_card ?? false,
            id_photos: d?.id_photos ?? false,
            medical_certificate: d?.medical_certificate ?? false,
            not_yet_available: d?.not_yet_available ?? false,
        });
        form.clearErrors();
        setStepErrors({});
        setStep(1);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setStep(1);
        setStepErrors({});
        form.reset();
        form.clearErrors();
    };

    const handleSubmit = () => {
        if (editing) {
            form.put(`/staff/students/${editing.id}`, {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else {
            form.post('/staff/students', {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/staff/students/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const columns: Column<Student>[] = [
        {
            key: '#',
            label: '#',
            className: 'w-12',
            render: (_item, index) => index + 1,
        },
        { key: 'student_id', label: 'Student ID' },
        {
            key: 'full_name',
            label: 'Name',
            render: (item) => item.full_name,
        },
        {
            key: 'gender',
            label: 'Gender',
            render: (item) => (
                <span className="capitalize">{item.gender}</span>
            ),
        },
        {
            key: 'birth_date',
            label: 'Birth Date',
            render: (item) => new Date(item.birth_date).toLocaleDateString(),
        },
        {
            key: 'contact_number',
            label: 'Contact',
            render: (item) => item.contact_number || '—',
        },
        {
            key: 'status',
            label: 'Status',
            render: (item) => (
                <Badge variant={statusColors[item.status] ?? 'default'}>
                    {item.status}
                </Badge>
            ),
        },
        {
            key: 'document_complete',
            label: 'Documents',
            className: 'w-28',
            render: (item) => (
                <Badge variant={item.document_complete ? 'default' : 'destructive'}>
                    {item.document_complete ? 'Complete' : 'Incomplete'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            className: 'w-28',
            render: (item) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => router.visit(`/staff/students/${item.id}`)}>
                        <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(item)}>
                        <Pencil className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const filters: Filter<Student>[] = [
        {
            key: 'status',
            label: 'Status',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Graduated', value: 'graduated' },
                { label: 'Transferred', value: 'transferred' },
            ],
        },
        {
            key: 'gender',
            label: 'Gender',
            options: [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
            ],
        },
        {
            key: 'document_complete',
            label: 'Documents',
            options: [
                { label: 'Complete', value: 'true' },
                { label: 'Incomplete', value: 'false' },
            ],
        },
    ];

    return (
        <AppLayout
            title="Students"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'Students' },
            ]}
        >
            <Head title="Students" />

            <DataTable
                columns={columns}
                data={students}
                searchable
                searchKeys={['student_id', 'first_name', 'last_name', 'full_name']}
                searchPlaceholder="Search students..."
                filters={filters}
                onAdd={openCreate}
                addLabel="Add Student"
            />

            <Dialog open={modalOpen} onOpenChange={(v) => !v && closeModal()}>
                <DialogContent className="sm:max-w-3xl">
                    <div className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Student' : 'Add Student'}</DialogTitle>
                            <DialogDescription>
                                Step {step} of 3 — {step === 1 ? 'Student Information & Address' : step === 2 ? 'Parent & Guardian Information' : 'Student Documents'}
                            </DialogDescription>
                            {/* Step indicator */}
                            <div className="flex items-center gap-2 pt-2">
                                <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
                                <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                                <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
                            </div>
                        </DialogHeader>

                        <div className="space-y-4">
                            {step === 1 && (
                                <>
                                    {/* Row 1: Student ID */}
                                    <div className="space-y-2">
                                        <Label htmlFor="student_id">Student ID</Label>
                                        <Input
                                            id="student_id"
                                            value={form.data.student_id}
                                            onChange={(e) => form.setData('student_id', e.target.value)}
                                            placeholder="e.g. 2025-0001"
                                        />
                                        {(stepErrors.student_id || form.errors.student_id) && <p className="text-xs text-destructive">{stepErrors.student_id || form.errors.student_id}</p>}
                                    </div>

                                    {/* Row 2: First Name, Middle Name, Last Name */}
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="first_name">First Name</Label>
                                            <Input
                                                id="first_name"
                                                value={form.data.first_name}
                                                onChange={(e) => form.setData('first_name', e.target.value)}
                                            />
                                            {(stepErrors.first_name || form.errors.first_name) && <p className="text-xs text-destructive">{stepErrors.first_name || form.errors.first_name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="middle_name">Middle Name</Label>
                                            <Input
                                                id="middle_name"
                                                value={form.data.middle_name}
                                                onChange={(e) => form.setData('middle_name', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="last_name">Last Name</Label>
                                            <Input
                                                id="last_name"
                                                value={form.data.last_name}
                                                onChange={(e) => form.setData('last_name', e.target.value)}
                                            />
                                            {(stepErrors.last_name || form.errors.last_name) && <p className="text-xs text-destructive">{stepErrors.last_name || form.errors.last_name}</p>}
                                        </div>
                                    </div>

                                    {/* Row 3: Gender, Birth Date, Contact */}
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="gender">Gender</Label>
                                            <Select value={form.data.gender} onValueChange={(v) => form.setData('gender', v as 'male' | 'female')}>
                                                <SelectTrigger id="gender">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {(stepErrors.gender || form.errors.gender) && <p className="text-xs text-destructive">{stepErrors.gender || form.errors.gender}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="birth_date">Birth Date</Label>
                                            <Input
                                                id="birth_date"
                                                type="date"
                                                value={form.data.birth_date}
                                                onChange={(e) => form.setData('birth_date', e.target.value)}
                                            />
                                            {(stepErrors.birth_date || form.errors.birth_date) && <p className="text-xs text-destructive">{stepErrors.birth_date || form.errors.birth_date}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contact_number">Contact Number</Label>
                                            <Input
                                                id="contact_number"
                                                value={form.data.contact_number}
                                                onChange={(e) => form.setData('contact_number', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Address (cascading PH picker) */}
                                    <div className="space-y-2">
                                        <Label className="text-base font-semibold">Address</Label>
                                        <PhAddressPicker
                                            value={addressValue}
                                            onChange={handleAddressChange}
                                            errors={form.errors as Partial<Record<keyof AddressData, string>>}
                                        />
                                    </div>

                                    {/* Status (edit only) */}
                                    {editing && (
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Select value={form.data.status} onValueChange={(v) => form.setData('status', v)}>
                                                <SelectTrigger id="status">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                    <SelectItem value="graduated">Graduated</SelectItem>
                                                    <SelectItem value="transferred">Transferred</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    {/* Father's Information */}
                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold">Father&apos;s Information</Label>
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="father_first_name">First Name</Label>
                                                <Input
                                                    id="father_first_name"
                                                    value={form.data.father_first_name}
                                                    onChange={(e) => form.setData('father_first_name', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="father_middle_name">Middle Name</Label>
                                                <Input
                                                    id="father_middle_name"
                                                    value={form.data.father_middle_name}
                                                    onChange={(e) => form.setData('father_middle_name', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="father_last_name">Last Name</Label>
                                                <Input
                                                    id="father_last_name"
                                                    value={form.data.father_last_name}
                                                    onChange={(e) => form.setData('father_last_name', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="father_contact">Contact Number</Label>
                                                <Input
                                                    id="father_contact"
                                                    value={form.data.father_contact}
                                                    onChange={(e) => form.setData('father_contact', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="father_occupation">Occupation</Label>
                                                <Input
                                                    id="father_occupation"
                                                    value={form.data.father_occupation}
                                                    onChange={(e) => form.setData('father_occupation', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mother's Information */}
                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold">Mother&apos;s Information</Label>
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="mother_first_name">First Name</Label>
                                                <Input
                                                    id="mother_first_name"
                                                    value={form.data.mother_first_name}
                                                    onChange={(e) => form.setData('mother_first_name', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="mother_middle_name">Middle Name</Label>
                                                <Input
                                                    id="mother_middle_name"
                                                    value={form.data.mother_middle_name}
                                                    onChange={(e) => form.setData('mother_middle_name', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="mother_last_name">Last Name</Label>
                                                <Input
                                                    id="mother_last_name"
                                                    value={form.data.mother_last_name}
                                                    onChange={(e) => form.setData('mother_last_name', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="mother_contact">Contact Number</Label>
                                                <Input
                                                    id="mother_contact"
                                                    value={form.data.mother_contact}
                                                    onChange={(e) => form.setData('mother_contact', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="mother_occupation">Occupation</Label>
                                                <Input
                                                    id="mother_occupation"
                                                    value={form.data.mother_occupation}
                                                    onChange={(e) => form.setData('mother_occupation', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Guardian (optional) */}
                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold">Guardian <span className="text-sm font-normal text-muted-foreground">(optional — if parents are not available)</span></Label>
                                        <div className="grid gap-4 sm:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="guardian_first_name">First Name</Label>
                                                <Input
                                                    id="guardian_first_name"
                                                    value={form.data.guardian_first_name}
                                                    onChange={(e) => form.setData('guardian_first_name', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="guardian_middle_name">Middle Name</Label>
                                                <Input
                                                    id="guardian_middle_name"
                                                    value={form.data.guardian_middle_name}
                                                    onChange={(e) => form.setData('guardian_middle_name', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="guardian_last_name">Last Name</Label>
                                                <Input
                                                    id="guardian_last_name"
                                                    value={form.data.guardian_last_name}
                                                    onChange={(e) => form.setData('guardian_last_name', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="guardian_contact">Contact Number</Label>
                                                <Input
                                                    id="guardian_contact"
                                                    value={form.data.guardian_contact}
                                                    onChange={(e) => form.setData('guardian_contact', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="guardian_relationship">Relationship</Label>
                                                <Input
                                                    id="guardian_relationship"
                                                    value={form.data.guardian_relationship}
                                                    onChange={(e) => form.setData('guardian_relationship', e.target.value)}
                                                    placeholder="e.g. Uncle, Aunt, Grandparent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <div className="space-y-3">
                                        <Label className="text-base font-semibold">Student Documents</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Check the documents that the student has submitted.
                                        </p>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {([
                                                { key: 'birth_certificate', label: 'PSA / Birth Certificate' },
                                                { key: 'report_card', label: 'Report Card (Form 138)' },
                                                { key: 'good_moral', label: 'Good Moral Certificate' },
                                                { key: 'school_card', label: 'School Card (Form 137)' },
                                                { key: 'id_photos', label: '2x2 ID Photos' },
                                                { key: 'medical_certificate', label: 'Medical Certificate' },
                                            ] as const).map(({ key, label }) => (
                                                <div key={key} className="flex items-center gap-3 rounded-md border p-3">
                                                    <Checkbox
                                                        id={key}
                                                        checked={form.data[key]}
                                                        onCheckedChange={(checked) => form.setData(key, !!checked)}
                                                        disabled={form.data.not_yet_available}
                                                    />
                                                    <Label htmlFor={key} className="cursor-pointer font-normal">
                                                        {label}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Not Yet Available toggle */}
                                    <div className="flex items-center gap-3 rounded-md border border-dashed p-3">
                                        <Checkbox
                                            id="not_yet_available"
                                            checked={form.data.not_yet_available}
                                            onCheckedChange={(checked) => {
                                                const val = !!checked;
                                                form.setData((prev) => ({
                                                    ...prev,
                                                    not_yet_available: val,
                                                    ...(val ? {
                                                        birth_certificate: false,
                                                        report_card: false,
                                                        good_moral: false,
                                                        school_card: false,
                                                        id_photos: false,
                                                        medical_certificate: false,
                                                    } : {}),
                                                }));
                                            }}
                                        />
                                        <Label htmlFor="not_yet_available" className="cursor-pointer font-normal">
                                            Documents not yet available
                                            <span className="ml-1 text-xs text-muted-foreground">(uncheck all and mark as pending)</span>
                                        </Label>
                                    </div>
                                </>
                            )}
                        </div>

                        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                            <div className="flex gap-2">
                                {step > 1 && (
                                    <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                                        <ChevronLeft className="mr-1 size-4" />
                                        Back
                                    </Button>
                                )}
                                {step === 1 && (
                                    <Button type="button" variant="outline" onClick={closeModal} disabled={form.processing}>
                                        Cancel
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {editing && step < 3 && (
                                    <Button type="button" variant="secondary" disabled={form.processing} onClick={() => {
                                        if (validateStep(step)) handleSubmit();
                                    }}>
                                        {form.processing ? 'Saving...' : 'Update'}
                                    </Button>
                                )}
                                {step < 3 ? (
                                    <Button type="button" onClick={() => {
                                        if (validateStep(step)) setStep(step + 1);
                                    }}>
                                        Next
                                        <ChevronRight className="ml-1 size-4" />
                                    </Button>
                                ) : (
                                    <Button type="button" disabled={form.processing} onClick={handleSubmit}>
                                        {form.processing ? 'Saving...' : editing ? 'Update' : 'Create'}
                                    </Button>
                                )}
                            </div>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Student"
                description={`Are you sure you want to delete "${deleteTarget?.full_name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="destructive"
            />
        </AppLayout>
    );
}
