import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  ShoppingBag,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Truck,
  RotateCcw,
  CheckCircle2,
  Send,
  User as UserIcon,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Product, Review, User } from '../types';
import { ProductCard } from './ProductCard';
import { useCurrency } from '../context/CurrencyContext';

interface ProductDetailProps {
  productId: string;
  user: User | null;
  onBack: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onBuyNow: (product: Product, quantity?: number) => void;
  onSelectProduct: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  allProducts: Product[];
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  productId,
  user,
  onBack,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  onDeleteProduct,
  allProducts,
  onNotify,
}) => {
  const { formatPrice } = useCurrency();
  const isOwner = Boolean(
    user && user.isAdmin && user.email.toLowerCase() === 'oreooreooreo9@gmail.com'
  );
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Review submission state
  const [reviewName, setReviewName] = useState(user?.name || '');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchProductDetails();
  }, [productId]);

  useEffect(() => {
    if (user?.name && !reviewName) {
      setReviewName(user.name);
    }
  }, [user]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setProduct(data);
          setReviews(data.reviews || []);
          setActiveImageIndex(0);
          setQuantity(1);
          return;
        }
      }
      throw new Error('API unavailable or returned non-JSON');
    } catch (err) {
      console.info('Loading product details from local catalog:', err);
      const fallback = allProducts.find((p) => p._id === productId);
      if (fallback) {
        setProduct(fallback);
        setReviews([]);
        setActiveImageIndex(0);
        setQuantity(1);
      } else {
        onNotify('error', 'Product Not Found', 'Could not locate this item in the store catalog.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    if (!product) return;
    const nextVal = quantity + delta;
    if (nextVal >= 1 && nextVal <= product.countInStock) {
      setQuantity(nextVal);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      onNotify('error', 'Incomplete Form', 'Please provide your name and review comment.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: reviewName.trim(),
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      const data = await res.json();
      setReviews([data.review, ...reviews]);
      if (product) {
        setProduct({
          ...product,
          rating: data.newRating,
          numReviews: data.numReviews,
        });
      }
      setReviewComment('');
      onNotify('success', 'Review Submitted', 'Thank you for sharing your feedback!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting review';
      onNotify('error', 'Submission Failed', msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 font-medium">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Product not found</h2>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </button>
      </div>
    );
  }

  const galleryImages = product.images && product.images.length > 0 ? product.images : [product.image];
  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p._id !== product._id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          id="product-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Products</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
          <span>Home</span>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="font-semibold text-slate-800 truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      {/* Main Grid: Gallery & Product Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs">
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Main Large Image */}
          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
            <img
              id="main-product-image"
              src={galleryImages[activeImageIndex] || product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.badge && (
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                {product.badge}
              </span>
            )}
          </div>

          {/* Thumbnails Row */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  id={`thumbnail-${idx}`}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 rounded-md overflow-hidden border transition-all shrink-0 bg-slate-50 ${
                    activeImageIndex === idx
                      ? 'border-indigo-600 ring-2 ring-indigo-600/30'
                      : 'border-slate-200 hover:border-slate-400 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`${product.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Overview & Actions (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Category & Brand */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                {product.brand}
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {product.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= Math.round(product.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-slate-800 ml-1">
                  {product.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">
                {product.numReviews} Verified Reviews
              </span>
            </div>

            {/* Price section - High Density */}
            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unit Price</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-900 font-mono">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs text-slate-400 line-through font-mono">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              {product.discountPercentage && product.discountPercentage > 0 && (
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Save {product.discountPercentage}%
                  </span>
                  <p className="text-[10px] text-emerald-700 mt-0.5 font-medium">
                    Save {formatPrice(product.originalPrice! - product.price)}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="mt-3.5 text-xs text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Highlights / Features */}
            {product.features && product.features.length > 0 && (
              <div className="mt-3.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Key Specifications
                </h4>
                <ul className="space-y-1.5">
                  {product.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Purchase Actions */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            {/* Stock status & Quantity selector */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    product.countInStock > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <span className="text-xs font-semibold text-slate-700">
                  {product.countInStock > 0
                    ? `In Stock (${product.countInStock} units ready to ship)`
                    : 'Currently Out of Stock'}
                </span>
              </div>

              {product.countInStock > 0 && (
                <div className="flex items-center border border-slate-200 rounded-md bg-slate-50 p-0.5">
                  <button
                    id="qty-decrease-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-xs"
                  >
                    -
                  </button>
                  <span id="qty-current-value" className="w-7 text-center text-xs font-bold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    id="qty-increase-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.countInStock}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* CTAs - High Density */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                id="add-to-cart-detail-btn"
                disabled={product.countInStock <= 0}
                onClick={() => onAddToCart(product, quantity)}
                className="w-full py-2.5 px-4 rounded-md font-bold text-xs uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 shadow-2xs transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>

              <button
                id="buy-now-detail-btn"
                disabled={product.countInStock <= 0}
                onClick={() => onBuyNow(product, quantity)}
                className="w-full py-2.5 px-4 rounded-md font-bold text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-2xs transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Buy Now</span>
              </button>
            </div>

            {/* Store Owner SKU Management Action */}
            {isOwner && (
              <div className="mt-3 p-2.5 bg-rose-50/80 border border-rose-200 rounded-lg flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-rose-900">Store Owner SKU Management</p>
                    <p className="text-[10px] text-rose-600">Restricted to oreooreooreo9@gmail.com</p>
                  </div>
                </div>
                <button
                  id="detail-delete-product-btn"
                  type="button"
                  onClick={() => onDeleteProduct?.(product)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Item from Catalog</span>
                </button>
              </div>
            )}

            {/* Trust Perks */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
              <div className="flex flex-col items-center">
                <Truck className="w-3.5 h-3.5 text-indigo-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Free Express</span>
                <span className="text-[9px] text-slate-500">&gt; {formatPrice(50)} threshold</span>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">2-Yr Warranty</span>
                <span className="text-[9px] text-slate-500">Official coverage</span>
              </div>
              <div className="flex flex-col items-center">
                <RotateCcw className="w-3.5 h-3.5 text-amber-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">30-Day Return</span>
                <span className="text-[9px] text-slate-500">Zero return fee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Section - High Density Structured Table */}
      {product.specs && Object.keys(product.specs).length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Technical Specifications Ledger
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {Object.keys(product.specs).length} Parameters
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {Object.entries(product.specs).map(([specKey, specVal]) => (
              <div
                key={specKey}
                className="grid grid-cols-3 sm:grid-cols-4 px-4 py-2 text-xs hover:bg-slate-50/60 transition-colors"
              >
                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider col-span-1">
                  {specKey}
                </span>
                <span className="font-medium text-slate-900 col-span-2 sm:col-span-3">
                  {specVal}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews & Ratings Section - High Density */}
      <div className="mt-6 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Customer Feedback &amp; Verification
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Real feedback from verified purchasers
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <div className="text-xl font-black text-slate-900">
              {product.rating.toFixed(1)}
            </div>
            <div>
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${
                      s <= Math.round(product.rating)
                        ? 'fill-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold block">
                {reviews.length} Verified Entries
              </span>
            </div>
          </div>
        </div>

        {/* Add Review Form */}
        <form
          onSubmit={handleReviewSubmit}
          className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200"
        >
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Submit Product Feedback
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={reviewName}
                onChange={(e) => setReviewName(e.target.value)}
                placeholder="e.g. Sarah J."
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Rating Score
              </label>
              <div className="flex items-center gap-1 mt-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-0.5 text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= reviewRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-1.5">
                  {reviewRating} of 5 Stars
                </span>
              </div>
            </div>
          </div>

          <div className="mb-2.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Review Notes
            </label>
            <textarea
              rows={2}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="What did you like or dislike? How does it perform in your daily workflow?"
              className="w-full text-xs p-2.5 rounded-md border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submittingReview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider shadow-2xs disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>{submittingReview ? 'Registering...' : 'Post Review'}</span>
          </button>
        </form>

        {/* Reviews List */}
        <div className="mt-4 space-y-2.5">
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">
              No reviews registered yet. Be the first to review this product!
            </p>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev._id}
                className="p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      {rev.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 leading-none">{rev.userName}</h5>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= rev.rating ? 'fill-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed pl-8">
                  {rev.comment}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Related Products Recommendation */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Similar Products in {product.category}</h3>
              <p className="text-xs text-slate-600">You may also find these suitable</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedProducts.map((relProd) => (
              <ProductCard
                key={relProd._id}
                product={relProd}
                onSelectProduct={onSelectProduct}
                onAddToCart={onAddToCart}
                onDeleteProduct={isOwner ? onDeleteProduct : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
