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
  PORT = 3001,
} = process.env;

if (!JWT_SECRET) {
    console.warn("WARNING: JWT_SECRET not found in .env. Using unsafe default for development only.");
}
const CURRENT_JWT_SECRET = process.env.JWT_SECRET || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30";


// --- Express App Initialization ---
const app = express();
const apiRouter = express.Router();


// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Database Connection ---
let db;
let isDbConnected = false;

async function connectToDatabase() {
  try {
    if (!DATABASE_URL) {
      throw new Error("FATAL: DATABASE_URL environment variable is not defined. Please check your .env file.");
    }
    // Check for a placeholder value to prevent common setup errors.
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
    // We exit here because the app is useless without a DB. PM2 will handle restarts.
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

// --- JWT Authentication Middleware (Stateless) ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
      return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
  }

  jwt.verify(token, CURRENT_JWT_SECRET, (err, user) => {
      if (err) {
          const isExpired = err.name === 'TokenExpiredError';
          return res.status(401).json({
              message: isExpired ? 'Sua sessão expirou.' : 'Token inválido.',
              code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'
          });
      }
      req.user = user;
      next();
  });
};

// =================================================================
// PUBLIC API ROUTES (Defined BEFORE authentication middleware)
// =================================================================

apiRouter.get('/settings', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        if (rows && rows.length > 0) return res.json(rows[0]);
        res.status(404).json({ message: "Settings not found" });
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: "Failed to fetch settings." });
    }
});

apiRouter.post('/auth/login', async (req, res) => {
    const { emailOrCpf, pass } = req.body;

    if (!emailOrCpf || !pass) {
        return res.status(400).json({ message: 'Email/CPF e senha são obrigatórios.' });
    }

    try {
        let user;
        let passwordHash;

        if (emailOrCpf.includes('@')) {
            const [users] = await db.query('SELECT * FROM users WHERE email = ?', [emailOrCpf]);
            if (users.length > 0) user = users[0];
        } else {
            const sanitizedCpf = emailOrCpf.replace(/\D/g, '');
            const [students] = await db.query('SELECT id FROM students WHERE cpf = ?', [sanitizedCpf]);
            if (students.length > 0) {
                const [users] = await db.query('SELECT * FROM users WHERE studentId = ?', [students[0].id]);
                if (users.length > 0) user = users[0];
            }
        }

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        if (user.role === 'student') {
            const [students] = await db.query('SELECT password FROM students WHERE id = ?', [user.studentId]);
            if (students.length > 0) passwordHash = students[0].password;
        } else if (user.role === 'academy_admin' || user.role === 'general_admin') {
            const [academies] = await db.query('SELECT password FROM academies WHERE id = ?', [user.academyId]);
            if (academies.length > 0) passwordHash = academies[0].password;
        }
        
        if (!passwordHash) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(pass, passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Generate Tokens
        const accessToken = jwt.sign({ userId: user.id, role: user.role }, CURRENT_JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ userId: user.id }, CURRENT_JWT_SECRET, { expiresIn: '7d' });
        
        // Store refresh token in DB
        await db.query('UPDATE users SET refreshToken = ? WHERE id = ?', [refreshToken, user.id]);
        
        await logActivity(user.id, 'Login', 'Usuário logado com sucesso.');
        res.json({ accessToken, refreshToken });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Erro interno no servidor durante o login.', error: error.message });
    }
});

apiRouter.post('/auth/refresh', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: "Refresh token não fornecido." });

    try {
        const decoded = jwt.verify(token, CURRENT_JWT_SECRET);
        const [users] = await db.query('SELECT * FROM users WHERE id = ? AND refreshToken = ?', [decoded.userId, token]);

        if (users.length === 0) {
            return res.status(403).json({ message: "Refresh token inválido ou revogado." });
        }

        const user = users[0];
        
        // Issue new tokens (token rotation)
        const newAccessToken = jwt.sign({ userId: user.id, role: user.role }, CURRENT_JWT_SECRET, { expiresIn: '15m' });
        const newRefreshToken = jwt.sign({ userId: user.id }, CURRENT_JWT_SECRET, { expiresIn: '7d' });

        await db.query('UPDATE users SET refreshToken = ? WHERE id = ?', [newRefreshToken, user.id]);

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });

    } catch (error) {
        return res.status(403).json({ message: "Refresh token inválido ou expirado." });
    }
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
        
        await connection.query('INSERT INTO academies (id, name, address, responsible, responsibleRegistration, email, password, professorId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [academyId, name, address, responsible, responsibleRegistration, email, hashedPassword, null]);
        await connection.query('INSERT INTO users (id, name, email, role, academyId) VALUES (?, ?, ?, ?, ?)', [userId, responsible, email, 'academy_admin', academyId]);
        
        await connection.commit();
        await logActivity(userId, 'Academy Registration', `Academia "${name}" registrada.`);
        const [[newAcademy]] = await db.query('SELECT * FROM academies WHERE id = ?', [academyId]);
        res.status(201).json(newAcademy);
    } catch (error) {
        await connection.rollback();
        console.error("Registration Error:", error);
        res.status(500).json({ message: 'Falha ao registrar academia.' });
    } finally {
        connection.release();
    }
});

