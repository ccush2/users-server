const jsonServer = require("json-server");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const stripe = require("stripe")(
  "sk_test_51P6zb0RqzXc9w0BmVo5ZdyOU46Nf0SxQCa7nEZES029WVrrbtEH7oxutcRy9POZDIMV4W0IYW3D0oVjjbsasC5RM00OlGhwHje"
);

const server = jsonServer.create();
const router = jsonServer.router("./db.json");
const middlewares = jsonServer.defaults();

const SECRET_KEY = "Th1s1sAS3cr3tK3yF0rS1gn1ngJWTs";
const PORT = 3001;

server.use(middlewares);
server.use(jsonServer.bodyParser);
server.use(express.static("public"));
server.use(express.json());

/**
 * Authentication middleware to verify the JWT token.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Authorization token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = jwt.verify(token, SECRET_KEY);
    const username = decodedToken.username;
    const user = router.db.get("users").find({ username }).value();

    if (!user || user.token !== token) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * Login endpoint to authenticate user credentials and generate a JWT token.
 */
server.post("/login", (req, res) => {
  const { username, password } = req.body;

  const db = router.db;
  const user = db
    .get("users")
    .find((user) => user.username === username)
    .value();

  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  bcrypt.compare(password, user.password, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }

    if (!result) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign({ username: user.username }, SECRET_KEY);
    db.get("users").find({ username: user.username }).assign({ token }).write();
    res.json({ token, id: user.id, username: user.username });
  });
});

/**
 * Signup endpoint to create a new user account.
 */
server.post("/signup", (req, res) => {
  const { email, username, password, firstname, lastname } = req.body;
  const db = router.db;
  const existingUser = db
    .get("users")
    .find((user) => user.username === username || user.email === email)
    .value();

  if (existingUser) {
    return res.status(400).json({ error: "Username or email already exists" });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      username,
      password: hashedPassword,
      name: {
        firstname,
        lastname,
      },
      cart: [],
    };

    db.get("users").push(newUser).write();
    res.status(201).json({ message: "User created successfully" });
  });
});

/**
 * Add a product to the user's cart.
 */
server.post("/api/cart", authMiddleware, (req, res) => {
  const { productId, quantity, title, price, image } = req.body;
  const userId = req.user.id;
  const db = router.db;

  const product = db.get("products").find({ id: productId }).value();

  if (!product) {
    const newProduct = {
      id: productId,
      title: title,
      price: price,
      image: image,
    };
    db.get("products").push(newProduct).write();
  }

  const existingCartItem = db
    .get("users")
    .find({ id: userId })
    .get("cart")
    .find({ productId })
    .value();

  if (existingCartItem) {
    db.get("users")
      .find({ id: userId })
      .get("cart")
      .find({ productId })
      .assign({ quantity })
      .write();
  } else {
    const newCartItem = { productId, quantity };
    db.get("users").find({ id: userId }).get("cart").push(newCartItem).write();
  }

  const updatedCartItems = db
    .get("users")
    .find({ id: userId })
    .get("cart")
    .value();

  res.json(updatedCartItems);
});

/**
 * Get the user's cart items with product details.
 */
server.get("/api/cart", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const db = router.db;

  const user = db.get("users").find({ id: userId }).value();
  const cartItems = user.cart;

  const cartItemsWithDetails = cartItems.map((item) => {
    const product = db.get("products").find({ id: item.productId }).value();
    return {
      ...item,
      title: product.title,
      price: product.price,
      image: product.image,
    };
  });

  res.json(cartItemsWithDetails);
});

/**
 * Update the quantity of a product in the user's cart.
 */
server.put("/api/cart/:productId", authMiddleware, (req, res) => {
  const productId = parseInt(req.params.productId);
  const { quantity } = req.body;
  const userId = req.user.id;
  const db = router.db;

  db.get("users")
    .find({ id: userId })
    .get("cart")
    .find({ productId })
    .assign({ quantity })
    .write();

  const updatedCartItems = db
    .get("users")
    .find({ id: userId })
    .get("cart")
    .value();

  const updatedCartItemsWithDetails = updatedCartItems.map((item) => {
    const product = db.get("products").find({ id: item.productId }).value();
    return {
      ...item,
      title: product.title,
      price: product.price,
      image: product.image,
    };
  });

  res.json(updatedCartItemsWithDetails);
});

/**
 * Remove a product from the user's cart.
 */
server.delete("/api/cart/:productId", authMiddleware, (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;
  const db = router.db;

  db.get("users")
    .find({ id: userId })
    .get("cart")
    .remove({ productId: parseInt(productId) })
    .write();

  const updatedCartItems = db
    .get("users")
    .find({ id: userId })
    .get("cart")
    .value();

  const updatedCartItemsWithDetails = updatedCartItems.map((item) => {
    const product = db.get("products").find({ id: item.productId }).value();
    return {
      ...item,
      title: product.title,
      price: product.price,
      image: product.image,
    };
  });

  res.json(updatedCartItemsWithDetails);
});

/**
 * Clear the user's cart.
 */
server.delete("/api/cart", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const db = router.db;

  db.get("users").find({ id: userId }).assign({ cart: [] }).write();

  res.sendStatus(204);
});

/**
 * Calculate the order amount for Stripe payment.
 * @param {Object[]} items - The cart items.
 * @returns {number} - The calculated order amount.
 */
const calculateOrderAmount = (items) => {
  return 1400;
};

/**
 * Create a payment intent using Stripe.
 */
server.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.json({ clientSecret: paymentIntent.client_secret });
});

/**
 * Delete a user account.
 */
server.delete("/api/users/:userId", authMiddleware, (req, res) => {
  const userId = req.params.userId;
  const db = router.db;

  db.get("users").remove({ id: userId }).write();

  res.sendStatus(204);
});

/**
 * Get user profile information.
 */
server.get("/api/users/:userId", authMiddleware, (req, res) => {
  const userId = req.params.userId;
  const db = router.db;

  const user = db.get("users").find({ id: userId }).value();

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

/**
 * Logout the user by removing the token from the user's profile.
 */
server.post("/logout", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const db = router.db;

  db.get("users").find({ id: userId }).assign({ token: null }).write();

  res.sendStatus(200);
});

server.use(router);

server.listen(PORT, () => {
  console.log(`Mock server is running on port ${PORT}`);
});
