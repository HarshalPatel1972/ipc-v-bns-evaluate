import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GRADES_FILE = path.join(process.cwd(), 'grades_data.json');

export async function GET() {
  try {
    const rawData = await fs.readFile(GRADES_FILE, 'utf8');
    const json = JSON.parse(rawData);
    
    // MIGRATION LOGIC: If it's old dev data, wrap it
    if (json && !json.grades && Object.keys(json).length > 0) {
      console.log('[GRADES API] Migrating old data format');
      return NextResponse.json({
        grades: json,
        gradedBy: {},
        userStats: {}
      });
    }

    return NextResponse.json(json || { grades: {}, gradedBy: {}, userStats: {} });
  } catch {
    return NextResponse.json({ grades: {}, gradedBy: {}, userStats: {} });
  }
}

export async function POST(request: Request) {
  try {
    const grades = await request.json();
    await fs.writeFile(GRADES_FILE, JSON.stringify(grades, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
