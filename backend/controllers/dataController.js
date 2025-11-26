
const { getDb } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Academies
const getAcademies = async (req, res) => {
    console.log('[GET] /api/academies');
    try { const [rows] = await getDb().query('SELECT * FROM academies WHERE id != ?', ['master_admin_academy_01']); res.json(rows); } catch(e) { res.status(500).json({message: "Error"}); }
};
const updateAcademy = async (req, res) => {
    const d = req.body; try { await getDb().query('UPDATE academies SET name=?, address=?, responsible=?, responsibleRegistration=?, professorId=?, imageUrl=?, email=? WHERE id=?', [d.name,d.address,d.responsible,d.responsibleRegistration,d.professorId,d.imageUrl,d.email,req.params.id]); res.json(d); } catch(e) { res.status(500).json({message: "Error"}); }
};
const deleteAcademy = async (req, res) => {
    try { await getDb().query('DELETE FROM academies WHERE id=?', [req.params.id]); await getDb().query('DELETE FROM users WHERE academyId=?', [req.params.id]); res.json({success: true}); } catch(e) { res.status(500).json({message: "Error"}); }
};

// Graduations
const getGraduations = async (req, res) => { try { const [rows] = await getDb().query('SELECT * FROM graduations'); res.json(rows); } catch(e) { res.status(500).json({message: "Error"}); } };
const createGraduation = async (req, res) => { const d = req.body; const id = uuidv4(); try { await getDb().query('INSERT INTO graduations (id,name,color,minTimeInMonths,`rank`,type,minAge,maxAge) VALUES (?,?,?,?,?,?,?,?)', [id,d.name,d.color,d.minTimeInMonths,d.rank,d.type,d.minAge,d.maxAge]); res.json({...d, id}); } catch(e) { res.status(500).json({message: "Error"}); } };
const updateGraduationRanks = async (req, res) => { try { for(const item of req.body) await getDb().query('UPDATE graduations SET `rank`=? WHERE id=?', [item.rank, item.id]); res.json({success:true}); } catch(e) { res.status(500).json({message: "Error"}); } };
const updateGraduation = async (req, res) => { const d = req.body; try { await getDb().query('UPDATE graduations SET name=?, color=?, minTimeInMonths=?, `rank`=?, type=?, minAge=?, maxAge=? WHERE id=?', [d.name,d.color,d.minTimeInMonths,d.rank,d.type,d.minAge,d.maxAge,req.params.id]); res.json(d); } catch(e) { res.status(500).json({message: "Error"}); } };
const deleteGraduation = async (req, res) => { try { await getDb().query('DELETE FROM graduations WHERE id=?', [req.params.id]); res.json({success:true}); } catch(e) { res.status(500).json({message: "Error"}); } };

// Schedules
const getSchedules = async (req, res) => { try { const [rows] = await getDb().query('SELECT cs.*, GROUP_CONCAT(sa.assistantId) as assistantIds FROM class_schedules cs LEFT JOIN schedule_assistants sa ON cs.id = sa.scheduleId GROUP BY cs.id'); rows.forEach(r => r.assistantIds = r.assistantIds ? r.assistantIds.split(',') : []); res.json(rows); } catch(e) { res.status(500).json({message: "Error"}); } };
const createSchedule = async (req, res) => { const d = req.body; const id = uuidv4(); try { await getDb().query('INSERT INTO class_schedules (id,className,dayOfWeek,startTime,endTime,professorId,academyId,requiredGraduationId) VALUES (?,?,?,?,?,?,?,?)', [id,d.className,d.dayOfWeek,d.startTime,d.endTime,d.professorId,d.academyId,d.requiredGraduationId]); if(d.assistantIds?.length) for(const aid of d.assistantIds) await getDb().query('INSERT INTO schedule_assistants VALUES (?,?)', [id, aid]); res.json({...d, id}); } catch(e) { res.status(500).json({message: "Error"}); } };
const updateSchedule = async (req, res) => { const d = req.body; try { await getDb().query('UPDATE class_schedules SET className=?, dayOfWeek=?, startTime=?, endTime=?, professorId=?, academyId=?, requiredGraduationId=? WHERE id=?', [d.className,d.dayOfWeek,d.startTime,d.endTime,d.professorId,d.academyId,d.requiredGraduationId,req.params.id]); await getDb().query('DELETE FROM schedule_assistants WHERE scheduleId=?', [req.params.id]); if(d.assistantIds?.length) for(const aid of d.assistantIds) await getDb().query('INSERT INTO schedule_assistants VALUES (?,?)', [req.params.id, aid]); res.json(d); } catch(e) { res.status(500).json({message: "Error"}); } };
const deleteSchedule = async (req, res) => { try { await getDb().query('DELETE FROM class_schedules WHERE id=?', [req.params.id]); res.json({success:true}); } catch(e) { res.status(500).json({message: "Error"}); } };

