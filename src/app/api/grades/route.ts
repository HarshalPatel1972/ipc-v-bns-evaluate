import { NextResponse } from 'next/server';
import { createClient } from '@vercel/kv';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const LOCAL_GRADES_FILE = path.join(process.cwd(), 'grades_data.json');

// Manual client to support various prefixes found in Vercel Marketplace
const kvUrl = process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL || process.env.REDIS_REST_API_URL || '';
const kvToken = process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN || process.env.REDIS_REST_API_TOKEN || '';

const kv = createClient({
  url: kvUrl,
  token: kvToken,
});

// Helper to check if we are on Vercel or Local
const isVercel = process.env.VERCEL === '1';

async function getGrades() {
  if (isVercel) {
    if (!kvUrl || !kvToken) {
      console.error('KV Environment variables missing');
      return null;
    }
    try {
      return await kv.get('bns_eval_grades');
    } catch (e) {
      console.error('KV Get Error:', e);
      return null;
    }
  } else {
    try {
      const data = await fs.readFile(LOCAL_GRADES_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}

async function setGrades(data: any) {
  if (isVercel) {
    if (!kvUrl || !kvToken) throw new Error('KV_REST_API_URL or TOKEN is missing in Vercel environment variables');
    await kv.set('bns_eval_grades', data);
    return true;
  } else {
    try {
      await fs.writeFile(LOCAL_GRADES_FILE, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (e) {
      throw e;
    }
  }
}

export async function GET() {
  try {
    const json = await getGrades();
    const fallback = { grades: {}, gradedBy: {}, userStats: {} };

    if (!json) return NextResponse.json(fallback);

    // Parse if it's a string (sometimes KV returns stringified JSON)
    let parsedData = json;
    if (typeof json === 'string') {
      try {
        parsedData = JSON.parse(json);
      } catch (e) {
        // Not JSON, return fallback
        return NextResponse.json(fallback);
      }
    }

    // MIGRATION LOGIC
    if (parsedData && !parsedData.grades && Object.keys(parsedData).length > 0) {
      return NextResponse.json({
        grades: parsedData,
        gradedBy: {},
        userStats: {}
      });
    }

    return NextResponse.json(parsedData || fallback);
  } catch (err) {
    return NextResponse.json({ grades: {}, gradedBy: {}, userStats: {} });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data) return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    
    await setGrades(data);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('POST Error:', err);
    return NextResponse.json({ 
      error: 'Server Error', 
      details: err.message,
      vars_present: {
        url: !!kvUrl,
        token: !!kvToken
      }
    }, { status: 500 });
  }
}
