/**
 * IA do Truco de Elite
 * Comportamentos: Recruta, Mediano, Antigão
 */

const AI = {
    decideAction: function(playerIdx, hand, vira, playedCards) {
        // Implementar lógica de blefe e força
        return { action: 'PLAY_CARD', cardIdx: 0 };
    }
};

window.botPlay = function(idx) {
    const action = AI.decideAction(idx, players[idx], vira, gameState.playedInRound);
    
    if (action.action === 'PLAY_CARD') {
        playCard(idx, action.cardIdx);
    }
};
