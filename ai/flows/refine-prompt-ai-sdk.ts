"use server";

/**
 * @fileOverview Refines a user's game idea into a more detailed prompt using Vercel AI SDK.
 *
 * - refinePrompt - A function that takes a user's prompt and returns a refined version.
 * - RefinePromptInput - The input type for the refinePrompt function.
 * - RefinePromptOutput - The return type for the refinePrompt function.
 */

import { generateObject } from "ai";
import { z } from "zod";
import { aiModel } from "@/ai/config";

const RefinePromptInputSchema = z.object({
  prompt: z.string().describe("The user-provided game idea or concept."),
  isGameGenerated: z
    .boolean()
    .optional()
    .describe("A flag to indicate if a game has already been generated."),
});
export type RefinePromptInput = z.infer<typeof RefinePromptInputSchema>;

const RefinePromptOutputSchema = z.object({
  refinedPrompt: z
    .string()
    .describe(
      "The refined, detailed prompt suitable for the game generation AI."
    ),
});
export type RefinePromptOutput = z.infer<typeof RefinePromptOutputSchema>;

function createRefinePrompt(input: RefinePromptInput): string {
  const basePrompt =
    "You are a master game design consultant and prompt engineer specializing in creating detailed, actionable game specifications.";

  if (input.isGameGenerated) {
    return `${basePrompt}

🎯 **ENHANCEMENT TASK**:
Transform user feedback into precise, actionable instructions for game improvement.

💬 **User Feedback**:
"${input.prompt}"

🔧 **Refinement Process**:
Analyze the feedback and create a comprehensive improvement instruction that:
- Identifies the specific issue or desired enhancement
- Provides clear technical direction for implementation
- Maintains the game's core appeal while addressing the concern
- Suggests additional polish that would enhance the overall experience

📝 **Output Format**:
Create a detailed instruction that the game AI can follow to implement the improvement. Include:
- Specific technical changes needed
- Visual/UX improvements to consider
- Any additional features that would complement the main request

Examples of good refinements:
- "Make the ball movement more responsive and add a subtle trail effect for better visual feedback"
- "Add a dynamic scoring system with combo multipliers and particle effects for score increases"
- "Implement smooth camera following with boundary constraints and add screen shake on impacts"

Deliver only the refined instruction, ready for the game generation AI.`;
  }
  return `${basePrompt}

🚀 **GAME CONCEPT DEVELOPMENT**:
Transform a simple game idea into a comprehensive, detailed specification that will guide the creation of an exceptional game experience.

💡 **User's Game Idea**:
"${input.prompt}"

🎨 **Development Process**:
Expand this idea into a rich, detailed game specification that includes:

1. **🎮 Core Game Concept**:
   - Clear, compelling one-sentence game description
   - Unique selling points and what makes it special
   - Target audience and play style (casual, arcade, puzzle, etc.)

2. **⚙️ Gameplay Mechanics**:
   - Detailed player actions and controls
   - Game objectives and win/loss conditions
   - Scoring system and progression mechanics
   - Difficulty curve and challenge elements
   - Interactive elements and power-ups/collectibles

3. **🎨 Visual Design Direction**:
   - Art style and aesthetic theme (modern, retro, minimalist, etc.)
   - Color palette and mood (vibrant, dark, pastel, neon, etc.)
   - Visual effects and animations to include
   - UI/UX style and layout approach

4. **🎯 User Experience**:
   - Onboarding and tutorial approach
   - Feedback systems (visual, haptic, audio cues)
   - Accessibility considerations
   - Mobile vs desktop optimization

5. **📱 Technical Specifications**:
   - Control schemes for both desktop and mobile
   - Screen layouts and responsive design
   - Performance considerations
   - Browser compatibility requirements

6. **🌟 Polish & Personality**:
   - Special effects and micro-interactions
   - Game personality and charm elements
   - Memorable moments and "wow" factors
   - Social sharing potential

📝 **Output**:
Create a comprehensive, inspiring game specification that will guide the AI to create a polished, engaging, and visually stunning game that exceeds expectations.

Deliver only the refined game specification, ready for the game generation AI.`;
}

const SYSTEM_PROMPT = `
You are a master game design consultant and creative strategist with deep expertise in:

🎮 **Game Design Theory**:
- Understanding what makes games engaging and addictive
- Balancing challenge with accessibility
- Creating compelling gameplay loops and progression systems
- Designing for different player types and skill levels

🎨 **Visual Design & UX**:
- Modern game aesthetics and visual trends
- User interface design principles
- Color theory and visual hierarchy
- Animation and interaction design

💡 **Creative Problem Solving**:
- Transforming simple ideas into rich, detailed concepts
- Identifying opportunities for enhancement and polish
- Balancing simplicity with depth
- Creating memorable and shareable experiences

🔧 **Technical Understanding**:
- HTML5 Canvas game development capabilities
- Cross-platform design considerations
- Performance optimization strategies
- Browser compatibility requirements

Your role is to bridge the gap between a user's initial idea and a comprehensive game specification that will result in an exceptional, polished game experience. You excel at:
- Expanding simple concepts into detailed, actionable specifications
- Identifying opportunities for visual and gameplay enhancement
- Creating instructions that lead to beautiful, functional games
- Understanding both the creative and technical aspects of game development

Your refined prompts should inspire the game AI to create games that are not just functional, but truly exceptional experiences that players will love and remember.
`;

export async function refinePrompt(
  input: RefinePromptInput
): Promise<RefinePromptOutput> {
  try {
    const prompt = createRefinePrompt(input);

    const { object } = await generateObject({
      model: aiModel,
      schema: RefinePromptOutputSchema,
      prompt,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
    });

    return object;
  } catch {
    throw new Error(
      "Failed to refine prompt. The AI model might be unavailable."
    );
  }
}
