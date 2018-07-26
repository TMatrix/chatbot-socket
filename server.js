const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let messages = [];
let usersOnline = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get('/script.js', (req,  res) => {
  res.sendFile(__dirname + '/public/script.js')
});

app.get('/reset.css', (req,  res) => {
  res.sendFile(__dirname + '/public/reset.css')
});
app.get('/chat-body.css', (req,  res) => {
  res.sendFile(__dirname + '/public/chat-body.css')
});
app.get('/style.css', (req,  res) => {
  res.sendFile(__dirname + '/public/style.css')
});

io.on("connection", (socket) => {
  socket.on('chat message', (msg) => {
    messages.push(msg);
    if (messages.length > 100) {
      messages.shift();
    }
    io.emit('chat message', msg);
  });

  socket.on('chat user', (user) => {
    usersOnline.push(user);
    socket.nick = user.nick;
    socket.name = user.name;
    socket.status = user.status;
    io.emit('chat user', user);
  });

  socket.on('disconnect', () => {
    // usersOnline.splice(usersOnline.findIndex((elem)=>{
    // return elem.nick == socket.nick;
    // }),1);
    usersOnline[usersOnline.findIndex((elem)=>{
      return elem.nick == socket.nick;
      })].status = "just left";
    io.emit('chat userList', usersOnline);
    socket.broadcast.emit('chat user disconnect', socket.nick);
  });

  socket.on('user typing', (nickName)=> {
    socket.broadcast.emit('user typing', nickName);
  });

  socket.on('user stop typing', ()=> {
    socket.broadcast.emit('user stop typing');
  });

  socket.on('chat userList', (user)=> {
    usersOnline[usersOnline.findIndex((elem)=>{
      return elem.nick == user.nick;
      })].status = user.status;
    io.emit('chat userList', usersOnline);
  });

  socket.on('bot message', (text)=>{
    console.log(text);
    socket.emit('chat message', checkText(text));
  });

  socket.emit('chat userList', usersOnline);
  socket.emit('chat history', messages);
});

function checkText(text){
  let msg = {};
  Object.assign(msg, text);
  //Add text parser and return answer
  return msg;
}

http.listen(5000, () => {
  console.log('listening on *:5000');
});