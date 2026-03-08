<?php

namespace App\Services\Pdf;

use App\Models\SystemSetting;
use FPDF;

class BasePdf extends FPDF
{
    public string $systemName;

    public function __construct($orientation = 'P', $unit = 'mm', $size = 'A4')
    {
        parent::__construct($orientation, $unit, $size);
        $this->systemName = SystemSetting::get('system_name', 'GOJAI SIS');
    }

    public function Footer(): void
    {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, 'Page ' . $this->PageNo() . '/{nb}', 0, 0, 'C');
    }
}
