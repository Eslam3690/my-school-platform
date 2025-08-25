const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
    console.error('❌ خطأ: متغير DATABASE_URL غير موجود.');
    console.error('تأكد من إضافته في إعدادات Variables على Railway.');
    process.exit(1); // Exit the process with an error
}

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test Database Connection
pool.connect()
    .then(client => {
        console.log('✅ تم الاتصال بقاعدة بيانات PostgreSQL بنجاح!');
        client.release();
    })
    .catch(err => {
        console.error('❌ خطأ في الاتصال بقاعدة بيانات PostgreSQL:', err.message);
    });

// Create tables and default admin user if they don't exist
async function setupTables() {
    try {
        const client = await pool.connect();

        // Create the 'users' table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                phone VARCHAR(20) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL
            );
        `;
        await client.query(createTableQuery);

        // Check if a default admin user exists
        const checkAdminQuery = `SELECT * FROM users WHERE phone = '01000000000';`;
        const result = await client.query(checkAdminQuery);

        if (result.rowCount === 0) {
            // Create a default admin user
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const insertAdminQuery = `
                INSERT INTO users (phone, password, role)
                VALUES ($1, $2, $3);
            `;
            await client.query(insertAdminQuery, ['01000000000', hashedPassword, 'admin']);
            console.log('✅ تم إنشاء مستخدم الأدمن الافتراضي بنجاح.');
        } else {
            console.log('✅ مستخدم الأدمن موجود بالفعل.');
        }

        client.release();
    } catch (err) {
        console.error('❌ خطأ في إنشاء الجداول أو المستخدم:', err.message);
    }
}

// Call the setup function when the server starts
setupTables();

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);

        if (result.rowCount > 0) {
            const user = result.rows[0];
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                // If login is successful, send a success response
                return res.json({ success: true, message: 'Login successful', role: user.role });
            }
        }

        // If phone not found or password does not match
        return res.status(401).json({ success: false, message: 'Invalid phone or password' });

    } catch (err) {
        console.error('Error during login:', err.message);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Serve the HTML file based on role
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'loginn.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});