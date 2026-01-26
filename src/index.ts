import "dotenv/config";

import express from "express";

const PORT = process.env.PORT || 3000;

const app = express();

app.get("/health", (req, res) => {
    res.json({ success: true, data: { message: "working" } });
});

app.listen(PORT, () => {
    console.log(`Your app is listening in http://localhost:${PORT}`);
});
