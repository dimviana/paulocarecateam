
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/db');

const { JWT_SECRET } = process.env;

// Gera um token JWT
const generateToken = (user) => {
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
        { expiresIn: '24h' }
    );
};

const getSession = async (req, res) => {
    // Com JWT, a validação é feita no middleware ou no front decodificando o token.
    // Este endpoint serve para validar se o token atual ainda é válido e retornar dados frescos.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.json({ user: null });

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) return res.json({ user: null });
        
        // Opcional: Buscar dados frescos do banco para garantir que o usuário não foi deletado
        try {
            const db = getDb();
            const [[user]] = await db.query('SELECT id, name, email, role, academyId, studentId FROM users WHERE id = ?', [decoded.id]);
            if (!user) return res.json({ user: null });
            res.json({ user });
        } catch (e) {
            res.json({ user: null });
        }
    });
};

const login = async (req, res) => {
    console.log('[POST] /api/auth/login');
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Credenciais faltando.' });

    try {
        const db = getDb();
        const cleanUsername = username.includes('@') ? username : username.replace(/\D/g, '');
        
        const [[user]] = await db.query(
            'SELECT u.* FROM users u LEFT JOIN students s ON u.studentId = s.id WHERE u.email = ? OR s.cpf = ?', 
            [cleanUsername, cleanUsername]
        );
        
        if (!user) return res.status(401).json({ message: 'Usuário não encontrado.' });

        let passwordHash = null;
        if (user.role === 'student' && user.studentId) {
             const [[student]] = await db.query('SELECT password FROM students WHERE id = ?', [user.studentId]);
             passwordHash = student?.password;
        } else {
             const [[academy]] = await db.query('SELECT password FROM academies WHERE email = ?', [user.email]);
             passwordHash = academy?.password;
        }

        if (!passwordHash && user.role === 'general_admin') {
             const [[seedAcademy]] = await db.query('SELECT password FROM academies WHERE email = ?', [user.email]);
             passwordHash = seedAcademy?.password;
        }

        if (!passwordHash || !(await bcrypt.compare(password, passwordHash))) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }

        const token = generateToken(user);

        const userData = { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role, 
            academyId: user.academyId, 
            studentId: user.studentId 
        };

        res.json({ user: userData, token });

    } catch (e) {
        console.error('Login Error:', e);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
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
        const token = generateToken(newUser);

        res.status(201).json({ user: newUser, token });

    } catch (e) { 
        await conn.rollback(); 
        console.error(e);
        res.status(500).json({ message: 'Erro no cadastro.' }); 
    } finally { conn.release(); }
};

const logout = async (req, res) => {
    // Com JWT stateless, o logout é feito no cliente (apagando o token).
    // Opcionalmente, o servidor pode implementar uma "blacklist" de tokens, mas para este escopo, apenas retornamos sucesso.
    res.json({ message: 'Logged out successfully' });
};

module.exports = { getSession, login, register, logout };
