(function() {
	const SUPPORTED_LOCALES = ["en", "pt"];
	const DEFAULT_LOCALE = "en";

	const state = {
		locale: DEFAULT_LOCALE,
		messages: {}
	};

	function detectInitialLocale() {
		const stored = localStorage.getItem("locale");
		if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;
		const nav = navigator.language?.slice(0, 2) || DEFAULT_LOCALE;
		return SUPPORTED_LOCALES.includes(nav) ? nav : DEFAULT_LOCALE;
	}

	async function loadMessages(locale) {
		const res = await fetch(`./i18n/${locale}.json`, { cache: "no-store" });
		if (!res.ok) throw new Error("Failed to load locale file: " + locale);
		return res.json();
	}

	function translateDom() {
		// Plain-text translations
		document.querySelectorAll('[data-i18n]').forEach((el) => {
			const key = el.getAttribute('data-i18n');
			const value = getMessage(key);
			if (value) {
				// If element has no children or only text nodes, replace text directly
				if (el.children.length === 0) {
					el.textContent = value;
				} else {
					// If element has children, only replace direct text nodes
					const childNodes = Array.from(el.childNodes);
					childNodes.forEach(node => {
						if (node.nodeType === Node.TEXT_NODE) {
							node.textContent = value;
						}
					});
				}
			}
		});
		// HTML-enabled translations (use sparingly and only with trusted content)
		document.querySelectorAll('[data-i18n-html]').forEach((el) => {
			const key = el.getAttribute('data-i18n-html');
			const value = getMessage(key);
			if (value) el.innerHTML = value;
		});
		document.documentElement.lang = state.locale;
	}

	function getMessage(path) {
		return path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), state.messages);
	}

async function setLocale(locale) {
		if (!SUPPORTED_LOCALES.includes(locale)) return;
		state.locale = locale;
		localStorage.setItem("locale", locale);
		state.messages = await loadMessages(locale);
		translateDom();
		syncLanguageToggle();
	}

function bindLanguageSwitchers() {
	const select = document.getElementById('lang-select');
	if (select) {
		select.addEventListener('change', () => {
			const lang = select.value;
			setLocale(lang);
		});
	}

	const iconBtn = document.querySelector('.lang-icon-btn');
	if (iconBtn) {
		iconBtn.addEventListener('click', async () => {
			const current = state.locale;
			const next = current === 'en' ? 'pt' : 'en';
			await setLocale(next);
			const sel = document.getElementById('lang-select');
			if (sel) sel.value = next;
			iconBtn.setAttribute('aria-label', next === 'en' ? 'Language: English' : 'Idioma: Português');
			iconBtn.setAttribute('title', next === 'en' ? 'Change language' : 'Mudar idioma');
			updateFlags(next);
		});
	}
}

function syncLanguageToggle() {
	const select = document.getElementById('lang-select');
	if (select) select.value = state.locale;
	const iconBtn = document.querySelector('.lang-icon-btn');
	if (iconBtn) {
		iconBtn.setAttribute('aria-label', state.locale === 'en' ? 'Language: English' : 'Idioma: Português');
		iconBtn.setAttribute('title', state.locale === 'en' ? 'Change language' : 'Mudar idioma');
	}
	updateFlags(state.locale);
}

function updateFlags(locale) {
	const flag = locale === 'en' ? '🇺🇸' : '🇧🇷';
	document.querySelectorAll('.flag-emoji').forEach(el => {
		el.textContent = flag;
		el.setAttribute('data-flag', locale);
	});
}

	function bindAccordion() {
		document.querySelectorAll('.accordion-item').forEach((item) => {
			const trigger = item.querySelector('.accordion-trigger');
			const panel = item.querySelector('.accordion-panel');
			if (!trigger || !panel) return;
			trigger.addEventListener('click', () => {
				const isOpen = trigger.getAttribute('aria-expanded') === 'true';
				trigger.setAttribute('aria-expanded', String(!isOpen));
				panel.hidden = isOpen;
				item.setAttribute('aria-open', String(!isOpen));
			});
		});

		const btnExpand = document.querySelector('.btn-agenda-expand');
		const btnCollapse = document.querySelector('.btn-agenda-collapse');
		if (btnExpand) btnExpand.addEventListener('click', () => {
			document.querySelectorAll('.accordion-item').forEach((item) => {
				const trigger = item.querySelector('.accordion-trigger');
				const panel = item.querySelector('.accordion-panel');
				if (!trigger || !panel) return;
				trigger.setAttribute('aria-expanded', 'true');
				panel.hidden = false;
				item.setAttribute('aria-open', 'true');
			});
		});
		if (btnCollapse) btnCollapse.addEventListener('click', () => {
			document.querySelectorAll('.accordion-item').forEach((item) => {
				const trigger = item.querySelector('.accordion-trigger');
				const panel = item.querySelector('.accordion-panel');
				if (!trigger || !panel) return;
				trigger.setAttribute('aria-expanded', 'false');
				panel.hidden = true;
				item.setAttribute('aria-open', 'false');
			});
		});
	}

	// Init
window.addEventListener("DOMContentLoaded", async () => {
		bindLanguageSwitchers();
		syncLanguageToggle();
		bindAccordion();
	bindMobileMenu();
		initPartnersCarousel();
	initTeamCarousel();
		const initial = detectInitialLocale();
		await setLocale(initial);
});
})();

