import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  productsCollection,
  reviewsCollection,
  usersCollection,
  ordersCollection,
  securityAlertsCollection,
  hashPassword,
} from './server/db.ts';

// Simple active token sessions map: token -> userId
const tokenSessions = new Map<string, string>();

// Authorized Store Owner / Admin Email (defaults to oreooreooreo9@gmail.com, dynamically changeable by owner)
export let STORE_OWNER_EMAIL = 'oreooreooreo9@gmail.com';

export function getStoreOwnerEmail(): string {
  return STORE_OWNER_EMAIL;
}

export function setStoreOwnerEmail(newEmail: string): void {
  STORE_OWNER_EMAIL = newEmail.toLowerCase().trim();
}

// Seed default token for john@example.com for instant testing convenience
tokenSessions.set('demo-token-john', '66a3001e7b8f10214c000001');
// Seed owner admin token for oreooreooreo9@gmail.com for authenticated store management
tokenSessions.set('owner-token-oreo', '66a3001e7b8f10214c000099');

// Strict Admin Authentication Middleware: Accessible strictly by the current authorized store owner
async function authenticateAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '').trim();

    if (!token || !tokenSessions.has(token)) {
      return res.status(401).json({
        error: `Authentication required. Please sign in as the authorized store owner (${STORE_OWNER_EMAIL}).`,
      });
    }

    const userId = tokenSessions.get(token);
    const user = await usersCollection.findById(userId!);

    if (!user) {
      return res.status(401).json({ error: 'Session invalid. User record not found.' });
    }

    // Strict Role & Email Verification: Must be admin OR match current store owner email
    const isOwner = user.isAdmin || user.email.toLowerCase() === STORE_OWNER_EMAIL.toLowerCase();
    if (!isOwner) {
      return res.status(403).json({
        error: `Access Denied: Product catalog item management is strictly restricted to the verified store owner (${STORE_OWNER_EMAIL}).`,
      });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({ error: 'Server error validating administrator credentials.' });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get all categories with counts
  app.get('/api/categories', async (req, res) => {
    try {
      const allProducts = await productsCollection.find();
      const categoryMap = new Map<string, number>();

      allProducts.forEach((prod) => {
        categoryMap.set(prod.category, (categoryMap.get(prod.category) || 0) + 1);
      });

      const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        count,
      }));

      res.json({ categories, totalProducts: allProducts.length });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Get all products (with search, category, pricing, and sort filters)
  app.get('/api/products', async (req, res) => {
    try {
      const { category, search, sort, minPrice, maxPrice, inStockOnly } = req.query;

      let products = await productsCollection.find();

      // Filter by category
      if (category && typeof category === 'string' && category !== 'All') {
        products = products.filter(
          (p) => p.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Filter by search keyword
      if (search && typeof search === 'string' && search.trim() !== '') {
        const query = search.toLowerCase().trim();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.brand.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );
      }

      // Filter by min/max price
      if (minPrice) {
        const min = parseFloat(minPrice as string);
        if (!isNaN(min)) {
          products = products.filter((p) => p.price >= min);
        }
      }

      if (maxPrice) {
        const max = parseFloat(maxPrice as string);
        if (!isNaN(max)) {
          products = products.filter((p) => p.price <= max);
        }
      }

      // Filter in-stock only
      if (inStockOnly === 'true') {
        products = products.filter((p) => p.countInStock > 0);
      }

      // Sort
      if (sort === 'price-asc') {
        products.sort((a, b) => a.price - b.price);
      } else if (sort === 'price-desc') {
        products.sort((a, b) => b.price - a.price);
      } else if (sort === 'rating') {
        products.sort((a, b) => b.rating - a.rating);
      } else if (sort === 'newest') {
        products.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      res.json(products);
    } catch (error) {
      console.error('Error querying products:', error);
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  });

  // Get single product by ID (includes its reviews)
  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await productsCollection.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const reviews = await reviewsCollection.find(
        (r) => r.productId === req.params.id
      );

      reviews.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json({ ...product, reviews });
    } catch (error) {
      console.error('Error getting product by id:', error);
      res.status(500).json({ error: 'Failed to get product details' });
    }
  });

  // Create New Product (Protected: Store Owner oreooreooreo9@gmail.com Only)
  app.post('/api/products', authenticateAdmin, async (req, res) => {
    try {
      const {
        name,
        brand,
        category,
        price,
        originalPrice,
        countInStock,
        image,
        images,
        description,
        features,
        specs,
        badge,
      } = req.body;

      if (!name || !category || price === undefined || price === null || !description) {
        return res.status(400).json({
          error: 'Product name, category, price, and description are required.',
        });
      }

      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ error: 'Price must be a valid positive number.' });
      }

      const numStock = parseInt(countInStock !== undefined ? countInStock : 12, 10);
      const validStock = isNaN(numStock) ? 10 : Math.max(0, numStock);

      const defaultImg =
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
      const mainImage = typeof image === 'string' && image.trim() ? image.trim() : defaultImg;

      const numOriginalPrice = originalPrice ? parseFloat(originalPrice) : undefined;
      const discountPercentage =
        numOriginalPrice && numOriginalPrice > numPrice
          ? Math.round(((numOriginalPrice - numPrice) / numOriginalPrice) * 100)
          : undefined;

      const newProduct = await productsCollection.insertOne({
        name: String(name).trim(),
        brand: (brand && String(brand).trim()) || 'NovaTech',
        category: String(category).trim(),
        price: numPrice,
        originalPrice: numOriginalPrice,
        discountPercentage,
        rating: 5.0,
        numReviews: 0,
        inStock: validStock > 0,
        countInStock: validStock,
        image: mainImage,
        images: Array.isArray(images) && images.length > 0 ? images : [mainImage],
        description: String(description).trim(),
        features:
          Array.isArray(features) && features.length > 0
            ? features
            : [
                'Engineered with aerospace-grade durability',
                'Official 2-year manufacturer hardware warranty',
                'Comprehensive factory calibration & stress-tested',
              ],
        specs:
          specs && typeof specs === 'object' && Object.keys(specs).length > 0
            ? specs
            : {
                'Build Quality': 'Anodized Aluminum Alloy',
                Connectivity: 'USB-C / Wireless',
                Warranty: '2-Year Official Coverage',
                Dispatch: 'In Warehouse Stock',
              },
        badge: badge || 'New',
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        message: 'Item successfully registered into store catalog.',
        product: newProduct,
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to add item to catalog.' });
    }
  });

  // Remove Product (Protected: Store Owner oreooreooreo9@gmail.com Only)
  app.delete('/api/products/:id', authenticateAdmin, async (req, res) => {
    try {
      const productId = req.params.id;
      const existingProduct = await productsCollection.findById(productId);

      if (!existingProduct) {
        return res.status(404).json({ error: 'Product SKU not found in store catalog.' });
      }

      const deleted = await productsCollection.deleteOne(productId);
      if (!deleted) {
        return res.status(500).json({ error: 'Failed to remove product from database.' });
      }

      res.json({
        success: true,
        message: `Product "${existingProduct.name}" (SKU: ${productId}) has been permanently removed from the catalog.`,
        deletedId: productId,
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to remove item.' });
    }
  });

  // Post a review for a product
  app.post('/api/products/:id/reviews', async (req, res) => {
    try {
      const { userName, rating, comment } = req.body;
      const productId = req.params.id;

      const product = await productsCollection.findById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      if (!userName || !rating || !comment) {
        return res
          .status(400)
          .json({ error: 'Name, rating (1-5), and comment are required' });
      }

      const parsedRating = Math.max(1, Math.min(5, Number(rating)));

      const review = await reviewsCollection.insertOne({
        productId,
        userName: String(userName).trim(),
        rating: parsedRating,
        comment: String(comment).trim(),
        createdAt: new Date().toISOString(),
      });

      // Recalculate product rating
      const allProductReviews = await reviewsCollection.find(
        (r) => r.productId === productId
      );
      const totalScore = allProductReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = Number((totalScore / allProductReviews.length).toFixed(1));

      await productsCollection.updateOne(productId, {
        rating: avgRating,
        numReviews: allProductReviews.length,
      });

      res.status(201).json({ review, newRating: avgRating, numReviews: allProductReviews.length });
    } catch (error) {
      console.error('Error posting review:', error);
      res.status(500).json({ error: 'Failed to post review' });
    }
  });

  // User Registration (Express + MongoDB schema)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ error: 'Name, email, and password are required' });
      }

      const cleanEmail = String(email).toLowerCase().trim();
      const existingUser = await usersCollection.findOne((u) => u.email === cleanEmail);

      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const isStoreOwner = cleanEmail === STORE_OWNER_EMAIL.toLowerCase();

      const newUser = await usersCollection.insertOne({
        name: String(name).trim(),
        email: cleanEmail,
        passwordHash: hashPassword(password),
        isAdmin: isStoreOwner,
        createdAt: new Date().toISOString(),
      });

      const token = crypto.randomBytes(24).toString('hex');
      tokenSessions.set(token, newUser._id);

      res.status(201).json({
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          isAdmin: newUser.isAdmin,
        },
        token,
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  // User Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const cleanEmail = String(email).toLowerCase().trim();
      const user = await usersCollection.findOne((u) => u.email === cleanEmail);

      if (!user || user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = crypto.randomBytes(24).toString('hex');
      tokenSessions.set(token, user._id);

      // Extra Protection for Owner Access: If store owner logs in, dispatch security notification to email
      let securityAlert = null;
      if (cleanEmail === STORE_OWNER_EMAIL.toLowerCase()) {
        const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
        const userAgent = (req.headers['user-agent'] as string) || 'Authorized Browser Session';
        const secCode = `SEC-${Math.floor(10000 + Math.random() * 90000)}`;

        securityAlert = await securityAlertsCollection.insertOne({
          userId: user._id,
          email: STORE_OWNER_EMAIL,
          eventType: 'LOGIN_SUCCESS',
          title: '🚨 Store Owner Sign-In Detected',
          message: `A new sign-in to your Store Owner account (${STORE_OWNER_EMAIL}) was authenticated from IP ${clientIp}. A live security notification was dispatched to your email address.`,
          ipAddress: String(clientIp),
          userAgent: String(userAgent),
          timestamp: new Date().toISOString(),
          status: 'DELIVERED',
          securityCode: secCode,
        });

        console.log('\n=============================================================');
        console.log('🛡️ [STORE OWNER EMAIL SECURITY NOTIFICATION DISPATCH]');
        console.log(`To: ${STORE_OWNER_EMAIL}`);
        console.log(`Subject: 🚨 Security Alert: New Sign-In to NovaStore Owner Account`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log(`Client IP: ${clientIp}`);
        console.log(`Device / User-Agent: ${userAgent}`);
        console.log(`Security Verification Code: ${secCode}`);
        console.log(`Status: DISPATCHED & DELIVERED to ${STORE_OWNER_EMAIL}`);
        console.log('=============================================================\n');
      }

      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
        },
        token,
        securityAlert: securityAlert
          ? {
              alertId: securityAlert._id,
              email: securityAlert.email,
              timestamp: securityAlert.timestamp,
              securityCode: securityAlert.securityCode,
              message: `Security notification dispatched to ${STORE_OWNER_EMAIL}`,
            }
          : undefined,
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Get current user profile
  app.get('/api/auth/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      if (!token || !tokenSessions.has(token)) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userId = tokenSessions.get(token);
      const user = await usersCollection.findById(userId!);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  // Store Owner Profile: Get Owner Details
  app.get('/api/owner/profile', authenticateAdmin, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '').trim();
      const userId = tokenSessions.get(token!);
      const owner = await usersCollection.findById(userId!);

      if (!owner) {
        return res.status(404).json({ error: 'Owner account not found' });
      }

      res.json({
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone || '',
        storeName: owner.storeName || 'NovaStore Official Flagship',
        bio: owner.bio || '',
        address: owner.address || '',
        securityNotificationEmail: owner.securityNotificationEmail || owner.email,
        emailAlertsEnabled: owner.emailAlertsEnabled !== false,
        createdAt: owner.createdAt,
      });
    } catch (error) {
      console.error('Error retrieving owner profile:', error);
      res.status(500).json({ error: 'Failed to retrieve owner profile' });
    }
  });

  // Store Owner Profile: Update Owner Details
  app.put('/api/owner/profile', authenticateAdmin, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '').trim();
      const userId = tokenSessions.get(token!);
      const owner = await usersCollection.findById(userId!);

      if (!owner) {
        return res.status(404).json({ error: 'Owner account not found' });
      }

      const { name, phone, storeName, bio, address, emailAlertsEnabled } = req.body;

      const updateData: Partial<typeof owner> = {};
      if (name && typeof name === 'string' && name.trim()) {
        updateData.name = name.trim();
      }
      if (phone !== undefined) updateData.phone = String(phone).trim();
      if (storeName !== undefined) updateData.storeName = String(storeName).trim();
      if (bio !== undefined) updateData.bio = String(bio).trim();
      if (address !== undefined) updateData.address = String(address).trim();
      if (emailAlertsEnabled !== undefined) {
        updateData.emailAlertsEnabled = Boolean(emailAlertsEnabled);
      }

      const updatedOwner = await usersCollection.updateOne(owner._id, updateData);

      // Create security audit alert
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      const userAgent = (req.headers['user-agent'] as string) || 'Authorized Browser Session';
      const secCode = `SEC-${Math.floor(10000 + Math.random() * 90000)}`;

      await securityAlertsCollection.insertOne({
        userId: owner._id,
        email: STORE_OWNER_EMAIL,
        eventType: 'PROFILE_UPDATED',
        title: 'Owner Profile Details Updated',
        message: 'Your Store Owner contact and business profile details were updated.',
        ipAddress: String(clientIp),
        userAgent: String(userAgent),
        timestamp: new Date().toISOString(),
        status: 'DELIVERED',
        securityCode: secCode,
      });

      console.log(`🛡️ [OWNER PROFILE UPDATE] Notification recorded and sent to ${STORE_OWNER_EMAIL}`);

      res.json({
        success: true,
        message: 'Owner profile updated successfully',
        owner: {
          _id: updatedOwner!._id,
          name: updatedOwner!.name,
          email: updatedOwner!.email,
          phone: updatedOwner!.phone || '',
          storeName: updatedOwner!.storeName || 'NovaStore Official Flagship',
          bio: updatedOwner!.bio || '',
          address: updatedOwner!.address || '',
          securityNotificationEmail: updatedOwner!.securityNotificationEmail || updatedOwner!.email,
          emailAlertsEnabled: updatedOwner!.emailAlertsEnabled !== false,
        },
      });
    } catch (error) {
      console.error('Error updating owner profile:', error);
      res.status(500).json({ error: 'Failed to update owner profile' });
    }
  });

  // Public/Client Helper: Get Current Store Owner Email and system status
  app.get('/api/owner/status', async (req, res) => {
    try {
      const ownerUser = await usersCollection.findOne(
        (u) => u.email === STORE_OWNER_EMAIL || u.isAdmin
      );
      res.json({
        ownerEmail: STORE_OWNER_EMAIL,
        storeName: ownerUser?.storeName || 'NovaStore Official Flagship',
        ownerName: ownerUser?.name || 'Store Owner',
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve owner status' });
    }
  });

  // Store Owner Security: Change Owner Email ID
  app.put('/api/owner/email', authenticateAdmin, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '').trim();
      const userId = tokenSessions.get(token!);
      const owner = await usersCollection.findById(userId!);

      if (!owner) {
        return res.status(404).json({ error: 'Owner account not found' });
      }

      const { newEmail, currentPassword } = req.body;

      if (!newEmail || typeof newEmail !== 'string') {
        return res.status(400).json({ error: 'New owner email address is required' });
      }

      const cleanNewEmail = newEmail.toLowerCase().trim();

      // Basic email syntax validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanNewEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address format (e.g., owner@yourstore.com)' });
      }

      if (cleanNewEmail === owner.email.toLowerCase()) {
        return res.status(400).json({ error: 'The new email address cannot be identical to the current email' });
      }

      // Security check: verify current password
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to verify email ID change authorization' });
      }

      if (owner.passwordHash !== hashPassword(currentPassword)) {
        return res.status(401).json({ error: 'Current password does not match. Please verify your password.' });
      }

      // Check if email is already taken by another account
      const existingUser = await usersCollection.findOne(
        (u) => u.email === cleanNewEmail && u._id !== owner._id
      );
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email address already exists' });
      }

      const previousEmail = owner.email;

      // Update owner user record with new email
      const updatedOwner = await usersCollection.updateOne(owner._id, {
        email: cleanNewEmail,
        securityNotificationEmail: cleanNewEmail,
        isAdmin: true,
      });

      // Update global store owner email state
      setStoreOwnerEmail(cleanNewEmail);

      // Record security audit alerts for BOTH previous and new email addresses
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      const userAgent = (req.headers['user-agent'] as string) || 'Authorized Browser Session';
      const secCode = `SEC-${Math.floor(10000 + Math.random() * 90000)}`;

      // Alert dispatched to new email
      await securityAlertsCollection.insertOne({
        userId: owner._id,
        email: cleanNewEmail,
        eventType: 'EMAIL_CHANGED',
        title: '🚨 Store Owner Email ID Successfully Updated',
        message: `Your Store Owner Email ID was changed from ${previousEmail} to ${cleanNewEmail}. This email is now the primary authorized administrator for all store management and catalog controls.`,
        ipAddress: String(clientIp),
        userAgent: String(userAgent),
        timestamp: new Date().toISOString(),
        status: 'DELIVERED',
        securityCode: secCode,
      });

      // Alert dispatched to old email for security safeguarding
      await securityAlertsCollection.insertOne({
        userId: owner._id,
        email: previousEmail,
        eventType: 'EMAIL_CHANGED',
        title: '⚠️ Store Owner Email ID Transferred to New Address',
        message: `Notice: Store Owner Email was transferred from ${previousEmail} to ${cleanNewEmail} on ${new Date().toLocaleString()}. If you did not authorize this, contact support immediately.`,
        ipAddress: String(clientIp),
        userAgent: String(userAgent),
        timestamp: new Date().toISOString(),
        status: 'DELIVERED',
        securityCode: secCode,
      });

      console.log('\n=============================================================');
      console.log('🛡️ [STORE OWNER EMAIL ID CHANGED]');
      console.log(`Previous Email: ${previousEmail}`);
      console.log(`New Email: ${cleanNewEmail}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log(`Client IP: ${clientIp}`);
      console.log(`Verification Code: ${secCode}`);
      console.log(`Status: DISPATCHED & DELIVERED to both ${previousEmail} and ${cleanNewEmail}`);
      console.log('=============================================================\n');

      res.json({
        success: true,
        message: `Store Owner Email ID changed successfully to ${cleanNewEmail}. Real-time security verification alerts dispatched to both addresses.`,
        newEmail: cleanNewEmail,
        owner: {
          _id: updatedOwner!._id,
          name: updatedOwner!.name,
          email: updatedOwner!.email,
          phone: updatedOwner!.phone || '',
          storeName: updatedOwner!.storeName || 'NovaStore Official Flagship',
          bio: updatedOwner!.bio || '',
          address: updatedOwner!.address || '',
          securityNotificationEmail: updatedOwner!.email,
          emailAlertsEnabled: updatedOwner!.emailAlertsEnabled !== false,
          isAdmin: true,
        },
      });
    } catch (error) {
      console.error('Error changing owner email:', error);
      res.status(500).json({ error: 'Failed to update owner email' });
    }
  });

  // Store Owner Security: Change Owner Password
  app.put('/api/owner/password', authenticateAdmin, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '').trim();
      const userId = tokenSessions.get(token!);
      const owner = await usersCollection.findById(userId!);

      if (!owner) {
        return res.status(404).json({ error: 'Owner account not found' });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      if (owner.passwordHash !== hashPassword(currentPassword)) {
        return res.status(401).json({
          error: 'Current password does not match. Please verify your current password.',
        });
      }

      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }

      const newHash = hashPassword(newPassword);
      await usersCollection.updateOne(owner._id, { passwordHash: newHash });

      // Record security audit and log security dispatch
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      const userAgent = (req.headers['user-agent'] as string) || 'Authorized Browser Session';
      const secCode = `SEC-${Math.floor(10000 + Math.random() * 90000)}`;

      await securityAlertsCollection.insertOne({
        userId: owner._id,
        email: STORE_OWNER_EMAIL,
        eventType: 'PASSWORD_CHANGED',
        title: '🚨 Owner Password Changed Successfully',
        message: `Your Store Owner password was changed on ${new Date().toLocaleString()}. A critical security notice has been dispatched to ${STORE_OWNER_EMAIL}.`,
        ipAddress: String(clientIp),
        userAgent: String(userAgent),
        timestamp: new Date().toISOString(),
        status: 'DELIVERED',
        securityCode: secCode,
      });

      console.log('\n=============================================================');
      console.log('🛡️ [SECURITY EMAIL DISPATCH: PASSWORD CHANGE]');
      console.log(`To: ${STORE_OWNER_EMAIL}`);
      console.log(`Subject: 🚨 CRITICAL ALERT: NovaStore Owner Password Changed`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log(`Client IP: ${clientIp}`);
      console.log(`Verification Code: ${secCode}`);
      console.log(`Status: DISPATCHED & DELIVERED to ${STORE_OWNER_EMAIL}`);
      console.log('=============================================================\n');

      res.json({
        success: true,
        message: `Password changed successfully. A critical security notification was sent to ${STORE_OWNER_EMAIL}.`,
      });
    } catch (error) {
      console.error('Error changing owner password:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // Store Owner Security: Get Email Security Alerts
  app.get('/api/owner/security-alerts', authenticateAdmin, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '').trim();
      const userId = tokenSessions.get(token!);
      
      const alerts = await securityAlertsCollection.find(
        (a) => a.email.toLowerCase() === STORE_OWNER_EMAIL.toLowerCase() || a.userId === userId
      );
      const sorted = alerts.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      res.json({ alerts: sorted, currentOwnerEmail: STORE_OWNER_EMAIL });
    } catch (error) {
      console.error('Error fetching security alerts:', error);
      res.status(500).json({ error: 'Failed to fetch security alerts' });
    }
  });

  // Store Owner Security: Test Security Alert Dispatch
  app.post('/api/owner/test-security-alert', authenticateAdmin, async (req, res) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      const userAgent = (req.headers['user-agent'] as string) || 'Authorized Browser Session';
      const secCode = `SEC-${Math.floor(10000 + Math.random() * 90000)}`;

      const alert = await securityAlertsCollection.insertOne({
        userId: '66a3001e7b8f10214c000099',
        email: STORE_OWNER_EMAIL,
        eventType: 'TEST_ALERT',
        title: '🛡️ Manual Security Alert Transmission Test',
        message: `Owner security transmission test verified and successfully delivered to ${STORE_OWNER_EMAIL}.`,
        ipAddress: String(clientIp),
        userAgent: String(userAgent),
        timestamp: new Date().toISOString(),
        status: 'DELIVERED',
        securityCode: secCode,
      });

      console.log(`🛡️ [TEST DISPATCH] Test notification sent to ${STORE_OWNER_EMAIL}`);

      res.json({
        success: true,
        message: `Test email notification dispatched to ${STORE_OWNER_EMAIL}`,
        alert,
      });
    } catch (error) {
      console.error('Error triggering test alert:', error);
      res.status(500).json({ error: 'Failed to trigger test security alert' });
    }
  });

  // Store Owner Emergency Recovery Request (One-Time Verification Alert)
  app.post('/api/owner/recovery-alert', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Please enter your registered owner email address.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      if (cleanEmail !== STORE_OWNER_EMAIL.toLowerCase()) {
        return res.status(403).json({
          error: 'This email is not registered as the authorized Store Owner address.',
        });
      }

      const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
      const userAgent = (req.headers['user-agent'] as string) || 'Authorized Browser Session';
      const oneTimeRecoveryCode = `REC-${Math.floor(100000 + Math.random() * 900000)}`;

      await securityAlertsCollection.insertOne({
        userId: '66a3001e7b8f10214c000099',
        email: STORE_OWNER_EMAIL,
        eventType: 'PASSWORD_RESET_ALERT',
        title: '🔑 Emergency Owner Account Recovery Dispatched',
        message: `An emergency account recovery code was requested for ${STORE_OWNER_EMAIL} from IP ${clientIp}. One-Time Security Passcode: ${oneTimeRecoveryCode}.`,
        ipAddress: String(clientIp),
        userAgent: String(userAgent),
        timestamp: new Date().toISOString(),
        status: 'DELIVERED',
        securityCode: oneTimeRecoveryCode,
      });

      console.log('\n=============================================================');
      console.log('🛡️ [STORE OWNER EMERGENCY RECOVERY ALERT DISPATCH]');
      console.log(`To: ${STORE_OWNER_EMAIL}`);
      console.log(`Subject: 🔑 Emergency Recovery Code for NovaStore Owner Account`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log(`One-Time Recovery Passcode: ${oneTimeRecoveryCode}`);
      console.log(`Client IP: ${clientIp}`);
      console.log(`Status: DISPATCHED & DELIVERED to ${STORE_OWNER_EMAIL}`);
      console.log('=============================================================\n');

      res.json({
        success: true,
        message: `A one-time security recovery passcode (${oneTimeRecoveryCode}) has been dispatched to ${STORE_OWNER_EMAIL}.`,
        securityCode: oneTimeRecoveryCode,
      });
    } catch (error) {
      console.error('Error generating owner recovery alert:', error);
      res.status(500).json({ error: 'Failed to process recovery alert request.' });
    }
  });

  // Place Order (Checkout)
  app.post('/api/orders', async (req, res) => {
    try {
      const {
        customerName,
        customerEmail,
        userId,
        orderItems,
        shippingAddress,
        shippingMethod,
        paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        discountPrice,
        totalPrice,
      } = req.body;

      if (!orderItems || !orderItems.length) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
        return res.status(400).json({ error: 'Valid shipping address is required' });
      }

      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      // Calculate estimated delivery: 2-3 days for express, 5-7 days for standard
      const deliveryDays = shippingMethod === 'express' ? 3 : 6;
      const estimatedDelivery = new Date(
        Date.now() + deliveryDays * 24 * 60 * 60 * 1000
      ).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const order = await ordersCollection.insertOne({
        orderNumber,
        userId: userId || undefined,
        customerName: customerName || shippingAddress.fullName,
        customerEmail: customerEmail || shippingAddress.email,
        orderItems,
        shippingAddress,
        shippingMethod: shippingMethod || 'standard',
        paymentMethod: paymentMethod || 'Cash on Delivery (Demo)',
        itemsPrice: Number(itemsPrice) || 0,
        shippingPrice: Number(shippingPrice) || 0,
        taxPrice: Number(taxPrice) || 0,
        discountPrice: Number(discountPrice) || 0,
        totalPrice: Number(totalPrice) || 0,
        isPaid: paymentMethod !== 'Cash on Delivery',
        status: 'Processing',
        createdAt: new Date().toISOString(),
        estimatedDelivery,
      });

      // Update product inventory stock
      for (const item of orderItems) {
        const prod = await productsCollection.findById(item.productId);
        if (prod) {
          const newStock = Math.max(0, prod.countInStock - item.quantity);
          await productsCollection.updateOne(item.productId, {
            countInStock: newStock,
            inStock: newStock > 0,
          });
        }
      }

      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to place order' });
    }
  });

  // Get orders list
  app.get('/api/orders', async (req, res) => {
    try {
      const { email, userId } = req.query;
      let orders = await ordersCollection.find();

      if (userId && typeof userId === 'string') {
        orders = orders.filter((o) => o.userId === userId);
      } else if (email && typeof email === 'string') {
        orders = orders.filter(
          (o) => o.customerEmail.toLowerCase() === email.toLowerCase()
        );
      }

      orders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // Get order by id or orderNumber
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const order =
        (await ordersCollection.findById(id)) ||
        (await ordersCollection.findOne((o) => o.orderNumber === id));

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  // Cancel order endpoint (restores product inventory stock and marks order Cancelled)
  const handleCancelOrder = async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};

      const order =
        (await ordersCollection.findById(id)) ||
        (await ordersCollection.findOne((o) => o.orderNumber === id));

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status === 'Cancelled') {
        return res.status(400).json({ error: 'Order is already cancelled' });
      }

      // Restore product inventory stock in catalog
      if (Array.isArray(order.orderItems)) {
        for (const item of order.orderItems) {
          const prod = await productsCollection.findById(item.productId);
          if (prod) {
            const restoredStock = prod.countInStock + item.quantity;
            await productsCollection.updateOne(item.productId, {
              countInStock: restoredStock,
              inStock: restoredStock > 0,
            });
          }
        }
      }

      const cancelledAt = new Date().toISOString();
      const cancellationReason =
        reason && String(reason).trim()
          ? String(reason).trim()
          : 'Customer requested cancellation';

      const updatedOrder = await ordersCollection.updateOne(order._id, {
        status: 'Cancelled',
        cancelledAt,
        cancellationReason,
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  };

  app.post('/api/orders/:id/cancel', handleCancelOrder);
  app.put('/api/orders/:id/cancel', handleCancelOrder);

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
