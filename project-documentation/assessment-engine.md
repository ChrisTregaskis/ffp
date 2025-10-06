# FFP - Assessment Engine Documentation

## Overview

The assessment engine is the core value proposition of FFP. It uses dynamic JSON-driven question flows with conditional logic to assess users and generate personalized workout programs.

## Design Principles

1. **JSON-driven**: Questions defined in JSON for non-technical editing
2. **Type-safe**: Zod schemas validate structure at runtime
3. **Conditional logic**: Dynamic question trees based on previous answers
4. **Pluggable scoring**: Multiple scoring strategies for different assessment types
5. **Audit trail**: Immutable history of all attempts
6. **Resume capability**: Save progress, continue later

## Question Schema

### Zod Schema Definition

```typescript
// types/assessment.schema.ts
import { z } from "zod";

export const AssessmentQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["single-choice", "multi-choice", "numeric", "text", "scale"]),
  question: z.string().min(1),
  description: z.string().optional(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
        score: z.number().optional(),
      })
    )
    .optional(),
  validation: z
    .object({
      required: z.boolean().default(true),
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      customError: z.string().optional(),
    })
    .optional(),
  conditionalLogic: z
    .array(
      z.object({
        condition: z.string(), // JSONPath or simple expression
        action: z.enum(["show", "hide", "require", "skip"]),
        targetQuestionIds: z.array(z.string()),
      })
    )
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const AssessmentTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number(),
  description: z.string().optional(),
  questions: z.array(AssessmentQuestionSchema),
  scoringConfig: z.object({
    strategy: z.enum(["weighted", "categorical", "rule-based"]),
    weights: z.record(z.number()).optional(),
    categories: z
      .array(
        z.object({
          name: z.string(),
          range: z.object({
            min: z.number(),
            max: z.number(),
          }),
          programRecommendation: z.string(),
        })
      )
      .optional(),
    rules: z
      .array(
        z.object({
          condition: z.string(),
          action: z.string(),
          priority: z.number(),
        })
      )
      .optional(),
  }),
});

export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;
export type AssessmentTemplate = z.infer<typeof AssessmentTemplateSchema>;
```

## Example Assessment Template

```json
{
  "id": "general-fitness-v1",
  "name": "General Fitness Assessment",
  "version": 1,
  "description": "Comprehensive fitness level and goal assessment",
  "questions": [
    {
      "id": "q1",
      "type": "single-choice",
      "question": "What is your primary fitness goal?",
      "options": [
        { "value": "lose_weight", "label": "Lose weight", "score": 1 },
        { "value": "build_muscle", "label": "Build muscle", "score": 2 },
        {
          "value": "improve_flexibility",
          "label": "Improve flexibility",
          "score": 3
        },
        {
          "value": "reduce_pain",
          "label": "Reduce pain/injury recovery",
          "score": 4
        }
      ],
      "validation": { "required": true }
    },
    {
      "id": "q2",
      "type": "scale",
      "question": "On a scale of 1-10, how would you rate your current pain level?",
      "validation": {
        "required": true,
        "min": 1,
        "max": 10
      },
      "conditionalLogic": [
        {
          "condition": "q1 == 'reduce_pain'",
          "action": "show",
          "targetQuestionIds": ["q2"]
        }
      ]
    },
    {
      "id": "q3",
      "type": "multi-choice",
      "question": "Which areas of your body experience pain? (Select all that apply)",
      "options": [
        { "value": "lower_back", "label": "Lower back" },
        { "value": "neck", "label": "Neck" },
        { "value": "shoulders", "label": "Shoulders" },
        { "value": "knees", "label": "Knees" },
        { "value": "hips", "label": "Hips" }
      ],
      "conditionalLogic": [
        {
          "condition": "q2 > 3",
          "action": "show",
          "targetQuestionIds": ["q3"]
        }
      ]
    },
    {
      "id": "q4",
      "type": "single-choice",
      "question": "How many days per week can you commit to exercising?",
      "options": [
        { "value": "1-2", "label": "1-2 days", "score": 1 },
        { "value": "3-4", "label": "3-4 days", "score": 2 },
        { "value": "5+", "label": "5 or more days", "score": 3 }
      ],
      "validation": { "required": true }
    },
    {
      "id": "q5",
      "type": "single-choice",
      "question": "What equipment do you have access to?",
      "options": [
        { "value": "none", "label": "No equipment (bodyweight only)" },
        { "value": "basic", "label": "Basic (dumbbells, resistance bands)" },
        { "value": "full_gym", "label": "Full gym access" }
      ],
      "validation": { "required": true }
    }
  ],
  "scoringConfig": {
    "strategy": "categorical",
    "categories": [
      {
        "name": "beginner_pain_management",
        "range": { "min": 0, "max": 30 },
        "programRecommendation": "gentle_mobility_program"
      },
      {
        "name": "intermediate_strength",
        "range": { "min": 31, "max": 60 },
        "programRecommendation": "balanced_strength_program"
      },
      {
        "name": "advanced_performance",
        "range": { "min": 61, "max": 100 },
        "programRecommendation": "high_intensity_program"
      }
    ]
  }
}
```

