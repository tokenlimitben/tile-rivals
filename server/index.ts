import { createServer } from 'node:http';
import { Server } from 'socket.io';

const PORT = Number(process.env.PORT ?? 3001);

const http = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// Rooms, matches and move validation arrive in milestone M4.
const io = new Server(http);

io.on('connection', (socket) => {
  socket.emit('hello', { message: 'connected' });
});

http.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
