<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\SchoolYear;
use App\Models\Section;
use App\Models\Student;
use App\Models\YearLevel;
use Illuminate\Http\Request;
use App\Services\Pdf\BasePdf;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('staff/reports/index', [
            'schoolYears' => SchoolYear::orderByDesc('start_date')
                ->get()
                ->map(fn ($sy) => ['value' => (string) $sy->id, 'label' => $sy->name]),
            'sections' => Section::with('yearLevel')
                ->orderBy('name')
                ->get()
                ->map(fn ($s) => [
                    'value' => (string) $s->id,
                    'label' => $s->name,
                    'yearLevel' => $s->yearLevel?->name,
                ]),
            'yearLevels' => YearLevel::where('status', 'active')
                ->orderBy('order')
                ->get()
                ->map(fn ($yl) => ['value' => (string) $yl->id, 'label' => $yl->name]),

        ]);
    }

    /**
     * Student Master List – all students or filtered by status.
     */
    public function studentList(Request $request)
    {
        $status = $request->query('status');
        $schoolYearId = $request->query('school_year_id');
        $sectionId = $request->query('section_id');

        $query = Student::with('address')->orderBy('last_name')->orderBy('first_name');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        // Filter by school year and/or section via enrollment
        if ($schoolYearId || $sectionId) {
            $query->whereHas('enrollments', function ($eq) use ($schoolYearId, $sectionId) {
                if ($schoolYearId) {
                    $eq->where('school_year_id', $schoolYearId);
                }
                if ($sectionId) {
                    $eq->where('section_id', $sectionId);
                }
            });
        }

        $students = $query->get();

        // Build filter description
        $filters = [];
        if ($status && $status !== 'all') {
            $filters[] = ucfirst($status) . ' students';
        }
        if ($schoolYearId) {
            $sy = SchoolYear::find($schoolYearId);
            if ($sy) $filters[] = 'SY: ' . $sy->name;
        }
        if ($sectionId) {
            $sec = Section::find($sectionId);
            if ($sec) $filters[] = 'Section: ' . $sec->name;
        }

        $pdf = new BasePdf('L', 'mm', 'A4');
        $pdf->SetAutoPageBreak(true, 20);
        $pdf->AddPage();
        $this->header($pdf, 'Student Master List');

        if (!empty($filters)) {
            $pdf->SetFont('Arial', 'I', 9);
            $pdf->Cell(0, 6, 'Filter: ' . implode(' | ', $filters), 0, 1, 'L');
            $pdf->Ln(2);
        }

        // Table header
        $pdf->SetFont('Arial', 'B', 8);
        $pdf->SetFillColor(240, 240, 240);
        $pdf->Cell(10, 7, '#', 1, 0, 'C', true);
        $pdf->Cell(30, 7, 'Student ID', 1, 0, 'C', true);
        $pdf->Cell(55, 7, 'Name', 1, 0, 'C', true);
        $pdf->Cell(20, 7, 'Gender', 1, 0, 'C', true);
        $pdf->Cell(30, 7, 'Birth Date', 1, 0, 'C', true);
        $pdf->Cell(30, 7, 'Contact', 1, 0, 'C', true);
        $pdf->Cell(20, 7, 'Status', 1, 0, 'C', true);
        $pdf->Cell(82, 7, 'Address', 1, 1, 'C', true);

        // Table body
        $pdf->SetFont('Arial', '', 8);
        foreach ($students as $i => $s) {
            // Manual page break to repeat table header
            if ($pdf->GetY() + 6 > $pdf->GetPageHeight() - 20) {
                $pdf->AddPage();
                // Repeat table header
                $pdf->SetFont('Arial', 'B', 8);
                $pdf->SetFillColor(240, 240, 240);
                $pdf->Cell(10, 7, '#', 1, 0, 'C', true);
                $pdf->Cell(30, 7, 'Student ID', 1, 0, 'C', true);
                $pdf->Cell(55, 7, 'Name', 1, 0, 'C', true);
                $pdf->Cell(20, 7, 'Gender', 1, 0, 'C', true);
                $pdf->Cell(30, 7, 'Birth Date', 1, 0, 'C', true);
                $pdf->Cell(30, 7, 'Contact', 1, 0, 'C', true);
                $pdf->Cell(20, 7, 'Status', 1, 0, 'C', true);
                $pdf->Cell(82, 7, 'Address', 1, 1, 'C', true);
                $pdf->SetFont('Arial', '', 8);
            }
            $addr = $s->address;
            $address = implode(', ', array_filter([
                $addr?->barangay_name,
                $addr?->city_name,
                $addr?->province_name,
            ]));

            $pdf->Cell(10, 6, $i + 1, 1, 0, 'C');
            $pdf->Cell(30, 6, $s->student_id, 1, 0, 'L');
            $pdf->Cell(55, 6, $this->truncate($s->full_name, 35), 1, 0, 'L');
            $pdf->Cell(20, 6, ucfirst($s->gender), 1, 0, 'C');
            $pdf->Cell(30, 6, $s->birth_date?->format('M d, Y'), 1, 0, 'C');
            $pdf->Cell(30, 6, $s->contact_number ?? '-', 1, 0, 'C');
            $pdf->Cell(20, 6, ucfirst($s->status), 1, 0, 'C');
            $pdf->Cell(82, 6, $this->truncate($address ?: '-', 50), 1, 1, 'L');
        }

        $pdf->Ln(4);
        $pdf->SetFont('Arial', 'I', 8);
        $pdf->Cell(0, 5, 'Total Students: ' . $students->count(), 0, 1, 'L');

        return $this->output($pdf, 'student_master_list.pdf');
    }

    /**
     * Enrollment Report – filtered by school year and/or section.
     */
    public function enrollmentReport(Request $request)
    {
        $schoolYearId = $request->query('school_year_id');
        $sectionId = $request->query('section_id');
        $yearLevelId = $request->query('year_level_id');

        $query = Enrollment::with(['student', 'schoolYear', 'section', 'yearLevel'])
            ->orderBy('created_at', 'desc');

        if ($schoolYearId) {
            $query->where('school_year_id', $schoolYearId);
        }
        if ($sectionId) {
            $query->where('section_id', $sectionId);
        }
        if ($yearLevelId) {
            $query->where('year_level_id', $yearLevelId);
        }

        $enrollments = $query->get();

        $pdf = new BasePdf('L', 'mm', 'A4');
        $pdf->SetAutoPageBreak(true, 20);
        $pdf->AddPage();
        $this->header($pdf, 'Enrollment Report');

        // Filters info
        $filters = [];
        if ($schoolYearId) {
            $sy = SchoolYear::find($schoolYearId);
            if ($sy) $filters[] = 'School Year: ' . $sy->name;
        }
        if ($yearLevelId) {
            $yl = YearLevel::find($yearLevelId);
            if ($yl) $filters[] = 'Year Level: ' . $yl->name;
        }
        if ($sectionId) {
            $sec = Section::find($sectionId);
            if ($sec) $filters[] = 'Section: ' . $sec->name;
        }
        if ($filters) {
            $pdf->SetFont('Arial', 'I', 9);
            $pdf->Cell(0, 6, 'Filter: ' . implode(' | ', $filters), 0, 1, 'L');
            $pdf->Ln(2);
        }

        // Table header
        $pdf->SetFont('Arial', 'B', 8);
        $pdf->SetFillColor(240, 240, 240);
        $pdf->Cell(10, 7, '#', 1, 0, 'C', true);
        $pdf->Cell(30, 7, 'Student ID', 1, 0, 'C', true);
        $pdf->Cell(60, 7, 'Student Name', 1, 0, 'C', true);
        $pdf->Cell(50, 7, 'School Year', 1, 0, 'C', true);
        $pdf->Cell(45, 7, 'Section', 1, 0, 'C', true);
        $pdf->Cell(30, 7, 'Enrolled Date', 1, 0, 'C', true);
        $pdf->Cell(25, 7, 'Status', 1, 0, 'C', true);
        $pdf->Cell(27, 7, 'Remarks', 1, 1, 'C', true);

        // Table body
        $pdf->SetFont('Arial', '', 8);
        foreach ($enrollments as $i => $e) {
            // Manual page break to repeat table header
            if ($pdf->GetY() + 6 > $pdf->GetPageHeight() - 20) {
                $pdf->AddPage();
                // Repeat table header
                $pdf->SetFont('Arial', 'B', 8);
                $pdf->SetFillColor(240, 240, 240);
                $pdf->Cell(10, 7, '#', 1, 0, 'C', true);
                $pdf->Cell(30, 7, 'Student ID', 1, 0, 'C', true);
                $pdf->Cell(60, 7, 'Student Name', 1, 0, 'C', true);
                $pdf->Cell(50, 7, 'School Year', 1, 0, 'C', true);
                $pdf->Cell(45, 7, 'Section', 1, 0, 'C', true);
                $pdf->Cell(30, 7, 'Enrolled Date', 1, 0, 'C', true);
                $pdf->Cell(25, 7, 'Status', 1, 0, 'C', true);
                $pdf->Cell(27, 7, 'Remarks', 1, 1, 'C', true);
                $pdf->SetFont('Arial', '', 8);
            }
            $pdf->Cell(10, 6, $i + 1, 1, 0, 'C');
            $pdf->Cell(30, 6, $e->student->student_id, 1, 0, 'L');
            $pdf->Cell(60, 6, $this->truncate($e->student->full_name, 38), 1, 0, 'L');
            $pdf->Cell(50, 6, $e->schoolYear->name, 1, 0, 'C');
            $pdf->Cell(45, 6, $e->section->name, 1, 0, 'C');
            $pdf->Cell(30, 6, $e->enrolled_at?->format('M d, Y') ?? '-', 1, 0, 'C');
            $pdf->Cell(25, 6, ucfirst($e->status), 1, 0, 'C');
            $pdf->Cell(27, 6, $this->truncate($e->remarks ?? '-', 18), 1, 1, 'L');
        }

        $pdf->Ln(4);
        $pdf->SetFont('Arial', 'I', 8);
        $pdf->Cell(0, 5, 'Total Enrollments: ' . $enrollments->count(), 0, 1, 'L');

        return $this->output($pdf, 'enrollment_report.pdf');
    }

    /**
     * Section Summary – student count per section for a school year.
     */
    public function sectionSummary(Request $request)
    {
        $schoolYearId = $request->query('school_year_id');

        $query = Section::with('yearLevel')->withCount(['enrollments as enrolled_count' => function ($q) use ($schoolYearId) {
            $q->where('status', 'enrolled');
            if ($schoolYearId) {
                $q->where('school_year_id', $schoolYearId);
            }
        }])->orderBy('name');

        $sections = $query->get();

        $pdf = new BasePdf('P', 'mm', 'A4');
        $pdf->SetAutoPageBreak(true, 20);
        $pdf->AddPage();
        $this->header($pdf, 'Section Summary Report');

        if ($schoolYearId) {
            $sy = SchoolYear::find($schoolYearId);
            if ($sy) {
                $pdf->SetFont('Arial', 'I', 9);
                $pdf->Cell(0, 6, 'School Year: ' . $sy->name, 0, 1, 'L');
                $pdf->Ln(2);
            }
        }

        // Table header
        $pdf->SetFont('Arial', 'B', 9);
        $pdf->SetFillColor(240, 240, 240);
        $pdf->Cell(15, 8, '#', 1, 0, 'C', true);
        $pdf->Cell(60, 8, 'Section', 1, 0, 'C', true);
        $pdf->Cell(50, 8, 'Year Level', 1, 0, 'C', true);
        $pdf->Cell(30, 8, 'Status', 1, 0, 'C', true);
        $pdf->Cell(30, 8, 'Enrolled Students', 1, 1, 'C', true);

        // Table body
        $pdf->SetFont('Arial', '', 9);
        $total = 0;
        foreach ($sections as $i => $section) {
            // Manual page break to repeat table header
            if ($pdf->GetY() + 7 > $pdf->GetPageHeight() - 25) {
                $pdf->AddPage();
                // Repeat table header
                $pdf->SetFont('Arial', 'B', 9);
                $pdf->SetFillColor(240, 240, 240);
                $pdf->Cell(15, 8, '#', 1, 0, 'C', true);
                $pdf->Cell(60, 8, 'Section', 1, 0, 'C', true);
                $pdf->Cell(50, 8, 'Year Level', 1, 0, 'C', true);
                $pdf->Cell(30, 8, 'Status', 1, 0, 'C', true);
                $pdf->Cell(30, 8, 'Enrolled Students', 1, 1, 'C', true);
                $pdf->SetFont('Arial', '', 9);
            }
            $pdf->Cell(15, 7, $i + 1, 1, 0, 'C');
            $pdf->Cell(60, 7, $section->name, 1, 0, 'L');
            $pdf->Cell(50, 7, $section->yearLevel?->name ?? '-', 1, 0, 'C');
            $pdf->Cell(30, 7, ucfirst($section->status), 1, 0, 'C');
            $pdf->Cell(30, 7, $section->enrolled_count, 1, 1, 'C');
            $total += $section->enrolled_count;
        }

        // Total row
        $pdf->SetFont('Arial', 'B', 9);
        $pdf->Cell(155, 7, 'Total', 1, 0, 'R');
        $pdf->Cell(30, 7, $total, 1, 1, 'C');

        return $this->output($pdf, 'section_summary.pdf');
    }

    // ─── Helpers ────────────────────────────────────────────

    private function header(BasePdf $pdf, string $title): void
    {
        $pdf->AliasNbPages();
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Cell(0, 10, $pdf->systemName, 0, 1, 'C');
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->Cell(0, 8, $title, 0, 1, 'C');
        $pdf->SetFont('Arial', '', 9);
        $pdf->Cell(0, 5, 'Generated: ' . now()->format('F d, Y h:i A'), 0, 1, 'C');
        $pdf->Ln(4);
    }

    private function truncate(string $text, int $max): string
    {
        return mb_strlen($text) > $max ? mb_substr($text, 0, $max - 2) . '..' : $text;
    }

    private function output(BasePdf $pdf, string $filename): \Illuminate\Http\Response
    {
        return response($pdf->Output('S'), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ]);
    }
}
