import type { Metadata } from 'next';

import { BrandedLoadingScreen } from '@/components/ui/BrandedLoadingScreen';

interface OpeningProjectPageProps {
    searchParams: Promise<{
        name?: string;
    }>;
}

export async function generateMetadata({ searchParams }: OpeningProjectPageProps): Promise<Metadata> {
    const params = await searchParams;
    const projectName = typeof params.name === 'string' && params.name.trim()
        ? params.name.trim()
        : 'Project';

    return {
        title: `Opening ${projectName}`
    };
}

export default async function OpeningProjectPage({ searchParams }: OpeningProjectPageProps) {
    const params = await searchParams;
    const projectName = typeof params.name === 'string' && params.name.trim()
        ? params.name.trim()
        : 'Project';

    return (
        <BrandedLoadingScreen
            fullscreen
            label={`Opening ${projectName}`}
            detail="Preparing the project hub, context, and workspace data."
        />
    );
}
