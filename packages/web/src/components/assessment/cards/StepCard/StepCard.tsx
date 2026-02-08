import { SectionPanel } from '@web/components/assessment/SectionPanel';
import { Text } from '@web/components/text';

import { QuestionSubProgress } from '../QuestionSubProgress';

import type { ReactNode } from 'react';

export interface StepCardProps {
  /** Card title — rendered inside the card header zone */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Title text alignment @default 'left' */
  titleAlign?: 'left' | 'centre';
  /** 1-based question number (renders sub-progress when paired with totalQuestions) */
  questionNumber?: number;
  /** Total questions in this step (renders sub-progress when paired with questionNumber) */
  totalQuestions?: number;
  /** Extra content rendered after the title block */
  headerExtra?: ReactNode;
  /** Footer content rendered below a border separator (e.g. AssessmentNavigation) */
  footer?: ReactNode;
  /** Card body content */
  children: ReactNode;
  /** Additional CSS classes for the outer card element */
  className?: string;
}

/**
 * Shared card layout for assessment step components.
 *
 * Provides three zones — header (title + description + optional sub-progress),
 * content (children), and footer — inside a single elevated card container.
 * Each zone manages its own padding so the footer border-t extends full width.
 *
 * When both `questionNumber` and `totalQuestions` are provided, a
 * QuestionSubProgress bar is rendered automatically in the header.
 *
 * Page-level layout (max-width, centering) is the parent's responsibility.
 */
export const StepCard: React.FC<StepCardProps> = ({
  title,
  description,
  titleAlign = 'left',
  questionNumber,
  totalQuestions,
  headerExtra,
  footer,
  children,
  className = '',
}) => {
  const alignClass = titleAlign === 'centre' ? 'text-center' : 'text-left';
  const showSubProgress =
    questionNumber !== undefined && totalQuestions !== undefined && totalQuestions > 0;

  return (
    <SectionPanel as="div" className={className}>
      {/* Header zone */}
      <div
        className={`rounded-t-2xl bg-linear-to-r from-secondary/20 to-transparent px-6 pt-6 pb-4 ${alignClass}`}
      >
        <Text
          as="h2"
          styleProps={{ size: '2xl', weight: 'bold', colour: 'ffp-navy' }}
          className="tracking-tight"
        >
          {title}
        </Text>

        {description && (
          <Text as="p" styleProps={{ size: 'base', colour: 'muted-foreground' }} className="mt-2">
            {description}
          </Text>
        )}

        {showSubProgress && (
          <QuestionSubProgress questionNumber={questionNumber} totalQuestions={totalQuestions} />
        )}
        {headerExtra && <div className="mt-3">{headerExtra}</div>}
      </div>

      {/* Content zone */}
      <div className="px-6 pb-6">{children}</div>

      {/* Footer zone */}
      {footer && <div className="px-6 py-4">{footer}</div>}
    </SectionPanel>
  );
};
