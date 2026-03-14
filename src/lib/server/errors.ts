function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

export function toErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (isRecord(error)) {
        const parts = [
            typeof error.message === 'string' ? error.message : null,
            typeof error.details === 'string' ? error.details : null,
            typeof error.hint === 'string' ? error.hint : null,
            typeof error.code === 'string' ? `code ${error.code}` : null
        ].filter(Boolean);

        if (parts.length > 0) {
            return parts.join(' | ');
        }
    }

    return fallback;
}