## Assessment Service

### Service Interface

```typescript
// services/assessment.service.ts
export interface AssessmentService {
  getTemplate(templateId: string): Promise<AssessmentTemplate>;
  startAssessment(
    userId: string,
    tenantId: string,
    templateId: string
  ): Promise<UserAssessment>;
  saveProgress(
    assessmentId: string,
    answers: Record<string, any>,
    context: TenantContext
  ): Promise<void>;
  submitAssessment(
    assessmentId: string,
    answers: Record<string, any>,
    context: TenantContext
  ): Promise<AssessmentResult>;
  getAssessmentHistory(
    userId: string,
    context: TenantContext
  ): Promise<UserAssessment[]>;
}
```

### Implementation

```typescript
export class AssessmentServiceImpl implements AssessmentService {
  constructor(
    private assessmentRepo: AssessmentRepository,
    private templateRepo: TemplateRepository,
    private scoringEngine: ScoringEngine,
    private programGenerator: ProgramGenerator
  ) {}

  async startAssessment(
    userId: string,
    tenantId: string,
    templateId: string
  ): Promise<UserAssessment> {
    // Validate template exists
    const template = await this.templateRepo.getById(templateId);
    if (!template || !template.is_active) {
      throw new NotFoundError("Assessment template");
    }

    // Create new assessment
    const assessment = await this.assessmentRepo.create({
      tenant_id: tenantId,
      user_id: userId,
      template_id: templateId,
      status: "in_progress",
      answers: {},
      started_at: new Date(),
    });

    return assessment;
  }

  async saveProgress(
    assessmentId: string,
    answers: Record<string, any>,
    context: TenantContext
  ): Promise<void> {
    // Validate answers against template
    const assessment = await this.assessmentRepo.getById(assessmentId, context);
    const template = await this.templateRepo.getById(assessment.template_id);

    this.validateAnswers(answers, template);

    // Save progress
    await this.assessmentRepo.update(
      assessmentId,
      {
        answers,
        updated_at: new Date(),
      },
      context
    );
  }

  async submitAssessment(
    assessmentId: string,
    answers: Record<string, any>,
    context: TenantContext
  ): Promise<AssessmentResult> {
    // Get assessment and template
    const assessment = await this.assessmentRepo.getById(assessmentId, context);
    const template = await this.templateRepo.getById(assessment.template_id);

    // Validate all required questions answered
    this.validateCompleteness(answers, template);

    // Calculate scores
    const score = await this.scoringEngine.calculate(answers, template);

    // Update assessment
    await this.assessmentRepo.update(
      assessmentId,
      {
        answers,
        score,
        status: "completed",
        completed_at: new Date(),
      },
      context
    );

    // Generate program based on scores
    const program = await this.programGenerator.generate(
      context.userId,
      context.tenantId,
      assessmentId,
      score,
      template
    );

    return {
      assessment,
      score,
      program,
    };
  }

  private validateAnswers(
    answers: Record<string, any>,
    template: AssessmentTemplate
  ): void {
    for (const [questionId, answer] of Object.entries(answers)) {
      const question = template.questions.find((q) => q.id === questionId);
      if (!question) continue;

      // Validate based on question type
      switch (question.type) {
        case "numeric":
        case "scale":
          if (
            question.validation?.min !== undefined &&
            answer < question.validation.min
          ) {
            throw new ValidationError(`Answer for ${questionId} below minimum`);
          }
          if (
            question.validation?.max !== undefined &&
            answer > question.validation.max
          ) {
            throw new ValidationError(`Answer for ${questionId} above maximum`);
          }
          break;
        case "single-choice":
          if (!question.options?.find((o) => o.value === answer)) {
            throw new ValidationError(`Invalid option for ${questionId}`);
          }
          break;
        case "multi-choice":
          if (!Array.isArray(answer)) {
            throw new ValidationError(
              `Multi-choice answer must be array for ${questionId}`
            );
          }
          break;
      }
    }
  }

  private validateCompleteness(
    answers: Record<string, any>,
    template: AssessmentTemplate
  ): void {
    const requiredQuestions = template.questions.filter(
      (q) => q.validation?.required
    );

    for (const question of requiredQuestions) {
      if (!(question.id in answers)) {
        throw new ValidationError(
          `Required question ${question.id} not answered`
        );
      }
    }
  }
}
```

