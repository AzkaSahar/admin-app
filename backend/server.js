/*require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');


// Create Express App
const app = express();
const PORT = process.env.PORT || 5000; // Use environment port or fallback to 5000

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // Adjust origin for your frontend
app.use(bodyParser.json());
app.use(
    session({
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: true,
    })
);

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,      // From .env file
    user: process.env.DB_USER,      // From .env file
    password: process.env.DB_PASSWORD, // From .env file
    database: process.env.DB_NAME,  // From .env file
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the database');
});


//// Dashboard Metrics Route
app.get('/api/metrics', async (req, res) => {
    try {
        const totalProductsQuery = 'SELECT COUNT(*) AS totalProducts FROM Product';
        const totalCategoriesQuery = 'SELECT COUNT(*) AS totalCategories FROM Category';
        const totalOrdersQuery = 'SELECT COUNT(*) AS totalOrders FROM Orders';
        const totalCustomersQuery = 'SELECT COUNT(*) AS totalCustomers FROM Customer';

        const [productsResult] = await db.promise().query(totalProductsQuery);
        const [categoriesResult] = await db.promise().query(totalCategoriesQuery);
        const [ordersResult] = await db.promise().query(totalOrdersQuery);
        const [customersResult] = await db.promise().query(totalCustomersQuery);

        res.json({
            totalProducts: productsResult[0].totalProducts,
            totalCategories: categoriesResult[0].totalCategories,
            totalOrders: ordersResult[0].totalOrders,
            totalCustomers: customersResult[0].totalCustomers,
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




// Category Routes
app.get('/api/categories', (req, res) => {
    const query = 'SELECT * FROM Category';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        res.json(results);
    });
});

app.post('/api/categories', (req, res) => {
    const { Title } = req.body;
    const query = 'INSERT INTO Category (Title) VALUES (?)';

    db.query(query, [Title], (err, results) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        res.json({ message: 'Category added successfully', categoryID: results.insertId });
    });
});

app.put('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const { Title } = req.body;
    const query = 'UPDATE Category SET Title = ? WHERE CategoryID = ?';

    db.query(query, [Title, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category updated successfully' });
    });
});

app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Category WHERE CategoryID = ?';

    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted successfully' });
    });
});

//PRODUCT ROUTES
// Get all products
app.get('/api/products', (req, res) => {
    console.log('Received request for /api/products');
    const query = `
        SELECT Product.*, Category.Title AS CategoryName
        FROM Product
        JOIN Category ON Product.CategoryID = Category.CategoryID
        order by product.productid
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        console.log('Products fetched:', results);
        res.json(results);
    });
});


// Add a new product
app.post('/api/products', (req, res) => {
    const {
        Title,
        Model,
        Description,
        Stock,
        CategoryID,
        Manufacturer,
        Features,
        Price,
        ImageURL,
        Rating,
        StockStatus,
        Dimensions,
    } = req.body;

    // Ensure required fields are provided
    if (!Title || !Stock || !CategoryID || !Price) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const query = `
        INSERT INTO Product (Title, Model, Description, Stock, CategoryID, Manufacturer, Features, Price, ImageURL, Rating, StockStatus, Dimensions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
        query,
        [Title, Model, Description, Stock, CategoryID, Manufacturer, Features, Price, ImageURL, Rating, StockStatus, Dimensions],
        (err, results) => {
            if (err) {
                console.error('Error adding product:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            res.json({ message: 'Product added successfully', ProductID: results.insertId });
        }
    );
});

// Update an existing product
app.put('/api/products/:id', (req, res) => {
    const {
        Title,
        Model,
        Description,
        Stock,
        CategoryID,
        Manufacturer,
        Features,
        Price,
        ImageURL,
        Rating,
        StockStatus,
        Dimensions,
    } = req.body;
    const { id } = req.params;

    if (!Title || !Stock || !CategoryID || !Price) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const query = `
        UPDATE Product
        SET Title = ?, Model = ?, Description = ?, Stock = ?, CategoryID = ?, Manufacturer = ?, Features = ?, Price = ?, ImageURL = ?, Rating = ?, StockStatus = ?, Dimensions = ?
        WHERE ProductID = ?
    `;
    db.query(
        query,
        [Title, Model, Description, Stock, CategoryID, Manufacturer, Features, Price, ImageURL, Rating, StockStatus, Dimensions, id],
        (err, results) => {
            if (err) {
                console.error('Error updating product:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            res.json({ message: 'Product updated successfully' });
        }
    );
});

// Delete a product
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM Product WHERE ProductID = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json({ message: 'Product deleted successfully' });
    });
});

//ORDERS ROUTES
// Get all orders
app.get('/api/orders', (req, res) => {
    const query = `
        SELECT 
            Orders.OrderID, 
            Orders.CustomerID, 
            Orders.OrderDate, 
            Orders.OrderStatus, 
            Orders.TotalAmount, 
            Orders.ShippingAddress
        FROM Orders
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});


// Update order status
app.put('/api/orders/:id', (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    const query = `
        UPDATE Orders
        SET OrderStatus = ?
        WHERE OrderID = ?
    `;

    db.query(query, [status, orderId], (err, results) => {
        if (err) {
            console.error('Error updating order status:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.affectedRows > 0) {
            res.json({ message: 'Order status updated successfully.' });
        } else {
            res.status(404).json({ message: 'Order not found.' });
        }
    });
});



// Get all orders with items and prices
app.get('/api/orders', (req, res) => {
    const query = `
        SELECT 
            Orders.OrderID, 
            Orders.CustomerID, 
            Orders.OrderDate, 
            Orders.OrderStatus, 
            Orders.TotalAmount, 
            Orders.ShippingAddress
        FROM Orders
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        // Ensure TotalAmount is returned as a number
        const formattedResults = results.map(order => ({
            ...order,
            TotalAmount: parseFloat(order.TotalAmount), // Convert TotalAmount to a number
            Price: parseFloat(order.Price), // Convert Price to a number
        }));

        console.log('Formatted orders:', formattedResults); // Debugging log
        res.json(formattedResults);
    });
});


// Search orders by customer ID
app.get('/api/orders/search', (req, res) => {
    const { customerId } = req.query;  // Retrieve customerId from the query params
    const query = `
        SELECT 
            Orders.OrderID, 
            Orders.CustomerID, 
            Orders.OrderDate, 
            Orders.OrderStatus, 
            Orders.TotalAmount, 
            Orders.ShippingAddress,
            GROUP_CONCAT(
                CONCAT(OrderItem.ProductID, ':', OrderItem.Quantity, ':', OrderItem.Price)
                ORDER BY OrderItem.ProductID
                SEPARATOR '; '
            ) AS OrderItems
        FROM Orders
        JOIN OrderItem ON Orders.OrderID = OrderItem.OrderID
        WHERE Orders.CustomerID = ?
        GROUP BY Orders.OrderID, Orders.CustomerID, Orders.OrderDate, Orders.OrderStatus, Orders.TotalAmount, Orders.ShippingAddress

    `;

    db.query(query, [customerId], (err, results) => {
        if (err) {
            console.error('Error searching orders:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        // Ensure TotalAmount and Price are returned as numbers
        const formattedResults = results.map(order => ({
            ...order,
            TotalAmount: parseFloat(order.TotalAmount), // Convert TotalAmount to a number
            Price: parseFloat(order.Price), // Convert Price to a number
        }));

        console.log('Formatted orders:', formattedResults); // Debugging log
        res.json(formattedResults);
    });
});


// Get items for a specific order
app.get('/api/orders/:id/items', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT 
            OrderItem.ProductID,
            OrderItem.Quantity,
            OrderItem.Price
        FROM OrderItem
        WHERE OrderItem.OrderID = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching order items:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        // Ensure Price is a number for each item
        const formattedResults = results.map(item => ({
            ...item,
            Price: parseFloat(item.Price), // Convert Price to a number
        }));

        res.json(formattedResults);
    });
});



//CUSTOMERS ROUTES
// Get all customers
app.get('/api/customers', (req, res) => {
    const query = `
        SELECT 
            CustomerID, 
            FirstName, 
            LastName, 
            Email, 
            Address, 
            Phone 
        FROM Customer
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching customers:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});


//REVIEW ROUTES
//get reviews
app.get('/api/reviews', (req, res) => {
    const query = `
        SELECT 
            Review.ReviewID, 
            Customer.FirstName AS CustomerName, 
            Product.Title AS ProductName, 
            Review.Rating, 
            Review.ReviewText, 
            Review.ReviewDate
        FROM Review
        JOIN Customer ON Review.CustomerID = Customer.CustomerID
        JOIN Product ON Review.ProductID = Product.ProductID
        order by review.reviewid
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching reviews:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

//delete review
app.delete('/api/reviews/:id', (req, res) => {
    const reviewId = req.params.id;

    const query = `DELETE FROM Review WHERE ReviewID = ?`;
    db.query(query, [reviewId], (err, results) => {
        if (err) {
            console.error('Error deleting review:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.json({ message: 'Review deleted successfully' });
    });
});


// Start the Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
*/

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');

