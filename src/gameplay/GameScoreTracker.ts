import type { GameplayScoreState } from '../types';

export function createScoreState(): GameplayScoreState {
    return {
        scorePoints: {},
        hitResults: {
            '0': 0,
            '50': 0,
            '100': 0,
            '200': 0,
            '300': 0,
            '300g': 0
        },
        currentScore: 0,
        currentCombo: 0,
        maxCombo: 0
    };
}

export function applyScore(state: GameplayScoreState, score: number, type: string, currentTime: number, preserveCombo = false) {
    state.scorePoints[currentTime] = score;
    ++state.hitResults[type];
    if (score > 0) {
        if (++state.currentCombo > state.maxCombo) {
            state.maxCombo = state.currentCombo;
        }
        state.currentScore += Math.min(3000, score * (Math.floor(state.currentCombo / 20) + 1));
    } else if (!preserveCombo) {
        state.currentCombo = 0;
    }
}