## Scoring Engine

### Scoring Strategies

```typescript
// services/scoring-engine.ts
export interface ScoringStrategy {
  calculate(
    answers: Record<string, any>,
    template: AssessmentTemplate
  ): Promise<AssessmentScore>;
}

// Weighted scoring (sum of weighted answers)
export class WeightedScoringStrategy implements ScoringStrategy {
  async calculate(
    answers: Record<string, any>,
    template: AssessmentTemplate
  ): Promise<AssessmentScore> {
    let totalScore = 0;
    const weights = template.scoringConfig.weights || {};

    for (const [questionId, answer] of Object.entries(answers)) {
      const question = template.questions.find((q) => q.id === questionId);
      const weight = weights[questionId] || 1;

      if (question?.type === "single-choice") {
        const option = question.options?.find((o) => o.value === answer);
        totalScore += (option?.score || 0) * weight;
      } else if (typeof answer === "number") {
        totalScore += answer * weight;
      }
    }

    return {
      totalScore,
      strategy: "weighted",
      breakdown: {},
    };
  }
}

// Categorical scoring (classify into categories)
export class CategoricalScoringStrategy implements ScoringStrategy {
  async calculate(
    answers: Record<string, any>,
    template: AssessmentTemplate
  ): Promise<AssessmentScore> {
    // First calculate weighted score
    const weightedStrategy = new WeightedScoringStrategy();
    const { totalScore } = await weightedStrategy.calculate(answers, template);

    // Find matching category
    const category = template.scoringConfig.categories?.find(
      (cat) => totalScore >= cat.range.min && totalScore <= cat.range.max
    );

    return {
      totalScore,
      category: category?.name,
      programRecommendation: category?.programRecommendation,
      strategy: "categorical",
    };
  }
}

// Rule-based scoring (complex conditional logic)
export class RuleBasedScoringStrategy implements ScoringStrategy {
  async calculate(
    answers: Record<string, any>,
    template: AssessmentTemplate
  ): Promise<AssessmentScore> {
    const rules = template.scoringConfig.rules || [];
    const applicableRules = [];

    // Evaluate all rules
    for (const rule of rules) {
      if (this.evaluateCondition(rule.condition, answers)) {
        applicableRules.push(rule);
      }
    }

    // Sort by priority
    applicableRules.sort((a, b) => b.priority - a.priority);

    // Execute highest priority rule
    const primaryRule = applicableRules[0];

    return {
      totalScore: 0,
      rules: applicableRules.map((r) => r.action),
      primaryAction: primaryRule?.action,
      strategy: "rule-based",
    };
  }

  private evaluateCondition(
    condition: string,
    answers: Record<string, any>
  ): boolean {
    // Simple expression evaluation (e.g., "q1 == 'reduce_pain' && q2 > 5")
    // In production, use a proper expression evaluator like mathjs
    const func = new Function(
      "answers",
      `return ${this.transformCondition(condition)}`
    );
    return func(answers);
  }

  private transformCondition(condition: string): string {
    // Transform "q1 == 'value'" to "answers['q1'] == 'value'"
    return condition.replace(/([a-zA-Z0-9_]+)/g, (match) => {
      if (["true", "false", "null", "undefined"].includes(match)) return match;
      return `answers['${match}']`;
    });
  }
}

// Factory to select strategy
export class ScoringEngine {
  async calculate(
    answers: Record<string, any>,
    template: AssessmentTemplate
  ): Promise<AssessmentScore> {
    const strategy = this.getStrategy(template.scoringConfig.strategy);
    return await strategy.calculate(answers, template);
  }

  private getStrategy(strategyType: string): ScoringStrategy {
    switch (strategyType) {
      case "weighted":
        return new WeightedScoringStrategy();
      case "categorical":
        return new CategoricalScoringStrategy();
      case "rule-based":
        return new RuleBasedScoringStrategy();
      default:
        throw new Error(`Unknown scoring strategy: ${strategyType}`);
    }
  }
}
```

