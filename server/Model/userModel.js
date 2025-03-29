const db = require('../config/db'); 

exports.findByEmail = async (email) => {
    const query = `SELECT * FROM bills_account WHERE user_email = ?`;
    const [results] = await db.query(query, [email]);
    return results;
};

exports.create = async (userData) => {
    const query = `INSERT INTO bills_account (user_name, user_lastname, user_nickname, user_email, user_username, user_pass) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [
        userData.firstName,
        userData.lastName,
        userData.nickname,
        userData.email,
        userData.username,
        userData.password,
    ];
    
    const [result] = await db.query(query, values);
    return result;
};
