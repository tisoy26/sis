<?php

namespace Database\Seeders;

use App\Models\Schedule;
use App\Models\TeacherAssignment;
use Illuminate\Database\Seeder;

class ScheduleSeeder extends Seeder
{
    public function run(): void
    {
        $assignments = TeacherAssignment::with('section.yearLevel')->get();

        if ($assignments->isEmpty()) {
            $this->command->warn('No teacher assignments found. Skipping schedules.');

            return;
        }

        $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

        // Group assignments by section so we can avoid time conflicts within a section
        $bySection = $assignments->groupBy('section_id');

        foreach ($bySection as $sectionAssignments) {
            // Track occupied slots per day: day => [[start, end], ...]
            $occupied = array_fill_keys($days, []);

            foreach ($sectionAssignments as $assignment) {
                // Each subject gets 2–3 meetings per week
                $meetingsPerWeek = rand(2, 3);
                $shuffledDays = collect($days)->shuffle()->take($meetingsPerWeek)->values()->all();

                foreach ($shuffledDays as $day) {
                    // Find a free slot on this day for this section
                    $slot = $this->findFreeSlot($occupied[$day]);

                    if (! $slot) {
                        continue; // Skip if day is full
                    }

                    Schedule::firstOrCreate(
                        [
                            'teacher_assignment_id' => $assignment->id,
                            'day_of_week' => $day,
                        ],
                        [
                            'start_time' => $slot['start'],
                            'end_time' => $slot['end'],
                        ],
                    );

                    $occupied[$day][] = $slot;
                }
            }
        }
    }

    /**
     * Find a free 1-hour slot between 7:00 AM and 5:00 PM that doesn't overlap with existing slots.
     */
    private function findFreeSlot(array $occupied): ?array
    {
        // Available start hours: 7 AM to 4 PM (last class ends at 5 PM)
        $possibleStarts = range(7, 16);
        shuffle($possibleStarts);

        foreach ($possibleStarts as $hour) {
            $start = sprintf('%02d:00', $hour);
            $end = sprintf('%02d:00', $hour + 1);

            // Check for overlap with occupied slots
            $hasConflict = false;
            foreach ($occupied as $slot) {
                if ($start < $slot['end'] && $end > $slot['start']) {
                    $hasConflict = true;
                    break;
                }
            }

            if (! $hasConflict) {
                return ['start' => $start, 'end' => $end];
            }
        }

        return null;
    }
}
