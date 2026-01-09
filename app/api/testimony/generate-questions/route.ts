import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { chatCompletion, estimateTokens } from '@/lib/case-dev/api';
import { DEMO_LIMITS } from '@/lib/demo-limits/config';
import type { CrossExamQuestion } from '@/lib/types/testimony';

// Dynamic system prompt that includes the actual witness name
function getQuestionGenerationPrompt(witnessName: string): string {
  return `You are an experienced trial attorney preparing cross-examination questions for ${witnessName}. Based on the provided case documents, generate exactly 20 likely cross-examination questions that opposing counsel might ask ${witnessName}.

═══════════════════════════════════════════════════════════════════════════════
WITNESS IDENTITY - READ THIS CAREFULLY:
═══════════════════════════════════════════════════════════════════════════════
THE WITNESS YOU ARE PREPARING QUESTIONS FOR IS: ${witnessName}

⚠️ CRITICAL WARNING ABOUT DOCUMENTS:
The documents you will analyze may contain depositions, testimony, or statements from OTHER people who are NOT ${witnessName}. These are EVIDENCE documents about the case.
DO NOT get confused by names that appear in depositions or testimony within the documents.
The ONLY witness you are preparing questions for is ${witnessName}.

When you see testimony or depositions from other people in the documents:
- These are EVIDENCE that ${witnessName} may be asked about
- Prepare questions asking ${witnessName} what THEY know about what those other people said
- NEVER prepare questions directed at those other people - they are not the witness
═══════════════════════════════════════════════════════════════════════════════

STRUCTURE YOUR 20 QUESTIONS AS FOLLOWS:
- 15 questions: DOCUMENT-SPECIFIC - Reference specific facts, names, dates from the documents.
- 5 questions: GENERAL CROSS-EXAMINATION - Standard questions testing credibility, memory, bias.

For each question, provide:
1. The question itself - directed to ${witnessName} using "you" and "your"
2. Category: one of "timeline", "credibility", "inconsistency", "foundation", "impeachment", or "general"
3. Difficulty: "easy", "medium", or "hard"
4. A suggested approach for how ${witnessName} should handle this question
5. Any weak points this question might expose
6. 2-3 potential follow-up questions
7. A reference to which document this relates to

Return your response as a JSON array with exactly 20 questions in this format:
[
  {
    "question": "Question directed to ${witnessName}...",
    "category": "timeline|credibility|inconsistency|foundation|impeachment|general",
    "difficulty": "easy|medium|hard",
    "suggestedApproach": "How ${witnessName} should approach answering",
    "weakPoint": "What vulnerability this exposes",
    "followUpQuestions": ["Follow-up 1", "Follow-up 2"],
    "documentReference": "Which document/section this relates to"
  }
]

IMPORTANT: Return ONLY the JSON array. No markdown, no code blocks.`;
}

