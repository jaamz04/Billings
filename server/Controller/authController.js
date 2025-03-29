const jwt = require("jsonwebtoken");
const { signupSchema, signinSchema } = require("../middleware/validator");
const User = require('../Model/userModel'); 
const { doHash, doHashValidation } = require('../Utils/hashing');
const bcrypt = require("bcryptjs");



exports.signup = async (req, res) => {
    try {
        console.log("Received request body:", req.body);
        const { firstName, lastName, nickname, username, email, password } = req.body;

       
        const { error } = signupSchema.validate({ firstName, lastName, nickname, username, email, password });
        if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

      
        const existingUser = await User.findByEmail(email);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: "User already exists!" });
        }

        
        const hashedPassword = await bcrypt.hash(password, 10);

        
        await User.create({ firstName, lastName, nickname, username, email, password: hashedPassword });

        res.status(201).json({ success: true, message: "Your account has been created successfully!" });
    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ success: false, message: "Internal server error", error: err.message });
    }
};

exports.signin = (req, res) => {
    const { username, password } = req.body;

    const { error } = signinSchema.validate({ username, password });
    if (error) {
        return res.status(401).json({ success: false, message: error.details[0].message });
    }

    User.findByUsername(username, async (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        if (results.length === 0) return res.status(401).json({ success: false, message: "User does not exist!" });

        const existingUser = results[0];

        const result = await doHashValidation(password, existingUser.password);
        if (!result) {
            return res.status(401).json({ success: false, message: "Invalid credentials!" });
        }

        const token = jwt.sign({
            userId: existingUser.id,
            username: existingUser.username
        }, process.env.TOKEN_SECRET, { expiresIn: '8h' });

        res.cookie('Authorization', 'Bearer ' + token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })
            .json({ success: true, token, message: 'Logged in successfully' });
    });
};
