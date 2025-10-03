import { NextRequest } from 'next/server';

export const runtime = 'edge';

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'http://localhost:1234/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'google/gemma-3n-e4b';
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || 'You are a helpful assistant.';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `LM Studio API error: ${response.statusText}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
