type AiRole = 'system' | 'user' | 'assistant';

export interface AiMessage {
    role: AiRole;
    content: string;
}

interface GenerateTextOptions {
    messages: AiMessage[];
    temperature?: number;
    maxTokens?: number;
}

const DEFAULT_AI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_AI_MODEL = 'gpt-4.1-mini';
const DEFAULT_AI_TIMEOUT_MS = 45_000;

function trimTrailingSlashes(value: string) {
    return value.replace(/\/+$/, '');
}

function resolveTemperature(value: string | undefined) {
    if (!value) {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function resolveTimeoutMs(value: string | undefined) {
    if (!value) {
        return DEFAULT_AI_TIMEOUT_MS;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_AI_TIMEOUT_MS;
}

function getRequiredApiKey() {
    const apiKey = process.env.AI_API_KEY?.trim();

    if (!apiKey) {
        throw new Error('AI_API_KEY is not configured.');
    }

    return apiKey;
}

export function isAiProviderConfigured() {
    return Boolean(process.env.AI_API_KEY?.trim());
}

export async function generateTextFromProvider({ messages, temperature, maxTokens }: GenerateTextOptions) {
    const apiKey = getRequiredApiKey();
    const baseUrl = trimTrailingSlashes(process.env.AI_BASE_URL?.trim() || DEFAULT_AI_BASE_URL);
    const model = process.env.AI_MODEL?.trim() || DEFAULT_AI_MODEL;
    const timeoutMs = resolveTimeoutMs(process.env.AI_TIMEOUT_MS);
    const controller = new AbortController();
    const timeoutHandle = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: temperature ?? resolveTemperature(process.env.AI_TEMPERATURE),
                max_tokens: maxTokens
            }),
            signal: controller.signal,
            cache: 'no-store'
        });

        const payload = await response.json().catch(() => null) as
            | {
                choices?: Array<{
                    message?: {
                        content?: string | Array<{ type?: string; text?: string }>;
                    };
                }>;
                error?: {
                    message?: string;
                };
            }
            | null;

        if (!response.ok) {
            const errorMessage = payload?.error?.message || `AI provider request failed with status ${response.status}.`;
            throw new Error(errorMessage);
        }

        const content = payload?.choices?.[0]?.message?.content;
        if (typeof content === 'string' && content.trim()) {
            return content.trim();
        }

        if (Array.isArray(content)) {
            const mergedText = content
                .map((part) => typeof part.text === 'string' ? part.text : '')
                .join('')
                .trim();

            if (mergedText) {
                return mergedText;
            }
        }

        throw new Error('AI provider returned an empty response.');
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`AI provider timed out after ${timeoutMs}ms.`);
        }

        throw error;
    } finally {
        globalThis.clearTimeout(timeoutHandle);
    }
}
