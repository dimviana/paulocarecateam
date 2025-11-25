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

// --- Environment Variables ---
const {
  DATABASE_URL,
  PORT = 3001,
  FRONTEND_URL,
} = process.env;

// --- Express App Initialization ---
const app = express();
const apiRouter = express.Router();

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
    process.exit(1);
  }
}

// --- DB Connection Check Middleware ---
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

// --- Session Authentication Middleware ---
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

    // Extend session validity on use
    session.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    req.user = session.user;
    next();
};

// =================================================================
// --- GENERIC CRUD HANDLERS ---
// =================================================================

const genericGet = (tableName) => async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM \`${tableName}\``);
        res.json(rows);
    } catch (error) {
        console.error(`Error fetching from ${tableName}:`, error);
        res.status(500).json({ message: `Failed to fetch from ${tableName}.` });
    }
};

const genericSave = (tableName, fields, specialHandling = {}) => async (req, res) => {
    const data = req.body;
    const isNew = !req.params.id && !data.id;
    const id = isNew ? uuidv4() : (req.params.id || data.id);

    try {
        if (isNew) {
            if(specialHandling.beforeInsert) await specialHandling.beforeInsert(data, { db, req });
            const columns = ['`id`', ...fields.map(f => `\`${f}\``)].join(', ');
            const placeholders = ['?', ...fields.map(() => '?')].join(', ');
            const values = [id, ...fields.map(f => data[f] ?? null)];
            await db.query(`INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`, values);
             if(specialHandling.afterInsert) await specialHandling.afterInsert({ ...data, id }, { db, req });
        } else {
             if(specialHandling.beforeUpdate) await specialHandling.beforeUpdate(data, { db, req });
            const mutableFields = [...fields];
            const values = mutableFields.map(f => data[f] ?? null);
            const setClause = mutableFields.map(f => `\`${f}\` = ?`).join(', ');
            values.push(id);
            if(setClause) await db.query(`UPDATE \`${tableName}\` SET ${setClause} WHERE \`id\` = ?`, values);
             if(specialHandling.afterUpdate) await specialHandling.afterUpdate(data, { db, req });
        }
        await logActivity(req.user?.userId || 'system', `Save ${tableName}`, `${isNew ? 'Created' : 'Updated'} item ${data.name || id}`);
        const [[savedItem]] = await db.query(`SELECT * FROM \`${tableName}\` WHERE id = ?`, [id]);
        if(specialHandling.transformResponse) {
            const transformed = await specialHandling.transformResponse(savedItem, { db });
            return res.status(isNew ? 201 : 200).json(transformed);
        }
        res.status(isNew ? 201 : 200).json(savedItem);
    } catch (error) {
        console.error(`Error saving to ${tableName}:`, error);
        res.status(500).json({ message: `Failed to save to ${tableName}`, error: error.message });
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
        res.status(500).json({ message: `Failed to delete from ${tableName}`, error: error.message });
    } finally {
        connection.release();
    }
};


// =================================================================
// --- ROUTE DEFINITIONS ---
// =================================================================

// --- Public Routes (No Authentication Required) ---

apiRouter.get('/settings', async (req, res) => {
    try {
        const publicFields = 'logoUrl, systemName, primaryColor, secondaryColor, backgroundColor, cardBackgroundColor, buttonColor, buttonTextColor, iconColor, chartColor1, chartColor2, useGradient, theme, publicPageEnabled, heroHtml, aboutHtml, branchesHtml, footerHtml, customCss, customJs, socialLoginEnabled, googleClientId, facebookAppId, copyrightText, systemVersion, reminderDaysBeforeDue, overdueDaysAfterDue, monthlyFeeAmount';
        const [rows] = await db.query(`SELECT ${publicFields} FROM theme_settings WHERE id = 1`);
        if (rows && rows.length > 0) return res.json(rows[0]);
        res.status(404).json({ message: "Settings not found" });
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: "Failed to fetch settings." });
    }
});

