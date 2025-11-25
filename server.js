/**
 * ==============================================================================
 *           Backend Server for Jiu-Jitsu Hub SAAS (server.js)
 * ==============================================================================
 */

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// --- Environment Variables & Validation ---
const {
  DATABASE_URL,
  PORT = 3001,
  FRONTEND_URL,
} = process.env;

if (!FRONTEND_URL) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!!           FATAL: FRONTEND_URL is not set           !!!');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('The FRONTEND_URL environment variable must be set in your .env file.');
    console.error('It should be the full URL of your frontend application (e.g., https://yourapp.com).');
    console.error('CORS will fail without this, causing 401 Unauthorized errors on the frontend.');
    process.exit(1);
}

// --- Express App Initialization ---
const app = express();
const apiRouter = express.Router(); // A single router for all API endpoints

// --- In-memory Session Store ---
const sessions = {}; // { sessionId: { user: { userId, role }, expires: Date } }

// --- Middleware ---
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// --- Database Connection ---
let db;
let isDbConnected = false;

async function connectToDatabase() {
  try {
    if (!DATABASE_URL) {
      throw new Error("FATAL: DATABASE_URL environment variable is not defined. Please check your .env file.");
    }
    if (DATABASE_URL.includes("@[HOST]:[PORTA]/[NOME_DO_BANCO]")) {
        throw new Error("FATAL: DATABASE_URL is using placeholder values. Please update your .env file with real database credentials.");
    }
    const pool = mysql.createPool(DATABASE_URL);
    await pool.query('SELECT 1'); // Test connection
    db = pool;
    console.log('Successfully connected to the MySQL database.');
    isDbConnected = true;
  } catch (error) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('!!!         FAILED TO CONNECT TO THE DATABASE          !!!');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('Error details:', error.message);
    console.error('This is a fatal error. The application cannot start without a database connection.');
    console.error('Common causes:');
    console.error('1. The .env file is missing or `DATABASE_URL` is incorrect.');
    console.error('2. The database server is not running or is inaccessible from the app server.');
    console.error('3. The database user, password, or database name are incorrect.');
    isDbConnected = false;
    // Do not exit, allow the server to run and respond with 503
  }
}

const checkDbConnection = (req, res, next) => {
    if (!isDbConnected) {
        return res.status(503).json({ message: "Service Unavailable: Database connection is not active." });
    }
    next();
};

// --- Helper Functions ---
const logActivity = async (actorId, action, details) => {
  try {
    if (!isDbConnected) return;
    const id = uuidv4();
    const timestamp = new Date();
    await db.query(
      'INSERT INTO activity_logs (id, actorId, action, `timestamp`, details) VALUES (?, ?, ?, ?, ?)',
      [id, actorId, action, timestamp, details]
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

const parseCookies = (req) => {
    const list = {};
    const cookieHeader = req.headers?.cookie;
    if (!cookieHeader) return list;
    cookieHeader.split(`;`).forEach(function(cookie) {
        let [ name, ...rest] = cookie.split(`=`);
        name = name?.trim();
        if (!name) return;
        const value = rest.join(`=`).trim();
        if (!value) return;
        list[name] = decodeURIComponent(value);
    });
    return list;
}

const checkSession = (req, res, next) => {
    const cookies = parseCookies(req);
    const sessionId = cookies.sessionId;
    if (!sessionId || !sessions[sessionId]) {
        return res.status(401).json({ message: 'Não autenticado.' });
    }
    const session = sessions[sessionId];
    if (new Date() > session.expires) {
        delete sessions[sessionId];
        return res.status(401).json({ message: 'Sessão expirada.' });
    }
    session.expires = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes
    req.user = session.user;
    next();
};

// =================================================================
// --- API ROUTER DEFINITION (REFACTORED)
// =================================================================

// -----------------------------------------------------------------
// SECTION 1: PUBLIC ROUTES (Defined BEFORE the authentication wall)
// -----------------------------------------------------------------
apiRouter.get('/settings', async (req, res) => {
    try {
        const publicFields = 'logoUrl, systemName, primaryColor, secondaryColor, backgroundColor, cardBackgroundColor, buttonColor, buttonTextColor, iconColor, chartColor1, chartColor2, useGradient, theme, publicPageEnabled, heroHtml, aboutHtml, branchesHtml, footerHtml, customCss, customJs, socialLoginEnabled, googleClientId, facebookAppId, copyrightText, systemVersion, reminderDaysBeforeDue, overdueDaysAfterDue, monthlyFeeAmount';
        const [rows] = await db.query(`SELECT ${publicFields} FROM theme_settings WHERE id = 1`);
        if (rows && rows.length > 0) return res.json(rows[0]);
        res.status(404).json({ message: "Settings not found" });
    } catch (error) {
        console.error("Error fetching public settings:", error);
        res.status(500).json({ message: "Failed to fetch settings." });
    }
});

apiRouter.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Please provide username and password' });
    try {
        const [[user]] = await db.query('SELECT u.*, a.password as academy_password, s.password as student_password FROM users u LEFT JOIN academies a ON u.academyId = a.id LEFT JOIN students s ON u.studentId = s.id WHERE u.email = ? OR s.cpf = ?', [username, username.replace(/\D/g, '')]);
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado.', code: 'USER_NOT_FOUND' });
        
        const passwordHash = user.role === 'student' ? user.student_password : user.academy_password;
        if (!passwordHash || !(await bcrypt.compare(password, passwordHash))) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const sessionId = uuidv4();
        const expires = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes
        sessions[sessionId] = { user: { userId: user.id, role: user.role, academyId: user.academyId, studentId: user.studentId }, expires };

        res.cookie('sessionId', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', expires });
        await logActivity(user.id, 'Login', 'Usuário logado com sucesso.');
        const { academy_password, student_password, ...userResponse } = user;
        res.json(userResponse);
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: 'Erro interno no servidor durante o login.', error: error.message });
    }
});

