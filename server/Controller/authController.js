const jwt = require("jsonwebtoken");
const { signupSchema, signinSchema } = require("../middleware/validator");
const transport = require("../middleware/sendMail");
const User = require('../Model/userModel');
const { doHashValidation } = require('../Utils/hashing');
const bcrypt = require("bcryptjs");
require("dotenv").config();
const crypto = require("crypto");

const tempCodeStore = {};
const codeExpirationTime = Number(process.env.CODE_EXPIRY_TIME);

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

exports.signin = async (req, res) => {
    const { username, password } = req.body;

    const { error } = signinSchema.validate({ username, password });
    if (error) {
        return res.status(401).json({ success: false, message: error.details[0].message });
    }

    try {
        const results = await User.findByUsername(username);
        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "User does not exist!" });
        }

        const existingUser = results[0];

        const result = await doHashValidation(password, existingUser.user_pass);
        if (!result) {
            return res.status(401).json({ success: false, message: "Invalid credentials!" });
        }

        const token = jwt.sign(
            { userId: existingUser.id, username: existingUser.user_username },
            process.env.TOKEN_SECRET,
            { expiresIn: '8h' }
        );

        res.cookie('Authorization', 'Bearer ' + token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None'
        }).json({ success: true, token, message: 'Logged in successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Database error" });
    }
};

exports.sendForgotPasswordCode = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findByEmail(email);
        if (user.length === 0) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        const existingUser = user[0];

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = crypto.createHmac("sha256", process.env.HMAC_VERIFICATION_CODE_SECRET)
            .update(code)
            .digest("hex");

        await User.updateForgotPasswordCode(email, hashedCode);
        tempCodeStore[email] = Date.now() + codeExpirationTime;

        try {
            const mailOptions = {
                from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
                to: email,
                subject: 'Password Reset Code',
                text: `Your reset code is: ${code}`,
            };
    
            await transport.sendMail(mailOptions);
            console.log('Email sent successfully');
        } catch (error) {
            console.error('Error sending email:', error);
        }

        res.status(200).json({ success: true, message: "Verification code sent to email." });
    } catch (error) {
        console.error("Error sending forgot password code:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

exports.verifyForgotPasswordCode = async (req, res) => {
    const { email, providedCode, newPassword } = req.body;

    try {
        const user = await User.findByEmail(email);
        if (user.length === 0) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        const existingUser = user[0];

        if (!existingUser.forgot_password_code) {
            return res.status(400).json({ success: false, message: "No reset request found!" });
        }

        if (!tempCodeStore[email] || Date.now() > tempCodeStore[email]) {
            return res.status(400).json({ success: false, message: "Code has expired!" });
        }

        const hashedProvidedCode = crypto.createHmac("sha256", process.env.HMAC_VERIFICATION_CODE_SECRET)
            .update(providedCode.toString())
            .digest("hex");

        if (hashedProvidedCode !== existingUser.forgot_password_code) {
            return res.status(400).json({ success: false, message: "Invalid code!" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(email, hashedPassword);
        delete tempCodeStore[email];

        res.status(200).json({ success: true, message: "Password updated successfully!" });
    } catch (error) {
        console.error("Error verifying forgot password code:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
