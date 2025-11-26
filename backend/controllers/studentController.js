
const { getDb } = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const getAll = async (req, res) => {
    console.log('[GET] /api/students');
    try {
        const db = getDb();
        const [rows] = await db.query('SELECT * FROM students');
        const [pay] = await db.query('SELECT * FROM payment_history');
        const map = {}; 
        pay.forEach(p => { if(!map[p.studentId]) map[p.studentId]=[]; map[p.studentId].push(p) });
        rows.forEach(r => { 
            r.paymentHistory = map[r.id] || []; 
            try{ r.medals=JSON.parse(r.medals) } catch(e){ r.medals={gold:0,silver:0,bronze:0} } 
        });
        res.json(rows);
    } catch(e) { console.error(e); res.status(500).json({message: "Error fetching students"}); }
};

const create = async (req, res) => {
    const d = req.body; const id = uuidv4(); const uid = uuidv4();
    const hash = await bcrypt.hash(d.password||'123456', 10);
    try {
        const db = getDb();
        await db.query('INSERT INTO students (id,name,email,password,birthDate,cpf,fjjpe_registration,phone,address,beltId,academyId,firstGraduationDate,paymentStatus,paymentDueDateDay,stripes,isCompetitor,lastCompetition,medals,imageUrl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [id,d.name,d.email,hash,d.birthDate,d.cpf,d.fjjpe_registration,d.phone,d.address,d.beltId,d.academyId,d.firstGraduationDate,'unpaid',d.paymentDueDateDay,d.stripes,d.isCompetitor,d.lastCompetition,JSON.stringify(d.medals),d.imageUrl]);
        await db.query('INSERT INTO users (id,name,email,role,studentId,birthDate,academyId) VALUES (?,?,?,?,?,?,?)', [uid,d.name,d.email,'student',id,d.birthDate,d.academyId]);
        res.json({...d, id});
    } catch(e) { console.error(e); res.status(500).json({message: "Error creating student"}); }
};

const update = async (req, res) => {
    const d = req.body;
    try {
        const db = getDb();
        await db.query('UPDATE students SET name=?, email=?, birthDate=?, cpf=?, fjjpe_registration=?, phone=?, address=?, beltId=?, academyId=?, firstGraduationDate=?, paymentDueDateDay=?, stripes=?, isCompetitor=?, lastCompetition=?, medals=?, imageUrl=? WHERE id=?',
            [d.name,d.email,d.birthDate,d.cpf,d.fjjpe_registration,d.phone,d.address,d.beltId,d.academyId,d.firstGraduationDate,d.paymentDueDateDay,d.stripes,d.isCompetitor,d.lastCompetition,JSON.stringify(d.medals),d.imageUrl,req.params.id]);
        res.json(d);
    } catch(e) { console.error(e); res.status(500).json({message: "Error updating student"}); }
};

const updatePayment = async (req, res) => {
    const { status, amount } = req.body;
    try {
        const db = getDb();
        await db.query('UPDATE students SET paymentStatus=? WHERE id=?', [status, req.params.id]);
        if(status === 'paid') await db.query('INSERT INTO payment_history (id, studentId, date, amount) VALUES (?,?,?,?)', [uuidv4(), req.params.id, new Date(), amount]);
        res.json({success: true});
    } catch(e) { console.error(e); res.status(500).json({message: "Error updating payment"}); }
};

const remove = async (req, res) => {
    try {
        const db = getDb();
        await db.query('DELETE FROM students WHERE id=?', [req.params.id]);
        await db.query('DELETE FROM users WHERE studentId=?', [req.params.id]);
        res.json({success: true});
    } catch(e) { console.error(e); res.status(500).json({message: "Error deleting student"}); }
};

module.exports = { getAll, create, update, updatePayment, remove };
