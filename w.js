"use strict";{
let devmode = true;
let isboot = true;

let cnv, ctx;
let cnvW, cnvH;
let textures = [];

let gamestate = 0;
let p1 = {
  pName: "",
  pColor: "",
  pStamp: "",
  pLives: 3,
  pLane: 0,
  pJump: false,
  pJumpState: 0,
  pJumpTime: 0,
};
let pstamps = ["🤠", "🥳", "😎", "👹", "👺", "👻", "👽", "👾", "🤖", "😺", "🐶", "🙉"];
let win_msg = "🏆 Winner!!! 🏆";

class FXFPS {
  constructor() {
    let maxFPS = 60;
    this.rate = 0;
    this.nowSecond = performance.now();
    this.lastSecond = performance.now();
    this.frames = 0;
  }
  async tick( tFrame ) {
    this.rate = tFrame - this.lastSecond;
    this.nowSecond = this.rate / 1000;
    this.lastSecond = tFrame;
    this.frames = Math.round(1 / this.nowSecond).toFixed(2);
    this.rate = this.rate.toFixed(2);
  }
}
const fxFPS = new FXFPS;

const fxstats = async () => {
  ctx.font = "16px Verdana";
  ctx.fillStyle = "rgba(0, 0, 0, .5)";
  ctx.fillRect(0, 0, 150, 70);
  ctx.fillStyle = "rgb(0, 255, 0)";
  ctx.fillText("AnimationFrame", 10, 20);
  ctx.fillText(fxFPS.frames + " : FPS", 20, 40);
  ctx.fillText(fxFPS.rate + " : Rate", 20, 60);
  ctx.fillText("Scene Speed : " + timestep, 20, 90);
  ctx.fillText("Queue Step : " + eQueueStep, 20, 110);
  ctx.fillText("Enemies Step : " + enemiesStep.toFixed(2), 20, 130);
  ctx.fillText("Obstacles : " + enemies.length, 20, 150);
  ctx.fillText("Controls :", 20, 180);

  controlPrint();
};

const playerHit = () => {
  let _mens = "Suffer a hit: +5 sec";
  postMessage({type: "hit"});
  _secondscount -= 5;
  aQueue.push({mens: _mens, length: _mens.length, time: _secondscount + 3, color: "red" });
  p1.pLives--;
  if (p1.pLives == 0) {
    gamestate = 1;
    enemies = [];
    aQueue = [];
    mp_queue = [];
    setTimeout(() => {postMessage({type: "gameover"})}, 2000);
  }
};

// Scales Metrics: HeightArea, TopWidth, BottomWidth, TopLane(Width), BottomLane(Width), Top, Bottom, Area, HeightProportion
let scaleHA, scaleTW, scaleBW,
    scaleTL, scaleBL, scaleT,
    scaleB, scaleA, scaleHP;
let enemiesStep;
let enemies = [{
  pos: 0,
  lane: 0,
}];
const drawEnemy = (e) => {
  let o = enemies[e];
  let lane = o.lane + 1;
  let scaleP = scaleT + (scaleA * (o.pos / scaleHA));
  let scalePP = 128 * scaleP;
  let scaleH = 1 - (o.pos / scaleHP);

  let calcH = cnvH * .12 + o.pos;
  let calcW = 0;
  switch (lane) {
    case 1:
      calcW = (cnvW * .45 - scaleTL / 2) * scaleH;
      break;
    case 2:
      calcW = (cnvW * .45) - scalePP + scaleTL * 2;
      break;
    case 3:
      calcW = (cnvW * .45) + scaleTL * 2;
      break;
    case 4:
      calcW = (cnvW * .45) + scaleTL * 1.2 + (scalePP * 1.4);
      break;
  }

  ctx.save();
  ctx.shadowBlur = 0;
  ctx.translate(calcW, calcH);
  ctx.transform(scaleP, 0, 0, scaleP, 0, 0);
  ctx.drawImage(textures[0], 0, 0);
  ctx.restore();

  o.pos += enemiesStep;
  if ((o.pos > scaleHA - (scalePP * 1.4)) && (o.lane == p1.pLane) && (!bJump)) {
    removeEnemy(e);
    playerHit();
  } else {
    if (o.pos > scaleHA - scalePP) {
      removeEnemy(e);
    }
  }
};

const removeEnemy = (e) => {
  let _tmp = [];
  for (let idx = 0; idx < enemies.length; idx++) {
    if (idx == e) continue;
    _tmp.push(enemies[idx]);
  }
  enemies = _tmp;
  let _mens =  "Obstacle avoided: -1 sec";
  _secondscount++;
  aQueue.push({mens: _mens, length: _mens.length, time: _secondscount + 3, color: "green" });
};

let controlQueue = [];
const control = async (e) => {
  if (e.status) {
    switch (e.input) {
      case "P1U":
      case "P1B1":
        if (!bJump) {
          if (!p1.pJump && p1.pJumpState == 0) {
            p1.pJump = true;
          }
        }
        break;
      case "P1L":
        if (!bJump) {
          if (p1.pLane > 0) p1.pLane--;
        }
        break;
      case "P1R":
        if (!bJump) {
          if (p1.pLane < 3) p1.pLane++;
        }
        break;
      default:
    }
  }
  controlQueue.push(e.input + "_" + e.status);
  if (controlQueue.length > 6) {
    controlQueue.shift();
  }
};
const controlPrint = async () => {
  for (let cQ in controlQueue) {
    ctx.fillText(controlQueue[cQ], 20, 200 + (20 * cQ));
  }
};

let bJump = false;
let _jumpheight = 0;
let _jumpstep = 0;
const drawPlayer = () => {
  let _cnvH = cnvH;
  let calcW, calcH;
  
  if (!bJump && p1.pJump) {
    bJump = true;
    _jumpheight = cnvH * .5;
    postMessage({type: "jump"});
  }
  if (bJump) {
    if (p1.pJump) {
      _jumpstep = _jumpstep + 8;
      cnvH = cnvH - _jumpstep;
      if (_jumpstep > _jumpheight) { p1.pJump = false; }
    } else { 
      _jumpstep = _jumpstep - 8 ;
      cnvH = cnvH - _jumpstep;
      if (_jumpstep == 0) { bJump = false; }
    }
  }

  calcW = (cnvW * .23) + ((cnvW * .19) * p1.pLane);
  calcH = cnvH * .7;

  ctx.save();
  ctx.beginPath();
  ctx.shadowColor = "rbga(0, 0, 0, .5)";
  ctx.shadowBlur = 20;
  ctx.strokeStyle ="rgba(0, 0, 0, .5)";
  ctx.ellipse(calcW, (_cnvH * .7) * 1.16, cnvH * .08, cnvH * .02, 2 * Math.PI, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = "rgba(0, 0, 0, .5)";
  ctx.fill();
  ctx.transform(.8, .8, .8, .8, 0, 0);
  ctx.closePath();
  ctx.restore();
  
  ctx.save();
  ctx.beginPath();
  ctx.shadowColor = p1.pColor;
  ctx.shadowBlur = 20;
  ctx.lineWidth = 20;
  ctx.strokeStyle = p1.pColor + "C0";
  ctx.arc(calcW, calcH, cnvH * .1, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = p1.pColor + "30";
  ctx.fill();
  ctx.closePath();
  ctx.restore();
  
  ctx.save();
  ctx.scale(3, 3);
  ctx.fillText(pstamps[p1.pStamp], -10 + calcW / 3, 6 + calcH / 3);
  ctx.restore();

  cnvH = _cnvH;
};

let cP_lW,cP_lJ,cP_fS,cP_sS,cP_sC,cP_sB;
const cP = (e) => {
  if (e.sv == true) {
    if (e.lW) cP_lW = e.lW;
    if (e.lJ) cP_lJ = e.lJ;
    if (e.fS) cP_fS = e.fS;
    if (e.sS) cP_sS = e.sS;
    if (e.sC) cP_sC = e.sC;
    if (e.sB) cP_sB = e.sB;
  }
  ctx.save();
  ctx.beginPath();
  (e.lW) ? ctx.lineWidth = e.lW : ctx.lineWidth = cP_lW;
  (e.lJ) ? ctx.lineJoin = e.lJ : ctx.lineJoin = cP_lJ;
  (e.fS) ? ctx.fillStyle = e.fS : ctx.fillStyle = cP_fS;
  (e.sS) ? ctx.strokeStyle = e.sS : ctx.strokeStyle = cP_sS;
  (e.sC) ? ctx.shadowColor = e.sC : ctx.shadowColor = cP_sC;
  (e.sB) ? ctx.shadowBlur = e.sB : ctx.shadowBlur = cP_sB;
  ctx.moveTo(e.lN[0][0], e.lN[0][1]);
  for (let lN in e.lN) {
    if (lN == 0) continue;
    ctx.lineTo(e.lN[lN][0], e.lN[lN][1]);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.restore();
};

var grd = [], tMetJ, tMet;
const sceneloader = (bflip) =>  {
  ctx.clearRect(0, 0, cnvW, cnvH);

  ctx.save();
  ctx.fillStyle = grd[0];
  ctx.fillRect(0, 0, cnvW, cnvH);
  ctx.restore();

  ctx.save();
  cP({lW: "5", lJ: "round", sS: "black", fS: grd[1], sC: "rgb(155,65,0)", sB: 20, sv: true, lN: [
    [cnvW * .45, cnvH * .15],
    [cnvW * .55, cnvH * .15],
    [cnvW, cnvH],
    [0, cnvH],
    [cnvW * .45, cnvH * .15]     
  ]});

  cP({fS: ((bflip) ? grd[2]: grd[3]), sC: "rgb(100,0,0)", sB: 10, sv: true, lN: [
    [cnvW * .448, cnvH * .15],
    [cnvW * .45, cnvH * .15],
    [0, cnvH],
    [cnvW * -.1, cnvH]     
  ]});

  cP({lN: [
    [cnvW * .55, cnvH * .15],
    [cnvW * .552, cnvH * .15],
    [cnvW * 1.1, cnvH],
    [cnvW, cnvH]     
  ]});

  cP({fS: grd[4], sS: "white", sC: "black", sB: 5, sv: true, lN: [
    [cnvW * .474, cnvH * .152],
    [cnvW * .476, cnvH * .152],
    [cnvW * .251, cnvH],
    [cnvW * .245, cnvH]     
  ]});

  cP({
    lN: [
      [cnvW * .499, cnvH * .152],
      [cnvW * .501, cnvH * .152],
      [cnvW * .513, cnvH],
      [cnvW * .508, cnvH]     
    ]
  });

  cP({
    lN: [
      [cnvW * .524, cnvH * .152],
      [cnvW * .526, cnvH * .152],
      [cnvW * .756, cnvH],
      [cnvW * .751, cnvH]     
    ]
  });
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.85)";
  ctx.lineWidth = "5";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(0,0,0,0)";
  ctx.shadowColor = "rgb(0,0,0,.95)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cnvW * .5, cnvH * .14, cnvW * .06, 0, 1 * Math.PI, true);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cnvW * .44, cnvH * .14);
  ctx.lineTo(cnvW * .56, cnvH * .14);
  ctx.lineTo(cnvW * .56, cnvH * .16);
  ctx.lineTo(cnvW * .44, cnvH * .16);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.lineJoin = "round";
  ctx.restore();
};

let timestep = 400;
let flip = false;
let fliptime = 0;
let scenes = [4];
const checkflip = (tFrame) => {
  if (fliptime < tFrame) {
    fliptime = tFrame + timestep;
    flip = !flip;
  }
};

const scene = (tFrame) => {
  if (gamestate == 5) {
    checkflip(tFrame);
    if (flip) {
      ctx.putImageData(scenes[0], 0, 0);
    } else {
      ctx.putImageData(scenes[1], 0, 0);
    }
  } else {
    if (flip) {
      ctx.putImageData(scenes[2], 0, 0);
    } else {
      ctx.putImageData(scenes[3], 0, 0);
    }
    ctx.save();
    ctx.fillStyle = "white";
    ctx.font = "5em Impact";
    ctx.strokeStyle = "red";
    ctx.shadowColor = "rgba(194, 0, 0, 1)";
    ctx.shadowBlur = 20;
    ctx.strokeStyle = "red";
    ctx.font = "5em Impact";
    if (gamestate != 6) {
      ctx.strokeText("Game Over", (cnvW / 2) - (tMet.width * .4 * 8), cnvH / 2);
      ctx.fillText("Game Over", (cnvW / 2) - (tMet.width * .4 * 8) , cnvH / 2);
    } else {
      ctx.strokeText(win_msg, (cnvW / 2) - (tMet.width * .4 * 8), cnvH / 2);
      ctx.fillText(win_msg, (cnvW / 2) - (tMet.width * .4 * 8) , cnvH / 2);
      ctx.strokeText("Thank you for playing!", (cnvW / 2) - (tMet.width * .4 * 12), (cnvH / 2) + 70);
      ctx.fillText("Thank you for playing!", (cnvW / 2) - (tMet.width * .4 * 12) , (cnvH / 2) + 70);
    }
    ctx.restore();
  }
};

const HUDloader = () => {
  cP({lW: "5", lJ: "round", sS: "rgba(0,0,255,0)", fS: "rgba(0,0,0,1)", sC: "rgba(0,0,255,.8)", sB: 10, sv: true, lN: [
    [0, cnvH],
    [cnvW, cnvH],
    [cnvW * .92, cnvH * .85],
    [cnvW * .08, cnvH * .85]
  ]});

  cP({lW: "5", lJ: "bevel", sS: "rgba(255,255,255,1)", fS: "rgba(0,0,80,.3)", lN: [
    [cnvW * .01, cnvH * .995],
    [cnvW * .99, cnvH * .995],
    [cnvW * .915, cnvH * .855],
    [cnvW * .085, cnvH * .855]
  ]});

  cP({lW: "10", lJ: "round", sS: "rgba(255,214,60,1)", fS: "rgba(250,227,1,1)", sB: 5, sv: true, lN: [
    [cnvW * .28, cnvH * .98],
    [cnvW * .18, cnvH * .92],
    [cnvW * .28, cnvH * .87],
    [cnvW * .28, cnvH * .98]
  ]});

  cP({lN: [
    [cnvW * .72, cnvH * .98],
    [cnvW * .82, cnvH * .92],
    [cnvW * .72, cnvH * .87],
    [cnvW * .72, cnvH * .98]
  ]});

  cP({lN: [
    [cnvW * .32, cnvH * .98],
    [cnvW * .68, cnvH * .98],
    [cnvW * .68, cnvH * .87],
    [cnvW * .32, cnvH * .87]
  ]});
  
  ctx.save();
  ctx.fillStyle = "white";
  ctx.font = "5em Impact";
  ctx.shadowColor = "rgba(194, 176, 0, 1)";
  ctx.shadowBlur = 20;
  ctx.strokeStyle = "grey";
  ctx.fillText("JUMP", (cnvW - tMetJ.width) * .5 , (cnvH * .93) + tMetJ.height );
  ctx.strokeText("JUMP", (cnvW - tMetJ.width) * .5, (cnvH * .93) + tMetJ.height );
  ctx.restore();
};

let gametime = 0;
let _gamestart = 0;
let _gamestep = 0;
let _secondscount = 0;
let _lastsecond = 0;
let aQueue = [];
const HUD = (tFrame) => {
  let lives = ["❤️", "🖤"];
  ctx.save();
  ctx.font = "5em Impact";
  for (let i = 0; i < 3; i++) {
    if (i <= p1.pLives - 1) {
      ctx.fillText(lives[0], 10 + 74 * i , 64 );
    } else {
      ctx.fillText(lives[1], 10 + 74 * i , 64 );
    }
  }
  ctx.restore();
  
  let _time = new Date();
  let _seconds = _time.getSeconds();
  let _curtime = _time.getTime() - _gamestart;
  if (_lastsecond != _seconds) {
    _secondscount++;
    _lastsecond = _seconds;
  }
  if (_gamestep < _curtime) {
    let _mens = "Speed Up!  ";
    aQueue.push({mens: _mens, length: _mens.length, time: _secondscount + 3, color: "blue" });
    if (eQueueStep > 600) eQueueStep = eQueueStep - 120;
    if (timestep > 120) {
      timestep = timestep - 20;
      enemiesStep = scaleHA / (timestep * 2);
    }
    _gamestep = _curtime + 10000;
  }
  gametime = 404 - _secondscount;

  if (gametime <= 0) {
    gamestate = 6;
    enemies = [];
    aQueue = [];
    mp_queue = [];
    setTimeout(() => {postMessage({type: "gameover"})}, 2000);
    return;
  }

  ctx.save();
  ctx.fillStyle = "white";
  ctx.font = "5em Impact";
  ctx.shadowColor = "rgba(194, 0, 0, 1)";
  ctx.shadowBlur = 20;
  ctx.strokeStyle = "red";
  ctx.strokeText("Seconds", cnvW - 6 * tMet.width, 64);
  ctx.fillText("Seconds", cnvW - 6 * tMet.width, 64);
  ctx.strokeText(gametime, cnvW - 4 * tMet.width, 80 + tMet.width);
  ctx.fillText(gametime, cnvW - 4 * tMet.width, 80 + tMet.width);
  ctx.restore();
  
  if (aQueue.length > 0) {
    ctx.save();
    for (let idx = 0; idx < aQueue.length; idx++) {
      ctx.fillStyle = "black";
      ctx.shadowColor = "white";
      ctx.shadowBlur = 5;
      ctx.font = "2em Impact";
      ctx.strokeStyle = aQueue[idx].color;
      ctx.strokeText(aQueue[idx].mens, cnvW - (aQueue[idx].length * (tMet.width / 4)), 160 + (tMet.width * idx));
      ctx.fillText(aQueue[idx].mens, cnvW - (aQueue[idx].length * (tMet.width / 4)), 160 + (tMet.width * idx));
    }
    if (aQueue[0].time < _secondscount) aQueue.shift();
    ctx.restore();
  }
};

let eQueueTime = 0, eQueueStep = 2000, eQueueBlock = true, mp_queue = [];
let counter = 0;
const fxgame = async (tFrame) => {
  scene(tFrame);
  if (gamestate == 5) {
    HUD(tFrame);

    let _tmpidx = enemies.length - 1;
    for (let idx = _tmpidx; idx >= 0; idx--) {
      drawEnemy(idx);
      if (_tmpidx != enemies.length - 1) break;
    }

    drawPlayer();

    if (devmode) { 
      fxFPS.tick(tFrame);
      fxstats();
    }

    let _tmptime = performance.now();
    if (eQueueTime == 0) eQueueTime = _tmptime + eQueueStep;
    if (eQueueTime < _tmptime) {
      let _lane = Math.floor(Math.random() * 5);
      if (mp_queue.length > 0) {
        _lane = Number(mp_queue[0]);
        mp_queue.shift();
      }
      if (eQueueBlock) { _lane = Math.floor(Math.random() * 4); }
      if (_lane < 4) {
        enemies.push({pos: 0, lane: _lane});
        eQueueBlock = false;
      } else {
        enemies.push({pos: 0, lane: 0});
        enemies.push({pos: 0, lane: 1});
        enemies.push({pos: 0, lane: 2});
        enemies.push({pos: 0, lane: 3});
        eQueueBlock = true;
      }
      eQueueTime = _tmptime + eQueueStep;
    }
    requestAnimationFrame(fxgame);
  }
};

const game = async (e) => { 
  p1.pName = e.player.pName;
  p1.pColor = e.player.pColor;
  p1.pStamp = e.player.pStamp;
  p1.pLives = 3;
  p1.pJump = false;

  timestep = 400;
  enemiesStep = scaleHA / (timestep * 2);
  eQueueStep = 2000;
  eQueueTime = 0;

  _gamestart = new Date().getTime();
  _gamestep = 10000;
  _lastsecond = new Date().getSeconds();
  _secondscount = 0;
  
  enemies.length = 0;
  enemies.push({pos: 0, lane: 0});
  enemies.push({pos: 0, lane: 1});
  enemies.push({pos: 0, lane: 2});
  enemies.push({pos: 0, lane: 3});
  eQueueBlock = true;
  
  fxgame(); 
};

const updateGradient = async (e) => {
  switch (e) {
    case 0:
      grd[0] = ctx.createLinearGradient(0, 0, 0, cnvH);
      grd[0].addColorStop(0, "rgb(0,217,253)");
      grd[0].addColorStop(.12, "rgb(1,158,255)");
      grd[0].addColorStop(.15, "rgb(30,110,30)");
      grd[0].addColorStop(1, "rgb(186,243,66)");
      break;
    case 1:
      grd[1] = ctx.createLinearGradient(0, 0, 0, cnvH);
      grd[1].addColorStop(0, "rgb(186,73,13)");
      grd[1].addColorStop(.15, "rgb(217,120,13)");
      grd[1].addColorStop(1, "rgb(248,167,13)");
      break;
    case 2:
      grd[2] = ctx.createLinearGradient(0, 0, 0, cnvH);
      grd[2].addColorStop(0,   "rgb(255,208,255)");
      grd[2].addColorStop(.15, "rgb(255,29,47)");
      grd[2].addColorStop(.3,  "rgb(255,208,255)");
      grd[2].addColorStop(.4, "rgb(255,29,47)");
      grd[2].addColorStop(.5,  "rgb(255,208,255)");
      grd[2].addColorStop(.51, "rgb(255,29,47)");
      grd[2].addColorStop(.59, "rgb(255,29,47)");
      grd[2].addColorStop(.6,  "rgb(255,208,255)");
      grd[2].addColorStop(.7,  "rgb(255,208,255)");
      grd[2].addColorStop(.71, "rgb(255,29,47)");
      grd[2].addColorStop(.79, "rgb(255,29,47)");
      grd[2].addColorStop(.8,  "rgb(255,208,255)");
      grd[2].addColorStop(.9,  "rgb(255,208,255)");
      grd[2].addColorStop(.91, "rgb(255,29,47)");
      grd[2].addColorStop(1,   "rgb(255,29,47)");
      break;
    case 3:
      grd[3] = ctx.createLinearGradient(0, 0, 0, cnvH);
      grd[3].addColorStop(0,   "rgb(255,29,47)");
      grd[3].addColorStop(.15, "rgb(255,208,255)");
      grd[3].addColorStop(.3, "rgb(255,29,47)");
      grd[3].addColorStop(.4,  "rgb(255,208,255)");
      grd[3].addColorStop(.5,  "rgb(255,29,47)");
      grd[3].addColorStop(.51, "rgb(255,208,255)");
      grd[3].addColorStop(.59, "rgb(255,208,255)");
      grd[3].addColorStop(.6,  "rgb(255,29,47)");
      grd[3].addColorStop(.7,  "rgb(255,29,47)");
      grd[3].addColorStop(.71, "rgb(255,208,255)");
      grd[3].addColorStop(.79, "rgb(255,208,255)");
      grd[3].addColorStop(.8,  "rgb(255,29,47)");
      grd[3].addColorStop(.9,  "rgb(255,29,47)");
      grd[3].addColorStop(.91, "rgb(255,208,255)");
      grd[3].addColorStop(.1,  "rgb(255,208,255)");
      break;
    case 4:
      grd[4] = ctx.createLinearGradient(0, 0, 0, cnvH);
      grd[4].addColorStop(0, "grey");
      grd[4].addColorStop(.34, "lightgrey");
      grd[4].addColorStop(.35, "white");
      grd[4].addColorStop(1, "white");
      break;
  }
};

let fxboot_pgr = 0;
let _cnv, _ctx;
const boot = async (tFrame) => {
  var cnv2, ctx2;
  switch (fxboot_pgr) {
    case 0:
      _cnv = cnv;
      _ctx = ctx;
      
      cnv = new OffscreenCanvas(cnvW, cnvH);
      ctx = cnv.getContext("2d");
      ctx.imageSmoothingEnabled = "true";
      ctx.imageSmoothingQuality = "high";
    case 1:
      cnv2 = new OffscreenCanvas(128, 128);
      ctx2 = cnv2.getContext("2d");

      cnv2.width = 128;
      cnv2.height = 128;
      ctx2.fillStyle = "white";
      ctx2.fillRect(0, 0, 128, 128);
      ctx2.fillStyle = "red";
      ctx2.fillRect(16, 16, 96, 96);
      ctx2.fillStyle = "white";
      ctx2.fillRect(32, 32, 64, 64);
      ctx2.fillStyle = "red";
      ctx2.fillRect(48, 48, 32, 32);
      textures.push(cnv2);
      break;
    case 11:
      updateGradient(0);
      break;
    case 12:
      updateGradient(1);
      break;
    case 13:
      updateGradient(2);
      break;
    case 14:
      updateGradient(3);
      break;
    case 15:
      updateGradient(4);
      break;
    case 21:
      sceneloader(false);
      scenes[2] = ctx.getImageData(0, 0, cnvW, cnvH);
      HUDloader();
      scenes[0] = ctx.getImageData(0, 0, cnvW, cnvH);
      break;
    case 22:
      sceneloader(true);
      scenes[3] = ctx.getImageData(0, 0, cnvW, cnvH);
      HUDloader();
      scenes[1] = ctx.getImageData(0, 0, cnvW, cnvH);
      break;
    case 25:
      break;
    case 100:
      ctx = {};
      cnv = {};

      cnv = _cnv;
      ctx = _ctx;
      break;
    default:
      if (fxboot_pgr % 10 == 0) {
        _ctx.clearRect(0, 0, cnvW, cnvH);

        let blkH = Math.round(cnvH / 64);
        let blkW = Math.round(cnvW / 64);
        for (let h = 0; h < 65; h++) {
          for (let w = 0; w < 65; w++) {
            _ctx.fillStyle = "rgb(" + Math.random() * 255 + ", " +  Math.random() * 255 + ", " + Math.random() * 255 + ")";
            _ctx.fillRect(w * blkW, h * blkH, blkW, blkH);
          }
        }
      }
          
      _ctx.shadowColor = "darkblue";
      _ctx.shadowBlur = 20;
      _ctx.lineJoin = "bevel";
      _ctx.lineWidth = 5;
      _ctx.strokeStyle = "white";
      _ctx.strokeRect((cnvW / 2) - 88, (cnvH / 2) - 48, 176, 96);
      _ctx.strokeStyle = "black";
      _ctx.strokeRect((cnvW / 2) - 84, (cnvH / 2) - 44, 168, 88);
      _ctx.lineWidth = 2;
      _ctx.strokeStyle = "white";
      _ctx.strokeRect((cnvW / 2) - 81, (cnvH / 2) - 41, 162, 82);

      _ctx.fillStyle = "rgba(0, 0, 0, .75)";
      _ctx.fillRect((cnvW / 2) - 80, (cnvH / 2) - 40, 160, 80);
      _ctx.fillStyle = "rgb(0, 255, 0)";
      _ctx.font = "2em Verdana";
      _ctx.fillText("Loading...", (cnvW / 2) - 50, (cnvH / 2) - 16);
      _ctx.fillRect((cnvW / 2) - 70, (cnvH / 2), (140 / 100) * fxboot_pgr, 30);  
  }
      
  fxboot_pgr++;
  if (fxboot_pgr > 100) {
    isboot = false;
    postMessage({type: "boot_end"});
    return;
  } else {
    requestAnimationFrame(boot);
  }
};

const canvas = async (e) => {
  cnv = e.canvas;
  ctx = e.canvas.getContext("2d");
};
const size = async (e) => {
  cnv.width = e.width;
  cnv.height = e.height;
  cnvW = e.width;
  cnvH = e.height;
  
  ctx.save();
  ctx.font = "5em Impact";
  tMetJ = ctx.measureText("JUMP");
  tMetJ.height = ctx.measureText("M").width / 2;
  tMet = ctx.measureText("M");
  ctx.restore();
  
  scaleHA = (cnvH * .85) - (cnvH * .12);
  scaleHP = cnvH - ((cnvH * .54) - (cnvH * .12));
  scaleTW = (cnvW * .55) - (cnvW * .45);
  scaleBW = (cnvW * .92) - (cnvW * .08);
  scaleTL = scaleTW / 4;
  scaleBL = scaleBW / 4;
  scaleT = scaleTL * .01;
  scaleB = scaleBL * .01;
  scaleA = scaleB - scaleT;
  enemiesStep = scaleHA / (timestep * 2);

  if (!isboot) {
    updateGradient(0);
    updateGradient(1);
    updateGradient(2);
    updateGradient(3);
    updateGradient(4);
    sceneloader(false);
    scenes[2] = ctx.getImageData(0, 0, cnvW, cnvH);
    if (gamestate == 5) HUDloader();
    scenes[0] = ctx.getImageData(0, 0, cnvW, cnvH);
    sceneloader(true);
    scenes[3] = ctx.getImageData(0, 0, cnvW, cnvH); 
    if (gamestate == 5) HUDloader();
    scenes[1] = ctx.getImageData(0, 0, cnvW, cnvH);
  }
};
const state = async (e) => { gamestate = e.state; };
const log = async (e) => { console.log(e); };
const queue = async (e) => { mp_queue = e.queue; };
const dev = async (e) => { devmode = e.value;};
const intro = async (tFrame) => {
  if (gamestate == 2) {
    checkflip(tFrame);
    if (flip) {
      ctx.putImageData(scenes[2], 0, 0);
    } else {
      ctx.putImageData(scenes[3], 0, 0);
    }
    requestAnimationFrame(settings);
  }
};
const settings = intro;
const handlers = {
  canvas,
  dev,
  size,
  state,
  boot,
  settings,
  intro,
  game,
  log,
  control,
  queue,
};
onmessage = e => {
  const fn = handlers[e.data.type];
  if (!fn) {
    throw new Error('no handler for type: ' + e.data.type);
  }
  fn(e.data);
};
};