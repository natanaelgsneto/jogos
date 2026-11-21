const SIMBOLOS = ["🍎", "🍌", "🍇", "🍓", "🍒", "🥝", "🍍", "🥑", "🍉", "🍑", "🥕", "🌽"];

const CONFIGURACOES = {
  facil: { colunas: 4, pares: 6 },
  medio: { colunas: 4, pares: 8 },
  dificil: { colunas: 6, pares: 12 },
};

const tabuleiro = document.getElementById("tabuleiro");
const seletorDificuldade = document.getElementById("dificuldade");
const botaoReiniciar = document.getElementById("reiniciar");
const botaoJogarNovamente = document.getElementById("jogar-novamente");
const modal = document.getElementById("modal");
const elementoMovimentos = document.getElementById("movimentos");
const elementoPares = document.getElementById("pares");
const elementoTempo = document.getElementById("tempo");
const modalTexto = document.getElementById("modal-texto");

let movimentos = 0;
let paresEncontrados = 0;
let totalPares = 8;
let primeiraCarta = null;
let segundaCarta = null;
let bloqueado = false;
let segundos = 0;
let cronometro = null;

function embaralhar(itens) {
  for (let i = itens.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [itens[i], itens[j]] = [itens[j], itens[i]];
  }
  return itens;
}

function formatarTempo(total) {
  const minutos = String(Math.floor(total / 60)).padStart(2, "0");
  const segundosRestantes = String(total % 60).padStart(2, "0");
  return `${minutos}:${segundosRestantes}`;
}

function iniciarCronometro() {
  clearInterval(cronometro);
  segundos = 0;
  elementoTempo.textContent = formatarTempo(segundos);
  cronometro = setInterval(() => {
    segundos++;
    elementoTempo.textContent = formatarTempo(segundos);
  }, 1000);
}

function criarCarta(simbolo) {
  const carta = document.createElement("button");
  carta.type = "button";
  carta.className = "carta";
  carta.setAttribute("aria-label", "Carta virada para baixo");
  carta.innerHTML = `
    <div class="carta-inner">
      <div class="carta-frente" aria-hidden="true">${simbolo}</div>
      <div class="carta-verso" aria-hidden="true">❓</div>
    </div>
  `;
  carta.addEventListener("click", () => virarCarta(carta, simbolo));
  return carta;
}

function novoJogo() {
  const { colunas, pares } = CONFIGURACOES[seletorDificuldade.value];
  totalPares = pares;
  movimentos = 0;
  paresEncontrados = 0;
  primeiraCarta = null;
  segundaCarta = null;
  bloqueado = false;

  modal.hidden = true;
  elementoMovimentos.textContent = "0";
  elementoPares.textContent = `0/${totalPares}`;
  tabuleiro.className = `tabuleiro${colunas === 6 ? " dificil" : ""}`;
  tabuleiro.style.gridTemplateColumns = `repeat(${colunas}, 1fr)`;
  tabuleiro.innerHTML = "";

  const simbolos = embaralhar(SIMBOLOS.slice(0, pares).flatMap((s) => [s, s]));
  simbolos.forEach((simbolo) => tabuleiro.appendChild(criarCarta(simbolo)));

  iniciarCronometro();
}

function virarCarta(carta, simbolo) {
  if (bloqueado || carta.classList.contains("virada") || carta.classList.contains("encontrada")) {
    return;
  }

  carta.classList.add("virada");
  carta.setAttribute("aria-label", `Carta revelada: ${simbolo}`);

  if (!primeiraCarta) {
    primeiraCarta = { carta, simbolo };
    return;
  }

  segundaCarta = { carta, simbolo };
  movimentos++;
  elementoMovimentos.textContent = String(movimentos);

  if (primeiraCarta.simbolo === segundaCarta.simbolo) {
    primeiraCarta.carta.classList.add("encontrada");
    segundaCarta.carta.classList.add("encontrada");
    paresEncontrados++;
    elementoPares.textContent = `${paresEncontrados}/${totalPares}`;
    resetarSelecao();

    if (paresEncontrados === totalPares) {
      finalizarJogo();
    }
    return;
  }

  bloqueado = true;
  setTimeout(() => {
    [primeiraCarta.carta, segundaCarta.carta].forEach((c) => {
      c.classList.remove("virada");
      c.setAttribute("aria-label", "Carta virada para baixo");
    });
    resetarSelecao();
    bloqueado = false;
  }, 850);
}

function resetarSelecao() {
  primeiraCarta = null;
  segundaCarta = null;
}

function finalizarJogo() {
  clearInterval(cronometro);
  modalTexto.textContent = `Você encontrou ${totalPares} pares em ${movimentos} movimentos e ${formatarTempo(segundos)}.`;
  modal.hidden = false;
  botaoJogarNovamente.focus();
}

botaoReiniciar.addEventListener("click", novoJogo);
botaoJogarNovamente.addEventListener("click", novoJogo);
seletorDificuldade.addEventListener("change", novoJogo);

novoJogo();
