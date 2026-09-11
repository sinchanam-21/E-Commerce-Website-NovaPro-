import { Product } from '../types';
import { fashionProducts } from './fashion';
import { mobileProducts } from './mobiles';
import { electronicsProducts } from './electronics';
import { audioProducts } from './audio';
import { homeKitchenProducts } from './homeKitchen';
import { beautyProducts } from './beauty';
import { footwearProducts } from './footwear';
import { wearablesProducts } from './wearables';
import { accessoriesProducts } from './accessories';

export const allProducts: Product[] = [
  ...fashionProducts,
  ...mobileProducts,
  ...electronicsProducts,
  ...audioProducts,
  ...homeKitchenProducts,
  ...beautyProducts,
  ...footwearProducts,
  ...wearablesProducts,
  ...accessoriesProducts,
];