// Robust JSON parsing with multiple fallback strategies
function parseJSONResponse(content: string): unknown[] | null {
  // Strategy 1: Direct parse
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Continue
  }

  // Strategy 2: Clean and parse
  try {
    let cleaned = content.trim();
    cleaned = cleaned.replace(/^\uFEFF/, '');
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
    cleaned = cleaned.replace(/\n?```\s*$/i, '');
    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Continue
  }

  // Strategy 3: Extract JSON array using regex
  try {
    const arrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Continue
  }

  // Strategy 4: Find first [ and last ]
  try {
    const firstBracket = content.indexOf('[');
    const lastBracket = content.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const jsonStr = content.substring(firstBracket, lastBracket + 1);
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Continue
  }

  return null;
}

// Generate fallback questions
function generateFallbackQuestions(witnessName: string, documents: Array<{ name: string }>): CrossExamQuestion[] {
  const docNames = documents.map(d => d.name).join(', ') || 'the documents';

  return [
    {
      id: uuidv4(),
      question: `You've reviewed documents related to this case. Can you tell us exactly when you first became aware of the events described?`,
      category: 'timeline',
      difficulty: 'medium',
      suggestedApproach: 'Be specific about dates and times. If uncertain, say so.',
      weakPoint: 'Timeline inconsistencies',
      followUpQuestions: ['What were you doing at that time?', 'Who else was present?'],
      documentReference: docNames,
    },
    {
      id: uuidv4(),
      question: `Looking at the documents you've reviewed, can you identify any statements that you now believe may have been inaccurate?`,
      category: 'credibility',
      difficulty: 'hard',
      suggestedApproach: 'If there are inaccuracies, acknowledge them. Honesty builds credibility.',
      weakPoint: 'Prior inconsistent statements',
      followUpQuestions: ['Why didn\'t you correct this earlier?', 'What other statements might need revision?'],
      documentReference: docNames,
    },
    {
      id: uuidv4(),
      question: `You mentioned specific details in your statement. How can you be so certain about these details after all this time?`,
      category: 'credibility',
      difficulty: 'medium',
      suggestedApproach: 'Explain what makes certain memories stand out.',
      weakPoint: 'Memory reliability',
      followUpQuestions: ['Did you take notes at the time?', 'Have you discussed these events with anyone?'],
      documentReference: docNames,
    },
    {
      id: uuidv4(),
      question: `Based on the documents in this case, there appear to be gaps in the timeline. Can you explain what happened during these periods?`,
      category: 'timeline',
      difficulty: 'medium',
      suggestedApproach: 'If you don\'t know, say so. Don\'t speculate.',
      weakPoint: 'Incomplete knowledge',
      followUpQuestions: ['Were you present during this time?', 'Who might have information about this period?'],
      documentReference: docNames,
    },
    {
      id: uuidv4(),
      question: `The documents suggest a particular sequence of events. Do you agree with that sequence, or do you recall it differently?`,
      category: 'inconsistency',
      difficulty: 'hard',
      suggestedApproach: 'If you disagree, explain specifically what you recall differently and why.',
      weakPoint: 'Contradicting documentary evidence',
      followUpQuestions: ['What specifically do you recall differently?', 'Why should your memory be trusted over the documents?'],
      documentReference: docNames,
    },
    {
      id: uuidv4(),
      question: `Were you under any stress or distraction at the time of the events described in these documents?`,
      category: 'foundation',
      difficulty: 'medium',
      suggestedApproach: 'Acknowledge any factors that might have affected your perception.',
      weakPoint: 'Impaired observation',
      followUpQuestions: ['How might that have affected what you observed?', 'Were you taking any medications?'],
      documentReference: docNames,
    },
    {
      id: uuidv4(),
      question: `Can you explain your role in the events documented in the case materials?`,
      category: 'foundation',
      difficulty: 'easy',
      suggestedApproach: 'Clearly explain your involvement and the basis for your knowledge.',
      weakPoint: 'Limited firsthand knowledge',
      followUpQuestions: ['Were you directly involved?', 'How do you have knowledge of what you\'re testifying about?'],
      documentReference: docNames,
    },
    {
      id: uuidv4(),
      question: `The documents reference specific communications. Did you keep copies of all relevant communications?`,
      category: 'foundation',
      difficulty: 'medium',
      suggestedApproach: 'Explain your document retention practices honestly.',
      weakPoint: 'Missing evidence',
      followUpQuestions: ['Why didn\'t you keep copies?', 'What happened to those communications?'],
      documentReference: docNames,
    },
    {
      id: uuidv4(),
      question: `Is there anything in these documents that you believe is false or misleading?`,
      category: 'inconsistency',
      difficulty: 'hard',
      suggestedApproach: 'If you believe something is false, explain specifically what and why.',
      weakPoint: 'Challenging documentary evidence',
      followUpQuestions: ['How do you know it\'s false?', 'Do you have evidence to support your claim?'],
      documentReference: docNames,
    },
    {
      id: uuidv4(),
      question: `Who else was present that could corroborate your account?`,
      category: 'foundation',
      difficulty: 'medium',
      suggestedApproach: 'Identify other witnesses who can support your testimony.',
      weakPoint: 'Lack of corroboration',
      followUpQuestions: ['Have you spoken with them about this case?', 'Would they agree with your version?'],
      documentReference: docNames,
    },
    {
      id: uuidv4(),
      question: `How soon after the events did you first document your recollection?`,
      category: 'timeline',
      difficulty: 'medium',
      suggestedApproach: 'Explain when and how you recorded your memories.',
      weakPoint: 'Delayed documentation affects reliability',
      followUpQuestions: ['Why did you wait?', 'What prompted you to finally document it?'],
      documentReference: docNames,
    },
    {
      id: uuidv4(),
      question: `Have you reviewed these documents with anyone before today's testimony?`,
      category: 'credibility',
      difficulty: 'easy',
      suggestedApproach: 'Be honest about document review. It\'s normal to prepare.',
      weakPoint: 'Potential for coached testimony',
      followUpQuestions: ['Who did you review them with?', 'Did anyone point out specific things you should remember?'],
      documentReference: docNames,
    },
    {
      id: uuidv4(),
      question: `Is there any information relevant to this case that is NOT contained in these documents?`,
      category: 'foundation',
      difficulty: 'hard',
      suggestedApproach: 'Disclose any relevant information not in the documents.',
      weakPoint: 'Incomplete documentary record',
      followUpQuestions: ['Why wasn\'t that documented?', 'Who else knows about this?'],
      documentReference: docNames,
    },
    {
      id: uuidv4(),
      question: `Looking at the specific details in the documents, how do you explain any discrepancies between what's written and what you're testifying to today?`,
      category: 'inconsistency',
      difficulty: 'hard',
      suggestedApproach: 'Address discrepancies directly.',
      weakPoint: 'Documentary contradictions',
      followUpQuestions: ['Which version is correct?', 'Were you truthful then or now?'],
      documentReference: docNames,
    },
    {
      id: uuidv4(),
      question: `Were you consulted before any of the actions described in the documents occurred?`,
      category: 'foundation',
      difficulty: 'medium',
      suggestedApproach: 'Be clear about your level of involvement.',
      weakPoint: 'Limited involvement or knowledge',
      followUpQuestions: ['Did you have any input?', 'Did you express any objections?'],
      documentReference: docNames,
    },
    // General questions (5)
    {
      id: uuidv4(),
      question: `How did you prepare for your testimony today?`,
      category: 'general',
      difficulty: 'easy',
      suggestedApproach: 'Be honest about preparation. It\'s normal to review documents with counsel.',
      weakPoint: 'May suggest coaching',
      followUpQuestions: ['Who did you meet with to prepare?', 'How many times did you meet?'],
      documentReference: 'General Cross-Examination',
    },
    {
      id: uuidv4(),
      question: `Are you being compensated in any way for your testimony, or do you have any financial interest in the outcome?`,
      category: 'general',
      difficulty: 'easy',
      suggestedApproach: 'Answer directly.',
      weakPoint: 'Potential bias',
      followUpQuestions: ['How much are you being paid?', 'Does compensation depend on the outcome?'],
      documentReference: 'General Cross-Examination',
    },
    {
      id: uuidv4(),
      question: `What is your relationship to the parties in this case?`,
      category: 'general',
      difficulty: 'easy',
      suggestedApproach: 'Describe relationships factually without editorializing.',
      weakPoint: 'Potential bias based on relationships',
      followUpQuestions: ['How long have you known them?', 'Have you had any conflicts with them?'],
      documentReference: 'General Cross-Examination',
    },
    {
      id: uuidv4(),
      question: `How would you describe your memory in general? Is there anything about your testimony today that you're not completely certain about?`,
      category: 'general',
      difficulty: 'medium',
      suggestedApproach: 'Be honest about your memory capabilities.',
      weakPoint: 'Self-assessment of reliability',
      followUpQuestions: ['What specifically are you uncertain about?', 'Have you forgotten important details before?'],
      documentReference: 'General Cross-Examination',
    },
    {
      id: uuidv4(),
      question: `Have you ever given testimony that was later found to be inaccurate or that you needed to correct?`,
      category: 'general',
      difficulty: 'hard',
      suggestedApproach: 'Answer honestly. If yes, explain the circumstances.',
      weakPoint: 'Prior credibility issues',
      followUpQuestions: ['What were the circumstances?', 'How did you discover the inaccuracy?'],
      documentReference: 'General Cross-Examination',
    },
  ];
}

