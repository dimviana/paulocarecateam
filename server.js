/**
 * ==============================================================================
 *           Backend Server for Jiu-Jitsu Hub SAAS (server.js)
 * ==============================================================================
 *
 * This single file acts as the complete backend for the application. It uses
 * Express.js to create an API that connects to a MySQL database.
 * This version uses CommonJS (`require`/`module.exports`) for maximum compatibility
 * with PM2 and standard Node.js environments.
 *
 * Features:
 * - RESTful API for all resources (Students, Academies, etc.).
 * - JWT-based authentication for secure endpoints.
 * - Password hashing with bcrypt.
 * - Automatic activity logging for important actions.
 * - Database connection pooling for performance.
 *
 * Assumed NPM dependencies:
 * - express, mysql2, cors, jsonwebtoken, bcryptjs, uuid, dotenv
 *
 * How to Run (in your backend project directory):
 * 1. Ensure you have an .env file configured (based on env.txt).
 * 2. Run 'npm install' to get the dependencies above.
 * 3. Use PM2 to start the server: `pm2 start ecosystem.config.js`
 *
 * ==============================================================================
 */

// --- Dependencies (CommonJS Syntax) ---
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config(); // Automatically loads .env file

// --- Environment Variables ---
const {
  DATABASE_URL,
  JWT_SECRET,
  PORT = 3001
} = process.env;

// --- Express App Initialization ---
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Database Connection ---
let db;
let isDbConnected = false; // Flag to track DB connection status

async function connectToDatabase() {
  try {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not defined.");
    }
    // Configure pool
    const pool = mysql.createPool({ 
        uri: DATABASE_URL, 
        connectionLimit: 10, 
        enableKeepAlive: true, 
        keepAliveInitialDelay: 10000 
    });
    
    // Test connection
    const connection = await pool.getConnection();
    connection.release();
    
    db = pool;
    console.log('Successfully connected to the MySQL database.');
    isDbConnected = true;
  } catch (error) {
    console.error('Failed to connect to the database:', error.message);
    isDbConnected = false;
  }
}

// --- Database Status Middleware ---
app.use('/api', (req, res, next) => {
    if (!isDbConnected) {
        return res.status(503).json({ 
            message: 'Database connection failed.',
            details: 'The server cannot connect to the database. Please check backend logs and .env configuration.'
        });
    }
    next();
});


// --- Helper Functions ---
const logActivity = async (actorId, action, details) => {
  try {
    if (!isDbConnected) return;
    const id = uuidv4();
    const timestamp = new Date();
    await db.query(
      'INSERT INTO activity_logs (id, actorId, action, timestamp, details) VALUES (?, ?, ?, ?, ?)',
      [id, actorId, action, timestamp, details]
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// --- JWT Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// Default theme settings to be used as a fallback
const initialThemeSettings = {
  logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=amber&shade=500',
  systemName: 'Jiu-Jitsu Hub',
  primaryColor: '#f59e0b',
  secondaryColor: '#111827',
  backgroundColor: '#f8fafc',
  cardBackgroundColor: '#ffffff',
  buttonColor: '#f59e0b',
  buttonTextColor: '#ffffff',
  iconColor: '#64748b',
  chartColor1: '#f9a825',
  chartColor2: '#475569',
  useGradient: true,
  reminderDaysBeforeDue: 5,
  overdueDaysAfterDue: 5,
  theme: 'light',
  monthlyFeeAmount: 150,
  publicPageEnabled: true,
  heroHtml: `...`, // Shortened for brevity in defaults, real fetch will get DB values
  aboutHtml: `...`,
  branchesHtml: `...`,
  footerHtml: `...`,
  customCss: `...`,
  customJs: `...`,
  socialLoginEnabled: false,
  googleClientId: '',
  facebookAppId: '',
  pixKey: '',
  pixHolderName: '',
  copyrightText: 'ABILDEVELOPER',
  systemVersion: '1.0.0',
};

// --- API Routers ---
const authRouter = express.Router();
const publicRouter = express.Router();
const apiRouter = express.Router(); // This will be the protected router

// --- Generic API Handlers ---
const handleGet = (tableName) => async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM \`${tableName}\``);
        
        if (tableName === 'class_schedules') {
            const [assistants] = await db.query('SELECT * FROM schedule_assistants');
            for (const row of rows) {
                row.assistantIds = assistants.filter(a => a.scheduleId === row.id).map(a => a.assistantId);
            }
        }
        if (tableName === 'students') {
             const [payments] = await db.query('SELECT * FROM payment_history');
             for (const row of rows) {
                row.paymentHistory = payments.filter(p => p.studentId === row.id);
                if (row.medals && typeof row.medals === 'string') {
                    try {
                        row.medals = JSON.parse(row.medals);
                    } catch (e) {
                        row.medals = { gold: 0, silver: 0, bronze: 0 };
                    }
                }
             }
        }
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: `Failed to fetch from ${tableName}.`, error: error.message });
    }
};

