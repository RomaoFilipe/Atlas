const scene = document.querySelector('[data-map-preview]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const toggle = document.querySelector('.motion-toggle');
const steps = [...document.querySelectorAll('.journey-steps [data-step]')];
const names = ['PC · posto de trabalho', 'Tomada RJ45 · saída 02', 'Patch panel · F08 ↔ R08', 'Switch SW-01 · porta 08'];
const descriptions = {
 physical: ['Percurso físico documentado', 'PC-04 → tomada → patch panel → SW-01'],
 logical: ['Rede de escritório', 'VLAN 30 · Postos de trabalho', 'Rede 192.0.2.0/24 · Exemplo'],
 ops: ['Revisão da cablagem', 'Confirmar a etiqueta da porta 08', 'Tarefa de exemplo · Sala técnica']
};
let paused = reducedMotion.matches;
let step = 2;
let timer;
let inView = true;

function selectStep(index, announce = false) {
 step = index;
 for (const button of steps) {
  const position = Number(button.dataset.step);
  button.classList.toggle('active', position === index);
  button.classList.toggle('complete', position < index);
  button.setAttribute('aria-pressed', String(position === index));
 }
 document.querySelectorAll('.journey-steps > i').forEach((line, index) => line.classList.toggle('lit', index < step));
 scene.dataset.step = String(index);
 document.querySelectorAll('.route-dots circle').forEach((dot, index) => {
  dot.style.stroke = index === step ? 'var(--lime)' : 'var(--route)';
  dot.style.opacity = index <= step ? '1' : '.35';
 });
 const card = document.querySelector('.port-heading');
 card.replaceChildren();
 const strong = document.createElement('span');
 strong.textContent = index === 3 ? 'Porta 08' : ['PC-04', 'Tomada 02', 'Patch panel'][index];
 card.append(strong, ' · Ligação documentada');
 if (announce) document.querySelector('#route-status').textContent = `Etapa ${index + 1} de 4: ${names[index]}. Demonstração ilustrativa.`;
}
function schedule() {
 clearInterval(timer);
 if (!paused && inView && !document.hidden) timer = setInterval(() => selectStep((step + 1) % 4), 2600);
}
function syncMotion() {
 document.body.classList.toggle('is-paused', paused || !inView || document.hidden);
 toggle.setAttribute('aria-pressed', String(paused));
 toggle.setAttribute('aria-label', paused ? 'Retomar animação' : 'Pausar animação');
 toggle.textContent = paused ? '▶' : 'Ⅱ';
 schedule();
}
toggle.addEventListener('click', () => { paused = !paused; syncMotion(); });
reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; syncMotion(); });
document.addEventListener('visibilitychange', syncMotion);
for (const button of document.querySelectorAll('[data-step]')) {
 button.addEventListener('click', () => { selectStep(Number(button.dataset.step), true); schedule(); });
}
function selectLayer(layer) {
 scene.dataset.layer = layer;
 for (const button of document.querySelectorAll('[data-layer-choice]')) {
  const active = button.dataset.layerChoice === layer;
  button.classList.toggle('active', active);
  button.setAttribute('aria-pressed', String(active));
 }
 const detail = document.querySelector('.layer-detail');
 detail.replaceChildren();
 detail.hidden = layer === 'physical';
 descriptions[layer].forEach((text, index) => {
  const element = document.createElement(index === 0 ? 'b' : 'span');
  element.textContent = text;
  detail.append(element);
 });
 document.querySelector('[data-layer-caption]').textContent = layer === 'physical' ? 'PC-04 → SW-01 · RJ45 Cat6' : descriptions[layer][0] + ' · Exemplo';
}
for (const button of document.querySelectorAll('[data-layer-choice]')) button.addEventListener('click', () => selectLayer(button.dataset.layerChoice));
function selectView(view) {
 scene.dataset.view = view;
 for (const button of document.querySelectorAll('.view-picker [data-view]')) {
  const active = button.dataset.view === view;
  button.classList.toggle('active', active);
  button.setAttribute('aria-pressed', String(active));
 }
}
for (const button of document.querySelectorAll('.view-picker [data-view]')) button.addEventListener('click', () => selectView(button.dataset.view));
for (const button of document.querySelectorAll('[data-feature-view]')) button.addEventListener('click', () => {
 selectView(button.dataset.featureView);
 document.querySelector('.hero').scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start'});
 document.querySelector(`.view-picker [data-view="${button.dataset.featureView}"]`).focus({preventScroll:true});
});
for (const button of document.querySelectorAll('[data-show-layer]')) button.addEventListener('click', () => {
 selectLayer(button.dataset.showLayer);
 scene.scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center'});
 document.querySelector(`[data-layer-choice="${button.dataset.showLayer}"]`).focus({preventScroll:true});
});
document.querySelector('[data-guide-play]').addEventListener('click', () => {
 selectView('campus'); selectLayer('physical'); selectStep(0, true);
 if (!reducedMotion.matches) { paused = false; syncMotion(); }
 document.querySelector('.journey').scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest'});
 steps[0].focus({preventScroll:true});
});
function createPort(index) {
 const port = document.createElement('span'); port.className = 'port';
 const socket = document.createElement('i'); socket.className = 'port-socket';
 port.append(socket, String(index + 1).padStart(2, '0')); return port;
}
document.querySelector('.ports').append(...Array.from({length:8}, (_, i) => createPort(i)));
for (let row = 0; row < 5; row++) {
 const unit = document.createElement('div'); unit.className = 'rack-unit';
 const number = document.createElement('small'); number.textContent = `${24 - row * 2}U`; unit.append(number);
 for (let port = 0; port < 8; port++) unit.append(document.createElement('i'));
 document.querySelector('.rack-units').append(unit);
}
for (let row = 0; row < 3; row++) {
 const unit = document.createElement('span'); unit.className = 'mini-unit';
 for (let port = 0; port < 8; port++) unit.append(document.createElement('i'));
 document.querySelector('.rack-art').append(unit);
}
// Subtle depth on pointer devices; disable when motion is paused or reduced.
scene.addEventListener('pointermove', event => {
 if (paused || reducedMotion.matches || event.pointerType !== 'mouse') return;
 const rect = scene.getBoundingClientRect();
 scene.style.setProperty('--pointer-x', `${((event.clientX - rect.left) / rect.width - .5) * 10}px`);
 scene.style.setProperty('--pointer-y', `${((event.clientY - rect.top) / rect.height - .5) * 7}px`);
});
scene.addEventListener('pointerleave', () => {
 scene.style.setProperty('--pointer-x', '0px'); scene.style.setProperty('--pointer-y', '0px');
});
if ('IntersectionObserver' in window) {
 const reveal = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('visible'); reveal.unobserve(entry.target); }
 }, {threshold:.08});
 for (const section of document.querySelectorAll('.editor-proof,.lenses-section,.audience-section,.trust-section,.faq-section,.closing-line')) {
  section.classList.add('reveal'); reveal.observe(section);
 }
 new IntersectionObserver(entries => { inView = entries[0].isIntersecting; syncMotion(); }, {threshold:0}).observe(document.querySelector('.hero'));
}
selectStep(step); syncMotion();
const stepSymbols = [
 '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
 '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8v6h-2v3h-4v-3H8zM10 8v3m4-3v3"/>',
 '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M5 10v3m4-3v3m4-3v3m4-3v3M5 16h14"/>',
 '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M6 6h1m3 0h7M6 17h1m3 0h7"/>'
];
steps.forEach((button, index) => {button.querySelector('.step-icon').innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${stepSymbols[index]}</svg>`;});
