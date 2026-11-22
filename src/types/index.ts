// src/types/index.ts
export type Product = {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image_url?: string | null;
  created_at?: string;
};

export type StockMovement = {
  id: string;
  product_id: string | null;
  product_name: string;
  movement_type: 'in' | 'out';
  quantity: number;
  balance_after: number;
  notes: string | null;
  created_at: string;
};
