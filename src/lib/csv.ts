import { Product } from '@/types';

export function productsCsv(products: Product[]): string {
  const cell = (value: unknown) => {
    let text = String(value ?? '');
    if (/^[\s]*[=+\-@\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  return '\uFEFF' + [
    ['ID', 'Name', 'Category', 'Price (RM)', 'Quantity', 'Image URL', 'Created At'],
    ...products.map(p => [p.id, p.name, p.category, p.price, p.quantity, p.image_url, p.created_at]),
  ].map(row => row.map(cell).join(',')).join('\r\n');
}
