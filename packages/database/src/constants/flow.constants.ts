export const FLOW_STEP_TYPES = [
  // Welcome screen with overview
  'intro',
  // Pre-assessment questions (links to templateId)
  'questions',
  // Safety notes before physical tests
  'transition',
  // Video-guided exercises (links to templateId)
  'video-assessment',
  // complete screen with scores
  'results',
  //  Generated programme preview
  'programme-overview',
] as const;

export type FlowStepType = (typeof FLOW_STEP_TYPES)[number];

export interface FlowStepConfig {
  // Display title for the step
  title: string;
  // Optional explanatory text
  description?: string;
  // Optional array of instruction strings (for video steps)
  instructions?: string[];
  // Optional array of safety warnings (for transition steps)
  safetyNotes?: string[];
  // Optional time estimate for the step
  estimatedMinutes?: number;
}

export interface FlowStep {
  // Position in the flow sequence (1-based)
  order: number;
  // One of the FLOW_STEP_TYPES
  type: FlowStepType;
  // Optional UUID linking to assessment_templates (for questions/video-assessment)
  templateId?: string;
  // Step-specific configuration
  config: FlowStepConfig;
}
