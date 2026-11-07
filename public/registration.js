const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('.workspace-motion');
let paused = reducedMotion.matches;
function syncMotion() {
 document.body.classList.toggle('workspace-paused', paused || document.hidden);
 motionButton.setAttribute('aria-pressed', String(paused));
 const label = paused ? 'Retomar animação' : 'Pausar animação';
 motionButton.setAttribute('aria-label', label);
 motionButton.replaceChildren();
 const symbol = document.createElement('span');
 symbol.setAttribute('aria-hidden','true'); symbol.textContent = paused ? '▶' : 'Ⅱ';
 motionButton.append(symbol, ' ' + label);
}
motionButton.addEventListener('click', () => {paused = !paused; syncMotion();});
reducedMotion.addEventListener('change', () => {paused = reducedMotion.matches; syncMotion();});
document.addEventListener('visibilitychange', syncMotion);
syncMotion();
for (const toggle of document.querySelectorAll('.password-toggle')) {
 const input = document.getElementById(toggle.getAttribute('aria-controls'));
 const label = input.id === 'passwordConfirm' ? 'confirmação da palavra-passe' : input.labels[0].textContent.toLowerCase();
 toggle.addEventListener('click', () => {
  const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  toggle.setAttribute('aria-pressed', String(visible));
  toggle.setAttribute('aria-label', `${visible ? 'Ocultar' : 'Mostrar'} ${label}`);
 });
}
const illustration = document.querySelector('.workspace-art');
illustration.addEventListener('pointermove', event => {
 if (paused || reducedMotion.matches || event.pointerType !== 'mouse') return;
 const rect = illustration.getBoundingClientRect();
 illustration.style.setProperty('--move-x', `${((event.clientX-rect.left)/rect.width-.5)*8}px`);
 illustration.style.setProperty('--move-y', `${((event.clientY-rect.top)/rect.height-.5)*6}px`);
});
illustration.addEventListener('pointerleave', () => {
 illustration.style.setProperty('--move-x','0px');illustration.style.setProperty('--move-y','0px');
});
const error = document.querySelector('.register-error');
if (error) error.focus();
