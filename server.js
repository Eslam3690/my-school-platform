const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Setup
const db = new sqlite3.Database('platform.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            student_phone TEXT UNIQUE NOT NULL,
            parent_phone TEXT,
            governorate TEXT,
            grade_level TEXT,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table ready.');
                // Create a default admin user
                db.get(`SELECT id FROM users WHERE role = 'admin'`, (err, row) => {
                    if (err) {
                        console.error('Error checking for admin user:', err.message);
                        return;
                    }
                    if (!row) {
                        db.run(`INSERT INTO users (username, student_phone, password, role) VALUES (?, ?, ?, ?)`,
                            ['Admin User', '01000000000', 'admin123', 'admin'],
                            (err) => {
                                if (err) {
                                    console.error('Error creating default admin:', err.message);
                                } else {
                                    console.log('Default admin user created.');
                                }
                            });
                    }
                });
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            image_url TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating courses table:', err.message);
            } else {
                console.log('Courses table ready.');
            }
        });
    }
});

// API Endpoints

// ------------------------------------
// تسجيل دخول المستخدم
// ------------------------------------
app.post('/api/login', (req, res) => {
    const { phone, password } = req.body;
    db.get(`SELECT * FROM users WHERE student_phone = ? AND password = ?`, [phone, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة.' });
        }
        res.status(200).json({ message: 'تم تسجيل الدخول بنجاح.', user: row });
    });
});

// ------------------------------------
// تسجيل مستخدم جديد (طالب / ولي أمر)
// ------------------------------------
app.post('/api/signup', (req, res) => {
    const { username, student_phone, parent_phone, governorate, grade_level, password, role } = req.body;
    const userRole = role || 'student';
    
    if (!username || !student_phone || !password) {
        return res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم ورقم الهاتف وكلمة المرور.' });
    }

    db.run(`INSERT INTO users (username, student_phone, parent_phone, governorate, grade_level, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [username, student_phone, parent_phone, governorate, grade_level, password, userRole],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'رقم الهاتف هذا مسجل بالفعل.' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'تم إنشاء الحساب بنجاح.', userId: this.lastID });
        });
});


// ------------------------------------
// APIs لإدارة الطلاب (Admin)
// ------------------------------------
app.get('/api/admin/students', (req, res) => {
    db.all(`SELECT id, username, student_phone, parent_phone, governorate, grade_level FROM users WHERE role = 'student' OR role = 'parent'`, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});

app.get('/api/admin/students/:id', (req, res) => {
    const studentId = req.params.id;
    db.get(`SELECT * FROM users WHERE id = ?`, [studentId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'المستخدم غير موجود.' });
        }
        res.status(200).json(row);
    });
});

app.put('/api/admin/students/:id', (req, res) => {
    const studentId = req.params.id;
    const { username, student_phone, parent_phone, governorate, grade_level, password } = req.body;
    db.run(`UPDATE users SET username = ?, student_phone = ?, parent_phone = ?, governorate = ?, grade_level = ? ${password ? ', password = ?' : ''} WHERE id = ?`,
        password ? [username, student_phone, parent_phone, governorate, grade_level, password, studentId] : [username, student_phone, parent_phone, governorate, grade_level, studentId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ message: 'تم تحديث بيانات المستخدم بنجاح.', changes: this.changes });
        });
});

app.delete('/api/admin/students/:id', (req, res) => {
    const studentId = req.params.id;
    db.run(`DELETE FROM users WHERE id = ?`, studentId, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'تم حذف المستخدم بنجاح.', changes: this.changes });
    });
});


// ------------------------------------
// APIs لإدارة الدورات (Admin)
// ------------------------------------
app.get('/api/courses', (req, res) => {
    db.all(`SELECT * FROM courses`, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});

app.get('/api/courses/:id', (req, res) => {
    const courseId = req.params.id;
    db.get(`SELECT * FROM courses WHERE id = ?`, [courseId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'الدورة غير موجودة.' });
        }
        res.status(200).json(row);
    });
});

app.post('/api/admin/add-course', (req, res) => {
    const { title, description, price, image_url } = req.body;
    if (!title || !price) {
        return res.status(400).json({ error: 'الرجاء إدخال اسم الدورة والسعر.' });
    }
    db.run(`INSERT INTO courses (title, description, price, image_url) VALUES (?, ?, ?, ?)`,
        [title, description, price, image_url],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'تمت إضافة الدورة بنجاح.', courseId: this.lastID });
        });
});

app.put('/api/admin/courses/:id', (req, res) => {
    const courseId = req.params.id;
    const { title, description, price, image_url } = req.body;
    db.run(`UPDATE courses SET title = ?, description = ?, price = ?, image_url = ? WHERE id = ?`,
        [title, description, price, image_url, courseId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ message: 'تم تحديث بيانات الدورة بنجاح.', changes: this.changes });
        });
});

app.delete('/api/admin/courses/:id', (req, res) => {
    const courseId = req.params.id;
    db.run(`DELETE FROM courses WHERE id = ?`, courseId, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'تم حذف الدورة بنجاح.', changes: this.changes });
    });
});


// ------------------------------------
// التعامل مع الصفحات الرئيسية
// ------------------------------------
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'loginn.html'));
});

// Server listener
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});