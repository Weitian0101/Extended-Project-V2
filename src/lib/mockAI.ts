import { StickyNote, PrototypeArtifact, FeedbackItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const mockAI = {
    clusterIdeas: async (notes: StickyNote[]): Promise<StickyNote[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const enhancedNotes = notes.map(note => {
                    let tag = 'General';
                    const content = note.content.toLowerCase();
                    if (content.includes('user') || content.includes('human')) tag = 'User Needs';
                    if (content.includes('tech') || content.includes('app')) tag = 'Technology';
                    if (content.includes('money') || content.includes('cost')) tag = 'Business';

                    return {
                        ...note,
                        tags: [...(note.tags || []), tag]
                    };
                });
                resolve(enhancedNotes);
            }, 1000);
        });
    },

    generateLowFi: async (title: string, description: string): Promise<PrototypeArtifact> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: uuidv4(),
                    title: `Wireframe for ${title}`,
                    description: 'AI Generated Low-Fi Prototype',
                    type: 'wireframe',
                    content: `
            [Header: ${title}]
            -------------------
            [ Hero Image Placeholder ]
            [ Headline: ${description.substring(0, 20)}... ]
            [ CTA Button: Learn More ]
            
            [ Feature Grid: Feature 1 | Feature 2 | Feature 3 ]
            [ Footer: Links ]
          `
                });
            }, 2000);
        });
    },

    summarizeFeedback: async (feedback: FeedbackItem[]): Promise<string> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const count = feedback.length;
                resolve(`
          ## Feedback Summary (${count} items)
          - Users generally found the concept "interesting".
          - Key concern: Navigation clarity.
          - Requested feature: Dark mode.
          - Sentiment: Positive leaning.
        `);
            }, 1500);
        });
    },

    draftStory: async (bmc: any, roadmap: any): Promise<string> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`
          # The Innovation Story
          Targeting a key gap in the market, we propose a solution that leverages AI to streamline workflows.
          By addressing the pain points identified in our user research (Explore stage), and iterating on prototypes,
          we have validated a business model that scales.
          Our roadmap shows immediate wins in Q1, with major expansion in Q2.
        `);
            }, 2000);
        });
    }
};