// Create Express App
const app = express();
const PORT = process.env.PORT || 5000; // Use environment port or fallback to 5000

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // Adjust origin for your frontend
app.use(bodyParser.json());
app.use(
    session({
        secret: 'your_secret_key',
        resave: false,
        saveUninitialized: true,
    })
);

// Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,      // From .env file
    user: process.env.DB_USER,      // From .env file
    password: process.env.DB_PASSWORD, // From .env file
    database: process.env.DB_NAME,  // From .env file
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the database');
});

// Dashboard Metrics Route
app.get('/api/metrics', async (req, res) => {
    try {
        const totalProductsQuery = 'SELECT COUNT(*) AS totalProducts FROM Product';
        const totalCategoriesQuery = 'SELECT COUNT(*) AS totalCategories FROM Category';
        const totalOrdersQuery = 'SELECT COUNT(*) AS totalOrders FROM Orders';
        const totalCustomersQuery = 'SELECT COUNT(*) AS totalCustomers FROM Customer';

        const [productsResult] = await db.promise().query(totalProductsQuery);
        const [categoriesResult] = await db.promise().query(totalCategoriesQuery);
        const [ordersResult] = await db.promise().query(totalOrdersQuery);
        const [customersResult] = await db.promise().query(totalCustomersQuery);

        res.json({
            totalProducts: productsResult[0].totalProducts,
            totalCategories: categoriesResult[0].totalCategories,
            totalOrders: ordersResult[0].totalOrders,
            totalCustomers: customersResult[0].totalCustomers,
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Category Routes
app.get('/api/categories', (req, res) => {
    const query = 'SELECT * FROM Category';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        res.json(results);
    });
});

app.post('/api/categories', (req, res) => {
    const { Title } = req.body;
    const query = 'INSERT INTO Category (Title) VALUES (?)';

    db.query(query, [Title], (err, results) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        res.json({ message: 'Category added successfully', categoryID: results.insertId });
    });
});

app.put('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const { Title } = req.body;
    const query = 'UPDATE Category SET Title = ? WHERE CategoryID = ?';

    db.query(query, [Title, id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category updated successfully' });
    });
});

app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Category WHERE CategoryID = ?';

    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted successfully' });
    });
});

