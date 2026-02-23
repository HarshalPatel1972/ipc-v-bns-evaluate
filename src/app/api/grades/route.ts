import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Force Node.js runtime — required for fs access (Turbopack defaults to edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GRADES_FILE = path.join(process.cwd(), 'grades_data.json');

export async function GET() {
  try {
    const data = await fs.readFile(GRADES_FILE, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    // File doesn't exist yet — return empty object
    return NextResponse.json({});
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
