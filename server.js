let app = require("express")();
let server = require("http").createServer(app);
let io = require("socket.io")(server);
let port = process.env.PORT || 3000;

let timer = 0;
let race = 0;
let races = [];
let players = new Map();
let players_count = 0;

const timer_evt = () => {
  timer++;
  if (timer > 359) { 
    timer = 0;
    race = 0;
    load_races(1);
    return;
  }
  if (timer > 239) { 
    race = 2;
    load_races(0);
    return;
  }
  if (timer > 119) { 
    race = 1;
    load_races(2);
    return;
  }
};
setInterval(timer_evt, 1000);

const rndLanes = () => {
  return Math.floor(Math.random() * 5);
};

const load_races = (e) => {
  races = [];
  for (let i = 0; i < 1000; i++) {
    races.push([e, rndLanes()]);
  }
};
load_races(0);
load_races(1);
load_races(2);

const races_queue = (e) => {
  let _tmp = [];
  for (let i = 0; i < races.length; i++) {
    let _v = races[i].toString();
    _tmp.push(_v.split(",")[1]);
  }
  return _tmp;
};

const player_evt = () => {
  for (let _keys of players.keys()) {
    let _player = players.get(_keys);
    if (_player.race == race) {
      if (timer % 10 == 0) {
        let plist = [];
        for (let value of players.values()) {
          if (value.race == _player.race) {
            plist.push(value);
          }
        }
        io.to(_player.id).emit("player_list", plist);
      }
    } else {
      if (!_player.started) {
        _player.started = true;
        io.to(_player.id).emit("start", races_queue(_player.race));
      }
    }
  }
};
setInterval(player_evt, 1000);

app.get("/*", (req, res) => {
  let fileName = req.params[0];
  if (fileName == undefined || fileName == "") fileName = "index.html";
  res.sendFile(__dirname + "/" + fileName);
});

io.on("connection", (sck) => {
  players_count++;
  io.emit("count", players_count);
  console.log(sck.id);
    
  sck.on("player", (msg) => {
    players_add(msg, sck.id);

    io.to(sck.id).emit("lobby", 
      "<div id=\"mp00\">" +
      "<div>Next Race<br/><div id=\"dSec\">" + (((race + 1) * 120) - timer)  + "</div> secs</div>" +
      "<div id=\"dPX\"></div>" +
      "<div><input id=\"bBack\" type=\"button\" value=\"  <=  Back   \" onclick=\"exit_MP();\"></div>" +
      "</div>"
    );
  });

  const player_exit = () => {
    if (players_count >= 2) players_count--;
    players_del(sck.id);
  };
  sck.on("disconnect", () => {
    player_exit();
  });
  sck.on("player_exit", (msg) => {
    player_exit();
  });
});

server.listen(port, () => {});

const players_add = (p, i) => {
  players_del(i);
  p.id = i;
  p.race = race;
  p.lives = 3;
  p.started = false;
  players.set(i, p);
  return p;
};

const players_del = (i) => {
  if (players.has(i)) players.delete(i);
};