const handleDelete = (tableName) => async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(`DELETE FROM \`${tableName}\` WHERE id = ?`, [id]);
        await logActivity(req.user.userId, `Delete ${tableName}`, `Deleted item with id ${id}`);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: `Failed to delete from ${tableName}.` });
    }
};

// --- Route Definitions ---

// 1. Auth Routes (Public)
authRouter.post('/register', async (req, res) => {
    const { name, address, responsible, responsibleRegistration, email, password } = req.body;
    if (!name || !responsible || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields for registration.' });
    }
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const academyId = uuidv4();
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await connection.query('INSERT INTO academies (id, name, address, responsible, responsibleRegistration, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)', [academyId, name, address, responsible, responsibleRegistration, email, hashedPassword]);
        await connection.query('INSERT INTO users (id, name, email, role, academyId, birthDate) VALUES (?, ?, ?, ?, ?, ?)', [userId, responsible, email, 'academy_admin', academyId, req.body.birthDate || null]);
        
        await logActivity(userId, 'Academy Registration', `Academy "${name}" registered.`);
        await connection.commit();
        const [newAcademy] = await db.query('SELECT * FROM academies WHERE id = ?', [academyId]);
        res.status(201).json(newAcademy[0]);
    } catch (error) {
        await connection.rollback();
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email or another unique field already exists.' });
        res.status(500).json({ message: 'Failed to register academy.' });
    } finally {
        connection.release();
    }
});

authRouter.post('/login', async (req, res) => {
    const { emailOrCpf, pass } = req.body;
    if (!emailOrCpf || !pass) return res.status(400).json({ message: 'Email/CPF e senha são obrigatórios.' });

    try {
        const isEmail = String(emailOrCpf).includes('@');
        let userQuery, userParams;

        if (isEmail) {
            userQuery = 'SELECT * FROM users WHERE email = ?';
            userParams = [emailOrCpf];
        } else {
            const sanitizedCpf = String(emailOrCpf).replace(/[^\d]/g, '');
            userQuery = `SELECT u.* FROM users u JOIN students s ON u.studentId = s.id WHERE s.cpf = ? OR REPLACE(REPLACE(s.cpf, ".", ""), "-", "") = ?`;
            userParams = [emailOrCpf, sanitizedCpf];
        }

        const [users] = await db.query(userQuery, userParams);
        if (users.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });

        const user = users[0];
        let passwordHash = null;

        if (user.role === 'student' && user.studentId) {
            const [students] = await db.query('SELECT password FROM students WHERE id = ?', [user.studentId]);
            if (students.length > 0) passwordHash = students[0].password;
        } else if ((user.role === 'academy_admin' || user.role === 'general_admin') && user.academyId) {
            const [academies] = await db.query('SELECT password FROM academies WHERE id = ?', [user.academyId]);
            if (academies.length > 0) passwordHash = academies[0].password;
        }

        if (!passwordHash || !await bcrypt.compare(pass, passwordHash)) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        await logActivity(user.id, 'Login', 'Usuário logado com sucesso.');
        res.json({ token });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});

// 2. Other Public Routes
publicRouter.get('/users', handleGet('users'));
publicRouter.get('/settings', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        if (rows && rows.length > 0) return res.json(rows[0]);
        res.json(initialThemeSettings);
    } catch (error) {
        console.error('Error fetching settings, serving defaults:', error.message);
        res.json(initialThemeSettings);
    }
});

// 3. Protected API Routes
apiRouter.use(authenticateToken);

// Simple GET routes
apiRouter.get('/students', handleGet('students'));
apiRouter.get('/academies', handleGet('academies'));
apiRouter.get('/news', handleGet('news_articles'));
apiRouter.get('/graduations', handleGet('graduations'));
apiRouter.get('/schedules', handleGet('class_schedules'));
apiRouter.get('/attendance', handleGet('attendance_records'));
apiRouter.get('/professors', handleGet('professors'));
apiRouter.get('/logs', handleGet('activity_logs'));

// Simple DELETE routes
apiRouter.delete('/academies/:id', handleDelete('academies'));
apiRouter.delete('/graduations/:id', handleDelete('graduations'));
apiRouter.delete('/schedules/:id', handleDelete('schedules'));
apiRouter.delete('/attendance/:id', handleDelete('attendance_records'));
apiRouter.delete('/professors/:id', handleDelete('professors'));

