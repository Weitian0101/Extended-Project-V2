import { getBackendMode } from '@/lib/config/backend';
import {
    AiFacilitatorChatRequest,
    AiPromptBoardRequest,
    AiStepAssistRequest,
    AiStepAssistResponse,
    AiTextResponse
} from '@/lib/contracts/api';
import { ToolFieldValue } from '@/types';
import { generateTextFromProvider, isAiProviderConfigured } from '@/lib/server/aiProvider';
import { AiGateway, localAiGateway } from '@/lib/services/localAiGateway';

function buildProjectContextMarkdown(project: AiPromptBoardRequest['project'] | AiFacilitatorChatRequest['project'] | AiStepAssistRequest['project']) {
    return [
        `# ${project.name || 'Innovation Sandbox Project'}`,
        '',
        '## Background',
        project.background?.trim() || 'No background captured yet.',
        '',
        '## Objectives',
        project.objectives?.trim() || 'No objectives captured yet.',
        '',
        '## Assumptions',
        project.assumptions?.trim() || 'No assumptions captured yet.'
    ].join('\n');
}

function buildSystemPrompt({
    methodTitle,
    stage,
    project,
    outputMode
}: {
    methodTitle: string;
    stage: string;
    project: AiPromptBoardRequest['project'] | AiFacilitatorChatRequest['project'] | AiStepAssistRequest['project'];
    outputMode: 'markdown' | 'json';
}) {
    const projectPrompt = project.aiHandoffPrompt?.trim();

    return [
        projectPrompt || [
            `You are the AI facilitator for the "${methodTitle}" method in the "${stage}" stage of an innovation sandbox.`,
            'Stay grounded in the supplied project context.',
            'Be practical, specific, and decision-oriented.',
            'If the context is incomplete, say what is missing instead of inventing facts.'
        ].join('\n'),
        '',
        '## Backend instructions',
        `- Current method: ${methodTitle}`,
        `- Current stage: ${stage}`,
        `- Response format: ${outputMode}`,
        '- Treat the project context markdown below as the current source of truth.',
        outputMode === 'markdown'
            ? '- Return concise markdown only. Do not wrap the whole answer in code fences.'
            : '- Return strict JSON only. Do not add markdown, prose before the JSON, or code fences.',
        '',
        '## Project context markdown',
        buildProjectContextMarkdown(project)
    ].join('\n');
}

function serializeHistory(history: AiFacilitatorChatRequest['history']) {
    if (history.length === 0) {
        return 'No earlier facilitator exchanges in this run.';
    }

    return history
        .slice(-5)
        .map((entry, index) => [
            `### Exchange ${index + 1}`,
            `User prompt: ${entry.prompt}`,
            `Assistant reply: ${entry.response}`
        ].join('\n'))
        .join('\n\n');
}

function extractJsonObject(text: string) {
    const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fencedMatch?.[1]?.trim() || text.trim();

    try {
        return JSON.parse(candidate) as Record<string, unknown>;
    } catch {
        const firstBrace = candidate.indexOf('{');
        const lastBrace = candidate.lastIndexOf('}');

        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
        }

        throw new Error('AI response was not valid JSON.');
    }
}

function normalizeStepAssistValue(stepType: AiStepAssistRequest['stepType'], value: unknown, currentValue: ToolFieldValue): ToolFieldValue {
    if (stepType === 'diverge') {
        if (Array.isArray(value)) {
            const nextItems = value
                .filter((item): item is string => typeof item === 'string')
                .map((item) => item.trim())
                .filter(Boolean);

            if (nextItems.length > 0) {
                return nextItems;
            }
        }

        if (typeof value === 'string') {
            const splitItems = value
                .split('\n')
                .map((item) => item.replace(/^\s*[-*]\s*/, '').trim())
                .filter(Boolean);

            if (splitItems.length > 0) {
                return splitItems;
            }
        }
    }

    if (stepType === 'input' || stepType === 'text' || stepType === 'textarea') {
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }

        if (value !== null && value !== undefined) {
            return String(value);
        }
    }

    return currentValue ?? null;
}