// Partners carousel
function initPartnersCarousel() {
	const carousel = document.querySelector('#partners .carousel');
	if (!carousel) return;
	const track = carousel.querySelector('.carousel-track');
	const btnPrev = carousel.querySelector('.carousel-prev');
	const btnNext = carousel.querySelector('.carousel-next');
	let slides = Array.from(track.querySelectorAll('.carousel-slide'));
	if (!track || slides.length <= 1) return;

	let index = 0;
	track.style.willChange = 'transform';

	const visibleCount = () => {
		const w = carousel.clientWidth;
		if (w >= 1100) return 3;
		if (w >= 780) return 2;
		return 1;
	};

	function step() {
		if (slides.length < 2) return slides[0].getBoundingClientRect().width;
		const a = slides[0];
		const b = slides[1];
		return Math.max(1, b.offsetLeft - a.offsetLeft);
	}

	let realCount = slides.length;
	function setupClones() {
		const vis = visibleCount();
		const cloneCount = Math.max(1, vis);
		const firstClones = slides.slice(0, cloneCount).map(s => s.cloneNode(true));
		const lastClones = slides.slice(-cloneCount).map(s => s.cloneNode(true));
		firstClones.forEach(c => track.appendChild(c));
		lastClones.forEach(c => track.insertBefore(c, track.firstChild));
		slides = Array.from(track.querySelectorAll('.carousel-slide'));
		index = cloneCount;
		jumpTo(index);
	}

	function jumpTo(i) {
		track.style.transition = 'none';
		track.style.transform = `translateX(${-i * step()}px)`;
	}

	function animateTo(i) {
		track.style.transition = 'transform 400ms ease';
		track.style.transform = `translateX(${-i * step()}px)`;
	}

	function next() { index += 1; animateTo(index); }
	function prev() { index -= 1; animateTo(index); }

	track.addEventListener('transitionend', () => {
		const vis = visibleCount();
		const cloneCount = Math.max(1, vis);
		const endIndex = realCount + cloneCount - 1;
		if (index > endIndex) {
			index = cloneCount;
			jumpTo(index);
		} else if (index < cloneCount) {
			index = realCount + cloneCount - 1;
			jumpTo(index);
		}
	});

	btnNext?.addEventListener('click', next);
	btnPrev?.addEventListener('click', prev);

	let timer = setInterval(next, 3500);
	function pause() { if (timer) { clearInterval(timer); timer = null; } }
	function resume() { if (!timer) timer = setInterval(next, 3500); }
	carousel.addEventListener('mouseenter', pause);
	carousel.addEventListener('mouseleave', resume);
	window.addEventListener('resize', () => jumpTo(index));

	setupClones();
}

function initTeamCarousel() {
	const carousel = document.querySelector('#team .carousel');
	if (!carousel) return;
	const track = carousel.querySelector('.carousel-track');
	const btnPrev = carousel.querySelector('.carousel-prev');
	const btnNext = carousel.querySelector('.carousel-next');
	let slides = Array.from(track.querySelectorAll('.carousel-slide'));
	if (!track || slides.length <= 1) return;

	let index = 0;
	track.style.willChange = 'transform';

	const visibleCount = () => {
		const w = carousel.clientWidth;
		if (w >= 1400) return 5;
		if (w >= 1100) return 4;
		if (w >= 780) return 3;
		if (w >= 480) return 2;
		return 1;
	};

	function step() {
		if (slides.length < 2) return slides[0].getBoundingClientRect().width;
		const a = slides[0];
		const b = slides[1];
		return Math.max(1, b.offsetLeft - a.offsetLeft);
	}

	let realCount = slides.length;
	function setupClones() {
		const vis = visibleCount();
		const cloneCount = Math.max(1, vis);
		const firstClones = slides.slice(0, cloneCount).map(s => s.cloneNode(true));
		const lastClones = slides.slice(-cloneCount).map(s => s.cloneNode(true));
		firstClones.forEach(c => track.appendChild(c));
		lastClones.forEach(c => track.insertBefore(c, track.firstChild));
		slides = Array.from(track.querySelectorAll('.carousel-slide'));
		index = cloneCount;
		jumpTo(index);
	}

	function jumpTo(i) {
		track.style.transition = 'none';
		track.style.transform = `translateX(${-i * step()}px)`;
	}

	function animateTo(i) {
		track.style.transition = 'transform 400ms ease';
		track.style.transform = `translateX(${-i * step()}px)`;
	}

	function next() { index += 1; animateTo(index); }
	function prev() { index -= 1; animateTo(index); }

	track.addEventListener('transitionend', () => {
		const vis = visibleCount();
		const cloneCount = Math.max(1, vis);
		const endIndex = realCount + cloneCount - 1;
		if (index > endIndex) {
			index = cloneCount;
			jumpTo(index);
		} else if (index < cloneCount) {
			index = realCount + cloneCount - 1;
			jumpTo(index);
		}
	});

	btnNext?.addEventListener('click', next);
	btnPrev?.addEventListener('click', prev);

	let timer = setInterval(next, 4500);
	function pause() { if (timer) { clearInterval(timer); timer = null; } }
	function resume() { if (!timer) timer = setInterval(next, 4500); }
	carousel.addEventListener('mouseenter', pause);
	carousel.addEventListener('mouseleave', resume);
	window.addEventListener('resize', () => jumpTo(index));

	setupClones();
}

function bindMobileMenu() {
	const toggle = document.querySelector('.nav-toggle');
	const menu = document.getElementById('mobile-menu');
	if (!toggle || !menu) return;
	toggle.addEventListener('click', () => {
		const expanded = toggle.getAttribute('aria-expanded') === 'true';
		toggle.setAttribute('aria-expanded', String(!expanded));
		if (expanded) {
			menu.hidden = true;
			toggle.setAttribute('aria-label', 'Open menu');
		} else {
			menu.hidden = false;
			toggle.setAttribute('aria-label', 'Close menu');
		}
	});
	// Close on link click
	menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
		menu.hidden = true;
		toggle.setAttribute('aria-expanded', 'false');
		toggle.setAttribute('aria-label', 'Open menu');
	}));
}


