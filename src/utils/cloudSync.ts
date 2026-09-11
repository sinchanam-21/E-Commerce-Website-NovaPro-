import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  arrayUnion,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import {
  getDeletedProductIds,
  getCustomAddedProducts,
  saveDeletedProductId,
  saveCustomProduct,
} from './catalogStorage';

const SYNC_DOC_REF = doc(db, 'catalog_sync', 'global');

export interface CloudCatalogState {
  deletedIds: string[];
  customProducts: Product[];
  updatedAt?: number;
  lastModifiedBy?: string;
}

/**
 * Subscribes to real-time catalog changes from Firebase Firestore.
 * Ensures all connected devices (phones, laptops, customers) update in real-time.
 */
export function subscribeToCloudCatalog(
  onUpdate: (cloudState: CloudCatalogState) => void
): Unsubscribe {
  // Proactively bootstrap or sync local deletions to cloud
  bootstrapInitialCloudState();

  return onSnapshot(
    SYNC_DOC_REF,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<CloudCatalogState>;
        const deletedIds = Array.isArray(data.deletedIds) ? data.deletedIds : [];
        const customProducts = Array.isArray(data.customProducts)
          ? (data.customProducts as Product[])
          : [];

        // Check if current device has any local deletions not yet committed to cloud
        const localDeleted = getDeletedProductIds();
        const uncommitted = localDeleted.filter((id) => !deletedIds.includes(id));
        if (uncommitted.length > 0) {
          const mergedDeleted = Array.from(new Set([...deletedIds, ...localDeleted]));
          setDoc(
            SYNC_DOC_REF,
            { deletedIds: mergedDeleted, updatedAt: Date.now() },
            { merge: true }
          ).catch((e) => console.warn('Sync merge error:', e));
        }

        // Synchronize into local storage cache for offline reliability
        try {
          localStorage.setItem('novastore_deleted_ids', JSON.stringify(deletedIds));
          localStorage.setItem(
            'novastore_custom_products',
            JSON.stringify(customProducts)
          );
        } catch (e) {
          console.warn('Failed to cache cloud catalog locally:', e);
        }

        onUpdate({
          deletedIds,
          customProducts,
          updatedAt: data.updatedAt,
          lastModifiedBy: data.lastModifiedBy,
        });
      } else {
        // Document does not exist yet; bootstrap with any existing local deletions
        bootstrapInitialCloudState();
      }
    },
    (error) => {
      console.warn('Firestore catalog sync subscription warning:', error);
    }
  );
}

/**
 * Bootstraps cloud state if it is currently empty.
 * If the current client (e.g. laptop) already has deleted products,
 * it uploads them so all devices immediately match.
 */
export async function bootstrapInitialCloudState(): Promise<void> {
  try {
    const snap = await getDoc(SYNC_DOC_REF);
    const localDeleted = getDeletedProductIds();
    const localCustom = getCustomAddedProducts();

    if (!snap.exists()) {
      await setDoc(
        SYNC_DOC_REF,
        {
          deletedIds: localDeleted,
          customProducts: localCustom,
          updatedAt: Date.now(),
          lastModifiedBy: 'store_owner',
        },
        { merge: true }
      );
      console.info('Cloud catalog initialized with existing local modifications.');
    } else {
      const data = snap.data() as CloudCatalogState;
      const cloudDeleted = Array.isArray(data.deletedIds) ? data.deletedIds : [];
      const uncommitted = localDeleted.filter((id) => !cloudDeleted.includes(id));
      if (uncommitted.length > 0) {
        const merged = Array.from(new Set([...cloudDeleted, ...localDeleted]));
        await setDoc(
          SYNC_DOC_REF,
          {
            deletedIds: merged,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      }
    }
  } catch (error) {
    console.warn('Unable to bootstrap initial cloud state:', error);
  }
}

/**
 * Broadcasts a product deletion to Firebase Firestore so all other devices
 * reflect the change immediately.
 */
export async function syncDeletionToCloud(deletedId: string): Promise<void> {
  // Always update local cache immediately
  saveDeletedProductId(deletedId);

  try {
    const snap = await getDoc(SYNC_DOC_REF);
    const existing = snap.exists() ? (snap.data() as CloudCatalogState) : null;
    const currentDeleted = Array.isArray(existing?.deletedIds)
      ? existing.deletedIds
      : getDeletedProductIds();

    const updatedDeleted = Array.from(new Set([...currentDeleted, deletedId]));

    // Also remove from custom products if it was there
    const currentCustom = Array.isArray(existing?.customProducts)
      ? existing.customProducts
      : getCustomAddedProducts();
    const updatedCustom = currentCustom.filter((p) => p._id !== deletedId);

    await setDoc(
      SYNC_DOC_REF,
      {
        deletedIds: updatedDeleted,
        customProducts: updatedCustom,
        updatedAt: Date.now(),
        lastModifiedBy: 'store_owner',
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Cloud sync deletion error (falling back to arrayUnion):', err);
    try {
      await setDoc(
        SYNC_DOC_REF,
        {
          deletedIds: arrayUnion(deletedId),
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (e2) {
      console.error('Failed to sync deletion to Firestore:', e2);
    }
  }
}

/**
 * Broadcasts a new product addition to Firebase Firestore so all other devices
 * receive the new SKU immediately.
 */
export async function syncCustomProductToCloud(product: Product): Promise<void> {
  // Save locally first
  saveCustomProduct(product);

  try {
    const snap = await getDoc(SYNC_DOC_REF);
    const existing = snap.exists() ? (snap.data() as CloudCatalogState) : null;

    const currentCustom = Array.isArray(existing?.customProducts)
      ? existing.customProducts
      : getCustomAddedProducts();
    const filteredCustom = currentCustom.filter((p) => p._id !== product._id);
    const updatedCustom = [product, ...filteredCustom];

    // Remove from deletedIds if present
    const currentDeleted = Array.isArray(existing?.deletedIds)
      ? existing.deletedIds
      : getDeletedProductIds();
    const updatedDeleted = currentDeleted.filter((id) => id !== product._id);

    await setDoc(
      SYNC_DOC_REF,
      {
        customProducts: updatedCustom,
        deletedIds: updatedDeleted,
        updatedAt: Date.now(),
        lastModifiedBy: 'store_owner',
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to sync custom product to Firestore:', err);
  }
}

/**
 * Restores factory catalog (resets deleted IDs and custom products in the cloud)
 */
export async function syncResetToCloud(): Promise<void> {
  // Clear local storage first
  try {
    localStorage.removeItem('novastore_deleted_ids');
    localStorage.removeItem('novastore_custom_products');
  } catch {}

  try {
    await setDoc(
      SYNC_DOC_REF,
      {
        deletedIds: [],
        customProducts: [],
        updatedAt: Date.now(),
        lastModifiedBy: 'store_owner',
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to reset cloud catalog:', err);
  }
}
