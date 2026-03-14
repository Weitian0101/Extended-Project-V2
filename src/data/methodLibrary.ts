import { MethodCard } from '@/types';
import { getMethodCategory } from '@/data/stageGuides';

type LibraryStage = 'explore' | 'imagine' | 'implement' | 'tell-story';

type MethodDefinition = {
    stage: LibraryStage;
    id: string;
    title: string;
    purpose: string;
    prompts: string[];
};

const STAGE_IMAGE_ROOTS: Record<LibraryStage, string> = {
    explore: 'explore',
    imagine: 'imagine',
    implement: 'implement',
    'tell-story': 'tell-story'
};

const createPromptLabel = (promptTemplate: string) => (
    promptTemplate.length > 72
        ? `${promptTemplate.slice(0, 69).trimEnd()}...`
        : promptTemplate
);

const createMethodCard = ({ stage, id, title, purpose, prompts }: MethodDefinition): MethodCard => {
    const root = STAGE_IMAGE_ROOTS[stage];

    return {
        id,
        stage,
        title,
        category: getMethodCategory(stage, id),
        purpose,
        image: `/images/${root}/${id}-front.png`,
        referencePages: [
            {
                id: `${id}-front`,
                label: 'Card Front',
                image: `/images/${root}/${id}-front.png`
            },
            {
                id: `${id}-ai`,
                label: 'AI Prompts',
                image: `/images/${root}/${id}-ai.png`
            }
        ],
        aiPrompts: prompts.map((promptTemplate, index) => ({
            id: `${id}-prompt-${index + 1}`,
            label: createPromptLabel(promptTemplate),
            promptTemplate
        }))
    };
};

