import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/case-dev/api';
import { DEMO_LIMITS } from '@/lib/demo-limits/config';

const AI_EXAMINER_PROMPT = `You are an experienced opposing counsel conducting a cross-examination. Your role is to:

1. Evaluate the witness's response to the question
2. Identify any weaknesses, inconsistencies, or areas to probe further based on the case documents
3. Provide a realistic follow-up question that opposing counsel might ask
4. Give constructive feedback on how the witness could improve their response

Be professional but thorough. Look for:
- Vague or evasive answers
- Inconsistencies with documents or prior statements
- Opportunities to impeach credibility
- Gaps in knowledge or memory
- Emotional reactions that could be exploited

Respond in JSON format:
{
  "followUp": "The follow-up question opposing counsel would likely ask",
  "feedback": "Constructive feedback for the witness",
  "weaknessIdentified": "Any weakness in the response that was exposed",
  "suggestedImprovement": "How the witness could have answered better"
}`;

// POST /api/testimony/practice - Submit a practice response and get AI feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      witnessName,
      caseName,
      question,
      questionDetails,
      witnessResponse,
      documents,
    } = body;

    if (!question || !witnessResponse) {
      return NextResponse.json(
        { error: 'question and witnessResponse are required' },
        { status: 400 }
      );
    }

    // Build context with document content (limited for demo)
    const documentContext = (documents || [])
      .map((doc: { name: string; content?: string }) => {
        // Truncate content to fit within demo limits
        const content = doc.content
          ? doc.content.slice(0, 2000) + (doc.content.length > 2000 ? '... [truncated]' : '')
          : '[Content not available]';
        return `=== ${doc.name} ===\n${content}`;
      })
      .join('\n\n');

    const userPrompt = `Case: ${caseName || 'Unknown Case'}
Witness: ${witnessName || 'Unknown Witness'}

CASE DOCUMENTS:
${documentContext || 'No documents provided'}

CROSS-EXAMINATION CONTEXT:
Question Asked: "${question}"
${questionDetails?.suggestedApproach ? `Suggested Approach: ${questionDetails.suggestedApproach}` : ''}
${questionDetails?.weakPoint ? `Known Weak Point: ${questionDetails.weakPoint}` : ''}
${questionDetails?.documentReference ? `Document Reference: ${questionDetails.documentReference}` : ''}

WITNESS RESPONSE: "${witnessResponse}"

Analyze this response in the context of the case documents. Provide a follow-up question and feedback.`;

    let aiResponse = {
      followUp: 'Can you elaborate on that answer?',
      feedback: 'Your response was received. Consider being more specific in your answers.',
      weaknessIdentified: '',
      suggestedImprovement: '',
    };
    let tokensUsed = 0;

    try {
      const response = await chatCompletion(
        [
          { role: 'system', content: AI_EXAMINER_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        {
          model: 'anthropic/claude-3-haiku-20240307', // Faster, cheaper model for practice
          temperature: 0.7,
          max_tokens: Math.min(DEMO_LIMITS.tokens.perRequest, 1000),
        }
      );

      const content = response.choices?.[0]?.message?.content || '';
      tokensUsed = response.usage?.total_tokens || 0;

      if (content) {
        try {
          // Try to extract JSON from the response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiResponse = JSON.parse(jsonMatch[0]);
          } else {
            aiResponse = JSON.parse(content);
          }
        } catch {
          // If parsing fails, use the content as feedback
          aiResponse = {
            followUp: 'Can you elaborate on that answer?',
            feedback: content,
            weaknessIdentified: '',
            suggestedImprovement: '',
          };
        }
      }
    } catch (apiError) {
      console.error('LLM API error:', apiError);
      // Return default response on error
    }

    return NextResponse.json({
      aiResponse,
      tokensUsed,
    });
  } catch (error) {
    console.error('Error processing practice response:', error);
    return NextResponse.json(
      { error: 'Failed to process practice response' },
      { status: 500 }
    );
  }
}