// PRODUCT ROUTES
// Get all products
app.get('/api/products', (req, res) => {
    console.log('Received request for /api/products');
    const query = `
        SELECT Product.*, Category.Title AS CategoryName
        FROM Product
        JOIN Category ON Product.CategoryID = Category.CategoryID
        ORDER BY Product.ProductID
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        console.log('Products fetched:', results);
        res.json(results);
    });
});

// Add a new product
app.post('/api/products', (req, res) => {
    const {
        Title,
        Model,
        Description,
        Stock,
        CategoryID,
        Manufacturer,
        Features,
        Price,
        ImageURL,
        Rating,
        StockStatus,
        Dimensions,
    } = req.body;

    // Ensure required fields are provided
    if (!Title || !Stock || !CategoryID || !Price) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const query = `
        INSERT INTO Product (Title, Model, Description, Stock, CategoryID, Manufacturer, Features, Price, ImageURL, Rating, StockStatus, Dimensions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
        query,
        [Title, Model, Description, Stock, CategoryID, Manufacturer, Features, Price, ImageURL, Rating, StockStatus, Dimensions],
        (err, results) => {
            if (err) {
                console.error('Error adding product:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            res.json({ message: 'Product added successfully', ProductID: results.insertId });
        }
    );
});

// Update an existing product
app.put('/api/products/:id', (req, res) => {
    const {
        Title,
        Model,
        Description,
        Stock,
        CategoryID,
        Manufacturer,
        Features,
        Price,
        ImageURL,
        Rating,
        StockStatus,
        Dimensions,
    } = req.body;
    const { id } = req.params;

    if (!Title || !Stock || !CategoryID || !Price) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const query = `
        UPDATE Product
        SET Title = ?, Model = ?, Description = ?, Stock = ?, CategoryID = ?, Manufacturer = ?, Features = ?, Price = ?, ImageURL = ?, Rating = ?, StockStatus = ?, Dimensions = ?
        WHERE ProductID = ?
    `;
    db.query(
        query,
        [Title, Model, Description, Stock, CategoryID, Manufacturer, Features, Price, ImageURL, Rating, StockStatus, Dimensions, id],
        (err, results) => {
            if (err) {
                console.error('Error updating product:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            res.json({ message: 'Product updated successfully' });
        }
    );
});

// Delete a product
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM Product WHERE ProductID = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json({ message: 'Product deleted successfully' });
    });
});

