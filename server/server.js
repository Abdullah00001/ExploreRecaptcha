import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.get("/auth/login", (req, res) => {
  res.status(200).json({ success: true, message: "server running" });
});

const port = process.env.PORT;

app.listen(port, () => {
  console.info(`Server Running On Port ${port}`);
});
