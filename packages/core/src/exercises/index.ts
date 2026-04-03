// Exercises domain exports
import * as exerciseRepository from './exercise.repository';
import * as exerciseService from './exercise.service';

export { exerciseRepository, exerciseService };
export type { ExerciseCompletionRecord, SessionExerciseRecord } from './exercise.repository';