## Program Generator

```typescript
// services/program-generator.ts
export class ProgramGenerator {
  constructor(
    private programRepo: ProgramRepository,
    private videoRepo: VideoRepository
  ) {}

  async generate(
    userId: string,
    tenantId: string,
    assessmentId: string,
    score: AssessmentScore,
    template: AssessmentTemplate
  ): Promise<Program> {
    // Determine program parameters based on score
    const { duration, difficulty, focusAreas, equipment } =
      this.determineProgramParams(score);

    // Create program
    const program = await this.programRepo.create({
      tenant_id: tenantId,
      user_id: userId,
      assessment_id: assessmentId,
      name: this.generateProgramName(score),
      description: this.generateProgramDescription(score),
      duration_weeks: duration,
      difficulty_level: difficulty,
    });

    // Select appropriate exercises
    const exercises = await this.selectExercises(
      focusAreas,
      difficulty,
      equipment
    );

    // Create sessions (e.g., 3 sessions per week for duration)
    const sessionsPerWeek = 3;
    const totalSessions = duration * sessionsPerWeek;

    for (let i = 0; i < totalSessions; i++) {
      const session = await this.programRepo.createSession({
        tenant_id: tenantId,
        program_id: program.id,
        session_number: i + 1,
        name: `Week ${Math.floor(i / sessionsPerWeek) + 1}, Session ${
          (i % sessionsPerWeek) + 1
        }`,
        description: this.generateSessionDescription(i, focusAreas),
        estimated_duration_minutes: 45,
      });

      // Add exercises to session
      const sessionExercises = this.selectSessionExercises(
        exercises,
        i,
        difficulty
      );
      for (let j = 0; j < sessionExercises.length; j++) {
        await this.programRepo.createSessionExercise({
          session_id: session.id,
          video_id: sessionExercises[j].id,
          exercise_order: j + 1,
          sets: sessionExercises[j].sets,
          reps: sessionExercises[j].reps,
          duration_seconds: sessionExercises[j].duration_seconds,
          rest_seconds: 60,
        });
      }
    }

    return program;
  }

  private determineProgramParams(score: AssessmentScore) {
    // Logic to determine duration, difficulty, focus areas based on score
    return {
      duration: 8, // weeks
      difficulty: score.category?.includes("beginner")
        ? "beginner"
        : "intermediate",
      focusAreas: ["core", "legs", "upper_body"],
      equipment: ["dumbbells", "resistance_band"],
    };
  }

  private async selectExercises(
    focusAreas: string[],
    difficulty: string,
    equipment: string[]
  ) {
    return await this.videoRepo.findByFilters({
      body_parts: focusAreas,
      difficulty_level: difficulty,
      equipment: equipment,
      is_active: true,
    });
  }

  private selectSessionExercises(
    exercises: Video[],
    sessionIndex: number,
    difficulty: string
  ) {
    // Rotate through exercises, progressive overload
    const exercisesPerSession = difficulty === "beginner" ? 5 : 8;
    return exercises.slice(0, exercisesPerSession).map((e) => ({
      ...e,
      sets: difficulty === "beginner" ? 2 : 3,
      reps: 12,
      duration_seconds: null,
    }));
  }

  private generateProgramName(score: AssessmentScore): string {
    return `${score.category || "Custom"} Program`;
  }

  private generateProgramDescription(score: AssessmentScore): string {
    return `Personalized program based on your assessment results.`;
  }

  private generateSessionDescription(
    sessionIndex: number,
    focusAreas: string[]
  ): string {
    return `Focus on ${
      focusAreas[sessionIndex % focusAreas.length]
    } strength and mobility.`;
  }
}
```

