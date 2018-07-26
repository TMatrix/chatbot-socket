const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let messages = [];
let usersOnline = [];
let notes = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get('/script.js', (req, res) => {
  res.sendFile(__dirname + '/public/script.js')
});

app.get('/reset.css', (req, res) => {
  res.sendFile(__dirname + '/public/reset.css')
});
app.get('/chat-body.css', (req, res) => {
  res.sendFile(__dirname + '/public/chat-body.css')
});
app.get('/style.css', (req, res) => {
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
    usersOnline[usersOnline.findIndex((elem) => {
      return elem.nick == socket.nick;
    })].status = "just left";
    io.emit('chat userList', usersOnline);
    socket.broadcast.emit('chat user disconnect', socket.nick);
  });

  socket.on('user typing', (nickName) => {
    socket.broadcast.emit('user typing', nickName);
  });

  socket.on('user stop typing', () => {
    socket.broadcast.emit('user stop typing');
  });

  socket.on('chat userList', (user) => {
    usersOnline[usersOnline.findIndex((elem) => {
      return elem.nick == user.nick;
    })].status = user.status;
    io.emit('chat userList', usersOnline);
  });

  socket.on('bot message', (text) => {
    text = checkText(text);
    if (text.text) {
      socket.emit('chat message', text);
    }
  });

  socket.emit('chat userList', usersOnline);
  socket.emit('chat history', messages);
});

http.listen(5000, () => {
  console.log('listening on *:5000');
});

function checkText(text) {
  let msg = {};
  Object.assign(msg, text);
  msg.name = "bot";
  msg.nick = "@bot";
  msg.date = Date.now();
  text = giveAnswer(msg.text);
  msg.text = text ? text : "";
  return msg;
}

function giveAnswer(text) {
  let textIn = "Armed and ready!";
  let weatherPattern = /What is the weather (.*?) in (\w+)\?$/;
  let exchangePattern = /Convert (\d+) (\w+) to (\w+)$/;
  let noteSavePattern = /Save note title: "(.*?)" body: "(.*?)"/;
  let noteListPattern = /Show note list/;
  let noteDelPattern = /Delete note "(.*?)"/;
  let noteShowPattern = /Show note "(.*?)"/;
  let advicePattern = /.*?\s[\#\@\)\₴\?\$0]/;
  let quotePattern = /show quote/;
  if (weatherPattern.test(text)) {
    let arr = text.match(weatherPattern);
    textIn = new Weather(arr[2], arr[1]).getForecast();
  }
  if (exchangePattern.test(text)) {
    let arr = text.match(exchangePattern);
    textIn = new Exchange(arr[1], arr[2], arr[3]).getValue();
  }

  if (noteSavePattern.test(text)) {
    textIn = new NoteService().set(text.match(noteSavePattern)[1].toString(), text.match(noteSavePattern)[2].toString());
  } else if (noteListPattern.test(text)) {
    textIn = new NoteService().getAll();
  } else if (noteDelPattern.test(text)) {
    textIn = new NoteService().remove(text.match(noteDelPattern)[1].toString());
  } else if (noteShowPattern.test(text)) {
    textIn = new NoteService().get(text.match(noteShowPattern)[1].toString());
  }

  if (advicePattern.test(text)) {
    textIn = new Advice().get();
  }

  if (quotePattern.test(text)) {
    textIn = new Quote().get();
  }

  return textIn;
}

class Weather {

  constructor(location, date) {
    this.location = location;
    this.date = date;
  }

  getForecast() {
    let temperature = Math.round(Math.random() * 30);
    let feeling;
    if (temperature < 5) {
      feeling = "cold";
    } else if (temperature > 28) {
      feeling = "hot";
    } else {
      feeling = "comfort";
    }
    this.forecast = `The weather is ${feeling} in ${this.location} ${this.date}, temperature ${temperature} C`;
    return this.forecast;
  }
}

class Exchange {
  constructor(amount, input, output) {
    this.amount = amount;
    this.input = input;
    this.output = output;
    this.eToD = 1.172;
    this.dToH = 26.7;
    this.eToH = 31.2924;
  }

  getValue() {
    let num = this.amount;
    if (this.input == "dollar" && this.output == "hryvnia") {
      num *= this.dToH;
      num = +num.toFixed(2);
      return `${this.amount} ${this.input} = ${num} ${this.output}`;
    }
    if (this.input == "hryvnia" && this.output == "dollar") {
      num /= this.dToH;
      num = +num.toFixed(2);
      return `${this.amount} ${this.input} = ${num} ${this.output}`;
    }
    if (this.input == "euro" && this.output == "hryvnia") {
      num *= this.eToH;
      num = +num.toFixed(2);
      return `${this.amount} ${this.input} = ${num} ${this.output}`;
    }
    if (this.input == "hryvnia" && this.output == "euro") {
      num /= this.eToH;
      num = +num.toFixed(2);
      return `${this.amount} ${this.input} = ${num} ${this.output}`;
    }
    if (this.input == "dollar" && this.output == "euro") {
      num /= this.eToD;
      num = +num.toFixed(2);
      return `${this.amount} ${this.input} = ${num} ${this.output}`;
    }
    if (this.input == "euro" && this.output == "dollar") {
      num *= this.eToD;
      num = +num.toFixed(2);
      return `${this.amount} ${this.input} = ${num} ${this.output}`;
    }
  }

}

class NoteService {

  set(title, body) {
    notes.push({
      title: title,
      body: body
    });
    return "Note was saved";
  }

  get(title) {
    let text = "";
    notes.forEach((elem) => {
      if (elem.title == title) {
        text = `title: ${elem.title} body: ${elem.body} \n`;
      }
    });
    return text + "Note was listed";
  }

  getAll() {
    let text = "";
    notes.forEach((elem) => {
      text += `title: ${elem.title} body: ${elem.body} \n`;
    });
    return text + "All notes were listed";
  }

  remove(title) {
    let delIndex = -1;
    notes.forEach((elem, i) => {
      if (elem.title == title) {
        delIndex = i;
      }
    });
    if (delIndex >= 0)
      notes.splice(delIndex, 1);
  }
}

class Advice {
  constructor() {
    this.advices = [
      "Keep moving forward, you'll make it",
      "Too often, we're too worried about what others think.",
      "There's no step too small",
      "Think about the future",
      "Be kind",
      "The power of habit can transform your life."
    ]
  }
  get() {
    return this.advices[Math.round(Math.random() * 6) - 1];
  }
}

class Quote {
  constructor() {
    this.quotes = [
      "\"There is nothing permanent except change.\" - Heraclitus",
      "\"Good judgment comes from experience, and a lot of that comes from bad judgment.\" - Will Rogers",
      "\"Honesty is the first chapter in the book of wisdom.\" - Thomas Jefferson",
      "\"The journey of a thousand miles begins with one step.\" - Lao Tzu",
      "\"The best preparation for tomorrow is doing your best today.\" - H. Jackson Brown, Jr.",
      "\"I have not failed. I've just found 10,000 ways that won't work.\" - Thomas A. Edison"
    ];
  }

  get() {
    return this.quotes[Math.round(Math.random() * 6) - 1];
  }
}