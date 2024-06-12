import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import { connect } from "./db";
import { routes } from "./routes";
import { initSocket } from "./socket";


dotenv.config();

const port = process.env.PORT || 1337;
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies using query-string library



server.listen(port, async () => {
  console.log("Server is running on port:", port);
  await connect();
  routes(app);
  initSocket(server); // Initialize Socket.IO
});
