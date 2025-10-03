import { NextRequest } from 'next/server';

export const runtime = 'edge';

const PIPER_BASE_URL = process.env.PIPER_BASE_URL || 'http://localhost:5000';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Piper TTSサーバーにリクエスト
    const response = await fetch(`${PIPER_BASE_URL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        output_file: '-', // stdout
      }),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Piper TTS error: ${response.statusText}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 音声データをストリーミング
    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Piper TTS API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
