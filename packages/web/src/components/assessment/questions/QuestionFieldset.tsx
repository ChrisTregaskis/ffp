import type { ReactNode } from 'react';

export interface QuestionFieldsetProps {
  /** The question text, read out as the group's name */
  legend: string;
  describedBy?: string;
  children: ReactNode;
}

/** Groups a question's controls under its text for assistive technology. */
export const QuestionFieldset: React.FC<QuestionFieldsetProps> = ({
  legend,
  describedBy,
  children,
}) => (
  <fieldset className="space-y-5" aria-describedby={describedBy}>
    <legend className="sr-only">{legend}</legend>
    {children}
  </fieldset>
);
