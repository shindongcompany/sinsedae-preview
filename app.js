/* 신세대 지붕공사 — 전 페이지 공통 스크립트
   페이지에 해당 요소가 있을 때만 각 기능이 동작합니다. */
(() => {
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const CFG = window.SINSEDAE_CONFIG || {};
  const ENDPOINT = (CFG.ENDPOINT || '').trim();
  const MAIN5 = ['양주', '동두천', '일산', '포천', '연천'];

  /* 섹션 안에서 얼마나 스크롤했는지 0~1 */
  const progressIn = (el) => {
    const r = el.getBoundingClientRect();
    const span = el.offsetHeight - innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : (r.top < innerHeight * 0.5 ? 1 : 0);
  };
  /* 화면 근처(위아래 반 화면)에 있는지: 멀리 있는 섹션은 계산하지 않음 */
  const near = (el) => { const r = el.getBoundingClientRect(); return r.bottom > -innerHeight * 0.5 && r.top < innerHeight * 1.5; };

  /* 스크롤 처리는 한 프레임에 한 번만 */
  const onScrollFns = [];
  const onResizeFns = [];
  let ticking = false;
  const tick = () => { ticking = false; onScrollFns.forEach((f) => f()); };
  const requestTick = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
  addEventListener('scroll', requestTick, { passive: true });
  addEventListener('resize', () => { onResizeFns.forEach((f) => f()); requestTick(); });

  /* ───────── 공통: 헤더 · 모바일 하단 바 · 오른쪽 아래 버튼 ───────── */
  const header = $('.site-header');
  const hero = $('#hero');
  onScrollFns.push(() => {
    const y = scrollY;
    if (hero) {
      const b = hero.getBoundingClientRect().bottom;
      header.classList.toggle('is-solid', b < 80);
      document.body.classList.toggle('past-hero', b < innerHeight * 0.35);
    }
    document.body.classList.toggle('scrolled', y > innerHeight * 0.8);
  });

  const menuBtn = $('.menu-btn');
  const menu = $('#m-menu');
  if (menuBtn && menu) {
    const setMenu = (open) => {
      menu.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      document.body.classList.toggle('menu-open', open);
    };
    menuBtn.addEventListener('click', () => setMenu(menu.hidden));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
  }

  /* 카카오톡 상담 버튼: 채널 주소가 있으면 새 창으로 채팅, 없으면 시안에서는 안내만 / 오픈 때는 숨김 */
  const KAKAO = (CFG.KAKAO_URL || '').trim();
  $$('.kakao-link').forEach((a) => {
    if (KAKAO) { a.href = KAKAO; a.target = '_blank'; a.rel = 'noopener'; return; }
    if (!CFG.SHOW_DRAFT_SLOTS) { a.remove(); return; }
    a.addEventListener('click', (e) => { e.preventDefault(); toast('카카오톡 채널 주소를 받으면 이 버튼이 채팅으로 연결됩니다.'); });
  });
  document.body.classList.toggle('has-kakao', !!(KAKAO || CFG.SHOW_DRAFT_SLOTS));
  function toast(msg) {
    let t = $('.toast');
    if (!t) { t = document.createElement('p'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* PC에서 전화 링크: 걸 수 없으니 번호를 크게 보여 주고 복사 */
  const telDialog = $('#tel-dialog');
  if (telDialog && finePointer && telDialog.showModal) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="tel:"]');
      if (!a) return;
      e.preventDefault();
      $('#tel-copy').textContent = '번호 복사';
      telDialog.showModal();
    });
    $('#tel-copy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText('0507-1379-7436'); $('#tel-copy').textContent = '복사했습니다'; } catch (err) { $('#tel-copy').textContent = '복사하지 못했습니다'; }
    });
    $('#tel-close').addEventListener('click', () => telDialog.close());
    telDialog.addEventListener('click', (e) => { if (e.target === telDialog) telDialog.close(); });
  }

  /* ───────── 메인 히어로: 영상 · 카피 모션 ───────── */
  if (hero) {
    const video = $('#hero-video');
    const btn = $('#hero-pause');
    const setPaused = (paused) => {
      if (paused) video.pause(); else video.play().catch(() => {});
      btn.setAttribute('aria-pressed', String(paused));
      btn.setAttribute('aria-label', paused ? '배경 영상 재생' : '배경 영상 멈춤');
    };
    if (reduce) setPaused(true);
    btn.addEventListener('click', () => setPaused(!video.paused));
    // 화면 밖에서는 재생을 멈춰 배터리·데이터 절약
    new IntersectionObserver(([e]) => {
      if (btn.getAttribute('aria-pressed') === 'true') return;
      if (e.isIntersecting) video.play().catch(() => {}); else video.pause();
    }).observe(hero);

    /* 메인 카피: 글자를 단어(.w) > 글자(.ch)로 나누고 가로 위치(--x 0~1)를 붙임 → 지붕선이 지나간 자리부터 글자가 나타남 */
    const ht = $('.ht', hero);
    $$('.ln', ht).forEach((ln) => {
      const words = ln.textContent.trim().split(/\s+/);
      ln.textContent = '';
      const inner = document.createElement('span');
      words.forEach((word, wi) => {
        const w = document.createElement('span');
        w.className = 'w';
        [...word].forEach((c) => {
          const ch = document.createElement('span');
          ch.className = 'ch';
          ch.textContent = c;
          w.appendChild(ch);
        });
        inner.appendChild(w);
        if (wi < words.length - 1) inner.appendChild(document.createTextNode(' '));
      });
      ln.appendChild(inner);
    });
    const chars = $$('.ch', ht);
    const placeChars = () => {
      const box = ht.getBoundingClientRect();
      chars.forEach((ch) => {
        const r = ch.getBoundingClientRect();
        ch.style.setProperty('--x', ((r.left + r.width / 2 - box.left) / box.width).toFixed(3));
      });
      // 지붕선: 실제 픽셀 크기로 경로를 그려 선 두께가 늘어나지 않게 함
      const roof = $('.ht-roof', hero);
      const { width: w, height: h } = roof.getBoundingClientRect();
      if (w) {
        const path = $('path', roof);
        roof.setAttribute('viewBox', `0 0 ${w} ${h}`);
        path.setAttribute('d', `M2 ${h - 2} L${w / 2} 2 L${w - 2} ${h - 2}`);
        roof.style.setProperty('--len', Math.ceil(path.getTotalLength()) + 1);
      }
    };
    onResizeFns.push(() => hero.classList.contains('is-play') && placeChars());
    const play = () => {
      hero.classList.remove('is-play');
      placeChars();
      void hero.offsetWidth; // 애니메이션 다시 시작
      hero.classList.add('is-play');
    };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(play);
    setTimeout(() => hero.classList.contains('is-play') || play(), 1200); // 글꼴이 늦어도 1.2초 안에 시작
  }

  /* 3D 캐릭터: img/char/*.png 가 있으면 SVG 캐릭터를 그 이미지로 교체 */
  const root = document.body.dataset.page === 'index' ? '' : '../';
  Object.entries({ 'ch-customer': 'img/char/customer.png', 'ch-boss': 'img/char/boss.png' }).forEach(([id, src]) => {
    if (!document.querySelector(`use[href="#${id}"]`)) return;
    const probe = new Image();
    probe.onload = () => {
      $$(`use[href="#${id}"]`).forEach((u) => {
        const im = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        im.setAttribute('href', root + src);
        im.setAttribute('x', '0'); im.setAttribute('y', '0');
        im.setAttribute('width', '200'); im.setAttribute('height', '220');
        im.setAttribute('preserveAspectRatio', 'xMidYMax meet');
        u.replaceWith(im);
      });
    };
    probe.src = root + src;
  });

  /* 화면에 들어오면 한 번 is-in (대화 말풍선, 진행 과정 그림 속 말풍선) */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -18% 0px' });
  $$('.msg, .step').forEach((el) => (reduce ? el.classList.add('is-in') : io.observe(el)));

  /* ───────── 메인: 네 가지 약속 (항목 하나에 손가락 하나) ───────── */
  const promise = $('.promise');
  if (promise) {
    const items = $$('.promise-list li');
    const fingers = $$('.finger');
    const handN = $('#hand-n');
    let handImgs = [];
    const update = () => {
      if (!near(promise)) return;
      // 고정 구간을 4칸으로 나눠 한 칸마다 문구 하나씩 (움직임 줄이기면 전부)
      const n = reduce ? items.length : Math.min(items.length, Math.floor(progressIn(promise) * items.length) + 1);
      items.forEach((li, i) => li.classList.toggle('is-in', i < n));
      fingers.forEach((f) => f.classList.toggle('up', +f.dataset.n <= n));
      handImgs.forEach((im, i) => { im.classList.toggle('on', i + 1 === n); im.classList.toggle('idle', n === 0 && i === 0); });
      handN.textContent = n;
    };
    onScrollFns.push(update);
    /* 3D 손 이미지: img/hand/hand-1~4.png 가 모두 있으면 손가락 개수별 이미지로 교체 */
    Promise.all([1, 2, 3, 4].map((i) => new Promise((ok, no) => {
      const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = `img/hand/hand-${i}.png`; im.alt = '';
    }))).then((ims) => {
      $('.hand-photos').append(...ims);
      handImgs = ims;
      document.documentElement.classList.add('has-hand-img');
      update();
    }).catch(() => {});
  }

  /* ───────── 메인: 시공 분야 (화면이 고정된 채 스크롤 한 칸마다 공종이 하나씩 바뀜) ───────── */
  const service = $('.service');
  if (service) {
    const grid = $('.service-grid', service);
    const steps = $$('.svc-steps li', service);
    const slides = $$('.svc-slide', service);
    const num = $('#svc-n');
    const n = steps.length;
    let cur = 0;
    const show = (i) => {
      if (i === cur) return;
      service.style.setProperty('--dir', i > cur ? 1 : -1);
      cur = i;
      grid.style.setProperty('--i', i);
      steps.forEach((li, k) => li.classList.toggle('is-on', k === i));
      slides.forEach((sl, k) => sl.classList.toggle('is-on', k === i));
      num.textContent = i + 1;
    };
    // 스크롤 위치 → 공종 번호 (고정 구간을 n칸으로 똑같이 나눔)
    onScrollFns.push(() => {
      if (reduce || !near(service)) return;
      show(Math.min(n - 1, Math.floor(progressIn(service) * n)));
    });
    // 공종 이름을 누르면 그 칸 가운데로 스크롤 (움직임 줄이기면 바로 교체)
    $$('[data-step]', service).forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      const i = +a.dataset.step;
      if (reduce) { show(i); return; }
      const span = service.offsetHeight - innerHeight;
      scrollTo({ top: service.offsetTop + span * ((i + 0.5) / n), behavior: 'smooth' });
    }));
  }

  /* ───────── 지역 지도 (메인: 스크롤로 하나씩 / 견적 문의: 전체 표시) ───────── */
  const ORDER = ['yangju', 'dongducheon', 'ilsan', 'pocheon', 'yeoncheon'];
  const NAMES = { yangju: '양주', dongducheon: '동두천', ilsan: '일산', pocheon: '포천', yeoncheon: '연천', paju: '파주', uijeongbu: '의정부', namyangju: '남양주', gapyeong: '가평', cheorwon: '철원', deogyang: '고양 덕양' };
  const NUDGE = { dongducheon: [0, 4], uijeongbu: [0, 2], ilsan: [6, 0] };
  const buildMap = (box) => {
    const M = window.MAP_DATA;
    if (!M || !box) return;
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${M.w} ${M.h}`);
    const gR = document.createElementNS(NS, 'g');
    const gL = document.createElementNS(NS, 'g');
    const gP = document.createElementNS(NS, 'g');
    Object.entries(M.regions).forEach(([key, r]) => {
      const main = ORDER.includes(key);
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', r.d);
      p.setAttribute('class', `rg ${main ? '' : 'rg-ctx'}`);
      p.dataset.key = key;
      gR.appendChild(p);
      const [dx, dy] = NUDGE[key] || [0, 0];
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', r.cx + dx); t.setAttribute('y', r.cy + dy + 5);
      t.setAttribute('class', `rg-label ${main ? '' : 'ctx'}`);
      t.dataset.key = key;
      t.textContent = NAMES[key];
      gL.appendChild(t);
      if (main) {
        const pin = document.createElementNS(NS, 'g');
        pin.setAttribute('class', 'pin'); pin.dataset.key = key;
        pin.innerHTML = `<path d="M${r.cx + dx} ${r.cy + dy - 14}c-12 0-20 9-20 19 0 14 20 30 20 30s20-16 20-30c0-10-8-19-20-19z" transform="translate(0,-40)" fill="#26323A"/><circle cx="${r.cx + dx}" cy="${r.cy + dy - 35}" r="7" fill="#D4AE7C"/>`;
        gP.appendChild(pin);
      }
    });
    svg.append(gR, gL, gP);
    box.appendChild(svg);
  };
  const area = $('.area');
  if (area) {
    const box = $('#area-map');
    buildMap(box);
    const items = $$('.area-list li');
    let step = -2;
    onScrollFns.push(() => {
      if (!near(area)) return;
      const p = reduce ? 1 : progressIn(area);
      const s = Math.min(ORDER.length, Math.floor(p * (ORDER.length + 1.2))); // 0~4: 하나씩, 5: 전체
      if (s === step) return;
      step = s;
      ORDER.forEach((key, i) => {
        const on = i <= s;
        const now = i === s;
        $$(`[data-key="${key}"]`, box).forEach((el) => { el.classList.toggle('on', on && !now); el.classList.toggle('now', now); });
        items[i].classList.toggle('on', on && !now);
        items[i].classList.toggle('now', now);
      });
    });
  }
  $$('[data-map="static"]').forEach((box) => {
    buildMap(box);
    ORDER.forEach((key) => $$(`[data-key="${key}"]`, box).forEach((el) => el.classList.add('on')));
  });

  /* ───────── 메인: 한 번 넘길 때 한 섹션씩 (휠·스와이프 모두) ─────────
     브라우저 기본 스크롤 스냅을 써서 PC 휠, 트랙패드, 모바일 스와이프가 모두 자연스럽게 동작
     - 각 섹션 시작에서 멈춤 (화면보다 긴 섹션은 안에서는 자유롭게 스크롤)
     - 시공 분야·방문 지역은 단계마다 멈춤 표시(.snap-mark)를 넣어 한 번에 한 항목씩
     - 섹션이 들어오면 제목과 내용이 차례로 올라오며 나타남 */
  if (hero && !reduce) {
    document.documentElement.classList.add('snap');
    const marks = [];
    const addMarks = (sec, fracs) => fracs.forEach((f) => {
      const m = document.createElement('span');
      m.className = 'snap-mark';
      m.setAttribute('aria-hidden', 'true');
      m.dataset.f = f;
      sec.appendChild(m);
      marks.push(m);
    });
    // 네 가지 약속: 문구 4개, 각 칸의 가운데
    if (promise) { const n = $$('.promise-list li', promise).length; addMarks(promise, [...Array(n)].map((_, i) => (i + 0.5) / n)); }
    // 시공 분야: 공종 n개, 각 칸의 가운데 (공종 계산 floor(p*n) 과 같은 기준)
    if (service) { const n = $$('.svc-steps li', service).length; addMarks(service, [...Array(n)].map((_, i) => (i + 0.5) / n)); }
    // 방문 지역: 5곳 하나씩 + 전체 (floor(p*6.2) 기준)
    if (area) addMarks(area, [0, 1, 2, 3, 4, 5].map((k) => (k + 0.5) / 6.2));
    const placeMarks = () => marks.forEach((m) => {
      const sec = m.parentElement;
      m.style.top = `${Math.round((sec.offsetHeight - innerHeight) * m.dataset.f)}px`;
    });
    placeMarks();
    onResizeFns.push(placeMarks);

    // 섹션 등장 연출: 제목 → 내용 순서로 (한 번만)
    const REVEAL = ['.talk .h-section', '.persona-card', '.talk-cta', '.promise .h-section', '.hand-wrap', '.promise .more-link',
      '#cases .sec-head', '#cases .ba', '#cases .gallery', '#reviews .h-section', '#review-grid', '.cta-band-in',
      '.process .h-section', '.steps-wrap', '.area-copy .h-section', '.area-list', '.area-map',
      '#blog .sec-head', '#blog .lead', '#blog-grid', '.faq .h-section', '.faq details', '.faq .more-link',
      '.quote-intro', '.quote-form'];
    const secs = $$('main > section, main > aside').filter((x) => x !== hero);
    secs.forEach((sec) => {
      $$(REVEAL.join(','), sec).forEach((el, i) => { el.setAttribute('data-reveal', ''); el.style.setProperty('--d', i); });
    });
    const shownIO = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-shown'); shownIO.unobserve(e.target); }
    }), { threshold: 0.18 });
    secs.forEach((sec) => shownIO.observe(sec));
  }

  /* ───────── 전후 비교 슬라이더 (처음 보일 때 손잡이가 한 번 좌우로 움직여 조작법을 알려 줌) ───────── */
  $$('.ba-frame').forEach((f) => {
    const range = $('.ba-range', f);
    const set = () => f.style.setProperty('--pos', range.value + '%');
    range.addEventListener('input', set);
    set();
    if (reduce) return;
    let touched = false;
    range.addEventListener('pointerdown', () => { touched = true; });
    new IntersectionObserver(([e], obs) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const keys = [50, 34, 64, 50];
      const dur = 1600;
      const t0 = performance.now() + 300;
      const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
      const frame = (now) => {
        if (touched) return;
        const t = clamp((now - t0) / dur, 0, 1) * (keys.length - 1);
        const i = Math.min(Math.floor(t), keys.length - 2);
        range.value = keys[i] + (keys[i + 1] - keys[i]) * ease(t - i);
        set();
        if (t < keys.length - 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }, { threshold: 0.6 }).observe(f);
  });

  /* ───────── 고객 후기 (reviews-data.js) ───────── */
  const reviewSec = $('#reviews');
  if (reviewSec) {
    const list = window.REVIEWS || [];
    const grid = $('#review-grid');
    if (list.length) {
      grid.innerHTML = list.slice(0, 4).map((r) => `<figure class="review">
        <blockquote>${esc(r.text)}</blockquote>
        <figcaption><b>${esc(r.who || '')}</b><span>${esc([r.service, r.date].filter(Boolean).join(' · '))}</span>${r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(r.source || '원문 보기')}</a>` : `<span>${esc(r.source || '')}</span>`}</figcaption>
      </figure>`).join('');
      reviewSec.hidden = false;
    } else if (CFG.SHOW_DRAFT_SLOTS) {
      grid.innerHTML = [1, 2, 3].map(() => '<figure class="review review-slot"><em class="draft-note">실제 고객 후기 자리 — 방문자 리뷰·고객 동의 받은 후기만 넣습니다</em></figure>').join('');
      reviewSec.hidden = false;
    }
  }

  /* ───────── 블로그 글 (메인 6개 · 현장 이야기 · 시공 사례 · 시공 분야 관련 글) ───────── */
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  const fmt = (d) => { const t = new Date(d); return `${t.getFullYear()}.${String(t.getMonth() + 1).padStart(2, '0')}.${String(t.getDate()).padStart(2, '0')}`; };
  const postCard = (p) => {
    const isNew = Date.now() - new Date(p.date).getTime() < 48 * 3600e3;
    const tags = [p.region, p.service].filter(Boolean).map((t) => `<span>${esc(t)}</span>`).join('');
    return `<a class="post" data-k="${esc(p.link)}" href="${esc(p.link)}" target="_blank" rel="noopener">
      <div class="post-thumb">${p.thumb ? `<img src="${esc(p.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}${isNew ? '<span class="post-new">NEW</span>' : ''}</div>
      ${tags ? `<div class="post-tags">${tags}</div>` : ''}
      <h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p>
      <time datetime="${new Date(p.date).toISOString()}">${fmt(p.date)}</time></a>`;
  };
  const emptyMsg = '<p class="blog-empty">조건에 맞는 글이 아직 없습니다. <a href="https://blog.naver.com/oppo469" target="_blank" rel="noopener">네이버 블로그에서 보기</a></p>';
  const loadPosts = (type, limit) => new Promise((ok) => {
    const snap = (window.BLOG_POSTS || []).slice();
    if (!ENDPOINT) { ok(snap); return; }
    fetch(`${ENDPOINT}?type=${type}&limit=${limit}`).then((r) => r.json())
      .then((d) => ok(d.ok && d.posts && d.posts.length ? d.posts : snap)).catch(() => ok(snap));
  });

  const homeGrid = $('#blog-grid');
  if (homeGrid) {
    const limit = +homeGrid.dataset.limit || 6;
    homeGrid.innerHTML = (window.BLOG_POSTS || []).slice(0, limit).map(postCard).join('') || emptyMsg;
    if (ENDPOINT) loadPosts('blog', limit).then((ps) => { homeGrid.innerHTML = ps.slice(0, limit).map(postCard).join('') || emptyMsg; });
  }

  /* 필터 버튼: 누르면 state를 바꾸고 주소(?service=&region=)에도 남김 */
  function bindFilters(box, state, onChange) {
    $$('.filter-row', box).forEach((row) => {
      const key = row.dataset.key;
      $$('button', row).forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.v === state[key]));
        b.addEventListener('click', () => {
          state[key] = b.dataset.v;
          $$('button', row).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          const u = new URL(location.href);
          ['service', 'region'].forEach((k) => (state[k] ? u.searchParams.set(k, state[k]) : u.searchParams.delete(k)));
          history.replaceState(null, '', u);
          onChange();
        });
      });
    });
  }
  /* 카드 재배치 모션: 남는 카드는 새 자리로 미끄러지고, 새 카드는 나타남 */
  function flipRender(grid, render) {
    const before = new Map($$('[data-k]', grid).map((el) => [el.dataset.k, el.getBoundingClientRect()]));
    render();
    if (reduce) return;
    $$('[data-k]', grid).forEach((el) => {
      const b = before.get(el.dataset.k);
      const a = el.getBoundingClientRect();
      if (b) {
        const dx = b.left - a.left; const dy = b.top - a.top;
        if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' });
      } else {
        el.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
      }
    });
  }

  /* 현장 이야기: 필터 + 더 보기 */
  const list = $('#post-list');
  if (list) {
    const PAGE = 12;
    const qs = new URLSearchParams(location.search);
    const state = { service: qs.get('service') || '', region: qs.get('region') || '', n: PAGE };
    let all = [];
    const filtersBox = $('#filters');
    const count = $('#list-count');
    const more = $('#list-more');
    const match = (p) => (!state.service || p.service === state.service)
      && (!state.region || (state.region === '기타' ? !MAIN5.includes(p.region) : p.region === state.region));
    const render = () => {
      const hit = all.filter(match);
      list.innerHTML = hit.slice(0, state.n).map(postCard).join('') || emptyMsg;
      count.textContent = `${hit.length}건`;
      more.hidden = hit.length <= state.n;
    };
    const flip = () => flipRender(list, render);
    bindFilters(filtersBox, state, () => { state.n = PAGE; flip(); });
    more.addEventListener('click', () => { state.n += PAGE; flip(); });
    loadPosts('blog', 50).then((ps) => {
      all = ps;
      render();
    });
  }

  /* 시공 사례: cases-data.js (광고주 현장 사진) + 필터 + 상세 창 */
  const caseGrid = $('#case-grid');
  if (caseGrid) {
    const CASES = (window.CASES || []).map((c, i) => ({ ...c, k: `c${i}` }));
    const PAGE = 12;
    const qs = new URLSearchParams(location.search);
    const state = { service: qs.get('service') || '', region: qs.get('region') || '', n: PAGE };
    const box = $('#filters');
    const count = $('#list-count');
    const more = $('#list-more');
    // 지역이 적힌 사례가 없으면 지역 필터는 숨김
    if (!CASES.some((c) => c.region)) { $('.filter-row[data-key="region"]', box).hidden = true; state.region = ''; }
    // 사례가 하나도 없는 공종·지역 버튼은 숨김 (사례가 생기면 자동으로 나타남)
    const has = { service: (v) => CASES.some((c) => c.service === v),
      region: (v) => CASES.some((c) => (v === '기타' ? c.region && !MAIN5.includes(c.region) : c.region === v)) };
    $$('.filter-row', box).forEach((row) => $$('button[data-v]', row).forEach((b) => {
      const v = b.dataset.v;
      if (v && !has[row.dataset.key](v)) { b.hidden = true; if (state[row.dataset.key] === v) state[row.dataset.key] = ''; }
    }));
    const src = (u) => (/^https?:/.test(u) ? u : `../${u}`);
    const match = (c) => (!state.service || c.service === state.service)
      && (!state.region || (state.region === '기타' ? c.region && !MAIN5.includes(c.region) : c.region === state.region));
    const render = () => {
      const hit = CASES.filter(match);
      caseGrid.innerHTML = hit.slice(0, state.n).map((c) => `<button type="button" class="case-card" data-k="${c.k}">
        <span class="case-thumb"><img src="${esc(src(c.photos[0]))}" alt="" loading="lazy">${c.photos.length > 1 ? `<span class="case-n">사진 ${c.photos.length}장</span>` : ''}</span>
        <span class="post-tags">${[c.region, c.service].filter(Boolean).map((t) => `<span>${esc(t)}</span>`).join('')}</span>
        <span class="case-title">${esc(c.title)}</span>
        ${c.period ? `<span class="case-meta">공사 기간 ${esc(c.period)}</span>` : ''}
        ${c.draft ? '<em class="draft-note">시안용 임시 사례</em>' : ''}
      </button>`).join('') || '<p class="blog-empty">조건에 맞는 사례가 아직 없습니다.</p>';
      count.textContent = `${hit.length}건`;
      more.hidden = hit.length <= state.n;
    };
    bindFilters(box, state, () => { state.n = PAGE; flipRender(caseGrid, render); });
    more.addEventListener('click', () => { state.n += PAGE; flipRender(caseGrid, render); });
    render();

    const dlg = $('#case-dialog');
    const big = $('#cd-img');
    const thumbs = $('#cd-thumbs');
    const TYPE = { 기와: '지붕 교체', 징크: '지붕 교체', 칼라강판: '지붕 교체', 옥상방수: '옥상 방수', 빗물받이: '빗물받이', 외벽: '외벽' };
    const open = (c) => {
      const setBig = (u, i) => { big.src = src(u); big.alt = `${c.title} 사진 ${i + 1}`; $$('button', thumbs).forEach((b, j) => b.setAttribute('aria-pressed', String(j === i))); };
      thumbs.innerHTML = c.photos.length > 1 ? c.photos.map((u, i) => `<button type="button" aria-label="사진 ${i + 1}"><img src="${esc(src(u))}" alt=""></button>`).join('') : '';
      $$('button', thumbs).forEach((b, i) => b.addEventListener('click', () => setBig(c.photos[i], i)));
      setBig(c.photos[0], 0);
      $('#cd-tags').innerHTML = [c.region, c.service].filter(Boolean).map((t) => `<span>${esc(t)}</span>`).join('');
      $('#cd-title').textContent = c.title;
      $('#cd-meta').innerHTML = [['지역', c.region], ['공사 기간', c.period], ['자재', c.material]].filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
      $('#cd-note').textContent = c.note || '';
      $('#cd-quote').href = `../contact/?type=${encodeURIComponent(TYPE[c.service] || '')}&interest=${encodeURIComponent(c.title)}`;
      dlg.showModal();
    };
    caseGrid.addEventListener('click', (e) => {
      const b = e.target.closest('.case-card');
      if (b) open(CASES.find((c) => c.k === b.dataset.k));
    });
    $('#cd-close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  /* 시공 분야: 공종별 관련 블로그 글 3개 + 공종 탭 위치 표시 */
  const svcBoxes = $$('.svc-cases');
  if (svcBoxes.length) {
    loadPosts('blog', 50).then((ps) => {
      const used = {};
      svcBoxes.forEach((box) => {
        const s = box.dataset.service;
        const from = used[s] || 0;
        const hit = ps.filter((p) => p.service === s).slice(from, from + 3);
        used[s] = from + 3;
        if (!hit.length) return;
        box.innerHTML = `<p class="svc-cases-h">현장 이야기</p><ul>${hit.map((p) => `<li><a href="${esc(p.link)}" target="_blank" rel="noopener">${p.thumb ? `<img src="${esc(p.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<span></span>'}<span>${esc(p.title)}</span></a></li>`).join('')}</ul>`;
      });
    });
  }
  const tabs = $('.svc-tabs');
  if (tabs) {
    const links = $$('a', tabs);
    const setActive = (id) => links.forEach((a) => {
      const on = a.getAttribute('href') === `#${id}`;
      if (on) { a.setAttribute('aria-current', 'true'); tabs.firstElementChild.scrollTo({ left: a.offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth' }); } else a.removeAttribute('aria-current');
    });
    const obs = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-40% 0px -55% 0px' });
    $$('.svc').forEach((s) => obs.observe(s));
  }

  /* ───────── CTA: 누른 위치 기록 + 견적 폼 미리 채우기 ───────── */
  const form = $('#quote-form');
  let interest = '';
  const interestBox = $('#interest');
  const setInterest = (v) => {
    interest = v || '';
    if (!interestBox) return;
    interestBox.hidden = !interest;
    $('span', interestBox).textContent = interest ? `보고 온 공사: ${interest}` : '';
  };
  const prefill = ({ type, region, interest: inter, focus }) => {
    if (!form) return;
    if (type) $$('input[name="type"]', form).forEach((c) => { if (c.value === type) c.checked = true; });
    if (region) form.region.value = MAIN5.includes(region) ? region : '그 밖의 지역';
    if (inter) setInterest(inter);
    if (focus === 'photo') setTimeout(() => $('#f-photo').focus({ preventScroll: true }), reduce ? 0 : 700);
  };
  if (interestBox) $('button', interestBox).addEventListener('click', () => setInterest(''));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-cta], a[data-region], a[data-type]');
    if (!a) return;
    if (a.dataset.cta) sessionStorage.setItem('sd_cta', a.dataset.cta);
    if (a.getAttribute('href') === '#quote') prefill(a.dataset);
  });
  if (form) {
    const q = new URLSearchParams(location.search);
    prefill({ type: q.get('type'), region: q.get('region'), interest: q.get('interest') });
  }

  /* 유입 정보: 광고 파라미터·UTM을 세션에 보관해 접수 시 함께 기록 */
  const qs0 = new URLSearchParams(location.search);
  if ([...qs0.keys()].some((k) => /^(utm_|n_)/.test(k))) {
    sessionStorage.setItem('sd_src', JSON.stringify({
      source: ['utm_source', 'utm_medium', 'utm_campaign', 'n_media', 'n_ad_group'].map((k) => qs0.get(k)).filter(Boolean).join(' / '),
      keyword: qs0.get('n_keyword') || qs0.get('n_query') || qs0.get('utm_term') || '',
    }));
  }
  if (!sessionStorage.getItem('sd_src') && document.referrer && new URL(document.referrer).host !== location.host) {
    sessionStorage.setItem('sd_src', JSON.stringify({ source: new URL(document.referrer).hostname, keyword: '' }));
  }

  /* ───────── 견적 신청 폼 ───────── */
  if (!form) { requestTick(); return; }
  const photoBox = $('#photos');
  const photoAdd = $('.photo-add', photoBox);
  const photoInput = $('#f-photo');
  const photos = [];
  const shrink = (file) => new Promise((ok, no) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      const s = Math.min(1, 1600 / Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL('image/jpeg', 0.82));
    };
    im.onerror = () => { URL.revokeObjectURL(url); no(new Error('이미지를 읽을 수 없습니다.')); };
    im.src = url;
  });
  const drawPhotos = () => {
    $$('.photo-thumb', photoBox).forEach((n) => n.remove());
    photos.forEach((data, i) => {
      const d = document.createElement('div');
      d.className = 'photo-thumb';
      d.innerHTML = `<img src="${data}" alt="첨부 사진 ${i + 1}"><button type="button" aria-label="사진 ${i + 1} 삭제">×</button>`;
      $('button', d).addEventListener('click', () => { photos.splice(i, 1); drawPhotos(); });
      photoBox.insertBefore(d, photoAdd);
    });
    photoAdd.hidden = photos.length >= 3;
  };
  photoInput.addEventListener('change', async () => {
    for (const f of [...photoInput.files].slice(0, 3 - photos.length)) {
      try { photos.push(await shrink(f)); } catch (err) { /* 읽을 수 없는 파일은 건너뜀 */ }
    }
    photoInput.value = '';
    drawPhotos();
  });

  const done = $('#quote-done');
  const phone = form.phone;
  phone.addEventListener('input', () => {
    const d = phone.value.replace(/\D/g, '').slice(0, 11);
    phone.value = d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
  });
  const mark = (el, ok) => el.closest('.field').classList.toggle('has-error', !ok);
  const submitBtn = $('#f-submit');
  const SUBMIT = submitBtn.textContent;
  const sendErr = $('#e-send');
  const showDone = () => { form.hidden = true; done.hidden = false; done.focus(); };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.website.value) return;
    sendErr.classList.remove('show');
    const agree = $('#f-agree');
    const checks = [
      [form.name.value.trim().length > 0, form.name],
      [/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.value), phone],
      [!!form.region.value, form.region],
    ];
    checks.forEach(([ok, el]) => mark(el, ok));
    $('#e-agree').classList.toggle('show', !agree.checked);
    const first = [...checks, [agree.checked, agree]].find(([ok]) => !ok);
    if (first) { first[1].focus(); return; }

    const src = JSON.parse(sessionStorage.getItem('sd_src') || 'null') || { source: '직접 방문', keyword: '' };
    const types = $$('input[name="type"]:checked', form).map((c) => c.value);
    if (interest) types.push(`관심: ${interest}`);
    const payload = {
      name: form.name.value.trim(),
      phone: phone.value,
      region: form.region.value,
      types,
      message: form.message.value.trim(),
      photos: photos.map((data) => ({ data })),
      agree: true,
      source: src.source,
      keyword: src.keyword,
      device: matchMedia('(max-width: 640px)').matches ? '모바일' : 'PC',
      cta: `${document.body.dataset.page} / ${sessionStorage.getItem('sd_cta') || '직접 스크롤'}`,
      website: form.website.value,
    };
    if (!ENDPOINT) { console.info('[시안 모드] 전송하지 않음', { ...payload, photos: photos.length }); showDone(); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = '보내는 중…';
    try {
      // text/plain으로 보내면 브라우저 사전 요청(CORS preflight) 없이 Apps Script로 바로 전달됨
      const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || '접수에 실패했습니다.');
      // TODO(오픈 시): 네이버 프리미엄 로그분석 전환 스크립트(신청 완료)를 여기서 호출
      if (window.gtag) window.gtag('event', 'generate_lead', { region: payload.region, cta: payload.cta });
      showDone();
    } catch (err) {
      sendErr.textContent = `${err.message && !/fetch|network/i.test(err.message) ? err.message : '네트워크 문제로 접수하지 못했습니다.'} 0507-1379-7436으로 전화 주시면 바로 상담해 드립니다.`;
      sendErr.classList.add('show');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = SUBMIT;
    }
  });
  ['input', 'change'].forEach((ev) => form.addEventListener(ev, (e) => {
    const f = e.target.closest('.field');
    if (f) f.classList.remove('has-error');
    if (e.target.id === 'f-agree') $('#e-agree').classList.remove('show');
  }));
  requestTick();
})();
