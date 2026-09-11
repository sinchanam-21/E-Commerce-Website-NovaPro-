import { Product } from '../types';
import { allProducts } from '../data';

const STORAGE_KEYS = {
  CATALOG: 'novastore_catalog',
  DELETED_IDS: 'novastore_deleted_ids',
  CUSTOM_PRODUCTS: 'novastore_custom_products',
};

/**
 * Get list of all product IDs explicitly deleted by the store owner
 */
export function getDeletedProductIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load deleted product IDs:', e);
  }
  return [];
}

/**
 * Persist a deleted product ID so it never reappears on reload or restart
 */
export function saveDeletedProductId(deletedId: string): string[] {
  const current = getDeletedProductIds();
  if (!current.includes(deletedId)) {
    const updated = [...current, deletedId];
    try {
      localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed saving deleted ID to localStorage:', e);
    }
    return updated;
  }
  return current;
}

/**
 * Get list of custom products registered by the store owner
 */
export function getCustomAddedProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load custom products:', e);
  }
  return [];
}

/**
 * Save an owner-added custom product
 */
export function saveCustomProduct(product: Product): Product[] {
  const current = getCustomAddedProducts();
  const filtered = current.filter((p) => p._id !== product._id);
  const updated = [product, ...filtered];
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PRODUCTS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed saving custom product:', e);
  }

  // Also remove from deleted IDs if it was previously there
  const deleted = getDeletedProductIds();
  if (deleted.includes(product._id)) {
    try {
      localStorage.setItem(
        STORAGE_KEYS.DELETED_IDS,
        JSON.stringify(deleted.filter((id) => id !== product._id))
      );
    } catch {}
  }

  return updated;
}

/**
 * Remove a custom product if deleted
 */
export function removeCustomProduct(productId: string): Product[] {
  const current = getCustomAddedProducts();
  const updated = current.filter((p) => p._id !== productId);
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PRODUCTS, JSON.stringify(updated));
  } catch {}
  return updated;
}

/**
 * Computes initial catalog state combining factory catalog, custom added items,
 * and filtering out all deleted items.
 */
export function getInitialCatalog(): Product[] {
  const deletedIds = getDeletedProductIds();
  const customProducts = getCustomAddedProducts();

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CATALOG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Exclude any deleted items
        const sanitized = parsed.filter((p: Product) => !deletedIds.includes(p._id));
        // Merge custom products if not present
        const customToAdd = customProducts.filter(
          (cp) => !sanitized.some((p: Product) => p._id === cp._id)
        );
        const finalCatalog = [...customToAdd, ...sanitized];
        try {
          localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(finalCatalog));
        } catch {}
        return finalCatalog;
      }
    }
  } catch (e) {
    console.warn('Error reading saved catalog:', e);
  }

  // Default: take allProducts, remove deleted, prepend custom
  const activeBase = allProducts.filter((p) => !deletedIds.includes(p._id));
  const finalCatalog = [...customProducts, ...activeBase];
  try {
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(finalCatalog));
  } catch {}
  return finalCatalog;
}

/**
 * Merges server API response with local deletion and addition tracking
 */
export function sanitizeAndPersistCatalog(serverProducts: Product[]): Product[] {
  const deletedIds = getDeletedProductIds();
  const customProducts = getCustomAddedProducts();

  // 1. Exclude any items deleted by the owner
  const filtered = serverProducts.filter((p) => !deletedIds.includes(p._id));

  // 2. Prepend any owner custom products not yet in server list
  const customToAdd = customProducts.filter(
    (cp) => !filtered.some((p) => p._id === cp._id)
  );

  const merged = [...customToAdd, ...filtered];
  try {
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(merged));
  } catch {}
  return merged;
}

/**
 * Restores catalog back to factory 90 items
 */
export function resetFactoryCatalog(): Product[] {
  try {
    localStorage.removeItem(STORAGE_KEYS.DELETED_IDS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_PRODUCTS);
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(allProducts));
  } catch {}
  return allProducts;
}
