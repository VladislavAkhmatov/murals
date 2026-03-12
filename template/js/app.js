// Превью (thumbs)
const thumbs = new Swiper('.thumbsSwiper', {
  slidesPerView: 3.5,
  spaceBetween: 10,
  watchSlidesProgress: true,
});

// Основной слайдер
const main = new Swiper('.mainSwiper', {
  spaceBetween: 10,
  navigation: {
    nextEl: '.nav-btn.next',
    prevEl: '.nav-btn.prev',
  },
  thumbs: { swiper: thumbs },
});

// Клики по стрелкам (hotspot)
document.querySelectorAll('.hotspot').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const goTo = Number(btn.dataset.go);
    if (Number.isFinite(goTo)) main.slideTo(goTo);
  });
});

let panzoomInstance = null;
let lensActive = false;
const LENS_SCALE = 2.5;

function bindClickToZoom(slide) {
  const wrap = slide.querySelector('.zoom-wrap');
  if (!wrap || wrap.dataset.clickBound === '1') return;
  wrap.dataset.clickBound = '1';

  wrap.addEventListener('click', (e) => {
    // не реагируем на клики по UI
    if (e.target.closest('.hotspot, .zoom-ui, .muralsPanel, .muralsBtn')) return;
    if (!panzoomInstance) return;

    const isZoomed = wrap.classList.contains('zoomed');

    if (!isZoomed) {
      panzoomInstance.zoomToPoint(
        LENS_SCALE,
        { clientX: e.clientX, clientY: e.clientY },
        { animate: true }
      );

      wrap.classList.add('zoomed');
      main.allowTouchMove = false;
    } else {
      // ⤾ СБРОС
      panzoomInstance.reset({ animate: true });
      wrap.classList.remove('zoomed');
      main.allowTouchMove = true;
    }
  });
}

function bindZoomButtons(slide) {
  const ui = slide.querySelector('.zoom-ui');
  if (!ui || ui.dataset.bound === '1') return;
  ui.dataset.bound = '1';

  ui.querySelectorAll('.zbtn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!panzoomInstance) return;

      const action = btn.dataset.zoom;
      const step = 0.2;

      if (action === 'in') {
        panzoomInstance.zoomIn(step, { animate: true });

      } else if (action === 'out') {
        panzoomInstance.zoomOut(step, { animate: true });

      } else if (action === 'reset') {
        lensActive = false;
        panzoomInstance.reset({ animate: true });
        main.allowTouchMove = true;

      } else if (action === 'lens') {
        // 🔍 toggle
        lensActive = !lensActive;

        if (lensActive) {
          panzoomInstance.zoom(LENS_SCALE, { animate: true });
          main.allowTouchMove = false; // чтобы можно было таскать
        } else {
          panzoomInstance.reset({ animate: true });
          main.allowTouchMove = true;
        }
      }
    });
  });
}

function initZoomForActiveSlide() {
  // убираем старый зум
  if (panzoomInstance) {
    panzoomInstance.destroy();
    panzoomInstance = null;
  }

  const activeSlide = document.querySelector('.mainSwiper .swiper-slide-active');
  if (!activeSlide) return;

  const wrap = activeSlide.querySelector('.zoom-wrap');
  if (!wrap) return;

  panzoomInstance = Panzoom(wrap, {
    maxScale: 4,
    minScale: 1,
    contain: 'outside',
  });


  bindZoomButtons(activeSlide);
  bindClickToZoom(activeSlide);
  // колесо мыши (zoom)
  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    panzoomInstance.zoomWithWheel(e);
  }, { passive: false });

  // если зум > 1 — отключаем свайп, чтобы можно было таскать картинку
  wrap.addEventListener('panzoomchange', () => {
    const scale = panzoomInstance.getScale();
    main.allowTouchMove = scale <= 1.01;
  });
}

// при старте
main.on('init', () => {
  initZoomForActiveSlide();
});

main.on('slideChangeTransitionEnd', () => {
  main.allowTouchMove = true;
  initZoomForActiveSlide();
});

// если ты создаёшь Swiper как const main = new Swiper(...)
// то init уже прошёл, поэтому вызови вручную:
initZoomForActiveSlide();


// двойной клик/тап — сброс
document.addEventListener('dblclick', () => {
  if (panzoomInstance) {
    panzoomInstance.reset();
    main.allowTouchMove = true;
  }
});

const muralsBtn = document.querySelector('.muralsBtn');
const muralsPanel = document.querySelector('#muralsPanel');
const muralsBackdrop = document.querySelector('#muralsBackdrop');

function openMurals(){
  muralsPanel.hidden = false;
  muralsBackdrop.hidden = false;
}

function closeMurals(){
  muralsPanel.hidden = true;
  muralsBackdrop.hidden = true;
}

muralsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (muralsPanel.hidden) openMurals();
  else closeMurals();
});

// клик по затемнению — закрыть
muralsBackdrop.addEventListener('click', closeMurals);

// клик по пункту — перейти и закрыть
document.querySelectorAll('.muralsItem').forEach(btn => {
  btn.addEventListener('click', () => {
    const goTo = Number(btn.dataset.go);
    if (Number.isFinite(goTo)) main.slideTo(goTo);
    closeMurals();
  });
});

// (опционально) ESC закрывает
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMurals();
});

let map;

function initMap() {
  if (map) return;

  const mapEl = document.querySelector('#map');
  if (!mapEl) return;

  map = L.map(mapEl).setView([49.95, 82.62], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(map);

  // на всякий случай
  setTimeout(() => map.invalidateSize(true), 200);
}

initMap();

const murals = [
  {
    title: "Мурал «Алия Молдагулова»",
    lat: 49.951845, 
    lng: 82.610957,
    description: "​Улица Протозанова, 79",
    img: "template/img/murals/mural12.jpg"
  },
  {
    title: "Мурал «Мальчик-хоккеист»",
    lat: 49.951469, 
    description: "Улица Максима Горького, 82",
    lng: 82.616516,
    img: "template/img/murals/mural11.jpg"
  },
  {
    title: "Мурал «Абай Кунанбаев»",
    lat: 49.958773, 
    lng: 82.614111,
    description: "Проспект Абая, 1",
    img: "template/img/murals/mural13.jpg"
  },
  {
    title: "Мурал «Город металлургов»",
    lat: 49.96766, 
    lng: 82.595097,
    description: "Нурсултана Назарбаева проспект, 33",
    img: "template/img/murals/mural14.jpg"
  },
  {
    title: "Мурал «Талгат Жайлауов»",
    lat: 49.978912, 
    lng: 82.580989,
    description: "Нурсултана Назарбаева проспект, 71",
    img: "template/img/murals/mural15.jpg"
  },
  {
    title: "Мурал «Бауыржан Момышулы»",
    lat: 49.951415, 
    lng: 82.635804,
    description: "Улица Кабанбай батыра, 136",
    img: "template/img/murals/mural10.jpeg"
  },
];

murals.forEach(m => {
  const description = m.description ? `<div>${m.description}</div>` : "";
  L.marker([m.lat, m.lng])
    .addTo(map)
    .bindPopup(`
      <b>${m.title}</b><br>
      ${description}
      <img src="${m.img}" style="width:100%;border-radius:8px;margin-top:6px">
    `);
});
