const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.get('/', (req, res) => {
  res.send('Eng/fahad Game TikTok Bridge is Running!');
});

io.on('connection', (socket) => {
  let tiktokConnection = null;

  const connectToTikTok = (username) => {
    if (!username) return;
    const cleanUser = username.replace('@', '').trim();

    if (tiktokConnection) {
      tiktokConnection.disconnect();
    }

    tiktokConnection = new WebcastPushConnection(cleanUser, {
      processInitialData: false
    });

    tiktokConnection.connect().then((state) => {
      socket.emit('tiktokConnected', { roomId: state.roomId, username: cleanUser });
    }).catch((err) => {
      socket.emit('tiktokDisconnected', err.toString());
    });

    tiktokConnection.on('chat', (data) => {
      socket.emit('chat', {
        uniqueId: data.uniqueId,
        nickname: data.nickname,
        profilePictureUrl: data.profilePictureUrl,
        comment: data.comment
      });
    });

    tiktokConnection.on('streamEnd', () => {
      socket.emit('tiktokDisconnected', 'انتهى البث');
    });
  };

  socket.on('setUniqueId', connectToTikTok);
  socket.on('connect_tiktok', connectToTikTok);

  socket.on('disconnect', () => {
    if (tiktokConnection) {
      tiktokConnection.disconnect();
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Bridge running on port ${PORT}`));