## Frontend Implementation

### Assessment Flow Component

```typescript
// pages/AssessmentPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AssessmentQuestion } from "../components/AssessmentQuestion";
import { useAuth } from "../contexts/AuthContext";

export function AssessmentPage() {
  const { templateId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    startAssessment();
  }, []);

  async function startAssessment() {
    const response = await fetch("/api/assessments/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId }),
    });
    const data = await response.json();
    setAssessmentId(data.id);
    setTemplate(data.template);
  }

  const visibleQuestions = template?.questions.filter((q) =>
    shouldShowQuestion(q, answers)
  );

  const currentQuestion = visibleQuestions?.[currentQuestionIndex];

  async function handleAnswer(value: any) {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Save progress
    await fetch(`/api/assessments/${assessmentId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: newAnswers }),
    });

    // Move to next question or submit
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      await submitAssessment(newAnswers);
    }
  }

  async function submitAssessment(finalAnswers: Record<string, any>) {
    setLoading(true);
    const response = await fetch(`/api/assessments/${assessmentId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: finalAnswers }),
    });
    const result = await response.json();
    navigate(`/programs/${result.program.id}`);
  }

  if (!template) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="text-sm text-gray-600">
          Question {currentQuestionIndex + 1} of {visibleQuestions.length}
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{
              width: `${
                ((currentQuestionIndex + 1) / visibleQuestions.length) * 100
              }%`,
            }}
          />
        </div>
      </div>

      <AssessmentQuestion
        question={currentQuestion}
        value={answers[currentQuestion.id]}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
```

## Testing

### Unit Tests for Scoring

```typescript
describe("ScoringEngine", () => {
  it("calculates weighted scores correctly", async () => {
    const engine = new ScoringEngine();
    const answers = { q1: "lose_weight", q4: "3-4" };
    const template = mockTemplate;

    const result = await engine.calculate(answers, template);

    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.strategy).toBe("weighted");
  });

  it("categorizes users into correct program", async () => {
    const engine = new ScoringEngine();
    const answers = { q1: "reduce_pain", q2: 8, q3: ["lower_back"] };
    const template = mockTemplate;

    const result = await engine.calculate(answers, template);

    expect(result.category).toBe("beginner_pain_management");
    expect(result.programRecommendation).toBe("gentle_mobility_program");
  });
});
```

## Storage

### S3 for Templates

- **Location**: `s3://ffp-assessment-templates-{env}/`
- **Format**: JSON files
- **Versioning**: Enabled (track template changes)
- **Access**: Lambda read-only via IAM role

### PostgreSQL for Responses

- User assessment instances
- Answers (JSONB column)
- Scores (JSONB column)
- Full audit trail

## Future Enhancements

### Visual Question Editor

- Drag-and-drop question builder
- Real-time preview
- Conditional logic visual flow

### A/B Testing

- Multiple template versions
- Compare completion rates
- Optimize based on data

### Advanced Analytics

- Question difficulty analysis
- Dropout point identification
- Program outcome correlation
