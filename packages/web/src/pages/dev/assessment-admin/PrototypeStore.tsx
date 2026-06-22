/**
 * In-memory store + internal navigation for the assessment-admin prototype.
 * Throwaway: holds the whole mock catalogue in React state and exposes mutators.
 * No persistence, no network — refresh resets everything.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import {
  INITIAL_FLOWS,
  INITIAL_QUESTIONS,
  INITIAL_TEMPLATES,
  PROGRAMME_TEMPLATE_OPTIONS,
} from './prototype-data';

import type {
  ProgrammeTemplateOption,
  PrototypeFlow,
  PrototypeQuestion,
  PrototypeStep,
  PrototypeTemplate,
  PrototypeView,
  ScoringConfig,
} from './prototype-types';

let idCounter = 0;
/** Local id generator — fine for a throwaway in-memory prototype. */
const nextId = (prefix: string): string => {
  idCounter += 1;

  return `${prefix}-${Date.now().toString(36)}-${String(idCounter)}`;
};

const makePublicId = (): string =>
  Math.random().toString(36).slice(2, 14).padEnd(12, '0').slice(0, 12);

interface PrototypeStoreValue {
  flows: PrototypeFlow[];
  questions: PrototypeQuestion[];
  templates: PrototypeTemplate[];
  programmeTemplates: ProgrammeTemplateOption[];

  view: PrototypeView;
  navigate: (view: PrototypeView) => void;

  // Flows
  createFlow: (meta: Pick<PrototypeFlow, 'name' | 'description' | 'isActive'>) => PrototypeFlow;
  updateFlowMeta: (
    flowId: string,
    meta: Pick<PrototypeFlow, 'name' | 'description' | 'isActive'>
  ) => void;
  deleteFlow: (flowId: string) => void;

  // Steps
  addStep: (flowId: string, step: Omit<PrototypeStep, 'id' | 'order'>) => void;
  updateStep: (flowId: string, step: PrototypeStep) => void;
  deleteStep: (flowId: string, stepId: string) => void;
  reorderStep: (flowId: string, fromIndex: number, toIndex: number) => void;

  // Questions
  saveQuestion: (question: PrototypeQuestion) => PrototypeQuestion;
  toggleQuestionActive: (questionId: string) => void;

  // Templates
  createTemplate: (name: string) => PrototypeTemplate;
  renameTemplate: (templateId: string, name: string) => void;
  deleteTemplate: (templateId: string) => void;

  // Template-question assignment
  assignQuestion: (templateId: string, questionId: string) => void;
  unassignQuestion: (templateId: string, questionId: string) => void;
  reorderTemplateQuestion: (templateId: string, fromIndex: number, toIndex: number) => void;

  // Scoring
  updateScoringConfig: (flowId: string, config: ScoringConfig) => void;
}

const PrototypeStoreContext = createContext<PrototypeStoreValue | null>(null);

const reindexSteps = (steps: PrototypeStep[]): PrototypeStep[] =>
  steps.map((step, index) => ({ ...step, order: index + 1 }));

