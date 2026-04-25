/**
 * LangGraph Router — conditional edge routing functions.
 */
import type { LearnerState } from './state';

/**
 * Routes from the Intake node.
 * Short-circuits the full pipeline for off-topic / emotional messages.
 */
export function routeFromIntake(state: LearnerState): 'full_pipeline' | 'short_circuit' {
  return state.shouldShortCircuit ? 'short_circuit' : 'full_pipeline';
}

/**
 * Routes from the Evaluator node.
 * Determines whether to advance, reinforce (loop back), or backtrack.
 */
export function routeFromEvaluator(
  state: LearnerState
): 'advance' | 'reinforce' | 'backtrack' {
  return state.evaluatorDecision ?? 'advance';
}
