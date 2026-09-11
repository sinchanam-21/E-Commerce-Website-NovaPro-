import React, { useRef } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Smartphone,
  Headphones,
  Home,
  Heart,
  Footprints,
  Watch,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  IndianRupee,
  Tag,
  Zap,
} from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  badge?: string;
  badgeColor?: string;
  image: string;
  icon?: React.ReactNode;
}

interface MeeshoCategoryBarProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  productsCountByCategory?: Record<string, number>;
}

export const MEESHO_CATEGORIES: CategoryItem[] = [
  {
    id: 'All',
    name: 'All Offers',
    badge: 'Super Deals',
    badgeColor: 'bg-rose-500 text-white',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=200&q=80',
    icon: <Sparkles className="w-4 h-4 text-amber-500" />,
  },
  {
    id: 'Fashion',
    name: 'Fashion & Ethnic',
    badge: 'Up to 70% Off',
    badgeColor: 'bg-pink-600 text-white',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=200&q=80',
    icon: <ShoppingBag className="w-4 h-4 text-pink-600" />,
  },
  {
    id: 'Mobiles',
    name: 'Mobiles & 5G',
    badge: 'Best Price',
    badgeColor: 'bg-indigo-600 text-white',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=200&q=80',
    icon: <Smartphone className="w-4 h-4 text-indigo-600" />,
  },
  {
    id: 'Electronics',
    name: 'Electronics',
    badge: 'Trending',
    badgeColor: 'bg-cyan-600 text-white',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=200&q=80',
    icon: <Headphones className="w-4 h-4 text-cyan-600" />,
  },
  {
    id: 'Audio',
    name: 'Audio & Sound',
    badge: 'Hot Seller',
    badgeColor: 'bg-amber-600 text-white',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80',
    icon: <Headphones className="w-4 h-4 text-amber-600" />,
  },
  {
    id: 'Home & Kitchen',
    name: 'Home & Kitchen',
    badge: 'Min 40% Off',
    badgeColor: 'bg-emerald-600 text-white',
    image: 'https://images.unsplash.com/photo-1584990347449-399b1d9bf5e2?auto=format&fit=crop&w=200&q=80',
    icon: <Home className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'Beauty',
    name: 'Beauty & Care',
    badge: '₹99 Store',
    badgeColor: 'bg-purple-600 text-white',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=200&q=80',
    icon: <Heart className="w-4 h-4 text-purple-600" />,
  },
  {
    id: 'Footwear',
    name: 'Footwear',
    badge: 'Under ₹499',
    badgeColor: 'bg-orange-600 text-white',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80',
    icon: <Footprints className="w-4 h-4 text-orange-600" />,
  },
  {
    id: 'Wearables',
    name: 'Smart Watches',
    badge: 'Top Rated',
    badgeColor: 'bg-blue-600 text-white',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80',
    icon: <Watch className="w-4 h-4 text-blue-600" />,
  },
  {
    id: 'Accessories',
    name: 'Accessories',
    badge: 'Deals',
    badgeColor: 'bg-teal-600 text-white',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=200&q=80',
    icon: <Briefcase className="w-4 h-4 text-teal-600" />,
  },
];

export const MeeshoCategoryBar: React.FC<MeeshoCategoryBarProps> = ({
  activeCategory,
  onSelectCategory,
  productsCountByCategory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="mb-6" aria-label="Meesho & Flipkart Style Category Rail">
      {/* Flipkart / Meesho Top Deal Strip */}
      <div className="bg-linear-to-r from-amber-500 via-orange-500 to-pink-600 text-white rounded-xl p-2 sm:p-2.5 mb-4 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white shrink-0 animate-pulse">
            <Zap className="w-3.5 h-3.5" />
          </span>
          <div className="flex items-center gap-1.5 font-bold tracking-tight">
            <span>MEGA BLOCKBUSTER BAZAAR</span>
            <span className="hidden sm:inline opacity-80">•</span>
            <span className="hidden sm:inline font-normal text-amber-100">
              Direct from verified sellers at wholesale lowest prices!
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 font-semibold text-[11px]">
          <span className="bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
            <Tag className="w-3 h-3 text-amber-200" />
            <span>Use Code: NOVA15 for 15% OFF</span>
          </span>
        </div>
      </div>

      {/* Category Icons Carousel / Visual Strip (Meesho & Flipkart Archetype) */}
      <div className="relative bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 sm:p-4">
        {/* Scroll Left Button */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="hidden md:flex absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/95 border border-slate-200 shadow-md items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
          aria-label="Scroll categories left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex items-start gap-3 sm:gap-5 overflow-x-auto scrollbar-none scroll-smooth pb-1 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {MEESHO_CATEGORIES.map((cat) => {
            const isSelected =
              activeCategory === cat.id || (cat.id === 'All' && activeCategory === 'All');
            const count = productsCountByCategory?.[cat.id];

            return (
              <button
                key={cat.id}
                id={`meesho-cat-${cat.id.toLowerCase().replace(/[\s&]+/g, '-')}`}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`group flex flex-col items-center min-w-[70px] sm:min-w-[84px] text-center transition-all outline-hidden shrink-0 ${
                  isSelected ? 'scale-105' : 'hover:scale-102 opacity-90 hover:opacity-100'
                }`}
              >
                {/* Circular Image Container with Meesho/Flipkart border styling */}
                <div className="relative mb-2">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden p-0.5 border-2 transition-all shadow-2xs ${
                      isSelected
                        ? 'border-indigo-600 ring-3 ring-indigo-100 bg-indigo-50'
                        : 'border-slate-200 group-hover:border-indigo-300 bg-slate-50'
                    }`}
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  {/* Micro Offer Badge */}
                  {cat.badge && (
                    <span
                      className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[9px] font-bold tracking-tight whitespace-nowrap shadow-xs ${cat.badgeColor || 'bg-indigo-600 text-white'}`}
                    >
                      {cat.badge}
                    </span>
                  )}
                </div>

                {/* Category Label */}
                <span
                  className={`text-[11px] sm:text-xs font-semibold leading-tight line-clamp-1 max-w-[85px] ${
                    isSelected
                      ? 'text-indigo-700 font-bold'
                      : 'text-slate-700 group-hover:text-indigo-600'
                  }`}
                >
                  {cat.name}
                </span>

                {count !== undefined && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {count} items
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="hidden md:flex absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/95 border border-slate-200 shadow-md items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
          aria-label="Scroll categories right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Meesho & Flipkart Trust Badges Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-slate-700">
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Truck className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900 leading-tight">Free Delivery</p>
            <p className="text-[10px] text-slate-500">On all orders, zero minimum</p>
          </div>
        </div>

        <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <IndianRupee className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900 leading-tight">Cash on Delivery</p>
            <p className="text-[10px] text-slate-500">Pay when order arrives</p>
          </div>
        </div>

        <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <RotateCcw className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900 leading-tight">7-Day Easy Returns</p>
            <p className="text-[10px] text-slate-500">Instant full refund guarantee</p>
          </div>
        </div>

        <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-900 leading-tight">Lowest Price</p>
            <p className="text-[10px] text-slate-500">Direct from factory suppliers</p>
          </div>
        </div>
      </div>
    </section>
  );
};
