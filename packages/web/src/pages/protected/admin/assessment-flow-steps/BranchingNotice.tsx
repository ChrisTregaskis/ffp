import React from 'react';

import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { useDismissibleNotice } from '@web/hooks/useDismissibleNotice';

const NOTICE_ID = 'assessment-flow-branching-reorder';

const MESSAGE =
  'This flow sends members down different paths depending on their answers, so its steps have a set position and cannot be moved. Everything else about a step can still be edited.';

/** One dismissal is remembered — the reason does not change between flows. */
export const BranchingNotice: React.FC = () => {
  const { isDismissed, dismiss } = useDismissibleNotice(NOTICE_ID);

  if (isDismissed) {
    return null;
  }

  return (
    <StaticAlert
      variant="info"
      appearance="soft"
      message={MESSAGE}
      onDismiss={dismiss}
      className="mb-4"
    />
  );
};
