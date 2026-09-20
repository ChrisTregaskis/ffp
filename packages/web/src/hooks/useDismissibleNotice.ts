import { useCallback, useState } from 'react';

const STORAGE_KEY = 'ffp-dismissed-notices';

export interface DismissibleNotice {
  /** Already dismissed on this device */
  isDismissed: boolean;
  dismiss: () => void;
}

const readDismissed = (): string[] => {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');

    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    // Corrupt or blocked storage just means nothing has been dismissed
    return [];
  }
};

/**
 * Dismissed ids share one storage key, so clearing site data brings every
 * notice back. `noticeId` is read once per mount and must be constant.
 *
 * Informative notices only — never something the reader has to act on.
 */
export const useDismissibleNotice = (noticeId: string): DismissibleNotice => {
  const [isDismissed, setIsDismissed] = useState(() => readDismissed().includes(noticeId));

  const dismiss = useCallback(() => {
    setIsDismissed(true);

    try {
      const dismissed = readDismissed();

      if (!dismissed.includes(noticeId)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed, noticeId]));
      }
    } catch {
      // Unavailable storage only costs the reader a repeat showing
    }
  }, [noticeId]);

  return { isDismissed, dismiss };
};
