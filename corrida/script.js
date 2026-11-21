const canvas = document.getElementById("jogo");
const ctx = canvas.getContext("2d");
const LARGURA = canvas.width;
const ALTURA = canvas.height;

const ESTRADA_ESQ = 270;
const ESTRADA_DIR = 630;
const FAIXAS = [330, 450, 570];
const CORES = ["#ef4444", "#3b82f6", "#eab308", "#a855f7", "#14b8a6", "#f472b6", "#e2e8f0", "#84cc16"];

const els = {
  velocidade: document.getElementById("velocidade"),
  distancia: document.getElementById("distancia"),
  vidas: document.getElementById("vidas"),
  recorde: document.getElementById("recorde"),
  overlay: document.getElementById("overlay"),
  overlayEmoji: document.getElementById("overlay-emoji"),
  overlayTitulo: document.getElementById("overlay-titulo"),
  overlayTexto: document.getElementById("overlay-texto"),
  overlayBotao: document.getElementById("overlay-botao"),
  botaoPausar: document.getElementById("botao-pausar"),
  botaoReiniciar: document.getElementById("botao-reiniciar"),
};

let estado = "inicio";
let teclas = { esquerda: false, direita: false, acelerar: false, frear: false };
let jogador;
let carros;
let particulas;
let distancia;
let vidas;
let recorde = 0;
let tempoSpawn;
let tremor;
let deslocamento;
let ultimoQuadro = performance.now();

try {
  recorde = Number(localStorage.getItem("corrida-recorde")) || 0;
} catch (erro) {
  recorde = 0;
}

function reiniciarEstado() {
  jogador = { x: 450, y: 490, l: 56, a: 96, vel: 250, invul: 0 };
  carros = [];
  particulas = [];
  distancia = 0;
  vidas = 3;
  tempoSpawn = 1.2;
  tremor = 0;
  deslocamento = 0;
  teclas = { esquerda: false, direita: false, acelerar: false, frear: false };
  atualizarHud();
}

function mostrarOverlay(emoji, titulo, texto, botao, acao) {
  els.overlayEmoji.textContent = emoji;
  els.overlayTitulo.textContent = titulo;
  els.overlayTexto.innerHTML = texto;
  els.overlayBotao.textContent = botao;
  els.overlayBotao.onclick = acao;
  els.overlay.hidden = false;
  els.overlayBotao.focus();
}

function esconderOverlay() {
  els.overlay.hidden = true;
}

function iniciarJogo() {
  reiniciarEstado();
  estado = "jogando";
  els.botaoPausar.textContent = "⏸️ Pausar";
  esconderOverlay();
  ultimoQuadro = performance.now();
}

function pausar() {
  if (estado !== "jogando") return;
  estado = "pausado";
  els.botaoPausar.textContent = "▶️ Continuar";
  mostrarOverlay("⏸️", "Pausado", "A corrida está parada. Respire fundo e volte quando quiser!", "Continuar", retomar);
}

function retomar() {
  if (estado !== "pausado") return;
  estado = "jogando";
  els.botaoPausar.textContent = "⏸️ Pausar";
  esconderOverlay();
  ultimoQuadro = performance.now();
}

function finalizarJogo() {
  estado = "fim";
  const novoRecorde = distancia > recorde;
  if (novoRecorde) {
    recorde = distancia;
    try {
      localStorage.setItem("corrida-recorde", String(Math.floor(recorde)));
    } catch (erro) {
      /* armazenamento indisponível */
    }
  }
  atualizarHud();
  mostrarOverlay(
    "🏁",
    "Fim de jogo!",
    `Você percorreu <strong>${Math.floor(distancia)} m</strong>.<br>${novoRecorde ? "🎉 Novo recorde!" : `Recorde: ${Math.floor(recorde)} m`}`,
    "Correr de novo",
    iniciarJogo
  );
}

function atualizarHud() {
  els.velocidade.textContent = `${Math.round(jogador.vel * 0.55)} km/h`;
  els.distancia.textContent = `${Math.floor(distancia)} m`;
  els.vidas.textContent = "❤️".repeat(vidas) + "🖤".repeat(3 - vidas);
  els.recorde.textContent = `${Math.floor(recorde)} m`;
}

function criarCarro() {
  const disponiveis = FAIXAS.filter((faixa) => !carros.some((carro) => carro.faixa === faixa && carro.y < 150));
  if (disponiveis.length === 0) return;
  const faixa = disponiveis[Math.floor(Math.random() * disponiveis.length)];
  carros.push({
    x: faixa,
    y: -110,
    faixa,
    l: 54,
    a: 94,
    vel: 130 + Math.random() * 100 + Math.min(110, distancia / 150),
    cor: CORES[Math.floor(Math.random() * CORES.length)],
  });
}

function criarParticulas(x, y, cor) {
  for (let i = 0; i < 18; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const velocidade = 60 + Math.random() * 160;
    particulas.push({
      x,
      y,
      vx: Math.cos(angulo) * velocidade,
      vy: Math.sin(angulo) * velocidade,
      vida: 0.35 + Math.random() * 0.45,
      cor: i % 3 === 0 ? "#fbbf24" : cor,
      tam: 3 + Math.random() * 5,
    });
  }
}

