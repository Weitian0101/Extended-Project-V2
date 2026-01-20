import React from 'react';
import { StageToolBoard } from '@/components/tools/StageToolBoard';

export function TestView() {
    return (
        <StageToolBoard
            stage="test"
            colorTheme="gray"
            headerTitle="Test Phase"
            headerDescription="Gather feedback and analyze results."
        />
    );
}
