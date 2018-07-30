(function () {
  let nameInput = document.getElementById("nameInput");
  let nickInput = document.getElementById("nickInput");
  let enterButton = document.getElementById("enterButton");
  let enterPage = document.getElementsByClassName("enter-page")[0];
  let peopleList = document.getElementById("peopleList");
  let messagesList = document.getElementById("messages");
  let text = document.getElementById("message-to-send");
  let textSubmit = document.getElementById("textSubmit");
  let userName = "";
  let nickName = "@nickname";
  nickInput.value = "";
  nameInput.value = "";

  let socket = io.connect();

  enterButton.onclick = () => {
    if (!nameInput.value && !nickInput.value)
      return;
    let el = document.getElementsByClassName("container")[0];
    userName = nameInput.value;
    nickName = "@" + (nickInput.value);
    el.style.display = "block";
    enterPage.style.display = "none";
    let user = {
      name: userName,
      nick: nickName,
      status: "just appeared"
    }
    socket.emit('chat user', user);

    let statusTimer = setTimeout(() => {
      clearTimeout(statusTimer);
      let usr = {
        nick: nickName,
        status: "online"
      };
      socket.emit('chat userList', usr);
    }, 60000);

  }


  socket.on('disconnect', function () {
    socket.emit('disconnect');
  });

  socket.on('chat user disconnect', (nickName) => {
    let li = document.createElement('li');
    li.innerHTML = `<span class="">${nickName} has disconnected the chat <i class="fas fa-plane-departure"></i></span>`;
    messagesList.appendChild(li);

    let statusTimer = setTimeout(() => {
      clearTimeout(statusTimer);
      let user = {
        nick: nickName,
        status: "offline"
      };
      socket.emit('chat userList', user);
    }, 60000);
  });

  text.addEventListener('keydown', function (event) {
    if (event.keyCode == 13) {
      event.preventDefault();
      if (text.value.trim()) {
        let data = {
          name: userName,
          nick: nickName,
          date: Date.now(),
          text: text.value
        };

        text.value = '';

        socket.emit('chat message', data);
      }
    }
  });

  textSubmit.onclick = () => {
    if (text.value.trim()) {
      let data = {
        name: userName,
        nick: nickName,
        date: Date.now(),
        text: text.value
      };

      text.value = '';

      socket.emit('chat message', data);
    }
  }

  text.oninput = () => {
    socket.emit('user typing', nickName);

    let typingTimer = setTimeout(() => {
      clearTimeout(typingTimer);
      socket.emit('user stop typing');
    }, 2000);
  };

  socket.on('user typing', (nickName) => {
    addTypingMsg(nickName);
  });

  socket.on('user stop typing', () => {
    removeTypingMsg();
  });

  socket.on('chat history', (msg) => {

    messagesList.innerHTML = "";

    for (let item in msg) {
      let el = createMessage(msg[item]);
      if (msg[item].text.includes(nickName)) {
        el.lastElementChild.setAttribute("class", 'message private-message');
      }

      messagesList.appendChild(el);
    }
  });

  socket.on('chat userList', (users) => {
    peopleList.innerHTML = "";
    for (let item in users) {
      let el = createPeople(users[item]);
      el.appendChild(addLable(users[item].status));
      peopleList.appendChild(el);
    }
  });

  socket.on('chat message', (msg) => {
    let el = createMessage(msg);
    if (msg.text && msg.text.includes(nickName)) {
      el.lastElementChild.setAttribute("class", 'message private-message');
    }
    if (msg.text && msg.text.includes("@bot")) {
      socket.emit('bot message', msg);
    }
    messagesList.appendChild(el);
  });

  socket.on('chat user', (usr) => {
    let el = createPeople(usr);
    el.appendChild(addLable(usr.status));
    peopleList.appendChild(el);
  });

  let createMessage = (item) => {
    let li = document.createElement("li");
    let divUser = document.createElement("div");
    let divText = document.createElement("div");
    let spanName = document.createElement("span");
    let spanDate = document.createElement("span");

    spanName.innerText = item.name + " (" + item.nick + ")";
    spanName.setAttribute("class", "message-data-name");
    spanDate.innerText = new Date(item.date).toLocaleString();
    spanDate.setAttribute("class", "message-data-time");

    divUser.appendChild(spanName);
    divUser.appendChild(spanDate);
    divUser.setAttribute("class", "message-data ");

    divText.innerText = item.text;
    divText.setAttribute("class", "message other-message");

    li.appendChild(divUser);
    li.appendChild(divText);
    li.setAttribute("class", "clearfix");

    return li;
  };

  let createPeople = (user) => {
    let li = document.createElement("li");
    let divAbout = document.createElement("div");
    let divName = document.createElement("div");

    divName.innerText = user.name + " | " + user.nick;
    divName.setAttribute("class", "name");

    divAbout.appendChild(divName);
    divAbout.setAttribute("class", "about");

    li.appendChild(divAbout);
    li.setAttribute("class", "clearfix");

    return li;
  };

  let p = document.createElement("p");
  p.setAttribute("id", "typing");
  document.getElementsByClassName("chat-message")[0].insertBefore(p, document.getElementById("message-to-send"));

  let addTypingMsg = (nickName) => {
    p.innerHTML = ``;
    p.innerHTML = `<span>${nickName} is typing...</span>`;
  };

  let removeTypingMsg = () => {
    p.innerHTML = ``;
  };

  let addLable = (status) => {
    let statusEl = document.createElement("div");
    let i = document.createElement("i");
    statusEl.classList.add("status");
    let statusClass = '';
    switch (status) {
      case 'online':
        statusClass = 'online';
        break;
      case 'just appeared':
        statusClass = 'just-apper';
        break;
      case 'just left':
        statusClass = 'just-left';
        break;
      case 'offline':
        statusClass = 'offline';
        break;
    }
    i.setAttribute("class", 'fa fa-circle');
    i.classList.add(statusClass);
    statusEl.appendChild(i);
    statusEl.innerHTML += status;
    return statusEl;
  };
})();