// Attendance
const getAttendance = async (req, res) => { try { const [rows] = await getDb().query('SELECT * FROM attendance_records'); res.json(rows); } catch(e) { res.status(500).json({message: "Error"}); } };
const createAttendance = async (req, res) => { const d = req.body; const id = uuidv4(); try { await getDb().query('INSERT INTO attendance_records (id,studentId,scheduleId,date,status) VALUES (?,?,?,?,?)', [id,d.studentId,d.scheduleId,d.date,d.status]); res.json({...d, id}); } catch(e) { res.status(500).json({message: "Error"}); } };

// Professors
const getProfessors = async (req, res) => { try { const [rows] = await getDb().query('SELECT * FROM professors'); res.json(rows); } catch(e) { res.status(500).json({message: "Error"}); } };
const createProfessor = async (req, res) => { const d = req.body; const id = uuidv4(); try { await getDb().query('INSERT INTO professors (id,name,fjjpe_registration,cpf,academyId,graduationId,imageUrl,blackBeltDate) VALUES (?,?,?,?,?,?,?,?)', [id,d.name,d.fjjpe_registration,d.cpf,d.academyId,d.graduationId,d.imageUrl,d.blackBeltDate]); res.json({...d, id}); } catch(e) { res.status(500).json({message: "Error"}); } };
const updateProfessor = async (req, res) => { const d = req.body; try { await getDb().query('UPDATE professors SET name=?, fjjpe_registration=?, cpf=?, academyId=?, graduationId=?, imageUrl=?, blackBeltDate=? WHERE id=?', [d.name,d.fjjpe_registration,d.cpf,d.academyId,d.graduationId,d.imageUrl,d.blackBeltDate,req.params.id]); res.json(d); } catch(e) { res.status(500).json({message: "Error"}); } };
const deleteProfessor = async (req, res) => { try { await getDb().query('DELETE FROM professors WHERE id=?', [req.params.id]); res.json({success:true}); } catch(e) { res.status(500).json({message: "Error"}); } };

// Others
const getUsers = async (req, res) => { try { const [rows] = await getDb().query('SELECT id, name, email, role, academyId, studentId, birthDate FROM users'); res.json(rows); } catch(e) { res.status(500).json({message: "Error"}); } };
const getLogs = async (req, res) => { try { const [rows] = await getDb().query('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100'); res.json(rows); } catch(e) { res.status(500).json({message: "Error"}); } };
const getNews = async (req, res) => { try { const [rows] = await getDb().query('SELECT * FROM news_articles'); res.json(rows); } catch(e) { res.status(500).json({message: "Error"}); } };

module.exports = {
    getAcademies, updateAcademy, deleteAcademy,
    getGraduations, createGraduation, updateGraduationRanks, updateGraduation, deleteGraduation,
    getSchedules, createSchedule, updateSchedule, deleteSchedule,
    getAttendance, createAttendance,
    getProfessors, createProfessor, updateProfessor, deleteProfessor,
    getUsers, getLogs, getNews
};
