import {
    AiFacilitatorChatRequest,
    AiPromptBoardRequest,
    AiStepAssistRequest,
    AiStepAssistResponse,
    AiTextResponse
} from '@/lib/contracts/api';
import { ToolFieldValue } from '@/types';

const wait = (timeMs: number) => new Promise((resolve) => globalThis.setTimeout(resolve, timeMs));

const formatProjectContext = (request: {
    project: AiPromptBoardRequest['project'] | AiFacilitatorChatRequest['project'] | AiStepAssistRequest['project'];
}) => {
    const activeContext = [
        request.project.background ? `Background: ${request.project.background}` : null,
        request.project.objectives ? `Goal: ${request.project.objectives}` : null,
        request.project.assumptions ? `Risk to watch: ${request.project.assumptions}` : null
    ].filter(Boolean);

    return activeContext.length > 0
        ? activeContext.join('\n')
        : 'Project context is still lightweight, so start by clarifying the audience, intended outcome, and the decision this method should unlock.';
};

export function buildPromptBoardReply(request: AiPromptBoardRequest): string {
    return [
        `Method: ${request.methodTitle}`,
        `Prompt selected: ${request.promptLabel}`,
        formatProjectContext(request),
        'Recommended facilitation move: ask the team to generate evidence first, then converge on one signal they trust enough to act on.',
        `Starter prompt: ${request.promptTemplate}`
    ].join('\n\n');
}

export function buildChatReply(request: AiFacilitatorChatRequest): string {
    const previousPrompts = request.history.slice(-2).map((entry) => entry.prompt).join(' / ');

    return [
        `For ${request.project.name || 'this project'}, keep ${request.methodTitle} focused on a single outcome the group can leave the room with.`,
        formatProjectContext(request),
        'Suggested next move: frame the discussion around one concrete decision, capture 3-5 signals, then summarize the strongest takeaway before moving on.',
        previousPrompts ? `Recent prompts in this run: ${previousPrompts}` : 'This is the first facilitator exchange in the run.',
        `Your ask: ${request.message}`
    ].join('\n\n');
}

function ensureStringArray(value: ToolFieldValue): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function buildStepAssistResponse(request: AiStepAssistRequest): AiStepAssistResponse {
    if (request.stepType === 'diverge') {
        const currentItems = ensureStringArray(request.currentValue ?? []);
        const subject = request.project.name || request.methodTitle;
        const additions = [
            `${subject}: surface one user pain point that still feels unresolved`,
            `${subject}: test a low-effort experiment before expanding the scope`,
            `${subject}: identify one constraint that could become a design principle`
        ];

        return {
            mode: 'local-mvp',
            source: 'local-mock',
            nextValue: [...currentItems, ...additions],
            summary: 'Added three starter ideas to help the team keep moving.'
        };
    }

    if (request.stepType === 'input' || request.stepType === 'text' || request.stepType === 'textarea') {
        const currentText = typeof request.currentValue === 'string' ? request.currentValue.trim() : '';
        const prefix = currentText ? `${currentText}\n\n` : '';

        return {
            mode: 'local-mvp',
            source: 'local-mock',
            nextValue: `${prefix}[Facilitator note]\nClarify the decision this step should unlock, name the evidence you already have, and end with the next action for the team.`,
            summary: 'Expanded the current response with a facilitation prompt.'
        };
    }

    return {
        mode: 'local-mvp',
        source: 'local-mock',
        nextValue: request.currentValue ?? null,
        summary: 'No assisted update was needed for this step.'
    };
}

export interface AiGateway {
    promptBoard(request: AiPromptBoardRequest): Promise<AiTextResponse>;
    facilitatorChat(request: AiFacilitatorChatRequest): Promise<AiTextResponse>;
    stepAssist(request: AiStepAssistRequest): Promise<AiStepAssistResponse>;
}

class LocalMvpAiGateway implements AiGateway {
    async promptBoard(request: AiPromptBoardRequest): Promise<AiTextResponse> {
        await wait(900);

        return {
            mode: 'local-mvp',
            source: 'local-mock',
            reply: buildPromptBoardReply(request)
        };
    }

    async facilitatorChat(request: AiFacilitatorChatRequest): Promise<AiTextResponse> {
        await wait(700);

        return {
            mode: 'local-mvp',
            source: 'local-mock',
            reply: buildChatReply(request)
        };
    }

    async stepAssist(request: AiStepAssistRequest): Promise<AiStepAssistResponse> {
        await wait(1100);

        return buildStepAssistResponse(request);
    }
}

export const localAiGateway: AiGateway = new LocalMvpAiGateway();