// Complex CRUD and Special Routes
const handleSave = (tableName, fields) => async (req, res) => {
    const data = req.body;
    const isNew = !data.id;
    const id = isNew ? uuidv4() : data.id;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        if (isNew) {
            const columns = ['id', ...fields].map(f => `\`${f}\``).join(', ');
            const placeholders = ['?', ...fields.map(() => '?')].join(', ');
            const values = [id, ...fields.map(f => data[f] ?? null)];
            await connection.query(`INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`, values);
        } else {
            const setClause = fields.map(f => `\`${f}\` = ?`).join(', ');
            const values = [...fields.map(f => data[f] ?? null), id];
            await connection.query(`UPDATE \`${tableName}\` SET ${setClause} WHERE id = ?`, values);
        }
        if (tableName === 'class_schedules') {
            await connection.query('DELETE FROM schedule_assistants WHERE scheduleId = ?', [id]);
            if (data.assistantIds?.length > 0) {
                const assistantValues = data.assistantIds.map(assistantId => [id, assistantId]);
                await connection.query('INSERT INTO schedule_assistants (scheduleId, assistantId) VALUES ?', [assistantValues]);
            }
        }
        await connection.commit();
        await logActivity(req.user.userId, `Save ${tableName}`, `${isNew ? 'Created' : 'Updated'} item ${data.name || id}`);
        res.status(isNew ? 201 : 200).json({ id, ...data });
    } catch (error) { await connection.rollback(); res.status(500).json({ message: `Failed to save to ${tableName}`, error: error.message }); } finally { connection.release(); }
};

apiRouter.post('/students', async (req, res) => {
    const data = req.body;
    const studentId = uuidv4();
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('INSERT INTO students (id, name, email, password, birthDate, cpf, fjjpe_registration, phone, address, beltId, academyId, firstGraduationDate, paymentStatus, paymentDueDateDay, stripes, isCompetitor, lastCompetition, medals, imageUrl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [studentId, data.name, data.email, hashedPassword, data.birthDate, data.cpf, data.fjjpe_registration, data.phone, data.address, data.beltId, data.academyId, data.firstGraduationDate, 'unpaid', data.paymentDueDateDay, data.stripes || 0, data.isCompetitor || false, data.lastCompetition || null, JSON.stringify(data.medals || {}), data.imageUrl || null]);
        await connection.query('INSERT INTO users (id, name, email, role, studentId, birthDate) VALUES (?,?,?,?,?,?)', [userId, data.name, data.email, 'student', studentId, data.birthDate]);
        await logActivity(req.user.userId, 'Create Student', `Created student ${data.name}`);
        await connection.commit();
        res.status(201).json({ id: studentId, ...data });
    } catch (error) { await connection.rollback(); res.status(500).json({ message: "Failed to create student", error: error.message }); } finally { connection.release(); }
});
apiRouter.put('/students/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        let queryParams = [data.name, data.email, data.birthDate, data.cpf, data.fjjpe_registration, data.phone, data.address, data.beltId, data.academyId, data.firstGraduationDate, data.lastPromotionDate, data.paymentDueDateDay, data.stripes, data.isCompetitor, data.lastCompetition, JSON.stringify(data.medals || {}), data.imageUrl];
        let setClauses = 'name=?, email=?, birthDate=?, cpf=?, fjjpe_registration=?, phone=?, address=?, beltId=?, academyId=?, firstGraduationDate=?, lastPromotionDate=?, paymentDueDateDay=?, stripes=?, isCompetitor=?, lastCompetition=?, medals=?, imageUrl=?';
        
        if (data.password) {
            setClauses += ', password=?';
            queryParams.push(await bcrypt.hash(data.password, 10));
        }
        queryParams.push(id);
        
        await connection.query(`UPDATE students SET ${setClauses} WHERE id=?`, queryParams);
        await connection.query('UPDATE users SET name=?, email=?, birthDate=? WHERE studentId=?', [data.name, data.email, data.birthDate, id]);
        await logActivity(req.user.userId, 'Update Student', `Updated student ${data.name}`);
        await connection.commit();
        res.status(200).json({ id, ...data });
    } catch (error) { await connection.rollback(); res.status(500).json({ message: "Failed to update student", error: error.message }); } finally { connection.release(); }
});
apiRouter.delete('/students/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM users WHERE studentId = ?', [id]);
    await connection.query('DELETE FROM payment_history WHERE studentId = ?', [id]);
    await connection.query('DELETE FROM attendance_records WHERE studentId = ?', [id]);
    await connection.query('DELETE FROM students WHERE id = ?', [id]);
    await logActivity(req.user.userId, `Delete Student`, `Deleted student with id ${id}`);
    await connection.commit();
    res.status(204).send();
  } catch (error) { await connection.rollback(); res.status(500).json({ message: `Failed to delete student.` }); } finally { connection.release(); }
});
apiRouter.post('/students/:studentId/payment', async (req, res) => {
    const { studentId } = req.params;
    const { status, amount } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE students SET paymentStatus = ? WHERE id = ?', [status, studentId]);
        if (status === 'paid') await connection.query('INSERT INTO payment_history (id, studentId, date, amount) VALUES (?, ?, ?, ?)', [uuidv4(), studentId, new Date(), amount]);
        await logActivity(req.user.userId, 'Update Payment', `Updated payment for student ${studentId} to ${status}`);
        await connection.commit();
        const [[student]] = await db.query('SELECT * FROM students WHERE id = ?', [studentId]);
        const [payments] = await db.query('SELECT * FROM payment_history WHERE studentId = ?', [studentId]);
        student.paymentHistory = payments;
        res.status(200).json(student);
    } catch (error) { await connection.rollback(); res.status(500).json({ message: "Failed to update payment status", error: error.message }); } finally { connection.release(); }
});

