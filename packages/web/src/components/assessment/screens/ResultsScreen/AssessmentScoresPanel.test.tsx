import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { UserAssessmentScores } from '@ffp/core';

import { AssessmentScoresPanel } from './AssessmentScoresPanel';

describe('AssessmentScoresPanel', () => {
  it('shows the member their scores but never a risk level', () => {
    const scores = {
      dimensions: [{ dimensionId: 'mobility', dimensionName: 'Mobility', normalisedScore: 64 }],
      riskLevel: 'high',
      scoredAt: new Date(),
    } as unknown as UserAssessmentScores;

    render(<AssessmentScoresPanel scores={scores} />);

    expect(screen.getByText('Mobility Score:')).toBeTruthy();
    expect(screen.queryByText(/risk/i)).toBeNull();
    expect(screen.queryByText('High')).toBeNull();
  });
});
