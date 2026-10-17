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

  it('leaves out a dimension the member answered nothing in, rather than showing 0/100', () => {
    const scores = {
      dimensions: [
        {
          dimensionId: 'mobility',
          dimensionName: 'Mobility',
          normalisedScore: 64,
          answeredCount: 2,
        },
        {
          dimensionId: 'strength',
          dimensionName: 'Strength',
          normalisedScore: 0,
          answeredCount: 0,
        },
      ],
      scoredAt: new Date(),
    } as unknown as UserAssessmentScores;

    render(<AssessmentScoresPanel scores={scores} />);

    expect(screen.getByText('Mobility Score:')).toBeTruthy();
    expect(screen.queryByText('Strength Score:')).toBeNull();
  });

  it('renders nothing when no dimension has a score to show', () => {
    const scores = {
      dimensions: [
        {
          dimensionId: 'activity',
          dimensionName: 'Activity',
          normalisedScore: 0,
          answeredCount: 0,
        },
        { dimensionId: 'age', dimensionName: 'Age', normalisedScore: 100, answeredCount: 1 },
      ],
      scoredAt: new Date(),
    } as unknown as UserAssessmentScores;

    const { container } = render(<AssessmentScoresPanel scores={scores} />);

    expect(container.firstChild).toBeNull();
  });
});
