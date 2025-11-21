/**
 * ==============================================================================
 *           Backend Server for Jiu-Jitsu Hub SAAS (server.js)
 * ==============================================================================
 *
 * This single file acts as the complete backend for the application. It uses
 * Express.js to create an API that connects to a MySQL database.
 * This version uses ES Modules (`import`/`export`) for compatibility.
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

// --- Dependencies (ESM Syntax) ---
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config'; // Automatically loads .env file

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
    // Create the pool. This doesn't connect immediately.
    const pool = mysql.createPool({ uri: DATABASE_URL, connectionLimit: 10, enableKeepAlive: true, keepAliveInitialDelay: 10000 });
    
    // Actively test the connection by getting a client from the pool.
    const connection = await pool.getConnection();
    // If we get here, the connection is successful. Release it back to the pool.
    connection.release();
    
    // Assign the successfully tested pool to our global db variable.
    db = pool;
    console.log('Successfully connected to the MySQL database.');
    isDbConnected = true;
  } catch (error) {
    console.error('Failed to connect to the database:', error.message);
    // On failure, ensure the flag is false so the middleware can block requests.
    isDbConnected = false;
  }
}

// --- Database Status Middleware ---
// This middleware runs for all /api routes and checks the connection flag.
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
    if (!isDbConnected) return; // Don't try to log if DB is down
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
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};


// --- Generic API Handlers ---
const handleGet = (tableName) => async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM \`${tableName}\``);
        
        // Handle special cases with related data
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
             }
        }
        if (tableName === 'students' || tableName === 'professors') {
            for (const row of rows) {
                if (row.medals && typeof row.medals === 'string') {
                    try {
                        row.medals = JSON.parse(row.medals);
                    } catch (e) {
                        console.error(`Failed to parse medals for ID ${row.id}:`, row.medals);
                        row.medals = { gold: 0, silver: 0, bronze: 0 };
                    }
                }
            }
        }
        res.json(rows);
    } catch (error) {
        console.error(`Error fetching from ${tableName}:`, error);
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
        console.error(`Error deleting from ${tableName}:`, error);
        res.status(500).json({ message: `Failed to delete from ${tableName}.` });
    }
};


// --- API Routes ---

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
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
        console.error('Registration Error:', error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email or another unique field already exists.' });
        res.status(500).json({ message: 'Failed to register academy.' });
    } finally {
        connection.release();
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { emailOrCpf, pass } = req.body;

    if (!emailOrCpf || !pass) {
        return res.status(400).json({ message: 'Email/CPF e senha são obrigatórios.' });
    }

    try {
        let userRecord;
        let passwordHash;
        const isEmail = String(emailOrCpf).includes('@');

        if (isEmail) {
            // --- Login com Email ---
            const [users] = await db.query('SELECT * FROM users WHERE email = ?', [emailOrCpf]);
            if (!users.length) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }
            
            userRecord = users[0];

            if (userRecord.role === 'student') {
                const [students] = await db.query('SELECT password FROM students WHERE id = ?', [userRecord.studentId]);
                passwordHash = students.length ? students[0].password : null;
            } else { // 'academy_admin' or 'general_admin'
                const [academies] = await db.query('SELECT password FROM academies WHERE id = ?', [userRecord.academyId]);
                passwordHash = academies.length ? academies[0].password : null;
            }
        } else {
            // --- Login com CPF (apenas para alunos) ---
            const sanitizedCpf = String(emailOrCpf).replace(/[^\d]/g, '');
            const [students] = await db.query(
                'SELECT id, password FROM students WHERE REPLACE(REPLACE(cpf, ".", ""), "-", "") = ?', 
                [sanitizedCpf]
            );

            if (!students.length) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }

            const student = students[0];
            passwordHash = student.password;

            // Encontrar o usuário correspondente para obter o ID e o papel para o token
            const [users] = await db.query('SELECT * FROM users WHERE studentId = ?', [student.id]);
            if (!users.length) {
                // Inconsistência de dados, mas para o usuário é uma falha de login
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }
            userRecord = users[0];
        }
        
        // --- Validação da Senha e Geração do Token ---
        if (!userRecord || !passwordHash) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const isMatch = await bcrypt.compare(pass, passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const payload = { userId: userRecord.id, role: userRecord.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

        await logActivity(userRecord.id, 'Login', 'Usuário logado com sucesso.');

        res.json({ token });

    } catch (error) {
        console.error('Erro no Login:', error);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});


// --- Simple GET routes (no auth needed for this one as per frontend logic)
app.get('/api/users', handleGet('users'));

// --- Protected Routes ---
app.use(authenticateToken);

// --- Simple GET routes (Protected) ---
app.get('/api/students', handleGet('students'));
app.get('/api/academies', handleGet('academies'));
app.get('/api/news', handleGet('news_articles'));
app.get('/api/graduations', handleGet('graduations'));
app.get('/api/schedules', handleGet('class_schedules'));
app.get('/api/attendance', handleGet('attendance_records'));
app.get('/api/professors', handleGet('professors'));
app.get('/api/logs', handleGet('activity_logs'));

// --- Simple DELETE routes ---
app.delete('/api/academies/:id', handleDelete('academies'));
app.delete('/api/graduations/:id', handleDelete('graduations'));
app.delete('/api/schedules/:id', handleDelete('schedules'));
app.delete('/api/attendance/:id', handleDelete('attendance_records'));
app.delete('/api/professors/:id', handleDelete('professors'));


// --- Complex CRUD Routes ---

// Students
app.post('/api/students', async (req, res) => {
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

app.put('/api/students/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        let updateQuery = 'UPDATE students SET name=?, email=?, birthDate=?, cpf=?, fjjpe_registration=?, phone=?, address=?, beltId=?, academyId=?, firstGraduationDate=?, lastPromotionDate=?, paymentDueDateDay=?, stripes=?, isCompetitor=?, lastCompetition=?, medals=?, imageUrl=? WHERE id=?';
        const queryParams = [data.name, data.email, data.birthDate, data.cpf, data.fjjpe_registration, data.phone, data.address, data.beltId, data.academyId, data.firstGraduationDate, data.lastPromotionDate, data.paymentDueDateDay, data.stripes, data.isCompetitor, data.lastCompetition, JSON.stringify(data.medals || {}), data.imageUrl, id];
        
        if (data.password) {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            updateQuery = 'UPDATE students SET name=?, email=?, password=?, birthDate=?, cpf=?, fjjpe_registration=?, phone=?, address=?, beltId=?, academyId=?, firstGraduationDate=?, lastPromotionDate=?, paymentDueDateDay=?, stripes=?, isCompetitor=?, lastCompetition=?, medals=?, imageUrl=? WHERE id=?';
            queryParams.splice(2, 0, hashedPassword); // Insert password in the right place
        }

        await connection.query(updateQuery, queryParams);
        await connection.query('UPDATE users SET name=?, email=?, birthDate=? WHERE studentId=?', [data.name, data.email, data.birthDate, id]);
        await logActivity(req.user.userId, 'Update Student', `Updated student ${data.name}`);
        await connection.commit();
        res.status(200).json({ id, ...data });
    } catch (error) { await connection.rollback(); res.status(500).json({ message: "Failed to update student", error: error.message }); } finally { connection.release(); }
});

app.delete('/api/students/:id', async (req, res) => {
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
app.post('/api/students/:studentId/payment', async (req, res) => {
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

// Academies, Professors, Graduations, Schedules (generic save)
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
            if (data.assistantIds && data.assistantIds.length > 0) {
                const assistantValues = data.assistantIds.map(assistantId => [id, assistantId]);
                await connection.query('INSERT INTO schedule_assistants (scheduleId, assistantId) VALUES ?', [assistantValues]);
            }
        }

        await connection.commit();
        await logActivity(req.user.userId, `Save ${tableName}`, `${isNew ? 'Created' : 'Updated'} item ${data.name || id}`);
        res.status(isNew ? 201 : 200).json({ id, ...data });
    } catch (error) { await connection.rollback(); console.error(error); res.status(500).json({ message: `Failed to save to ${tableName}`, error: error.message }); } finally { connection.release(); }
};

app.post('/api/academies', handleSave('academies', ['name', 'address', 'responsible', 'responsibleRegistration', 'professorId', 'imageUrl', 'email', 'password']));
app.put('/api/academies/:id', handleSave('academies', ['name', 'address', 'responsible', 'responsibleRegistration', 'professorId', 'imageUrl', 'email', 'password']));
app.post('/api/professors', handleSave('professors', ['name', 'fjjpe_registration', 'cpf', 'academyId', 'graduationId', 'imageUrl', 'blackBeltDate']));
app.put('/api/professors/:id', handleSave('professors', ['name', 'fjjpe_registration', 'cpf', 'academyId', 'graduationId', 'imageUrl', 'blackBeltDate']));
app.post('/api/graduations', handleSave('graduations', ['name', 'color', 'minTimeInMonths', 'rank', 'type', 'minAge', 'maxAge']));
app.put('/api/graduations/:id', handleSave('graduations', ['name', 'color', 'minTimeInMonths', 'rank', 'type', 'minAge', 'maxAge']));
app.post('/api/schedules', handleSave('class_schedules', ['className', 'dayOfWeek', 'startTime', 'endTime', 'professorId', 'academyId', 'requiredGraduationId']));
app.put('/api/schedules/:id', handleSave('class_schedules', ['className', 'dayOfWeek', 'startTime', 'endTime', 'professorId', 'academyId', 'requiredGraduationId']));

// Special Routes
app.put('/api/graduations/ranks', async (req, res) => {
    const gradsWithNewRanks = req.body; // Expects an array of [{ id, rank }]
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const promises = gradsWithNewRanks.map(grad => 
            connection.query('UPDATE graduations SET `rank` = ? WHERE id = ?', [grad.rank, grad.id])
        );
        await Promise.all(promises);
        await connection.commit();
        await logActivity(req.user.userId, 'Update Ranks', `Reordered graduations.`);
        res.json({ success: true });
    } catch (error) { await connection.rollback(); res.status(500).json({ message: 'Failed to update ranks', error: error.message }); } finally { connection.release(); }
});
app.post('/api/attendance', async (req, res) => {
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


// --- Server Start ---
(async () => {
  // Try to connect to DB on startup
  await connectToDatabase();
  
  // Start the server regardless, but the middleware will block API calls if DB is down.
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    if (!isDbConnected) {
      console.warn('Warning: Server started, but is NOT connected to the database. API requests will fail.');
    }
  });
})();