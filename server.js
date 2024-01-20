const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { v4: generateRandomID } = require("uuid");
const port = 3000;

app.use(express.static("client"));
app.set("view engine", "ejs");

app.get("/privgroup/:grpName", (req, res) => {
  const grpID = generateRandomID();
  const grpName = req.params.grpName;
  res.redirect(`/privgroup/${grpName}/${grpID}`);
});

app.get("/privgroup/:grpName/:grpID", (req, res) => {
  const grpName = req.params.grpName;
  const grpID = req.params.grpID;
  res.render("group", {
    grpName,
    grpID,
  });
});

let connectedUsers = {};

io.on("connection", (socket) => {
  socket.on("new user", (nickName) => {
    socket.nickName = nickName;
    connectedUsers[socket.id] = socket.nickName;
    console.log(`${nickName} has connected, his id is: ${socket.id}`);
    console.log("Connected Users", connectedUsers);
    socket.broadcast.emit("new user", nickName);
    io.emit("usersList", connectedUsers);
  });

  socket.on("group message", (nickName, msg) => {
    console.log(msg);
    socket.broadcast.emit("group message", nickName, msg);
  });

  socket.on("userIsTyping", (nickName) => {
    socket.broadcast.emit("userIsTyping", nickName);
  });

  socket.on("userIsNotTyping", () => {
    socket.broadcast.emit("userIsNotTyping");
  });

  socket.on("sendPrivateMsg", (senderID, recID, senderName, msg) => {
    socket.to(recID).emit("recPrivateMsg", senderID, senderName, msg);
  });

  socket.on("disconnect", () => {
    console.log(`${socket.nickName} has disconnected, his id is: ${socket.id}`);
    socket.broadcast.emit("user left", socket.nickName);
    delete connectedUsers[socket.id];
    io.emit("usersList", connectedUsers);
    console.log("Connected Users", connectedUsers);
  });
});

const grpNSP = io.of("/privgroup");
grpNSP.on("connection", (grpSocket) => {
  console.log(
    `A new user connected to the group namespace and his id is ${grpSocket.id}`
  );
  const socketId = grpSocket.id;
  grpSocket.on("send grp id", (grpID) => {
    grpSocket.join(grpID);
  });
  grpSocket.on("send user name and grp name", (userName, grpID, grpName) => {
    grpSocket.nickName = userName;
    console.log(
      `${grpSocket.nickName} has connected to Group ${grpName}, his ID is: ${socketId}`
    );
    if (!grpNSP.adapter.rooms.get(grpID).connectedUsers) {
      grpNSP.adapter.rooms.get(grpID).connectedUsers = {};
    }
    grpNSP.adapter.rooms.get(grpID).connectedUsers[socketId] = userName;
    console.log(`Connected users for ${grpName} Group 👇👇`);
    console.log(grpNSP.adapter.rooms.get(grpID).connectedUsers);
    grpNSP
      .to(grpID)
      .emit("users list", grpNSP.adapter.rooms.get(grpID).connectedUsers);
    grpSocket.on("disconnect", () => {
      grpSocket.to(grpID).emit("user left", grpSocket.nickName);
      if (grpNSP.adapter.rooms.get(grpID)) {
        delete grpNSP.adapter.rooms.get(grpID).connectedUsers[socketId];
        console.log(`Connected users for group ${grpName} 👇👇👇`);
        console.log(grpNSP.adapter.rooms.get(grpID).connectedUsers);
        grpNSP
          .to(grpID)
          .emit("users list", grpNSP.adapter.rooms.get(grpID).connectedUsers);
      } else {
        console.log(`Group ${grpName} is deleted`);
      }
    });
  });

  grpSocket.on("new user", (nickName, grpID) => {
    grpSocket.to(grpID).emit("new user", nickName);
  });

  grpSocket.on("group message", (nickName, msg, grpID) => {
    grpSocket.to(grpID).emit("group message", nickName, msg);
  });

  grpSocket.on("userIsTyping", (nickName, grpID) => {
    grpSocket.to(grpID).emit("userIsTyping", nickName);
  });

  grpSocket.on("userIsNotTyping", (grpID) => {
    grpSocket.to(grpID).emit("userIsNotTyping");
  });
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
