<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(): Response
    {
        $logs = AuditLog::latest()
            ->limit(500)
            ->get();

        return Inertia::render('admin/audit-logs/index', [
            'logs' => $logs,
        ]);
    }
}
