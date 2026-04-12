import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { encodeUuid } from '@web/utils/short-id';

import type { NavigateOptions } from 'react-router-dom';

/**
 * Build a URL path with UUID segments encoded as short IDs.
 *
 * Pass UUID values through shortId() to encode them.
 *
 * @example
 * ```tsx
 * const navigate = useShortNavigate();
 * navigate(`/programme/session/${shortId(phaseId)}/${shortId(templateSessionId)}`);
 * ```
 */
export const shortId = encodeUuid;

/**
 * Drop-in replacement for useNavigate.
 *
 * Use with shortId() to build URLs with encoded UUIDs.
 * Returns the standard navigate function — encoding is done
 * by the caller via shortId().
 */
export const useShortNavigate = (): ((to: string, options?: NavigateOptions) => void) => {
  const navigate = useNavigate();

  return useCallback(
    (to: string, options?: NavigateOptions): void => {
      void navigate(to, options);
    },
    [navigate]
  );
};
