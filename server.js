
/**
 * ==============================================================================
 *           Backend Server for Jiu-Jitsu Hub SAAS (server.js)
 *           STATELESS AUTHENTICATION (No Cookies, Header Based)
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

// --- Express App ---
const app = express();
app.set('trust proxy', 1);

const corsOptions = {
  origin: '*', // Allow all origins for stateless header-based auth
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// --- Database Connection ---
let db;
let isDbConnected = false;

async function connectToDatabase() {
  try {
    if (!DATABASE_URL) throw new Error("DATABASE_URL missing");
    const pool = mysql.createPool(DATABASE_URL);
    await pool.query('SELECT 1');
    db = pool;
    isDbConnected = true;
    console.log('Connected to MySQL.');
    await ensureDefaultSettings();
  } catch (error) {
    console.error('DB CONNECTION FAILED:', error.message);
    isDbConnected = false;
  }
}

async function ensureDefaultSettings() {
    try {
        const [[settings]] = await db.query('SELECT id FROM theme_settings WHERE id = 1');
        if (!settings) {
            console.log('Seeding Default Settings...');
            const defaultSettings = [
                1, 'https://tailwindui.com/img/logos/mark.svg?color=amber&shade=500', 'Jiu-Jitsu Hub', '#f59e0b', '#111827', '#f8fafc', '#ffffff', '#f59e0b', '#ffffff', '#64748b', '#f9a825', '#475569', 1, 5, 5, 'light', 150.00, 1,
                '<div class="relative bg-white text-slate-800 text-center py-20 px-4 overflow-hidden" style="background-image: url(\'https://images.unsplash.com/photo-1581009137052-c40971b51c69?q=80&w=2070&auto=format&fit=crop\'); background-size: cover; background-position: center;"> <div class="absolute inset-0 bg-white/50 backdrop-blur-sm"></div> <div class="relative z-10 container mx-auto"> <h1 class="text-5xl font-bold mb-4 animate-fade-in-down">Jiu-Jitsu: Arte, Disciplina, Respeito</h1> <p class="text-xl text-slate-600 animate-fade-in-up">Transforme sua vida dentro e fora do tatame. Junte-se à nossa família.</p> <a href="#filiais" class="mt-8 inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-lg transition duration-300">Encontre uma Academia</a> </div> </div>',
                '<div id="quem-somos" class="py-16 bg-slate-50 px-4"> <div class="container mx-auto text-center"> <h2 class="text-4xl font-bold text-amber-600 mb-6">Quem Somos</h2> <p class="text-lg text-slate-600 max-w-3xl mx-auto"> Somos mais do que uma academia, somos uma comunidade unida pela paixão pelo Jiu-Jitsu. Com instrutores de classe mundial e um ambiente acolhedor, nossa missão é capacitar cada aluno a atingir seu potencial máximo, promovendo saúde, autoconfiança e respeito mútuo. </p> </div> </div>',
                '<div id="filiais" class="py-16 bg-white px-4"> <div class="container mx-auto text-center"> <h2 class="text-4xl font-bold text-amber-600 mb-10">Nossas Filiais</h2> <p class="text-slate-600">Aqui você pode listar suas academias. Este conteúdo é totalmente personalizável na área de configurações!</p> </div> </div>',
                '<div class="py-8 bg-slate-100 text-center text-slate-500"> <p>{{{copyright_line}}}</p> <p>Desenvolvido com a Arte Suave em mente.</p> </div>',
                '@keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } } @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } } .animate-fade-in-down { animation: fade-in-down 1s ease-out forwards; } .animate-fade-in-up { animation: fade-in-up 1s ease-out 0.5s forwards; } html { scroll-behavior: smooth; }',
                '// console.log("Custom JS loaded!");', 1, '', '', '', '', 'ABILDEVELOPER', '1.2.0'
            ];
            const placeholders = defaultSettings.map(() => '?').join(',');
            await db.query(`INSERT INTO theme_settings VALUES (${placeholders})`, defaultSettings);
        }
    } catch (e) { console.error("Seeding error:", e); }
}

// --- Middleware: Identification ---
// This does NOT validate a session. It just identifies who is asking based on the header.
const requireAuth = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ message: 'Não autenticado (Header ausente).' });

        const [[user]] = await db.query('SELECT id, name, email, role, academyId, studentId FROM users WHERE id = ?', [userId]);
        if (!user) return res.status(401).json({ message: 'Usuário inválido.' });

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth error:", error);
        res.status(500).json({ message: "Erro de autenticação." });
    }
};

// --- Routes ---

app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM theme_settings WHERE id = 1`);
        res.json(rows[0] || {});
    } catch (e) { res.status(500).json({message: "Failed settings"}); }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Credenciais faltando.' });

    try {
        const cleanUsername = username.includes('@') ? username : username.replace(/\D/g, '');
        // Find User
        const [[user]] = await db.query('SELECT u.* FROM users u LEFT JOIN students s ON u.studentId = s.id WHERE u.email = ? OR s.cpf = ?', [cleanUsername, cleanUsername]);
        if (!user) return res.status(401).json({ message: 'Usuário não encontrado.' });

        // Check Password
        let passwordHash = null;
        if (user.role === 'student' && user.studentId) {
             const [[student]] = await db.query('SELECT password FROM students WHERE id = ?', [user.studentId]);
             passwordHash = student?.password;
        } else if (user.academyId) {
             const [[academy]] = await db.query('SELECT password FROM academies WHERE id = ?', [user.academyId]);
             passwordHash = academy?.password;
        }

        if (!passwordHash || !(await bcrypt.compare(password, passwordHash))) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }

        // Return User - No Cookie, No Session Table
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role, academyId: user.academyId, studentId: user.studentId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erro no login.' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { name, address, responsible, responsibleRegistration, email, password, professorId, imageUrl } = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [[existing]] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) { await conn.rollback(); return res.status(409).json({ message: 'Email já existe.' }); }

        const academyId = uuidv4();
        const userId = uuidv4();
        const hash = await bcrypt.hash(password, 10);

        await conn.query('INSERT INTO academies (id, name, address, responsible, responsibleRegistration, professorId, imageUrl, email, password) VALUES (?,?,?,?,?,?,?,?,?)', 
            [academyId, name, address, responsible, responsibleRegistration, professorId || null, imageUrl || null, email, hash]);
        await conn.query('INSERT INTO users (id, name, email, role, academyId) VALUES (?,?,?,?,?)', 
            [userId, responsible, email, 'academy_admin', academyId]);
        
        await conn.commit();
        const [[newUser]] = await conn.query('SELECT id, name, email, role, academyId FROM users WHERE id = ?', [userId]);
        res.status(201).json(newUser);
    } catch (e) { await conn.rollback(); res.status(500).json({ message: 'Erro no cadastro.' }); } finally { conn.release(); }
});

// Data Routes - Rely on requireAuth (Header Check)
app.get('/api/students', requireAuth, async (req, res) => {
    const [rows] = await db.query('SELECT * FROM students');
    const [pay] = await db.query('SELECT * FROM payment_history');
    const map = {}; pay.forEach(p => { if(!map[p.studentId]) map[p.studentId]=[]; map[p.studentId].push(p) });
    rows.forEach(r => { r.paymentHistory = map[r.id] || []; try{r.medals=JSON.parse(r.medals)}catch(e){r.medals={gold:0,silver:0,bronze:0}} });
    res.json(rows);
});
app.get('/api/academies', requireAuth, async (req, res) => {
    const [rows] = await db.query('SELECT * FROM academies WHERE id != ?', ['master_admin_academy_01']);
    res.json(rows);
});
app.get('/api/schedules', requireAuth, async (req, res) => {
    const [rows] = await db.query('SELECT cs.*, GROUP_CONCAT(sa.assistantId) as assistantIds FROM class_schedules cs LEFT JOIN schedule_assistants sa ON cs.id = sa.scheduleId GROUP BY cs.id');
    rows.forEach(r => r.assistantIds = r.assistantIds ? r.assistantIds.split(',') : []);
    res.json(rows);
});
app.get('/api/graduations', requireAuth, async (req, res) => {
    const [rows] = await db.query('SELECT * FROM graduations');
    res.json(rows);
});
app.get('/api/professors', requireAuth, async (req, res) => {
    const [rows] = await db.query('SELECT * FROM professors');
    res.json(rows);
});
app.get('/api/users', requireAuth, async (req, res) => {
    const [rows] = await db.query('SELECT id, name, email, role, academyId, studentId, birthDate FROM users');
    res.json(rows);
});
app.get('/api/attendance', requireAuth, async (req, res) => {
    const [rows] = await db.query('SELECT * FROM attendance_records');
    res.json(rows);
});
app.get('/api/logs', requireAuth, async (req, res) => {
    const [rows] = await db.query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100');
    res.json(rows);
});
app.get('/api/news', requireAuth, async (req, res) => {
    const [rows] = await db.query('SELECT * FROM news_articles');
    res.json(rows);
});
app.get('/api/settings/all', requireAuth, async (req, res) => {
    const [[rows]] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
    res.json(rows);
});

// Writes
app.post('/api/auth/logout', (req, res) => res.json({message: 'ok'})); // Client clears storage

// ... CRUD helpers same as before but with simple requireAuth
const genericSave = (table) => async (req, res) => { /* Impl simplified */ };

