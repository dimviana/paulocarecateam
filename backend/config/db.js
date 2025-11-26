
const mysql = require('mysql2/promise');
require('dotenv').config();

const { DATABASE_URL } = process.env;

let db;

async function connectToDatabase() {
  try {
    if (!DATABASE_URL) throw new Error("DATABASE_URL missing");
    const pool = mysql.createPool(DATABASE_URL);
    await pool.query('SELECT 1');
    db = pool;
    console.log('Connected to MySQL successfully.');
    await ensureDefaultSettings();
    return db;
  } catch (error) {
    console.error('DB CONNECTION FAILED:', error.message);
    process.exit(1);
  }
}

function getDb() {
    if (!db) throw new Error("Database not initialized");
    return db;
}

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

module.exports = { connectToDatabase, getDb };
