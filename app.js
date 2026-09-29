const games = [
  { id: 'fruit-slice', name: 'Fruit Splash!', icon: '🍉', description: 'Swipe, slice, smile', available: true },
  { id: 'next-1', name: 'A new game', icon: '🎨', description: 'More fun is growing', available: false },
  { id: 'next-2', name: 'Another game', icon: '🧩', description: 'Coming later', available: false }
];

const screens = Object.fromEntries(['hub', 'ready', 'play'].map(id => [id, document.getElementById(id)]));
const pauseMenu = document.getElementById('pause-menu');
const game = new FruitSliceGame(document.getElementById('game-canvas'), document.getElementById('score'));

document.getElementById('game-list').replaceChildren(...games.map(item => {
  const card = document.createElement(item.available ? 'button' : 'div');
  card.className = `game-card ${item.available ? 'available' : 'soon'}`;
  if (item.available) { card.type = 'button'; card.addEventListener('click', () => show('ready')); }
  card.innerHTML = `<span class="game-icon" aria-hidden="true">${item.icon}</span><span class="game-copy"><span class="game-name">${item.name}</span><span class="game-description">${item.description}</span></span><span class="game-action">${item.available ? 'PLAY' : 'Soon'}</span>`;
  return card;
}));

function show(name) {
  if (name !== 'play') game.stop();
  for (const [id, screen] of Object.entries(screens)) screen.classList.toggle('hidden', id !== name);
  pauseMenu.classList.add('hidden');
  if (name === 'play') game.resize();
}

document.querySelectorAll('[data-home]').forEach(button => button.addEventListener('click', () => show('hub')));
document.getElementById('play-button').addEventListener('click', () => { show('play'); game.start(); });
document.getElementById('pause-button').addEventListener('click', () => { game.pause(); pauseMenu.classList.remove('hidden'); document.getElementById('resume-button').focus(); });
document.getElementById('resume-button').addEventListener('click', () => { pauseMenu.classList.add('hidden'); game.resume(); });
document.getElementById('restart-button').addEventListener('click', () => { pauseMenu.classList.add('hidden'); game.start(); });
document.getElementById('home-button').addEventListener('click', () => show('hub'));

const fullscreenButtons = document.querySelectorAll('[data-fullscreen]');
if (!document.documentElement.requestFullscreen) fullscreenButtons.forEach(button => button.hidden = true);
fullscreenButtons.forEach(button => button.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch (_) { /* Some mobile browsers disallow fullscreen; play remains usable. */ }
  game.resize();
}));
document.addEventListener('fullscreenchange', () => game.resize());
