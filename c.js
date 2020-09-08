"use strict";
let cnv;
let render = Worker;
let ls = localStorage;
let isnewplayer = false;
let _player = {};
let emojilist = ["1F920", "1F973", "1F60E", "1F479", "1F47A", "1F47B", "1F47D", "1F47E", "1F916", "1F63A", "1F436", "1F649"];

const dev = (e) => {
  render.postMessage({type: "dev", value: e,});
};
const toBoolean = (e) => {
  return (e == "true") ? true : false
};
const settingsSave = () => {
  isnewplayer = false;
  m00.style.display = "none";

  ls.setItem("FX_Name", pName.value);
  ls.setItem("FX_Color", pColor.value);
  for (let i = 0; i < pStamp.length; i++) {
    if (pStamp[i].checked) {
      ls.setItem("FX_Stamp", i);
      break;
    }
  }
  ls.setItem("FX_Music", pMusic.checked);
  ls.setItem("FX_SFX", pSFX.checked);
  ls.setItem("FX_Dev", pDev.checked);
  dev(pDev.checked);
  _music_on = pMusic.checked;
  _sfx_on = pSFX.checked;
  startclick();
  updateSound();
  set_player();
  settingsShow();
};
const settingsLoad = () => {
  m00.style.display = "grid";
  if (isnewplayer) {
    pName.value = "Player" + (Math.floor(9999 * Math.random())).toString().padStart(4, "0");
    pColor.value = "#" + Math.floor(Math.random()*16777215).toString(16);
    pStamp[Math.floor(Math.random()*12)].checked = true;
    pDev.checked = false;
  } else {
    settingsLoader();
  }
  settingsShow();
};
const settingsLoader = () => {
  pName.value = ls.getItem("FX_Name");
  pColor.value = ls.getItem("FX_Color");
  pStamp[ls.getItem("FX_Stamp")].checked = true;
  pMusic.checked = toBoolean(ls.getItem("FX_Music"));
  pSFX.checked = toBoolean(ls.getItem("FX_SFX"));
  pDev.checked = toBoolean(ls.getItem("FX_Dev"));
  _music_on = pMusic.checked;
  _sfx_on = pSFX.checked;
  set_player();
};
const set_player = () => {
  _player = {
    pName: ls.getItem("FX_Name"),
    pColor: ls.getItem("FX_Color"),
    pStamp: ls.getItem("FX_Stamp"),
  }
};
const settingsShow = () => {
  if (m0.style.display == "block") {
    m0.style.display = "none";
    Menu.style.display = "none";
  } else {
    m0.style.display = "block";
    Menu.style.display = "block";
  }
  if (sck_conn) {
    if ("btnMP" in window) {
      btnMP.disabled = false;
      dcnt.textContent = "Players Online : " + sck_cnt;
    }
  }
};

const singlePlayer = () => {
  m0.style.display = "none";
  Menu.style.display = "none";
  render.postMessage({type: "state", state: 5});
  render.postMessage({type: "game", player: _player});
};

