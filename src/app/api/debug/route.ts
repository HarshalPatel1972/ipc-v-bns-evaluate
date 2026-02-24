import { NextResponse } from 'next/server';
import { createClient } from 'redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = process.env.KV_REDIS_URL || process.env.REDIS_URL || process.env.STORAGE_URL || '';
    if (!url) return NextResponse.json({ error: 'No Redis URL found' });

    const client = createClient({ url });
    await client.connect();
    
    //@ts-ignore
    const info = await client.info('memory');
    const keyLen = await client.strLen('bns_eval_data_v2');
    
    await client.disconnect();

    return NextResponse.json({ 
      info,
      keySizeInBytes: keyLen
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
