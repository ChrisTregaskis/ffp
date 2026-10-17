import React, { useCallback, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

import { UnsavedChangesModal } from '../UnsavedChangesModal';

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

  const proceededRef = useRef(false);

  // The router reports blocker changes in a transition, so it can report the hold a render
  // after the save lands and still report it held a render after proceeding. The release
  // stays set until the hold is gone, or that render would open the prompt.
  useEffect(() => {
    if (!releaseHeld) {
      return;
    }

    if (blocker.state === 'blocked') {
      if (!proceededRef.current) {
        proceededRef.current = true;
        blocker.proceed();
      }

      return;
    }

    if (proceededRef.current) {
      proceededRef.current = false;
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
