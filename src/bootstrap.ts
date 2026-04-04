// @ts-nocheck

import ParallelRails from './Main';

const target = document.getElementById('game-area');

if (target) {
  new ParallelRails({ el: target });
}
