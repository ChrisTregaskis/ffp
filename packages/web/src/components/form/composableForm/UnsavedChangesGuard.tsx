import React, { useCallback, useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

import { UnsavedChangesModal } from '@web/components/modal';

import type { BlockerFunction } from 'react-router-dom';

export interface UnsavedChangesGuardProps {
  /** Read at navigation time rather than render time */
  shouldBlock: () => boolean;
  /** A navigation held during a save waits for its outcome rather than asking */
  isSaving: boolean;
  /** Set once a save lands, letting a navigation held during it go ahead */
  releaseHeld: boolean;
  onReleased: () => void;
}

/** Holds an in-app navigation away from unsaved edits until the user confirms it */
export const UnsavedChangesGuard: React.FC<UnsavedChangesGuardProps> = ({
  shouldBlock,
  isSaving,
  releaseHeld,
  onReleased,
}) => {
  const blocker = useBlocker(
    useCallback<BlockerFunction>(
      ({ currentLocation, nextLocation }) =>
        currentLocation.pathname !== nextLocation.pathname && shouldBlock(),
      [shouldBlock]
    )
  );

  // The router may report the hold a render after the save lands, so wait for it
  useEffect(() => {
    if (releaseHeld && blocker.state === 'blocked') {
      blocker.proceed();
      onReleased();
    }
  }, [releaseHeld, blocker, onReleased]);

  const handleStay = useCallback((): void => {
    blocker.reset?.();
  }, [blocker]);

  const handleLeave = useCallback((): void => {
    blocker.proceed?.();
  }, [blocker]);

  return (
    <UnsavedChangesModal
      isOpen={blocker.state === 'blocked' && !isSaving && !releaseHeld}
      onStay={handleStay}
      onLeave={handleLeave}
    />
  );
};
