const socket = io();
const usersTalkingPrivately = {};

const messaging = (msgsArea, name, msg) => {
  const item = document.createElement("li");
  item.textContent = `${name}: ${msg}`;
  msgsArea.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
};

const displayConnectionStatus = (nickName) => {
  const connectionStatus = document.getElementById("connectionStatus");
  connectionStatus.innerText = `Hello ${nickName} you connected Successfully ✅`;
};

socket.on("connect", () => {
  socket.nickName = prompt("Enter Your Name");
  displayConnectionStatus(socket.nickName);
  socket.emit("new user", socket.nickName);
  console.log(`A user connected with id ${socket.id}`);
  const messages = document.getElementById("messages");
  const form = document.getElementById("grpMsgForm");
  const input = document.getElementById("grpMsgInput");

  form.onsubmit = (e) => {
    e.preventDefault();
    if (input.value) {
      const msg = input.value;
      messaging(messages, "ME", msg);
      socket.emit("group message", socket.nickName, msg);
    }
    input.value = "";
  };

  input.oninput = () => {
    socket.emit("userIsTyping", socket.nickName);
  };

  input.onchange = () => {
    socket.emit("userIsNotTyping");
  };

  socket.on("new user", (nickName) => {
    alert(`${nickName} Has joined the Chat`);
  });
  socket.on("group message", (nickName, msg) => {
    messaging(messages, nickName, msg);
  });

  socket.on("usersList", (users) => {
    const connectedUsers = document.getElementById("connectedUsers");
    connectedUsers.innerHTML = "";
    for (const id in users) {
      const nickName = users[id];
      const user = document.createElement("li");
      user.innerText = nickName;
      connectedUsers.appendChild(user);
      const sendMsgBtn = document.createElement("button");
      sendMsgBtn.innerText = `Send Private message to ${nickName}`;
      const cantSendMsg = document.createElement("span");
      cantSendMsg.innerText = `Can't Send a message to yourself`;
      if (id !== socket.id) {
        connectedUsers.appendChild(sendMsgBtn);
      } else {
        connectedUsers.appendChild(cantSendMsg);
      }
      const privateMsgs = document.getElementById("privateMsgs");
      sendMsgBtn.onclick = () => {
        if (!usersTalkingPrivately[id]) {
          usersTalkingPrivately[id] = nickName;
          const privMsgArea = document.createElement("ul");
          privMsgArea.id = id;
          privMsgArea.classList.add("privMsg");
          const privHeading = document.createElement("h1");
          const input = document.createElement("input");
          const sendBtn = document.createElement("button");
          sendBtn.type = "submit";
          sendBtn.innerText = "Send";
          privHeading.innerText = `Private messages between you and ${nickName}`;
          privMsgArea.appendChild(privHeading);
          privMsgArea.appendChild(input);
          privMsgArea.appendChild(sendBtn);
          privateMsgs.appendChild(privMsgArea);
          sendBtn.onclick = (e) => {
            e.preventDefault();
            const msg = input.value;
            socket.emit("sendPrivateMsg", socket.id, id, socket.nickName, msg);
            const msgArea = document.getElementById(id);
            messaging(msgArea, "Me: ", msg);
            input.value = "";
          };
        } else {
          alert(`You are already talking with ${nickName}`);
        }
      };
    }
  });

  socket.on("recPrivateMsg", (senderID, senderName, msg) => {
    if (!usersTalkingPrivately[senderID]) {
      usersTalkingPrivately[senderID] = senderName;
      const privMsgArea = document.createElement("ul");
      privMsgArea.id = senderID;
      privMsgArea.classList.add("privMsg");
      const privHeading = document.createElement("h1");
      const input = document.createElement("input");
      const sendBtn = document.createElement("button");
      sendBtn.type = "submit";
      sendBtn.innerText = "send";
      privHeading.innerText = `Private messages between you and ${senderName}`;
      privMsgArea.appendChild(privHeading);
      privMsgArea.appendChild(input);
      privMsgArea.appendChild(sendBtn);
      privateMsgs.appendChild(privMsgArea);
      messaging(privMsgArea, senderName, msg);
      sendBtn.onclick = (e) => {
        e.preventDefault();
        const msg = input.value;
        const msgArea = document.getElementById(senderID);
        messaging(msgArea, "Me: ", msg);
        socket.emit(
          "sendPrivateMsg",
          socket.id,
          senderID,
          socket.nickName,
          msg
        );
        input.value = "";
      };
    } else {
      const msgArea = document.getElementById(senderID);
      messaging(msgArea, senderName, msg);
    }
  });

  socket.on("userIsTyping", (nickName) => {
    const typing = document.getElementById("typing");
    typing.innerText = `${nickName} is typing`;
  });

  socket.on("userIsNotTyping", () => {
    const typing = document.getElementById("typing");
    typing.innerText = "";
  });

  socket.on("user left", (userNickName) => {
    alert(`${userNickName} Has left the chat`);
  });
});

const createGrpBtn = document.getElementById("createGrp");
createGrpBtn.onclick = () => {
  const grpName = prompt("What is the group name?");
  const url = `/privGroup/${grpName}`;
  window.open(url, "_blank");
};
