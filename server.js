
/**
 * ==============================================================================
 *           Backend Server for Jiu-Jitsu Hub SAAS (server.js)
 * ==============================================================================
 */

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// --- Environment Variables ---
const {
  DATABASE_URL,
  JWT_SECRET,
  PORT = 3001
} = process.env;

if (!JWT_SECRET) {
    console.warn("WARNING: JWT_SECRET not found in .env. Using unsafe default for development only.");
}

// --- Express App Initialization ---
const app = express();

// Create separate routers for public and protected routes to avoid middleware conflicts
const publicApiRouter = express.Router();
const protectedApiRouter = express.Router();

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Database Connection ---
let db;
let isDbConnected = false;

async function connectToDatabase() {
  try {
    if (!DATABASE_URL) throw new Error("DATABASE_URL environment variable is not defined.");
    const pool = mysql.createPool(DATABASE_URL);
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

// --- Database Status Middleware (Applied to all /api routes) ---
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

// --- Helper to Find User by Email ---
const findUserByEmail = async (email) => {
    // 1. Try Admin (Academies)
    const [academies] = await db.query('SELECT * FROM academies WHERE email = ?', [email]);
    if (academies.length > 0) {
        const academy = academies[0];
        // Check if this academy has a specific user entry, otherwise construct user object
        const [users] = await db.query('SELECT * FROM users WHERE academyId = ? AND role LIKE "%admin%"', [academy.id]);
        if (users.length > 0) {
            return { user: users[0], type: 'admin', authData: academy };
        } else {
            return { 
                user: { id: academy.id, role: (academy.email === 'androiddiviana@gmail.com') ? 'general_admin' : 'academy_admin', name: academy.name }, 
                type: 'admin', 
                authData: academy 
            };
        }
    }

    // 2. Try Student
    const [students] = await db.query('SELECT * FROM students WHERE email = ?', [email]);
    if (students.length > 0) {
        const student = students[0];
        const [users] = await db.query('SELECT * FROM users WHERE studentId = ?', [student.id]);
        const user = users.length > 0 ? users[0] : { id: student.id, role: 'student', name: student.name, studentId: student.id, academyId: student.academyId };
        return { user, type: 'student', authData: student };
    }

    return null;
};

// --- JWT Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ message: 'Token de autenticação não fornecido.' });

  jwt.verify(token, process.env.JWT_SECRET || JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      return res.status(403).json({ message: 'Token inválido ou expirado.' });
    }
    req.user = user;
    next();
  });
};

// Default theme settings
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
  heroHtml: `...`,
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

// --- Generic Handlers ---
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
                    try { row.medals = JSON.parse(row.medals); } catch (e) { row.medals = { gold: 0, silver: 0, bronze: 0 }; }
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

// =================================================================
// 1. PUBLIC ROUTES (Attached to publicApiRouter)
// =================================================================

// Settings - Public Access
publicApiRouter.get('/settings', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        if (rows && rows.length > 0) return res.json(rows[0]);
        res.json(initialThemeSettings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.json(initialThemeSettings);
    }
});

// Auth - Public Access
publicApiRouter.post('/auth/register', async (req, res) => {
    const { name, address, responsible, responsibleRegistration, email, password } = req.body;
    if (!name || !responsible || !email || !password) return res.status(400).json({ message: 'Missing required fields.' });
    
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
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already exists.' });
        res.status(500).json({ message: 'Failed to register academy.' });
    } finally {
        connection.release();
    }
});