apiRouter.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Please provide username and password' });

    try {
        let user;
        let passwordHash;
        
        if (username.includes('@')) {
            const [users] = await db.query('SELECT * FROM users WHERE email = ?', [username]);
            if (users.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.', code: 'USER_NOT_FOUND' });
            user = users[0];
        } else {
            const [students] = await db.query('SELECT id FROM students WHERE cpf = ?', [username.replace(/\D/g, '')]);
            if (students.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.', code: 'USER_NOT_FOUND' });
            
            const [users] = await db.query('SELECT * FROM users WHERE studentId = ?', [students[0].id]);
            if (users.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.', code: 'USER_NOT_FOUND' });
            user = users[0];
        }

        if (user.role === 'student') {
            const [[student]] = await db.query('SELECT password FROM students WHERE id = ?', [user.studentId]);
            passwordHash = student?.password;
        } else {
            const [[academy]] = await db.query('SELECT password FROM academies WHERE id = ?', [user.academyId]);
            passwordHash = academy?.password;
        }
        
        if (!passwordHash || !(await bcrypt.compare(password, passwordHash))) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const sessionId = uuidv4();
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        sessions[sessionId] = { user: { userId: user.id, role: user.role }, expires };

        res.cookie('sessionId', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', expires });
        
        await logActivity(user.id, 'Login', 'Usuário logado com sucesso.');
        const [[fullUserData]] = await db.query('SELECT id, name, email, role, academyId, studentId, birthDate FROM users WHERE id = ?', [user.id]);
        res.json(fullUserData);

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Erro interno no servidor durante o login.', error: error.message });
    }
});

apiRouter.post('/auth/google', async (req, res) => {
    const { token } = req.body;
    console.log(`Google login attempt with token: ${token ? token.substring(0, 30) : 'none'}...`);
    return res.status(404).json({ message: 'Usuário Google não encontrado no sistema.', code: 'USER_NOT_FOUND' });
});

apiRouter.post('/auth/register', async (req, res) => {
    const { name, address, responsible, responsibleRegistration, email, password } = req.body;
    if (!name || !responsible || !email || !password) return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [existingUser] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'Este email já está em uso.' });
        }

        const academyId = uuidv4();
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await connection.query('INSERT INTO academies (id, name, address, responsible, responsibleRegistration, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)', [academyId, name, address, responsible, responsibleRegistration, email, hashedPassword]);
        await connection.query('INSERT INTO users (id, name, email, role, academyId) VALUES (?, ?, ?, ?, ?)', [userId, responsible, email, 'academy_admin', academyId]);
        
        await connection.commit();

        const sessionId = uuidv4();
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const [[newUser]] = await connection.query('SELECT id, name, email, role, academyId, studentId, birthDate FROM users WHERE id = ?', [userId]);
        sessions[sessionId] = { user: { userId: newUser.id, role: newUser.role }, expires };

        res.cookie('sessionId', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', expires });

        await logActivity(userId, 'Academy Registration', `Academia "${name}" registrada e logada.`);
        res.status(201).json(newUser);

    } catch (error) {
        await connection.rollback();
        console.error("Registration Error:", error);
        res.status(500).json({ message: 'Falha ao registrar academia.' });
    } finally {
        connection.release();
    }
});

// --- Authentication Wall ---
// All routes defined after this point will require a valid session.
apiRouter.use(checkSession);

// --- Protected Routes ---

apiRouter.post('/auth/logout', async (req, res) => {
    const cookies = parseCookies(req);
    const sessionId = cookies.sessionId;
    if (sessionId && sessions[sessionId]) delete sessions[sessionId];
    await logActivity(req.user.userId, 'Logout', 'Usuário deslogado.');
    res.clearCookie('sessionId').status(200).json({ message: 'Logout bem-sucedido.' });
});

apiRouter.get('/auth/session', async (req, res) => {
    try {
        const [[user]] = await db.query('SELECT id, name, email, role, academyId, studentId, birthDate FROM users WHERE id = ?', [req.user.userId]);
        if (user) return res.json(user);
        res.status(404).json({ message: 'Usuário da sessão não encontrado.' });
    } catch (error) {
        console.error("Session validation error:", error);
        res.status(500).json({ message: 'Falha ao validar sessão.' });
    }
});

// Settings
apiRouter.get('/settings/all', async (req, res) => {
    try {
        const [[user]] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.userId]);
        if (user.role !== 'general_admin') return res.status(403).json({ message: "Acesso negado." });
        const [[settings]] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        res.json(settings);
    } catch (error) { res.status(500).json({ message: "Failed to fetch all settings." }); }
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


// Students
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
    } catch (error) { res.status(500).json({ message: 'Failed to fetch students.' }); }
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
            await connection.query('INSERT INTO users (id, name, email, role, studentId, birthDate) VALUES (?,?,?,?,?,?)', [userId, data.name, data.email, 'student', studentId, data.birthDate]);
        } else {
            const queryParams = [data.name, data.email, data.birthDate, data.cpf, data.fjjpe_registration, data.phone, data.address, data.beltId, data.academyId, data.firstGraduationDate, data.lastPromotionDate, data.paymentDueDateDay, data.stripes, data.isCompetitor, data.lastCompetition, JSON.stringify(data.medals || {}), data.imageUrl];
            let setClauses = 'name=?, email=?, birthDate=?, cpf=?, fjjpe_registration=?, phone=?, address=?, beltId=?, academyId=?, firstGraduationDate=?, lastPromotionDate=?, paymentDueDateDay=?, stripes=?, isCompetitor=?, lastCompetition=?, medals=?, imageUrl=?';
            if (data.password) {
                setClauses += ', password=?';
                queryParams.push(await bcrypt.hash(data.password, 10));
            }
            queryParams.push(studentId);
            await connection.query(`UPDATE students SET ${setClauses} WHERE id=?`, queryParams);
            await connection.query('UPDATE users SET name=?, email=?, birthDate=? WHERE studentId=?', [data.name, data.email, data.birthDate, studentId]);
        }
        await connection.commit();
        await logActivity(req.user.userId, isNew ? 'Create Student' : 'Update Student', `Student ${data.name}`);
        const [[student]] = await db.query('SELECT * FROM students WHERE id = ?', [studentId]);
        res.status(isNew ? 201 : 200).json(student);
    } catch (error) {
        await connection.rollback();
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
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE students SET paymentStatus = ? WHERE id = ?', [status, studentId]);
        if (status === 'paid') {
            await connection.query('INSERT INTO payment_history (id, studentId, `date`, amount) VALUES (?, ?, ?, ?)', [uuidv4(), studentId, new Date(), amount]);
        }
        await connection.commit();
        await logActivity(req.user.userId, 'Update Payment', `Updated payment for student ${studentId} to ${status}`);
        const [[student]] = await db.query('SELECT * FROM students WHERE id = ?', [studentId]);
        res.status(200).json(student);
    } catch (error) { await connection.rollback(); res.status(500).json({ message: "Failed to update payment status", error: error.message }); } finally { connection.release(); }
});

