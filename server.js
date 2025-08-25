// استدعاء المكتبات الضرورية
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs'); // مكتبة لتشفير كلمات المرور
const { Pool } = require('pg'); // مكتبة PostgreSQL

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
// لضمان عمل الكود مع Railway، نستخدم مسار الوصول إلى المجلد
app.use(express.static(path.join(__dirname, 'public')));

// إعداد الاتصال بقاعدة البيانات
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// الاتصال بقاعدة البيانات والتأكد من أنها جاهزة
pool.connect((err) => {
    if (err) {
        console.error('❌ خطأ في الاتصال بقاعدة بيانات PostgreSQL:', err.message);
        return;
    }
    console.log('✅ تم الاتصال بقاعدة بيانات PostgreSQL بنجاح.');
});

// دالة لإنشاء الجداول وإضافة مستخدم أدمن افتراضي
async function setupTables() {
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL,
            student_phone TEXT UNIQUE NOT NULL,
            parent_phone TEXT,
            governorate TEXT,
            grade_level TEXT,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        );
    `;
    const createCoursesTable = `
        CREATE TABLE IF NOT EXISTS courses (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            image_url TEXT
        );
    `;
    try {
        await pool.query(createUsersTable);
        await pool.query(createCoursesTable);
        console.log('✅ تم إنشاء الجداول بنجاح.');

        const res = await pool.query(`SELECT id FROM users WHERE role = 'admin'`);
        if (res.rowCount === 0) {
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            await pool.query(`INSERT INTO users (username, student_phone, password, role) VALUES ($1, $2, $3, $4)`,
                ['Admin User', '01000000000', hashedPassword, 'admin']);
            console.log('✅ تم إنشاء مستخدم أدمن افتراضي.');
        }
    } catch (err) {
        console.error('❌ خطأ في إنشاء الجداول:', err.message);
    }
}
setupTables();

// API Endpoints
// ------------------------------------
// تسجيل دخول المستخدم
// ------------------------------------
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;

    try {
        const userRes = await pool.query('SELECT * FROM users WHERE student_phone = $1', [phone]);
        const user = userRes.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة.' });
        }

        // مقارنة كلمة المرور المشفرة
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة.' });
        }

        if (user.role === 'admin') {
            return res.status(200).json({ message: 'تم تسجيل الدخول بنجاح.', user: { role: 'admin' } });
        } else {
            return res.status(200).json({ message: 'تم تسجيل الدخول بنجاح كطالب.', user: { role: 'student' } });
        }

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'فشل الاتصال بالسيرفر.' });
    }
});

// ------------------------------------
// تسجيل مستخدم جديد (طالب / ولي أمر)
// ------------------------------------
app.post('/api/signup', async (req, res) => {
    const { username, student_phone, parent_phone, governorate, grade_level, password, role } = req.body;
    const userRole = role || 'student';
    
    if (!username || !student_phone || !password) {
        return res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم ورقم الهاتف وكلمة المرور.' });
    }

    try {
        // تشفير كلمة المرور قبل الحفظ
        const hashedPassword = bcrypt.hashSync(password, 10);

        await pool.query(`INSERT INTO users (username, student_phone, parent_phone, governorate, grade_level, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [username, student_phone, parent_phone, governorate, grade_level, hashedPassword, userRole]);
            
        res.status(201).json({ message: 'تم إنشاء الحساب بنجاح.' });
    } catch (err) {
        if (err.message.includes('unique constraint')) {
            return res.status(409).json({ error: 'رقم الهاتف هذا مسجل بالفعل.' });
        }
        return res.status(500).json({ error: err.message });
    }
});


// ------------------------------------
// APIs لإدارة الطلاب (Admin)
// ------------------------------------
app.get('/api/admin/students', async (req, res) => {
    try {
        const result = await pool.query(`SELECT id, username, student_phone, parent_phone, governorate, grade_level FROM users WHERE role = 'student' OR role = 'parent'`);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/students/:id', async (req, res) => {
    const studentId = req.params.id;
    try {
        const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [studentId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'المستخدم غير موجود.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/students/:id', async (req, res) => {
    const studentId = req.params.id;
    const { username, student_phone, parent_phone, governorate, grade_level, password } = req.body;
    let params = [username, student_phone, parent_phone, governorate, grade_level, studentId];
    let query = `UPDATE users SET username = $1, student_phone = $2, parent_phone = $3, governorate = $4, grade_level = $5 WHERE id = $6`;
    
    try {
        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            query = `UPDATE users SET username = $1, student_phone = $2, parent_phone = $3, governorate = $4, grade_level = $5, password = $6 WHERE id = $7`;
            params = [username, student_phone, parent_phone, governorate, grade_level, hashedPassword, studentId];
        }
        const result = await pool.query(query, params);
        res.status(200).json({ message: 'تم تحديث بيانات المستخدم بنجاح.', changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/students/:id', async (req, res) => {
    const studentId = req.params.id;
    try {
        const result = await pool.query(`DELETE FROM users WHERE id = $1`, [studentId]);
        res.status(200).json({ message: 'تم حذف المستخدم بنجاح.', changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ------------------------------------
// APIs لإدارة الدورات (Admin)
// ------------------------------------
app.get('/api/courses', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM courses`);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/courses/:id', async (req, res) => {
    const courseId = req.params.id;
    try {
        const result = await pool.query(`SELECT * FROM courses WHERE id = $1`, [courseId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'الدورة غير موجودة.' });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/add-course', async (req, res) => {
    const { title, description, price, image_url } = req.body;
    if (!title || !price) {
        return res.status(400).json({ error: 'الرجاء إدخال اسم الدورة والسعر.' });
    }
    try {
        const result = await pool.query(`INSERT INTO courses (title, description, price, image_url) VALUES ($1, $2, $3, $4) RETURNING *`,
            [title, description, price, image_url]);
        res.status(201).json({ message: 'تمت إضافة الدورة بنجاح.', courseId: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/courses/:id', async (req, res) => {
    const courseId = req.params.id;
    const { title, description, price, image_url } = req.body;
    try {
        const result = await pool.query(`UPDATE courses SET title = $1, description = $2, price = $3, image_url = $4 WHERE id = $5`,
            [title, description, price, image_url, courseId]);
        res.status(200).json({ message: 'تم تحديث بيانات الدورة بنجاح.', changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/courses/:id', async (req, res) => {
    const courseId = req.params.id;
    try {
        const result = await pool.query(`DELETE FROM courses WHERE id = $1`, [courseId]);
        res.status(200).json({ message: 'تم حذف الدورة بنجاح.', changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ------------------------------------
// التعامل مع الصفحات الرئيسية
// ------------------------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'loginn.html'));
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});