apiRouter.post('/auth/google', (req, res) => res.status(404).json({ message: 'Usuário Google não encontrado no sistema.', code: 'USER_NOT_FOUND' }));

apiRouter.post('/auth/register', async (req, res) => {
    const { name, address, responsible, responsibleRegistration, email, password } = req.body;
    if (!name || !responsible || !email || !password) return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [[existingUser]] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            await connection.rollback();
            return res.status(409).json({ message: 'Este email já está em uso.' });
        }

        const academyId = uuidv4();
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await connection.query('INSERT INTO academies (id, name, address, responsible, responsibleRegistration, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)', [academyId, name, address, responsible, responsibleRegistration, email, hashedPassword]);
        await connection.query('INSERT INTO users (id, name, email, role, academyId) VALUES (?, ?, ?, ?, ?)', [userId, responsible, email, 'academy_admin', academyId]);
        
        await connection.commit();

        const [[newUser]] = await connection.query('SELECT id, name, email, role, academyId, studentId, birthDate FROM users WHERE id = ?', [userId]);
        const sessionId = uuidv4();
        const expires = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes
        sessions[sessionId] = { user: { userId: newUser.id, role: newUser.role, academyId: newUser.academyId }, expires };

        res.cookie('sessionId', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', expires });
        await logActivity(userId, 'Academy Registration', `Academia "${name}" registrada.`);
        res.status(201).json(newUser);
    } catch (error) {
        await connection.rollback();
        console.error("Error registering academy:", error);
        res.status(500).json({ message: 'Falha ao registrar academia.' });
    } finally {
        connection.release();
    }
});

apiRouter.get('/auth/session', async (req, res) => {
    const cookies = parseCookies(req);
    const sessionId = cookies.sessionId;
    if (!sessionId || !sessions[sessionId]) {
        return res.status(401).json({ message: 'Nenhuma sessão ativa encontrada.' });
    }
    const session = sessions[sessionId];
    if (new Date() > session.expires) {
        delete sessions[sessionId];
        return res.status(401).json({ message: 'Sessão expirada.' });
    }
    
    try {
        session.expires = new Date(Date.now() + 20 * 60 * 1000); // Refresh session
        const [[user]] = await db.query('SELECT id, name, email, role, academyId, studentId, birthDate FROM users WHERE id = ?', [session.user.userId]);
        if (user) {
            return res.json(user);
        } else {
            delete sessions[sessionId];
            res.clearCookie('sessionId');
            return res.status(404).json({ message: 'Usuário da sessão não encontrado na base de dados.' });
        }
    } catch (error) {
        console.error("Error validating session:", error);
        return res.status(500).json({ message: 'Falha ao validar sessão.' });
    }
});

