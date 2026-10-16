import React from 'react';

import { StaticAlert } from '@web/components/molecules';
import { useDismissibleNotice } from '@web/hooks/useDismissibleNotice';

export interface BranchingNoticeProps {
  /** Remembers the dismissal; a page that explains branching differently needs its own id */
  noticeId: string;
  message: string;
}

/** Explains why a branching flow reads differently, until the admin dismisses it. */
export const BranchingNotice: React.FC<BranchingNoticeProps> = ({ noticeId, message }) => {
  const { isDismissed, dismiss } = useDismissibleNotice(noticeId);

  if (isDismissed) {
    return null;
  }

  return (
    <StaticAlert
      variant="info"
      appearance="soft"
      message={message}
      onDismiss={dismiss}
      className="mb-4"
    />
  );
};
