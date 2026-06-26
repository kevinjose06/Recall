import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { description } = await request.json();
    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY is not configured on the server. Please add it to your .env.local file.' 
      }, { status: 500 });
    }

    // Call Gemini API using native fetch with automatic fallbacks
    // Prioritizing gemini-2.5-flash for stability and lower traffic
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-3.5-flash'
    ];

    let response;
    let lastErrorText = '';
    
    for (const model of modelsToTry) {
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `You are an expert event coordinator and questionnaire designer. Based on the following event description, suggest a list of relevant feedback or registration questions for the event.

Event Description:
${description}

Generate between 3 to 7 highly relevant questions. For each question, decide the best question type from these allowed options:
- "single_choice": Choose one option (requires at least 2 options)
- "mcq": Multiple choice checkbox (requires at least 2 options)
- "short_text": Free text input (options must be null or empty)
- "star_rating": Rating out of 5 stars (options must be null or empty)

Make sure you output a JSON object adhering to this schema:
{
  "questions": [
    {
      "question_text": "string (the actual question)",
      "question_type": "single_choice" | "mcq" | "short_text" | "star_rating",
      "options": ["option1", "option2"] or null/empty for short_text/star_rating,
      "is_required": boolean
    }
  ]
}`
                    }
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: 'OBJECT',
                  properties: {
                    questions: {
                      type: 'ARRAY',
                      items: {
                        type: 'OBJECT',
                        properties: {
                          question_text: { type: 'STRING' },
                          question_type: {
                            type: 'STRING',
                            enum: ['single_choice', 'mcq', 'short_text', 'star_rating']
                          },
                          options: {
                            type: 'ARRAY',
                            items: { type: 'STRING' }
                          },
                          is_required: { type: 'BOOLEAN' }
                        },
                        required: ['question_text', 'question_type', 'is_required']
                      }
                    }
                  },
                  required: ['questions']
                }
              }
            })
          }
        );

        if (response.ok) {
          break; // Success! Exit the fallback loop.
        }
        
        lastErrorText = await response.text();
        console.warn(`Model ${model} failed:`, lastErrorText);
        
        // If it's not a 503 or 429 (rate limit/overloaded), break and don't retry others
        if (response.status !== 503 && response.status !== 429) {
          break;
        }
      } catch (err: any) {
        console.warn(`Fetch error for ${model}:`, err.message);
        lastErrorText = err.message;
      }
    }

    if (!response || !response.ok) {
      console.error('All Gemini fallback models failed. Last error:', lastErrorText);
      return NextResponse.json({ error: `Gemini Error: ${lastErrorText}` }, { status: 502 });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      return NextResponse.json({ error: 'No content returned from Gemini' }, { status: 500 });
    }

    const result = JSON.parse(generatedText);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating questions:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
