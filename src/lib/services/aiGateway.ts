import {
    AiFacilitatorChatRequest,
    AiPromptBoardRequest,
    AiStepAssistRequest,
    AiStepAssistResponse,
    AiTextResponse
} from '@/lib/contracts/api';
import { fetchApiJson } from '@/lib/services/remoteApi';
import { AiGateway } from '@/lib/services/localAiGateway';

async function postAiRoute<TResponse>(path: string, payload: unknown) {
    return fetchApiJson<TResponse>(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
}

class HttpAiGateway implements AiGateway {
    async promptBoard(request: AiPromptBoardRequest): Promise<AiTextResponse> {
        return postAiRoute<AiTextResponse>('/api/ai/prompt-board', request);
    }

    async facilitatorChat(request: AiFacilitatorChatRequest): Promise<AiTextResponse> {
        return postAiRoute<AiTextResponse>('/api/ai/facilitator-chat', request);
    }

    async stepAssist(request: AiStepAssistRequest): Promise<AiStepAssistResponse> {
        return postAiRoute<AiStepAssistResponse>('/api/ai/step-assist', request);
    }
}

export const aiGateway: AiGateway = new HttpAiGateway();