apiRouter.post('/auth/logout', (req, res) => {
    const cookies = parseCookies(req);
    const sessionId = cookies.sessionId;
    if (sessionId && sessions[sessionId]) {
        logActivity(sessions[sessionId].user.userId, 'Logout', 'Usuário deslogado.');
        delete sessions[sessionId];
    }
    res.clearCookie('sessionId').status(200).json({ message: 'Logout bem-sucedido.' });
});


// -----------------------------------------------------------------
// SECTION 2: AUTHENTICATION WALL - ALL ROUTES AFTER THIS ARE PROTECTED
// -----------------------------------------------------------------
apiRouter.use(checkSession);

// -----------------------------------------------------------------
// SECTION 3: PROTECTED ROUTES (Session required)
// -----------------------------------------------------------------

// --- Data Fetching (GET) ---
apiRouter.get('/students', async (req, res) => {
     try {
        const [students] = await db.query('SELECT * FROM students');
        const [payments] = await db.query('SELECT * FROM payment_history ORDER BY `date` DESC');
        const paymentsByStudent = payments.reduce((acc, p) => {
            (acc[p.studentId] = acc[p.studentId] || []).push(p);
            return acc;
        }, {});
        students.forEach(s => {
            s.paymentHistory = paymentsByStudent[s.id] || [];
            try { s.medals = JSON.parse(s.medals); } catch (e) { s.medals = { gold: 0, silver: 0, bronze: 0 }; }
        });
        res.json(students);
    } catch (error) { console.error("Error fetching students:", error); res.status(500).json({ message: 'Failed to fetch students.' }); }
});

apiRouter.get('/academies', async (req, res) => {
    try {
        const [academies] = await db.query('SELECT * FROM academies WHERE id != ?', ['master_admin_academy_01']);
        res.json(academies);
    } catch (error) {
        console.error("Error fetching academies:", error);
        res.status(500).json({ message: 'Failed to fetch academies.' });
    }
});

apiRouter.get('/schedules', async (req, res) => {
    try {
        const [schedules] = await db.query('SELECT cs.*, GROUP_CONCAT(sa.assistantId) as assistantIds FROM class_schedules cs LEFT JOIN schedule_assistants sa ON cs.id = sa.scheduleId GROUP BY cs.id');
        schedules.forEach(s => s.assistantIds = s.assistantIds ? s.assistantIds.split(',') : []);
        res.json(schedules);
    } catch (error) { console.error("Error fetching schedules:", error); res.status(500).json({ message: 'Failed to fetch schedules.' }); }
});

apiRouter.get('/graduations', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM graduations');
        res.json(rows);
    } catch (error) { console.error('Error fetching from graduations:', error); res.status(500).json({ message: 'Failed to fetch from graduations.' }); }
});

apiRouter.get('/professors', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM professors');
        res.json(rows);
    } catch (error) { console.error('Error fetching from professors:', error); res.status(500).json({ message: 'Failed to fetch from professors.' }); }
});

apiRouter.get('/users', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM users');
        res.json(rows);
    } catch (error) { console.error('Error fetching from users:', error); res.status(500).json({ message: 'Failed to fetch from users.' }); }
});

apiRouter.get('/attendance', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM attendance_records');
        res.json(rows);
    } catch (error) { console.error('Error fetching from attendance_records:', error); res.status(500).json({ message: 'Failed to fetch from attendance_records.' }); }
});

apiRouter.get('/logs', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM activity_logs ORDER BY `timestamp` DESC');
        res.json(rows);
    } catch (error) { console.error('Error fetching from activity_logs:', error); res.status(500).json({ message: 'Failed to fetch from activity_logs.' }); }
});

apiRouter.get('/news', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM news_articles ORDER BY `date` DESC');
        res.json(rows);
    } catch (error) { console.error('Error fetching from news_articles:', error); res.status(500).json({ message: 'Failed to fetch from news_articles.' }); }
});

// --- Data Modification (CRUD) ---

