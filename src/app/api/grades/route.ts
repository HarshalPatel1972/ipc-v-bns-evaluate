import { NextResponse } from 'next/server';
import { createClient } from 'redis';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
const LOCAL_FILE = path.join(process.cwd(), 'grades_data.json');
const isProd = process.env.NODE_ENV === 'production';

// Global Redis Client
let redisClient: ReturnType<typeof createClient> | null = null;

async function getClient() {
  if (redisClient) return redisClient;
  
  // Try to find the URL in common variable names, prioritizing KV_REDIS_URL
  const url = process.env.KV_REDIS_URL || process.env.REDIS_URL || process.env.STORAGE_URL || '';
  
  const client = createClient({ url });
  client.on('error', (err: Error) => console.error('Redis Client Error', err));
  await client.connect();
  redisClient = client;
  return redisClient;
}

export async function GET() {
  try {
    let data: unknown = null;
    
    if (isProd) {
      const client = await getClient();
      const raw = await client.get('bns_eval_data_v2');
      data = raw ? JSON.parse(raw) : null;
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

    // Migration logic
    const dataObj = data as Record<string, unknown>;
    if (dataObj && !dataObj.grades && Object.keys(dataObj).length > 0) {
      return NextResponse.json({ grades: data, gradedBy: {}, userStats: {} });
    }

    return NextResponse.json(data || fallback);
  } catch (err: unknown) {
    const error = err as Error;
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'GET Failed', details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body) return NextResponse.json({ error: 'Empty body' }, { status: 400 });

    if (isProd) {
      const client = await getClient();
      await client.set('bns_eval_data_v2', JSON.stringify(body));
    } else {
      await fs.writeFile(LOCAL_FILE, JSON.stringify(body, null, 2));
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('POST Error:', error);
    return NextResponse.json({ 
      error: 'POST Failed', 
      message: error.message,
      url_present: !!(process.env.KV_REDIS_URL || process.env.REDIS_URL || process.env.STORAGE_URL)
    }, { status: 500 });
  }
}