function bater(carro) {
  vidas--;
  jogador.invul = 1.6;
  jogador.vel = 170;
  tremor = 14;
  criarParticulas((jogador.x + carro.x) / 2, (jogador.y + carro.y) / 2, carro.cor);
  carros = carros.filter((c) => c !== carro);
  if (vidas <= 0) finalizarJogo();
}

function atualizar(dt) {
  if (teclas.esquerda) jogador.x -= 430 * dt;
  if (teclas.direita) jogador.x += 430 * dt;
  if (teclas.acelerar) jogador.vel += 260 * dt;
  if (teclas.frear) jogador.vel -= 340 * dt;

  jogador.vel = Math.max(120, Math.min(430, jogador.vel));
  const margem = jogador.l / 2 + 8;
  jogador.x = Math.max(ESTRADA_ESQ + margem, Math.min(ESTRADA_DIR - margem, jogador.x));

  distancia += jogador.vel * dt * 0.12;
  deslocamento = (deslocamento + jogador.vel * dt) % 400;
  jogador.invul = Math.max(0, jogador.invul - dt);
  tremor = Math.max(0, tremor - dt * 30);

  tempoSpawn -= dt;
  if (tempoSpawn <= 0) {
    criarCarro();
    tempoSpawn = Math.max(0.45, 1.6 - distancia / 2200) + Math.random() * 0.35;
  }

  for (const carro of carros) {
    carro.y += (jogador.vel - carro.vel) * dt;
  }
  carros = carros.filter((carro) => carro.y > -180 && carro.y < ALTURA + 180);

  if (jogador.invul <= 0) {
    for (const carro of carros) {
      const colidiuX = Math.abs(jogador.x - carro.x) < (jogador.l + carro.l) / 2 - 8;
      const colidiuY = Math.abs(jogador.y - carro.y) < (jogador.a + carro.a) / 2 - 10;
      if (colidiuX && colidiuY) {
        bater(carro);
        break;
      }
    }
  }

  for (const p of particulas) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vida -= dt;
  }
  particulas = particulas.filter((p) => p.vida > 0);

  atualizarHud();
}

function caminhoArredondado(x, y, largura, altura, raio) {
  ctx.beginPath();
  ctx.moveTo(x + raio, y);
  ctx.arcTo(x + largura, y, x + largura, y + altura, raio);
  ctx.arcTo(x + largura, y + altura, x, y + altura, raio);
  ctx.arcTo(x, y + altura, x, y, raio);
  ctx.arcTo(x, y, x + largura, y, raio);
  ctx.closePath();
}

function desenharArbusto(x, y, tamanho) {
  ctx.fillStyle = "#14532d";
  ctx.beginPath();
  ctx.arc(x, y, tamanho, 0, Math.PI * 2);
  ctx.arc(x - tamanho * 0.6, y + tamanho * 0.3, tamanho * 0.7, 0, Math.PI * 2);
  ctx.arc(x + tamanho * 0.6, y + tamanho * 0.3, tamanho * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.arc(x - tamanho * 0.2, y - tamanho * 0.3, tamanho * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function desenharCenario() {
  ctx.fillStyle = "#166534";
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  ctx.fillStyle = "#15803d";
  for (let y = -100 + (deslocamento * 0.6) % 200; y < ALTURA + 100; y += 200) {
    ctx.fillRect(0, y, ESTRADA_ESQ - 20, 100);
    ctx.fillRect(ESTRADA_DIR + 20, y, LARGURA - ESTRADA_DIR - 20, 100);
  }

  for (let y = -80 + (deslocamento * 0.9) % 160; y < ALTURA + 80; y += 160) {
    desenharArbusto(110, y, 26);
    desenharArbusto(790, y + 70, 30);
  }

  ctx.fillStyle = "#475569";
  ctx.fillRect(ESTRADA_ESQ, 0, ESTRADA_DIR - ESTRADA_ESQ, ALTURA);

  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(ESTRADA_ESQ - 6, 0, 6, ALTURA);
  ctx.fillRect(ESTRADA_DIR, 0, 6, ALTURA);

  for (let y = -80 + deslocamento % 160; y < ALTURA + 80; y += 160) {
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(ESTRADA_ESQ - 18, y, 10, 80);
    ctx.fillRect(ESTRADA_DIR + 8, y, 10, 80);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(ESTRADA_ESQ - 18, y + 80, 10, 80);
    ctx.fillRect(ESTRADA_DIR + 8, y + 80, 10, 80);
  }

  ctx.fillStyle = "rgba(255, 255, 255, .75)";
  for (let y = -70 + deslocamento % 140; y < ALTURA + 70; y += 140) {
    ctx.fillRect(387, y, 6, 70);
    ctx.fillRect(507, y, 6, 70);
  }
}

function desenharCarro(x, y, largura, altura, cor, eJogador = false) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "rgba(0, 0, 0, .3)";
  caminhoArredondado(-largura / 2 + 6, -altura / 2 + 10, largura, altura, 12);
  ctx.fill();

  ctx.fillStyle = cor;
  caminhoArredondado(-largura / 2, -altura / 2, largura, altura, 12);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, .18)";
  caminhoArredondado(-largura / 2 + 5, -altura / 2 + 5, largura - 10, 12, 6);
  ctx.fill();

  ctx.fillStyle = "#0f172a";
  caminhoArredondado(-largura / 2 + 7, -altura / 2 + 22, largura - 14, altura * 0.34, 7);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, .25)";
  caminhoArredondado(-largura / 2 + 11, -altura / 2 + 26, largura - 22, 7, 4);
  ctx.fill();

  ctx.fillStyle = "rgba(15, 23, 42, .75)";
  caminhoArredondado(-largura / 2 + 9, altura / 2 - 26, largura - 18, 15, 5);
  ctx.fill();

  ctx.fillStyle = "#fef9c3";
  ctx.fillRect(-largura / 2 + 7, -altura / 2 + 3, 12, 5);
  ctx.fillRect(largura / 2 - 19, -altura / 2 + 3, 12, 5);

  ctx.fillStyle = "#ef4444";
  ctx.fillRect(-largura / 2 + 7, altura / 2 - 9, 12, 5);
  ctx.fillRect(largura / 2 - 19, altura / 2 - 9, 12, 5);

  if (eJogador) {
    ctx.strokeStyle = "rgba(255, 255, 255, .8)";
    ctx.lineWidth = 2;
    caminhoArredondado(-largura / 2, -altura / 2, largura, altura, 12);
    ctx.stroke();
  }

  ctx.restore();
}

