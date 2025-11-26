const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/db');

const { JWT_SECRET } = process.env;

// 1. GERAÇÃO DE TOKEN (Server-side)
// Cria um token assinado contendo as informações do usuário (payload)
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
        { expiresIn: '15m' } // Expiração curta para segurança
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

const getSession = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.json({ user: null });
    }

    try {
        // 4. VALIDAÇÃO DA ASSINATURA E EXPIRAÇÃO
        // Verifica se o token foi assinado por nós e se ainda é válido
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id;

        const db = getDb();
        const [[user]] = await db.query('SELECT id, name, email, role, academyId, studentId FROM users WHERE id = ?', [userId]);
        
        if (!user) {
            return res.json({ user: null });
        }
        
        res.json({ user });
    } catch (e) {
        return res.json({ user: null });
    }
};

const login = async (req, res) => {
    console.log('[POST] /api/auth/login');
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Credenciais faltando.' });

    try {
        const db = getDb();
        const cleanUsername = username.includes('@') ? username : username.replace(/\D/g, '');
        
        const [[user]] = await db.query(
            `SELECT u.* 
             FROM users u 
             LEFT JOIN students s ON u.studentId = s.id 
             WHERE u.email = ? OR s.cpf = ?`, 
            [cleanUsername, cleanUsername]
        );
        
        if (!user) return res.status(401).json({ message: 'Usuário não encontrado.' });

        let passwordHash = null;
        
        if (user.role === 'student' && user.studentId) {
             const [[student]] = await db.query('SELECT password FROM students WHERE id = ?', [user.studentId]);
             passwordHash = student?.password;
        } else if (user.role === 'academy_admin' || user.role === 'general_admin') {
             const [[academy]] = await db.query('SELECT password FROM academies WHERE email = ?', [user.email]);
             passwordHash = academy?.password;
        }

        if (!passwordHash || !(await bcrypt.compare(password, passwordHash))) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }

        // Gera o JWT após autenticação bem-sucedida
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await db.query('UPDATE users SET refreshToken = ? WHERE id = ?', [refreshToken, user.id]);

        const userData = { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role, 
            academyId: user.academyId, 
            studentId: user.studentId 
        };

        // Envia o token para o cliente
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
        const [[user]] = await db.query('SELECT * FROM users WHERE refreshToken = ?', [refreshToken]);
        if (!user) return res.status(403).json({ message: "Invalid Refresh Token" });

        jwt.verify(refreshToken, JWT_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ message: "Expired Refresh Token" });
            const accessToken = generateAccessToken(user);
            res.json({ token: accessToken });
        });
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
};

const register = async (req, res) => {
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
        res.status(500).json({ message: 'Erro no cadastro.' }); 
    } finally { conn.release(); }
};

const logout = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.id) {
                const db = getDb();
                await db.query('UPDATE users SET refreshToken = NULL WHERE id = ?', [decoded.id]);
            }
        } catch(e) {}
    }
    res.json({ message: 'Logged out successfully' });
};

module.exports = { getSession, login, register, logout, refreshToken };