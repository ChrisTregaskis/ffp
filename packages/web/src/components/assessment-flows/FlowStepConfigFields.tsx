import React from 'react';

import type { FlowStepType } from '@ffp/core';

import { STEP_CONFIG_FIELDS } from './step-config';

export interface FlowStepConfigFieldsProps {
  /** The type currently selected in the form, not the step's stored type */
  type: FlowStepType;
}

/** The fields for the selected type; nothing when it has none. */
export const FlowStepConfigFields: React.FC<FlowStepConfigFieldsProps> = ({ type }) => {
  const Fields = STEP_CONFIG_FIELDS[type];

  return Fields ? <Fields /> : null;
};
