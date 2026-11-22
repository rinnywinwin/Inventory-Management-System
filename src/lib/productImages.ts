import { supabase } from './supabaseClient';

export async function uploadProductImage(file: File): Promise<string> {
  const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  if (!extensions[file.type]) throw new Error('Choose a JPEG, PNG, or WebP image.');
  if (!file.size || file.size > 5 * 1024 * 1024) throw new Error('Images must be between 1 byte and 5 MB.');
  const path = `${crypto.randomUUID()}.${extensions[file.type]}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}
