const express = require("express");
const {UserTable} = require('../models');
const authController = require('../Controller/authController');
const { identifier } = require("../middleware/identification");
const router = express.Router();



router.get("/", async (req, res) => {
    try {
        const allUser = await UserTable.findAll();
        res.json(allUser);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
});

router.post("/signup", async (req, res) => {
    try {
        await authController.signup(req, res); 
    } catch (err) {
        console.error("Error signing up:", err);
        res.status(500).json({ success: false, message: "Error occurred during sign up" });
    }
});

router.post('/signin', async (req, res) => {
    try {
        await authController.signin(req, res);  
    } catch (err) {
        console.error("Error signing in:", err);
        res.status(500).json({ success: false, message: "Error occurred during sign in" });
    }
});


router.post('/send-forgot-password-code', async (req, res) => {
    try {
        await authController.sendForgotPasswordCode(req, res); 
    } catch (err) {
        console.error("Error sending forgot password code:", err);
        res.status(500).json({ success: false, message: "Error occurred while sending reset code" });
    }
});


router.post('/verify-forgot-password-code', async (req, res) => {
    try {
        await authController.verifyForgotPasswordCode(req, res);  
    } catch (err) {
        console.error("Error verifying forgot password code:", err);
        res.status(500).json({ success: false, message: "Error occurred while verifying the reset code" });
    }
});
module.exports = router;

