import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const lastVisitByIp = new Map();

const filePath = path.join(process.cwd(), 'visits.json');

export async function GET() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const count = JSON.parse(data).count || 0;
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

export async function POST(request /** @type {NextRequest} */) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = (forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')) || 'unknown';

  const now = Date.now();
  const last = lastVisitByIp.get(ip);
  if (last && now - last < 10 * 60 * 1000) {
    const data = fs.readFileSync(filePath, 'utf8');
    const count = JSON.parse(data).count || 0;
    return NextResponse.json({ count, blocked: true });
  }
  lastVisitByIp.set(ip, now);

  let count = 0;
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    count = JSON.parse(data).count || 0;
  } catch {}

  count += 1;
  fs.writeFileSync(filePath, JSON.stringify({ count }), 'utf8');

  return NextResponse.json({ count });
}
