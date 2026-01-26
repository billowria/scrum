import OpenAI from 'openai';

const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const openai = new OpenAI({
    apiKey: OPENROUTER_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    dangerouslyAllowBrowser: true,
    defaultHeaders: {
        'HTTP-Referer': 'https://squadsync.vercel.app',
        'X-Title': 'Sync Intelligence - Task AI',
    },
});

/**
 * EXPERT USER STORY GENERATION SERVICE
 * 
 * This AI is a seasoned Product Manager and Agile Coach with 10+ years of experience
 * writing user stories for Fortune 500 companies. It understands:
 * - User-centric thinking (who, what, why)
 * - Acceptance criteria that are testable and specific
 * - Technical feasibility and edge cases
 * - Business value and impact
 */
export const generateTaskContent = async (taskData) => {
    console.log('📝 Task AI Service called with:', taskData);

    if (!OPENROUTER_KEY) {
        console.error('❌ Missing API Key');
        return { error: "Missing API Key" };
    }

    const { existingTitle, existingDescription, existingType, additionalInfo, textLength } = taskData;

    const lengthGuide = {
        small: 'Concise and focused. 2-3 sentences maximum. Direct and actionable.',
        medium: 'Balanced structure with user story format and 3-5 specific acceptance criteria.',
        large: 'Comprehensive documentation including user story, detailed acceptance criteria (5-8 items), technical notes, and edge cases.'
    };

    const expertSystemPrompt = `You are an EXPERT Product Manager and Agile Coach with deep expertise in:
- Writing crystal-clear user stories that drive development
- Understanding user needs and translating them into actionable requirements
- Creating testable, specific acceptance criteria
- Identifying edge cases and technical considerations
- Balancing business value with technical feasibility

YOUR MISSION: Transform rough task ideas into professional, actionable user stories that engineering teams love.

OUTPUT FORMAT (STRICT JSON):
{
  "title": "Action-oriented title (verb + object)",
  "description": "Professional markdown-formatted user story"
}

MARKDOWN BEST PRACTICES:
- **Bold** for key terms and emphasis
- Bullet points (- ) for lists
- Checkboxes (- [ ] ) for acceptance criteria (ALWAYS testable)
- ### for section headers
- > for important callouts
- \`code\` for technical terms

USER STORY STRUCTURE:

**For Features/Stories:**
### User Story
**As a** [specific user role],
**I want to** [clear action/capability],
**So that** [tangible benefit/value].

### Acceptance Criteria
- [ ] [Specific, testable criterion with clear pass/fail]
- [ ] [Include edge cases where relevant]
- [ ] [Cover both happy path and error scenarios]

### Technical Notes (if complex)
- Key implementation considerations
- Dependencies or integrations
- Performance requirements

**For Bugs:**
### Problem
Clear description of the issue and its impact.

### Steps to Reproduce
1. Specific step
2. Another step
3. Expected vs actual result

### Acceptance Criteria
- [ ] Bug is fixed and verified
- [ ] No regression in related functionality
- [ ] Edge cases tested

**For Tasks/Improvements:**
### Objective
What needs to be accomplished and why it matters.

### Deliverables
- [ ] Specific, measurable outcome
- [ ] Quality criteria
- [ ] Documentation/testing requirements

EXPERT GUIDELINES:
1. **Title**: Start with strong action verb (Implement, Fix, Design, Create, Add, Refactor, Optimize). Max 60 chars.
2. **User-Centric**: Always think "who benefits and how?"
3. **Testable**: Every acceptance criterion must be verifiable
4. **Specific**: Avoid vague terms like "better" or "improved" - use metrics
5. **Context-Aware**: Preserve valuable existing content, enhance clarity
6. **Professional**: Write as if presenting to stakeholders

QUALITY CHECKLIST:
✓ Title is action-oriented and clear
✓ User story follows "As a... I want... So that..." format
✓ Acceptance criteria are specific and testable
✓ Edge cases are considered
✓ Technical feasibility is addressed
✓ Business value is clear`;

    const userPrompt = `TASK TO ENHANCE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Type: ${existingType || 'Task'}
📝 Current Title: "${existingTitle || 'Untitled'}"
📄 Current Description: "${existingDescription || 'No description provided'}"
${additionalInfo ? `\n💡 Additional Context: "${additionalInfo}"` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DETAIL LEVEL: ${textLength.toUpperCase()}
${lengthGuide[textLength] || lengthGuide.medium}

As an expert Product Manager, analyze this task and generate a professional, actionable user story that:
1. Clearly articulates the user need and business value
2. Provides specific, testable acceptance criteria
3. Considers edge cases and technical implications
4. Is ready for engineering teams to implement

Generate the enhanced version now.`;

    try {
        console.log('🤖 Calling OpenRouter API with expert prompting...');

        const response = await openai.chat.completions.create({
            model: 'google/gemini-2.0-flash-001',
            messages: [
                { role: 'system', content: expertSystemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.6, // Slightly higher for more creative, natural language
            response_format: { type: "json_object" }
        });

        console.log('✅ API Response received');
        const content = response.choices[0].message.content;

        try {
            const parsed = JSON.parse(content);
            console.log('✨ Successfully parsed JSON:', parsed);

            // Validate the response has required fields
            if (!parsed.title || !parsed.description) {
                console.error('❌ Invalid response structure:', parsed);
                return { error: "AI generated invalid response format" };
            }

            return { data: parsed };
        } catch (e) {
            console.warn('⚠️ JSON parse failed, trying fallback...');
            const jsonMatch = content.match(/```json\n?([\s\S]*?)```/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[1]);
                console.log('✨ Fallback parse successful:', parsed);
                return { data: parsed };
            }
            console.error('❌ Failed to parse AI response');
            return { error: "Failed to parse AI response" };
        }

    } catch (error) {
        console.error('❌ AI Task Gen Error:', error);
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            type: error.constructor.name
        });

        // Return more specific error messages
        if (error.status === 401) {
            return { error: "API Key Invalid - Please check your configuration" };
        } else if (error.status === 429) {
            return { error: "Rate limit exceeded - Please try again in a moment" };
        } else if (error.status === 500) {
            return { error: "AI service temporarily unavailable" };
        } else if (!navigator.onLine) {
            return { error: "No internet connection" };
        }

        return { error: error.message || "AI Service Unavailable" };
    }
};