publicApiRouter.post('/auth/login', async (req, res) => {
    const emailOrCpf = req.body.emailOrCpf || req.body.email;
    const pass = req.body.pass || req.body.password;

    if (!emailOrCpf || !pass) return res.status(400).json({ message: 'Email/CPF e senha são obrigatórios.' });

    try {
        // Handle CPF login logic separately as it's unique to custom login
        const isEmail = String(emailOrCpf).includes('@');
        let foundUser = null;

        if (isEmail) {
            // Use standard lookup for email
            const result = await findUserByEmail(emailOrCpf);
            if (result) {
                if (await bcrypt.compare(pass, result.authData.password)) {
                    foundUser = result.user;
                } else {
                    return res.status(401).json({ message: 'Senha incorreta.' });
                }
            }
        } else {
            // CPF Login logic (only for Students)
            const sanitizedCpf = String(emailOrCpf).replace(/[^\d]/g, '');
            const [students] = await db.query('SELECT * FROM students WHERE cpf = ? OR REPLACE(REPLACE(cpf, ".", ""), "-", "") = ?', [emailOrCpf, sanitizedCpf]);
            
            if (students.length > 0) {
                const student = students[0];
                if (student.password && await bcrypt.compare(pass, student.password)) {
                    const [users] = await db.query('SELECT * FROM users WHERE studentId = ?', [student.id]);
                    foundUser = users.length > 0 ? users[0] : { id: student.id, role: 'student', name: student.name };
                } else {
                     return res.status(401).json({ message: 'Senha incorreta.' });
                }
            }
        }

        if (foundUser) {
            const currentSecret = process.env.JWT_SECRET || JWT_SECRET;
            const token = jwt.sign({ userId: foundUser.id, role: foundUser.role }, currentSecret, { expiresIn: '1d' });
            logActivity(foundUser.id, 'Login', 'Usuário logado com sucesso (Senha).').catch(console.error);
            return res.json({ token });
        }

        return res.status(404).json({ message: 'Usuário não encontrado.', code: 'USER_NOT_FOUND' });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Erro interno no servidor.', error: error.message });
    }
});

// Google Login Route
publicApiRouter.post('/auth/google', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token do Google não fornecido.' });

    try {
        // 1. Verify Google Token
        const googleResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        const googleData = await googleResponse.json();

        if (googleData.error) {
            return res.status(400).json({ message: 'Token do Google inválido.' });
        }

        const email = googleData.email;

        // 2. Check if user exists in our database
        const result = await findUserByEmail(email);

        if (result) {
            // User exists, generate system JWT
            const foundUser = result.user;
            const currentSecret = process.env.JWT_SECRET || JWT_SECRET;
            const appToken = jwt.sign({ userId: foundUser.id, role: foundUser.role }, currentSecret, { expiresIn: '1d' });
            
            await logActivity(foundUser.id, 'Login Google', 'Usuário logado via Google.');
            return res.json({ token: appToken });
        } else {
             return res.status(404).json({ message: 'Email não cadastrado no sistema. Entre em contato com sua academia.', code: 'USER_NOT_FOUND' });
        }
    } catch (error) {
        console.error('Google Login Error:', error);
        res.status(500).json({ message: 'Erro ao processar login com Google.' });
    }
});

// =================================================================
// 2. PROTECTED ROUTES (Attached to protectedApiRouter)
// =================================================================

// Apply Authentication Middleware to this router
protectedApiRouter.use(authenticateToken);

// Session Validation
protectedApiRouter.get('/auth/session', async (req, res) => {
    try {
        const userId = req.user.userId;
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length > 0) return res.json(users[0]);
        
        const [academies] = await db.query('SELECT * FROM academies WHERE id = ?', [userId]);
        if (academies.length > 0) {
             const academy = academies[0];
             return res.json({
                id: academy.id,
                role: (academy.email === 'androiddiviana@gmail.com') ? 'general_admin' : 'academy_admin',
                name: academy.name,
                academyId: academy.id
            });
        }
        return res.status(401).json({ message: 'User session not found.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to validate session.' });
    }
});

// Protected Resource Routes
protectedApiRouter.get('/users', handleGet('users'));
protectedApiRouter.get('/students', handleGet('students'));
protectedApiRouter.get('/academies', handleGet('academies'));
protectedApiRouter.get('/news', handleGet('news_articles'));
protectedApiRouter.get('/graduations', handleGet('graduations'));
protectedApiRouter.get('/schedules', handleGet('class_schedules'));
protectedApiRouter.get('/attendance', handleGet('attendance_records'));
protectedApiRouter.get('/professors', handleGet('professors'));
protectedApiRouter.get('/logs', handleGet('activity_logs'));

