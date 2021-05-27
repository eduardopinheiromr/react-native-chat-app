const io = require("socket.io")();
const { v1: uuidv1 } = require("uuid");
const messageHandler = require("./handlers/message.handler");

const users = {};

function createUserAvatarUrl() {
  const randomNumber = Math.round(Math.random() * 200 + 100);
  const randomNumber2 = Math.round(Math.random() * 200 + 100);

  return `https://placeimg.com/${randomNumber}/${randomNumber2}/any`;
}

function createUsersOnline() {
  const values = Object.values(users);
  return values.filter(user => user.username !== undefined);
}

io.on("connection", socket => {
  users[socket.id] = { userId: uuidv1() };

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("action", { type: "users_online", data: createUsersOnline() });
  });

  socket.on("action", action => {
    switch (action.type) {
      case "server/join":
        users[socket.id].username = action.data;
        users[socket.id].avatar = createUserAvatarUrl();

        io.emit("action", { type: "users_online", data: createUsersOnline() });
        socket.emit("action", { type: "self_user", data: users[socket.id] });
        break;

      case "server/private-message":
        const conversationId = action.data.conversationId;
        const from = users[socket.id].userId;
        const userValues = Object.values(users);
        const socketIds = Object.keys(users);

        for (let i = 0; i < userValues.length; i++) {
          if (userValues[i].userId === conversationId) {
            const socketId = socketIds[i];
            io.to(socketId).emit("action", {
              type: "private_message",
              data: {
                ...action.data,
                conversationId: from,
              },
            });
            break;
          }
        }
        break;
    }
  });
});

io.listen(3001);