app.post('/api/students', requireAuth, async (req, res) => {
    // Simple Insert Logic
    const d = req.body; const id = uuidv4(); const uid = uuidv4();
    const hash = await bcrypt.hash(d.password||'123456', 10);
    await db.query('INSERT INTO students (id,name,email,password,birthDate,cpf,fjjpe_registration,phone,address,beltId,academyId,firstGraduationDate,paymentStatus,paymentDueDateDay,stripes,isCompetitor,lastCompetition,medals,imageUrl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [id,d.name,d.email,hash,d.birthDate,d.cpf,d.fjjpe_registration,d.phone,d.address,d.beltId,d.academyId,d.firstGraduationDate,'unpaid',d.paymentDueDateDay,d.stripes,d.isCompetitor,d.lastCompetition,JSON.stringify(d.medals),d.imageUrl]);
    await db.query('INSERT INTO users (id,name,email,role,studentId,birthDate,academyId) VALUES (?,?,?,?,?,?,?)', [uid,d.name,d.email,'student',id,d.birthDate,d.academyId]);
    res.json({...d, id});
});
// ... Other endpoints follow same pattern: requireAuth -> DB Action -> JSON Response

// Start
(async () => {
    await connectToDatabase();
    if(isDbConnected) app.listen(PORT, () => console.log(`Server on ${PORT}`));
})();
