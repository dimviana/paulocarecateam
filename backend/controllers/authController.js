
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/db');

const { JWT_SECRET } = process.env;

// Generate Access Token (Short lived: 15m)
const generateAccessToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            academyId: user.academyId,
            studentId: user.studentId,
            name: user.name
        }, 
        JWT_SECRET, 
        { expiresIn: '15m' } 
    );
};

// Generate Refresh Token (Long lived: 7d)
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

const getSession = async (req, res) => {
    // Route is protected, so req.user is already populated by authMiddleware
    try {
        const db = getDb();
        const userId = req.user.id;
        
        // Fetch fresh user data from DB to ensure role/status hasn't changed
        const [[user]] = await db.query('SELECT id, name, email, role, academyId, studentId FROM users WHERE id = ?', [userId]);
        
        if (!user) return res.status(401).json({ user: null });
        
        res.json({ user });
    } catch (e) {
        console.error("Session check error:", e);
        res.status(500).json({ user: null });
    }
};

const login = async (req, res) => {
    console.log('[POST] /api/auth/login');
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Credenciais faltando.' });

    try {
        const db = getDb();
        // Allow login via Email or CPF (numbers only)
        const cleanUsername = username.includes('@') ? username : username.replace(/\D/g, '');
        
        // Search in Users table (linked to Students or Academies)
        const [[user]] = await db.query(
            'SELECT u.* FROM users u LEFT JOIN students s ON u.studentId = s.id WHERE u.email = ? OR s.cpf = ?', 
            [cleanUsername, cleanUsername]
        );
        
        if (!user) return res.status(401).json({ message: 'Usuário não encontrado.' });

        // Retrieve password hash based on role
        let passwordHash = null;
        
        if (user.role === 'student' && user.studentId) {
             const [[student]] = await db.query('SELECT password FROM students WHERE id = ?', [user.studentId]);
             passwordHash = student?.password;
        } else if (user.role === 'academy_admin' || user.role === 'general_admin') {
             // Admins usually have their password in the academies table or passed from seed
             const [[academy]] = await db.query('SELECT password FROM academies WHERE email = ?', [user.email]);
             passwordHash = academy?.password;
        }

        // Verify Password
        if (!passwordHash || !(await bcrypt.compare(password, passwordHash))) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }

        // Generate Tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save Refresh Token to DB for security (Revocation capability)
        await db.query('UPDATE users SET refreshToken = ? WHERE id = ?', [refreshToken, user.id]);

        const userData = { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role, 
            academyId: user.academyId, 
            studentId: user.studentId 
        };

        res.json({ user: userData, token: accessToken, refreshToken });

    } catch (e) {
        console.error('Login Error:', e);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
};

const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.sendStatus(401);

    try {
        const db = getDb();
        // Validate Refresh Token existence in DB (Security check)
        const [[user]] = await db.query('SELECT * FROM users WHERE refreshToken = ?', [refreshToken]);
        if (!user) return res.status(403).json({ message: "Invalid Refresh Token" });

        jwt.verify(refreshToken, JWT_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ message: "Expired Refresh Token" });
            
            // Generate new Access Token
            const accessToken = generateAccessToken(user);
            res.json({ token: accessToken });
        });
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
};

const register = async (req, res) => {
    console.log('[POST] /api/auth/register');
    const { name, address, responsible, responsibleRegistration, email, password, professorId, imageUrl } = req.body;
    
    if (!email || !password || !name) return res.status(400).json({ message: 'Campos obrigatórios faltando.' });

    const db = getDb();
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
        
        const [[newUser]] = await conn.query('SELECT id, name, email, role, academyId FROM users WHERE id = ?', [userId]);
        
        const accessToken = generateAccessToken(newUser);
        const refreshToken = generateRefreshToken(newUser);
        await db.query('UPDATE users SET refreshToken = ? WHERE id = ?', [refreshToken, newUser.id]);

        res.status(201).json({ user: newUser, token: accessToken, refreshToken });

    } catch (e) { 
        await conn.rollback(); 
        console.error(e);
        res.status(500).json({ message: 'Erro no cadastro.' }); 
    } finally { conn.release(); }
};

const logout = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        try {
            // Decode token to get user ID without verifying expiration (logout should work even if expired)
            const decoded = jwt.decode(token);
            if (decoded && decoded.id) {
                const db = getDb();
                await db.query('UPDATE users SET refreshToken = NULL WHERE id = ?', [decoded.id]);
            }
        } catch(e) {
            // Ignore errors on logout
        }
    }
    res.json({ message: 'Logged out successfully' });
};

module.exports = { getSession, login, register, logout, refreshToken };
