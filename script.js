const greetings = [
  'Hello, World!',
  'Hola, Mundo!',
  'Bonjour, le Monde!',
  'こんにちは、世界！',
];

let index = 0;

const greetingEl = document.getElementById('greeting');
const changeBtn = document.getElementById('change-btn');

changeBtn.addEventListener('click', () => {
  index = (index + 1) % greetings.length;
  greetingEl.textContent = greetings[index];
});
