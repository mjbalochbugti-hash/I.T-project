require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/api/", rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get("/", (req, res) => res.json({ status: "ok", message: "ShieldScan API running 🚀" }));
app.use("/api/auth",       require("./routes/auth"));
app.use("/api/scan-ip",    require("./routes/ipScan"));
app.use("/api/risk-score", require("./routes/riskScore"));
app.use("/api/check-url",  require("./routes/urlCheck"));
app.use("/api/history",    require("./routes/history"));
app.use((req, res) => res.status(404).json({ error: "Route not found." }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ ShieldScan backend → http://localhost:${PORT}`));
