import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout';

const sections = [
    {
        title: 'Information collected',
        paragraphs: [
            'The platform may collect account information such as name, email address, workspace role, project participation, and activity needed to provide sign-in, collaboration, and project features.',
            'Project content created inside the workspace, including notes, prompts, boards, project metadata, and collaboration records, may also be stored to support the service.'
        ]
    },
    {
        title: 'How information is used',
        paragraphs: [
            'Information is used to authenticate users, manage workspace access, support collaboration, maintain project history, improve product quality, and operate the service securely.',
            'Operational data may also be used to diagnose technical issues, monitor performance, and protect the platform against abuse or unauthorised access.'
        ]
    },
    {
        title: 'Sharing and access',
        paragraphs: [
            'Information is shared only where needed to provide the service, maintain infrastructure, or support legitimate workspace collaboration between authorised users.',
            'Personal data is not sold. Access is limited to those who need it for administration, technical support, or the functioning of the platform.'
        ]
    },
    {
        title: 'Retention and security',
        paragraphs: [
            'Reasonable technical and organisational measures are used to protect account and project data. No online system can guarantee absolute security, but care is taken to reduce risk and limit unnecessary exposure.',
            'Data is retained for as long as it is needed to operate the service, support ongoing projects, meet legitimate administrative needs, or comply with legal obligations.'
        ]
    },
    {
        title: 'Your choices',
        paragraphs: [
            'You may request updates to your account information or raise questions about how your information is used through the platform contact address.',
            'Where appropriate, requests relating to access, correction, or deletion can be reviewed in line with applicable legal and organisational requirements.'
        ]
    },
    {
        title: 'Contact',
        paragraphs: [
            'Questions about this privacy policy or about personal information handled through the platform can be sent to juliana@academyofdesignthinking.com.'
        ]
    }
] as const;

export default function PrivacyPolicyPage() {
    return (
        <LegalDocumentLayout
            title="Privacy Policy"
            summary="This page explains what information may be processed through Innovation Sandbox and how it is used to operate the platform."
            updated="21 March 2026"
            sections={[...sections]}
        />
    );
}
