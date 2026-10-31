import { Button, Icons } from '@web/components/atoms';

import { StatusResult } from '../StatusResult';

/** `area` a block inside a page or card · `screen` centred in the full viewport */
export type ErrorRetryStateLayout = 'area' | 'screen';

const LAYOUT_CLASSES: Record<ErrorRetryStateLayout, string> = {
  area: '',
  screen: 'flex min-h-screen items-center justify-center p-6',
};

export interface ErrorRetryStateProps {
  /** What failed, said calmly: "We couldn't load your programme just now." */
  title: string;
  /** Runs the failed request again */
  onRetry: () => void;
  /** @default 'Try again' */
  retryLabel?: string;
  /** @default 'area' */
  layout?: ErrorRetryStateLayout;
}

/** A request that failed, with a "Try again" that repeats it. */
export const ErrorRetryState: React.FC<ErrorRetryStateProps> = ({
  title,
  onRetry,
  retryLabel = 'Try again',
  layout = 'area',
}) => (
  <div className={LAYOUT_CLASSES[layout]}>
    <StatusResult
      icon={Icons.ALERTTRIANGLE}
      iconVariant="warning"
      title={title}
      actions={
        <Button variant="primary" onClick={onRetry}>
          {retryLabel}
        </Button>
      }
    />
  </div>
);
