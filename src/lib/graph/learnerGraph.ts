/**
 * LearnerGraph — compiled LangGraph state machine with all 6 agents.
 * Exported as an async function to invoke per chat request.
 */
import { StateGraph, END } from '@langchain/langgraph';
import { LearnerStateAnnotation, type LearnerState } from './state';
import { routeFromIntake, routeFromEvaluator } from './router';
import { intakeAgent } from '@/lib/agents/intake';
import { profileAgent } from '@/lib/agents/profile';
import { curriculumAgent } from '@/lib/agents/curriculum';
import { resourceAgent } from '@/lib/agents/resource';
import { pedagogyAgent } from '@/lib/agents/pedagogy';
import { evaluatorAgent } from '@/lib/agents/evaluator';

// Build the graph once at module level
const graphBuilder = new StateGraph(LearnerStateAnnotation)
  .addNode('intake', intakeAgent)
  .addNode('profile', profileAgent)
  .addNode('curriculum', curriculumAgent)
  .addNode('resource', resourceAgent)
  .addNode('pedagogy', pedagogyAgent)
  .addNode('evaluator', evaluatorAgent)
  // Start → Intake
  .addEdge('__start__', 'intake')
  // Intake → conditional: full pipeline or short-circuit to pedagogy
  .addConditionalEdges('intake', routeFromIntake, {
    full_pipeline: 'profile',
    short_circuit: 'pedagogy',
  })
  // Full pipeline flow
  .addEdge('profile', 'curriculum')
  .addEdge('curriculum', 'resource')
  .addEdge('resource', 'pedagogy')
  .addEdge('pedagogy', 'evaluator')
  // Evaluator → conditional: end, reinforce (retry pedagogy), or backtrack (retry curriculum)
  .addConditionalEdges('evaluator', routeFromEvaluator, {
    advance: '__end__',
    reinforce: '__end__', // In streaming context we return; loop is handled via next request
    backtrack: '__end__', // Same — next request handles the adjusted curriculum
  });

export const learnerGraph = graphBuilder.compile();

/**
 * Invokes the LangGraph pipeline and returns the final state.
 * The graph runs synchronously (not streaming) — the calling API route
 * handles SSE streaming of the final response.
 */
export async function runLearnerGraph(
  initialState: Partial<LearnerState>
): Promise<LearnerState> {
  const result = await learnerGraph.invoke(initialState as LearnerState);
  return result as LearnerState;
}
