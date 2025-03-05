// 

import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow frontend connection
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) =>{
    res.send("Chat Server is running!");
  });


let users = {}; // Store socket IDs with usernames

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // When a user joins, store their username and socket ID
  socket.on("set_username", (username) => {
    users[username] = socket.id;
    io.emit("user_list", Object.keys(users)); // Send updated user list to all clients
  });

  // Broadcast message to all users
  socket.on("send_message", (data) => {
    console.log("Broadcast Message:", data);
    io.emit("receive_message", data); // Send to all users
  });

  // Send a private message to a specific user
  socket.on("send_private_message", ({ message, receiverUsername }) => {
    const receiverSocketId = users[receiverUsername];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive_private_message", { message, from: socket.id });
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
    for (const username in users) {
      if (users[username] === socket.id) {
        delete users[username];
        break;
      }
    }
    io.emit("user_list", Object.keys(users)); // Update user list
  });
});
const PORT = process.env.PORT || 5000;

server.listen(5000, () => {
  console.log("Server running on port 5000");
});

