import ws from "ws";
const server = new ws.Server({ port : 3762 });

server.on('connection', socket => {
    socket.on('message', message => {
        console.log(message);
        socket.send(`${message}`);
    });
});