const genericSave = (tableName, fields) => async (req, res) => {
    const data = req.body;
    const isNew = !req.params.id;
    const id = isNew ? uuidv4() : req.params.id;

    try {
        if (isNew) {
            const values = fields.map(field => data[field]);
            await db.query(`INSERT INTO \`${tableName}\` (id, \`${fields.join('`,`')}\`) VALUES (?, ?)`, [id, values]);
        } else {
            const setClause = fields.map(field => `\`${field}\` = ?`).join(', ');
            const values = fields.map(field => data[field]);
            await db.query(`UPDATE \`${tableName}\` SET ${setClause} WHERE id = ?`, [...values, id]);
        }
        const [[savedItem]] = await db.query(`SELECT * FROM \`${tableName}\` WHERE id = ?`, [id]);
        await logActivity(req.user.userId, isNew ? `Create ${tableName}` : `Update ${tableName}`, `Item ${id}`);
        res.status(isNew ? 201 : 200).json(savedItem);
    } catch (error) {
        console.error(`Error saving to ${tableName}:`, error);
        res.status(500).json({ message: `Failed to save item in ${tableName}`, error: error.message });
    }
};

const genericDelete = (tableName, specialHandling = {}) => async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        if(specialHandling.beforeDelete) await specialHandling.beforeDelete(id, { connection, req });
        const [result] = await connection.query(`DELETE FROM \`${tableName}\` WHERE id = ?`, [id]);
        await connection.commit();
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Item not found.' });
        await logActivity(req.user.userId, `Delete ${tableName}`, `Deleted item with id ${id}`);
        res.status(204).send();
    } catch (error) {
        await connection.rollback();
        console.error(`Error deleting from ${tableName}:`, error);
        res.status(500).json({ message: `Failed to delete from ${tableName}`, error: error.message });
    } finally {
        connection.release();
    }
};


// --- Specific Handlers ---

apiRouter.get('/settings/all', async (req, res) => {
    try {
        const [[user]] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.userId]);
        if (user.role !== 'general_admin') return res.status(403).json({ message: "Acesso negado." });
        const [[settings]] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        res.json(settings);
    } catch (error) { console.error("Error fetching all settings:", error); res.status(500).json({ message: "Failed to fetch all settings." }); }
});

apiRouter.put('/settings', async (req, res) => {
    const { id, ...settings } = req.body;
    const booleanFields = ['publicPageEnabled', 'useGradient', 'socialLoginEnabled'];
    booleanFields.forEach(field => {
        if (field in settings) settings[field] = settings[field] ? 1 : 0;
    });
    const setClause = Object.keys(settings).map(field => `\`${field}\` = ?`).join(', ');
    await db.query(`UPDATE theme_settings SET ${setClause} WHERE id = 1`, Object.values(settings));
    await logActivity(req.user.userId, 'Update Settings', 'System settings updated.');
    const [[updatedSettings]] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
    res.json(updatedSettings);
});

