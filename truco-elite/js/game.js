/**
 * Truco de Elite - Lógica do Jogo
 * Regras: Baralho Limpo, Vira Paulista, 4 Jogadores (2 Duplas)
 */

const SUITS = ['clubs', 'hearts', 'spades', 'diamonds'];
const VALUES = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];

// Força base das cartas (sem manilha)
const BASE_STRENGTH = {
    '4': 1, '5': 2, '6': 3, '7': 4, 'Q': 5, 'J': 6, 'K': 7, 'A': 8, '2': 9, '3': 10
};

// Ordem das manilhas
const MANILHA_STRENGTH = {
    'diamonds': 11, 'spades': 12, 'hearts': 13, 'clubs': 14
};

let deck = [];
let players = [[], [], [], []]; // P1(User), P2(Opp1), P3(Partner), P4(Opp2)
let vira = null;
let currentRound = 0;
let currentSet = 1; // Mão (Primeira, Segunda, Terceira)
let score = { teamUs: 0, teamThem: 0 };
let roundPoints = 1;
let currentManilhaValue = null;

const radioText = document.getElementById('radio-text');
const roundStatus = document.getElementById('round-status');

function updateRadio(msg) {
    radioText.textContent = msg;
    console.log("RADIO:", msg);
}

function initDeck() {
    deck = [];
    for (const suit of SUITS) {
        for (const val of VALUES) {
            deck.push({ value: val, suit: suit });
        }
    }
}

function shuffle() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function deal() {
    players = [[], [], [], []];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            players[j].push(deck.pop());
        }
    }
    vira = deck.pop();
    
    // Define Manilha
    const viraIdx = VALUES.indexOf(vira.value);
    currentManilhaValue = VALUES[(viraIdx + 1) % VALUES.length];
    
    renderDeck();
    updateRoundStatus();
}

function getCardStrength(card) {
    if (card.value === currentManilhaValue) {
        return MANILHA_STRENGTH[card.suit];
    }
    return BASE_STRENGTH[card.value];
}

function renderDeck() {
    // Vira
    const viraContainer = document.getElementById('vira-card');
    viraContainer.innerHTML = '';
    viraContainer.appendChild(createCardElement(vira));

    // Player Cards
    const myCardsContainer = document.getElementById('my-cards');
    myCardsContainer.innerHTML = '';
    players[0].forEach((card, idx) => {
        const el = createCardElement(card);
        el.addEventListener('click', () => playCard(0, idx));
        myCardsContainer.appendChild(el);
    });

    // Hidden cards for bots
    for (let i = 2; i <= 4; i++) {
        const container = document.querySelector(`#p${i} .card-area`);
        container.innerHTML = '';
        players[i-1].forEach(() => {
            const el = document.createElement('div');
            el.className = 'card back';
            container.appendChild(el);
        });
    }
}

function createCardElement(card) {
    const el = document.createElement('div');
    const suitSymbol = { clubs: '♣', hearts: '♥', spades: '♠', diamonds: '♦' }[card.suit];
    el.className = `card suit-${card.suit}`;
    el.innerHTML = `
        <div class="card-value">${card.value}</div>
        <div class="card-suit">${suitSymbol}</div>
    `;
    return el;
}

function playCard(playerIdx, cardIdx) {
    if (gameState.activePlayer !== playerIdx) return;
    
    const card = players[playerIdx].splice(cardIdx, 1)[0];
    gameState.playedInRound.push({ player: playerIdx, card: card });
    
    renderPlayedCard(playerIdx, card);
    renderDeck();
    
    endTurn();
}

function renderPlayedCard(playerIdx, card) {
    const container = document.getElementById('played-cards');
    const el = createCardElement(card);
    el.classList.add(`played-by-${playerIdx}`);
    container.appendChild(el);
}

function updateRoundStatus() {
    roundStatus.textContent = `PONTOS EM JOGO: ${roundPoints}`;
}

const gameState = {
    activePlayer: 0,
    playedInRound: [],
    trickResults: [], // Vitórias por turno dentro da mão
    currentTurn: 0
};

function startMission() {
    updateRadio("Missão iniciada. QAP?");
    initDeck();
    shuffle();
    deal();
}

function endTurn() {
    gameState.activePlayer = (gameState.activePlayer + 1) % 4;
    
    if (gameState.playedInRound.length === 4) {
        evaluateTrick();
    } else {
        if (gameState.activePlayer !== 0) {
            setTimeout(() => botPlay(gameState.activePlayer), 800);
        }
    }
}

function botPlay(idx) {
    // Lógica simples do ai.js será chamada aqui
    const cardIdx = 0; // Por enquanto apenas joga a primeira
    playCard(idx, cardIdx);
}

function evaluateTrick() {
    // Lógica de quem levou a vaza
    gameState.playedInRound = [];
    document.getElementById('played-cards').innerHTML = '';
    
    // Próximo turno ou mão
    gameState.currentTurn++;
    if (gameState.currentTurn === 3) {
        // Fim da mão
    }
}

// Iniciar
window.onload = startMission;
