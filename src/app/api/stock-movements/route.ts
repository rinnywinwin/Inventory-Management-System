import { supabase } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('product_id');
  let query = supabase.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(100);
  if (productId) query = query.eq('product_id', productId);
  const { data, error } = await query;
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (!body || typeof body.product_id !== 'string' || !['in', 'out'].includes(body.movement_type) ||
    !Number.isSafeInteger(body.quantity) || body.quantity <= 0 || body.quantity > 2147483647 ||
    (body.notes != null && (typeof body.notes !== 'string' || body.notes.length > 1000))) {
    return NextResponse.json({ error: 'Provide a product, stock in/out, positive whole quantity, and notes up to 1000 characters.' }, { status: 400 });
  }
  const { data, error } = await supabase.rpc('record_stock_movement', {
    p_product_id: body.product_id, p_movement_type: body.movement_type, p_quantity: body.quantity, p_notes: body.notes || null,
  });
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json(data, { status: 201 });
}
