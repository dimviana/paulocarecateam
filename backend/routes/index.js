const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const settingsController = require('../controllers/settingsController');
const studentController = require('../controllers/studentController');
const dataController = require('../controllers/dataController');

const router = express.Router();

console.log('Initializing API Routes...');

// ==============================================================================
// PUBLIC ROUTES (No Authentication Required)
// ==============================================================================

// 1. Session Check (Must be first to allow app initialization)
router.get('/auth/session', authController.getSession); 

// 2. Settings (Required for Login Page)
router.get('/settings', settingsController.getPublicSettings);

// 3. Authentication Actions
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/refresh', authController.refreshToken); 
router.post('/auth/logout', authController.logout);
router.post('/auth/google', (req, res) => res.status(501).json({message: "Not configured"}));

// ==============================================================================
// AUTHENTICATION BARRIER
// ==============================================================================
// All routes defined below this line will require a valid JWT token.
router.use(requireAuth);

// ==============================================================================
// PROTECTED ROUTES (Require Valid Token)
// ==============================================================================

// Settings (Protected - Admin Only)
router.get('/settings/all', settingsController.getAllSettings);
router.put('/settings', settingsController.updateSettings);

// Students
router.get('/students', studentController.getAll);
router.post('/students', studentController.create);
router.put('/students/:id', studentController.update);
router.post('/students/:id/payment', studentController.updatePayment);
router.delete('/students/:id', studentController.remove);

// Academies
router.get('/academies', dataController.getAcademies);
router.put('/academies/:id', dataController.updateAcademy);
router.delete('/academies/:id', dataController.deleteAcademy);

// Graduations
router.get('/graduations', dataController.getGraduations);
router.post('/graduations', dataController.createGraduation);
router.put('/graduations/ranks', dataController.updateGraduationRanks);
router.put('/graduations/:id', dataController.updateGraduation);
router.delete('/graduations/:id', dataController.deleteGraduation);

// Schedules
router.get('/schedules', dataController.getSchedules);
router.post('/schedules', dataController.createSchedule);
router.put('/schedules/:id', dataController.updateSchedule);
router.delete('/schedules/:id', dataController.deleteSchedule);

// Attendance
router.get('/attendance', dataController.getAttendance);
router.post('/attendance', dataController.createAttendance);

// Professors
router.get('/professors', dataController.getProfessors);
router.post('/professors', dataController.createProfessor);
router.put('/professors/:id', dataController.updateProfessor);
router.delete('/professors/:id', dataController.deleteProfessor);

// Misc
router.get('/users', dataController.getUsers);
router.get('/logs', dataController.getLogs);
router.get('/news', dataController.getNews);

// 404 for Unknown API Routes
router.use('/*', (req, res) => {
    console.log(`[404] API Route not found: ${req.originalUrl}`);
    res.status(404).json({ message: `API endpoint ${req.originalUrl} not found` });
});

module.exports = router;