const EXPLORE_METHOD_DEFINITIONS: MethodDefinition[] = [
    {
        stage: 'explore',
        id: 'break-the-ice',
        title: 'Break the Ice',
        purpose: `Design engaging, purposeful openers with AI.`,
        prompts: [
            `Given the workshop theme [insert], generate 5 creative icebreakers that connect directly to the topic.`,
            `Suggest 3 inclusive activities that work equally well for in-person, remote, and hybrid teams.`,
            `Adapt this icebreaker [insert] for a group of [number] participants with limited time and space.`,
            `Create 5 playful but insight-generating icebreakers that also surface participants' assumptions about the challenge.`,
            `Propose a sequence of 3 escalating warm-up activities to build trust and creative energy.`
        ]
    },
    {
        stage: 'explore',
        id: 'challenge-the-brief',
        title: 'Challenge the Brief',
        purpose: `Push beyond assumptions to reveal the true design opportunity.`,
        prompts: [
            `Given this initial brief [insert], identify at least 5 assumptions or constraints we could challenge.`,
            `Reframe the brief in 3 different ways: user-centred, system-centred, and future-focused.`,
            `Propose provocative "What if..." questions to open up new solution spaces.`,
            `List potential blind spots in the brief and suggest how to investigate them.`
        ]
    },
    {
        stage: 'explore',
        id: 'frame-wicked-problems',
        title: 'Frame Wicked Problems',
        purpose: `Make complexity visible and find smart entry points.`,
        prompts: [
            `Map the system: Given this challenge [insert], list key actors, issues, policies, incentives, and feedback loops.`,
            `Surface tensions: Identify 5 irreducible dilemmas and write one "How might we..." for each.`,
            `Define boundaries: Propose 3 scopes (narrow, medium, wide) and the trade-offs of tackling each.`,
            `Suggest 5 "small changes, big impact" interventions and write a short hypothesis for each one.`
        ]
    },
    {
        stage: 'explore',
        id: 'choose-research-methods',
        title: 'Choose Research Methods',
        purpose: `Select and adapt research methods with AI guidance.`,
        prompts: [
            `Given our challenge [insert], suggest the most relevant qualitative and quantitative methods.`,
            `Propose a blended method approach to maximise insight depth and breadth.`,
            `Identify innovative or less common research methods suited to our context.`,
            `Suggest ways to adapt chosen methods for remote or hybrid research.`,
            `Generate tips for sequencing methods for optimal learning.`
        ]
    },
    {
        stage: 'explore',
        id: 'plan-research',
        title: 'Plan Research',
        purpose: `Design smarter, more targeted research plans with AI.`,
        prompts: [
            `Given our challenge [insert], outline goals, methods, participants, and timeline.`,
            `Suggest a mix of qualitative and quantitative methods to balance depth and breadth.`,
            `Identify possible biases and propose mitigations.`,
            `Suggest how to adapt the plan if time or budget is limited.`
        ]
    },
    {
        stage: 'explore',
        id: 'map-stakeholders',
        title: 'Map Stakeholders',
        purpose: `Map influence and relationships more strategically with AI support.`,
        prompts: [
            `Given this project context [insert], list all possible stakeholders, including less obvious ones.`,
            `Classify them by influence and interest levels, explaining why.`,
            `Suggest ways to engage each stakeholder group effectively.`,
            `Identify potential conflicts or alliances.`,
            `Propose 3 creative ways to involve underrepresented stakeholders.`
        ]
    },
    {
        stage: 'explore',
        id: 'explore-business-context',
        title: 'Explore Business Context',
        purpose: `Use AI to analyse the business landscape more quickly and broadly.`,
        prompts: [
            `Summarise current market trends, competitors, and key drivers.`,
            `Suggest 5-7 potential disruptors or shifts.`,
            `Identify industry benchmarks and outlier cases.`,
            `Generate stakeholder questions to clarify constraints and opportunities.`,
            `Propose a visual framework linking user needs to business objectives.`
        ]
    },
    {
        stage: 'explore',
        id: 'explore-external-context',
        title: 'Explore External Context',
        purpose: `Scan technology, demography, society, environment, and globalisation for opportunity.`,
        prompts: [
            `Trend brief: For our space [insert], summarise key shifts across tech, demography, societal trust and economy, environment, and globalisation. Include weak signals.`,
            `For each force, list 2-3 plausible ripple effects on user behaviour and business models.`,
            `Identify 5 strategic risks these forces introduce and propose a lightweight way to monitor each.`
        ]
    },
    {
        stage: 'explore',
        id: 'conduct-user-interviews',
        title: 'Conduct User Interviews',
        purpose: `Design richer interviews with AI-generated questions.`,
        prompts: [
            `Based on this challenge [insert], generate 10 open-ended interview questions.`,
            `Suggest counterintuitive questions to surface hidden needs.`,
            `Roleplay as the interviewee and answer authentically.`,
            `Propose follow-up questions from hypothetical responses.`,
            `Suggest activities to replace standard Q&A for deeper engagement.`
        ]
    },
    {
        stage: 'explore',
        id: 'immerse-yourself',
        title: 'Immerse Yourself',
        purpose: `Dive deeper into the user's world with AI-assisted prompts.`,
        prompts: [
            `Suggest environments or activities to immerse in.`,
            `Generate a sensory checklist (sights, sounds, smells, touches).`,
            `Propose role-play or simulation exercises.`,
            `Recommend ways to document immersion insights.`,
            `Suggest reflective post-immersion questions.`
        ]
    },
    {
        stage: 'explore',
        id: 'observe-users',
        title: 'Observe Users',
        purpose: `Spot unseen patterns with AI-powered observation prompts.`,
        prompts: [
            `Suggest behaviours, objects, or interactions to focus on.`,
            `Create a field note checklist.`,
            `Predict patterns to watch for.`,
            `Recommend visual mapping techniques.`,
            `Suggest ways to synthesise observational data.`
        ]
    },
    {
        stage: 'explore',
        id: 'map-empathy',
        title: 'Map Empathy',
        purpose: `Uncover hidden insights by expanding empathy maps with AI.`,
        prompts: [
            `Generate a full empathy map from a persona description.`,
            `Suggest unusual pains and gains.`,
            `Roleplay a day in the persona's life.`,
            `Suggest 5 opportunity areas.`,
            `Generate probing interview questions for each quadrant.`
        ]
    },
    {
        stage: 'explore',
        id: 'build-a-persona',
        title: 'Build a Persona',
        purpose: `Generate richer, more nuanced personas with AI support.`,
        prompts: [
            `Create 3 distinct personas with names, goals, pains, and behaviours.`,
            `Generate a day-in-the-life story.`,
            `Suggest 5 unexpected interview questions.`,
            `Brainstorm 10 features balancing desirability, viability, and feasibility.`,
            `Roleplay as this persona reacting to a product pitch.`
        ]
    },
    {
        stage: 'explore',
        id: 'map-the-user-journey',
        title: 'Map the User Journey',
        purpose: `Expand both "as is" and "to be" journeys with richer detail and possibilities.`,
        prompts: [
            `Given our user [insert], generate a step-by-step map of their current ("as is") journey, including actions, thoughts, emotions, and pain points.`,
            `Suggest hidden or overlooked touchpoints that might be missed in manual mapping.`,
            `Generate future ("to be") scenarios that remove pain points and amplify delight.`,
            `Recommend metrics to track at each stage of the journey for ongoing evaluation.`
        ]
    },
    {
        stage: 'explore',
        id: 'create-a-shared-model',
        title: 'Create a Shared Model',
        purpose: `Build common understanding through collaborative visualisation.`,
        prompts: [
            `Suggest 3 alternative visual frameworks (map, diagram, canvas) to represent the same information.`,
            `Highlight gaps or inconsistencies in the shared model and propose clarifying questions.`,
            `Generate example scenarios to test whether the model holds true in practice.`,
            `Propose ways to evolve the shared model as we learn more during the project.`
        ]
    },
    {
        stage: 'explore',
        id: 'analyse-and-synthesise',
        title: 'Analyse and Synthesise',
        purpose: `Cluster ideas and insights more creatively with AI support.`,
        prompts: [
            `Suggest 5-7 thematic clusters and name them.`,
            `Recommend unusual grouping criteria.`,
            `Generate concise labels.`,
            `Suggest connections between clusters.`,
            `Provide probing questions for each cluster.`
        ]
    },
    {
        stage: 'explore',
        id: 'draw-insights',
        title: 'Draw Insights',
        purpose: `Turn observations and clustered notes into stronger insights with AI.`,
        prompts: [
            `Here are clustered user quotes and observations: [paste notes]. What patterns, tensions, or surprises do you see?`,
            `Reframe these observations as insight statements that reveal why they matter, not just what happened.`,
            `Generate 10 possible insights from this data, phrased as human-centred truths.`,
            `Which of these insights seem most impactful for defining new opportunities?`
        ]
    },
    {
        stage: 'explore',
        id: 'define-problem-statement',
        title: 'Define Problem Statement',
        purpose: `Craft sharper, more inspiring problem statements with AI.`,
        prompts: [
            `Craft sharper, more inspiring problem statements.`,
            `Suggest statements that encourage radically different solutions.`,
            `Rewrite the problem statement focusing on emotion, behaviour, or systemic impact.`,
            `Generate opposite or reframed statements.`,
            `Evaluate each option against clarity, inspiration, and scope.`
        ]
    },
    {
        stage: 'explore',
        id: 'map-opportunities',
        title: 'Map Opportunities',
        purpose: `Prioritise opportunities in ways that spark bold solutions.`,
        prompts: [
            `Suggest ways to cluster or categorise insights into broader opportunity areas.`,
            `Propose prioritisation frameworks such as impact vs. effort or desirability vs. feasibility.`,
            `Generate extreme or wild-card opportunity statements to spark breakthrough ideas.`,
            `Recommend 2-3 opportunity areas that balance quick wins with long-term innovation.`
        ]
    },
    {
        stage: 'explore',
        id: 'frame-opportunity-statement',
        title: 'Frame Opportunity Statement',
        purpose: `Frame opportunities in ways that spark bold solutions.`,
        prompts: [
            `Draft 5 "How might we..." statements with different scopes and approaches.`,
            `Frame the opportunity from different stakeholder perspectives.`,
            `Generate extreme or unconventional statements.`,
            `Reframe the opportunity focusing on emotional, functional, or systemic aspects.`,
            `Propose quick validation questions.`
        ]
    }
];

