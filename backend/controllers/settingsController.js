
const { getDb } = require('../config/db');

const getPublicSettings = async (req, res) => {
    console.log('[GET] /api/settings');
    try {
        const db = getDb();
        const [rows] = await db.query(`SELECT * FROM theme_settings WHERE id = 1`);
        
        // Return DB settings or empty object if not found
        if (rows && rows.length > 0) {
            res.json(rows[0]);
        } else {
            // Fallback if table exists but is empty
            throw new Error("No settings found in DB");
        }
    } catch (e) { 
        console.error("Error fetching settings (returning defaults):", e.message);
        // Robust Fallback to prevent app crash on init or DB error
        res.json({
            systemName: 'Jiu-Jitsu Hub',
            primaryColor: '#f59e0b',
            secondaryColor: '#111827',
            logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=amber&shade=500',
            publicPageEnabled: true,
            // Add other essential defaults to prevent UI glitches
            backgroundColor: '#f8fafc',
            cardBackgroundColor: '#ffffff',
            buttonColor: '#f59e0b',
            buttonTextColor: '#ffffff',
            iconColor: '#64748b',
            chartColor1: '#f9a825',
            chartColor2: '#475569',
            copyrightText: 'ABILDEVELOPER',
            systemVersion: '1.0.0'
        }); 
    }
};

const getAllSettings = async (req, res) => {
    try {
        const db = getDb();
        const [[rows]] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        res.json(rows);
    } catch(e) { console.error(e); res.status(500).json({message: "Error"}); }
};

const updateSettings = async (req, res) => {
    const d = req.body;
    try {
        const db = getDb();
        await db.query('UPDATE theme_settings SET systemName=?, logoUrl=?, primaryColor=?, secondaryColor=?, backgroundColor=?, cardBackgroundColor=?, buttonColor=?, buttonTextColor=?, iconColor=?, chartColor1=?, chartColor2=?, reminderDaysBeforeDue=?, overdueDaysAfterDue=?, monthlyFeeAmount=?, publicPageEnabled=?, heroHtml=?, aboutHtml=?, branchesHtml=?, footerHtml=?, customCss=?, customJs=?, socialLoginEnabled=?, googleClientId=?, facebookAppId=?, pixKey=?, pixHolderName=?, copyrightText=?, systemVersion=? WHERE id=1',
            [d.systemName, d.logoUrl, d.primaryColor, d.secondaryColor, d.backgroundColor, d.cardBackgroundColor, d.buttonColor, d.buttonTextColor, d.iconColor, d.chartColor1, d.chartColor2, d.reminderDaysBeforeDue, d.overdueDaysAfterDue, d.monthlyFeeAmount, d.publicPageEnabled, d.heroHtml, d.aboutHtml, d.branchesHtml, d.footerHtml, d.customCss, d.customJs, d.socialLoginEnabled, d.googleClientId, d.facebookAppId, d.pixKey, d.pixHolderName, d.copyrightText, d.systemVersion]);
        const [[updated]] = await db.query('SELECT * FROM theme_settings WHERE id = 1');
        res.json(updated);
    } catch(e) { console.error(e); res.status(500).json({message: "Error saving settings"}); }
};

module.exports = { getPublicSettings, getAllSettings, updateSettings };
