import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Try to import Vercel KV, but fallback gracefully if not installed or configured
let kv: any = null;
try {
  const { kv: vercelKv } = require('@vercel/kv');
  kv = vercelKv;
} catch (e) {
  console.log('Vercel KV not available, falling back to local filesystem');
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Shared key for KV
const KV_KEY = 'bns_eval_grades_global';
// Local fallback path - outside of src to avoid reload loops
const LOCAL_FILE = path.join(process.cwd(), '.next', 'grades_persistence.json');

async function getGrades() {
  // 1. Try Vercel KV (Best for Production/Vercel)
  if (kv && process.env.KV_REST_API_URL) {
    try {
      const data = await kv.get(KV_KEY);
      if (data) return data;
    } catch (e) {
      console.error('KV Read Error:', e);
    }
  }

  // 2. Try Local Filesystem (Best for Local Dev)
  try {
    const data = await fs.readFile(LOCAL_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

async function saveGrades(grades: any) {
  // 1. Try Vercel KV
  let kvSuccess = false;
  if (kv && process.env.KV_REST_API_URL) {
    try {
      await kv.set(KV_KEY, grades);
      kvSuccess = true;
    } catch (e) {
      console.error('KV Write Error:', e);
    }
  }

  // 2. Always write to local as well if possible (or as fallback)
  try {
    const dir = path.dirname(LOCAL_FILE);
    if (!(await fs.access(dir).then(() => true).catch(() => false))) {
      await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(LOCAL_FILE, JSON.stringify(grades, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Local Write Error:', e);
    return kvSuccess;
  }
}

export async function GET() {
  const data = await getGrades();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const grades = await request.json();
    const success = await saveGrades(grades);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Storage failed on all layers' }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
