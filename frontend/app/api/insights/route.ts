import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Insight, LiftStats, Exposure } from '@/types';

function getOpenAIClient() {
    if (!process.env.OPENAI_API_KEY) return null;
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

export async function POST(request: Request) {
    try {
        const { stats, recentHistory } = await request.json();

        const openai = getOpenAIClient();

        if (!openai) {
            return NextResponse.json(
                { error: 'OpenAI API Key not configured' },
                { status: 500 }
            );
        }

        const prompt = `
      You are an expert powerlifting coach. Analyze the following training data and provide 3 specific, actionable insights.
      
      DATA:
      Lift Stats: ${JSON.stringify(stats)}
      Recent History (Last 5 Sessions): ${JSON.stringify(recentHistory)}

      RULES:
      1. Output MUST be a valid JSON array of objects matching this schema:
         {
           "id": "string (unique)",
           "type": "performance" | "recovery" | "focus",
           "message": "string (max 20 words, direct and actionable)",
           "severity": "info" | "warning" | "alert"
         }
      2. No padding, no markdown formatting (like \`\`\`json), just the raw JSON array.
      3. Focus on:
         - Progression (or lack thereof)
         - RPE trends (fatigue management)
         - Consistency
      4. Be direct. No "Great job". Just facts and prescriptions.
      5. Terminology: Use "Working Sets" (RPE >= 7.5) instead of "Hard Sets". Mention working set volume trends contextually (e.g., "High working set volume on Squat").
    `;

        const completion = await openai.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: 'gpt-4o-mini',
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error('No content received from OpenAI');
        }

        // Clean up potential markdown formatting if the model slips up
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

        const insights: Insight[] = JSON.parse(cleanContent);

        return NextResponse.json({ insights });

    } catch (error: any) {
        const errorDetails = {
            message: error.message || "Unknown error",
            type: error.constructor.name,
            code: error.code || error.status || 500,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            openaiError: error.error || undefined // Capture OpenAI downstream errors
        };

        console.error('❌ [API] /api/insights Failure:', JSON.stringify(errorDetails, null, 2));

        return NextResponse.json(
            {
                error: 'Failed to generate insights',
                debug: errorDetails
            },
            { status: 500 }
        );
    }
}
