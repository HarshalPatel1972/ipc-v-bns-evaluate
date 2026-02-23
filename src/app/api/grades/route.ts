import { NextResponse } from 'next/server';
import { createClient } from '@vercel/kv';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const LOCAL_GRADES_FILE = path.join(process.cwd(), 'grades_data.json');

// Manual client to support the 'STORAGE' prefix from your screenshot
const kv = createClient({
  url: process.env.STORAGE_REST_API_URL || process.env.KV_REST_API_URL || '',
  token: process.env.STORAGE_REST_API_TOKEN || process.env.KV_REST_API_TOKEN || '',
});

// Redepoy to pick up new KV environment variables
// Helper to check if we are on Vercel or Local
const isVercel = process.env.VERCEL === '1';

async function getGrades() {
  if (isVercel) {
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
    try {
      await kv.set('bns_eval_grades', data);
      return true;
    } catch (e) {
      console.error('KV Set Error:', e);
      return false;
    }
  } else {
    try {
      await fs.writeFile(LOCAL_GRADES_FILE, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch {
      return false;
    }
  }
}

export async function GET() {
  const json = await getGrades();
  const fallback = { grades: {}, gradedBy: {}, userStats: {} };

  if (!json) return NextResponse.json(fallback);

  // MIGRATION LOGIC: If it's old dev data format (not an object with 'grades'), wrap it
  if (json && !json.grades && Object.keys(json).length > 0) {
    console.log('[GRADES API] Migrating old data format');
    return NextResponse.json({
      grades: json,
      gradedBy: {},
      userStats: {}
    });
  }

  return NextResponse.json(json || fallback);
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const success = await setGrades(data);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to save to storage' }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
