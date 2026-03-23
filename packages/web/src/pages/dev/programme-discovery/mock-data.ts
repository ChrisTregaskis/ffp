/**
 * Mock data for programme execution discovery prototype.
 * Realistic physiotherapy programme structure for UX exploration.
 */

export interface MockExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  durationSeconds: number | null;
  restSeconds: number;
  completed: boolean;
  setsCompleted: boolean[];
  notes: string | null;
  instructions: {
    setup: string;
    execution: string;
    tips: string[];
  };
}

export interface MockSession {
  id: string;
  sessionNumber: number;
  name: string;
  estimatedDurationMinutes: number;
  exercises: MockExercise[];
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface MockPhase {
  id: string;
  phaseNumber: number;
  name: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  sessions: MockSession[];
}

export interface MockProgramme {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  startedAt: string;
  phases: MockPhase[];
}

/** Local video path served from /public */
export const MOCK_VIDEO_URL = '/videos/seated-hamstring-stretch-16x9.mp4';

const createExercise = (
  id: string,
  name: string,
  sets: number,
  reps: string,
  restSeconds: number,
  completed: boolean,
  instructions: MockExercise['instructions'],
  notes: string | null = null,
  durationSeconds: number | null = null,
): MockExercise => ({
  id,
  name,
  sets,
  reps,
  durationSeconds,
  restSeconds,
  completed,
  setsCompleted: Array.from({ length: sets }, () => completed),
  notes,
  instructions,
});

export const mockProgramme: MockProgramme = {
  id: 'prog-001',
  name: 'Gentle Mobility Programme',
  description:
    'A progressive programme designed to restore mobility and build foundational strength in your lower back and core. Each phase builds on the previous, gradually increasing intensity as your body adapts.',
  status: 'active',
  startedAt: '2026-03-10',
  phases: [
    {
      id: 'phase-001',
      phaseNumber: 1,
      name: 'Foundation',
      description:
        'Establishing baseline mobility and gentle activation. These exercises focus on restoring range of motion and waking up underused muscle groups without overloading them.',
      status: 'completed',
      sessions: [
        {
          id: 'session-001',
          sessionNumber: 1,
          name: 'Gentle Activation',
          estimatedDurationMinutes: 20,
          status: 'completed',
          exercises: [
            createExercise(
              'ex-001',
              'Seated Hamstring Stretch',
              3,
              '30s hold',
              30,
              true,
              {
                setup:
                  'Sit on the edge of a sturdy chair with one leg extended straight in front of you, heel on the floor.',
                execution:
                  'Keeping your back straight, lean forward gently from the hips until you feel a stretch along the back of your thigh. Hold for 30 seconds, then switch legs.',
                tips: [
                  'Keep your back straight — avoid rounding your shoulders',
                  'The stretch should feel comfortable, not painful',
                  'Breathe normally throughout',
                ],
              },
            ),
            createExercise('ex-002', 'Pelvic Tilts', 3, '10', 30, true, {
              setup: 'Lie on your back with knees bent and feet flat on the floor, hip-width apart.',
              execution:
                'Gently flatten your lower back against the floor by tilting your pelvis upward. Hold for 3 seconds, then release. Repeat 10 times.',
              tips: [
                'Keep the movement small and controlled',
                'Engage your core gently — imagine drawing your belly button toward your spine',
                'Your upper back and shoulders should stay relaxed',
              ],
            }),
            createExercise('ex-003', 'Cat-Cow Stretch', 3, '8', 20, true, {
              setup: 'Position yourself on hands and knees, with wrists under shoulders and knees under hips.',
              execution:
                'Inhale: drop your belly toward the floor, lift your head and tailbone (cow). Exhale: round your spine toward the ceiling, tucking chin and tailbone (cat). Flow between positions.',
              tips: [
                'Move slowly and with control',
                'Let your breath guide the movement',
                'Stop if you feel any sharp pain',
              ],
            }),
          ],
        },
        {
          id: 'session-002',
          sessionNumber: 2,
          name: 'Lower Body Mobility',
          estimatedDurationMinutes: 25,
          status: 'completed',
          exercises: [
            createExercise('ex-004', 'Hip Circles', 3, '10 each side', 20, true, {
              setup: 'Stand with feet hip-width apart, hands on hips. Use a wall for balance if needed.',
              execution:
                'Make large, slow circles with your hips — forward, right, back, left. Complete 10 circles, then reverse direction.',
              tips: [
                'Keep your upper body as still as possible',
                'Make the circles as large as comfortable',
                'Engage your core for stability',
              ],
            }),
            createExercise('ex-005', 'Ankle Circles', 3, '10 each side', 15, true, {
              setup: 'Sit in a chair and lift one foot slightly off the ground.',
              execution:
                'Rotate your foot in a circle, making the largest circle you can. Complete 10 circles clockwise, then 10 anticlockwise. Switch feet.',
              tips: [
                'Focus on using your ankle, not your whole leg',
                'Keep movements smooth and controlled',
              ],
            }),
            createExercise('ex-006', 'Knee Extensions', 3, '12', 30, true, {
              setup: 'Sit in a sturdy chair with your back against the backrest, feet flat on the floor.',
              execution:
                'Slowly straighten one knee, lifting your foot until your leg is fully extended. Hold for 2 seconds at the top, then slowly lower. Alternate legs.',
              tips: [
                'Keep your thigh firmly on the seat',
                'Control the lowering phase — don\'t let gravity do the work',
                'If it feels too easy, pause for 3 seconds at the top',
              ],
            }),
          ],
        },
        {
          id: 'session-003',
          sessionNumber: 3,
          name: 'Core Activation',
          estimatedDurationMinutes: 20,
          status: 'completed',
          exercises: [
            createExercise('ex-007', 'Dead Bug', 3, '8 each side', 30, true, {
              setup:
                'Lie on your back with arms reaching toward the ceiling and knees bent at 90 degrees (tabletop position).',
              execution:
                'Slowly extend your right arm overhead and left leg straight out, keeping your lower back pressed into the floor. Return and repeat on the other side.',
              tips: [
                'Your lower back must stay flat on the floor throughout',
                'If it lifts, reduce the range of motion',
                'Exhale as you extend, inhale as you return',
              ],
            }),
            createExercise('ex-008', 'Bird Dog', 3, '8 each side', 30, true, {
              setup: 'Start on hands and knees, wrists under shoulders, knees under hips.',
              execution:
                'Extend your right arm forward and left leg back simultaneously, forming a straight line. Hold for 3 seconds, return, and repeat on the other side.',
              tips: [
                'Keep your hips level — imagine balancing a cup of tea on your lower back',
                'Move slowly and with control',
                'Engage your core before extending',
              ],
            }),
          ],
        },
      ],
    },
    {
      id: 'phase-002',
      phaseNumber: 2,
      name: 'Strengthening',
      description:
        'Building on the mobility foundations from Phase 1, this phase introduces resistance exercises to strengthen the muscles supporting your lower back. Expect slightly more challenge — this is where the real progress begins.',
      status: 'in_progress',
      sessions: [
        {
          id: 'session-004',
          sessionNumber: 1,
          name: 'Upper Body Foundations',
          estimatedDurationMinutes: 25,
          status: 'completed',
          exercises: [
            createExercise('ex-009', 'Wall Push-Ups', 3, '12', 45, true, {
              setup:
                'Stand arm\'s length from a wall, feet shoulder-width apart. Place palms flat on the wall at shoulder height.',
              execution:
                'Bend your elbows to bring your chest toward the wall, keeping your body in a straight line. Push back to start.',
              tips: [
                'Keep your core engaged — no sagging at the hips',
                'Elbows at roughly 45 degrees, not flared out',
                'Exhale as you push away from the wall',
              ],
            }),
            createExercise('ex-010', 'Seated Row (Band)', 3, '10', 45, true, {
              setup:
                'Sit on the floor with legs extended. Loop a resistance band around your feet, holding one end in each hand.',
              execution:
                'Pull the band toward your torso, squeezing your shoulder blades together. Slowly release back to start.',
              tips: [
                'Keep your back straight — avoid leaning backward',
                'Focus on squeezing between your shoulder blades',
                'Control the release — don\'t let the band snap back',
              ],
            }),
          ],
        },
        {
          id: 'session-005',
          sessionNumber: 2,
          name: 'Lower Body Strength',
          estimatedDurationMinutes: 30,
          status: 'completed',
          exercises: [
            createExercise('ex-011', 'Wall Squats', 3, '10', 45, true, {
              setup:
                'Stand with your back flat against a wall, feet shoulder-width apart, about 2 feet from the wall.',
              execution:
                'Slowly slide down the wall until your thighs are parallel to the floor (or as far as comfortable). Hold for 5 seconds. Push back up.',
              tips: [
                'Keep your knees behind your toes',
                'Press your lower back firmly against the wall',
                'Stop if you feel sharp pain in your knees',
              ],
            }),
            createExercise('ex-012', 'Heel Raises', 3, '15', 30, true, {
              setup:
                'Stand behind a chair, holding the back for balance. Feet hip-width apart.',
              execution:
                'Rise up onto your toes as high as you can. Hold for 2 seconds at the top, then slowly lower back down.',
              tips: [
                'Control the lowering — take 3 seconds to come down',
                'Keep your weight distributed evenly across all toes',
                'Don\'t lean forward on the chair',
              ],
            }),
          ],
        },
        {
          id: 'session-006',
          sessionNumber: 3,
          name: 'Core & Stability',
          estimatedDurationMinutes: 25,
          status: 'in_progress',
          exercises: [
            createExercise(
              'ex-013',
              'Seated Hamstring Stretch',
              3,
              '30s hold',
              30,
              false,
              {
                setup:
                  'Sit on the edge of a sturdy chair with one leg extended straight in front of you, heel on the floor.',
                execution:
                  'Keeping your back straight, lean forward gently from the hips until you feel a stretch along the back of your thigh. Hold for 30 seconds, then switch legs.',
                tips: [
                  'Keep your back straight — avoid rounding your shoulders',
                  'The stretch should feel comfortable, not painful',
                  'Breathe normally throughout',
                ],
              },
            ),
            createExercise('ex-014', 'Glute Bridges', 3, '12', 30, false, {
              setup:
                'Lie on your back with knees bent, feet flat on the floor, hip-width apart. Arms by your sides.',
              execution:
                'Push through your heels to lift your hips toward the ceiling until your body forms a straight line from shoulders to knees. Squeeze your glutes at the top. Lower slowly.',
              tips: [
                'Drive through your heels, not your toes',
                'Squeeze your glutes at the top for 2 seconds',
                'Don\'t arch your lower back — keep your core engaged',
              ],
            }),
            createExercise('ex-015', 'Side-Lying Leg Raises', 3, '10 each side', 30, false, {
              setup:
                'Lie on your side with legs straight and stacked. Support your head with your lower arm.',
              execution:
                'Keeping your leg straight, slowly raise your top leg to about 45 degrees. Hold briefly, then lower with control. Complete all reps, then switch sides.',
              tips: [
                'Keep your hips stacked — don\'t roll backward',
                'Lift from the hip, not by tilting your pelvis',
                'Control the lowering — no dropping',
              ],
            }),
            createExercise('ex-016', 'Plank Hold', 1, '20-30s hold', 0, false, {
              setup:
                'Start on hands and knees. Step your feet back one at a time into a push-up position, or lower to your forearms for a forearm plank.',
              execution:
                'Hold a straight line from head to heels. Engage your core, squeeze your glutes, and breathe steadily. Hold for 20-30 seconds.',
              tips: [
                'If this is too challenging, keep your knees on the floor',
                'Don\'t let your hips sag or pike up',
                'Keep breathing — don\'t hold your breath',
                'Stop immediately if you feel lower back pain',
              ],
            }),
            createExercise('ex-017', 'Standing Balance', 3, '20s each side', 20, false, {
              setup:
                'Stand near a wall or chair for support if needed. Feet hip-width apart.',
              execution:
                'Shift your weight onto one foot and slowly lift the other foot off the ground. Hold for 20 seconds, then switch sides.',
              tips: [
                'Focus your gaze on a fixed point in front of you',
                'Use the wall or chair for light fingertip support if needed',
                'Try to minimise wobbling — engage your core',
              ],
            }),
            createExercise('ex-018', 'Cool-Down Breathing', 1, '5 breaths', 0, false, {
              setup:
                'Sit or lie comfortably. Place one hand on your chest and one on your belly.',
              execution:
                'Breathe in slowly through your nose for 4 seconds, feeling your belly rise. Hold for 2 seconds. Exhale slowly through your mouth for 6 seconds. Repeat 5 times.',
              tips: [
                'Your belly hand should move more than your chest hand',
                'Let your shoulders drop and relax',
                'This is your wind-down — no rush',
              ],
            }),
          ],
        },
        {
          id: 'session-007',
          sessionNumber: 4,
          name: 'Full Body Integration',
          estimatedDurationMinutes: 30,
          status: 'not_started',
          exercises: [
            createExercise('ex-019', 'Warm-Up Walk', 1, '3 min', 0, false, {
              setup: 'Stand in a clear space or use a hallway.',
              execution: 'Walk at a comfortable pace for 3 minutes, swinging your arms naturally.',
              tips: ['Focus on posture — head up, shoulders back', 'Take comfortable strides'],
            }),
            createExercise('ex-020', 'Squat to Stand', 3, '8', 45, false, {
              setup: 'Stand with feet shoulder-width apart.',
              execution:
                'Bend forward and touch your toes (or as close as you can), then bend your knees into a squat, lift your chest, and stand up tall. Reverse the movement.',
              tips: [
                'Go only as deep as comfortable',
                'Keep the movement flowing and controlled',
              ],
            }),
          ],
        },
        {
          id: 'session-008',
          sessionNumber: 5,
          name: 'Recovery & Stretch',
          estimatedDurationMinutes: 20,
          status: 'not_started',
          exercises: [
            createExercise('ex-021', 'Full Body Stretch Sequence', 1, '10 min', 0, false, {
              setup: 'Find a comfortable space with room to lie down and stretch.',
              execution:
                'Work through a gentle full-body stretch: neck rolls, shoulder stretches, torso twists, hip flexor stretch, hamstring stretch, and calf stretch. Hold each for 30 seconds.',
              tips: [
                'Never force a stretch — ease into it',
                'Breathe deeply and relax into each position',
                'Skip any stretch that causes pain',
              ],
            }),
          ],
        },
      ],
    },
    {
      id: 'phase-003',
      phaseNumber: 3,
      name: 'Progressive Loading',
      description:
        'Introducing greater resistance and complexity. Your body is ready for more challenge — this phase pushes your strength and stability further.',
      status: 'not_started',
      sessions: [
        {
          id: 'session-009',
          sessionNumber: 1,
          name: 'Loaded Strength A',
          estimatedDurationMinutes: 35,
          status: 'not_started',
          exercises: [],
        },
        {
          id: 'session-010',
          sessionNumber: 2,
          name: 'Loaded Strength B',
          estimatedDurationMinutes: 35,
          status: 'not_started',
          exercises: [],
        },
        {
          id: 'session-011',
          sessionNumber: 3,
          name: 'Mobility & Recovery',
          estimatedDurationMinutes: 20,
          status: 'not_started',
          exercises: [],
        },
      ],
    },
    {
      id: 'phase-004',
      phaseNumber: 4,
      name: 'Functional Movement',
      description:
        'Translating your strength gains into real-world movement patterns. Exercises mimic daily activities to ensure your progress carries over.',
      status: 'not_started',
      sessions: [
        {
          id: 'session-012',
          sessionNumber: 1,
          name: 'Daily Movement Patterns',
          estimatedDurationMinutes: 30,
          status: 'not_started',
          exercises: [],
        },
        {
          id: 'session-013',
          sessionNumber: 2,
          name: 'Balance & Coordination',
          estimatedDurationMinutes: 25,
          status: 'not_started',
          exercises: [],
        },
        {
          id: 'session-014',
          sessionNumber: 3,
          name: 'Endurance Circuit',
          estimatedDurationMinutes: 35,
          status: 'not_started',
          exercises: [],
        },
      ],
    },
    {
      id: 'phase-005',
      phaseNumber: 5,
      name: 'Maintenance',
      description:
        'Sustaining your progress with a balanced routine. This final phase is designed to be repeatable — your long-term movement practice.',
      status: 'not_started',
      sessions: [
        {
          id: 'session-015',
          sessionNumber: 1,
          name: 'Maintenance A',
          estimatedDurationMinutes: 25,
          status: 'not_started',
          exercises: [],
        },
        {
          id: 'session-016',
          sessionNumber: 2,
          name: 'Maintenance B',
          estimatedDurationMinutes: 25,
          status: 'not_started',
          exercises: [],
        },
      ],
    },
  ],
};

/** Helper: get the current active session (first in_progress or first not_started in active phase) */
export const getCurrentSession = (): MockSession | null => {
  const activePhase = mockProgramme.phases.find((p) => p.status === 'in_progress');

  if (!activePhase) {return null;}

  const inProgress = activePhase.sessions.find((s) => s.status === 'in_progress');

  if (inProgress) {return inProgress;}

  return activePhase.sessions.find((s) => s.status === 'not_started') ?? null;
};

/** Helper: get the current active phase */
export const getCurrentPhase = (): MockPhase | null => {
  return mockProgramme.phases.find((p) => p.status === 'in_progress') ?? null;
};

/** Helper: get the current exercise (first uncompleted in current session) */
export const getCurrentExercise = (session: MockSession): MockExercise | null => {
  return session.exercises.find((e) => !e.completed) ?? null;
};

/** Helper: count completed phases */
export const getCompletedPhasesCount = (): number => {
  return mockProgramme.phases.filter((p) => p.status === 'completed').length;
};

/** Helper: count completed sessions in a phase */
export const getCompletedSessionsCount = (phase: MockPhase): number => {
  return phase.sessions.filter((s) => s.status === 'completed').length;
};
