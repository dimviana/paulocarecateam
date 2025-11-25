/**
 * ==============================================================================
 *           Backend Server for Jiu-Jitsu Hub SAAS (server.js)
 *           Refatorado para Sessões Persistentes e Roteamento Correto
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
    console.error('FATAL: FRONTEND_URL is not set in .env');
    process.exit(1);
}

// --- Express App Initialization ---
const app = express();

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
    if (!DATABASE_URL) throw new Error("DATABASE_URL is missing.");
    const pool = mysql.createPool(DATABASE_URL);
    await pool.query('SELECT 1');
    db = pool;
    console.log('Successfully connected to the MySQL database.');
    isDbConnected = true;
  } catch (error) {
    console.error('FAILED TO CONNECT TO DATABASE:', error.message);
    isDbConnected = false;
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

// --- Session Management (Persistent via DB) ---
// This replaces the in-memory store with database queries to the 'sessions' table.

const createSession = async (user) => {
    const sessionId = uuidv4();
    const expires = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes
    await db.query(
        'INSERT INTO sessions (sessionId, userId, expires) VALUES (?, ?, ?)',
        [sessionId, user.id, expires]
    );
    return { sessionId, expires };
};

const validateSession = async (sessionId) => {
    const [[session]] = await db.query('SELECT * FROM sessions WHERE sessionId = ?', [sessionId]);
    
    if (!session) return null;
    
    if (new Date() > new Date(session.expires)) {
        await db.query('DELETE FROM sessions WHERE sessionId = ?', [sessionId]);
        return null;
    }

    // Refresh session
    const newExpires = new Date(Date.now() + 20 * 60 * 1000);
    await db.query('UPDATE sessions SET expires = ? WHERE sessionId = ?', [newExpires, sessionId]);
    
    // Get user details
    const [[user]] = await db.query('SELECT id, name, email, role, academyId, studentId FROM users WHERE id = ?', [session.userId]);
    return user;
};

const destroySession = async (sessionId) => {
    await db.query('DELETE FROM sessions WHERE sessionId = ?', [sessionId]);
};

// Middleware to protect routes
const checkSession = async (req, res, next) => {
    try {
        const cookies = parseCookies(req);
        const sessionId = cookies.sessionId;
        
        if (!sessionId) {
            return res.status(401).json({ message: 'Não autenticado (sem cookie).' });
        }

        const user = await validateSession(sessionId);
        
        if (!user) {
            return res.status(401).json({ message: 'Sessão inválida ou expirada.' });
        }

        req.user = { userId: user.id, ...user };
        next();
    } catch (error) {
        console.error("Session check error:", error);
        res.status(500).json({ message: "Erro ao validar sessão." });
    }
};

// =================================================================
// --- ROUTING ARCHITECTURE
// =================================================================

const publicRouter = express.Router();
const protectedRouter = express.Router();

// Apply DB Check globally to API routes
app.use('/api', checkDbConnection);

// -----------------------------------------------------------------
// 1. PUBLIC ROUTES (No Auth Required)
// -----------------------------------------------------------------

publicRouter.get('/settings', async (req, res) => {
    try {
        const publicFields = 'logoUrl, systemName, primaryColor, secondaryColor, backgroundColor, cardBackgroundColor, buttonColor, buttonTextColor, iconColor, chartColor1, chartColor2, useGradient, theme, publicPageEnabled, heroHtml, aboutHtml, branchesHtml, footerHtml, customCss, customJs, socialLoginEnabled, googleClientId, facebookAppId, copyrightText, systemVersion, reminderDaysBeforeDue, overdueDaysAfterDue, monthlyFeeAmount';
        const [rows] = await db.query(`SELECT ${publicFields} FROM theme_settings WHERE id = 1`);
        // Return defaults if no settings found (handling fresh install)
        if (!rows || rows.length === 0) {
             return res.json({
                 systemName: 'Jiu-Jitsu Hub',
                 theme: 'light',
                 primaryColor: '#f59e0b',
                 secondaryColor: '#111827'
             });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: "Failed to fetch settings." });
    }
});

publicRouter.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Email/CPF e senha são obrigatórios.' });
    try {
        const [[user]] = await db.query('SELECT u.*, a.password as academy_password, s.password as student_password FROM users u LEFT JOIN academies a ON u.academyId = a.id LEFT JOIN students s ON u.studentId = s.id WHERE u.email = ? OR s.cpf = ?', [username, username.replace(/\D/g, '')]);
        
        if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' }); // Generic error for security
        
        const passwordHash = user.role === 'student' ? user.student_password : user.academy_password;
        if (!passwordHash || !(await bcrypt.compare(password, passwordHash))) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const { sessionId, expires } = await createSession(user);

        res.cookie('sessionId', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', expires });
        await logActivity(user.id, 'Login', 'Usuário logado com sucesso.');
        
        const { academy_password, student_password, refreshToken, ...userResponse } = user;
        res.json(userResponse);
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});

publicRouter.post('/auth/register', async (req, res) => {
    const { name, address, responsible, responsibleRegistration, email, password } = req.body;
    if (!name || !responsible || !email || !password) return res.status(400).json({ message: 'Dados incompletos.' });
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [[existingUser]] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            await connection.rollback();
            return res.status(409).json({ message: 'Email já cadastrado.' });
        }

        const academyId = uuidv4();
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await connection.query('INSERT INTO academies (id, name, address, responsible, responsibleRegistration, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)', [academyId, name, address, responsible, responsibleRegistration, email, hashedPassword]);
        await connection.query('INSERT INTO users (id, name, email, role, academyId) VALUES (?, ?, ?, ?, ?)', [userId, responsible, email, 'academy_admin', academyId]);
        
        await connection.commit();

        const [[newUser]] = await connection.query('SELECT id, name, email, role, academyId FROM users WHERE id = ?', [userId]);
        const { sessionId, expires } = await createSession(newUser);

        res.cookie('sessionId', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', expires });
        res.status(201).json(newUser);
    } catch (error) {
        await connection.rollback();
        console.error("Register error:", error);
        res.status(500).json({ message: 'Falha ao registrar academia.' });
    } finally {
        connection.release();
    }
});

publicRouter.get('/auth/session', async (req, res) => {
    try {
        const cookies = parseCookies(req);
        const sessionId = cookies.sessionId;
        if (!sessionId) return res.status(401).json({ message: 'Sem sessão.' });

        const user = await validateSession(sessionId);
        if (user) {
            res.json(user);
        } else {
            res.clearCookie('sessionId');
            res.status(401).json({ message: 'Sessão inválida.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao validar sessão.' });
    }
});

publicRouter.post('/auth/logout', async (req, res) => {
    const cookies = parseCookies(req);
    const sessionId = cookies.sessionId;
    if (sessionId) {
        await destroySession(sessionId);
    }
    res.clearCookie('sessionId').json({ message: 'Logout realizado.' });
});

// -----------------------------------------------------------------
// 2. PROTECTED ROUTES (Auth Required)
// -----------------------------------------------------------------

// Apply Authentication Middleware ONLY to protected router
protectedRouter.use(checkSession);

// --- GET Routes (Data Fetching) ---

protectedRouter.get('/students', async (req, res) => {
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
    } catch (e) { console.error(e); res.status(500).json({ message: 'Erro ao buscar alunos' }); }
});

protectedRouter.get('/academies', async (req, res) => {
    try {
        const [academies] = await db.query('SELECT * FROM academies WHERE id != ?', ['master_admin_academy_01']);
        res.json(academies);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Erro ao buscar academias' }); }
});

protectedRouter.get('/schedules', async (req, res) => {
    try {
        const [schedules] = await db.query('SELECT cs.*, GROUP_CONCAT(sa.assistantId) as assistantIds FROM class_schedules cs LEFT JOIN schedule_assistants sa ON cs.id = sa.scheduleId GROUP BY cs.id');
        schedules.forEach(s => s.assistantIds = s.assistantIds ? s.assistantIds.split(',') : []);
        res.json(schedules);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Erro ao buscar horários' }); }
});

protectedRouter.get('/graduations', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM graduations');
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Erro ao buscar graduações' }); }
});

protectedRouter.get('/professors', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM professors');
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Erro ao buscar professores' }); }
});

protectedRouter.get('/users', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, email, role, academyId, studentId, birthDate FROM users');
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Erro ao buscar usuários' }); }
});

protectedRouter.get('/attendance', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM attendance_records');
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Erro ao buscar frequência' }); }
});

protectedRouter.get('/logs', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM activity_logs ORDER BY `timestamp` DESC LIMIT 100');
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Erro ao buscar logs' }); }
});

protectedRouter.get('/news', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM news_articles ORDER BY `date` DESC');
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Erro ao buscar notícias' }); }
});

protectedRouter.get('/settings/all', async (req, res) => {
    try {
        if (req.user.role !== 'general_admin') return res.status(403).json({ message: "Acesso negado." });
        const [[settings]] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        res.json(settings);
    } catch (e) { console.error(e); res.status(500).json({ message: "Erro ao buscar configurações completas." }); }
});

// --- Data Modification (CRUD) Helper ---

const genericDelete = (tableName, beforeDelete) => async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        if (beforeDelete) await beforeDelete(id, connection);
        const [result] = await connection.query(`DELETE FROM \`${tableName}\` WHERE id = ?`, [id]);
        await connection.commit();
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Item not found.' });
        await logActivity(req.user.userId, `Delete ${tableName}`, `ID: ${id}`);
        res.status(204).send();
    } catch (error) {
        await connection.rollback();
        console.error(`Delete error ${tableName}:`, error);
        res.status(500).json({ message: "Erro ao deletar." });
    } finally {
        connection.release();
    }
};

// --- Specific POST/PUT Handlers ---

protectedRouter.put('/settings', async (req, res) => {
    if (req.user.role !== 'general_admin') return res.status(403).json({ message: "Acesso negado." });
    try {
        const { id, ...settings } = req.body;
        const booleanFields = ['publicPageEnabled', 'useGradient', 'socialLoginEnabled'];
        booleanFields.forEach(field => { if (field in settings) settings[field] = settings[field] ? 1 : 0; });
        const setClause = Object.keys(settings).map(field => `\`${field}\` = ?`).join(', ');
        await db.query(`UPDATE theme_settings SET ${setClause} WHERE id = 1`, Object.values(settings));
        const [[updated]] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        res.json(updated);
    } catch(e) { console.error(e); res.status(500).json({message: 'Erro ao salvar configurações'}); }
});

const saveStudent = async (req, res) => {
    const data = req.body;
    const isNew = !req.params.id;
    const id = isNew ? uuidv4() : req.params.id;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        if (isNew) {
            const userId = uuidv4();
            const hash = await bcrypt.hash(data.password || '123456', 10);
            await connection.query('INSERT INTO students (id, name, email, password, birthDate, cpf, fjjpe_registration, phone, address, beltId, academyId, firstGraduationDate, paymentStatus, paymentDueDateDay, stripes, isCompetitor, lastCompetition, medals, imageUrl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', 
                [id, data.name, data.email, hash, data.birthDate, data.cpf, data.fjjpe_registration, data.phone, data.address, data.beltId, data.academyId, data.firstGraduationDate, 'unpaid', data.paymentDueDateDay, data.stripes, data.isCompetitor, data.lastCompetition, JSON.stringify(data.medals), data.imageUrl]);
            await connection.query('INSERT INTO users (id, name, email, role, studentId, birthDate, academyId) VALUES (?,?,?,?,?,?,?)', 
                [userId, data.name, data.email, 'student', id, data.birthDate, data.academyId]);
        } else {
            let query = 'UPDATE students SET name=?, email=?, birthDate=?, cpf=?, fjjpe_registration=?, phone=?, address=?, beltId=?, academyId=?, firstGraduationDate=?, lastPromotionDate=?, paymentDueDateDay=?, stripes=?, isCompetitor=?, lastCompetition=?, medals=?, imageUrl=?';
            const params = [data.name, data.email, data.birthDate, data.cpf, data.fjjpe_registration, data.phone, data.address, data.beltId, data.academyId, data.firstGraduationDate, data.lastPromotionDate, data.paymentDueDateDay, data.stripes, data.isCompetitor, data.lastCompetition, JSON.stringify(data.medals), data.imageUrl];
            if (data.password) { query += ', password=?'; params.push(await bcrypt.hash(data.password, 10)); }
            query += ' WHERE id=?'; params.push(id);
            await connection.query(query, params);
            await connection.query('UPDATE users SET name=?, email=?, birthDate=?, academyId=? WHERE studentId=?', [data.name, data.email, data.birthDate, data.academyId, id]);
        }
        await connection.commit();
        const [[saved]] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
        res.json(saved);
    } catch (e) { await connection.rollback(); console.error(e); res.status(500).json({message: 'Erro ao salvar aluno'}); } finally { connection.release(); }
};
protectedRouter.post('/students', saveStudent);
protectedRouter.put('/students/:id', saveStudent);
protectedRouter.delete('/students/:id', genericDelete('students', async(id, conn) => {
    await conn.query('DELETE FROM payment_history WHERE studentId = ?', [id]);
    await conn.query('DELETE FROM attendance_records WHERE studentId = ?', [id]);
    await conn.query('DELETE FROM users WHERE studentId = ?', [id]);
}));

protectedRouter.post('/students/:studentId/payment', async (req, res) => {
    const { status, amount } = req.body;
    await db.query('UPDATE students SET paymentStatus = ? WHERE id = ?', [status, req.params.studentId]);
    if (status === 'paid') await db.query('INSERT INTO payment_history (id, studentId, `date`, amount) VALUES (?, ?, ?, ?)', [uuidv4(), req.params.studentId, new Date(), amount]);
    const [[s]] = await db.query('SELECT * FROM students WHERE id = ?', [req.params.studentId]);
    res.json(s);
});

const saveAcademy = async (req, res) => {
    const data = req.body;
    const isNew = !req.params.id;
    const id = isNew ? uuidv4() : req.params.id;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        if (isNew) {
            const hash = await bcrypt.hash(data.password, 10);
            await connection.query('INSERT INTO academies (id, name, address, responsible, responsibleRegistration, professorId, imageUrl, email, password) VALUES (?,?,?,?,?,?,?,?,?)', [id, data.name, data.address, data.responsible, data.responsibleRegistration, data.professorId, data.imageUrl, data.email, hash]);
            await connection.query('INSERT INTO users (id, name, email, role, academyId) VALUES (?,?,?,?,?)', [uuidv4(), data.responsible, data.email, 'academy_admin', id]);
        } else {
            await connection.query('UPDATE academies SET name=?, address=?, responsible=?, responsibleRegistration=?, professorId=?, imageUrl=?, email=? WHERE id=?', [data.name, data.address, data.responsible, data.responsibleRegistration, data.professorId, data.imageUrl, data.email, id]);
            if (data.password) {
                const hash = await bcrypt.hash(data.password, 10);
                await connection.query('UPDATE academies SET password=? WHERE id=?', [hash, id]);
            }
            await connection.query('UPDATE users SET name=?, email=? WHERE academyId=? AND role=?', [data.responsible, data.email, id, 'academy_admin']);
        }
        await connection.commit();
        res.json({id, ...data});
    } catch (e) { await connection.rollback(); console.error(e); res.status(500).json({message: 'Erro ao salvar academia'}); } finally { connection.release(); }
};
protectedRouter.post('/academies', saveAcademy);
protectedRouter.put('/academies/:id', saveAcademy);
protectedRouter.delete('/academies/:id', genericDelete('academies'));

const saveProfessor = async (req, res) => {
    const d = req.body;
    const isNew = !req.params.id;
    const id = isNew ? uuidv4() : req.params.id;
    try {
        const q = isNew ? 'INSERT INTO professors (id, name, fjjpe_registration, cpf, academyId, graduationId, imageUrl, blackBeltDate) VALUES (?,?,?,?,?,?,?,?)' : 'UPDATE professors SET name=?, fjjpe_registration=?, cpf=?, academyId=?, graduationId=?, imageUrl=?, blackBeltDate=? WHERE id=?';
        const p = [d.name, d.fjjpe_registration, d.cpf, d.academyId, d.graduationId, d.imageUrl, d.blackBeltDate];
        if (isNew) p.unshift(id); else p.push(id);
        await db.query(q, p);
        const [[saved]] = await db.query('SELECT * FROM professors WHERE id=?', [id]);
        res.json(saved);
    } catch(e) { console.error(e); res.status(500).json({message: 'Erro ao salvar professor'}); }
};
protectedRouter.post('/professors', saveProfessor);
protectedRouter.put('/professors/:id', saveProfessor);
protectedRouter.delete('/professors/:id', genericDelete('professors'));

const saveSchedule = async (req, res) => {
    const d = req.body;
    const id = req.params.id || uuidv4();
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        if (!req.params.id) {
            await conn.query('INSERT INTO class_schedules (id, className, dayOfWeek, startTime, endTime, professorId, academyId, requiredGraduationId) VALUES (?,?,?,?,?,?,?,?)', [id, d.className, d.dayOfWeek, d.startTime, d.endTime, d.professorId, d.academyId, d.requiredGraduationId]);
        } else {
            await conn.query('UPDATE class_schedules SET className=?, dayOfWeek=?, startTime=?, endTime=?, professorId=?, academyId=?, requiredGraduationId=? WHERE id=?', [d.className, d.dayOfWeek, d.startTime, d.endTime, d.professorId, d.academyId, d.requiredGraduationId, id]);
        }
        await conn.query('DELETE FROM schedule_assistants WHERE scheduleId=?', [id]);
        if (d.assistantIds && d.assistantIds.length) {
            const values = d.assistantIds.map(aid => [id, aid]);
            await conn.query('INSERT INTO schedule_assistants (scheduleId, assistantId) VALUES ?', [values]);
        }
        await conn.commit();
        const [[s]] = await db.query('SELECT cs.*, GROUP_CONCAT(sa.assistantId) as assistantIds FROM class_schedules cs LEFT JOIN schedule_assistants sa ON cs.id = sa.scheduleId WHERE cs.id = ? GROUP BY cs.id', [id]);
        if(s) s.assistantIds = s.assistantIds ? s.assistantIds.split(',') : [];
        res.json(s || d);
    } catch (e) { await conn.rollback(); console.error(e); res.status(500).json({message: 'Erro ao salvar horário'}); } finally { conn.release(); }
};
protectedRouter.post('/schedules', saveSchedule);
protectedRouter.put('/schedules/:id', saveSchedule);
protectedRouter.delete('/schedules/:id', genericDelete('class_schedules', async(id, conn)=> await conn.query('DELETE FROM schedule_assistants WHERE scheduleId=?', [id])));

const saveGraduation = async (req, res) => {
    const d = req.body;
    const id = req.params.id || uuidv4();
    try {
        const q = !req.params.id ? 'INSERT INTO graduations (id, name, color, minTimeInMonths, `rank`, type, minAge, maxAge) VALUES (?,?,?,?,?,?,?,?)' : 'UPDATE graduations SET name=?, color=?, minTimeInMonths=?, `rank`=?, type=?, minAge=?, maxAge=? WHERE id=?';
        const p = [d.name, d.color, d.minTimeInMonths, d.rank, d.type, d.minAge, d.maxAge];
        if (!req.params.id) p.unshift(id); else p.push(id);
        await db.query(q, p);
        const [[saved]] = await db.query('SELECT * FROM graduations WHERE id=?', [id]);
        res.json(saved);
    } catch(e) { console.error(e); res.status(500).json({message: 'Erro ao salvar graduação'}); }
};
protectedRouter.post('/graduations', saveGraduation);
protectedRouter.put('/graduations/:id', saveGraduation);
protectedRouter.delete('/graduations/:id', genericDelete('graduations'));
protectedRouter.put('/graduations/ranks', async (req, res) => {
    try {
        await Promise.all(req.body.map(g => db.query('UPDATE graduations SET `rank`=? WHERE id=?', [g.rank, g.id])));
        res.json({success: true});
    } catch(e) { res.status(500).json({message: 'Erro ao atualizar ranks'}); }
});

protectedRouter.post('/attendance', async (req, res) => {
    const { studentId, scheduleId, date, status } = req.body;
    const id = uuidv4();
    try {
        await db.query('INSERT INTO attendance_records (id, studentId, scheduleId, `date`, status) VALUES (?,?,?,?,?)', [id, studentId, scheduleId, date, status]);
        res.json({id, studentId, scheduleId, date, status});
    } catch(e) { res.status(500).json({message: 'Erro ao salvar presença'}); }
});
protectedRouter.delete('/attendance/:id', genericDelete('attendance_records'));


// =================================================================
// --- APP ASSEMBLY
// =================================================================

// Mount Routers
app.use('/api', publicRouter);
app.use('/api', protectedRouter);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Start Server
(async () => {
  await connectToDatabase();
  if (isDbConnected) {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
  }
})();