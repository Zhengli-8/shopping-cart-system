# Online Shopping Cart System

## 1. Project Title
Online Shopping Cart System

---

## 2. Problem Statement

This website solves the problem of providing users with a simple, secure, and interactive online shopping experience.

Users can browse products, filter products by category, search products in real time, add products to a shopping cart, update item quantities, remove items, and complete a checkout process dynamically without reloading the page.

The system also includes secure user authentication using password hashing and JWT (JSON Web Token). Registered users can log in securely and manage their own shopping cart.

In addition, administrators can access an admin panel to view all registered users and monitor all users’ shopping carts.

This project demonstrates how a full-stack web application can integrate a frontend interface, backend APIs, authentication system, and MySQL database into a single-page shopping platform.

---

## 3. Technical Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

### Styling
- Custom CSS written in `style.css`
- Responsive layout for desktop and mobile screens
- Modern UI with cards, modal windows, gradients, and toast notifications

### Backend / Routing
- Node.js
- Express.js
- REST-style API routes

### Authentication & Security
- Password hashing using `bcryptjs`
- JWT-based authentication using `jsonwebtoken`
- Role-based access control for admin and normal users

### Database
- MySQL
- `mysql2` package for database connection
- Automatic database initialization and product seeding

### Dependencies
- express
- mysql2
- bcryptjs
- jsonwebtoken

### Running Environment
- Local deployment using Node.js and MySQL
- Static frontend files served through Express
- Browser access through:

```text
http://localhost:3000
```

---

## 4. Main Features

### User Authentication
- User registration
- User login
- Password hashing for secure credential storage
- JWT token authentication
- Persistent login using localStorage

### Shopping Cart Features
- Product listing page
- Real-time product search
- Category-based product filtering
- Add products to cart
- Update product quantities
- Remove cart items
- Clear shopping cart
- Checkout confirmation modal

### Admin Features
- View all registered users
- View all users’ shopping carts
- Role-based admin access control

### User Interface Features
- Responsive mobile-friendly design
- Toast notifications for user actions
- Dynamic UI updates without page reload
- Loading animations and modal windows
- Profile modal and dropdown menu

### Database Features
- Automatic database creation
- Automatic product data seeding
- Relational database structure using MySQL

---

## 5. CRUD Operations

This project includes CRUD operations for multiple entities:

### Users
- Create user account
- Read user profile
- Login authentication
- Admin can view all users

### Products
- Create products (admin)
- Read products
- Update products (admin)
- Delete products (admin)

### Shopping Cart
- Add items to cart
- Read cart items
- Update cart quantities
- Delete cart items

---

## 6. Folder Structure

```text
project-folder/
│
├── server.js              # Express server and API routes
├── package.json           # Project dependencies and scripts
├── package-lock.json      # Dependency lock file
├── shopping_cart.sql      # Database schema / SQL export
│
└── public/
    ├── index.html         # Main HTML page structure
    ├── style.css          # CSS styling and responsive layout
    └── app.js             # Frontend JavaScript logic and API requests
```

---

## 7. API Overview

### Authentication APIs
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`

### Product APIs
- GET `/api/products`
- GET `/api/products/:id`
- POST `/api/products`
- PUT `/api/products/:id`
- DELETE `/api/products/:id`

### Shopping Cart APIs
- GET `/api/cart`
- POST `/api/cart`
- PUT `/api/cart/:id`
- DELETE `/api/cart/:id`

### Admin APIs
- GET `/api/admin/users`
- GET `/api/admin/carts`

---

## 8. Database Tables

The application uses the following MySQL tables:

- users
- products
- cart_items

The database also includes:
- Foreign key relationships
- User-based cart ownership
- Automatic timestamps
- Product stock tracking

---

## 9. Challenges Overcome

One challenge in this project was connecting the frontend interface with backend APIs so that product and cart data could be loaded dynamically instead of being hard-coded.

Another challenge was implementing secure user authentication using password hashing and JWT tokens.

Managing MySQL database relationships was also important, especially between users, products, and shopping cart items.

Handling asynchronous requests properly in JavaScript was necessary so that the shopping cart and product list could update without refreshing the page.

Responsive design was another challenge because the interface needed to work correctly on both desktop and mobile devices.

Finally, error handling was added for failed API requests, authentication failures, and cart operations to improve reliability and user experience.

---

## 10. How to Run the Project

### Requirements
- Node.js
- MySQL

### Installation Steps

1. Install dependencies:

```bash
npm install
```

2. Make sure MySQL service is running.

3. Import the database file:

```text
shopping_cart.sql
```

4. Start the server:

```bash
npm start
```

or:

```bash
node server.js
```

5. Open the browser and visit:

```text
http://localhost:3000
```

If PowerShell blocks npm execution on Windows, use:

```bash
npm.cmd start
```

---

## 11. Default Admin Account

The server automatically creates a default admin account:

```text
Username: admin
Password: admin123
```

This account can access the admin panel and manage products and users.

---

## 12. Team Contributions

### Zheng Li
- Backend architecture and API development
- MySQL database design
- JWT authentication system
- Password hashing implementation
- Shopping cart CRUD functionality
- Admin panel implementation
- Database initialization and seeding

### Kunhua Su
- Frontend interface refinement
- Responsive UI design
- Real-time product search implementation
- User experience testing
- Deployment and environment setup
- Documentation and presentation preparation

---

## 13. Notes

This project cannot be opened correctly by directly double-clicking `index.html`.

The application must be started through the Node.js server because the frontend communicates with backend APIs and the MySQL database.

The MySQL database service must be running before starting the server.

Sensitive information such as database passwords and JWT secrets should not be hard-coded in production environments.
