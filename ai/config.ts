/**
 * AI Configuration Module
 *
 * This module configures the AI models used for game code generation
 * across the AlgoPlay platform. It provides a centralized location
 * for managing AI provider settings and model parameters.
 *
 * @module ai/config
 */

import { google } from "@ai-sdk/google";
// import { openai } from '@ai-sdk/openai';

/**
 * Primary AI model used for game code generation
 * Currently configured to use Google's Gemini 2.0 Flash model
 * for fast, efficient code generation.
 */
export const aiModel = google("gemini-2.0-flash-001");

// Alternative models you can use:
// export const aiModel = openai('gpt-4o');
// export const aiModel = google('gemini-1.5-pro');

/**
 * Global AI configuration settings
 *
 * @property {Object} model - The AI model instance to use
 * @property {number} temperature - Controls randomness (0.0-1.0, higher = more creative)
 * @property {number} maxTokens - Maximum tokens in the generated response
 */
export const aiConfig = {
  model: aiModel,
  // Temperature: 0.7 provides a good balance between creativity and consistency
  temperature: 0.7,
  // Max tokens: 8192 allows for generating complete game logic
  maxTokens: 8192,
};
