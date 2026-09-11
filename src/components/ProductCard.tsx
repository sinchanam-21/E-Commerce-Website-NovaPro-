import React, { useState } from 'react';
import { Star, ShoppingCart, Check, Eye, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onDeleteProduct?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onAddToCart,
  onDeleteProduct,
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const { formatPrice } = useCurrency();

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  return (
    <div
      id={`product-card-${product._id}`}
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-lg border border-slate-200 hover:border-indigo-400 shadow-2xs hover:shadow-xs transition-all duration-150 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden border-b border-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
          loading="lazy"
        />

        {/* Badges - High Density */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {product.badge && (
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider uppercase border shadow-2xs ${
                product.badge === 'Bestseller'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : product.badge === 'Sale'
                  ? 'bg-orange-100 text-orange-800 border-orange-200'
                  : product.badge === 'New'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-indigo-100 text-indigo-800 border-indigo-200'
              }`}
            >
              {product.badge}
            </span>
          )}
          {product.discountPercentage && product.discountPercentage > 0 && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-900 text-white tracking-wider">
              -{product.discountPercentage}%
            </span>
          )}
        </div>

        {/* Store Owner Only: Delete SKU Shortcut */}
        {onDeleteProduct && (
          <button
            id={`card-delete-sku-${product._id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteProduct(product);
            }}
            className="absolute top-2 right-2 z-20 w-7 h-7 rounded-md bg-white/90 hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-200 hover:border-rose-600 flex items-center justify-center transition-all shadow-xs"
            title="Remove Item from Catalog (Store Owner Only)"
            aria-label={`Remove ${product.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Quick View Button Hover Overlay */}
        <div className="absolute inset-0 bg-slate-900/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white text-slate-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm flex items-center gap-1 border border-slate-200">
            <Eye className="w-3 h-3 text-indigo-600" /> View Specs
          </span>
        </div>
      </div>

      {/* Product Information - High Density */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Brand & Category */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span className="font-bold tracking-wider text-slate-400 uppercase">
              {product.brand}
            </span>
            <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 font-medium">
              {product.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-slate-900 text-xs leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>

          {/* Ratings & Flipkart/Meesho Style Assured Badge */}
          <div className="flex items-center justify-between gap-1 mt-1.5">
            <div className="flex items-center bg-emerald-700 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
              <span>{product.rating.toFixed(1)}</span>
              <Star className="w-2.5 h-2.5 ml-0.5 fill-white" />
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              ({product.numReviews})
            </span>
            <span className="ml-auto inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold tracking-tight">
              <span className="text-amber-500">★</span> Assured
            </span>
          </div>
        </div>

        {/* Bottom: Price, Free Delivery & Add to Cart */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-slate-900 font-mono">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[10px] text-slate-400 line-through font-mono">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {product.discountPercentage && product.discountPercentage > 0 && (
                <span className="text-[10px] font-bold text-emerald-600">
                  {product.discountPercentage}% off
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                Free Delivery
              </span>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider ${
                  product.countInStock > 0 ? 'text-slate-500' : 'text-rose-700'
                }`}
              >
                {product.countInStock > 5
                  ? ''
                  : product.countInStock > 0
                  ? `• Only ${product.countInStock} Left`
                  : '• Out of Stock'}
              </span>
            </div>
          </div>

          <button
            id={`add-to-cart-btn-${product._id}`}
            disabled={product.countInStock <= 0}
            onClick={handleAdd}
            className={`w-7 h-7 rounded-md text-xs font-semibold flex items-center justify-center transition-all ${
              product.countInStock <= 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : isAdded
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200/60 shadow-2xs'
            }`}
            title={product.countInStock <= 0 ? 'Out of stock' : 'Add to cart'}
            aria-label={`Add ${product.name} to cart`}
          >
            {isAdded ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <ShoppingCart className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
