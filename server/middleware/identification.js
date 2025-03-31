const jwt = require("jsonwebtoken");

exports.identifier = (req, res, next) => {
    let token;

    if (req.headers.client === 'not-browser') {
        token = req.headers.authorization; 
    } else {
        token = req.cookies['Authorization'];
    }

    if (!token) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    try {
        const tokenParts = token.split(' ');
        if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
            return res.status(403).json({ success: false, message: "Invalid token format" });
        }

        const userToken = tokenParts[1];
        const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET);

        req.user = jwtVerified;
        return next();  

    } catch (error) {
        console.log("JWT Verification Error:", error.message);
        return res.status(403).json({ success: false, message: "Invalid token" });
    }
};