function validateCategory(category: string): CrossExamQuestion['category'] {
  const valid = ['timeline', 'credibility', 'inconsistency', 'foundation', 'impeachment', 'general'];
  return valid.includes(category) ? category as CrossExamQuestion['category'] : 'general';
}

function validateDifficulty(difficulty: string): CrossExamQuestion['difficulty'] {
  const valid = ['easy', 'medium', 'hard'];
  return valid.includes(difficulty) ? difficulty as CrossExamQuestion['difficulty'] : 'medium';
}

// POST /api/testimony/generate-questions - Generate cross-exam questions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { witnessName, caseName, documents } = body;

    if (!witnessName || !caseName) {
      return NextResponse.json(
        { error: 'witnessName and caseName are required' },
        { status: 400 }
      );
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'No documents provided. Please upload case materials first.' },
        { status: 400 }
      );
    }

    // Build document context
    const documentContext = documents
      .map((doc: { name: string; content?: string }) => {
        const content = doc.content || '[Content not available]';
        return `=== DOCUMENT: ${doc.name} ===\n${content}\n=== END DOCUMENT ===`;
      })
      .join('\n\n');

    const userPrompt = `Case: ${caseName}
Witness Name: ${witnessName}

DOCUMENTS TO ANALYZE:
${documentContext}

Generate exactly 20 cross-examination questions for the witness ${witnessName}.
Return ONLY a valid JSON array. No markdown formatting.`;

    // Estimate tokens for limit check
    const systemPrompt = getQuestionGenerationPrompt(witnessName);
    const estimatedInputTokens = estimateTokens(systemPrompt + userPrompt);
    const estimatedOutputTokens = 4000; // Estimated for 20 questions

    // Check token limit
    const totalEstimatedTokens = estimatedInputTokens + estimatedOutputTokens;
    if (totalEstimatedTokens > DEMO_LIMITS.tokens.perRequest) {
      // Truncate document content to fit within limits
      const maxDocTokens = DEMO_LIMITS.tokens.perRequest - estimatedOutputTokens - estimateTokens(systemPrompt);
      const truncatedDocs = documents.map((doc: { name: string; content?: string }) => ({
        ...doc,
        content: doc.content ? doc.content.slice(0, maxDocTokens * 4 / documents.length) + '... [truncated for demo]' : doc.content,
      }));

      // Rebuild document context
      const truncatedContext = truncatedDocs
        .map((doc: { name: string; content?: string }) => {
          const content = doc.content || '[Content not available]';
          return `=== DOCUMENT: ${doc.name} ===\n${content}\n=== END DOCUMENT ===`;
        })
        .join('\n\n');

      body.documents = truncatedDocs;
    }

    let questions: CrossExamQuestion[] = [];
    let usedFallback = false;
    let tokensUsed = 0;

    try {
      const response = await chatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          model: 'casemark/casemark-core-1',
          temperature: 0.7,
          max_tokens: Math.min(DEMO_LIMITS.tokens.perRequest, 8000),
        }
      );

      const content = response.choices?.[0]?.message?.content || '';
      tokensUsed = response.usage?.total_tokens || 0;

      if (content) {
        const questionsData = parseJSONResponse(content);

        if (questionsData && questionsData.length > 0) {
          questions = questionsData.slice(0, 20).map((q: unknown) => {
            const qObj = q as Record<string, unknown>;
            return {
              id: uuidv4(),
              question: String(qObj.question || 'Question not available'),
              category: validateCategory(String(qObj.category || 'general')),
              difficulty: validateDifficulty(String(qObj.difficulty || 'medium')),
              suggestedApproach: qObj.suggestedApproach ? String(qObj.suggestedApproach) : undefined,
              weakPoint: qObj.weakPoint ? String(qObj.weakPoint) : undefined,
              followUpQuestions: Array.isArray(qObj.followUpQuestions)
                ? qObj.followUpQuestions.map((f: unknown) => String(f))
                : undefined,
              documentReference: qObj.documentReference ? String(qObj.documentReference) : undefined,
            };
          });
        }
      }
    } catch (apiError) {
      console.error('LLM API error:', apiError instanceof Error ? apiError.message : apiError);
      usedFallback = true;
    }

    // Use fallback if no questions generated
    if (questions.length === 0) {
      questions = generateFallbackQuestions(witnessName, documents);
      usedFallback = true;
    }

    return NextResponse.json({
      questions,
      tokensUsed,
      usedFallback,
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
