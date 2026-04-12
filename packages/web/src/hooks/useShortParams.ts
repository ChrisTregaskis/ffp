import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { decodeUuid } from '@web/utils/short-id';

/**
 * Drop-in replacement for useParams that decodes short IDs back to UUIDs.
 *
 * Any param value that was encoded with encodeUuid() is automatically
 * decoded back to a standard UUID. Non-encoded values pass through unchanged.
 */
export const useShortParams = <T extends Record<string, string | undefined>>(): T => {
  const params = useParams();

  return useMemo(() => {
    const decoded: Record<string, string | undefined> = {};

    for (const [paramName, paramValue] of Object.entries(params)) {
      if (!paramValue) {
        decoded[paramName] = paramValue;
        continue;
      }

      try {
        decoded[paramName] = decodeUuid(paramValue);
      } catch {
        // Not an encoded UUID — pass through unchanged
        decoded[paramName] = paramValue;
      }
    }

    return decoded as T;
  }, [params]);
};
