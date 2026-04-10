import { NextResponse } from 'next/server';

import { AiFacilitatorChatRequest } from '@/lib/contracts/api';
import { assertAiRouteAccess } from '@/lib/server/aiAccess';
import { serverAiGateway } from '@/lib/server/aiGateway';
import { toErrorMessage } from '@/lib/server/errors';

export async function POST(request: Request) {
    try {
        await assertAiRouteAccess();
        const body = await request.json() as AiFacilitatorChatRequest;
        const result = await serverAiGateway.facilitatorChat(body);

        return NextResponse.json(result);
    } catch (error) {
        const message = toErrorMessage(error, 'Unable to run facilitator chat.');
        const status = message === 'Unauthenticated' ? 401 : 500;

        return NextResponse.json({ error: message }, { status });
    }
}
