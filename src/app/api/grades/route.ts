import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
const LOCAL_FILE = path.join(process.cwd(), 'grades_data.json');

// Check if we're in production (Vercel)
const isProd = process.env.NODE_ENV === 'production';

export async function GET() {
  try {
    let data: any = null;
    
    if (isProd) {
      data = await kv.get('bns_eval_data');
    } else {
      try {
        const raw = await fs.readFile(LOCAL_FILE, 'utf8');
        data = JSON.parse(raw);
      } catch {
        data = null;
      }
    }

    const fallback = { grades: {}, gradedBy: {}, userStats: {} };
    if (!data) return NextResponse.json(fallback);

    // Handle stringified data from KV
    let parsed = data;
    if (typeof data === 'string') {
      try { parsed = JSON.parse(data); } catch { parsed = fallback; }
    }

    // Migration logic
    if (parsed && !parsed.grades && Object.keys(parsed).length > 0) {
      return NextResponse.json({ grades: parsed, gradedBy: {}, userStats: {} });
    }

    return NextResponse.json(parsed || fallback);
  } catch (err: any) {
    return NextResponse.json({ error: 'GET Failed', details: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body) return NextResponse.json({ error: 'Empty body' }, { status: 400 });

    if (isProd) {
      // Use KV
      await kv.set('bns_eval_data', JSON.stringify(body));
    } else {
      // Use Local File
      await fs.writeFile(LOCAL_FILE, JSON.stringify(body, null, 2));
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ 
      error: 'POST Failed', 
      message: err.message,
      env_debug: Object.keys(process.env).filter(k => k.includes('KV') || k.includes('REST') || k.includes('REDIS'))
    }, { status: 500 });
  }
}
