<?php

namespace App\Services\Pdf;

use App\Models\SystemSetting;
use FPDF;

class StudentReportPdf extends FPDF
{
    protected string $reportTitle = '';
    protected string $schoolYear = '';
    protected string $systemName;

    public function __construct($orientation = 'P', $unit = 'mm', $size = 'A4')
    {
        parent::__construct($orientation, $unit, $size);
        $this->systemName = SystemSetting::get('system_name', 'GOJAI SIS');
    }

    public function setReportMeta(string $title, string $schoolYear): void
    {
        $this->reportTitle = $title;
        $this->schoolYear = $schoolYear;
    }

    public function Header(): void
    {
        $this->SetFont('Helvetica', 'B', 14);
        $this->Cell(0, 6, $this->systemName, 0, 1, 'C');

        $this->SetFont('Helvetica', 'B', 11);
        $this->Cell(0, 6, $this->reportTitle, 0, 1, 'C');

        $this->SetFont('Helvetica', '', 9);
        $this->Cell(0, 5, 'School Year: ' . $this->schoolYear, 0, 1, 'C');

        $this->Ln(3);
    }

    public function Footer(): void
    {
        $this->SetY(-15);
        $this->SetFont('Helvetica', 'I', 7);
        $this->Cell(0, 10, 'Generated on ' . date('F j, Y') . '  |  ' . $this->systemName . '  |  Page ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }

    /**
     * Generate the complete Individual Student Report PDF.
     */
    public function generate(array $data): string
    {
        $this->AliasNbPages();
        $this->setReportMeta('Individual Student Report', $data['activeSchoolYear']);
        $this->SetAutoPageBreak(true, 20);
        $this->AddPage('P'); // Portrait

        $this->renderStudentInfo($data);
        $this->renderAttendance($data['attendanceSummary']);
        $this->renderGrades($data['subjectGrades']);

        if ($data['includeDetailed']) {
            $this->renderDetailedScores($data['subjectGrades']);
        }

        $this->renderLegend();
        $this->renderSignatures($data['teacher']);

        return $this->Output('S');
    }

    // ========================================================================
    // STUDENT INFORMATION
    // ========================================================================

    private function renderStudentInfo(array $data): void
    {
        $student = $data['student'];
        $section = $data['section'];

        $this->sectionHeading('Student Information');

        $this->SetFont('Helvetica', '', 9);
        $col = 95;

        $this->infoRow('Student ID', $student['student_id'], 'Section', $section['name'] . ' (' . $section['year_level_name'] . ')', $col);
        $this->infoRow('Last Name', $student['last_name'], 'First Name', $student['first_name'], $col);
        $this->infoRow('Middle Name', $student['middle_name'] ?? '---', 'Gender', ucfirst($student['gender']), $col);
        $this->infoRow('Birth Date', $this->formatDate($student['birth_date']), 'Contact', $student['contact_number'] ?? '---', $col);
        $this->infoRow('Email', $student['email'] ?? '---', 'Date Enrolled', $this->formatDate($student['enrolled_at']), $col);
        $this->infoRow('Status', ucfirst($student['status']), '', '', $col);

        $this->Ln(4);
    }

    // ========================================================================
    // ATTENDANCE SUMMARY
    // ========================================================================

    private function renderAttendance(array $att): void
    {
        $this->sectionHeading('Attendance Summary');

        $colW = 31.67; // 6 cols in 190mm
        $headers = ['Total Days', 'Present', 'Absent', 'Late', 'Excused', 'Rate'];

        $totalCountable = $att['present'] + $att['late'] + $att['excused'];
        $rate = $att['total_days'] > 0
            ? number_format(($totalCountable / $att['total_days']) * 100, 1) . '%'
            : '---';

        $values = [
            (string) $att['total_days'],
            (string) $att['present'],
            (string) $att['absent'],
            (string) $att['late'],
            (string) $att['excused'],
            $rate,
        ];

        // Header row
        $this->SetFont('Helvetica', 'B', 8);
        $this->SetFillColor(230, 230, 230);
        foreach ($headers as $h) {
            $this->Cell($colW, 6, $h, 1, 0, 'C', true);
        }
        $this->Ln();

        // Value row
        $this->SetFont('Helvetica', '', 9);
        foreach ($values as $i => $v) {
            $bold = $i === 0 || $i === 5;
            if ($bold) $this->SetFont('Helvetica', 'B', 9);
            $this->Cell($colW, 6, $v, 1, 0, 'C');
            if ($bold) $this->SetFont('Helvetica', '', 9);
        }
        $this->Ln(8);
    }

    // ========================================================================
    // ACADEMIC GRADES TABLE
    // ========================================================================

    private function renderGrades(array $subjectGrades): void
    {
        $this->sectionHeading('Academic Grades');

        $colWidths = [60, 20, 20, 20, 20, 22, 28]; // Subject, Q1-Q4, Final, Description
        $headers = ['Subject', 'Q1', 'Q2', 'Q3', 'Q4', 'Final', 'Description'];

        // Header
        $this->SetFont('Helvetica', 'B', 8);
        $this->SetFillColor(230, 230, 230);
        foreach ($headers as $i => $h) {
            $align = $i === 0 ? 'L' : 'C';
            $this->Cell($colWidths[$i], 7, $h, 1, 0, $align, true);
        }
        $this->Ln();

        // Body
        $this->SetFont('Helvetica', '', 8);
        $gradedFinals = [];

        foreach ($subjectGrades as $sg) {
            $this->Cell($colWidths[0], 6, $this->safeText($sg['subject_code'] . ' - ' . $sg['subject_name']), 1, 0, 'L');

            foreach (['q1', 'q2', 'q3', 'q4'] as $qi => $qKey) {
                $val = $sg[$qKey] !== null ? (string) $sg[$qKey] : '---';
                $this->Cell($colWidths[$qi + 1], 6, $val, 1, 0, 'C');
            }

            $final = $sg['final_grade'];
            $this->SetFont('Helvetica', 'B', 8);
            $this->Cell($colWidths[5], 6, $final !== null ? (string) $final : '---', 1, 0, 'C');
            $this->SetFont('Helvetica', '', 7);
            $this->Cell($colWidths[6], 6, $this->gradeDescription($final), 1, 0, 'C');
            $this->SetFont('Helvetica', '', 8);
            $this->Ln();

            if ($final !== null) {
                $gradedFinals[] = $final;
            }
        }

        // General Average row
        $generalAvg = count($gradedFinals) > 0 ? round(array_sum($gradedFinals) / count($gradedFinals), 2) : null;

        $this->SetFont('Helvetica', 'B', 8);
        $this->SetFillColor(230, 230, 230);
        $this->Cell($colWidths[0], 7, 'General Average', 1, 0, 'L', true);
        for ($i = 1; $i <= 4; $i++) {
            $this->Cell($colWidths[$i], 7, '', 1, 0, 'C', true);
        }
        $this->Cell($colWidths[5], 7, $generalAvg !== null ? number_format($generalAvg, 2) : '---', 1, 0, 'C', true);
        $this->SetFont('Helvetica', '', 7);
        $this->Cell($colWidths[6], 7, $this->gradeDescription($generalAvg !== null ? round($generalAvg) : null), 1, 0, 'C', true);
        $this->Ln(8);
    }

    // ========================================================================
    // DETAILED SCORES BREAKDOWN
    // ========================================================================

    private function renderDetailedScores(array $subjectGrades): void
    {
        $this->sectionHeading('Detailed Scores Breakdown');

        $typeLabels = ['WW' => 'Written Work', 'PT' => 'Performance Task', 'QA' => 'Quarterly Assessment'];

        foreach ($subjectGrades as $sg) {
            if (empty($sg['detailed'])) continue;

            // Subject heading
            $this->SetFont('Helvetica', 'B', 9);
            $weightText = 'WW ' . $sg['weights']['ww'] . '% | PT ' . $sg['weights']['pt'] . '% | QA ' . $sg['weights']['qa'] . '%';
            $this->Cell(0, 6, $this->safeText($sg['subject_code'] . ' - ' . $sg['subject_name']) . '   (' . $weightText . ')', 0, 1);

            foreach ($sg['detailed'] as $q => $qData) {
                $quarterLabel = $this->ordinal((int) $q) . ' Quarter';

                $this->SetFont('Helvetica', 'B', 8);
                $this->Cell(10, 5, '', 0, 0); // indent
                $this->Cell(0, 5, $quarterLabel, 0, 1);

                // Table: Component | Activity | HPS | Score | %
                $colWidths = [40, 60, 25, 25, 30];
                $headers = ['Component', 'Activity', 'HPS', 'Score', '%'];

                $this->SetFont('Helvetica', 'B', 7);
                $this->SetFillColor(240, 240, 240);
                $this->Cell(10, 0, '', 0, 0); // indent
                foreach ($headers as $i => $h) {
                    $align = $i <= 1 ? 'L' : 'C';
                    $this->Cell($colWidths[$i], 5, $h, 1, 0, $align, true);
                }
                $this->Ln();

                // Group items by type
                $itemsByType = [];
                foreach ($qData['items'] as $item) {
                    $itemsByType[$item['type']][] = $item;
                }

                $this->SetFont('Helvetica', '', 7);

                foreach (['WW', 'PT', 'QA'] as $type) {
                    $items = $itemsByType[$type] ?? [];
                    if (empty($items)) continue;

                    $pct = match ($type) {
                        'WW' => $qData['ww_percent'],
                        'PT' => $qData['pt_percent'],
                        'QA' => $qData['qa_percent'],
                    };

                    $totalHps = 0;
                    $totalScore = 0;

                    foreach ($items as $idx => $item) {
                        $this->Cell(10, 0, '', 0, 0); // indent

                        if ($idx === 0) {
                            $this->SetFont('Helvetica', 'B', 7);
                            $this->Cell($colWidths[0], 5, $typeLabels[$type], 1, 0, 'L');
                            $this->SetFont('Helvetica', '', 7);
                        } else {
                            $this->Cell($colWidths[0], 5, '', 1, 0, 'L');
                        }

                        $this->Cell($colWidths[1], 5, $this->safeText($item['name']), 1, 0, 'L');
                        $this->Cell($colWidths[2], 5, (string) $item['max_score'], 1, 0, 'C');
                        $this->Cell($colWidths[3], 5, $item['score'] !== null ? (string) $item['score'] : '---', 1, 0, 'C');

                        if ($idx === 0) {
                            $this->SetFont('Helvetica', 'B', 7);
                            $this->Cell($colWidths[4], 5, $pct !== null ? number_format($pct, 1) . '%' : '---', 1, 0, 'C');
                            $this->SetFont('Helvetica', '', 7);
                        } else {
                            $this->Cell($colWidths[4], 5, '', 1, 0, 'C');
                        }
                        $this->Ln();

                        $totalHps += $item['max_score'];
                        $totalScore += $item['score'] ?? 0;
                    }

                    // Subtotal row
                    $this->SetFont('Helvetica', 'B', 7);
                    $this->Cell(10, 0, '', 0, 0);
                    $this->Cell($colWidths[0], 5, '', 1, 0);
                    $this->Cell($colWidths[1], 5, 'Total', 1, 0, 'L');
                    $this->Cell($colWidths[2], 5, (string) $totalHps, 1, 0, 'C');
                    $this->Cell($colWidths[3], 5, (string) $totalScore, 1, 0, 'C');
                    $this->Cell($colWidths[4], 5, '', 1, 0, 'C');
                    $this->SetFont('Helvetica', '', 7);
                    $this->Ln();
                }

                $this->Ln(2);
            }

            $this->Ln(2);
        }
    }

    // ========================================================================
    // LEGEND & SIGNATURES
    // ========================================================================

    private function renderLegend(): void
    {
        $this->sectionHeading('DepEd Grading Scale (DO No. 8, s. 2015)');

        $this->SetFont('Helvetica', '', 7);
        $items = [
            ['90-100', 'Outstanding'],
            ['85-89', 'Very Satisfactory'],
            ['80-84', 'Satisfactory'],
            ['75-79', 'Fairly Satisfactory'],
            ['Below 75', 'Did Not Meet Expectations'],
        ];
        $colW = 38;
        foreach ($items as [$range, $desc]) {
            $this->SetFont('Helvetica', 'B', 7);
            $this->Cell($colW, 5, $range, 1, 0, 'C');
        }
        $this->Ln();
        foreach ($items as [$range, $desc]) {
            $this->SetFont('Helvetica', '', 7);
            $this->Cell($colW, 5, $desc, 1, 0, 'C');
        }
        $this->Ln(8);
    }

    private function renderSignatures(string $teacherName): void
    {
        $this->Ln(10);
        $this->SetFont('Helvetica', '', 9);
        $halfW = ($this->GetPageWidth() - 20) / 2;

        $this->Cell($halfW, 5, '____________________________', 0, 0, 'C');
        $this->Cell($halfW, 5, '____________________________', 0, 1, 'C');

        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell($halfW, 5, $teacherName, 0, 0, 'C');
        $this->Cell($halfW, 5, '', 0, 1, 'C');

        $this->SetFont('Helvetica', '', 8);
        $this->Cell($halfW, 4, 'Adviser / Subject Teacher', 0, 0, 'C');
        $this->Cell($halfW, 4, 'School Principal', 0, 1, 'C');
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    private function sectionHeading(string $title): void
    {
        $this->SetFont('Helvetica', 'B', 9);
        $this->SetDrawColor(0, 0, 0);
        $y = $this->GetY();
        $this->Cell(0, 6, strtoupper($title), 'B', 1, 'L');
        $this->Ln(2);
    }

    private function infoRow(string $label1, string $value1, string $label2, string $value2, float $colWidth): void
    {
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(25, 5, $label1 . ':', 0, 0);
        $this->SetFont('Helvetica', '', 9);
        $this->Cell($colWidth - 25, 5, $this->safeText($value1), 0, 0);
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(25, 5, $label2 . ':', 0, 0);
        $this->SetFont('Helvetica', '', 9);
        $this->Cell($colWidth - 25, 5, $this->safeText($value2), 0, 1);
    }

    private function ordinal(int $n): string
    {
        return match ($n) {
            1 => '1st',
            2 => '2nd',
            3 => '3rd',
            default => $n . 'th',
        };
    }

    private function gradeDescription(?float $grade): string
    {
        if ($grade === null) return '---';
        if ($grade >= 90) return 'Outstanding';
        if ($grade >= 85) return 'Very Satisfactory';
        if ($grade >= 80) return 'Satisfactory';
        if ($grade >= 75) return 'Fairly Satisfactory';
        return 'Did Not Meet Expectations';
    }

    private function formatDate(?string $date): string
    {
        if (! $date) return '---';
        return date('F j, Y', strtotime($date));
    }

    private function safeText(?string $text): string
    {
        if ($text === null) return '';
        return iconv('UTF-8', 'windows-1252//TRANSLIT//IGNORE', $text) ?: $text;
    }
}
