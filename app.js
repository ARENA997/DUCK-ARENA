const socket=io();const $=id=>document.getElementById(id);let myRoom=null;
function nick(){return $("nick").value.trim()||"Jogador";}
$("create1").onclick=()=>socket.emit("room:create",{nick:nick(),mode:"X1"});
$("create2").onclick=()=>socket.emit("room:create",{nick:nick(),mode:"X2"});
socket.on("connect",()=>{$("online").textContent="● ONLINE";});
socket.on("disconnect",()=>{$("online").textContent="● DESCONECTADO";});
socket.on("notice",msg=>$("notice").textContent=msg);
socket.on("room:joined",room=>{myRoom=room;$("mine").innerHTML=`<b>${room.mode} • ${room.id}</b><p>${room.players.join(" ⚔️ ")}</p><small>${room.count}/${room.max} jogadores</small><br><button onclick="leave()">SAIR DA SALA</button>`;});
window.leave=()=>socket.emit("room:leave");
socket.on("rooms:update",rooms=>{$("rooms").innerHTML=rooms.length?rooms.map(r=>`<article class="room"><b>${r.mode} • ${r.id}</b><div class="players">${r.players.join(" + ")}<br>${r.count}/${r.max} • ${r.status}</div><button ${r.count>=r.max?"disabled":""} onclick="join('${r.id}')">ENTRAR NA SALA</button></article>`).join(""):'<p class="empty">Nenhuma sala ainda. Crie a primeira!</p>';});
window.join=id=>socket.emit("room:join",{id,nick:nick()});
