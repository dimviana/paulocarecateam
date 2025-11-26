const jwt = require('jsonwebtoken');
require('dotenv').config();

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env");
    process.exit(1);
}

const requireAuth = async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();

    try {
        // 3. RECEBIMENTO DA REQUISIÇÃO
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Padrão: Bearer <token>

        if (!token) {
            console.log(`[Auth Fail] No token provided. Route: ${req.path}`);
            return res.status(401).json({ message: 'Não autenticado (Token ausente).' });
        }

        // 4. VALIDAÇÃO (Assinatura, Expiração)
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                console.log(`[Auth Fail] Invalid token: ${err.message}`);
                // Retorna 403 se o token for inválido ou expirado
                return res.status(403).json({ message: 'Token inválido ou expirado.' });
            }
            
            // 5. AUTORIZAÇÃO (Sucesso)
            // Anexa os dados do usuário decodificados à requisição
            req.user = user;
            next();
        });

    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ message: "Erro de autenticação no servidor." });
    }
};

module.exports = { requireAuth };