const IMAGINE_METHOD_DEFINITIONS: MethodDefinition[] = [
    {
        stage: 'imagine',
        id: 'shift-gears',
        title: 'Shift Gears',
        purpose: `Switch mental gears to boost creativity.`,
        prompts: [
            `Suggest 5 short energising activities to shift from analytical to creative thinking.`,
            `Given our workshop theme [insert], design a 3-minute gear shift exercise that ties directly to the topic.`,
            `Propose alternative "reset" activities for in-person, remote, and hybrid groups.`,
            `Generate 3 "perspective-shift" prompts that push participants to see the problem in a new way.`,
            `Create a playlist of 5 songs that set a creative tone for the session.`
        ]
    },
    {
        stage: 'imagine',
        id: 'run-an-energiser',
        title: 'Run an Energiser',
        purpose: `Build energy, trust, and creative readiness.`,
        prompts: [
            `Suggest 5 energisers tailored to a group size of [insert number].`,
            `Propose inclusive energisers that work across cultures.`,
            `Create 3 themed energisers linked to our challenge context.`,
            `Recommend quick energisers for mid-session fatigue.`,
            `Suggest reflection questions after the energiser to connect it to the work ahead.`
        ]
    },
    {
        stage: 'imagine',
        id: 'set-ground-rules',
        title: 'Set Ground Rules',
        purpose: `Set the tone for productive, respectful collaboration.`,
        prompts: [
            `Tailored rules: We're running an ideation workshop with [describe participants, e.g. engineers, executives, students]. Suggest 8 ground rules that balance creativity with psychological safety.`,
            `Remote workshops: What ground rules help creativity in online brainstorming sessions where participants use Miro or MURAL?`,
            `Culture fit: Reframe classic brainstorming ground rules in a tone that fits [playful / professional / startup / academic] environments.`,
            `Short list: Give me a condensed set of 4 memorable ground rules we can put on the wall to guide our brainstorming.`
        ]
    },
    {
        stage: 'imagine',
        id: 'apply-ideation-techniques',
        title: 'Apply Ideation Techniques',
        purpose: `Expand idea generation beyond the usual methods.`,
        prompts: [
            `Based on our challenge [insert], suggest 5 ideation methods suited to small or large groups.`,
            `Recommend methods that push divergent thinking in unexpected directions.`,
            `Adapt a traditional technique for remote collaboration.`,
            `Generate an agenda that combines 2-3 techniques for maximum output in 30 minutes.`
        ]
    },
    {
        stage: 'imagine',
        id: 'brainstorm-ideas',
        title: 'Brainstorm Ideas',
        purpose: `Expand your idea pool and uncover unexpected directions.`,
        prompts: [
            `Generate 20 brainstorming prompts for the challenge: [insert your problem].`,
            `Suggest 10 brainstorming prompts for [insert challenge], but each idea must work under these constraints: [e.g. zero budget, only one day to implement, must use existing technology].`,
            `How would [teachers / athletes / children / a competitor] brainstorm solutions to this challenge?`
        ]
    },
    {
        stage: 'imagine',
        id: 'brainwrite-together',
        title: 'Brainwrite Together',
        purpose: `Capture diverse ideas quietly before group discussion.`,
        prompts: [
            `Based on our challenge [insert], generate 5 BrainWriting design constraints to spark ideas.`,
            `Suggest variations for remote BrainWriting sessions.`,
            `Propose time limits and rotation patterns to maximise idea flow.`,
            `Recommend ways to cluster and discuss BrainWriting outputs.`
        ]
    },
    {
        stage: 'imagine',
        id: 'reverse-the-solution',
        title: 'Reverse the Solution',
        purpose: `Break habitual thinking by flipping the problem.`,
        prompts: [
            `Rewrite our problem as "How might we make it worse?" and generate 10 bad solutions.`,
            `Flip each bad solution into a potential good idea.`,
            `Suggest unusual problem inversions to try.`,
            `Recommend ways to combine reversed solutions into fresh concepts.`,
            `Propose criteria for spotting promising ideas from reversals.`
        ]
    },
    {
        stage: 'imagine',
        id: 'ask-what-if',
        title: 'Ask "What If?"',
        purpose: `Unlock imagination with provocative scenarios.`,
        prompts: [
            `Generate 10 "What if..." questions that challenge our assumptions.`,
            `Create extreme and playful "What if" prompts to stretch thinking.`,
            `Suggest ways to connect "What if" scenarios back to real constraints.`,
            `Propose follow-up activities to explore feasibility.`,
            `Generate visual metaphors to express the wildest "What if" ideas.`
        ]
    },
    {
        stage: 'imagine',
        id: 'sketch-crazy-8s',
        title: 'Sketch Crazy 8s',
        purpose: `Rapidly sketch multiple solutions.`,
        prompts: [
            `Suggest eight different angles or variations on our challenge: [insert challenge].`,
            `Propose "constraint flips" (e.g. opposite user, extreme budget, no tech) to stretch thinking.`,
            `Generate prompts to push beyond safe ideas into wild or provocative territory.`,
            `Recommend how to cluster and name ideas after the exercise.`,
            `Suggest adaptations of Crazy 8s for remote or digital collaboration.`
        ]
    },
    {
        stage: 'imagine',
        id: 'select-promising-ideas',
        title: 'Select Promising Ideas',
        purpose: `Choose the most promising concepts to develop further.`,
        prompts: [
            `Propose 3 quick selection methods for narrowing a long idea list.`,
            `Suggest criteria balancing desirability, feasibility, viability, and sustainability.`,
            `Given our shortlist [insert], score each idea against these criteria.`,
            `Recommend methods to involve users in the selection process.`,
            `Suggest a "wildcard" idea to keep in the mix for inspiration.`
        ]
    },
    {
        stage: 'imagine',
        id: 'prioritise-with-2x2-grid',
        title: 'Prioritise with 2x2 Grid',
        purpose: `Visualise idea impact versus effort.`,
        prompts: [
            `Based on our ideas [insert], place them on a 2x2 priority grid (impact vs. effort).`,
            `Suggest 3 alternative axes for evaluating ideas (e.g. speed to market, learning potential).`,
            `Propose conversation prompts for each quadrant to ensure balanced discussion.`,
            `Recommend ways to revisit and update the grid as assumptions change.`,
            `Suggest follow-up actions for high-impact, high-effort ideas.`
        ]
    },
    {
        stage: 'imagine',
        id: 'create-a-concept',
        title: 'Create a Concept',
        purpose: `Turn rough ideas into clear, shareable concepts.`,
        prompts: [
            `Given an idea [insert], create a one-page concept summary including title, user need, key features, and benefits.`,
            `Suggest ways to visually represent the concept for quick understanding.`,
            `Generate 3 variations of the concept for different user segments.`,
            `Identify possible risks and unknowns for each variation.`,
            `Propose questions to test with users before investing further in the concept.`
        ]
    },
    {
        stage: 'imagine',
        id: 'exchange-feedback',
        title: 'Exchange Feedback',
        purpose: `Exchange constructive input to strengthen ideas.`,
        prompts: [
            `Generate 5 feedback prompts using the "I like, I wish, What if" framework.`,
            `Suggest methods for collecting feedback anonymously and in real time.`,
            `Propose ways to reframe negative feedback into actionable insights.`,
            `Recommend how to balance feedback from users, team members, and stakeholders.`,
            `Suggest a structured debrief activity to turn feedback into clear next steps.`
        ]
    },
    {
        stage: 'imagine',
        id: 'choose-prototype-types',
        title: 'Choose Prototype Types',
        purpose: `Use AI to enhance your concept testing process.`,
        prompts: [
            `Given our objective [insert], recommend suitable prototype types (e.g. paper, digital, role-play).`,
            `Suggest the minimal level of fidelity needed to answer our question.`,
            `Propose creative prototype formats beyond the obvious.`,
            `Recommend how to combine multiple prototype types in one test.`,
            `Suggest ways to reuse or adapt prototypes for future tests.`
        ]
    },
    {
        stage: 'imagine',
        id: 'apply-prototype-techniques',
        title: 'Apply Prototype Techniques',
        purpose: `Use practical methods to bring ideas to life quickly.`,
        prompts: [
            `Based on our concept [insert], suggest step-by-step instructions for making a low-cost prototype.`,
            `Recommend tools and materials for different prototype types.`,
            `Propose time-saving hacks for building under tight deadlines.`,
            `Suggest how to make prototypes interactive for richer feedback.`,
            `Recommend a checklist for preparing prototypes for testing.`
        ]
    },
    {
        stage: 'imagine',
        id: 'test-the-concept',
        title: 'Test the Concept',
        purpose: `Validate the overall idea before investing heavily in prototyping.`,
        prompts: [
            `Suggest lightweight ways (e.g. mock ads, concept boards, pitches) to validate interest, relevance, and willingness to pay.`,
            `Help me test an early concept with potential users before I build a prototype.`,
            `Suggest key questions to answer in the first round of testing.`,
            `Suggest how to adapt the concept based on test feedback.`
        ]
    },
    {
        stage: 'imagine',
        id: 'test-with-users',
        title: 'Test with Users',
        purpose: `Gather evidence from real users to improve the solution.`,
        prompts: [
            `Help me design a quick user test for my prototype. The goal is to learn about desirability, usability, and feasibility.`,
            `Suggest simple ways to capture both what users say and how they behave.`,
            `Suggest a test plan covering participants, method, and success criteria.`,
            `Propose ways to capture both qualitative and quantitative feedback.`,
            `Propose a synthesis framework for test findings.`
        ]
    },
    {
        stage: 'imagine',
        id: 'iterate-the-prototype',
        title: 'Iterate the Prototype',
        purpose: `Accelerate learning cycles and explore multiple refinements quickly.`,
        prompts: [
            `Given our prototype [insert], suggest 5-7 possible improvements based on common feedback themes.`,
            `Propose variations of the concept that target different user segments.`,
            `Generate quick "what if" scenarios to explore bold or unconventional changes.`,
            `Suggest ways to prioritise iterations based on impact vs. effort.`,
            `Rewrite our user journey incorporating the new iteration for clarity.`
        ]
    },
    {
        stage: 'imagine',
        id: 'co-iterate-with-users',
        title: 'Co-iterate with Users',
        purpose: `Refine solutions collaboratively with end users.`,
        prompts: [
            `Propose structured co-creation sessions for specific design challenges.`,
            `Suggest activities that encourage users to sketch or prototype their own ideas.`,
            `Recommend ways to integrate user feedback in real time.`,
            `Suggest tools for remote co-iteration workshops.`,
            `Propose reflection questions to deepen user involvement.`
        ]
    },
    {
        stage: 'imagine',
        id: 'run-a-design-sprint',
        title: 'Run a Design Sprint',
        purpose: `Compress the design process into focused, time-boxed effort.`,
        prompts: [
            `Outline a 5-day sprint plan tailored to our challenge.`,
            `Suggest adaptations for a 3-day or 1-day mini-sprint.`,
            `Propose activities for each sprint day to maximise learning.`,
            `Recommend roles and responsibilities for sprint team members.`,
            `Suggest how to integrate sprint outcomes into ongoing work.`
        ]
    }
];
const IMPLEMENT_METHOD_DEFINITIONS: MethodDefinition[] = [
    {
        stage: 'implement',
        id: 'identify-assumptions',
        title: 'Identify Assumptions',
        purpose: `Make the risks and unknowns around your concept explicit.`,
        prompts: [
            `Given our concept [insert], list assumptions across desirability, feasibility, viability, and sustainability.`,
            `Suggest a method to rate each assumption by risk and uncertainty.`,
            `Propose quick ways to test the riskiest assumptions first.`,
            `Generate questions to uncover hidden or unconscious assumptions.`,
            `Suggest a visual map linking assumptions to evidence gaps.`
        ]
    },
    {
        stage: 'implement',
        id: 'frame-hypotheses',
        title: 'Frame Hypotheses',
        purpose: `Turn assumptions into clear, testable hypotheses.`,
        prompts: [
            `Given our assumptions [insert], write clear "If... then..." hypotheses.`,
            `Suggest how to frame hypotheses for user behaviour, technical feasibility, and market adoption.`,
            `Propose 3-5 bold hypotheses that could radically change our approach.`,
            `Recommend metrics for validating or invalidating each hypothesis.`
        ]
    },
    {
        stage: 'implement',
        id: 'plan-experiments',
        title: 'Plan Experiments',
        purpose: `Move from experiment design to execution with clarity and precision.`,
        prompts: [
            `Given our experiment plan [insert], generate a step-by-step checklist to prepare resources, tools, and participants.`,
            `Suggest ways to recruit and brief participants to ensure relevant, unbiased feedback.`,
            `Propose methods for collecting data consistently across multiple trials.`,
            `Recommend backup plans for common experiment disruptions or failures.`,
            `Generate templates for recording observations, metrics, and learnings in real time.`
        ]
    },
    {
        stage: 'implement',
        id: 'set-up-experiments',
        title: 'Set up Experiments',
        purpose: `Design targeted tests to validate assumptions and reduce risk.`,
        prompts: [
            `Design targeted tests to validate assumptions and reduce risk.`,
            `Given our concept [insert], list the top 5-7 assumptions we must validate before launch.`,
            `Suggest experiment formats for each assumption (e.g. landing page test, prototype trial, role-play, A/B test).`,
            `Recommend timelines, participant profiles, and sample sizes for credible results.`,
            `Propose metrics and success thresholds for each experiment.`,
            `Identify the fastest, lowest-cost way to get actionable data for each test.`
        ]
    },
    {
        stage: 'implement',
        id: 'test-desirability',
        title: 'Test Desirability',
        purpose: `Gauge whether your target customers truly want your solution.`,
        prompts: [
            `Identify 5-7 assumptions about user preferences and behaviours to test.`,
            `Suggest quick validation methods (smoke tests, fake-door pages, ad campaigns).`,
            `Propose interview and survey questions that reveal emotional drivers.`,
            `Generate variations of the concept to compare user appeal.`,
            `Recommend ways to track and measure interest before launch.`
        ]
    },
    {
        stage: 'implement',
        id: 'test-feasibility',
        title: 'Test Feasibility',
        purpose: `Assess whether your concept can be built and delivered reliably.`,
        prompts: [
            `List 5-7 key technical or operational assumptions to validate.`,
            `Suggest small-scale prototypes or proof-of-concept builds to test constraints.`,
            `Identify potential technology, supply chain, or skills gaps.`,
            `Recommend partnerships or resources to increase feasibility.`,
            `Propose fallback options if a core element proves unworkable.`
        ]
    },
    {
        stage: 'implement',
        id: 'test-viability',
        title: 'Test Viability',
        purpose: `Assess whether your concept can succeed in the market and sustain itself.`,
        prompts: [
            `Given our concept [insert], identify 5-7 key financial and market assumptions to validate.`,
            `Suggest 3 quick, low-cost experiments to test pricing sensitivity.`,
            `Generate competitor analysis highlighting potential differentiators and gaps.`,
            `Propose 5 key metrics (e.g. CAC, LTV, churn rate) to track from day one.`,
            `Recommend ways to simulate demand before launch (landing pages, pre-orders, smoke tests).`
        ]
    },
    {
        stage: 'implement',
        id: 'test-sustainability',
        title: 'Test Sustainability',
        purpose: `Evaluate long-term environmental, social, and ethical impacts of your concept.`,
        prompts: [
            `Given our concept [insert], list 5-7 key sustainability assumptions to validate.`,
            `Propose quick tests or research methods to assess environmental footprint (materials, energy, waste).`,
            `Suggest metrics for social impact (community benefit, inclusivity, fair labour).`,
            `Identify potential regulatory or certification requirements for sustainable operation.`,
            `Generate 3 alternative concept adjustments to improve sustainability without losing core value.`
        ]
    },
    {
        stage: 'implement',
        id: 'apply-business-lenses',
        title: 'Apply Business Lenses',
        purpose: `Evaluate your proposal from multiple organisational perspectives.`,
        prompts: [
            `Given our concept [insert], list 3-5 potential impacts in each of these areas: people, processes, platforms, financials, policy and regulations, and location.`,
            `Propose targeted questions to ask stakeholders in each category.`,
            `Suggest quick validation activities (e.g. simulations, pilot runs, stakeholder interviews) for high-risk areas.`,
            `Identify possible unintended consequences in each lens and propose mitigation strategies.`,
            `Recommend ways to visually map trade-offs across all business lenses for decision-making.`
        ]
    },
    {
        stage: 'implement',
        id: 'design-a-go-to-market-strategy',
        title: 'Design a Go-To-Market Strategy',
        purpose: `Plan how the solution will reach, attract, and convert the right audience.`,
        prompts: [
            `Generate a go-to-market plan including positioning, pricing, and promotion.`,
            `Suggest launch channels based on target audience behaviour.`,
            `Recommend early adopter outreach strategies.`,
            `Propose launch-day activation activities.`,
            `Suggest post-launch tracking metrics.`
        ]
    },
    {
        stage: 'implement',
        id: 'map-a-bmc',
        title: 'Map a BMC',
        purpose: `Visualise the key building blocks of your business model.`,
        prompts: [
            `Visualise and stress-test your business model with AI support.`,
            `Given our concept [insert], populate each of the 9 blocks with 3-5 bullet points.`,
            `Suggest alternative revenue streams or pricing models we might explore.`,
            `Identify potential gaps or contradictions between blocks (e.g. cost structure vs. key activities).`,
            `Propose 2-3 unusual partner or channel ideas to expand reach.`
        ]
    },
    {
        stage: 'implement',
        id: 'map-a-vpc',
        title: 'Map a VPC',
        purpose: `Map customer jobs, pains, gains, and the value you create.`,
        prompts: [
            `Given our target segment [insert], fill in the customer profile (jobs, pains, gains) using 10+ examples per section.`,
            `Suggest product or service features that address the top 3 pains and create the top 3 gains.`,
            `Identify mismatches between customer needs and our current offer.`,
            `Generate extreme or unconventional value propositions to spark new thinking.`,
            `Create 3 alternative propositions tailored to different customer personas.`
        ]
    },
    {
        stage: 'implement',
        id: 'design-with-the-4p-model',
        title: 'Design with the 4P Model',
        purpose: `Refine your go-to-market strategy across product, price, place, and promotion.`,
        prompts: [
            `Given our concept [insert], propose 3-5 options for each P: product, price, promotion, and place.`,
            `Suggest innovative pricing strategies aligned with our target customer segment.`,
            `Generate unconventional promotion ideas that fit our brand voice and budget.`,
            `Recommend distribution channels, both traditional and digital, that reach our audience effectively.`
        ]
    },
    {
        stage: 'implement',
        id: 'design-with-the-4c-model',
        title: 'Design with the 4C Model',
        purpose: `Reframe your offer from the customer's perspective.`,
        prompts: [
            `Given our concept [insert], define each C: consumer wants and needs, cost to satisfy, convenience to buy, and communication.`,
            `Suggest research prompts to uncover deeper consumer wants and unmet needs.`,
            `Propose cost scenarios balancing value perception and profitability.`,
            `Recommend strategies to increase convenience (location, delivery, access).`,
            `Generate communication ideas that resonate with target segments and build trust.`
        ]
    },
    {
        stage: 'implement',
        id: 'build-a-service-blueprint',
        title: 'Build a Service Blueprint',
        purpose: `Map the customer experience alongside the internal processes that support it.`,
        prompts: [
            `Given our service or product [insert], outline the full customer journey from awareness to post-purchase.`,
            `Identify all frontstage (customer-facing) and backstage (internal) activities for each journey step.`,
            `Suggest tools or platforms to improve coordination between customer experience and internal processes.`,
            `Propose 2-3 alternative process designs to reduce friction or improve service quality.`,
            `Highlight potential gaps between customer expectations and operational capabilities and suggest quick fixes.`
        ]
    },
    {
        stage: 'implement',
        id: 'test-the-whole-system',
        title: 'Test the Whole System',
        purpose: `Stress-test how all parts of the solution work together in context.`,
        prompts: [
            `Given our concept [insert], outline all interconnected components (people, processes, technology, policies).`,
            `Propose a simulation or pilot that tests the end-to-end experience for users.`,
            `Suggest metrics to track performance across technical, operational, and user satisfaction dimensions.`,
            `Identify weak points or bottlenecks that only appear when the full system is running.`,
            `Recommend contingency plans for critical failure points uncovered during testing.`
        ]
    },
    {
        stage: 'implement',
        id: 'run-pilots',
        title: 'Run Pilots',
        purpose: `Refine and de-risk your solution with AI-assisted pilot planning.`,
        prompts: [
            `Given our concept [insert], suggest 3-5 pilot scenarios with varying scope and audience.`,
            `Propose low-cost ways to replicate real conditions without committing full resources.`,
            `Recommend key metrics to track during the pilot, tailored to our goals.`,
            `Identify operational or user experience risks before launch.`,
            `Suggest ways to gather feedback during the pilot unobtrusively.`
        ]
    },
    {
        stage: 'implement',
        id: 'launch-the-solution',
        title: 'Launch the Solution',
        purpose: `Plan a 90-day launch roadmap and de-risk the rollout.`,
        prompts: [
            `Create a 90-day go-to-market roadmap for this concept, broken into weekly milestones for marketing, sales, product, and operations.`,
            `Identify the top 5 risks to a successful launch and suggest mitigation tactics for each.`,
            `Draft 3 variations of the launch announcement: one for early adopters, one for industry press, and one for internal stakeholders.`,
            `Suggest the pros and cons of launching in Q1 vs Q3 for this industry, based on market patterns and buyer behaviour.`
        ]
    },
    {
        stage: 'implement',
        id: 'scale-the-solution',
        title: 'Scale the Solution',
        purpose: `Plan how the solution can grow without breaking the model.`,
        prompts: [
            `Analyse this business model and identify which parts can scale easily and which may break under growth pressure.`,
            `List 5 possible ways to expand the customer base, including geographic expansion, adjacent market entry, and new segment targeting, and propose a test for each.`,
            `Propose 3 low-risk experiments to test if this concept can double sales without doubling costs.`,
            `Suggest ways to automate, outsource, or streamline high-effort processes while maintaining quality.`,
            `What allies or partners are needed to grow impact responsibly?`
        ]
    },
    {
        stage: 'implement',
        id: 'select-scaling-path',
        title: 'Select Scaling Path',
        purpose: `Choose the most appropriate way to scale the solution.`,
        prompts: [
            `Suggest different scaling models (geographic, product line, channel).`,
            `Recommend pros and cons for each approach in our case.`,
            `Propose key indicators for scaling readiness.`,
            `Suggest pilot approaches to test scaling potential.`,
            `Recommend partnerships that could accelerate scale.`
        ]
    }
];
const TELL_STORY_METHOD_DEFINITIONS: MethodDefinition[] = [
    {
        stage: 'tell-story',
        id: 'apply-4d-frame',
        title: 'Apply 4D Frame',
        purpose: `Frame your story around why, who, what, and how.`,
        prompts: [
            `Given our project [insert], outline a 4D Frame narrative covering why, who, what, and how.`,
            `Suggest 3 variations of the 4D Frame for different audiences.`,
            `Recommend prompts to deepen the "why" and connect emotionally.`,
            `Propose ways to integrate visuals into each part of the frame.`,
            `Suggest follow-up questions to test clarity and engagement.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'discover-the-purpose',
        title: 'Discover the Purpose',
        purpose: `Clarify why you need to communicate and what outcome you want.`,
        prompts: [
            `Generate 5 ways to articulate the core purpose of our story.`,
            `Suggest metaphors or analogies to express our purpose memorably.`,
            `Recommend prompts to connect the purpose to audience values.`,
            `Propose ways to check if the purpose resonates across diverse stakeholders.`,
            `Suggest reframing the purpose for internal vs. external audiences.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'define-the-audience',
        title: 'Define the Audience',
        purpose: `Shape the story around the people you need to influence.`,
        prompts: [
            `Create a quick audience persona for our key stakeholders.`,
            `Suggest 5 questions to uncover audience motivations and concerns.`,
            `Recommend ways to adapt tone, detail, and format for different groups.`,
            `Propose channels best suited to reach this audience effectively.`,
            `Suggest how to pre-test our story with a small audience sample.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'develop-the-content',
        title: 'Develop the Content',
        purpose: `Build the right mix of facts, stories, and evidence before you present.`,
        prompts: [
            `Given our project [insert], outline the top 3 content pillars to include.`,
            `Suggest ways to balance data, stories, and visuals.`,
            `Recommend prompts for generating strong supporting examples.`,
            `Propose methods to remove irrelevant content without losing impact.`,
            `Suggest ways to make complex content simple without oversimplifying.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'identify-key-messages',
        title: 'Identify Key Messages',
        purpose: `Distil the essential takeaways your audience should remember.`,
        prompts: [
            `Generate 3-5 concise key messages from our project.`,
            `Recommend ways to make each message memorable and actionable.`,
            `Suggest visuals or metaphors for each message.`,
            `Propose ways to reinforce messages throughout a presentation.`,
            `Suggest how to adapt messages for different communication formats.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'support-with-data-and-stories',
        title: 'Support with Data and Stories',
        purpose: `Strengthen your key messages with evidence and examples.`,
        prompts: [
            `For each message, suggest one compelling data point to prove it.`,
            `For each message, suggest a short story or example to make it relatable and memorable.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'humanize-data',
        title: 'Humanize Data',
        purpose: `Bridge numbers and narratives with AI support.`,
        prompts: [
            `Given our dataset [insert], generate short user stories that illustrate key insights.`,
            `Suggest compelling ways to pair a statistic with an anecdote or quote.`,
            `Propose metaphors or analogies to make data easier to understand.`,
            `Identify emotional triggers in the data that can make the message more memorable.`,
            `Recommend a structure for blending qualitative and quantitative findings.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'visualize-data',
        title: 'Visualize Data',
        purpose: `Use AI to explore, refine, and inspire your visual storytelling.`,
        prompts: [
            `Given our dataset [insert], suggest 3-5 chart or graph types that best match the insight.`,
            `Propose alternative layouts that make trends or comparisons clearer.`,
            `Generate example captions or titles that emphasise the story in the data.`,
            `Recommend colour schemes and visual cues to improve accessibility.`,
            `Suggest ways to combine multiple visuals into a coherent narrative.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'find-story-in-data',
        title: 'Find Story in Data',
        purpose: `Turn analysis into a clear narrative that resonates.`,
        prompts: [
            `Given our data [insert], identify the most surprising or important insight.`,
            `Suggest ways to frame that insight as a story with a beginning, middle, and end.`,
            `Recommend charts or visuals to make the insight instantly clear.`,
            `Propose metaphors or analogies to humanise the data.`,
            `Suggest questions to provoke audience curiosity before revealing the key point.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'structure-the-story',
        title: 'Structure the Story',
        purpose: `Organise the narrative for clarity, flow, and impact.`,
        prompts: [
            `Given our content [insert], suggest 3 possible story arcs.`,
            `Recommend structures suited for persuasion vs. inspiration.`,
            `Propose hooks to open the story powerfully.`,
            `Suggest pacing strategies to keep attention high.`,
            `Recommend ways to close with impact and a clear call to action.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'create-a-storyboard',
        title: 'Create a Storyboard',
        purpose: `Map your narrative visually before building slides.`,
        prompts: [
            `Create a 6-8 frame storyboard for our presentation or pitch.`,
            `Suggest key visuals or scenes for each frame.`,
            `Recommend ways to balance text and imagery.`,
            `Propose methods to test the storyboard flow with a small group.`,
            `Suggest how to adapt the storyboard for slides, video, or live delivery.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'begin-strong',
        title: 'Begin Strong',
        purpose: `Design a powerful opening.`,
        prompts: [
            `Propose opening questions that spark curiosity.`,
            `Suggest 5 attention-grabbing openers for our topic [insert].`,
            `Rewrite our first sentence to be more engaging.`,
            `Generate examples of metaphor or imagery to set the tone.`,
            `Suggest culturally inclusive ways to start for a global audience.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'make-meaning-in-the-middle',
        title: 'Make Meaning in the Middle',
        purpose: `Structure your story flow with AI.`,
        prompts: [
            `Outline 3-4 key points in logical order for our story [insert].`,
            `Suggest analogies or examples to make each point relatable.`,
            `Propose ways to integrate data into each section without overwhelming.`,
            `Generate bridging sentences that smoothly connect sections.`,
            `Recommend emotional beats to keep energy and interest high.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'end-to-make-it-stick',
        title: 'End to Make It Stick',
        purpose: `Craft a memorable close with AI.`,
        prompts: [
            `Suggest 5 powerful closing statements for our message [insert].`,
            `Propose short calls to action that motivate follow-through.`,
            `Generate metaphor or imagery to make the conclusion vivid.`,
            `Rewrite our closing paragraph to emphasise impact.`,
            `Suggest ways to tie back to the opening for a satisfying full circle.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'write-crisp-titles',
        title: 'Write Crisp Titles',
        purpose: `Write clear, action-oriented titles that sharpen the message.`,
        prompts: [
            `Rewrite our section or slide titles to be more engaging and action-oriented.`,
            `Suggest 5 alternative headlines for each key message.`,
            `Recommend titles that work across presentation, report, and digital formats.`,
            `Propose ways to use questions as titles to spark curiosity.`,
            `Suggest methods to test which titles resonate most.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'write-a-recommendation',
        title: 'Write a Recommendation',
        purpose: `Deliver concise, actionable proposals for decision-makers.`,
        prompts: [
            `Given our findings [insert], draft a one-paragraph executive recommendation.`,
            `Suggest ways to prioritise recommendations based on impact and urgency.`,
            `Recommend a format that highlights both benefits and risks.`,
            `Propose clear next steps for each recommendation.`,
            `Suggest how to adapt recommendations for different executive personas.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'use-voice-and-tone',
        title: 'Use Voice and Tone',
        purpose: `Use delivery choices to keep attention and convey confidence.`,
        prompts: [
            `Suggest voice techniques (pace, pauses, emphasis) for our script [insert].`,
            `Rewrite our message in 3 tone variations (inspiring, formal, conversational).`,
            `Propose ways to use tone to highlight calls to action.`,
            `Identify filler words or weak phrasing and replace them with stronger alternatives.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'use-body-language',
        title: 'Use Body Language',
        purpose: `Reinforce your message with confident, open body language.`,
        prompts: [
            `Suggest 5 gestures to match the main points of our presentation [insert].`,
            `Recommend adjustments for body language in virtual vs. in-person settings.`,
            `Propose ways to align facial expressions with message tone.`,
            `Generate feedback prompts to practice posture and stance.`,
            `Suggest grounding techniques to reduce nervous movements.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'design-presentation-slides',
        title: 'Design Presentation Slides',
        purpose: `Design slides that support the story without overwhelming it.`,
        prompts: [
            `Redesign our slide deck [insert outline] into 10 clear, minimal slides.`,
            `Suggest 3 alternative visual formats for the same content.`,
            `Generate strong slide titles that reinforce the story.`,
            `Recommend colour palettes and font pairings for clarity.`,
            `Propose ways to reduce text-heavy slides into visuals or diagrams.`
        ]
    },
    {
        stage: 'tell-story',
        id: 'rehearse-and-refine',
        title: 'Rehearse and Refine',
        purpose: `Strengthen delivery through practice, feedback, and iteration.`,
        prompts: [
            `Given our presentation [insert text or slides], suggest a timed run-through plan.`,
            `Identify likely sections where audience attention may drop and propose fixes.`,
            `Generate feedback prompts for a colleague or test audience to use.`,
            `Suggest alternative wordings for sentences that may be unclear or awkward.`,
            `Recommend pacing adjustments to ensure energy flows throughout.`
        ]
    }
];

export const METHOD_LIBRARY: MethodCard[] = [
    ...EXPLORE_METHOD_DEFINITIONS,
    ...IMAGINE_METHOD_DEFINITIONS,
    ...IMPLEMENT_METHOD_DEFINITIONS,
    ...TELL_STORY_METHOD_DEFINITIONS
].map(createMethodCard);
