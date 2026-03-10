<?php

namespace App\Mail;

use App\Models\Enrollment;
use App\Models\SystemSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

class StudentEnrolledMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Enrollment $enrollment,
    ) {}

    public function envelope(): Envelope
    {
        $systemName = SystemSetting::get('system_name', 'GOJAI SIS');

        return new Envelope(
            subject: "Enrollment Confirmation — {$systemName}",
        );
    }

    public function content(): Content
    {
        $this->enrollment->loadMissing(['student', 'schoolYear', 'section', 'yearLevel']);

        return new Content(
            markdown: 'emails.student-enrolled',
            with: [
                'studentName' => $this->enrollment->student->full_name,
                'schoolYear' => $this->enrollment->schoolYear->name,
                'yearLevel' => $this->enrollment->yearLevel?->name,
                'section' => $this->enrollment->section->name,
                'systemName' => SystemSetting::get('system_name', 'GOJAI SIS'),
                'setupUrl' => $this->enrollment->student->user
                    ? null
                    : URL::temporarySignedRoute(
                        'student.setup',
                        now()->addDays(7),
                        ['student' => $this->enrollment->student->id]
                    ),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