protectedApiRouter.delete('/academies/:id', handleDelete('academies'));
protectedApiRouter.delete('/graduations/:id', handleDelete('graduations'));
protectedApiRouter.delete('/schedules/:id', handleDelete('schedules'));
protectedApiRouter.delete('/attendance/:id', handleDelete('attendance_records'));
protectedApiRouter.delete('/professors/:id', handleDelete('professors'));

// Complex Protected Operations
protectedApiRouter.post('/students', async (req, res) => {
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

protectedApiRouter.put('/students/:id', async (req, res) => {
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

protectedApiRouter.delete('/students/:id', async (req, res) => {
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

protectedApiRouter.post('/students/:studentId/payment', async (req, res) => {
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

protectedApiRouter.post('/academies', handleSave('academies', ['name', 'address', 'responsible', 'responsibleRegistration', 'professorId', 'imageUrl', 'email', 'password']));
protectedApiRouter.put('/academies/:id', handleSave('academies', ['name', 'address', 'responsible', 'responsibleRegistration', 'professorId', 'imageUrl', 'email', 'password']));
protectedApiRouter.post('/professors', handleSave('professors', ['name', 'fjjpe_registration', 'cpf', 'academyId', 'graduationId', 'imageUrl', 'blackBeltDate']));
protectedApiRouter.put('/professors/:id', handleSave('professors', ['name', 'fjjpe_registration', 'cpf', 'academyId', 'graduationId', 'imageUrl', 'blackBeltDate']));
protectedApiRouter.post('/graduations', handleSave('graduations', ['name', 'color', 'minTimeInMonths', 'rank', 'type', 'minAge', 'maxAge']));
protectedApiRouter.put('/graduations/:id', handleSave('graduations', ['name', 'color', 'minTimeInMonths', 'rank', 'type', 'minAge', 'maxAge']));
protectedApiRouter.post('/schedules', handleSave('class_schedules', ['className', 'dayOfWeek', 'startTime', 'endTime', 'professorId', 'academyId', 'requiredGraduationId']));
protectedApiRouter.put('/schedules/:id', handleSave('class_schedules', ['className', 'dayOfWeek', 'startTime', 'endTime', 'professorId', 'academyId', 'requiredGraduationId']));

protectedApiRouter.put('/graduations/ranks', async (req, res) => {
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

protectedApiRouter.post('/attendance', async (req, res) => {
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

protectedApiRouter.put('/settings', async (req, res) => {
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

// --- MOUNT ROUTERS ---
app.use('/api', publicApiRouter);
app.use('/api', protectedApiRouter);

// --- 404 HANDLER FOR API ---
app.use('/api/*', (req, res) => {
    console.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// --- Startup Script ---
const ensureMasterAdmin = async () => {
    if (!isDbConnected) return;
    const email = 'androiddiviana@gmail.com';
    const plainPassword = 'dvsviana154';
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [academies] = await connection.query('SELECT * FROM academies WHERE email = ?', [email]);
        let academyId = academies.length > 0 ? academies[0].id : uuidv4();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        if (academies.length === 0) {
            await connection.query('INSERT INTO academies (id, name, address, responsible, responsibleRegistration, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)', [academyId, 'Academia Master', 'System Address', 'Admin Master', '000.000.000-00', email, hashedPassword]);
        } else {
            await connection.query('UPDATE academies SET password = ? WHERE id = ?', [hashedPassword, academyId]);
        }

        const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            await connection.query('INSERT INTO users (id, name, email, role, academyId) VALUES (?, ?, ?, ?, ?)', [uuidv4(), 'Admin Master', email, 'general_admin', academyId]);
        } else {
            await connection.query('UPDATE users SET role = ?, academyId = ? WHERE email = ?', ['general_admin', academyId, email]);
        }
        await connection.commit();
    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Failed to ensure Master Admin:", error.message);
    } finally {
        if (connection) connection.release();
    }
};

// --- Server Start ---
(async () => {
  await connectToDatabase();
  await ensureMasterAdmin();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();
