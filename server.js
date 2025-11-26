
/**
 * ==============================================================================
 *           Backend Server for Jiu-Jitsu Hub SAAS (server.js)
 *           STATEFUL ARCHITECTURE (Cookies + MySQL Sessions)
 *           FLATTENED ROUTES (Explicit endpoints to fix 404s)
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
  FRONTEND_URL
} = process.env;

// --- Express App ---
const app = express();
app.set('trust proxy', 1);

// CORS: MUST allow credentials and specific origin for cookies to work.
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    // Allow specific frontend origin (can add more logic if needed)
    if (origin === FRONTEND_URL || origin.includes('localhost') || origin.includes('abildeveloper.com.br')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

app.use(express.json({ limit: '10mb' }));

// --- Database Connection ---
let db;

async function connectToDatabase() {
  try {
    if (!DATABASE_URL) throw new Error("DATABASE_URL missing");
    const pool = mysql.createPool(DATABASE_URL);
    await pool.query('SELECT 1'); // Test connection
    db = pool;
    console.log('Connected to MySQL successfully.');
    await ensureDefaultSettings();
  } catch (error) {
    console.error('DB CONNECTION FAILED:', error.message);
  }
}

// Ensure Theme Settings exist in DB
async function ensureDefaultSettings() {
    try {
        const [[settings]] = await db.query('SELECT id FROM theme_settings WHERE id = 1');
        if (!settings) {
            console.log('Seeding Default Settings into DB...');
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

// --- Helper: Cookie Parser (Regex to avoid deps) ---
const parseCookies = (cookieHeader) => {
    const list = {};
    if (!cookieHeader) return list;
    cookieHeader.split(';').forEach(function(cookie) {
        let parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    return list;
}

// --- Middleware: Auth Check (Stateful - via DB Sessions) ---
const requireAuth = async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();

    try {
        // 1. Get Cookie
        const cookies = parseCookies(req.headers.cookie);
        const sessionId = cookies['sessionId'];

        if (!sessionId) {
            console.log('[Auth] No cookie found');
            return res.status(401).json({ message: 'Não autenticado (Sem cookie).' });
        }

        // 2. Check DB for Session
        const [[session]] = await db.query('SELECT * FROM sessions WHERE sid = ?', [sessionId]);
        
        if (!session) {
            console.log('[Auth] Session not found in DB');
            return res.status(401).json({ message: 'Sessão inválida.' });
        }

        if (session.expires < Date.now()) {
            console.log('[Auth] Session expired');
            await db.query('DELETE FROM sessions WHERE sid = ?', [sessionId]);
            return res.status(401).json({ message: 'Sessão expirada.' });
        }

        // 3. Get User Info
        const [[user]] = await db.query('SELECT id, name, email, role, academyId, studentId FROM users WHERE id = ?', [session.userId]);
        if (!user) {
             return res.status(401).json({ message: 'Usuário da sessão não encontrado.' });
        }

        // 4. Extend Session (Rolling Expiration) - 20 mins
        const newExpires = Date.now() + (20 * 60 * 1000);
        await db.query('UPDATE sessions SET expires = ? WHERE sid = ?', [newExpires, sessionId]);
        
        // Set cookie again to update browser expiration
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: false, // Set true if HTTPS is guaranteed
            sameSite: 'Lax',
            path: '/',
            maxAge: 20 * 60 * 1000 
        });

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ message: "Erro de autenticação no servidor." });
    }
};

// =============================================================================
// ROUTES (Public)
// =============================================================================

// Public Settings
app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM theme_settings WHERE id = 1`);
        res.json(rows[0] || {});
    } catch (e) { 
        console.error(e);
        res.status(500).json({message: "Failed settings"}); 
    }
});

// Check Session (Called by frontend on init)
app.get('/api/auth/session', async (req, res) => {
    try {
        const cookies = parseCookies(req.headers.cookie);
        const sessionId = cookies['sessionId'];
        if (!sessionId) return res.json({ user: null });

        const [[session]] = await db.query('SELECT * FROM sessions WHERE sid = ? AND expires > ?', [sessionId, Date.now()]);
        if (!session) return res.json({ user: null });

        const [[user]] = await db.query('SELECT id, name, email, role, academyId, studentId FROM users WHERE id = ?', [session.userId]);
        res.json({ user: user || null });
    } catch (e) {
        console.error("Session Check Error:", e);
        res.json({ user: null });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    console.log('[POST] /api/auth/login');
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Credenciais faltando.' });

    try {
        const cleanUsername = username.includes('@') ? username : username.replace(/\D/g, '');
        
        // 1. Find User
        const [[user]] = await db.query(
            'SELECT u.* FROM users u LEFT JOIN students s ON u.studentId = s.id WHERE u.email = ? OR s.cpf = ?', 
            [cleanUsername, cleanUsername]
        );
        
        if (!user) return res.status(401).json({ message: 'Usuário não encontrado.' });

        // 2. Verify Password based on Role
        let passwordHash = null;
        if (user.role === 'student' && user.studentId) {
             const [[student]] = await db.query('SELECT password FROM students WHERE id = ?', [user.studentId]);
             passwordHash = student?.password;
        } else {
             const [[academy]] = await db.query('SELECT password FROM academies WHERE email = ?', [user.email]);
             passwordHash = academy?.password;
        }

        // Fallback for master admin
        if (!passwordHash && user.role === 'general_admin') {
             const [[seedAcademy]] = await db.query('SELECT password FROM academies WHERE email = ?', [user.email]);
             passwordHash = seedAcademy?.password;
        }

        if (!passwordHash || !(await bcrypt.compare(password, passwordHash))) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }

        // 3. Create Session
        const sessionId = uuidv4();
        const expiresAt = Date.now() + (20 * 60 * 1000); // 20 minutes
        
        await db.query('INSERT INTO sessions (sid, userId, expires) VALUES (?, ?, ?)', [sessionId, user.id, expiresAt]);

        // 4. Set Cookie
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: false, // Important for HTTP environments
            sameSite: 'Lax',
            path: '/',
            maxAge: 20 * 60 * 1000
        });

        res.json({ 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role, 
            academyId: user.academyId, 
            studentId: user.studentId 
        });

    } catch (e) {
        console.error('Login Error:', e);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});

// Register
app.post('/api/auth/register', async (req, res) => {
    const { name, address, responsible, responsibleRegistration, email, password, professorId, imageUrl } = req.body;
    
    if (!email || !password || !name) return res.status(400).json({ message: 'Campos obrigatórios faltando.' });

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [[existing]] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) { await conn.rollback(); return res.status(400).json({ message: 'Email já existe.' }); }

        const academyId = uuidv4();
        const userId = uuidv4();
        const hash = await bcrypt.hash(password, 10);

        await conn.query(
            'INSERT INTO academies (id, name, address, responsible, responsibleRegistration, professorId, imageUrl, email, password) VALUES (?,?,?,?,?,?,?,?,?)', 
            [academyId, name, address, responsible, responsibleRegistration, professorId || null, imageUrl || null, email, hash]
        );
        
        await conn.query(
            'INSERT INTO users (id, name, email, role, academyId) VALUES (?,?,?,?,?)', 
            [userId, responsible, email, 'academy_admin', academyId]
        );
        
        await conn.commit();
        
        // Auto Login after Register
        const sessionId = uuidv4();
        const expiresAt = Date.now() + (20 * 60 * 1000);
        await db.query('INSERT INTO sessions (sid, userId, expires) VALUES (?, ?, ?)', [sessionId, userId, expiresAt]);

        res.cookie('sessionId', sessionId, { httpOnly: true, secure: false, sameSite: 'Lax', path: '/', maxAge: 20 * 60 * 1000 });

        const [[newUser]] = await conn.query('SELECT id, name, email, role, academyId FROM users WHERE id = ?', [userId]);
        res.status(201).json(newUser);

    } catch (e) { 
        await conn.rollback(); 
        console.error(e);
        res.status(500).json({ message: 'Erro no cadastro.' }); 
    } finally { conn.release(); }
});

app.post('/api/auth/logout', async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies['sessionId'];
    if (sessionId) {
        await db.query('DELETE FROM sessions WHERE sid = ?', [sessionId]);
    }
    res.clearCookie('sessionId', { path: '/' });
    res.json({ message: 'Logged out' });
});

app.post('/api/auth/google', async (req, res) => {
    res.status(501).json({message: "Google Auth not configured on backend yet."});
});

// =============================================================================
// PROTECTED ROUTES (Require Cookie Session)
// =============================================================================

// Students
app.get('/api/students', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM students');
        const [pay] = await db.query('SELECT * FROM payment_history');
        const map = {}; 
        pay.forEach(p => { if(!map[p.studentId]) map[p.studentId]=[]; map[p.studentId].push(p) });
        rows.forEach(r => { 
            r.paymentHistory = map[r.id] || []; 
            try{ r.medals=JSON.parse(r.medals) } catch(e){ r.medals={gold:0,silver:0,bronze:0} } 
        });
        res.json(rows);
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});
app.post('/api/students', requireAuth, async (req, res) => {
    const d = req.body; const id = uuidv4(); const uid = uuidv4();
    const hash = await bcrypt.hash(d.password||'123456', 10);
    try {
        await db.query('INSERT INTO students (id,name,email,password,birthDate,cpf,fjjpe_registration,phone,address,beltId,academyId,firstGraduationDate,paymentStatus,paymentDueDateDay,stripes,isCompetitor,lastCompetition,medals,imageUrl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [id,d.name,d.email,hash,d.birthDate,d.cpf,d.fjjpe_registration,d.phone,d.address,d.beltId,d.academyId,d.firstGraduationDate,'unpaid',d.paymentDueDateDay,d.stripes,d.isCompetitor,d.lastCompetition,JSON.stringify(d.medals),d.imageUrl]);
        await db.query('INSERT INTO users (id,name,email,role,studentId,birthDate,academyId) VALUES (?,?,?,?,?,?,?)', [uid,d.name,d.email,'student',id,d.birthDate,d.academyId]);
        res.json({...d, id});
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});
app.put('/api/students/:id', requireAuth, async (req, res) => {
    const d = req.body;
    try {
        await db.query('UPDATE students SET name=?, email=?, birthDate=?, cpf=?, fjjpe_registration=?, phone=?, address=?, beltId=?, academyId=?, firstGraduationDate=?, paymentDueDateDay=?, stripes=?, isCompetitor=?, lastCompetition=?, medals=?, imageUrl=? WHERE id=?',
            [d.name,d.email,d.birthDate,d.cpf,d.fjjpe_registration,d.phone,d.address,d.beltId,d.academyId,d.firstGraduationDate,d.paymentDueDateDay,d.stripes,d.isCompetitor,d.lastCompetition,JSON.stringify(d.medals),d.imageUrl,req.params.id]);
        res.json(d);
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});
app.post('/api/students/:id/payment', requireAuth, async (req, res) => {
    const { status, amount } = req.body;
    try {
        await db.query('UPDATE students SET paymentStatus=? WHERE id=?', [status, req.params.id]);
        if(status === 'paid') await db.query('INSERT INTO payment_history (id, studentId, date, amount) VALUES (?,?,?,?)', [uuidv4(), req.params.id, new Date(), amount]);
        res.json({success: true});
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});
app.delete('/api/students/:id', requireAuth, async (req, res) => {
    try {
        await db.query('DELETE FROM students WHERE id=?', [req.params.id]);
        await db.query('DELETE FROM users WHERE studentId=?', [req.params.id]);
        res.json({success: true});
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});

// Academies
app.get('/api/academies', requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM academies WHERE id != ?', ['master_admin_academy_01']);
        res.json(rows);
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});
app.post('/api/academies', requireAuth, async (req, res) => {
    res.status(501).json({message: "Use public register endpoint"});
});
app.put('/api/academies/:id', requireAuth, async (req, res) => {
    const d = req.body;
    try {
        await db.query('UPDATE academies SET name=?, address=?, responsible=?, responsibleRegistration=?, professorId=?, imageUrl=?, email=? WHERE id=?',
            [d.name,d.address,d.responsible,d.responsibleRegistration,d.professorId,d.imageUrl,d.email,req.params.id]);
        res.json(d);
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});
app.delete('/api/academies/:id', requireAuth, async (req, res) => {
    try {
        await db.query('DELETE FROM academies WHERE id=?', [req.params.id]);
        await db.query('DELETE FROM users WHERE academyId=?', [req.params.id]);
        res.json({success: true});
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});

// Graduations
app.get('/api/graduations', requireAuth, async (req, res) => {
    const [rows] = await db.query('SELECT * FROM graduations');
    res.json(rows);
});
app.post('/api/graduations', requireAuth, async (req, res) => {
    const d = req.body; const id = uuidv4();
    try {
        await db.query('INSERT INTO graduations (id,name,color,minTimeInMonths,`rank`,type,minAge,maxAge) VALUES (?,?,?,?,?,?,?,?)',
            [id,d.name,d.color,d.minTimeInMonths,d.rank,d.type,d.minAge,d.maxAge]);
        res.json({...d, id});
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});
app.put('/api/graduations/ranks', requireAuth, async (req, res) => {
    try {
        for(const item of req.body) await db.query('UPDATE graduations SET `rank`=? WHERE id=?', [item.rank, item.id]);
        res.json({success:true});
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});
app.put('/api/graduations/:id', requireAuth, async (req, res) => {
    const d = req.body;
    try {
        await db.query('UPDATE graduations SET name=?, color=?, minTimeInMonths=?, `rank`=?, type=?, minAge=?, maxAge=? WHERE id=?',
            [d.name,d.color,d.minTimeInMonths,d.rank,d.type,d.minAge,d.maxAge,req.params.id]);
        res.json(d);
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});
app.delete('/api/graduations/:id', requireAuth, async (req, res) => {
    try { await db.query('DELETE FROM graduations WHERE id=?', [req.params.id]); res.json({success:true}); }
    catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});

// Schedules
app.get('/api/schedules', requireAuth, async (req, res) => {
    const [rows] = await db.query('SELECT cs.*, GROUP_CONCAT(sa.assistantId) as assistantIds FROM class_schedules cs LEFT JOIN schedule_assistants sa ON cs.id = sa.scheduleId GROUP BY cs.id');
    rows.forEach(r => r.assistantIds = r.assistantIds ? r.assistantIds.split(',') : []);
    res.json(rows);
});
app.post('/api/schedules', requireAuth, async (req, res) => {
    const d = req.body; const id = uuidv4();
    try {
        await db.query('INSERT INTO class_schedules (id,className,dayOfWeek,startTime,endTime,professorId,academyId,requiredGraduationId) VALUES (?,?,?,?,?,?,?,?)',
            [id,d.className,d.dayOfWeek,d.startTime,d.endTime,d.professorId,d.academyId,d.requiredGraduationId]);
        if(d.assistantIds?.length) for(const aid of d.assistantIds) await db.query('INSERT INTO schedule_assistants VALUES (?,?)', [id, aid]);
        res.json({...d, id});
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});
app.put('/api/schedules/:id', requireAuth, async (req, res) => {
    const d = req.body;
    try {
        await db.query('UPDATE class_schedules SET className=?, dayOfWeek=?, startTime=?, endTime=?, professorId=?, academyId=?, requiredGraduationId=? WHERE id=?',
            [d.className,d.dayOfWeek,d.startTime,d.endTime,d.professorId,d.academyId,d.requiredGraduationId,req.params.id]);
        await db.query('DELETE FROM schedule_assistants WHERE scheduleId=?', [req.params.id]);
        if(d.assistantIds?.length) for(const aid of d.assistantIds) await db.query('INSERT INTO schedule_assistants VALUES (?,?)', [req.params.id, aid]);
        res.json(d);
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});
app.delete('/api/schedules/:id', requireAuth, async (req, res) => {
    try { await db.query('DELETE FROM class_schedules WHERE id=?', [req.params.id]); res.json({success:true}); }
    catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});

// Attendance
app.get('/api/attendance', requireAuth, async (req, res) => {
    const [rows] = await db.query('SELECT * FROM attendance_records');
    res.json(rows);
});
app.post('/api/attendance', requireAuth, async (req, res) => {
    const d = req.body; const id = uuidv4();
    try {
        await db.query('INSERT INTO attendance_records (id,studentId,scheduleId,date,status) VALUES (?,?,?,?,?)', [id,d.studentId,d.scheduleId,d.date,d.status]);
        res.json({...d, id});
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});

// Professors
app.get('/api/professors', requireAuth, async (req, res) => {
    const [rows] = await db.query('SELECT * FROM professors');
    res.json(rows);
});
app.post('/api/professors', requireAuth, async (req, res) => {
    const d = req.body; const id = uuidv4();
    try {
        await db.query('INSERT INTO professors (id,name,fjjpe_registration,cpf,academyId,graduationId,imageUrl,blackBeltDate) VALUES (?,?,?,?,?,?,?,?)',
            [id,d.name,d.fjjpe_registration,d.cpf,d.academyId,d.graduationId,d.imageUrl,d.blackBeltDate]);
        res.json({...d, id});
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});
app.put('/api/professors/:id', requireAuth, async (req, res) => {
    const d = req.body;
    try {
        await db.query('UPDATE professors SET name=?, fjjpe_registration=?, cpf=?, academyId=?, graduationId=?, imageUrl=?, blackBeltDate=? WHERE id=?',
            [d.name,d.fjjpe_registration,d.cpf,d.academyId,d.graduationId,d.imageUrl,d.blackBeltDate,req.params.id]);
        res.json(d);
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});
app.delete('/api/professors/:id', requireAuth, async (req, res) => {
    try { await db.query('DELETE FROM professors WHERE id=?', [req.params.id]); res.json({success:true}); }
    catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
});

// Users & Logs & News
app.get('/api/users', requireAuth, async (req, res) => {
    const [rows] = await db.query('SELECT id, name, email, role, academyId, studentId, birthDate FROM users');
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

// Settings
app.get('/api/settings/all', requireAuth, async (req, res) => {
    const [[rows]] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
    res.json(rows);
});
app.put('/api/settings', requireAuth, async (req, res) => {
    const d = req.body;
    try {
        await db.query('UPDATE theme_settings SET systemName=?, logoUrl=?, primaryColor=?, secondaryColor=?, backgroundColor=?, cardBackgroundColor=?, buttonColor=?, buttonTextColor=?, iconColor=?, chartColor1=?, chartColor2=?, reminderDaysBeforeDue=?, overdueDaysAfterDue=?, monthlyFeeAmount=?, publicPageEnabled=?, heroHtml=?, aboutHtml=?, branchesHtml=?, footerHtml=?, customCss=?, customJs=?, socialLoginEnabled=?, googleClientId=?, facebookAppId=?, pixKey=?, pixHolderName=?, copyrightText=?, systemVersion=? WHERE id=1',
            [d.systemName, d.logoUrl, d.primaryColor, d.secondaryColor, d.backgroundColor, d.cardBackgroundColor, d.buttonColor, d.buttonTextColor, d.iconColor, d.chartColor1, d.chartColor2, d.reminderDaysBeforeDue, d.overdueDaysAfterDue, d.monthlyFeeAmount, d.publicPageEnabled, d.heroHtml, d.aboutHtml, d.branchesHtml, d.footerHtml, d.customCss, d.customJs, d.socialLoginEnabled, d.googleClientId, d.facebookAppId, d.pixKey, d.pixHolderName, d.copyrightText, d.systemVersion]);
        const [[updated]] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        res.json(updated);
    } catch(e) { console.error(e); res.status(500).json({message: "Error saving settings"}); }
});

// 404 Catch-all for API
app.use('/api/*', (req, res) => {
    console.log(`[404] Route not found: ${req.originalUrl}`);
    res.status(404).json({ message: `API endpoint ${req.originalUrl} not found` });
});

// --- Server Start ---
(async () => {
    await connectToDatabase();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
