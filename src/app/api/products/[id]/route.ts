// src/app/api/products/[id]/route.ts
import { supabase } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';
import { validateProduct } from '@/lib/validateProduct';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  let product;
  try { product = validateProduct(await req.json(), false); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid product' }, { status: 400 }); }
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data?.length) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json(data[0]);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
}