class ServerAiGateway implements AiGateway {
    async promptBoard(request: AiPromptBoardRequest): Promise<AiTextResponse> {
        if (!isAiProviderConfigured()) {
            return localAiGateway.promptBoard(request);
        }

        const reply = await generateTextFromProvider({
            messages: [
                {
                    role: 'system',
                    content: buildSystemPrompt({
                        methodTitle: request.methodTitle,
                        stage: request.stage,
                        project: request.project,
                        outputMode: 'markdown'
                    })
                },
                {
                    role: 'user',
                    content: [
                        'Help the facilitator use the selected method prompt well.',
                        '',
                        `Prompt label: ${request.promptLabel}`,
                        `Prompt template: ${request.promptTemplate}`,
                        '',
                        'Return concise markdown with these sections:',
                        '## Facilitation Move',
                        '## Why It Fits',
                        '## Prompt to Use',
                        '',
                        'Keep the response practical and short enough to use during a live workshop.'
                    ].join('\n')
                }
            ],
            temperature: 0.5,
            maxTokens: 450
        });

        return {
            mode: getBackendMode(),
            source: 'remote-ai',
            reply
        };
    }

    async facilitatorChat(request: AiFacilitatorChatRequest): Promise<AiTextResponse> {
        if (!isAiProviderConfigured()) {
            return localAiGateway.facilitatorChat(request);
        }

        const reply = await generateTextFromProvider({
            messages: [
                {
                    role: 'system',
                    content: buildSystemPrompt({
                        methodTitle: request.methodTitle,
                        stage: request.stage,
                        project: request.project,
                        outputMode: 'markdown'
                    })
                },
                {
                    role: 'user',
                    content: [
                        'Continue the facilitator conversation.',
                        '',
                        '## Recent history',
                        serializeHistory(request.history),
                        '',
                        '## Current user request',
                        request.message,
                        '',
                        'Respond directly to the request.',
                        'If the user is asking for revised wording or prompt text, include the revised version under a `## Draft` section.',
                        'Otherwise use these sections when they fit: `## Observations`, `## Risks`, `## Next Move`.'
                    ].join('\n')
                }
            ],
            temperature: 0.55,
            maxTokens: 650
        });

        return {
            mode: getBackendMode(),
            source: 'remote-ai',
            reply
        };
    }

    async stepAssist(request: AiStepAssistRequest): Promise<AiStepAssistResponse> {
        if (!isAiProviderConfigured()) {
            return localAiGateway.stepAssist(request);
        }

        try {
            const rawReply = await generateTextFromProvider({
                messages: [
                    {
                        role: 'system',
                        content: buildSystemPrompt({
                            methodTitle: request.methodTitle,
                            stage: request.stage,
                            project: request.project,
                            outputMode: 'json'
                        })
                    },
                    {
                        role: 'user',
                        content: [
                            'Help with a single method step.',
                            '',
                            `Step id: ${request.stepId}`,
                            `Step title: ${request.stepTitle || 'Untitled step'}`,
                            `Step type: ${request.stepType}`,
                            '',
                            'Facilitator text:',
                            request.facilitatorText?.trim() || 'No facilitator text provided.',
                            '',
                            'Current value JSON:',
                            JSON.stringify(request.currentValue ?? null),
                            '',
                            'Return JSON with this shape:',
                            '{"nextValue": <value>, "summary": "<short summary>"}',
                            '',
                            request.stepType === 'diverge'
                                ? 'For `nextValue`, return 3 to 7 short idea bullets as a JSON array of strings.'
                                : 'For `nextValue`, return a single string that improves or expands the current step content.',
                            'Keep the summary to one sentence.'
                        ].join('\n')
                    }
                ],
                temperature: 0.6,
                maxTokens: 500
            });

            const parsed = extractJsonObject(rawReply);
            const nextValue = normalizeStepAssistValue(request.stepType, parsed.nextValue, request.currentValue ?? null);
            const summary = typeof parsed.summary === 'string' && parsed.summary.trim()
                ? parsed.summary.trim()
                : 'Prepared an updated step suggestion.';

            return {
                mode: getBackendMode(),
                source: 'remote-ai',
                nextValue,
                summary
            };
        } catch {
            return localAiGateway.stepAssist(request);
        }
    }
}

export const serverAiGateway: AiGateway = new ServerAiGateway();
