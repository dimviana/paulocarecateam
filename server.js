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
  heroHtml: `
<div class="relative bg-white text-slate-800 text-center py-20 px-4 overflow-hidden" style="background-image: url('https://images.unsplash.com/photo-1581009137052-c40971b51c69?q=80&w=2070&auto=format&fit=crop'); background-size: cover; background-position: center;">
    <div class="absolute inset-0 bg-white/50 backdrop-blur-sm"></div>
    <div class="relative z-10 container mx-auto">
        <h1 class="text-5xl font-bold mb-4 animate-fade-in-down">Jiu-Jitsu: Arte, Disciplina, Respeito</h1>
        <p class="text-xl text-slate-600 animate-fade-in-up">Transforme sua vida dentro e fora do tatame. Junte-se à nossa família.</p>
        <a href="#filiais" class="mt-8 inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-lg transition duration-300">Encontre uma Academia</a>
    </div>
</div>
  `,
  aboutHtml: `
<div id="quem-somos" class="py-16 bg-slate-50 px-4">
    <div class="container mx-auto text-center">
        <h2 class="text-4xl font-bold text-amber-600 mb-6">Quem Somos</h2>
        <p class="text-lg text-slate-600 max-w-3xl mx-auto">
            Somos mais do que uma academia, somos uma comunidade unida pela paixão pelo Jiu-Jitsu. Com instrutores de classe mundial e um ambiente acolhedor, nossa missão é capacitar cada aluno a atingir seu potencial máximo, promovendo saúde, autoconfiança e respeito mútuo.
        </p>
    </div>
</div>
  `,
  branchesHtml: `
<div id="filiais" class="py-16 bg-white px-4">
    <div class="container mx-auto text-center">
        <h2 class="text-4xl font-bold text-amber-600 mb-10">Nossas Filiais</h2>
        <p class="text-slate-600">Aqui você pode listar suas academias. Este conteúdo é totalmente personalizável na área de configurações!</p>
        <!-- Exemplo: <div class="mt-4 p-4 bg-slate-100 rounded"><h3>Nome da Academia</h3><p>Endereço</p></div> -->
    </div>
</div>
  `,
  footerHtml: `
<div class="py-8 bg-slate-100 text-center text-slate-500">
    <p>{{{copyright_line}}}</p>
    <p>Desenvolvido com a Arte Suave em mente.</p>
</div>
  `,
  customCss: `
@keyframes fade-in-down {
    0% {
        opacity: 0;
        transform: translateY(-20px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}
@keyframes fade-in-up {
    0% {
        opacity: 0;
        transform: translateY(20px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}
.animate-fade-in-down {
    animation: fade-in-down 1s ease-out forwards;
}
.animate-fade-in-up {
    animation: fade-in-up 1s ease-out 0.5s forwards;
}
html {
    scroll-behavior: smooth;
}
  `,
  customJs: `
// console.log("Custom JS loaded!");
  `,
  socialLoginEnabled: false,
  googleClientId: '',
  facebookAppId: '',
  pixKey: '',
  pixHolderName: '',
  copyrightText: 'ABILDEVELOPER',
  systemVersion: '1.0.0',
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
        if (tableName === 'students') {
            for (const row of rows) {
                if (row.medals && typeof row.medals === 'string') {
                    try {
                        row.medals = JSON.parse(row.medals);
                    } catch (e) {
                        console.error(`Failed to parse medals for student ID ${row.id}:`, row.medals);
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
        const isEmail = String(emailOrCpf).includes('@');
        let query;
        let queryParams;

        if (isEmail) {
            // Busca por email, juntando tabelas para pegar a senha de alunos ou academias em uma única consulta.
            query = `
                SELECT 
                    u.id AS userId, u.role,
                    COALESCE(s.password, a.password) AS passwordHash
                FROM users u
                LEFT JOIN students s ON u.studentId = s.id
                LEFT JOIN academies a ON u.academyId = a.id
                WHERE u.email = ?
            `;
            queryParams = [emailOrCpf];
        } else { // Login com CPF (apenas para alunos)
            const sanitizedCpf = String(emailOrCpf).replace(/[^\d]/g, '');
            // Busca por CPF, juntando com a tabela de usuários.
            query = `
                SELECT 
                    u.id AS userId, u.role, s.password AS passwordHash
                FROM users u
                JOIN students s ON u.studentId = s.id
                WHERE REPLACE(REPLACE(s.cpf, ".", ""), "-", "") = ?
            `;
            queryParams = [sanitizedCpf];
        }

        const [results] = await db.query(query, queryParams);

        if (results.length === 0 || !results[0].passwordHash) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const userData = results[0];
        const isMatch = await bcrypt.compare(pass, userData.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const payload = { userId: userData.userId, role: userData.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

        await logActivity(userData.userId, 'Login', 'Usuário logado com sucesso.');
        res.json({ token });

    } catch (error) {
        console.error('Erro no Login:', error);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});


// --- Public GET routes (for initial app load) ---
app.get('/api/users', handleGet('users'));
app.get('/api/settings', async (req, res) => {
    // This endpoint is designed to be resilient. If the database query fails
    // or if no settings are found (e.g., on a fresh install before the DB is seeded),
    // it will return a default set of theme settings. This ensures the frontend
    // can always initialize successfully.
    try {
        const [rows] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        
        // If we get a valid result, return it.
        if (rows && rows.length > 0) {
            return res.json(rows[0]);
        }
        
        // Fallback for an empty settings table.
        console.warn('No settings found in the database. Serving default settings.');
        res.json(initialThemeSettings);

    } catch (error) {
        // Fallback for any database error (e.g., table not found).
        console.error('Error fetching settings from database. Serving default settings as a fallback.', error.message);
        res.json(initialThemeSettings);
    }
});


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

app.put('/api/settings', async (req, res) => {
    const settings = req.body;
    const { id, ...settingsToUpdate } = settings;

    try {
        settingsToUpdate.publicPageEnabled = settingsToUpdate.publicPageEnabled ? 1 : 0;
        settingsToUpdate.useGradient = settingsToUpdate.useGradient ? 1 : 0;
        settingsToUpdate.socialLoginEnabled = settingsToUpdate.socialLoginEnabled ? 1 : 0;

        const fields = Object.keys(settingsToUpdate);
        const values = Object.values(settingsToUpdate);
        
        const setClause = fields.map(field => `\`${field}\` = ?`).join(', ');
        const query = `UPDATE theme_settings SET ${setClause} WHERE id = 1`;

        await db.query(query, values);
        
        await logActivity(req.user.userId, 'Update Settings', 'System settings updated.');
        
        const [updatedRows] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        res.json(updatedRows[0]);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Failed to update settings.', error: error.message });
    }
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