import { NextRequest } from 'next/server';

const VOICEVOX_BASE_URL = process.env.VOICEVOX_BASE_URL || 'http://localhost:50021';
const VOICEVOX_SPEAKER_ID = process.env.VOICEVOX_SPEAKER_ID || '1'; // デフォルト: 四国めたん(ノーマル)

export async function POST(req: NextRequest) {
  try {
    const { text, speaker } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const speakerId = speaker || VOICEVOX_SPEAKER_ID;

    // 1. 音声合成用のクエリを生成
    const queryResponse = await fetch(
      `${VOICEVOX_BASE_URL}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
      { method: 'POST' }
    );

    if (!queryResponse.ok) {
      return new Response(
        JSON.stringify({ error: `VOICEVOX query error: ${queryResponse.statusText}` }),
        { status: queryResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const query = await queryResponse.json();

    // 2. 音声を合成
    const synthesisResponse = await fetch(
      `${VOICEVOX_BASE_URL}/synthesis?speaker=${speakerId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      }
    );

    if (!synthesisResponse.ok) {
      return new Response(
        JSON.stringify({ error: `VOICEVOX synthesis error: ${synthesisResponse.statusText}` }),
        { status: synthesisResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 音声データをストリーミング
    return new Response(synthesisResponse.body, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('VOICEVOX API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