const studentSaveHandler = async (req, res) => {
    const data = req.body;
    const isNew = !req.params.id;
    const studentId = isNew ? uuidv4() : req.params.id;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        if (isNew) {
            if (!data.password) throw new Error("Password is required for new students.");
            const userId = uuidv4();
            const hashedPassword = await bcrypt.hash(data.password, 10);
            await connection.query('INSERT INTO students (id, name, email, password, birthDate, cpf, fjjpe_registration, phone, address, beltId, academyId, firstGraduationDate, paymentStatus, paymentDueDateDay, stripes, isCompetitor, lastCompetition, medals, imageUrl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [studentId, data.name, data.email, hashedPassword, data.birthDate, data.cpf, data.fjjpe_registration, data.phone, data.address, data.beltId, data.academyId, data.firstGraduationDate, 'unpaid', data.paymentDueDateDay, data.stripes || 0, data.isCompetitor || false, data.lastCompetition || null, JSON.stringify(data.medals || {}), data.imageUrl || null]);
            await connection.query('INSERT INTO users (id, name, email, role, studentId, birthDate, academyId) VALUES (?,?,?,?,?,?,?)', [userId, data.name, data.email, 'student', studentId, data.birthDate, data.academyId]);
        } else {
            const queryParams = [data.name, data.email, data.birthDate, data.cpf, data.fjjpe_registration, data.phone, data.address, data.beltId, data.academyId, data.firstGraduationDate, data.lastPromotionDate, data.paymentDueDateDay, data.stripes, data.isCompetitor, data.lastCompetition, JSON.stringify(data.medals || {}), data.imageUrl];
            let setClauses = 'name=?, email=?, birthDate=?, cpf=?, fjjpe_registration=?, phone=?, address=?, beltId=?, academyId=?, firstGraduationDate=?, lastPromotionDate=?, paymentDueDateDay=?, stripes=?, isCompetitor=?, lastCompetition=?, medals=?, imageUrl=?';
            if (data.password) {
                setClauses += ', password=?';
                queryParams.push(await bcrypt.hash(data.password, 10));
            }
            queryParams.push(studentId);
            await connection.query(`UPDATE students SET ${setClauses} WHERE id=?`, queryParams);
            await connection.query('UPDATE users SET name=?, email=?, birthDate=?, academyId=? WHERE studentId=?', [data.name, data.email, data.birthDate, data.academyId, studentId]);
        }
        await connection.commit();
        await logActivity(req.user.userId, isNew ? 'Create Student' : 'Update Student', `Student ${data.name}`);
        const [[student]] = await db.query('SELECT * FROM students WHERE id = ?', [studentId]);
        res.status(isNew ? 201 : 200).json(student);
    } catch (error) {
        await connection.rollback();
        console.error("Error saving student:", error);
        res.status(500).json({ message: `Failed to ${isNew ? 'create' : 'update'} student`, error: error.message });
    } finally {
        connection.release();
    }
}
apiRouter.post('/students', studentSaveHandler);
apiRouter.put('/students/:id', studentSaveHandler);
apiRouter.delete('/students/:id', genericDelete('students', {
    beforeDelete: async (id, { connection }) => {
        await connection.query('DELETE FROM payment_history WHERE studentId = ?', [id]);
        await connection.query('DELETE FROM attendance_records WHERE studentId = ?', [id]);
        await connection.query('DELETE FROM users WHERE studentId = ?', [id]);
    }
}));

apiRouter.post('/students/:studentId/payment', async (req, res) => {
    const { studentId } = req.params;
    const { status, amount } = req.body;
    await db.query('UPDATE students SET paymentStatus = ? WHERE id = ?', [status, studentId]);
    if (status === 'paid') {
        await db.query('INSERT INTO payment_history (id, studentId, `date`, amount) VALUES (?, ?, ?, ?)', [uuidv4(), studentId, new Date(), amount]);
    }
    const [[student]] = await db.query('SELECT * FROM students WHERE id = ?', [studentId]);
    res.status(200).json(student);
});

const academySaveHandler = async (req, res) => {
    const data = req.body;
    const isNew = !req.params.id;
    const academyId = isNew ? uuidv4() : req.params.id;
    if (isNew && !data.password) return res.status(400).json({ message: 'Password is required for new academy admin.' });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const academyFields = { name: data.name, address: data.address, responsible: data.responsible, responsibleRegistration: data.responsibleRegistration, professorId: data.professorId, imageUrl: data.imageUrl, email: data.email };
        if (data.password) academyFields.password = await bcrypt.hash(data.password, 10);
        
        if (isNew) {
            const fieldNames = Object.keys(academyFields);
            const placeholders = fieldNames.map(() => '?').join(',');
            await connection.query(`INSERT INTO academies (id, \`${fieldNames.join('`,`')}\`) VALUES (?, ${placeholders})`, [academyId, ...Object.values(academyFields)]);
            await connection.query('INSERT INTO users (id, name, email, role, academyId) VALUES (?, ?, ?, ?, ?)', [uuidv4(), data.responsible, data.email, 'academy_admin', academyId]);
        } else {
            const setClause = Object.keys(academyFields).map(k => `\`${k}\` = ?`).join(', ');
            await connection.query(`UPDATE academies SET ${setClause} WHERE id = ?`, [...Object.values(academyFields), academyId]);
            await connection.query('UPDATE users SET name = ?, email = ? WHERE academyId = ? AND role = ?', [data.responsible, data.email, academyId, 'academy_admin']);
        }
        await connection.commit();
        res.status(isNew ? 201 : 200).json({ id: academyId, ...data });
    } catch (e) { await connection.rollback(); console.error("Error saving academy:", e); res.status(500).json({ message: e.message }); } finally { connection.release(); }
};
apiRouter.post('/academies', academySaveHandler);
apiRouter.put('/academies/:id', academySaveHandler);
apiRouter.delete('/academies/:id', genericDelete('academies'));

