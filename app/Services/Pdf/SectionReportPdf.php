<?php

namespace App\Services\Pdf;

use App\Models\SystemSetting;
use FPDF;

class SectionReportPdf extends FPDF
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
        // School name
        $this->SetFont('Helvetica', 'B', 14);
        $this->Cell(0, 6, $this->systemName, 0, 1, 'C');

        // Report title
        $this->SetFont('Helvetica', 'B', 11);
        $this->Cell(0, 6, $this->reportTitle, 0, 1, 'C');

        // School year
        $this->SetFont('Helvetica', '', 9);
        $this->Cell(0, 5, 'School Year: ' . $this->schoolYear, 0, 1, 'C');

        $this->Ln(4);
    }

    public function Footer(): void
    {
        $this->SetY(-15);
        $this->SetFont('Helvetica', 'I', 7);
        $this->Cell(0, 10, 'Generated on ' . date('F j, Y') . '  |  ' . $this->systemName . '  |  Page ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }

    /**
     * Generate the complete Section Grade Report PDF.
     */
    public function generate(array $data): string
    {
        $this->AliasNbPages();
        $this->setReportMeta('Section Grade Report', $data['activeSchoolYear']);
        $this->SetAutoPageBreak(true, 20);
        $this->AddPage('L'); // Landscape for more columns

        // --- Report Info ---
        $this->SetFont('Helvetica', '', 9);
        $infoY = $this->GetY();
        $this->Cell(95, 5, 'Section: ' . $data['section']['name'] . ' (' . $data['section']['year_level_name'] . ')', 0, 0);
        $this->Cell(95, 5, 'Subject: ' . $data['subject']['code'] . ' - ' . $data['subject']['name'], 0, 1);
        $this->Cell(95, 5, 'Quarter: ' . $this->ordinal($data['quarter']) . ' Quarter', 0, 0);
        $this->Cell(95, 5, 'Teacher: ' . $data['teacher'], 0, 1);

        $weightLabel = 'Weights: WW ' . $data['weights']['ww'] . '% | PT ' . $data['weights']['pt'] . '% | QA ' . $data['weights']['qa'] . '%';
        $this->Cell(0, 5, $weightLabel, 0, 1);
        $this->Ln(3);

        // --- Table ---
        $colWidths = [10, 25, 65, 20, 28, 28, 28, 25, 25, 23]; // #, ID, Name, Gender, WW%, PT%, QA%, Initial, Quarterly, Desc
        $headers = ['#', 'Student ID', 'Student Name', 'Gender', 'WW %', 'PT %', 'QA %', 'Initial', 'Quarterly', 'Desc'];

        // Table header
        $this->SetFont('Helvetica', 'B', 8);
        $this->SetFillColor(230, 230, 230);
        foreach ($headers as $i => $header) {
            $align = $i <= 2 ? 'L' : 'C';
            $this->Cell($colWidths[$i], 7, $header, 1, 0, $align, true);
        }
        $this->Ln();

        // Table body
        $this->SetFont('Helvetica', '', 8);
        $passing = 0;
        $failing = 0;
        $totalGrade = 0;
        $gradedCount = 0;

        foreach ($data['students'] as $idx => $student) {
            $this->Cell($colWidths[0], 6, $idx + 1, 1, 0, 'C');
            $this->Cell($colWidths[1], 6, $student['student_id'], 1, 0, 'L');
            $this->Cell($colWidths[2], 6, $this->safeText($student['full_name']), 1, 0, 'L');
            $this->Cell($colWidths[3], 6, ucfirst($student['gender'] ?? ''), 1, 0, 'C');
            $this->Cell($colWidths[4], 6, $student['ww_percent'] !== null ? number_format($student['ww_percent'], 1) . '%' : '-', 1, 0, 'C');
            $this->Cell($colWidths[5], 6, $student['pt_percent'] !== null ? number_format($student['pt_percent'], 1) . '%' : '-', 1, 0, 'C');
            $this->Cell($colWidths[6], 6, $student['qa_percent'] !== null ? number_format($student['qa_percent'], 1) . '%' : '-', 1, 0, 'C');
            $this->Cell($colWidths[7], 6, $student['initial_grade'] !== null ? number_format($student['initial_grade'], 2) : '-', 1, 0, 'C');
            $this->Cell($colWidths[8], 6, $student['quarterly_grade'] !== null ? (string) $student['quarterly_grade'] : '-', 1, 0, 'C');

            $desc = $this->gradeDescription($student['quarterly_grade']);
            $this->Cell($colWidths[9], 6, $desc, 1, 0, 'C');
            $this->Ln();

            if ($student['quarterly_grade'] !== null) {
                $gradedCount++;
                $totalGrade += $student['quarterly_grade'];
                if ($student['quarterly_grade'] >= 75) {
                    $passing++;
                } else {
                    $failing++;
                }
            }
        }

        $this->Ln(4);

        // --- Summary Stats ---
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(0, 5, 'Summary Statistics', 0, 1);
        $this->SetFont('Helvetica', '', 9);

        $totalStudents = count($data['students']);
        $average = $gradedCount > 0 ? number_format($totalGrade / $gradedCount, 2) : '-';
        $passingPct = $gradedCount > 0 ? number_format(($passing / $gradedCount) * 100, 1) . '%' : '-';

        $this->Cell(70, 5, 'Total Students: ' . $totalStudents, 0, 0);
        $this->Cell(70, 5, 'Average Grade: ' . $average, 0, 0);
        $this->Cell(70, 5, 'Passing: ' . $passing . ' (' . $passingPct . ')', 0, 1);
        $this->Cell(70, 5, 'Graded: ' . $gradedCount, 0, 0);
        $this->Cell(70, 5, 'Failing: ' . $failing, 0, 1);

        // --- Signatures ---
        $this->Ln(15);
        $this->SetFont('Helvetica', '', 9);
        $pageWidth = $this->GetPageWidth() - 20; // margins
        $halfW = $pageWidth / 2;

        $this->Cell($halfW, 5, '____________________________', 0, 0, 'C');
        $this->Cell($halfW, 5, '____________________________', 0, 1, 'C');
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell($halfW, 5, $data['teacher'], 0, 0, 'C');
        $this->Cell($halfW, 5, '', 0, 1, 'C');
        $this->SetFont('Helvetica', '', 8);
        $this->Cell($halfW, 4, 'Subject Teacher', 0, 0, 'C');
        $this->Cell($halfW, 4, 'School Principal', 0, 1, 'C');

        return $this->Output('S');
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
        if ($grade === null) return '-';
        if ($grade >= 90) return 'O';
        if ($grade >= 85) return 'VS';
        if ($grade >= 80) return 'S';
        if ($grade >= 75) return 'FS';
        return 'DNME';
    }

    private function safeText(?string $text): string
    {
        if ($text === null) return '';
        return iconv('UTF-8', 'windows-1252//TRANSLIT//IGNORE', $text) ?: $text;
    }
}
