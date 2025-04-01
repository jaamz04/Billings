const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const authRouter = require("./Router/authRouter");
const db = require("./models");
dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", authRouter);
db.sequelize.sync().then(()=>{
    const PORT = process.env.PORT;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})

app.get("/", (req, res) => {
    res.json({ message: "Hello from the server" });
});