const profFields = ['name', 'fjjpe_registration', 'cpf', 'academyId', 'graduationId', 'imageUrl', 'blackBeltDate'];
apiRouter.post('/professors', async(req,res)=>genericSave('professors', profFields)(req, res));
apiRouter.put('/professors/:id', async(req,res)=>genericSave('professors', profFields)(req, res));
apiRouter.delete('/professors/:id', genericDelete('professors'));

const scheduleSaveHandler = async (req, res) => {
    const isNew = !req.params.id;
    const scheduleId = isNew ? uuidv4() : req.params.id;
    const { assistantIds = [], ...data } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const scheduleFields = [data.className, data.dayOfWeek, data.startTime, data.endTime, data.professorId, data.academyId, data.requiredGraduationId];
        if (isNew) {
            await connection.query('INSERT INTO class_schedules (id, className, dayOfWeek, startTime, endTime, professorId, academyId, requiredGraduationId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [scheduleId, ...scheduleFields]);
        } else {
            await connection.query('UPDATE class_schedules SET className=?, dayOfWeek=?, startTime=?, endTime=?, professorId=?, academyId=?, requiredGraduationId=? WHERE id=?', [...scheduleFields, scheduleId]);
        }
        await connection.query('DELETE FROM schedule_assistants WHERE scheduleId = ?', [scheduleId]);
        if (assistantIds.length > 0) {
            const assistantValues = assistantIds.map(assistId => [scheduleId, assistId]);
            await connection.query('INSERT INTO schedule_assistants (scheduleId, assistantId) VALUES ?', [assistantValues]);
        }
        await connection.commit();
        const [[schedule]] = await db.query('SELECT cs.*, GROUP_CONCAT(sa.assistantId) as assistantIds FROM class_schedules cs LEFT JOIN schedule_assistants sa ON cs.id = sa.scheduleId WHERE cs.id = ? GROUP BY cs.id', [scheduleId]);
        schedule.assistantIds = schedule.assistantIds ? schedule.assistantIds.split(',') : [];
        res.status(isNew ? 201 : 200).json(schedule);
    } catch (error) { await connection.rollback(); console.error("Error saving schedule:", error); res.status(500).json({ message: 'Failed to save schedule', error: error.message }); } finally { connection.release(); }
};
apiRouter.post('/schedules', scheduleSaveHandler);
apiRouter.put('/schedules/:id', scheduleSaveHandler);
apiRouter.delete('/schedules/:id', genericDelete('class_schedules', {
    beforeDelete: async(id, { connection }) => await connection.query('DELETE FROM schedule_assistants WHERE scheduleId = ?', [id])
}));

const gradFields = ['name', 'color', 'minTimeInMonths', 'rank', 'type', 'minAge', 'maxAge'];
apiRouter.post('/graduations', async(req,res)=>genericSave('graduations', gradFields)(req, res));
apiRouter.put('/graduations/:id', async(req,res)=>genericSave('graduations', gradFields)(req, res));
apiRouter.delete('/graduations/:id', genericDelete('graduations'));

apiRouter.put('/graduations/ranks', async (req, res) => {
    const gradsWithNewRanks = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await Promise.all(gradsWithNewRanks.map(grad => connection.query('UPDATE graduations SET `rank` = ? WHERE id = ?', [grad.rank, grad.id])));
        await connection.commit();
        res.status(200).json({ success: true });
    } catch (error) { await connection.rollback(); console.error("Error updating ranks:", error); res.status(500).json({ message: 'Failed to update ranks', error: error.message }); } finally { connection.release(); }
});

const attendanceFields = ['studentId', 'scheduleId', 'date', 'status'];
apiRouter.post('/attendance', async(req,res)=>genericSave('attendance_records', attendanceFields)(req, res));
apiRouter.delete('/attendance/:id', genericDelete('attendance_records'));


// =================================================================
// --- MOUNT ROUTER & 404 HANDLER ---
// =================================================================
app.use('/api', checkDbConnection, apiRouter);

app.use('/api/*', (req, res) => {
    res.status(404).json({ message: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// --- Server Startup ---
(async () => {
  await connectToDatabase();
  if (isDbConnected) {
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Frontend should be proxied from: ${FRONTEND_URL}`);
      });
  }
})();
