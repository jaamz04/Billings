const jwt = require("jsonwebtoken");
const { signupSchema, signinSchema } = require("../middleware/validator");
const transport = require("../middleware/sendMail");
const {UserTable} = require('../models');
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

        const existingUser = await UserTable.findOne({
            where: { user_email: email }
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists!" });
        }

        
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await UserTable.create({
            user_name: firstName,
            user_lastname: lastName,
            user_nickname: nickname,
            user_username: username,
            user_email: email,
            user_pass: hashedPassword
        });

        res.status(201).json({ success: true, message: "Your account has been created successfully!", user: newUser });
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
        const existingUser = await UserTable.findOne({ where: { user_username: username } });
        
     
        if (!existingUser) {
            return res.status(401).json({ success: false, message: "User does not exist!" });
        }

       
        const result = await doHashValidation(password, existingUser.user_pass);
        if (!result) {
            return res.status(401).json({ success: false, message: "Invalid credentials!" });
        }

        
        const token = jwt.sign(
            { userId: existingUser.user_Id, username: existingUser.user_username },
            process.env.TOKEN_SECRET,
            { expiresIn: '8h' }
        );

        
        res.cookie('Authorization', 'Bearer ' + token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None'
        }).json({ success: true, token, message: 'Logged in successfully' });
    } catch (err) {
        console.error("Signin Error:", err);
        return res.status(500).json({ success: false, message: "Database error", error: err.message });
    }
};

exports.sendForgotPasswordCode = async (req, res) => {
    try {
        console.log("Received request body:", req.body);

        const { email } = req.body;
        
       
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required!" });
        }

        const user = await UserTable.findOne({ where: { user_email: email } });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }

    
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = crypto.createHmac("sha256", process.env.HMAC_VERIFICATION_CODE_SECRET)
            .update(code)
            .digest("hex");

        
        await UserTable.update({ forgot_password_code: hashedCode }, { where: { user_email: email } });

        
        const mailOptions = {
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: email,
            subject: 'Password Reset Code',
            text: `Your reset code is: ${code}`,
        };

        await transport.sendMail(mailOptions);
        console.log('Email sent successfully');

        res.status(200).json({ success: true, message: "Verification code sent to email." });
    } catch (error) {
        console.error("Error sending forgot password code:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



exports.verifyForgotPasswordCode = async (req, res) => {
    const { email, providedCode, newPassword } = req.body;

    try {
   
        const user = await UserTable.findOne({ where: { user_email: email } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        
        if (!user.forgot_password_code) {
            return res.status(400).json({ success: false, message: "No reset request found!" });
        }

        if (!tempCodeStore[email] || Date.now() > tempCodeStore[email]) {
            return res.status(400).json({ success: false, message: "Code has expired!" });
        }

  
        const hashedProvidedCode = crypto.createHmac("sha256", process.env.HMAC_VERIFICATION_CODE_SECRET)
            .update(providedCode.toString())
            .digest("hex");

        if (hashedProvidedCode !== user.forgot_password_code) {
            return res.status(400).json({ success: false, message: "Invalid code!" });
        }

       
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await UserTable.update({ user_pass: hashedPassword }, { where: { user_email: email } });

      
        delete tempCodeStore[email];

        res.status(200).json({ success: true, message: "Password updated successfully!" });
    } catch (error) {
        console.error("Error verifying forgot password code:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};