apiRouter.post('/academies', handleSave('academies', ['name', 'address', 'responsible', 'responsibleRegistration', 'professorId', 'imageUrl', 'email', 'password']));
apiRouter.put('/academies/:id', handleSave('academies', ['name', 'address', 'responsible', 'responsibleRegistration', 'professorId', 'imageUrl', 'email', 'password']));
apiRouter.post('/professors', handleSave('professors', ['name', 'fjjpe_registration', 'cpf', 'academyId', 'graduationId', 'imageUrl', 'blackBeltDate']));
apiRouter.put('/professors/:id', handleSave('professors', ['name', 'fjjpe_registration', 'cpf', 'academyId', 'graduationId', 'imageUrl', 'blackBeltDate']));
apiRouter.post('/graduations', handleSave('graduations', ['name', 'color', 'minTimeInMonths', 'rank', 'type', 'minAge', 'maxAge']));
apiRouter.put('/graduations/:id', handleSave('graduations', ['name', 'color', 'minTimeInMonths', 'rank', 'type', 'minAge', 'maxAge']));
apiRouter.post('/schedules', handleSave('class_schedules', ['className', 'dayOfWeek', 'startTime', 'endTime', 'professorId', 'academyId', 'requiredGraduationId']));
apiRouter.put('/schedules/:id', handleSave('class_schedules', ['className', 'dayOfWeek', 'startTime', 'endTime', 'professorId', 'academyId', 'requiredGraduationId']));
apiRouter.put('/graduations/ranks', async (req, res) => {
    const gradsWithNewRanks = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const promises = gradsWithNewRanks.map(grad => connection.query('UPDATE graduations SET `rank` = ? WHERE id = ?', [grad.rank, grad.id]));
        await Promise.all(promises);
        await connection.commit();
        await logActivity(req.user.userId, 'Update Ranks', `Reordered graduations.`);
        res.json({ success: true });
    } catch (error) { await connection.rollback(); res.status(500).json({ message: 'Failed to update ranks', error: error.message }); } finally { connection.release(); }
});
apiRouter.post('/attendance', async (req, res) => {
    const record = req.body;
    const id = uuidv4();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM attendance_records WHERE studentId = ? AND scheduleId = ? AND date = ?', [record.studentId, record.scheduleId, record.date]);
        await connection.query('INSERT INTO attendance_records (id, studentId, scheduleId, date, status) VALUES (?,?,?,?,?)', [id, record.studentId, record.scheduleId, record.date, record.status]);
        await connection.commit();
        await logActivity(req.user.userId, 'Save Attendance', `Logged attendance for student ${record.studentId} on ${record.date}`);
        res.status(201).json({ id, ...record });
    } catch(error) { await connection.rollback(); res.status(500).json({ message: "Failed to save attendance", error: error.message }); } finally { connection.release(); }
});
apiRouter.put('/settings', async (req, res) => {
    const { id, ...settingsToUpdate } = req.body;
    try {
        const booleanFields = ['publicPageEnabled', 'useGradient', 'socialLoginEnabled'];
        booleanFields.forEach(field => {
            if (field in settingsToUpdate) settingsToUpdate[field] = settingsToUpdate[field] ? 1 : 0;
        });
        const fields = Object.keys(settingsToUpdate);
        const values = Object.values(settingsToUpdate);
        const setClause = fields.map(field => `\`${field}\` = ?`).join(', ');
        
        await db.query(`UPDATE theme_settings SET ${setClause} WHERE id = 1`, values);
        await logActivity(req.user.userId, 'Update Settings', 'System settings updated.');
        
        const [updatedRows] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        res.json(updatedRows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update settings.', error: error.message });
    }
});


// --- Register Routers with the main app ---
app.use('/api/auth', authRouter);
app.use('/api', publicRouter);
app.use('/api', apiRouter); // All routes here are protected


// --- Server Start ---
(async () => {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (!isDbConnected) {
      console.warn('Warning: Server started, but is NOT connected to the database. API requests will fail.');
    }
  });
})();