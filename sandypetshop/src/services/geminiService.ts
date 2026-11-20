/**
 * Gemini Service Compatibility Adapter
 * Re-routes all AI calls to OpenRouter using free models with automatic rotation.
 */
import {
    generateOpenRouterText,
    callOpenRouterChatCompletions,
    GenerateTextOptions,
    AiTextResult
} from './openrouterService';

export interface GenerateGeminiOptions extends GenerateTextOptions {
    model?: string;
}

export interface GeminiResult extends AiTextResult {}

export async function generateGeminiContent(options: GenerateGeminiOptions): Promise<GeminiResult> {
    return await generateOpenRouterText(options);
}

export async function callGeminiChatCompletions(args: {
    messages: any[];
    tools?: any[];
    tool_choice?: any;
    model?: string;
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: string };
}): Promise<any> {
    return await callOpenRouterChatCompletions(args);
}