// Schedules
apiRouter.get('/schedules', async (req, res) => {
    try {
        const [schedules] = await db.query('SELECT cs.*, GROUP_CONCAT(sa.assistantId) as assistantIds FROM class_schedules cs LEFT JOIN schedule_assistants sa ON cs.id = sa.scheduleId GROUP BY cs.id');
        schedules.forEach(s => s.assistantIds = s.assistantIds ? s.assistantIds.split(',') : []);
        res.json(schedules);
    } catch (error) { res.status(500).json({ message: 'Failed to fetch schedules.' }); }
});
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
        const [[schedule]] = await db.query('SELECT * FROM class_schedules WHERE id = ?', [scheduleId]);
        schedule.assistantIds = assistantIds;
        res.status(isNew ? 201 : 200).json(schedule);
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Failed to save schedule', error: error.message });
    } finally {
        connection.release();
    }
};
apiRouter.post('/schedules', scheduleSaveHandler);
apiRouter.put('/schedules/:id', scheduleSaveHandler);
apiRouter.delete('/schedules/:id', genericDelete('class_schedules', {
    beforeDelete: async(id, { connection }) => await connection.query('DELETE FROM schedule_assistants WHERE scheduleId = ?', [id])
}));

// Graduations
apiRouter.get('/graduations', genericGet('graduations'));
apiRouter.post('/graduations', genericSave('graduations', ['name', 'color', 'minTimeInMonths', 'rank', 'type', 'minAge', 'maxAge']));
apiRouter.put('/graduations/:id', genericSave('graduations', ['name', 'color', 'minTimeInMonths', 'rank', 'type', 'minAge', 'maxAge']));
apiRouter.delete('/graduations/:id', genericDelete('graduations'));
apiRouter.put('/graduations/ranks', async (req, res) => {
    const gradsWithNewRanks = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await Promise.all(gradsWithNewRanks.map(grad => connection.query('UPDATE graduations SET `rank` = ? WHERE id = ?', [grad.rank, grad.id])));
        await connection.commit();
        await logActivity(req.user.userId, 'Update Graduation Ranks', `Reordered ${gradsWithNewRanks.length} graduations.`);
        res.status(200).json({ success: true });
    } catch (error) { await connection.rollback(); res.status(500).json({ message: 'Failed to update ranks', error: error.message }); } finally { connection.release(); }
});

// Academies
apiRouter.get('/academies', async (req, res) => {
    const [academies] = await db.query('SELECT * FROM academies WHERE id != ?', ['master_admin_academy_01']);
    res.json(academies);
});
const academySaveHandler = async (req, res) => {
    const data = req.body;
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    else delete data.password;
    const fields = ['name', 'address', 'responsible', 'responsibleRegistration', 'professorId', 'imageUrl', 'email', 'password'].filter(f => f in data);
    await genericSave('academies', fields)(req, res);
};
apiRouter.post('/academies', academySaveHandler);
apiRouter.put('/academies/:id', academySaveHandler);
apiRouter.delete('/academies/:id', genericDelete('academies'));

// Other Generic Routes
apiRouter.get('/users', genericGet('users'));
apiRouter.get('/professors', genericGet('professors'));
apiRouter.get('/logs', genericGet('activity_logs'));
apiRouter.get('/attendance', genericGet('attendance_records'));
apiRouter.get('/news', genericGet('news_articles'));

const profFields = ['name', 'fjjpe_registration', 'cpf', 'academyId', 'graduationId', 'imageUrl', 'blackBeltDate'];
apiRouter.post('/professors', genericSave('professors', profFields));
apiRouter.put('/professors/:id', genericSave('professors', profFields));
apiRouter.delete('/professors/:id', genericDelete('professors'));

const attendanceFields = ['studentId', 'scheduleId', 'date', 'status'];
apiRouter.post('/attendance', genericSave('attendance_records', attendanceFields));
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
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();
