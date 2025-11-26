
/**
 * ==============================================================================
 *           Backend Server for Jiu-Jitsu Hub SAAS (server.js)
 *           STATELESS AUTHENTICATION (No Sessions/Cookies)
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

// Essential for Nginx Reverse Proxy to handle IPs and Protocol correctly
app.set('trust proxy', 1);

// --- Middleware ---
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: false, // No cookies needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'] // Allow custom user ID header
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
    await pool.query('SELECT 1'); // Test connection
    db = pool;
    console.log('Successfully connected to the MySQL database.');
    isDbConnected = true;
    
    // Ensure Critical Data Exists
    await ensureMasterAdmin();
    await ensureDefaultSettings();
  } catch (error) {
    console.error('FAILED TO CONNECT TO DATABASE:', error.message);
    isDbConnected = false;
  }
}

// --- Seeding Functions ---

async function ensureMasterAdmin() {
    try {
        const email = 'androiddiviana@gmail.com';
        const [[user]] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (!user) {
            console.log('Seeding Master Admin...');
            const academyId = 'master_admin_academy_01';
            const userId = 'master_admin_user_01';
            const passwordHash = await bcrypt.hash('dvsviana154', 10);
            
            // Create Academy
            await db.query(`
                INSERT INTO academies (id, name, email, password, responsible, responsibleRegistration)
                VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id
            `, [academyId, 'Academia Master', email, passwordHash, 'Admin Geral', '000.000.000-00']);

            // Create User
            await db.query(`
                INSERT INTO users (id, name, email, role, academyId)
                VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id
            `, [userId, 'Admin Geral', email, 'general_admin', academyId]);
            console.log('Master Admin created.');
        }
    } catch (e) {
        console.error("Error seeding master admin:", e);
    }
}

async function ensureDefaultSettings() {
    try {
        // Check if settings exist
        const [[settings]] = await db.query('SELECT id FROM theme_settings WHERE id = 1');
        
        if (!settings) {
            console.log('Seeding Default Theme Settings into Database...');
            
            // Default configuration values
            const defaultSettings = [
                1,
                'https://tailwindui.com/img/logos/mark.svg?color=amber&shade=500',
                'Jiu-Jitsu Hub',
                '#f59e0b',
                '#111827',
                '#f8fafc',
                '#ffffff',
                '#f59e0b',
                '#ffffff',
                '#64748b',
                '#f9a825',
                '#475569',
                1, // useGradient
                5, // reminderDays
                5, // overdueDays
                'light',
                150.00,
                1, // publicPageEnabled
                '<div class="relative bg-white text-slate-800 text-center py-20 px-4 overflow-hidden" style="background-image: url(\'https://images.unsplash.com/photo-1581009137052-c40971b51c69?q=80&w=2070&auto=format&fit=crop\'); background-size: cover; background-position: center;"> <div class="absolute inset-0 bg-white/50 backdrop-blur-sm"></div> <div class="relative z-10 container mx-auto"> <h1 class="text-5xl font-bold mb-4 animate-fade-in-down">Jiu-Jitsu: Arte, Disciplina, Respeito</h1> <p class="text-xl text-slate-600 animate-fade-in-up">Transforme sua vida dentro e fora do tatame. Junte-se à nossa família.</p> <a href="#filiais" class="mt-8 inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-lg transition duration-300">Encontre uma Academia</a> </div> </div>',
                '<div id="quem-somos" class="py-16 bg-slate-50 px-4"> <div class="container mx-auto text-center"> <h2 class="text-4xl font-bold text-amber-600 mb-6">Quem Somos</h2> <p class="text-lg text-slate-600 max-w-3xl mx-auto"> Somos mais do que uma academia, somos uma comunidade unida pela paixão pelo Jiu-Jitsu. Com instrutores de classe mundial e um ambiente acolhedor, nossa missão é capacitar cada aluno a atingir seu potencial máximo, promovendo saúde, autoconfiança e respeito mútuo. </p> </div> </div>',
                '<div id="filiais" class="py-16 bg-white px-4"> <div class="container mx-auto text-center"> <h2 class="text-4xl font-bold text-amber-600 mb-10">Nossas Filiais</h2> <p class="text-slate-600">Aqui você pode listar suas academias. Este conteúdo é totalmente personalizável na área de configurações!</p> </div> </div>',
                '<div class="py-8 bg-slate-100 text-center text-slate-500"> <p>{{{copyright_line}}}</p> <p>Desenvolvido com a Arte Suave em mente.</p> </div>',
                '@keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } } @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } } .animate-fade-in-down { animation: fade-in-down 1s ease-out forwards; } .animate-fade-in-up { animation: fade-in-up 1s ease-out 0.5s forwards; } html { scroll-behavior: smooth; }',
                '// console.log("Custom JS loaded!");',
                1, // socialLoginEnabled
                '', // googleClientId
                '', // facebookAppId
                '', // pixKey
                '', // pixHolderName
                'ABILDEVELOPER',
                '1.2.0'
            ];
            
            // Construct placeholder string based on number of fields
            const placeholders = defaultSettings.map(() => '?').join(',');
            
            await db.query(
                `INSERT INTO theme_settings (id, logoUrl, systemName, primaryColor, secondaryColor, backgroundColor, cardBackgroundColor, buttonColor, buttonTextColor, iconColor, chartColor1, chartColor2, useGradient, reminderDaysBeforeDue, overdueDaysAfterDue, theme, monthlyFeeAmount, publicPageEnabled, heroHtml, aboutHtml, branchesHtml, footerHtml, customCss, customJs, socialLoginEnabled, googleClientId, facebookAppId, pixKey, pixHolderName, copyrightText, systemVersion) VALUES (${placeholders})`, 
                defaultSettings
            );
            console.log('Default settings seeded successfully.');
        }
    } catch (e) {
        console.error("Error checking/seeding default settings:", e);
    }
}

const checkDbConnection = (req, res, next) => {
    if (!isDbConnected) {
        return res.status(503).json({ message: "Service Unavailable: Database connection is not active." });
    }
    next();
};

// Apply DB Check globally
app.use(checkDbConnection);

// --- Activity Logging ---
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

// --- Middleware: Authentication (Header Based, No Sessions) ---
const requireAuth = async (req, res, next) => {
    try {
        // Get User ID directly from header (Client-Side State)
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ message: 'Não autenticado (Header ausente).' });
        }

        // Validate user existence in DB (just to be safe, no session checks)
        const [[user]] = await db.query('SELECT id, name, email, role, academyId, studentId FROM users WHERE id = ?', [userId]);

        if (!user) {
            return res.status(401).json({ message: 'Usuário inválido.' });
        }

        req.user = { userId: user.id, ...user };
        next();
    } catch (error) {
        console.error("Auth error:", error);
        res.status(500).json({ message: "Erro ao validar usuário." });
    }
};


// =================================================================
// --- API ROUTES (FLATTENED)
// =================================================================

// --- PUBLIC ROUTES ---

// 1. Settings (Public)
app.get('/api/settings', async (req, res) => {
    try {
        const publicFields = 'logoUrl, systemName, primaryColor, secondaryColor, backgroundColor, cardBackgroundColor, buttonColor, buttonTextColor, iconColor, chartColor1, chartColor2, useGradient, theme, publicPageEnabled, heroHtml, aboutHtml, branchesHtml, footerHtml, customCss, customJs, socialLoginEnabled, googleClientId, facebookAppId, copyrightText, systemVersion, reminderDaysBeforeDue, overdueDaysAfterDue, monthlyFeeAmount';
        
        const [rows] = await db.query(`SELECT ${publicFields} FROM theme_settings WHERE id = 1`);
        
        if (!rows || rows.length === 0) {
             return res.json({ systemName: 'Jiu-Jitsu Hub (Default)' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error("Error fetching settings:", error);
        res.status(500).json({ message: "Failed to fetch settings." });
    }
});

// 2. Login (Username/Password Check Only)
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Email/CPF e senha são obrigatórios.' });
    
    try {
        const cleanUsername = username.includes('@') ? username : username.replace(/\D/g, '');
        
        // Identify User
        const [[user]] = await db.query(
            'SELECT u.* FROM users u LEFT JOIN students s ON u.studentId = s.id WHERE u.email = ? OR s.cpf = ?', 
            [cleanUsername, cleanUsername]
        );
        
        if (!user) return res.status(401).json({ message: 'Usuário não encontrado.' });
        
        let passwordHash = null;

        // Get Password
        if (user.role === 'student' && user.studentId) {
             const [[student]] = await db.query('SELECT password FROM students WHERE id = ?', [user.studentId]);
             passwordHash = student?.password;
        } else if (user.academyId) {
             const [[academy]] = await db.query('SELECT password FROM academies WHERE id = ?', [user.academyId]);
             passwordHash = academy?.password;
        }

        if (!passwordHash) return res.status(401).json({ message: 'Credenciais inválidas.' });
        
        // Compare
        const isValid = await bcrypt.compare(password, passwordHash);
        if (!isValid) return res.status(401).json({ message: 'Senha incorreta.' });

        // Log activity
        await logActivity(user.id, 'Login', 'Usuário logado.');
        
        // Return user (Frontend will store it)
        const { refreshToken, ...safeUser } = user;
        res.json(safeUser);
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});

// 3. Google Login
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token required' });

    try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        if (!response.ok) throw new Error('Invalid Google Token');
        const payload = await response.json();
        
        const [[user]] = await db.query('SELECT * FROM users WHERE email = ?', [payload.email]);
        if (!user) return res.status(404).json({ message: 'USER_NOT_FOUND' });

        await logActivity(user.id, 'Login Google', 'Login via Google.');
        const { refreshToken, ...safeUser } = user;
        res.json(safeUser);
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Falha na autenticação Google.' });
    }
});

// 4. Register Academy
app.post('/api/auth/register', async (req, res) => {
    const { name, address, responsible, responsibleRegistration, email, password, professorId, imageUrl } = req.body;
    
    if (!name || !responsible || !email || !password) return res.status(400).json({ message: 'Dados obrigatórios faltando.' });
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [[existing]] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) {
            await connection.rollback();
            return res.status(409).json({ message: 'Email já cadastrado.' });
        }

        const academyId = uuidv4();
        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await connection.query(
            `INSERT INTO academies (id, name, address, responsible, responsibleRegistration, professorId, imageUrl, email, password) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [
                academyId, 
                name, 
                address, 
                responsible, 
                responsibleRegistration, 
                professorId || null,
                imageUrl || null,
                email, 
                hashedPassword
            ]
        );
        
        await connection.query('INSERT INTO users (id, name, email, role, academyId) VALUES (?, ?, ?, ?, ?)', 
            [userId, responsible, email, 'academy_admin', academyId]);
        
        await connection.commit();

        const [[newUser]] = await connection.query('SELECT id, name, email, role, academyId FROM users WHERE id = ?', [userId]);
        res.status(201).json(newUser);
    } catch (error) {
        await connection.rollback();
        console.error("Register error:", error);
        res.status(500).json({ message: 'Falha ao registrar.' });
    } finally {
        connection.release();
    }
});

// 5. Logout (Simple OK)
app.post('/api/auth/logout', async (req, res) => {
    res.json({ message: 'Logout ok' });
});


// --- PROTECTED ROUTES (Apply requireAuth middleware) ---

// -- READ --
app.get('/api/students', requireAuth, async (req, res) => {
    try {
        const [students] = await db.query('SELECT * FROM students');
        const [payments] = await db.query('SELECT * FROM payment_history ORDER BY `date` DESC');
        
        const paymentsMap = {};
        payments.forEach(p => {
            if (!paymentsMap[p.studentId]) paymentsMap[p.studentId] = [];
            paymentsMap[p.studentId].push(p);
        });

        students.forEach(s => {
            s.paymentHistory = paymentsMap[s.id] || [];
            try { s.medals = JSON.parse(s.medals); } catch (e) { s.medals = { gold: 0, silver: 0, bronze: 0 }; }
        });
        res.json(students);
    } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao buscar alunos'}); }
});

app.get('/api/academies', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM academies WHERE id != ?', ['master_admin_academy_01']);
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao buscar academias'}); }
});

app.get('/api/schedules', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT cs.*, GROUP_CONCAT(sa.assistantId) as assistantIds FROM class_schedules cs LEFT JOIN schedule_assistants sa ON cs.id = sa.scheduleId GROUP BY cs.id');
        rows.forEach(r => r.assistantIds = r.assistantIds ? r.assistantIds.split(',') : []);
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao buscar horários'}); }
});

app.get('/api/graduations', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM graduations');
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao buscar graduações'}); }
});

app.get('/api/professors', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM professors');
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao buscar professores'}); }
});

app.get('/api/users', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, email, role, academyId, studentId, birthDate FROM users');
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao buscar usuários'}); }
});

app.get('/api/attendance', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM attendance_records');
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao buscar frequência'}); }
});

app.get('/api/logs', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM activity_logs ORDER BY `timestamp` DESC LIMIT 100');
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao buscar logs'}); }
});

app.get('/api/news', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM news_articles ORDER BY `date` DESC');
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao buscar notícias'}); }
});

app.get('/api/settings/all', requireAuth, async (req, res) => {
    if (req.user.role !== 'general_admin') return res.status(403).json({message: "Acesso negado."});
    try {
        const [[rows]] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        res.json(rows);
    } catch (e) { console.error(e); res.status(500).json({message: "Erro ao buscar settings full."}); }
});

// -- WRITE --

app.put('/api/settings', requireAuth, async (req, res) => {
    if (req.user.role !== 'general_admin') return res.status(403).json({message: "Acesso negado."});
    try {
        const { id, ...settings } = req.body;
        // Normalize booleans
        ['publicPageEnabled', 'useGradient', 'socialLoginEnabled'].forEach(k => { if(k in settings) settings[k] = settings[k]?1:0; });
        
        const setClause = Object.keys(settings).map(k => `\`${k}\` = ?`).join(', ');
        await db.query(`UPDATE theme_settings SET ${setClause} WHERE id = 1`, Object.values(settings));
        const [[updated]] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        res.json(updated);
    } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao salvar settings'}); }
});

// Helper for student save
const handleSaveStudent = async (req, res) => {
    const data = req.body;
    const isNew = !req.params.id;
    const id = isNew ? uuidv4() : req.params.id;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        if (isNew) {
            const userId = uuidv4();
            const hash = await bcrypt.hash(data.password || '123456', 10);
            await conn.query('INSERT INTO students (id, name, email, password, birthDate, cpf, fjjpe_registration, phone, address, beltId, academyId, firstGraduationDate, paymentStatus, paymentDueDateDay, stripes, isCompetitor, lastCompetition, medals, imageUrl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', 
                [id, data.name, data.email, hash, data.birthDate, data.cpf, data.fjjpe_registration, data.phone, data.address, data.beltId, data.academyId, data.firstGraduationDate, 'unpaid', data.paymentDueDateDay, data.stripes, data.isCompetitor, data.lastCompetition, JSON.stringify(data.medals), data.imageUrl]);
            await conn.query('INSERT INTO users (id, name, email, role, studentId, birthDate, academyId) VALUES (?,?,?,?,?,?,?)', 
                [userId, data.name, data.email, 'student', id, data.birthDate, data.academyId]);
        } else {
            let query = 'UPDATE students SET name=?, email=?, birthDate=?, cpf=?, fjjpe_registration=?, phone=?, address=?, beltId=?, academyId=?, firstGraduationDate=?, lastPromotionDate=?, paymentDueDateDay=?, stripes=?, isCompetitor=?, lastCompetition=?, medals=?, imageUrl=?';
            const params = [data.name, data.email, data.birthDate, data.cpf, data.fjjpe_registration, data.phone, data.address, data.beltId, data.academyId, data.firstGraduationDate, data.lastPromotionDate, data.paymentDueDateDay, data.stripes, data.isCompetitor, data.lastCompetition, JSON.stringify(data.medals), data.imageUrl];
            if (data.password) { query += ', password=?'; params.push(await bcrypt.hash(data.password, 10)); }
            query += ' WHERE id=?'; params.push(id);
            await conn.query(query, params);
            await conn.query('UPDATE users SET name=?, email=?, birthDate=?, academyId=? WHERE studentId=?', [data.name, data.email, data.birthDate, data.academyId, id]);
        }
        await conn.commit();
        const [[saved]] = await db.query('SELECT * FROM students WHERE id = ?', [id]);
        res.json(saved);
    } catch (e) { await conn.rollback(); console.error(e); res.status(500).json({message: 'Erro ao salvar aluno'}); } finally { conn.release(); }
};
app.post('/api/students', requireAuth, handleSaveStudent);
app.put('/api/students/:id', requireAuth, handleSaveStudent);

app.post('/api/students/:studentId/payment', requireAuth, async (req, res) => {
    const { status, amount } = req.body;
    await db.query('UPDATE students SET paymentStatus = ? WHERE id = ?', [status, req.params.studentId]);
    if (status === 'paid') {
        await db.query('INSERT INTO payment_history (id, studentId, `date`, amount) VALUES (?, ?, ?, ?)', [uuidv4(), req.params.studentId, new Date(), amount]);
    }
    const [[s]] = await db.query('SELECT * FROM students WHERE id = ?', [req.params.studentId]);
    res.json(s);
});

const handleSaveAcademy = async (req, res) => {
    const data = req.body;
    const isNew = !req.params.id;
    const id = isNew ? uuidv4() : req.params.id;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        if (isNew) {
            const hash = await bcrypt.hash(data.password, 10);
            await conn.query('INSERT INTO academies (id, name, address, responsible, responsibleRegistration, professorId, imageUrl, email, password) VALUES (?,?,?,?,?,?,?,?,?)', [id, data.name, data.address, data.responsible, data.responsibleRegistration, data.professorId, data.imageUrl, data.email, hash]);
            await conn.query('INSERT INTO users (id, name, email, role, academyId) VALUES (?,?,?,?,?)', [uuidv4(), data.responsible, data.email, 'academy_admin', id]);
        } else {
            await conn.query('UPDATE academies SET name=?, address=?, responsible=?, responsibleRegistration=?, professorId=?, imageUrl=?, email=? WHERE id=?', [data.name, data.address, data.responsible, data.responsibleRegistration, data.professorId, data.imageUrl, data.email, id]);
            if (data.password) {
                const hash = await bcrypt.hash(data.password, 10);
                await conn.query('UPDATE academies SET password=? WHERE id=?', [hash, id]);
            }
            await conn.query('UPDATE users SET name=?, email=? WHERE academyId=? AND role=?', [data.responsible, data.email, id, 'academy_admin']);
        }
        await conn.commit();
        res.json({id, ...data});
    } catch (e) { await conn.rollback(); console.error(e); res.status(500).json({message: 'Erro ao salvar academia'}); } finally { conn.release(); }
};
app.post('/api/academies', requireAuth, handleSaveAcademy);
app.put('/api/academies/:id', requireAuth, handleSaveAcademy);

const handleSaveProfessor = async (req, res) => {
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
    } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao salvar prof'}); }
};
app.post('/api/professors', requireAuth, handleSaveProfessor);
app.put('/api/professors/:id', requireAuth, handleSaveProfessor);

const handleSaveSchedule = async (req, res) => {
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
app.post('/api/schedules', requireAuth, handleSaveSchedule);
app.put('/api/schedules/:id', requireAuth, handleSaveSchedule);

const handleSaveGraduation = async (req, res) => {
    const d = req.body;
    const id = req.params.id || uuidv4();
    try {
        const q = !req.params.id ? 'INSERT INTO graduations (id, name, color, minTimeInMonths, `rank`, type, minAge, maxAge) VALUES (?,?,?,?,?,?,?,?)' : 'UPDATE graduations SET name=?, color=?, minTimeInMonths=?, `rank`=?, type=?, minAge=?, maxAge=? WHERE id=?';
        const p = [d.name, d.color, d.minTimeInMonths, d.rank, d.type, d.minAge, d.maxAge];
        if (!req.params.id) p.unshift(id); else p.push(id);
        await db.query(q, p);
        const [[saved]] = await db.query('SELECT * FROM graduations WHERE id=?', [id]);
        res.json(saved);
    } catch (e) { console.error(e); res.status(500).json({message: 'Erro ao salvar grad'}); }
};
app.post('/api/graduations', requireAuth, handleSaveGraduation);
app.put('/api/graduations/:id', requireAuth, handleSaveGraduation);
app.put('/api/graduations/ranks', requireAuth, async (req, res) => {
    try {
        await Promise.all(req.body.map(g => db.query('UPDATE graduations SET `rank`=? WHERE id=?', [g.rank, g.id])));
        res.json({success: true});
    } catch (e) { res.status(500).json({message: 'Erro ao atualizar ranks'}); }
});

app.post('/api/attendance', requireAuth, async (req, res) => {
    const { studentId, scheduleId, date, status } = req.body;
    const id = uuidv4();
    try {
        await db.query('INSERT INTO attendance_records (id, studentId, scheduleId, `date`, status) VALUES (?,?,?,?,?)', [id, studentId, scheduleId, date, status]);
        res.json({id, studentId, scheduleId, date, status});
    } catch (e) { res.status(500).json({message: 'Erro ao salvar presença'}); }
});

// -- DELETE --
const genericDelete = (tableName, preHook) => async (req, res) => {
    const { id } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        if (preHook) await preHook(id, conn);
        const [result] = await conn.query(`DELETE FROM \`${tableName}\` WHERE id = ?`, [id]);
        await conn.commit();
        if (result.affectedRows === 0) return res.status(404).json({message: 'Not found'});
        res.status(204).send();
    } catch (e) { await conn.rollback(); console.error(e); res.status(500).json({message: 'Erro ao deletar'}); } finally { conn.release(); }
};

app.delete('/api/students/:id', requireAuth, genericDelete('students', async (id, conn) => {
    await conn.query('DELETE FROM payment_history WHERE studentId = ?', [id]);
    await conn.query('DELETE FROM attendance_records WHERE studentId = ?', [id]);
    await conn.query('DELETE FROM users WHERE studentId = ?', [id]);
}));
app.delete('/api/academies/:id', requireAuth, genericDelete('academies', async (id, conn) => {
    await conn.query('DELETE FROM users WHERE academyId = ?', [id]);
}));
app.delete('/api/professors/:id', requireAuth, genericDelete('professors'));
app.delete('/api/schedules/:id', requireAuth, genericDelete('class_schedules', async (id, conn) => {
    await conn.query('DELETE FROM schedule_assistants WHERE scheduleId=?', [id]);
}));
app.delete('/api/graduations/:id', requireAuth, genericDelete('graduations'));
app.delete('/api/attendance/:id', requireAuth, genericDelete('attendance_records'));


// --- 404 Handler ---
app.use((req, res) => {
    res.status(404).json({ message: `API Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// --- Server Startup ---
(async () => {
  await connectToDatabase();
  if (isDbConnected) {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Allowed Origin: ${FRONTEND_URL}`);
      });
  } else {
      console.error("Server failed to start due to database connection error.");
      process.exit(1);
  }
})();