(function () {
function cleanStorage() {
  let lsKeys = 6;
  if (ls.length != lsKeys) {
    Object.keys(localStorage).forEach(key => {
      ls.removeItem(key);
    });
    isnewplayer = true;
  }
}
cleanStorage();

(function () {
  document.body.innerHTML += "<div id=\"Menu\"><div><h1>404 Seconds</h1></div>" +
    "<div class=\"mdiv\"><input id=\"btnSP\" class=\"idiv\" type=\"button\" onclick=\"singlePlayer();\" value=\"Single Player\"></div>" +
    "<div class=\"mdiv\"><input id=\"btnMP\" disabled=\"false\" class=\"idiv\" type=\"button\" onclick=\"sck_MP();\" value=\"Multiplayer\"></div>" + 
    "<div id=\"dcnt\" class=\"mdiv\"></div></div>";

  document.body.innerHTML += "<div id=\"m00\">" +
    "<div>Nickname&nbsp;:&nbsp;</div><div><input id=\"pName\" type=\"text\" size=\"10\" maxlength=\"10\"></div>" +
    "<div>Color&nbsp;:&nbsp;</div><div><input id=\"pColor\" type=\"color\" style=\"width: 100%; height: 100%;\"></div>" +
    "<div>Stamp&nbsp;:&nbsp;</div><div id=\"emjlst\"></div>" +
    "<div>Audio&nbsp;:&nbsp;</div><div><input id=\"pMusic\" type=\"checkbox\" checked=\"true\">&#x1f3b5;<input id=\"pSFX\" type=\"checkbox\" checked=\"true\">&#x1f50a;</div>" +
    "<div>Credits&nbsp;:&nbsp;</div><div style=\"font-size: .6em; align-self: center;\" title=\"Developer Mode\"><nobr><input id=\"pDev\" type=\"checkbox\">&nbsp;&nbsp;DarknessFX&nbsp;<a href=\"https://dfx.lv\" target=\"_blank\">DFX.lv</a>&nbsp;&nbsp;<a href=\"https://twitter.com/DrkFX\" target=\"_blank\">@DrkFX</a></nobr><br>"+
    "<a href=\"https://modarchive.org/index.php?request=view_by_moduleid&query=100235\" target=\"_blank\">Music by Psirius</a>&nbsp;" +
    "<a href=\"https://github.com/KilledByAPixel/ZzFX\" target=\"_blank\">ZzFX</a>&nbsp;" +
    "<a href=\"https://github.com/keithclark/ZzFXM\" target=\"_blank\">ZzFXM</a></div>" +
    "<div></div><div><br><input id=\"bClose\" type=\"button\" value=\"    Save    \" onclick=\"settingsSave();\"></div>" +
    "</div>";

  const emojiload = function() {
    let idx = 0;
    for (const e of emojilist) {
      emjlst.innerHTML += "<div><input id=\"pStamp\" type=\"radio\" name=\"emoji\" value=\"" + idx + "\">&#x" + e + ";</div>";
      idx++;
    }
  }();
})();
document.body.innerHTML += "<button id=\"m0\" title=\"Settings\" onclick=\"settingsLoad(true);\">&#x2699️&#xFE0F;</button>";
 
document.body.innerHTML += "<canvas id=\"c\">";
cnv = document.getElementById("c");
(function() {
  fetch("w.js").then(r => {
  r.text().then(r => {
    render = new Worker(
      "data:text/javascript;charset=US-ASCII," 
      + r,
      { type: "module" });
  }).then(r => {
    render.onmessage = e => {
      switch (e.data.type) {
        case "boot_end":
          if (!isnewplayer) {
            settingsLoader();
          } else {
            settingsLoad();
          }
        case "gameover":
          render.postMessage({type: "state", state: 2});
          render.postMessage({type: "intro", mens: performance.now()});
          settingsShow();
          break;
        case "hit": playSFXH(); break;
        case "jump": playSFXJ(); break;
        default:
          break;
      }
    };
    const coffscreen = cnv.transferControlToOffscreen();
    render.postMessage({type: "canvas", canvas: coffscreen}, [coffscreen]);
    sendSize();
    render.postMessage({type: "state", state: 1});
    render.postMessage({type: "boot"});
  });
  });
}());

const touchcontrols = async (e) => {
  let _tch = e.touches[0].clientX;
  if (_tch < (cnv.width * .28)) { keyPress("ArrowLeft", true); return; }
  if (_tch < (cnv.width * .68)) { keyPress("ArrowUp", true); return; }
  if (_tch > (cnv.width * .72)) { keyPress("ArrowRight", true); return; }
};
const keyPress = async (e, b) => {
  let keyPressed = e;
  switch (keyPressed) {
    case "KeyW": case "ArrowUp":    keyPressed = "P1U"; break;
    case "KeyS": case "ArrowDown":  keyPressed = "P1D"; break;
    case "KeyA": case "ArrowLeft":  keyPressed = "P1L"; break;
    case "KeyD": case "ArrowRight": keyPressed = "P1R"; break;
    case "ShiftLeft":
    case "Space":
    case "ShiftRight":
    case "NumpadEnter":
      keyPressed = "P1B1";
      break;

    default:
      keyPressed = "";
  }
  if (keyPressed != "") {
    render.postMessage({type: "control", input: keyPressed, status: b});
  }
  return keyPressed;
};
function keyDownHandler(e) { keyPress(e.code, true); };
function keyUpHandler(e) { keyPress(e.code, false); };
window.addEventListener("keydown", keyDownHandler, false);	
window.addEventListener("keyup", keyUpHandler, false);
window.addEventListener("touchstart", touchcontrols, { passive: true });
})();

const sendSize = async () => {
  render.postMessage({
    type: "size",
    width: cnv.clientWidth,
    height: cnv.clientHeight,
  });
};
window.addEventListener("resize", sendSize);