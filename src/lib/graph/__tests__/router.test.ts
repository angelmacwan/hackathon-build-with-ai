import { describe, it, expect } from 'vitest';
import { routeFromIntake, routeFromEvaluator } from '../router';
import type { LearnerState } from '../state';

describe('Graph Router', () => {
  describe('routeFromIntake', () => {
    it('returns short_circuit when shouldShortCircuit is true', () => {
      const state = { shouldShortCircuit: true } as LearnerState;
      expect(routeFromIntake(state)).toBe('short_circuit');
    });

    it('returns full_pipeline when shouldShortCircuit is false', () => {
      const state = { shouldShortCircuit: false } as LearnerState;
      expect(routeFromIntake(state)).toBe('full_pipeline');
    });
  });

  describe('routeFromEvaluator', () => {
    it('returns the evaluator decision', () => {
      const state = { evaluatorDecision: 'backtrack' } as LearnerState;
      expect(routeFromEvaluator(state)).toBe('backtrack');
    });

    it('defaults to advance if no decision is set', () => {
      const state = { evaluatorDecision: undefined } as LearnerState;
      expect(routeFromEvaluator(state)).toBe('advance');
    });
  });
});
