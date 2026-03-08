<?php

namespace App\Services\Pdf;

use App\Models\SystemSetting;
use FPDF;

class StudentGradesPdf extends FPDF
{
    protected string $schoolYear = '';
    protected string $systemName;

    public function __construct($orientation = 'P', $unit = 'mm', $size = 'A4')
    {
        parent::__construct($orientation, $unit, $size);
        $this->systemName = SystemSetting::get('system_name', 'GOJAI SIS');
    }

    public function Header(): void
    {
        $this->SetFont('Helvetica', 'B', 14);
        $this->Cell(0, 6, $this->systemName, 0, 1, 'C');

        $this->SetFont('Helvetica', 'B', 11);
        $this->Cell(0, 6, 'Student Grade Report', 0, 1, 'C');

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

    public function generate(array $data): string
    {
        $this->AliasNbPages();
        $this->schoolYear = $data['activeSchoolYear'] ?? '---';
        $this->SetAutoPageBreak(true, 20);
        $this->AddPage('L');

        $this->renderStudentInfo($data);
        $this->renderGrades($data['subjectGrades']);
        $this->renderLegend();

        return $this->Output('S');
    }

    private function renderStudentInfo(array $data): void
    {
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(0, 6, 'STUDENT INFORMATION', 'B', 1, 'L');
        $this->Ln(2);

        $this->SetFont('Helvetica', '', 9);
        $col = 138;

        $this->infoRow('Student ID', $data['student_id'], 'Name', $data['student_name'], $col);
        $this->infoRow('Section', $data['section_name'], 'Year Level', $data['year_level_name'], $col);

        $this->Ln(4);
    }

    private function renderGrades(array $subjectGrades): void
    {
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(0, 6, 'ACADEMIC GRADES', 'B', 1, 'L');
        $this->Ln(2);

        // Table header
        $colWidths = [80, 70, 20, 20, 20, 20, 24, 23]; // Subject, Teacher, Q1-Q4, Final, Remarks
        $headers = ['Subject', 'Teacher', 'Q1', 'Q2', 'Q3', 'Q4', 'Final', 'Remarks'];

        $this->SetFont('Helvetica', 'B', 8);
        $this->SetFillColor(230, 230, 230);
        foreach ($headers as $i => $h) {
            $align = $i <= 1 ? 'L' : 'C';
            $this->Cell($colWidths[$i], 7, $h, 1, 0, $align, true);
        }
        $this->Ln();

        // Rows
        $this->SetFont('Helvetica', '', 8);
        $gradedFinals = [];

        foreach ($subjectGrades as $sg) {
            $this->Cell($colWidths[0], 6, $this->safeText($sg['subject_code'] . ' - ' . $sg['subject_name']), 1, 0, 'L');
            $this->Cell($colWidths[1], 6, $this->safeText($sg['teacher']), 1, 0, 'L');

            foreach (['q1', 'q2', 'q3', 'q4'] as $qi => $qKey) {
                $val = $sg[$qKey] !== null ? (string) $sg[$qKey] : '---';
                $this->Cell($colWidths[$qi + 2], 6, $val, 1, 0, 'C');
            }

            $final = $sg['final_grade'];
            $this->SetFont('Helvetica', 'B', 8);
            $this->Cell($colWidths[6], 6, $final !== null ? (string) $final : '---', 1, 0, 'C');
            $this->SetFont('Helvetica', '', 7);
            $this->Cell($colWidths[7], 6, $this->gradeRemarks($final), 1, 0, 'C');
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
        $this->Cell($colWidths[0] + $colWidths[1], 7, 'General Average', 1, 0, 'L', true);
        for ($i = 2; $i <= 5; $i++) {
            $this->Cell($colWidths[$i], 7, '', 1, 0, 'C', true);
        }
        $this->Cell($colWidths[6], 7, $generalAvg !== null ? number_format($generalAvg, 2) : '---', 1, 0, 'C', true);
        $this->SetFont('Helvetica', '', 7);
        $this->Cell($colWidths[7], 7, $this->gradeRemarks($generalAvg !== null ? round($generalAvg) : null), 1, 0, 'C', true);
        $this->Ln(8);
    }

    private function renderLegend(): void
    {
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(0, 6, 'DEPED GRADING SCALE (DO No. 8, s. 2015)', 'B', 1, 'L');
        $this->Ln(2);

        $items = [
            ['90-100', 'Outstanding'],
            ['85-89', 'Very Satisfactory'],
            ['80-84', 'Satisfactory'],
            ['75-79', 'Fairly Satisfactory'],
            ['Below 75', 'Did Not Meet'],
        ];

        $colW = 38;
        $this->SetFont('Helvetica', 'B', 7);
        foreach ($items as [$range]) {
            $this->Cell($colW, 5, $range, 1, 0, 'C');
        }
        $this->Ln();
        $this->SetFont('Helvetica', '', 7);
        foreach ($items as [, $desc]) {
            $this->Cell($colW, 5, $desc, 1, 0, 'C');
        }
        $this->Ln();
    }

    private function infoRow(string $label1, string $value1, string $label2, string $value2, float $colWidth): void
    {
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(22, 5, $label1 . ':', 0, 0);
        $this->SetFont('Helvetica', '', 9);
        $this->Cell($colWidth - 22, 5, $this->safeText($value1), 0, 0);
        $this->SetFont('Helvetica', 'B', 9);
        $this->Cell(22, 5, $label2 . ':', 0, 0);
        $this->SetFont('Helvetica', '', 9);
        $this->Cell($colWidth - 22, 5, $this->safeText($value2), 0, 1);
    }

    private function gradeRemarks(?float $grade): string
    {
        if ($grade === null) return '---';
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