export const PrototypeStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [flows, setFlows] = useState<PrototypeFlow[]>(INITIAL_FLOWS);
  const [questions, setQuestions] = useState<PrototypeQuestion[]>(INITIAL_QUESTIONS);
  const [templates, setTemplates] = useState<PrototypeTemplate[]>(INITIAL_TEMPLATES);
  const [view, setView] = useState<PrototypeView>({ name: 'flows' });

  const value = useMemo<PrototypeStoreValue>(() => {
    const mutateFlow = (flowId: string, fn: (flow: PrototypeFlow) => PrototypeFlow): void => {
      setFlows((prev) => prev.map((flow) => (flow.id === flowId ? fn(flow) : flow)));
    };

    const mutateTemplate = (
      templateId: string,
      fn: (template: PrototypeTemplate) => PrototypeTemplate
    ): void => {
      setTemplates((prev) =>
        prev.map((template) => (template.id === templateId ? fn(template) : template))
      );
    };

    return {
      flows,
      questions,
      templates,
      programmeTemplates: PROGRAMME_TEMPLATE_OPTIONS,
      view,
      navigate: setView,

      createFlow: (meta) => {
        const flow: PrototypeFlow = {
          id: nextId('flow'),
          publicId: makePublicId(),
          ...meta,
          steps: [],
          scoringConfig: { dimensions: [], programmeMappings: [] },
        };
        setFlows((prev) => [...prev, flow]);

        return flow;
      },

      updateFlowMeta: (flowId, meta) => {
        mutateFlow(flowId, (flow) => ({ ...flow, ...meta }));
      },

      deleteFlow: (flowId) => {
        setFlows((prev) => prev.filter((flow) => flow.id !== flowId));
      },

      addStep: (flowId, step) => {
        mutateFlow(flowId, (flow) => {
          const newStep: PrototypeStep = {
            ...step,
            id: nextId('step'),
            order: flow.steps.length + 1,
          };

          return { ...flow, steps: [...flow.steps, newStep] };
        });
      },

      updateStep: (flowId, step) => {
        mutateFlow(flowId, (flow) => ({
          ...flow,
          steps: flow.steps.map((existing) => (existing.id === step.id ? step : existing)),
        }));
      },

      deleteStep: (flowId, stepId) => {
        mutateFlow(flowId, (flow) => ({
          ...flow,
          steps: reindexSteps(flow.steps.filter((step) => step.id !== stepId)),
        }));
      },

      reorderStep: (flowId, fromIndex, toIndex) => {
        mutateFlow(flowId, (flow) => {
          if (
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= flow.steps.length ||
            toIndex >= flow.steps.length
          ) {
            return flow;
          }

          const next = [...flow.steps];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);

          return { ...flow, steps: reindexSteps(next) };
        });
      },

      saveQuestion: (question) => {
        const exists = questions.some((existing) => existing.id === question.id);

        if (exists) {
          setQuestions((prev) =>
            prev.map((existing) => (existing.id === question.id ? question : existing))
          );

          return question;
        }

        const created: PrototypeQuestion = {
          ...question,
          id: nextId('q'),
          publicId: makePublicId(),
        };
        setQuestions((prev) => [...prev, created]);

        return created;
      },

      toggleQuestionActive: (questionId) => {
        setQuestions((prev) =>
          prev.map((question) =>
            question.id === questionId ? { ...question, isActive: !question.isActive } : question
          )
        );
      },

      createTemplate: (name) => {
        const template: PrototypeTemplate = {
          id: nextId('template'),
          publicId: makePublicId(),
          name,
          questionIds: [],
        };
        setTemplates((prev) => [...prev, template]);

        return template;
      },

      renameTemplate: (templateId, name) => {
        mutateTemplate(templateId, (template) => ({ ...template, name }));
      },

      deleteTemplate: (templateId) => {
        setTemplates((prev) => prev.filter((template) => template.id !== templateId));
      },

      assignQuestion: (templateId, questionId) => {
        mutateTemplate(templateId, (template) =>
          template.questionIds.includes(questionId)
            ? template
            : { ...template, questionIds: [...template.questionIds, questionId] }
        );
      },

      unassignQuestion: (templateId, questionId) => {
        mutateTemplate(templateId, (template) => ({
          ...template,
          questionIds: template.questionIds.filter((id) => id !== questionId),
        }));
      },

      reorderTemplateQuestion: (templateId, fromIndex, toIndex) => {
        mutateTemplate(templateId, (template) => {
          if (
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= template.questionIds.length ||
            toIndex >= template.questionIds.length
          ) {
            return template;
          }

          const next = [...template.questionIds];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);

          return { ...template, questionIds: next };
        });
      },

      updateScoringConfig: (flowId, config) => {
        mutateFlow(flowId, (flow) => ({ ...flow, scoringConfig: config }));
      },
    };
  }, [flows, questions, templates, view]);

  return <PrototypeStoreContext.Provider value={value}>{children}</PrototypeStoreContext.Provider>;
};

// Throwaway prototype: provider + hook co-located for brevity (the real contexts split definitions).
// eslint-disable-next-line react-refresh/only-export-components
export const usePrototypeStore = (): PrototypeStoreValue => {
  const context = useContext(PrototypeStoreContext);

  if (!context) {
    throw new Error('usePrototypeStore must be used within a PrototypeStoreProvider');
  }

  return context;
};
