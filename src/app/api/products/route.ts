// src/app/api/products/route.ts
import { supabase } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';
import { validateProduct } from '@/lib/validateProduct';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  let product;
  try { product = validateProduct(await req.json(), true); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid product' }, { status: 400 }); }
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ? data[0] : null);
}
