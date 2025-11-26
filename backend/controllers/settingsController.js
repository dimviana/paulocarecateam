
const { getDb } = require('../config/db');

const getPublicSettings = async (req, res) => {
    console.log('[GET] /api/settings');
    try {
        const db = getDb();
        const [rows] = await db.query(`SELECT * FROM theme_settings WHERE id = 1`);
        res.json(rows[0] || {});
    } catch (e) { 
        console.error(e);
        res.status(500).json({message: "Failed settings"}); 
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
