import { Text, type TextColour } from '@web/components/text';

export type ChipTone = 'muted' | 'info' | 'success' | 'primary' | 'warning';

const TONE_BG: Record<ChipTone, string> = {
  muted: 'bg-muted',
  info: 'bg-info/10',
  success: 'bg-success/10',
  primary: 'bg-primary/10',
  warning: 'bg-warning/10',
};

const TONE_TEXT: Record<ChipTone, TextColour> = {
  muted: 'muted-foreground',
  info: 'info',
  success: 'success',
  primary: 'primary',
  warning: 'warning',
};

interface TagChipProps {
  label: string;
  tone?: ChipTone;
}

/** A small typed-tag chip — its soft tint signals which tag category it belongs to. */
export const TagChip: React.FC<TagChipProps> = ({ label, tone = 'muted' }) => (
  <span className={`rounded px-1.5 py-0.5 ${TONE_BG[tone]}`}>
    <Text styleProps={{ size: 'xs', weight: 'medium', colour: TONE_TEXT[tone] }}>{label}</Text>
  </span>
);
