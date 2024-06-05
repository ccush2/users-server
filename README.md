# Users Server

This Node.js application provides a backend API for a user management system. It supports features like user registration, login, authentication, shopping cart management, and order processing.

## Features

- User registration and login with JWT based authentication
- User profile management
- Protected API endpoints for authenticated users
- Shopping cart functionality with adding, updating, removing, and clearing cart items
- Integration with Stripe for payment processing (simulated in this example)

## Installation

1. Clone this repository or download the code.
2. Install required dependencies by running `npm install` in the project directory.

## Configuration

- An environment variable named `DB_PATH` is required to specify the path to the JSON file containing user and product data. By default, the application expects a file named `db.json` in the project root directory. You can modify the `server.js` file to set the `DB_PATH` variable directly if needed.

## Running the Server

1. Start the server by running `npm start` in the project directory.
2. The server will listen on port `3001` by default. You can modify the port number in the `server.js` file.

## API Endpoints

- **POST /signup:** Creates a new user account.

  - Request body:
    - `email` (string): User's email address.
    - `username` (string): Unique username for the user.
    - `password` (string): User's password.
    - `firstname` (string): User's first name (optional).
    - `lastname` (string): User's last name (optional).
  - Response:
    - Status code: 201 (Created) on success with the newly created user information.
    - Status code: 400 (Bad Request) if username or email already exists.
    - Status code: 500 (Internal Server Error) in case of any server-side errors.

- **POST /login:** Authenticates a user and generates a JWT token.

  - Request body:
    - `username` (string): User's username.
    - `password` (string): User's password.
  - Response:
    - Status code: 200 (OK) on successful login with user information and JWT token.
    - Status code: 401 (Unauthorized) for invalid username or password.
    - Status code: 500 (Internal Server Error) in case of any server-side errors.

- **GET /api/protected:** A protected endpoint to test authentication middleware. Requires a valid JWT token in the authorization header.

  - Response:
    - Status code: 200 (OK) with a message if authorized.
    - Status code: 401 (Unauthorized) if token is missing or invalid.

- **POST /api/cart:** Adds a product to the user's cart. Requires a valid JWT token in the authorization header.

  - Request body:
    - `productId` (number): ID of the product to add.
    - `quantity` (number): Quantity of the product to add (optional, defaults to 1).
    - `title` (string): Title of the product (optional, for reference).
    - `price` (number): Price of the product (optional, for reference).
    - `image` (string): Image URL of the product (optional, for reference).
  - Response:
    - Status code: 200 (OK) with the updated cart items including details like title, price, and image.

- **GET /api/cart:** Retrieves the user's cart items with details like product title, price, and image. Requires a valid JWT token in the authorization header.

  - Response:
    - Status code: 200 (OK) with an array of cart items including details.
    - Status code: 401 (Unauthorized) if token is missing or invalid.

- **PUT /api/cart/:productId:** Updates the quantity of a product in the user's cart. Requires a valid JWT token in the authorization header.
  - Path parameter:
    - `productId` (number): ID of the product to update the quantity.
  - Request body:
    - `quantity` (number): New quantity for the product.
  - Response:
    - Status code: 200 (OK) with the updated cart items including details.
    - Status code: 401 (Unauthorized) if token is missing or invalid.

* **DELETE /api/cart/:productId:** Removes a product from the user's cart. Requires a valid JWT token in the authorization header.

  - Path parameter:
    - `productId` (number): ID of the product to remove from the cart.
  - Response:
    - Status code: 200 (OK) with the updated cart items including details.
    - Status code: 401 (Unauthorized) if token is missing or invalid.

* **DELETE /api/cart:** Clears the user's cart. Requires a valid JWT token in the authorization header.

  - Response:
    - Status code: 204 (No Content) on successful deletion.
    - Status code: 401 (Unauthorized) if token is missing or invalid.

* **POST /create-payment-intent:** Creates a payment intent using Stripe (simulated in this example). Requires a valid JWT token in the authorization header.

  - Request body:
    - `items` (array): Array of cart items with quantity information.
  - Response:
    - Status code: 200 (OK) with an object containing the `clientSecret` for Stripe payment processing.
    - Status code: 401 (Unauthorized) if token is missing or invalid.

* **GET /api/user:** Retrieves the logged-in user's information. Requires a valid JWT token in the authorization header.

  - Response:
    - Status code: 200 (OK) with the user's information.
    - Status code: 401 (Unauthorized) if token is missing or invalid.
    - Status code: 404 (Not Found) if user is not found.

* **DELETE /api/users/:userId:** Deletes a user account. Requires a valid JWT token in the authorization header and the user trying to delete the account must be the owner.

  - Path parameter:
    - `userId` (string): ID of the user to delete.
  - Response:
    - Status code: 204 (No Content) on successful deletion.
    - Status code: 401 (Unauthorized) if token is missing or invalid.
    - Status code: 404 (Not Found) if user is not found.

* **GET /api/users/:userId:** Retrieves a user's profile information. Requires a valid JWT token in the authorization header and the user trying to access the profile must be the owner or authorized to view it.

  - Path parameter:
    - `userId` (string): ID of the user to get the profile information.
  - Response:
    - Status code: 200 (OK) with the user's profile information.
    - Status code: 401 (Unauthorized) if token is missing or invalid.
    - Status code: 404 (Not Found) if user is not found.

* **POST /logout:** Logs out the user by removing the token from the user's profile. Requires a valid JWT token in the authorization header.
  - Response:
    - Status code: 200 (OK) on successful logout.
    - Status code: 401 (Unauthorized) if token is missing or invalid.

## Testing

Jest is used for unit testing the server-side code. You can run the tests by executing `npm test` in the project directory.