// =================================================================
// APPLY AUTHENTICATION MIDDLEWARE
// All routes defined below this line are protected
// =================================================================

apiRouter.use(authenticateToken);

// =================================================================
// PROTECTED API ROUTES
// =================================================================

apiRouter.post('/auth/logout', async (req, res) => {
    try {
        const userId = req.user.userId;
        await db.query('UPDATE users SET refreshToken = NULL WHERE id = ?', [userId]);
        await logActivity(userId, 'Logout', 'Usuário deslogado.');
        res.status(200).json({ message: 'Logout bem-sucedido.' });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: 'Falha ao fazer logout.' });
    }
});

apiRouter.get('/auth/session', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, role, academyId, studentId, birthDate FROM users WHERE id = ?', [req.user.userId]);
        if (users.length > 0) {
            return res.json(users[0]);
        }
        res.status(404).json({ message: 'Usuário da sessão não encontrado.' });
    } catch (error) {
        console.error("Session validation error:", error);
        res.status(500).json({ message: 'Falha ao validar sessão.' });
    }
});

const genericGet = (tableName) => async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM \`${tableName}\``);
        res.json(rows);
    } catch (error) {
        console.error(`Error fetching from ${tableName}:`, error);
        res.status(500).json({ message: `Failed to fetch from ${tableName}.` });
    }
};

apiRouter.get('/users', genericGet('users'));
apiRouter.get('/academies', genericGet('academies'));
apiRouter.get('/graduations', genericGet('graduations'));
apiRouter.get('/professors', genericGet('professors'));
apiRouter.get('/logs', genericGet('activity_logs'));
apiRouter.get('/attendance', genericGet('attendance_records'));

apiRouter.get('/students', async (req, res) => {
     try {
        const [students] = await db.query('SELECT * FROM students');
        const [payments] = await db.query('SELECT * FROM payment_history ORDER BY `date` DESC');
        
        const paymentsByStudent = payments.reduce((acc, payment) => {
            if (!acc[payment.studentId]) {
                acc[payment.studentId] = [];
            }
            acc[payment.studentId].push(payment);
            return acc;
        }, {});
        
        for (const student of students) {
            student.paymentHistory = paymentsByStudent[student.id] || [];
            if (student.medals && typeof student.medals === 'string') {
                try { student.medals = JSON.parse(student.medals); } catch (e) { student.medals = { gold: 0, silver: 0, bronze: 0 }; }
            } else if (!student.medals) {
                 student.medals = { gold: 0, silver: 0, bronze: 0 };
            }
        }
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Failed to fetch students.' });
    }
});

apiRouter.post('/students', async (req, res) => {
    const data = req.body;
    if (!data.password) return res.status(400).json({ message: "Password is required for new students."});
    
    const studentId = uuidv4();
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('INSERT INTO students (id, name, email, password, birthDate, cpf, fjjpe_registration, phone, address, beltId, academyId, firstGraduationDate, paymentStatus, paymentDueDateDay, stripes, isCompetitor, lastCompetition, medals, imageUrl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [studentId, data.name, data.email, hashedPassword, data.birthDate, data.cpf, data.fjjpe_registration, data.phone, data.address, data.beltId, data.academyId, data.firstGraduationDate, 'unpaid', data.paymentDueDateDay, data.stripes || 0, data.isCompetitor || false, data.lastCompetition || null, JSON.stringify(data.medals || {}), data.imageUrl || null]);
        await connection.query('INSERT INTO users (id, name, email, role, studentId, birthDate) VALUES (?,?,?,?,?,?)', [userId, data.name, data.email, 'student', studentId, data.birthDate]);
        await connection.commit();
        await logActivity(req.user.userId, 'Create Student', `Created student ${data.name}`);
        const [[newStudent]] = await db.query('SELECT * FROM students WHERE id = ?', [studentId]);
        res.status(201).json(newStudent);
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
        
        await connection.commit();
        await logActivity(req.user.userId, 'Update Student', `Updated student ${data.name}`);
        const [[updatedStudent]] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
        res.status(200).json(updatedStudent);
    } catch (error) { await connection.rollback(); res.status(500).json({ message: "Failed to update student", error: error.message }); } finally { connection.release(); }
});

