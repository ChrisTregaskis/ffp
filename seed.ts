/**
 * FFP - Database Seed Data
 *
 * This file contains initial data for development and testing.
 * Run with: npm run seed
 *
 * Includes:
 * - Global configuration
 * - Assessment categories and templates
 * - Video library
 * - Support articles
 * - Test tenant and users
 */

// import { randomUUID } from 'crypto';

// Replace with 'crypto' when application created?
const randomUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (character) => {
      const randomValue = (Math.random() * 16) | 0,
        value = character === "x" ? randomValue : (randomValue & 0x3) | 0x8;
      return value.toString(16);
    }
  );
};

// ============================================================================
// GLOBAL CONFIGURATION
// ============================================================================

export const globalConfig = [
  {
    id: randomUUID(),
    key: "theme",
    value: {
      primary: "#007bff",
      secondary: "#6c757d",
      success: "#28a745",
      danger: "#dc3545",
      warning: "#ffc107",
      info: "#17a2b8",
      light: "#f8f9fa",
      dark: "#343a40",
    },
    description: "Default theme colors for the application",
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    key: "features",
    value: {
      enableAssessments: true,
      enablePrograms: true,
      enableVideoLibrary: true,
      enableBusinessPortal: true,
      enableNotifications: true,
      enableAuditLogging: true,
    },
    description: "Feature flags for the application",
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    key: "defaults",
    value: {
      programDurationWeeks: 8,
      sessionsPerWeek: 3,
      sessionDurationMinutes: 45,
      missedSessionStrategy: "flexible",
      notificationPreferences: {
        welcomeEmail: true,
        programReminders: true,
        weeklyDigest: false,
      },
    },
    description: "Default values for programs and settings",
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// ============================================================================
// ASSESSMENT CATEGORIES
// ============================================================================

const categoryBackPain = randomUUID();
const categoryShoulderPain = randomUUID();
const categoryKneePain = randomUUID();
const categoryGeneralFitness = randomUUID();

export const assessmentCategories = [
  {
    id: categoryBackPain,
    code: "back-pain",
    name: "Back Pain Assessment",
    description:
      "Comprehensive assessment for lower back and upper back pain conditions",
    created_at: new Date(),
  },
  {
    id: categoryShoulderPain,
    code: "shoulder-pain",
    name: "Shoulder Pain Assessment",
    description:
      "Assessment for shoulder mobility, pain, and rotator cuff conditions",
    created_at: new Date(),
  },
  {
    id: categoryKneePain,
    code: "knee-pain",
    name: "Knee Pain Assessment",
    description:
      "Assessment for knee pain, mobility, and post-injury rehabilitation",
    created_at: new Date(),
  },
  {
    id: categoryGeneralFitness,
    code: "general-fitness",
    name: "General Fitness Assessment",
    description: "Overall fitness level and wellness assessment",
    created_at: new Date(),
  },
];

// ============================================================================
// ASSESSMENT TEMPLATES
// ============================================================================

export const assessmentTemplates = [
  {
    id: randomUUID(),
    category_id: categoryBackPain,
    name: "Lower Back Pain Assessment v1",
    description:
      "Initial assessment for lower back pain with scoring and program generation",
    version: 1,
    questions: {
      questions: [
        {
          id: "q1",
          type: "single-choice",
          question: "What is your primary goal?",
          description: "This helps us tailor your program to your needs",
          options: [
            { value: "reduce_pain", label: "Reduce pain", score: 1 },
            { value: "improve_mobility", label: "Improve mobility", score: 2 },
            {
              value: "prevent_injury",
              label: "Prevent future injury",
              score: 3,
            },
            {
              value: "return_to_activity",
              label: "Return to normal activities",
              score: 4,
            },
          ],
          validation: { required: true },
        },
        {
          id: "q2",
          type: "scale",
          question:
            "On a scale of 1-10, how would you rate your current pain level?",
          description: "1 = No pain, 10 = Worst pain imaginable",
          validation: {
            required: true,
            min: 1,
            max: 10,
          },
        },
        {
          id: "q3",
          type: "multi-choice",
          question:
            "Which activities aggravate your back pain? (Select all that apply)",
          options: [
            { value: "sitting", label: "Sitting for long periods" },
            { value: "standing", label: "Standing for long periods" },
            { value: "bending", label: "Bending forward" },
            { value: "lifting", label: "Lifting objects" },
            { value: "twisting", label: "Twisting movements" },
            { value: "walking", label: "Walking" },
            { value: "sleeping", label: "Sleeping" },
          ],
          validation: { required: true },
        },
        {
          id: "q4",
          type: "single-choice",
          question: "How long have you experienced back pain?",
          options: [
            { value: "less_than_1_week", label: "Less than 1 week", score: 1 },
            { value: "1_4_weeks", label: "1-4 weeks", score: 2 },
            { value: "1_3_months", label: "1-3 months", score: 3 },
            { value: "3_6_months", label: "3-6 months", score: 4 },
            {
              value: "more_than_6_months",
              label: "More than 6 months",
              score: 5,
            },
          ],
          validation: { required: true },
        },
        {
          id: "q5",
          type: "single-choice",
          question:
            "Have you seen a healthcare professional about your back pain?",
          options: [
            { value: "yes_physiotherapist", label: "Yes, a physiotherapist" },
            { value: "yes_doctor", label: "Yes, a doctor" },
            { value: "yes_chiropractor", label: "Yes, a chiropractor" },
            { value: "no", label: "No, not yet" },
          ],
          validation: { required: true },
        },
        {
          id: "q6",
          type: "single-choice",
          question: "How many days per week can you commit to exercises?",
          options: [
            { value: "1-2", label: "1-2 days per week", score: 1 },
            { value: "3-4", label: "3-4 days per week", score: 2 },
            { value: "5+", label: "5 or more days per week", score: 3 },
          ],
          validation: { required: true },
        },
        {
          id: "q7",
          type: "single-choice",
          question: "What equipment do you have access to?",
          options: [
            { value: "none", label: "No equipment (bodyweight only)" },
            {
              value: "basic",
              label: "Basic equipment (resistance bands, mat)",
            },
            { value: "full_gym", label: "Full gym access" },
          ],
          validation: { required: true },
        },
      ],
    },
    scoring_config: {
      strategy: "categorical",
      weights: {
        q1: 1,
        q2: 2,
        q4: 1.5,
        q6: 1,
      },
      categories: [
        {
          name: "acute_pain_beginner",
          range: { min: 0, max: 30 },
          programRecommendation: "gentle_mobility_program",
          description: "Focus on gentle movements and pain management",
        },
        {
          name: "chronic_pain_intermediate",
          range: { min: 31, max: 60 },
          programRecommendation: "progressive_strengthening_program",
          description: "Build core strength and stability",
        },
        {
          name: "recovery_advanced",
          range: { min: 61, max: 100 },
          programRecommendation: "advanced_rehabilitation_program",
          description: "Return to full function and prevent recurrence",
        },
      ],
    },
    is_active: true,
    created_by: null, // System-generated
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    category_id: categoryGeneralFitness,
    name: "General Fitness Assessment v1",
    description:
      "Assess overall fitness level, goals, and exercise preferences",
    version: 1,
    questions: {
      questions: [
        {
          id: "q1",
          type: "single-choice",
          question: "What is your primary fitness goal?",
          options: [
            { value: "lose_weight", label: "Lose weight", score: 1 },
            { value: "build_muscle", label: "Build muscle", score: 2 },
            {
              value: "improve_endurance",
              label: "Improve endurance",
              score: 3,
            },
            {
              value: "increase_flexibility",
              label: "Increase flexibility",
              score: 4,
            },
            {
              value: "general_health",
              label: "General health and wellness",
              score: 5,
            },
          ],
          validation: { required: true },
        },
        {
          id: "q2",
          type: "single-choice",
          question: "How would you describe your current fitness level?",
          options: [
            {
              value: "sedentary",
              label: "Sedentary (little to no exercise)",
              score: 1,
            },
            {
              value: "beginner",
              label: "Beginner (occasional exercise)",
              score: 2,
            },
            {
              value: "intermediate",
              label: "Intermediate (regular exercise)",
              score: 3,
            },
            { value: "advanced", label: "Advanced (very active)", score: 4 },
          ],
          validation: { required: true },
        },
        {
          id: "q3",
          type: "single-choice",
          question: "How many days per week can you commit to exercising?",
          options: [
            { value: "1-2", label: "1-2 days per week", score: 1 },
            { value: "3-4", label: "3-4 days per week", score: 2 },
            { value: "5+", label: "5 or more days per week", score: 3 },
          ],
          validation: { required: true },
        },
        {
          id: "q4",
          type: "single-choice",
          question: "What equipment do you have access to?",
          options: [
            { value: "none", label: "No equipment (bodyweight only)" },
            { value: "basic", label: "Basic (dumbbells, resistance bands)" },
            { value: "full_gym", label: "Full gym access" },
          ],
          validation: { required: true },
        },
        {
          id: "q5",
          type: "multi-choice",
          question:
            "Do you have any injuries or limitations? (Select all that apply)",
          options: [
            { value: "none", label: "No injuries or limitations" },
            { value: "back", label: "Back issues" },
            { value: "knee", label: "Knee issues" },
            { value: "shoulder", label: "Shoulder issues" },
            { value: "other", label: "Other (specify in notes)" },
          ],
          validation: { required: true },
        },
      ],
    },
    scoring_config: {
      strategy: "categorical",
      categories: [
        {
          name: "beginner",
          range: { min: 0, max: 30 },
          programRecommendation: "beginner_fitness_program",
        },
        {
          name: "intermediate",
          range: { min: 31, max: 60 },
          programRecommendation: "intermediate_fitness_program",
        },
        {
          name: "advanced",
          range: { min: 61, max: 100 },
          programRecommendation: "advanced_fitness_program",
        },
      ],
    },
    is_active: true,
    created_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// ============================================================================
// VIDEOS (Exercise Library)
// ============================================================================

export const videos = [
  // Lower Back Exercises
  {
    id: randomUUID(),
    title: "Cat-Cow Stretch",
    description:
      "Gentle spinal mobility exercise to warm up the back and improve flexibility",
    s3_key: "library/cat-cow-stretch.mp4",
    thumbnail_url: "library/cat-cow-stretch-thumb.jpg",
    duration_seconds: 90,
    difficulty_level: "beginner",
    body_parts: ["back", "core"],
    equipment: ["none"],
    tags: ["mobility", "warm-up", "gentle", "flexibility"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    title: "Pelvic Tilts",
    description:
      "Core activation exercise to strengthen lower back and improve pelvic control",
    s3_key: "library/pelvic-tilts.mp4",
    thumbnail_url: "library/pelvic-tilts-thumb.jpg",
    duration_seconds: 120,
    difficulty_level: "beginner",
    body_parts: ["back", "core"],
    equipment: ["mat"],
    tags: ["core", "stability", "beginner", "rehabilitation"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    title: "Bird Dog Exercise",
    description:
      "Core stability exercise targeting back, core, and improving balance",
    s3_key: "library/bird-dog.mp4",
    thumbnail_url: "library/bird-dog-thumb.jpg",
    duration_seconds: 150,
    difficulty_level: "intermediate",
    body_parts: ["back", "core"],
    equipment: ["mat"],
    tags: ["core", "stability", "balance", "strength"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    title: "Dead Bug Exercise",
    description:
      "Core strengthening exercise focusing on lower back stability and coordination",
    s3_key: "library/dead-bug.mp4",
    thumbnail_url: "library/dead-bug-thumb.jpg",
    duration_seconds: 120,
    difficulty_level: "intermediate",
    body_parts: ["core", "back"],
    equipment: ["mat"],
    tags: ["core", "stability", "coordination", "strength"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    title: "Glute Bridge",
    description:
      "Hip and glute strengthening exercise that supports lower back health",
    s3_key: "library/glute-bridge.mp4",
    thumbnail_url: "library/glute-bridge-thumb.jpg",
    duration_seconds: 90,
    difficulty_level: "beginner",
    body_parts: ["legs", "back", "core"],
    equipment: ["mat"],
    tags: ["glutes", "hips", "strength", "lower-back"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },

  // Leg Exercises
  {
    id: randomUUID(),
    title: "Bodyweight Squats",
    description:
      "Fundamental lower body exercise building leg strength and mobility",
    s3_key: "library/bodyweight-squats.mp4",
    thumbnail_url: "library/bodyweight-squats-thumb.jpg",
    duration_seconds: 120,
    difficulty_level: "beginner",
    body_parts: ["legs", "core"],
    equipment: ["none"],
    tags: ["compound", "lower-body", "strength", "functional"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    title: "Lunges",
    description:
      "Single-leg exercise improving balance, stability, and leg strength",
    s3_key: "library/lunges.mp4",
    thumbnail_url: "library/lunges-thumb.jpg",
    duration_seconds: 150,
    difficulty_level: "intermediate",
    body_parts: ["legs", "core"],
    equipment: ["none"],
    tags: ["compound", "lower-body", "balance", "strength"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    title: "Calf Raises",
    description: "Ankle strengthening exercise for calf muscles and stability",
    s3_key: "library/calf-raises.mp4",
    thumbnail_url: "library/calf-raises-thumb.jpg",
    duration_seconds: 90,
    difficulty_level: "beginner",
    body_parts: ["legs"],
    equipment: ["none"],
    tags: ["calves", "ankle", "strength", "stability"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },

  // Upper Body Exercises
  {
    id: randomUUID(),
    title: "Push-Ups",
    description:
      "Classic upper body exercise strengthening chest, shoulders, and triceps",
    s3_key: "library/push-ups.mp4",
    thumbnail_url: "library/push-ups-thumb.jpg",
    duration_seconds: 120,
    difficulty_level: "intermediate",
    body_parts: ["upper-body", "core"],
    equipment: ["none"],
    tags: ["compound", "upper-body", "strength", "chest"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    title: "Shoulder Press with Dumbbells",
    description:
      "Overhead pressing movement building shoulder strength and stability",
    s3_key: "library/shoulder-press.mp4",
    thumbnail_url: "library/shoulder-press-thumb.jpg",
    duration_seconds: 120,
    difficulty_level: "intermediate",
    body_parts: ["upper-body"],
    equipment: ["dumbbells"],
    tags: ["shoulders", "upper-body", "strength", "pressing"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    title: "Bicep Curls",
    description:
      "Isolation exercise targeting bicep muscles with controlled movement",
    s3_key: "library/bicep-curls.mp4",
    thumbnail_url: "library/bicep-curls-thumb.jpg",
    duration_seconds: 90,
    difficulty_level: "beginner",
    body_parts: ["upper-body"],
    equipment: ["dumbbells"],
    tags: ["biceps", "upper-body", "strength", "isolation"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    title: "Resistance Band Rows",
    description: "Upper back strengthening exercise using resistance bands",
    s3_key: "library/resistance-band-rows.mp4",
    thumbnail_url: "library/resistance-band-rows-thumb.jpg",
    duration_seconds: 120,
    difficulty_level: "beginner",
    body_parts: ["upper-body", "back"],
    equipment: ["resistance-band"],
    tags: ["back", "upper-body", "strength", "pulling"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },

  // Core Exercises
  {
    id: randomUUID(),
    title: "Plank Hold",
    description: "Isometric core exercise building stability and endurance",
    s3_key: "library/plank-hold.mp4",
    thumbnail_url: "library/plank-hold-thumb.jpg",
    duration_seconds: 60,
    difficulty_level: "beginner",
    body_parts: ["core"],
    equipment: ["mat"],
    tags: ["core", "stability", "isometric", "endurance"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    title: "Side Plank",
    description:
      "Lateral core strengthening exercise for obliques and stability",
    s3_key: "library/side-plank.mp4",
    thumbnail_url: "library/side-plank-thumb.jpg",
    duration_seconds: 60,
    difficulty_level: "intermediate",
    body_parts: ["core"],
    equipment: ["mat"],
    tags: ["core", "obliques", "stability", "isometric"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    title: "Russian Twists",
    description:
      "Rotational core exercise targeting obliques and improving coordination",
    s3_key: "library/russian-twists.mp4",
    thumbnail_url: "library/russian-twists-thumb.jpg",
    duration_seconds: 90,
    difficulty_level: "intermediate",
    body_parts: ["core"],
    equipment: ["mat"],
    tags: ["core", "obliques", "rotation", "strength"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },

  // Flexibility/Mobility
  {
    id: randomUUID(),
    title: "Hamstring Stretch",
    description:
      "Static stretch for hamstring flexibility and lower back relief",
    s3_key: "library/hamstring-stretch.mp4",
    thumbnail_url: "library/hamstring-stretch-thumb.jpg",
    duration_seconds: 60,
    difficulty_level: "beginner",
    body_parts: ["legs"],
    equipment: ["mat"],
    tags: ["flexibility", "stretching", "hamstrings", "cool-down"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    title: "Hip Flexor Stretch",
    description:
      "Stretch targeting hip flexors to improve mobility and reduce lower back tension",
    s3_key: "library/hip-flexor-stretch.mp4",
    thumbnail_url: "library/hip-flexor-stretch-thumb.jpg",
    duration_seconds: 60,
    difficulty_level: "beginner",
    body_parts: ["legs", "back"],
    equipment: ["mat"],
    tags: ["flexibility", "stretching", "hips", "mobility"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    title: "Child's Pose",
    description:
      "Restorative yoga pose for back relaxation and gentle stretching",
    s3_key: "library/childs-pose.mp4",
    thumbnail_url: "library/childs-pose-thumb.jpg",
    duration_seconds: 90,
    difficulty_level: "beginner",
    body_parts: ["back", "legs"],
    equipment: ["mat"],
    tags: ["flexibility", "stretching", "yoga", "relaxation", "cool-down"],
    is_active: true,
    view_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// ============================================================================
// SUPPORT ARTICLES
// ============================================================================

export const supportArticles = [
  // Getting Started
  {
    id: randomUUID(),
    title: "Welcome to Fit For Purpose",
    content: `# Welcome to Fit For Purpose!

Thank you for choosing FFP to support your fitness and rehabilitation journey. This guide will help you get started.

## What is FFP?

Fit For Purpose is a personalized physiotherapy and fitness platform that creates custom exercise programs based on your assessment results.

## Getting Started

1. **Complete Your Assessment**: Take the initial assessment to help us understand your needs
2. **Review Your Program**: We'll generate a personalized program based on your results
3. **Start Exercising**: Follow along with video demonstrations
4. **Track Progress**: Mark exercises as complete and track your journey

## Need Help?

Browse our support articles or contact support@ffp.app`,
    category: "getting-started",
    tags: ["welcome", "overview", "getting-started"],
    order: 1,
    is_published: true,
    view_count: 0,
    created_by: null,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    title: "How to Complete an Assessment",
    content: `# How to Complete an Assessment

Assessments help us create the perfect program for you.

## Steps

1. Click "Start Assessment" from your dashboard
2. Answer all questions honestly and completely
3. Take your time - there's no rush
4. You can save progress and continue later
5. Submit when ready

## Tips for Accurate Results

- Be honest about pain levels
- Consider your time availability realistically
- Note any limitations or injuries
- Don't hesitate to skip questions if unsure

After submission, your personalized program will be generated within minutes!`,
    category: "getting-started",
    tags: ["assessment", "getting-started", "how-to"],
    order: 2,
    is_published: true,
    view_count: 0,
    created_by: null,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },

  // Users & Business Portal
  {
    id: randomUUID(),
    title: "How to Add a New User (Business Owners)",
    content: `# Adding New Users to Your Business Account

Business owners can invite team members or patients to join FFP.

## Steps to Add a User

1. Navigate to Business Portal
2. Click "Users" in the sidebar
3. Click "Invite User"
4. Fill in user details:
   - Email address
   - First name and last name
   - Role (Admin or User)
5. Click "Send Invitation"

## User Roles

- **Business Admin**: Can invite users and view all programs
- **Business User**: Can only view their own programs

The invited user will receive an email with login credentials and must change their password on first login.`,
    category: "users",
    tags: ["business-portal", "users", "invitation"],
    order: 1,
    is_published: true,
    view_count: 0,
    created_by: null,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },

  // Programs
  {
    id: randomUUID(),
    title: "Understanding Your Program",
    content: `# Understanding Your Personalized Program

Your program is designed specifically for your needs based on your assessment.

## Program Structure

- **Duration**: Typically 8-12 weeks
- **Sessions per Week**: 3-4 sessions (customizable)
- **Session Duration**: 30-60 minutes each

## Completing Sessions

1. View your upcoming session from the dashboard
2. Click "Start Session"
3. Follow video demonstrations
4. Mark exercises as complete
5. Add notes if needed

## Missed Sessions

Don't worry if you miss a session! Your program will adjust based on your tenant's settings:
- **Flexible** (default): Smart rescheduling
- **Reschedule**: Automatically pushes future sessions
- **Accumulate**: Work through backlog at your pace

## Re-Assessment

We recommend retaking assessments every 4-6 weeks to track progress and adjust your program.`,
    category: "programs",
    tags: ["programs", "sessions", "getting-started"],
    order: 1,
    is_published: true,
    view_count: 0,
    created_by: null,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },

  // Troubleshooting
  {
    id: randomUUID(),
    title: "Video Not Playing? Troubleshooting Guide",
    content: `# Troubleshooting Video Playback Issues

Having trouble playing exercise videos? Try these solutions.

## Common Issues

### Video Won't Load
- Check your internet connection
- Try refreshing the page
- Clear browser cache
- Try a different browser

### Video Stuttering or Buffering
- Reduce video quality (if available)
- Close other browser tabs
- Check network speed (minimum 5 Mbps recommended)
- Move closer to WiFi router

### Audio Issues
- Check device volume
- Ensure browser has audio permission
- Check system audio settings
- Try headphones to test

## Still Having Issues?

Contact support@ffp.app with:
- Your browser and version
- Description of the problem
- Screenshot if possible`,
    category: "troubleshooting",
    tags: ["troubleshooting", "videos", "technical"],
    order: 1,
    is_published: true,
    view_count: 0,
    created_by: null,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// ============================================================================
// TEST TENANT & USERS (Development Only)
// ============================================================================

const testTenantId = randomUUID();
const testUserId = randomUUID();
const testBusinessOwnerId = randomUUID();
const testBusinessUserId = randomUUID();

export const testTenant = {
  id: testTenantId,
  type: "business",
  name: "Test Physiotherapy Clinic",
  installed_modules: ["assessments", "programs", "videos", "business-portal"],
  settings: {
    theme: {
      primary: "#2563eb",
      secondary: "#64748b",
      logo_url: null,
    },
    missedSessionStrategy: "flexible",
    allowCustomVideos: false,
    requireAssessmentReview: true,
    notifications: {
      welcomeEmail: true,
      programReminders: true,
      weeklyDigest: true,
    },
  },
  created_at: new Date(),
  updated_at: new Date(),
};

export const testUsers = [
  // Individual user (separate tenant)
  {
    id: testUserId,
    tenant_id: randomUUID(), // Individual users get their own tenant
    email: "individual@test.com",
    cognito_sub: "cognito-sub-individual-123",
    first_name: "John",
    last_name: "Doe",
    role: "individual_user",
    parent_business_id: null,
    profile_image_url: null,
    phone: "+44 7700 900123",
    date_of_birth: new Date("1989-05-15"),
    status: "active",
    last_logged_in: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },

  // Business owner
  {
    id: testBusinessOwnerId,
    tenant_id: testTenantId,
    email: "owner@testclinic.com",
    cognito_sub: "cognito-sub-owner-123",
    first_name: "Sarah",
    last_name: "Johnson",
    role: "business_owner",
    parent_business_id: null,
    profile_image_url: null,
    phone: "+44 7700 900456",
    date_of_birth: new Date("1985-08-22"),
    status: "active",
    last_logged_in: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },

  // Business user (patient)
  {
    id: testBusinessUserId,
    tenant_id: testTenantId,
    email: "patient@testclinic.com",
    cognito_sub: "cognito-sub-patient-123",
    first_name: "Michael",
    last_name: "Smith",
    role: "business_user",
    parent_business_id: testBusinessOwnerId,
    profile_image_url: null,
    phone: "+44 7700 900789",
    date_of_birth: new Date("1992-03-10"),
    status: "active",
    last_logged_in: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// ============================================================================
// EXPORT ALL SEED DATA
// ============================================================================

export const seedData = {
  globalConfig,
  assessmentCategories,
  assessmentTemplates,
  videos,
  supportArticles,
  testTenant,
  testUsers,
};

export default seedData;
