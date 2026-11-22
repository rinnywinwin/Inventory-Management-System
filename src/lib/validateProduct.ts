export function validateProduct(body: unknown, creating: boolean) {
  if (!body || typeof body !== 'object') throw new Error('Provide product details.');
  const value = body as Record<string, unknown>;
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 200) throw new Error('Product name is required (max 200 characters).');
  if (typeof value.price !== 'number' || !Number.isFinite(value.price) || value.price < 0 || value.price > 99999999.99) throw new Error('Enter a valid nonnegative price.');
  if (typeof value.category !== 'string' || value.category.length > 200) throw new Error('Category must be text (max 200 characters).');
  if (creating && (!Number.isInteger(value.quantity) || Number(value.quantity) < 0 || Number(value.quantity) > 2147483647)) throw new Error('Quantity must be a nonnegative whole number.');
  if (!creating && 'quantity' in value) throw new Error('Use stock in / out to change quantity.');
  if (value.image_url != null) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (typeof value.image_url !== 'string' || !base || !value.image_url.startsWith(`${base.replace(/\/$/, '')}/storage/v1/object/public/product-images/`)) throw new Error('Choose an image uploaded to product storage.');
  }
  return { name: value.name.trim(), price: value.price, category: value.category.trim(),
    ...(creating ? { quantity: value.quantity } : {}),
    ...('image_url' in value ? { image_url: value.image_url ?? null } : {}) };
}
