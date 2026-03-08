<?php

namespace App\Models;

/**
 * DepEd K-12 grading helper — weight categories and transmutation.
 * Not an Eloquent model; just static utility methods.
 */
class Grade
{
    /**
     * DepEd subject weight categories.
     * Maps subject codes to their grading weight type.
     */
    public const WEIGHT_CATEGORIES = [
        // Performance-heavy: WW=20%, PT=60%, QA=20%
        'MAPEH' => 'performance',
        'TLE' => 'performance',
        'EPP' => 'performance',
        'PE1' => 'performance',
        'PE2' => 'performance',

        // STEM: WW=40%, PT=40%, QA=20%
        'MATH' => 'stem',
        'SCI' => 'stem',
        'GMATH' => 'stem',
        'STATS' => 'stem',
        'EARTSC' => 'stem',
        'PHYSCI' => 'stem',
    ];

    /**
     * Component weights by category (Written Work, Performance Task, Quarterly Assessment).
     */
    public const WEIGHTS = [
        'default' => ['ww' => 30, 'pt' => 50, 'qa' => 20],
        'performance' => ['ww' => 20, 'pt' => 60, 'qa' => 20],
        'stem' => ['ww' => 40, 'pt' => 40, 'qa' => 20],
    ];

    public static function getWeightCategory(string $subjectCode): string
    {
        return self::WEIGHT_CATEGORIES[$subjectCode] ?? 'default';
    }

    public static function getWeights(string $subjectCode): array
    {
        $category = self::getWeightCategory($subjectCode);

        return self::WEIGHTS[$category];
    }

    /**
     * Compute initial grade from component percentage scores and weights.
     */
    public static function computeInitialGrade(
        float $wwPercent,
        float $ptPercent,
        float $qaPercent,
        array $weights
    ): float {
        return round(
            ($wwPercent * $weights['ww'] + $ptPercent * $weights['pt'] + $qaPercent * $weights['qa']) / 100,
            2
        );
    }

    /**
     * Transmute initial grade using the DepEd transmutation table.
     * DepEd Order No. 8, s. 2015.
     */
    public static function transmute(?float $initialGrade): ?float
    {
        if ($initialGrade === null) {
            return null;
        }

        $initialGrade = max(0, min(100, $initialGrade));

        if ($initialGrade >= 100) {
            return 100;
        }

        if ($initialGrade >= 60) {
            return min(100, 75 + floor(($initialGrade - 60) / 1.6));
        }

        return 60 + floor($initialGrade / 4);
    }
}
