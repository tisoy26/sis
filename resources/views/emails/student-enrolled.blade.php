<x-mail::message>
# Enrollment Confirmation

Dear **{{ $studentName }}**,

We are pleased to inform you that you have been successfully enrolled for the school year **{{ $schoolYear }}**.

**Enrollment Details:**

<x-mail::table>
| Detail | Information |
|:-------|:-----------|
| Year Level | {{ $yearLevel ?? 'N/A' }} |
| Section | {{ $section }} |
| School Year | {{ $schoolYear }} |
</x-mail::table>

@if($setupUrl)
## Set Up Your Student Portal Account

Click the button below to create your username and password for the student portal:

<x-mail::button :url="$setupUrl" color="primary">
Set Up My Account
</x-mail::button>

<x-mail::panel>
This link will expire in **7 days**. If it expires, please contact the school administration to request a new one.
</x-mail::panel>
@endif

If you have any questions, please contact the school administration.

Thank you,<br>
{{ $systemName }}
</x-mail::message>
