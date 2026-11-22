// src/components/ProductList.tsx
"use client";

import { useState } from 'react';
import { Product } from '@/types';
import EditProductModal from './EditProductModal';
import StockMovementModal from './StockMovementModal';
import { productsCsv } from '@/lib/csv';

// Icons for actions
const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>);
const DeleteIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>);

type ProductListProps = { products: Product[]; onProductChange: () => void };

export default function ProductList({ products, onProductChange }: ProductListProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const categories = Array.from(new Set(products.map(p => p.category || '').filter(Boolean))).sort();
  const filtered = products.filter(p => (!category || p.category === category) && (p.name + ' ' + (p.category || '')).toLowerCase().includes(search.trim().toLowerCase()));
  function exportCsv() {
    const url = URL.createObjectURL(new Blob([productsCsv(filtered)], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'inventory-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete product');
      onProductChange();
    } catch (error) {
      console.error(error); alert('Error deleting product.');
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return <span className="px-2 py-1 text-xs font-semibold text-red-200 bg-red-800/80 rounded-full">Out of Stock</span>;
    if (quantity < 10) return <span className="px-2 py-1 text-xs font-semibold text-yellow-200 bg-yellow-800/80 rounded-full">Low Stock</span>;
    return <span className="px-2 py-1 text-xs font-semibold text-green-200 bg-green-800/80 rounded-full">In Stock</span>;
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Product Inventory</h2>
<div className="flex flex-wrap gap-3 mb-4"><input aria-label="Search products" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-700 p-2 rounded flex-1" /><select aria-label="Filter by category" value={category} onChange={e => setCategory(e.target.value)} className="bg-slate-700 p-2 rounded"><option value="">All categories</option>{Array.from(new Set([...categories, ...(category ? [category] : [])])).map(c => <option key={c} value={c}>{c}</option>)}</select><button onClick={exportCsv} disabled={!filtered.length} className="bg-sky-600 px-4 py-2 rounded disabled:opacity-50">Export CSV</button></div><p className="text-sm text-slate-400 mb-3">Showing {filtered.length} of {products.length} products</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/50">
              <tr className="border-b-2 border-slate-700">
                <th className="px-4 py-3 text-left font-medium text-slate-400 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400 uppercase tracking-wider">Price (RM)</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.length > 0 ? filtered.map((product) => (
                <tr key={product.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-white">{product.image_url && <img src={product.image_url} alt={product.name} className="inline-block w-12 h-12 object-cover rounded mr-3" />}{product.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-300">{product.category || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-300">{new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(product.price)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-300">{product.quantity}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{getStockStatus(product.quantity)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-3"><button onClick={() => setStockProduct(product)} className="text-green-300">Stock in / out</button>
                      <button aria-label={`Edit ${product.name}`} onClick={() => setEditingProduct(product)} className="text-blue-400 hover:text-blue-300 transition-colors"><EditIcon /></button>
                      <button aria-label={`Delete ${product.name}`} onClick={() => handleDelete(product.id!)} className="text-red-400 hover:text-red-300 transition-colors"><DeleteIcon /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">No products match. Add a product or change your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {stockProduct && <StockMovementModal product={stockProduct} onClose={() => setStockProduct(null)} onSaved={() => { setStockProduct(null); onProductChange(); }} />}
      {editingProduct && (
        <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onProductUpdated={() => { setEditingProduct(null); onProductChange(); }} />
      )}
    </div>
  );
}