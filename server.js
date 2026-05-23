// ========================================
// Module imports and server setup
// 模块导入与服务器基础配置
// ========================================
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

app.use(express.json());


let dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'shopping_cart',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function initializeDatabase() {
  try {
    const initPool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      waitForConnections: true,
      connectionLimit: 2
    });

    const initConn = await initPool.getConnection();
    await initConn.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    initConn.release();
    await initPool.end();

    // Now connect to the database
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log('Database connected');

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add missing columns to existing users table
    try {
      const [cols] = await connection.query(`SHOW COLUMNS FROM users LIKE 'password'`);
      if (cols.length === 0) {
        await connection.query(`ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT ''`);
      }
    } catch (e) { /* ignore */ }
    try {
      const [cols] = await connection.query(`SHOW COLUMNS FROM users LIKE 'role'`);
      if (cols.length === 0) {
        await connection.query(`ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'`);
      }
    } catch (e) { /* ignore */ }

    // Create products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(500),
        category VARCHAR(100),
        stock INT DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create cart_items table with user_id
    // Drop and recreate if schema is incompatible
    try {
      const [cols] = await connection.query(`SHOW COLUMNS FROM cart_items LIKE 'user_id'`);
      if (cols.length === 0) {
        await connection.query(`DROP TABLE IF EXISTS cart_items`);
      }
    } catch (e) { /* table may not exist */ }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product (user_id, product_id)
      )
    `);

    // Create default admin user
    await createDefaultAdmin(connection);

    await seedProducts(connection);

    connection.release();
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    console.log('Please make sure MySQL is running and the database exists');
    process.exit(1);
  }
}

// ========================================
// Create default admin user
// 创建默认管理员账户
// ========================================
async function createDefaultAdmin(connection) {
  const [admins] = await connection.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
  if (admins.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(
      "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
      ['admin', 'admin@example.com', hashedPassword, 'admin']
    );
    console.log('Default admin created: admin / admin123');
  } else {
    // Ensure admin has the correct password
    const admin = admins[0];
    const defaultHash = await bcrypt.hash('admin123', 10);
    // Check if password needs update (for existing admins from old schema)
    if (!admin.password_hash || admin.password_hash === '' || admin.password_hash.length < 20) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query("UPDATE users SET password_hash = ? WHERE role = 'admin'", [hashedPassword]);
      console.log('Admin password updated to: admin123');
    }
  }
}

// ========================================
// Product seeding
// 商品初始数据写入
// ========================================
async function seedProducts(connection) {
  const [existing] = await connection.query('SELECT COUNT(*) as count FROM products');
  if (existing[0].count > 0) {
    console.log('Products already exist, skipping seed');
    return;
  }

  const products = [
    ['iPhone 15 Pro', 'Latest Apple phone with A17 Pro chip, titanium design', 8999.00, 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=400&fit=crop', 'Electronics'],
    ['MacBook Pro 14', 'M3 Pro chip, 18-hour battery life', 14999.00, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop', 'Electronics'],
    ['AirPods Pro 2', 'Active noise cancellation, spatial audio', 1899.00, 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop', 'Electronics'],
    ['iPad Pro 12.9', 'M2 chip, Liquid Retina XDR display', 9999.00, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop', 'Electronics'],
    ['Apple Watch Ultra 2', 'Professional sports watch, 100m water resistant', 5999.00, 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop', 'Electronics'],
    ['Nike Air Max 270', 'Classic sneakers with comfortable cushioning', 1299.00, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Clothing'],
    ['Adidas Ultraboost', 'Running shoes with Boost technology', 1599.00, 'https://images.unsplash.com/photo-1491553895911-0055uj66ef46?w=400&h=400&fit=crop', 'Clothing'],
    ['Levi\'s 501 Jeans', 'Classic straight fit, premium denim', 599.00, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop', 'Clothing'],
    ['The North Face Jacket', 'Gore-Tex waterproof breathable fabric', 2999.00, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop', 'Clothing'],
    ['Dyson Hair Dryer', 'Smart temperature control, fast drying', 2990.00, 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400&h=400&fit=crop', 'Home Appliances'],
    ['Xiaomi Robot Vacuum', 'Laser navigation, smart obstacle avoidance', 1999.00, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop', 'Home Appliances'],
    ['Philips Air Purifier', 'Removes formaldehyde and PM2.5', 1499.00, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop', 'Home Appliances']
  ];

  for (const product of products) {
    await connection.query(
      'INSERT INTO products (name, description, price, image, category) VALUES (?, ?, ?, ?, ?)',
      product
    );
  }
  console.log('Product data updated');
}

// ========================================
// JWT Authentication Middleware
// JWT 认证中间件
// ========================================
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// ========================================
// Admin Middleware
// 管理员中间件
// ========================================
function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

// ========================================
// Authentication APIs
// 身份验证接口
// ========================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 'user']
    );

    // Generate token
    const token = jwt.sign(
      { id: result.insertId, username, email, role: 'user' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        id: result.insertId,
        username,
        email,
        role: 'user',
        token
      }
    });
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Find user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error('Get user failed:', error);
    res.status(500).json({ success: false, message: 'Failed to get user info' });
  }
});

// ========================================
// Product management APIs
// 商品管理接口
// ========================================
app.get('/api/products', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY id';

    const [products] = await pool.query(query, params);
    const formattedProducts = products.map(p => ({
      ...p,
      price: parseFloat(p.price)
    }));
    res.json({ success: true, data: formattedProducts });
  } catch (error) {
    console.error('[SERVER] Failed to get products:', error);
    res.status(500).json({ success: false, message: 'Failed to get products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: products[0] });
  } catch (error) {
    console.error('Failed to get product:', error);
    res.status(500).json({ success: false, message: 'Failed to get product' });
  }
});

app.post('/api/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, price, image, category, stock } = req.body;
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, image, category, stock || 100]
    );
    const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newProduct[0] });
  } catch (error) {
    console.error('Failed to create product:', error);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

app.put('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, price, image, category, stock } = req.body;
    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, image = ?, category = ?, stock = ? WHERE id = ?',
      [name, description, price, image, category, stock, req.params.id]
    );
    const [updatedProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updatedProduct[0] });
  } catch (error) {
    console.error('Failed to update product:', error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Failed to delete product:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

// ========================================
// Shopping cart APIs (user-specific)
// 购物车接口（基于用户）
// ========================================
app.get('/api/cart', authMiddleware, async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [req.user.id]);

    const formattedItems = items.map(item => ({
      ...item,
      price: parseFloat(item.price)
    }));
    res.json({ success: true, data: formattedItems });
  } catch (error) {
    console.error('Failed to get cart:', error);
    res.status(500).json({ success: false, message: 'Failed to get cart' });
  }
});

app.post('/api/cart', authMiddleware, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const [existing] = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existing.length > 0) {
      const newQuantity = existing[0].quantity + quantity;
      await pool.query(
        'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
        [newQuantity, req.user.id, product_id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [req.user.id, product_id, quantity]
      );
    }

    const [items] = await pool.query(`
      SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ? AND ci.product_id = ?
    `, [req.user.id, product_id]);

    const item = { ...items[0], price: parseFloat(items[0].price) };
    res.status(201).json({ success: true, data: item, message: 'Added to cart' });
  } catch (error) {
    console.error('Failed to add to cart:', error);
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
});

app.put('/api/cart/:id', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;

    // Verify ownership
    const [cartItems] = await pool.query(
      'SELECT * FROM cart_items WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    if (quantity <= 0) {
      await pool.query('DELETE FROM cart_items WHERE id = ?', [req.params.id]);
      return res.json({ success: true, message: 'Item removed from cart', removed: true });
    }

    await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, req.params.id]);

    const [item] = await pool.query(`
      SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image, p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.id = ?
    `, [req.params.id]);

    const formattedItem = { ...item[0], price: parseFloat(item[0].price) };
    res.json({ success: true, data: formattedItem });
  } catch (error) {
    console.error('Failed to update cart:', error);
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
});

app.delete('/api/cart/:id', authMiddleware, async (req, res) => {
  try {
    // Verify ownership
    const [cartItems] = await pool.query(
      'SELECT * FROM cart_items WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    await pool.query('DELETE FROM cart_items WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Failed to remove from cart:', error);
    res.status(500).json({ success: false, message: 'Failed to remove' });
  }
});

app.delete('/api/cart', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error('Failed to clear cart:', error);
    res.status(500).json({ success: false, message: 'Failed to clear' });
  }
});

// ========================================
// Admin: View all users' carts
// 管理员：查看所有用户的购物车
// ========================================
app.get('/api/admin/carts', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [carts] = await pool.query(`
      SELECT 
        u.id as user_id,
        u.username,
        u.email,
        ci.id as cart_item_id,
        ci.quantity,
        p.id as product_id,
        p.name as product_name,
        p.price,
        p.image,
        ci.created_at
      FROM users u
      JOIN cart_items ci ON u.id = ci.user_id
      JOIN products p ON ci.product_id = p.id
      ORDER BY u.id, ci.created_at DESC
    `);

    // Group by user
    const userCarts = {};
    carts.forEach(row => {
      if (!userCarts[row.user_id]) {
        userCarts[row.user_id] = {
          user_id: row.user_id,
          username: row.username,
          email: row.email,
          items: [],
          total: 0
        };
      }
      const price = parseFloat(row.price);
      userCarts[row.user_id].items.push({
        cart_item_id: row.cart_item_id,
        product_id: row.product_id,
        product_name: row.product_name,
        price: price,
        image: row.image,
        quantity: row.quantity,
        subtotal: price * row.quantity,
        added_at: row.created_at,
        updated_at: row.updated_at
      });
      userCarts[row.user_id].total += price * row.quantity;
    });

    const result = Object.values(userCarts).map(user => ({
      ...user,
      total: parseFloat(user.total.toFixed(2))
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to get all carts:', error);
    res.status(500).json({ success: false, message: 'Failed to get users carts' });
  }
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT id, username, email, role, created_at,
             (SELECT SUM(ci.quantity * p.price) 
              FROM cart_items ci 
              JOIN products p ON ci.product_id = p.id 
              WHERE ci.user_id = users.id) as cart_total,
             (SELECT COUNT(*) FROM cart_items WHERE user_id = users.id) as cart_items_count
      FROM users
      ORDER BY created_at DESC
    `);

    const formattedUsers = users.map(u => ({
      ...u,
      cart_total: u.cart_total ? parseFloat(u.cart_total) : 0
    }));

    res.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error('Failed to get users:', error);
    res.status(500).json({ success: false, message: 'Failed to get users' });
  }
});

// ========================================
// Static file hosting and server startup
// 静态资源托管与服务器启动
// ========================================
app.use(express.static(path.join(__dirname, 'public')));

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`
========================================
Server running at: http://localhost:${PORT}
========================================
Default admin credentials:
  Username: admin
  Password: admin123
========================================
    `);
  });
});