function desenharParticula(p) {
  ctx.globalAlpha = Math.min(1, p.vida / 0.5);
  ctx.fillStyle = p.cor;
  ctx.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam);
  ctx.globalAlpha = 1;
}

function desenhar() {
  ctx.save();
  if (tremor > 0) {
    ctx.translate((Math.random() - 0.5) * tremor, (Math.random() - 0.5) * tremor);
  }

  desenharCenario();
  carros.forEach((carro) => desenharCarro(carro.x, carro.y, carro.l, carro.a, carro.cor));

  const piscando = jogador.invul > 0 && Math.floor(jogador.invul * 12) % 2 === 0;
  if (!piscando) {
    desenharCarro(jogador.x, jogador.y, jogador.l, jogador.a, "#22c55e", true);
  }

  particulas.forEach(desenharParticula);
  ctx.restore();
}

function loop(tempo) {
  const dt = Math.min((tempo - ultimoQuadro) / 1000, 0.05);
  ultimoQuadro = tempo;
  if (estado === "jogando") atualizar(dt);
  desenhar();
  requestAnimationFrame(loop);
}

const mapaTeclas = {
  ArrowLeft: "esquerda",
  a: "esquerda",
  ArrowRight: "direita",
  d: "direita",
  ArrowUp: "acelerar",
  w: "acelerar",
  ArrowDown: "frear",
  s: "frear",
};

window.addEventListener("keydown", (evento) => {
  const tecla = evento.key.length === 1 ? evento.key.toLowerCase() : evento.key;
  if (mapaTeclas[tecla]) {
    teclas[mapaTeclas[tecla]] = true;
    evento.preventDefault();
  }
  if (tecla === "p" || tecla === "Escape") {
    if (estado === "jogando") pausar();
    else if (estado === "pausado") retomar();
  }
  if (tecla === "Enter") {
    if (estado === "inicio" || estado === "fim") iniciarJogo();
    else if (estado === "pausado") retomar();
  }
});

window.addEventListener("keyup", (evento) => {
  const tecla = evento.key.length === 1 ? evento.key.toLowerCase() : evento.key;
  if (mapaTeclas[tecla]) {
    teclas[mapaTeclas[tecla]] = false;
    evento.preventDefault();
  }
});

window.addEventListener("blur", () => {
  teclas = { esquerda: false, direita: false, acelerar: false, frear: false };
  if (estado === "jogando") pausar();
});

document.querySelectorAll(".botao-toque").forEach((botao) => {
  const acao = botao.dataset.acao;
  const ligar = (evento) => {
    evento.preventDefault();
    teclas[acao] = true;
  };
  const desligar = (evento) => {
    evento.preventDefault();
    teclas[acao] = false;
  };
  botao.addEventListener("pointerdown", ligar);
  ["pointerup", "pointercancel", "pointerleave"].forEach((tipo) => botao.addEventListener(tipo, desligar));
});

els.botaoPausar.addEventListener("click", () => {
  if (estado === "jogando") pausar();
  else if (estado === "pausado") retomar();
});
els.botaoReiniciar.addEventListener("click", iniciarJogo);

reiniciarEstado();
mostrarOverlay(
  "🏁",
  "Corrida Turbinada",
  "Use ← → ou A/D para mudar de faixa, ↑/W para acelerar e ↓/S para frear.<br>Desvie dos outros carros. Boa sorte!",
  "Começar corrida",
  iniciarJogo
);
requestAnimationFrame(loop);
