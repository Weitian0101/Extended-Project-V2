import { NextResponse } from 'next/server';

import { AiStepAssistRequest } from '@/lib/contracts/api';
import { assertAiRouteAccess } from '@/lib/server/aiAccess';
import { serverAiGateway } from '@/lib/server/aiGateway';
import { toErrorMessage } from '@/lib/server/errors';

export async function POST(request: Request) {
    try {
        await assertAiRouteAccess();
        const body = await request.json() as AiStepAssistRequest;
        const result = await serverAiGateway.stepAssist(body);

        return NextResponse.json(result);
    } catch (error) {
        const message = toErrorMessage(error, 'Unable to run step assist.');
        const status = message === 'Unauthenticated' ? 401 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}