// ORDERS ROUTES
// Get all orders
app.get('/api/orders', (req, res) => {
    const query = `
        SELECT 
            Orders.OrderID, 
            Orders.CustomerID, 
            Orders.OrderDate, 
            Orders.OrderStatus, 
            Orders.TotalAmount, 
            Orders.ShippingAddress
        FROM Orders
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        // Ensure TotalAmount is returned as a number
        const formattedResults = results.map(order => ({
            ...order,
            TotalAmount: parseFloat(order.TotalAmount), // Convert TotalAmount to a number
        }));

        res.json(formattedResults);
    });
});

// Update order status
app.put('/api/orders/:id', (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    const query = `
        UPDATE Orders
        SET OrderStatus = ?
        WHERE OrderID = ?
    `;

    db.query(query, [status, orderId], (err, results) => {
        if (err) {
            console.error('Error updating order status:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.affectedRows > 0) {
            res.json({ message: 'Order status updated successfully.' });
        } else {
            res.status(404).json({ message: 'Order not found.' });
        }
    });
});

// Get all orders with items and prices
app.get('/api/orders/items', (req, res) => {
    const query = `
        SELECT 
            Orders.OrderID, 
            Orders.CustomerID, 
            Orders.OrderDate, 
            Orders.OrderStatus, 
            Orders.TotalAmount, 
            Orders.ShippingAddress
        FROM Orders
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        // Ensure TotalAmount is returned as a number
        const formattedResults = results.map(order => ({
            ...order,
            TotalAmount: parseFloat(order.TotalAmount), // Convert TotalAmount to a number
        }));

        res.json(formattedResults);
    });
});

// Search orders by customer ID
app.get('/api/orders/search', (req, res) => {
    const { customerId } = req.query;  // Retrieve customerId from the query params
    const query = `
        SELECT 
            Orders.OrderID, 
            Orders.CustomerID, 
            Orders.OrderDate, 
            Orders.OrderStatus, 
            Orders.TotalAmount, 
            Orders.ShippingAddress,
            GROUP_CONCAT(
                CONCAT(OrderItem.ProductID, ':', OrderItem.Quantity, ':', OrderItem.Price)
                ORDER BY OrderItem.ProductID
                SEPARATOR '; '
            ) AS OrderItems
        FROM Orders
        JOIN OrderItem ON Orders.OrderID = OrderItem.OrderID
        WHERE Orders.CustomerID = ?
        GROUP BY Orders.OrderID, Orders.CustomerID, Orders.OrderDate, Orders.OrderStatus, Orders.TotalAmount, Orders.ShippingAddress
    `;
    db.query(query, [customerId], (err, results) => {
        if (err) {
            console.error('Error searching orders:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        // Ensure TotalAmount and Price are returned as numbers
        const formattedResults = results.map(order => ({
            ...order,
            TotalAmount: parseFloat(order.TotalAmount), // Convert TotalAmount to a number
        }));

        res.json(formattedResults);
    });
});

// Get items for a specific order
app.get('/api/orders/:id/items', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT 
            OrderItem.ProductID,
            OrderItem.Quantity,
            OrderItem.Price
        FROM OrderItem
        WHERE OrderItem.OrderID = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching order items:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        // Ensure Price is a number for each item
        const formattedResults = results.map(item => ({
            ...item,
            Price: parseFloat(item.Price), // Convert Price to a number
        }));

        res.json(formattedResults);
    });
});

// CUSTOMERS ROUTES
// Get all customers
app.get('/api/customers', (req, res) => {
    const query = `
        SELECT 
            CustomerID, 
            FirstName, 
            LastName, 
            Email, 
            Address, 
            Phone 
        FROM Customer
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching customers:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

// REVIEWS ROUTES
// Get reviews
app.get('/api/reviews', (req, res) => {
    const query = `
        SELECT 
            Review.ReviewID, 
            Customer.FirstName AS CustomerName, 
            Product.Title AS ProductName, 
            Review.Rating, 
            Review.ReviewText, 
            Review.ReviewDate
        FROM Review
        JOIN Customer ON Review.CustomerID = Customer.CustomerID
        JOIN Product ON Review.ProductID = Product.ProductID
        ORDER BY Review.ReviewID
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching reviews:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

// Delete review
app.delete('/api/reviews/:id', (req, res) => {
    const reviewId = req.params.id;

    const query = `DELETE FROM Review WHERE ReviewID = ?`;
    db.query(query, [reviewId], (err, results) => {
        if (err) {
            console.error('Error deleting review:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.json({ message: 'Review deleted successfully' });
    });
});


// Start the Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