apiRouter.delete('/students/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM payment_history WHERE studentId = ?', [id]);
        await connection.query('DELETE FROM attendance_records WHERE studentId = ?', [id]);
        await connection.query('DELETE FROM users WHERE studentId = ?', [id]);
        const [result] = await connection.query('DELETE FROM students WHERE id = ?', [id]);
        await connection.commit();
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Student not found.' });
        }
        await logActivity(req.user.userId, 'Delete Student', `Deleted student with id ${id}`);
        res.status(204).send();
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting student:', error);
        res.status(500).json({ message: "Failed to delete student", error: error.message });
    } finally {
        connection.release();
    }
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
        const [[updatedSettings]] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        res.json(updatedSettings);
    } catch (error) {
        console.error("Error updating settings:", error);
        res.status(500).json({ message: 'Failed to update settings.' });
    }
});

apiRouter.post('/students/:studentId/payment', async (req, res) => {
    const { studentId } = req.params;
    const { status, amount } = req.body;
    if (!['paid', 'unpaid'].includes(status)) return res.status(400).json({ message: "Invalid status." });

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

const simpleCrud = (tableName, fields) => {
    const router = express.Router();
    
    router.delete('/:id', async (req, res) => {
        try {
            await db.query(`DELETE FROM \`${tableName}\` WHERE \`id\` = ?`, [req.params.id]);
            await logActivity(req.user.userId, `Delete ${tableName}`, `Deleted item with id ${req.params.id}`);
            res.status(204).send();
        } catch (error) { res.status(500).json({ message: `Failed to delete from ${tableName}.`, error: error.message }); }
    });

    const handleSave = async (req, res) => {
        const data = req.body;
        const isNew = !data.id;
        const id = isNew ? uuidv4() : data.id;
        try {
            if (isNew) {
                const columns = ['`id`', ...fields.map(f => `\`${f}\``)].join(', ');
                const placeholders = ['?', ...fields.map(() => '?')].join(', ');
                const values = [id, ...fields.map(f => data[f] ?? null)];
                await db.query(`INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`, values);
            } else {
                const setClause = fields.map(f => `\`${f}\` = ?`).join(', ');
                const values = [...fields.map(f => data[f] ?? null), id];
                await db.query(`UPDATE \`${tableName}\` SET ${setClause} WHERE \`id\` = ?`, values);
            }
            await logActivity(req.user.userId, `Save ${tableName}`, `${isNew ? 'Created' : 'Updated'} item ${data.name || id}`);
            const [[savedItem]] = await db.query(`SELECT * FROM \`${tableName}\` WHERE id = ?`, [id]);
            res.status(isNew ? 201 : 200).json(savedItem);
        } catch (error) { res.status(500).json({ message: `Failed to save to ${tableName}`, error: error.message }); }
    };
    router.post('/', handleSave);
    router.put('/:id', handleSave);

    return router;
}

apiRouter.put('/graduations/ranks', async (req, res) => {
    const gradsWithNewRanks = req.body;
    if (!Array.isArray(gradsWithNewRanks)) {
        return res.status(400).json({ message: 'Expected an array of graduations.' });
    }
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const promises = gradsWithNewRanks.map(grad =>
            connection.query('UPDATE graduations SET `rank` = ? WHERE id = ?', [grad.rank, grad.id])
        );
        await Promise.all(promises);
        await connection.commit();
        await logActivity(req.user.userId, 'Update Graduation Ranks', `Reordered ${gradsWithNewRanks.length} graduations.`);
        res.status(200).json({ success: true });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating graduation ranks:', error);
        res.status(500).json({ message: 'Failed to update graduation ranks.', error: error.message });
    } finally {
        connection.release();
    }
});

const scheduleRouter = express.Router();
scheduleRouter.get('/', async (req, res) => {
    try {
        const [schedules] = await db.query(`
            SELECT 
                cs.*, 
                GROUP_CONCAT(sa.assistantId) as assistantIds 
            FROM 
                class_schedules cs 
            LEFT JOIN 
                schedule_assistants sa ON cs.id = sa.scheduleId 
            GROUP BY 
                cs.id
        `);

        for (const schedule of schedules) {
            schedule.assistantIds = schedule.assistantIds ? schedule.assistantIds.split(',') : [];
        }
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ message: 'Failed to fetch schedules.' });
    }
});
scheduleRouter.post('/', async (req, res) => {
    const { assistantIds = [], ...data } = req.body;
    const scheduleId = uuidv4();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('INSERT INTO class_schedules (id, className, dayOfWeek, startTime, endTime, professorId, academyId, requiredGraduationId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [scheduleId, data.className, data.dayOfWeek, data.startTime, data.endTime, data.professorId, data.academyId, data.requiredGraduationId]);
        if (assistantIds.length > 0) {
            const assistantValues = assistantIds.map(assistId => [scheduleId, assistId]);
            await connection.query('INSERT INTO schedule_assistants (scheduleId, assistantId) VALUES ?', [assistantValues]);
        }
        await connection.commit();
        await logActivity(req.user.userId, 'Create Schedule', `Created schedule ${data.className}`);
        const [[newSchedule]] = await db.query('SELECT * FROM class_schedules WHERE id = ?', [scheduleId]);
        newSchedule.assistantIds = assistantIds;
        res.status(201).json(newSchedule);
    } catch (error) { await connection.rollback(); res.status(500).json({ message: 'Failed to create schedule', error: error.message }); } finally { connection.release(); }
});
scheduleRouter.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { assistantIds = [], ...data } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE class_schedules SET className=?, dayOfWeek=?, startTime=?, endTime=?, professorId=?, academyId=?, requiredGraduationId=? WHERE id=?', [data.className, data.dayOfWeek, data.startTime, data.endTime, data.professorId, data.academyId, data.requiredGraduationId, id]);
        await connection.query('DELETE FROM schedule_assistants WHERE scheduleId = ?', [id]);
        if (assistantIds.length > 0) {
            const assistantValues = assistantIds.map(assistId => [id, assistId]);
            await connection.query('INSERT INTO schedule_assistants (scheduleId, assistantId) VALUES ?', [assistantValues]);
        }
        await connection.commit();
        await logActivity(req.user.userId, 'Update Schedule', `Updated schedule ${data.className}`);
        const [[updatedSchedule]] = await db.query('SELECT * FROM class_schedules WHERE id = ?', [id]);
        updatedSchedule.assistantIds = assistantIds;
        res.status(200).json(updatedSchedule);
    } catch (error) { await connection.rollback(); res.status(500).json({ message: 'Failed to update schedule', error: error.message }); } finally { connection.release(); }
});
scheduleRouter.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM schedule_assistants WHERE scheduleId = ?', [id]);
        await connection.query('DELETE FROM class_schedules WHERE id = ?', [id]);
        await connection.commit();
        await logActivity(req.user.userId, 'Delete Schedule', `Deleted schedule with id ${id}`);
        res.status(204).send();
    } catch (error) { await connection.rollback(); res.status(500).json({ message: 'Failed to delete schedule', error: error.message }); } finally { connection.release(); }
});
apiRouter.use('/schedules', scheduleRouter);

apiRouter.use('/graduations', simpleCrud('graduations', ['name', 'color', 'minTimeInMonths', 'rank', 'type', 'minAge', 'maxAge']));
apiRouter.use('/professors', simpleCrud('professors', ['name', 'fjjpe_registration', 'cpf', 'academyId', 'graduationId', 'imageUrl', 'blackBeltDate']));
apiRouter.use('/attendance', simpleCrud('attendance_records', ['studentId', 'scheduleId', 'date', 'status']));

// --- Mount API Router ---
app.use('/api', checkDbConnection, apiRouter);


// --- 404 HANDLER FOR API ---
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