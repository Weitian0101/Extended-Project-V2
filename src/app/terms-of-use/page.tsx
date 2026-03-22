import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout';

const sections = [
    {
        title: 'Using the platform',
        paragraphs: [
            'Innovation Sandbox is provided to support project planning, workshop facilitation, idea development, and collaboration activities for Academy of Design Thinking and approved workspace participants.',
            'By accessing the platform, you agree to use it responsibly, keep your account credentials secure, and follow any organisational guidance shared with you for workshops, project spaces, and shared materials.'
        ]
    },
    {
        title: 'Accounts and access',
        paragraphs: [
            'You are responsible for providing accurate account information and for maintaining the confidentiality of your sign-in credentials.',
            'Access may be suspended or withdrawn if an account is used in a way that risks the security, availability, or integrity of the platform or of other users’ workspaces.'
        ]
    },
    {
        title: 'Acceptable use',
        paragraphs: [
            'You must not upload malicious code, attempt unauthorised access, interfere with the service, or use the platform to store unlawful, harmful, or infringing material.',
            'Shared content should remain relevant to legitimate project, workshop, facilitation, or organisational activity.'
        ]
    },
    {
        title: 'Content ownership',
        paragraphs: [
            'Users retain ownership of the original materials, notes, and project content they create or upload, subject to any applicable employment, client, or organisational agreements.',
            'The platform interface, branding, and software implementation remain protected by applicable intellectual property rights and may not be copied or redistributed except where permission has been granted.'
        ]
    },
    {
        title: 'Service availability',
        paragraphs: [
            'Reasonable efforts are made to keep the service available, secure, and up to date, but uninterrupted availability cannot be guaranteed.',
            'Features may be updated, improved, limited, or removed where necessary to maintain quality, security, or compatibility.'
        ]
    },
    {
        title: 'Contact',
        paragraphs: [
            'Questions about these terms or about access to the platform can be directed to juliana@academyofdesignthinking.com.'
        ]
    }
] as const;

export default function TermsOfUsePage() {
    return (
        <LegalDocumentLayout
            title="Terms of Use"
            summary="These terms explain the basic conditions for accessing and using the Innovation Sandbox platform."
            updated="21 March 2026"
            sections={[...sections]}
        />
    );
}
