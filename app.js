const D = window.GUIDE_DATA, $ = s => document.querySelector(s);
let purpose = "register", selected = null, currentNoticeAgency = "all";
const checkedSet = new Set();
let liveNotices = D.notices || [];

// 1. KST 기준 오늘 날짜 자동 포맷 함수 (매일 자동 갱신)
function getTodayKstInfo() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (9 * 3600000));
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const y = kst.getFullYear();
  const m = kst.getMonth() + 1;
  const d = kst.getDate();
  const dayName = days[kst.getDay()];
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return {
    korFull: `${y}년 ${m}월 ${d}일 (${dayName}) 기준 · 일일 자동 업데이트 · 재활병원 실무 및 보호자 통합 가이드`,
    shortDot: `${y}.${mm}.${dd}`,
    iso: `${y}-${mm}-${dd}`
  };
}

function initDailySyncAndNotices() {
  const dateInfo = getTodayKstInfo();
  const badgeEl = $("#live-date-badge");
  const sbSyncEl = $("#sb-sync-date");
  const statusEl = $("#notice-sync-status");

  if (badgeEl) badgeEl.textContent = dateInfo.korFull;
  if (sbSyncEl) sbSyncEl.textContent = `🟢 ${dateInfo.shortDot} 자동 동기화됨`;
  if (statusEl) statusEl.textContent = `🔄 ${dateInfo.shortDot} 기준 공단 고시·서식 동기화 완료`;

  // notices.json 비동기 로드 (로컬 file:// 환경에서는 data.js 기본 데이터 사용)
  fetch('./notices.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(json => {
      if (json && Array.isArray(json.notices) && json.notices.length) {
        liveNotices = json.notices;
        if (json.status && statusEl) {
          statusEl.textContent = `🔄 ${dateInfo.shortDot} · ${json.status}`;
        }
      }
      renderNotices(currentNoticeAgency);
    })
    .catch(() => {
      renderNotices(currentNoticeAgency);
    });

  document.querySelectorAll('#notice-filters .hnb-filter').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#notice-filters .hnb-filter').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      currentNoticeAgency = btn.dataset.agency;
      renderNotices(currentNoticeAgency);
    };
  });
}

function renderNotices(agencyFilter = "all") {
  const gridEl = $("#notice-cards-grid");
  if (!gridEl) return;

  const dateInfo = getTodayKstInfo();
  const filtered = liveNotices.filter(n => agencyFilter === "all" || n.agency.includes(agencyFilter));

  gridEl.innerHTML = filtered.map(n => `
    <article class="hnb-card ${n.isPinned ? 'pinned' : ''}">
      <div class="hnb-card-top">
        <span class="purpose-agency-tag ${n.badgeClass}" style="margin:0;">${n.agency}</span>
        <span class="hnb-tag">${n.isPinned ? '📌 ' : ''}${n.tag || n.category}</span>
      </div>
      <h3 class="hnb-card-title" onclick="window.openNoticeModal('${n.id}')">${n.title}</h3>
      <p class="hnb-card-desc">${n.summary}</p>
      <div class="hnb-card-foot">
        <span class="hnb-date">확인일: ${dateInfo.shortDot}</span>
        <div class="hnb-links">
          <button type="button" class="hnb-btn-detail" onclick="window.openNoticeModal('${n.id}')">📄 상세·첨부 (${(n.attachments || []).length})</button>
          ${n.attachments && n.attachments[0] ? `<a href="${n.attachments[0].url}" target="_blank" rel="noopener" class="hnb-btn-ext">공식 원문 ↗</a>` : ''}
        </div>
      </div>
    </article>
  `).join('');
}

window.openNoticeModal = (id) => {
  const n = liveNotices.find(x => x.id === id);
  const modalEl = document.getElementById('welfare-modal');
  const modalBodyEl = document.getElementById('modal-body');
  if (!n || !modalEl || !modalBodyEl) return;

  const dateInfo = getTodayKstInfo();
  modalBodyEl.innerHTML = `
    <div class="modal-header">
      <span class="badge ${n.badgeClass}">${n.agency} · ${n.category}</span>
      <h2>${n.title}</h2>
      <p style="font-size: 13px; color: var(--muted); margin-top: 6px;">최신 기준 확인일: ${dateInfo.shortDot} (일일 자동 동기화)</p>
    </div>
    <div class="modal-section">
      <h4>📌 핵심 내용 요약</h4>
      <p>${n.summary}</p>
    </div>
    <div class="modal-section">
      <h4>📎 공식 고시 원문 및 서식 자료실 바로가기</h4>
      <ul class="modal-docs-list ${n.badgeClass === 'orange' ? 'orange-box' : n.badgeClass === 'green' ? 'green-box' : 'blue-box'}">
        ${(n.attachments || []).map(a => `
          <li style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
            <span><strong>${a.name}</strong></span>
            <a href="${a.url}" target="_blank" rel="noopener" class="table-select-btn" style="text-decoration:none;">공식 페이지 열기 ↗</a>
          </li>
        `).join('')}
      </ul>
    </div>
    <div class="modal-action-row">
      <button type="button" class="modal-btn secondary-btn" onclick="window.closeWelfareModal()">닫기</button>
      ${n.attachments && n.attachments[0] ? `<a href="${n.attachments[0].url}" target="_blank" rel="noopener" class="modal-btn primary-btn">공식 원문 바로가기 ↗</a>` : ''}
    </div>
  `;
  modalEl.classList.add('show');
  document.body.style.overflow = 'hidden';
};

// 2. 노션 스타일 사이드바 & 다크/라이트 테마 제어
window.toggleSidebar = (forceState) => {
  const layout = document.getElementById('notion-layout');
  const sidebar = document.getElementById('notion-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!layout || !sidebar) return;

  const isMobile = window.innerWidth <= 1024;
  if (isMobile) {
    const nextOpen = typeof forceState === 'boolean' ? forceState : !sidebar.classList.contains('mobile-open');
    sidebar.classList.toggle('mobile-open', nextOpen);
    if (backdrop) backdrop.classList.toggle('show', nextOpen);
  } else {
    const nextCollapsed = typeof forceState === 'boolean' ? !forceState : !layout.classList.contains('sidebar-collapsed');
    layout.classList.toggle('sidebar-collapsed', nextCollapsed);
  }
};

window.navFromSidebar = (e, selector) => {
  document.querySelectorAll('.notion-sidebar .sb-link').forEach(a => a.classList.remove('active'));
  if (e && e.currentTarget) e.currentTarget.classList.add('active');
  if (window.innerWidth <= 1024) window.toggleSidebar(false);
  window.scrollToSection(e, selector);
};

window.focusConditionSearch = () => {
  if (window.innerWidth <= 1024) window.toggleSidebar(false);
  const searchInput = document.getElementById('search');
  if (searchInput) {
    const offset = 110;
    const pos = searchInput.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: pos, behavior: 'smooth' });
    setTimeout(() => searchInput.focus(), 350);
  }
};

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    window.focusConditionSearch();
  }
});

function applyTheme(isDark) {
  document.body.classList.toggle('dark-theme', isDark);
  const icon = isDark ? '☀️' : '🌙';
  const label = isDark ? '라이트 모드 전환' : '노션 다크 모드 전환';
  if ($('#theme-icon')) $('#theme-icon').textContent = icon;
  if ($('#top-theme-icon')) $('#top-theme-icon').textContent = icon;
  if ($('#theme-label')) $('#theme-label').textContent = label;
}

window.toggleTheme = () => {
  const nextDark = !document.body.classList.contains('dark-theme');
  localStorage.setItem('agy_dashboard_dark', nextDark ? '1' : '0');
  applyTheme(nextDark);
};

// 초기 테마 복원
if (localStorage.getItem('agy_dashboard_dark') === '1') {
  applyTheme(true);
}

// 3. Step 1 & Step 2 목적·질환 선택 로직
function purposeView() {
  $("#purposes").innerHTML = Object.entries(D.purposes).map(([k, v]) => `
    <button class="purpose ${purpose === k ? 'on' : ''}" data-purpose="${k}">
      <span class="purpose-agency-tag ${v.badgeClass}">${v.agencyGroup}</span>
      <b>${v.icon || '📄'} ${v.name}</b>
      <small class="purpose-form-name">서식: ${v.formName}</small>
      <span>${v.shortDesc}</span>
    </button>
  `).join('');
  
  document.querySelectorAll('[data-purpose]').forEach(b => b.onclick = () => {
    purpose = b.dataset.purpose;
    purposeView();
    renderPurposeSummary();
    if (selected) resultView(selected);
  });
}

function renderPurposeSummary() {
  const p = D.purposes[purpose];
  const el = $("#purpose-summary");
  if (!el || !p) return;

  el.innerHTML = `
    <div class="ps-header">
      <div>
        <span class="badge ${p.badgeClass}" style="margin-bottom:6px;">${p.law}</span>
        <h3>${p.icon || ''} ${p.name} — 병원 발급 및 구비서류 기준</h3>
        <p class="ps-agency"><strong>담당·제출기관:</strong> ${p.agency}</p>
      </div>
      ${p.officialLink ? `<a href="${p.officialLink}" target="_blank" rel="noopener" class="ps-link-btn">${p.officialLinkText}</a>` : ''}
    </div>
    <div class="ps-grid">
      <div class="ps-item">
        <span class="ps-label">정확한 병원 서식명</span>
        <strong class="ps-val highlight-val">${p.details.form}</strong>
      </div>
      <div class="ps-item">
        <span class="ps-label">의무기록 출력 기간</span>
        <strong class="ps-val">${p.details.period}</strong>
      </div>
      <div class="ps-item">
        <span class="ps-label">봉투 밀봉 기준</span>
        <strong class="ps-val">${p.details.sealing}</strong>
      </div>
      <div class="ps-item">
        <span class="ps-label">투명테이프 규정</span>
        <strong class="ps-val ${purpose === 'work' ? 'warn-val' : ''}">${p.details.taping}</strong>
      </div>
    </div>
    <div class="ps-caution">
      ${p.caution}
    </div>
  `;
}

window.selectPurposeAndScroll = (key) => {
  if (!D.purposes[key]) return;
  if (window.innerWidth <= 1024) window.toggleSidebar(false);
  purpose = key;
  purposeView();
  renderPurposeSummary();
  if (selected) resultView(selected);
  const target = document.getElementById('purposes');
  if (target) {
    const offset = 100;
    const pos = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: pos, behavior: 'smooth' });
  }
};

function list(q = '') {
  const t = q.trim().toLowerCase();
  const rows = D.conditions.filter(x => !t || (x.name + ' ' + x.keys + ' ' + x.type).toLowerCase().includes(t));
  
  $("#conditions").innerHTML = rows.length ? rows.map(x => `
    <button data-index="${D.conditions.indexOf(x)}">
      <b>${x.name}</b>
      <span class="tag-small">${x.type}</span>
      <p>${x.tip}</p>
    </button>
  `).join('') : '<p class="empty">검색 결과가 없습니다. 마비·절단·관절·척추·파킨슨처럼 기능문제로 검색해 보세요.</p>';
  
  document.querySelectorAll('[data-index]').forEach(b => b.onclick = () => resultView(D.conditions[+b.dataset.index]));
}

function renderSimulator(x) {
  if (!x.hip && !x.parkinson) {
    return '';
  }
  
  let html = `
    <div class="simulator-box">
      <div class="sim-header">
        <span class="sim-tag">보호자용 참고 위젯</span>
        <h3>📊 장애인등록(복지부 고시) 정도 예측 시뮬레이터</h3>
        <p>환자의 현재 관절상태, 근력 수준 등을 선택하시면 장애인복지법 고시 기준을 대조하여 대략적인 장애정도 가능성을 예측해 드립니다.</p>
      </div>
      <form id="sim-form" class="sim-form">
  `;
  
  if (x.hip) {
    html += `
        <div class="sim-group">
          <label class="q-title">1) 인공고관절 치환 수술 여부</label>
          <div class="opt-grid">
            <label class="opt-btn"><input type="radio" name="q_hip_surgery" value="none" checked> <span>내고정술 시행 또는 수술 안함</span></label>
            <label class="opt-btn"><input type="radio" name="q_hip_surgery" value="single"> <span>한쪽 고관절 인공관절 치환술 시행</span></label>
            <label class="opt-btn"><input type="radio" name="q_hip_surgery" value="double"> <span>양쪽 고관절 모두 치환술 시행</span></label>
          </div>
        </div>
        
        <div class="sim-group">
          <label class="q-title">2) 고관절 가동 범위 제한 (꺾이는 정도)</label>
          <div class="opt-grid">
            <label class="opt-btn"><input type="radio" name="q_hip_rom" value="normal" checked> <span>정상 또는 미미한 꺾임 제한</span></label>
            <label class="opt-btn"><input type="radio" name="q_hip_rom" value="single_50"> <span>한쪽 다리가 정상 범위의 50% 이상 안 꺾임</span></label>
            <label class="opt-btn"><input type="radio" name="q_hip_rom" value="double_50"> <span>양쪽 다리가 각각 정상 범위의 50% 이상 안 꺾임</span></label>
            <label class="opt-btn"><input type="radio" name="q_hip_rom" value="ankylosis"> <span>한쪽 관절이 굳어 완전히 안 움직임(강직)</span></label>
          </div>
        </div>
        
        <div class="sim-group">
          <label class="q-title">3) 하지의 근력 상태 (다리 힘)</label>
          <div class="opt-grid">
            <label class="opt-btn"><input type="radio" name="q_hip_motor" value="good" checked> <span>버티고 스스로 걸을 힘이 충분함</span></label>
            <label class="opt-btn"><input type="radio" name="q_hip_motor" value="weak_single"> <span>한쪽 다리 힘이 현저히 저하됨 (간신히 흔드는 수준, MMT 2이하)</span></label>
            <label class="opt-btn"><input type="radio" name="q_hip_motor" value="weak_double"> <span>양쪽 다리 힘이 모두 현저히 마비/저하됨</span></label>
          </div>
        </div>

        <div class="sim-group">
          <label class="q-title">4) 보행 상태</label>
          <div class="opt-grid">
            <label class="opt-btn"><input type="radio" name="q_hip_walk" value="independent" checked> <span>보조기구 없이 단독 보행 가능</span></label>
            <label class="opt-btn"><input type="radio" name="q_hip_walk" value="assist"> <span>목발, 지팡이, 워커 등 보행보조기가 항상 필수</span></label>
            <label class="opt-btn"><input type="radio" name="q_hip_walk" value="wheelchair"> <span>혼자 걷지 못하며, 휠체어 이용 또는 와상 상태</span></label>
          </div>
        </div>
    `;
  } else if (x.parkinson) {
    html += `
        <div class="sim-group">
          <label class="q-title">1) 일상생활 수행 능력 (K-MBI 수정바델지수)</label>
          <div class="opt-grid">
            <label class="opt-btn"><input type="radio" name="q_park_mbi" value="mbi_high" checked> <span>대부분 자립 수행 가능 (K-MBI 97점 이상)</span></label>
            <label class="opt-btn"><input type="radio" name="q_park_mbi" value="mbi_mid"> <span>식사, 위생, 이동 시 부분적 도움 필요 (K-MBI 70~96점)</span></label>
            <label class="opt-btn"><input type="radio" name="q_park_mbi" value="mbi_low"> <span>식사, 목욕 등 대다수 일상에서 상당한 도움 필요 (K-MBI 54~69점)</span></label>
            <label class="opt-btn"><input type="radio" name="q_park_mbi" value="mbi_bed"> <span>와상 상태로 종일 24시간 전적인 간병 필요 (K-MBI 53점 이하)</span></label>
          </div>
        </div>
        
        <div class="sim-group">
          <label class="q-title">2) 파킨슨 중증도 단계 (H-Y 척도)</label>
          <div class="opt-grid">
            <label class="opt-btn"><input type="radio" name="q_park_hy" value="hy_1_2" checked> <span>1~2단계: 미세 떨림/뻣뻣함이 있으나 보행 및 균형 양호</span></label>
            <label class="opt-btn"><input type="radio" name="q_park_hy" value="hy_3"> <span>3단계: 가벼운 보행 장애 및 자세 불안정, 스스로 기립 가능</span></label>
            <label class="opt-btn"><input type="radio" name="q_park_hy" value="hy_4"> <span>4단계: 서기/걷기는 되나 심각한 장해로 일상생활 독립 불가</span></label>
            <label class="opt-btn"><input type="radio" name="q_park_hy" value="hy_5"> <span>5단계: 혼자 힘으로 활동 불능, 휠체어 고정 또는 와상 상태</span></label>
          </div>
        </div>
    `;
  }
  
  html += `
        <button type="button" id="btn-calc" class="btn-calc">예측 등급 확인하기</button>
      </form>
      <div id="sim-result" class="sim-result-box" hidden></div>
    </div>
  `;
  
  return html;
}

function bindSimulatorEvent(x) {
  const btn = $('#btn-calc');
  if (!btn) return;
  
  btn.onclick = () => {
    let grade = "";
    let reason = "";
    let guide = "";
    
    if (x.hip) {
      const surgery = $('input[name="q_hip_surgery"]:checked').value;
      const rom = $('input[name="q_hip_rom"]:checked').value;
      const motor = $('input[name="q_hip_motor"]:checked').value;
      const walk = $('input[name="q_hip_walk"]:checked').value;
      
      if (motor === 'weak_double' || walk === 'wheelchair') {
        grade = "심한 장애 (기존 1~3급 상당)";
        reason = "양하지 마비 또는 완전 독립 보행 불가 상태로 매우 중한 하지기능장애가 예상됩니다.";
        guide = "휠체어 고착 또는 침상 와상 상태를 입증할 상세 진료기록부, 보행능력 평가서 및 일상생활기록이 필요합니다. 뇌병변장애 동반 심사 여부도 검토하십시오.";
      } else if (motor === 'weak_single') {
        grade = "심한 장애 (기존 3급 상당)";
        reason = "한쪽 다리의 근력이 현저하게 손실되어(도수근력검사 MMT 2단계 이하) 단독 기립 및 보행이 심각하게 저해된 상태입니다.";
        guide = "정밀 도수근력검사(MMT) 평가서 및 근전도/신경전도 검사 결과지를 보강해야 판정 확률이 높습니다.";
      } else if (surgery === 'double') {
        grade = "심하지 않은 장애 (기존 4급 상당)";
        reason = "양측 고관절 모두에 인공관절 치환술을 마친 상태입니다.";
        guide = "양쪽 인공관절 삽입 수술 기록지와 삽입된 기구(임플란트) 명세 정보, 수술 후 X-ray 판독 사본을 제출합니다.";
      } else if (rom === 'double_50') {
        grade = "심한 장애 (기존 3급 상당)";
        reason = "양쪽 고관절의 관절가동범위(ROM)가 각각 정상에 비해 50% 이상 감소된 관절운동 제한 장해입니다.";
        guide = "재활의학과 또는 정형외과 전문의가 공식 계측기구로 정밀하게 측정한 관절운동범위(ROM) 검사결과지가 필수입니다.";
      } else if (rom === 'ankylosis') {
        grade = "심하지 않은 장애 (기존 4급 상당)";
        reason = "한쪽 고관절이 완전히 굳어서(강직) 꺾이지 않는 영구 장해입니다.";
        guide = "관절면의 완전 융합 또는 기질적 골성 강직을 확인할 수 있는 X-ray/CT 영상 및 판독지가 주효합니다.";
      } else if (surgery === 'single') {
        grade = "심하지 않은 장애 (기존 5급 상당)";
        reason = "한쪽 고관절에 인공관절 치환술을 시행한 상태입니다.";
        guide = "인공관절 수술기록지와 영상 자료 및 해당 장애유형별 기준 서류를 구비하여 제출합니다.";
      } else if (rom === 'single_50') {
        grade = "심하지 않은 장애 (기존 5급 상당)";
        reason = "한쪽 고관절의 관절가동운동범위가 정상 대비 50% 이상 제한된 영구 장해상태입니다.";
        guide = "수술/사고 후 충분한 치료를 받았음에도 관절 범위가 회복되지 않았다는 재활 경과기록 및 관절범위 검사 결과가 주 서류입니다.";
      } else {
        grade = "등급 기준 미달 (등급 외)";
        reason = "수술(내고정술 등) 이력이나 골절은 있으나 영구적 근력 저하(MMT 2이하)나 관절 운동범위 50% 이상 제한 등 영구 장애 요건에는 부족합니다.";
        guide = "일시적 재활기간에는 장애인 등록은 어려우나, 65세 이상인 경우 국민건강보험공단의 노인장기요양보험(장기요양 의사소견서) 신청 등을 적극 검토하십시오.";
      }
    } else if (x.parkinson) {
      const mbi = $('input[name="q_park_mbi"]:checked').value;
      const hy = $('input[name="q_park_hy"]:checked').value;
      
      if (hy === 'hy_5' || mbi === 'mbi_bed') {
        grade = "심한 장애 (기존 1~2급 상당)";
        reason = "파킨슨 5단계(혼자서 활동 불능) 및 수정바델지수(K-MBI) 53점 이하의 침상 의존 생활 상태입니다.";
        guide = "지속적인 도파민 약물 복용 기록지, 신경학적 결손을 입증하는 영상자료, K-MBI 및 UPDRS 평가서를 준비하십시오.";
      } else if (hy === 'hy_4' || mbi === 'mbi_low') {
        grade = "심한 장애 (기존 3급 상당)";
        reason = "파킨슨 4단계 또는 독립 보행 불가로 일상생활(K-MBI 54~69점)에 타인의 집중 보조가 필요한 상태입니다.";
        guide = "휠체어 이동 기록이나 식사/배뇨 등 필수 동작에 타인의 도움이 개입되는 의무기록지와 K-MBI 결과지가 중요합니다.";
      } else if (hy === 'hy_3' || mbi === 'mbi_mid') {
        grade = "심하지 않은 장애 (기존 4~5급 상당)";
        reason = "파킨슨 3단계(보행 장애 및 자세불안정 출현) 또는 일상생활(K-MBI 70~96점)에서 부분적 도움이 필요한 상태입니다.";
        guide = "보행 장애 및 평정 척도(UPDRS) 점수표, 그리고 지속적인 약물 치료 경과 기록이 갖추어져야 합니다.";
      } else {
        grade = "등급 기준 미달 (등급 외)";
        reason = "초기 단계의 파킨슨병(1~2단계)으로 떨림은 관찰되나 자세불안정이 없고 K-MBI 97점 이상으로 일상에 유의미한 제한이 입증되지 않은 상태입니다.";
        guide = "파킨슨병은 노인성 질환에 해당하므로 만 65세 미만이라도 일상생활 지원이 필요하다면 건보공단 노인장기요양보험(장기요양 의사소견서) 대상 여부를 확인해 보십시오.";
      }
    }
    
    const resBox = $('#sim-result');
    resBox.hidden = false;
    resBox.innerHTML = `
      <div class="res-card">
        <div class="res-badge">시뮬레이션 모의 진단 결과</div>
        <h4>예측 판정 결과: <span class="highlight">${grade}</span></h4>
        <div class="res-body">
          <p><strong>예측 근거:</strong> ${reason}</p>
          <p class="guide-tip"><strong>💡 보호자용 준비 가이드:</strong> ${guide}</p>
        </div>
        <div class="print-row">
          <button type="button" class="btn-print" onclick="window.print()">🖨️ 결과지 인쇄하기</button>
        </div>
        <p class="sim-notice">※ 본 진단기는 국민연금공단의 공식 장애정도 심사를 대신하지 않으며, 의료진이 기재한 최종 소견서 및 서류 심사 결과에 따라 최종 결과는 변동될 수 있습니다.</p>
      </div>
    `;
    resBox.scrollIntoView({behavior: 'smooth'});
  };
}

function resultView(x) {
  selected = x;
  const p = D.purposes[purpose];
  
  const hipGuide = x.hip ? `
    <div class="hip">
      <h3>고관절 치료 주기별 맞춤 프로세스 가이드</h3>
      <div class="process-timeline">
        <div class="process-step">
          <div class="p-num">1</div>
          <div class="p-content">
            <h4>수술 및 집중 치료기 (사고 후 ~ 6개월)</h4>
            <p>고관절·골반·대퇴 골절 수술 및 관절치환술 후 집중적인 재활이 필요할 경우, <strong>보건복지부 지정 회복기 재활의료기관(근골격계 환자군)</strong> 대상인지 병원 사회사업실이나 주치의에게 확인하십시오.</p>
            <div class="link-row">
              <a href="https://www.hira.or.kr/ra/eval/getRecurRehabHospList.do" target="_blank" rel="noopener" class="hira-link-btn">🏥 심평원 지정 회복기 재활병원 조회하기 ↗</a>
            </div>
          </div>
        </div>
        <div class="process-step">
          <div class="p-num">2</div>
          <div class="p-content">
            <h4>장애·장해 진단 검토기 (제출기관별 서식 명확 구분)</h4>
            <p>단순 골절·수술 이력만으로는 장애가 등록되지 않으며, <strong>관절 각도 제한(ROM), 하지 근력 결손(MMT), 보행 장애 유무</strong>가 핵심입니다. 또한 제출처가 행정복지센터(장애정도 심사용 진단서)인지, 근로복지공단(산재 장해진단서)인지, 보험사(후유장해진단서)인지 먼저 확인하세요.</p>
          </div>
        </div>
        <div class="process-step">
          <div class="p-num">3</div>
          <div class="p-content">
            <h4>퇴원 후 복귀 및 건강보험 제도 활용기</h4>
            <p>의료비 보전을 위해 건보공단의 <strong>본인부담상한제</strong>와 <strong>재난적의료비 지원</strong>을 검토하시고, 만 65세 이상 또는 노인성 질환으로 거동이 불편한 경우 장애진단서와 별개인 <strong>노인장기요양 의사소견서</strong>를 신청하십시오.</p>
          </div>
        </div>
      </div>
    </div>
  ` : '';

  const simHtml = renderSimulator(x);

  $("#result").hidden = false;
  const isInsuranceOrSanjae = purpose === 'insurance' || purpose === 'sanjae';
  const tipTitle = isInsuranceOrSanjae
    ? `💡 [${p.name}] 발급 및 심사 핵심 팁`
    : `💡 [${p.name}] 질환별 서류 준비 및 심사 핵심 팁`;
  const tipContent = isInsuranceOrSanjae ? x.insuranceTip : x.tip;

  $("#result").innerHTML = `
    <div class="result-header">
      <small>🎯 제출처: ${p.agency} · 정확한 서식명: [${p.formName}]</small>
      <h2>${x.name} <span style="font-size: 20px; font-weight: 600; color: var(--muted);">× ${p.name}</span></h2>
      <span class="tag">${x.type}</span>
      <span class="tag" style="background: var(--primary-light); color: var(--primary); margin-left: 6px;">${p.law}</span>
    </div>
    <div class="result-grid">
      <article class="doc-card">
        <h3>📋 [${p.name}] 기관별 기본 구비서류</h3>
        <ul>${p.base.map(v => `<li>${v}</li>`).join('')}</ul>
        <div class="doc-meta-box">
          <div><strong>기록 기간:</strong> ${p.details.period}</div>
          <div><strong>봉투 밀봉:</strong> ${p.details.sealing}</div>
          <div><strong>투명테이프:</strong> ${p.details.taping}</div>
        </div>
      </article>
      <article class="doc-card">
        <h3>🔬 [${x.name}] 관련 EMR 검사·증빙자료 (시행 시 첨부)</h3>
        <ul>${x.docs.map(v => `<li>${v}</li>`).join('')}</ul>
        <p style="font-size: 12.5px; color: var(--muted); margin-top: 12px;">※ 재활·인지·언어검사 결과지는 별도의 진단서가 아닌 공통 증빙자료로, 해당 검사를 실제 시행한 경우에만 출력하여 기관별 필수 구비서류와 대조합니다.</p>
      </article>
      <article class="doc-card" style="grid-column: span 2;">
        <h3>${tipTitle}</h3>
        <p style="font-size: 14.5px; line-height: 1.6; color: var(--ink);">${tipContent}</p>
        <p style="font-size: 13.5px; line-height: 1.5; color: var(--muted); margin-top: 12px; border-top: 1px dashed var(--line); padding-top: 10px;">
          ${p.caution}
        </p>
      </article>
    </div>
    ${hipGuide}
    ${simHtml}
    <div class="result-footer">
      <p class="caution">※ 안내 사항: 최종 심사 결과는 해당 심사기관(국민연금공단·국민건강보험공단·근로복지공단·보험사)의 기준에 근거하여 확정됩니다.</p>
    </div>
  `;
  
  bindSimulatorEvent(x);
  $("#result").scrollIntoView({behavior: 'smooth'});
}

// 4. 노션 스타일 뷰 전환 (Board / Gallery / Table)
window.switchAgencyView = (viewName) => {
  document.querySelectorAll('.n-view-tab').forEach(btn => {
    btn.classList.toggle('on', btn.dataset.view === viewName);
  });
  const boardEl = $("#agency-view-board");
  const galleryEl = $("#agency-view-gallery");
  const tableEl = $("#agency-view-table");
  if (boardEl) boardEl.hidden = viewName !== 'board';
  if (galleryEl) galleryEl.hidden = viewName !== 'gallery';
  if (tableEl) tableEl.hidden = viewName !== 'table';
};

function renderStandardSections() {
  // View 1: Notion Board View (기관별 칸반 보드)
  const boardEl = $("#agency-view-board");
  if (boardEl) {
    const groups = [
      { name: "국민연금공단", badgeClass: "blue", icon: "🟦", keys: ["register", "pension", "work"] },
      { name: "국민건강보험공단", badgeClass: "green", icon: "🟩", keys: ["longterm", "assistive"] },
      { name: "근로복지공단", badgeClass: "purple", icon: "🟪", keys: ["sanjae"] },
      { name: "민간보험사", badgeClass: "slate", icon: "⬜", keys: ["insurance"] }
    ];

    boardEl.innerHTML = groups.map(g => `
      <div class="n-board-col">
        <div class="n-col-head">
          <span class="purpose-agency-tag ${g.badgeClass}" style="margin:0;">${g.icon} ${g.name}</span>
          <span class="n-col-count">${g.keys.length}건</span>
        </div>
        <div class="n-col-cards">
          ${g.keys.map(k => {
            const p = D.purposes[k];
            return `
              <article class="n-board-card" onclick="window.selectPurposeAndScroll('${k}')">
                <div class="nbc-top">
                  <span class="nbc-law">${p.law}</span>
                  ${k === 'work' ? '<span class="nbc-warn">법정 테이핑</span>' : ''}
                </div>
                <h4>${p.icon || ''} ${p.name}</h4>
                <div class="nbc-form">📄 ${p.formName}</div>
                <ul class="nbc-meta">
                  <li><strong>기록기간:</strong> ${p.details.period}</li>
                  <li><strong>밀봉기준:</strong> ${p.details.sealing}</li>
                </ul>
                <div class="nbc-foot">
                  <span>맞춤 질환 서류 조합 보기 ➔</span>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  }

  // View 2: Gallery View (7대 상세 카드)
  const detailCardsEl = $("#agency-view-gallery");
  if (detailCardsEl) {
    detailCardsEl.innerHTML = Object.entries(D.purposes).map(([k, v], idx) => `
      <article class="agency-detail-card">
        <div class="adc-top">
          <span class="adc-num">유형 0${idx + 1}</span>
          <span class="badge ${v.badgeClass}" style="margin:0;">${v.law}</span>
        </div>
        <h4>${v.icon || ''} ${v.agencyGroup} — ${v.name}</h4>
        <div class="adc-form-box">
          <small>병원 발급서류</small>
          <strong>${v.details.form}</strong>
        </div>
        <dl class="adc-dl">
          <div><dt>의무기록</dt><dd>${v.details.records}</dd></div>
          <div><dt>검사자료</dt><dd>${v.details.tests}</dd></div>
          <div><dt>영상자료</dt><dd>${v.details.imaging}</dd></div>
          <div><dt>기록 기간</dt><dd><strong>${v.details.period}</strong></dd></div>
          <div><dt>봉투 밀봉</dt><dd>${v.details.sealing}</dd></div>
          <div><dt>투명테이프</dt><dd class="${k === 'work' ? 'warn-text' : ''}">${v.details.taping}</dd></div>
        </dl>
        <p class="adc-caution">${v.caution}</p>
        <div class="adc-footer">
          <button type="button" class="table-select-btn" onclick="window.selectPurposeAndScroll('${k}')">질환별 서류 조합 보기 ➔</button>
          ${v.officialLink ? `<a href="${v.officialLink}" target="_blank" rel="noopener" class="adc-ext-link">공식 확인 ↗</a>` : ''}
        </div>
      </article>
    `).join('');
  }

  // View 3: Table View (한눈에 보는 비교표)
  const agencyTbody = $("#agency-table-body");
  if (agencyTbody) {
    agencyTbody.innerHTML = D.agencyTable.map(row => `
      <tr>
        <td><strong>${row.agency}</strong></td>
        <td>${row.role}</td>
        <td><span class="table-form-badge">${row.doc}</span></td>
        <td><span class="table-law">${row.law}</span></td>
        <td><button type="button" class="table-select-btn" onclick="window.selectPurposeAndScroll('${row.key}')">선택·조회 ↗</button></td>
      </tr>
    `).join('');
  }

  // 3. Sealing 3-tier Grid
  const sealingEl = $("#sealing-grid");
  if (sealingEl) {
    sealingEl.innerHTML = D.sealingCriteria.map(s => `
      <article class="sealing-card">
        <div class="sealing-head">
          <span class="sealing-step">단계 ${s.grade}</span>
          <span class="badge ${s.badgeClass}" style="margin:0;">${s.badge}</span>
        </div>
        <h4>${s.title}</h4>
        <div class="sealing-docs">
          ${s.docs.map(d => `<span class="sealing-chip">${d}</span>`).join('')}
        </div>
        <ul class="sealing-rules">
          ${s.rules.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </article>
    `).join('');
  }

  // 4. EMR Table
  const emrTbody = $("#emr-table-body");
  if (emrTbody) {
    emrTbody.innerHTML = D.emrCriteria.map(r => `
      <tr>
        <td><strong>${r.category}</strong></td>
        <td><span class="table-form-badge">${r.tests}</span></td>
        <td>${r.usage}</td>
        <td>${r.note}</td>
      </tr>
    `).join('');
  }

  // 5. Re-evaluation Table
  const reevalTbody = $("#reeval-table-body");
  if (reevalTbody) {
    reevalTbody.innerHTML = D.reevaluationCriteria.map(r => `
      <tr>
        <td><strong>${r.type}</strong></td>
        <td>${r.agency}</td>
        <td>${r.prep}</td>
      </tr>
    `).join('');
  }

  // 6. Checklist (Notion Tasks View)
  renderChecklist();
}

function renderChecklist() {
  const listEl = $("#checklist-items");
  const countEl = $("#checklist-count");
  const barEl = $("#checklist-bar");
  if (!listEl) return;

  const total = D.checklist.length;
  const done = checkedSet.size;

  if (countEl) countEl.textContent = `${done} / ${total} 완료`;
  if (barEl) barEl.style.width = `${Math.round((done / total) * 100)}%`;

  listEl.innerHTML = D.checklist.map((item, idx) => {
    const isChecked = checkedSet.has(idx);
    const text = typeof item === 'string' ? item : item.text;
    const cat = typeof item === 'string' ? '필수 점검' : item.category;
    const role = typeof item === 'string' ? '원무·보호자' : item.role;
    const badge = typeof item === 'string' ? 'blue' : item.badge;

    return `
      <tr class="task-row ${isChecked ? 'checked' : ''}" onclick="window.toggleChecklistItem(${idx})">
        <td style="text-align: center;">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); window.toggleChecklistItem(${idx})">
        </td>
        <td>
          <span class="chk-num" style="display:inline-grid; margin-right:8px;">${idx + 1}</span>
          <span class="chk-text">${text}</span>
        </td>
        <td><span class="purpose-agency-tag ${badge}" style="margin:0;">${cat}</span></td>
        <td style="font-size: 13px; color: var(--muted); font-weight: 600;">${role}</td>
      </tr>
    `;
  }).join('');
}

window.toggleChecklistItem = (idx) => {
  if (checkedSet.has(idx)) {
    checkedSet.delete(idx);
  } else {
    checkedSet.add(idx);
  }
  renderChecklist();
};

window.resetChecklist = () => {
  checkedSet.clear();
  renderChecklist();
};

window.copyChecklist = () => {
  const dateInfo = getTodayKstInfo();
  const total = D.checklist.length;
  const done = checkedSet.size;
  const lines = [
    `[장애·장해 관련 서류 발급 확인표 — ${dateInfo.shortDot} 기준] (${done}/${total} 완료)`,
    ...D.checklist.map((item, idx) => {
      const text = typeof item === 'string' ? item : item.text;
      return `${checkedSet.has(idx) ? '☑' : '☐'} ${idx + 1}. ${text}`;
    })
  ];
  const text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      alert("발급 확인표가 클립보드에 복사되었습니다.");
    }).catch(() => {
      alert("복사 완료:\n\n" + text);
    });
  } else {
    alert("복사 완료:\n\n" + text);
  }
};

initDailySyncAndNotices();
purposeView();
renderPurposeSummary();
list();
renderStandardSections();

$("#search").oninput = e => list(e.target.value);

["뇌출혈", "뇌경색", "척수손상", "고관절 골절", "파킨슨병", "절단"].forEach(x => {
  $("#chips").insertAdjacentHTML('beforeend', `<button>${x}</button>`);
});

document.querySelectorAll('#chips button').forEach(b => b.onclick = () => {
  $("#search").value = b.textContent;
  list(b.textContent);
});

// 복지제도 데이터 정의
const WELFARE_INFO = {
  ceiling: {
    badge: "의료비 환급",
    badgeClass: "orange",
    title: "본인부담상한제 상세 안내",
    desc: "1년간 병원(의원)에서 지불한 건강보험 본인부담금(비급여, 선별급여 등 제외) 총액이 개인별 소득 수준에 따른 상한액(2026년 기준)을 초과하는 경우, 그 초과액을 국민건강보험공단에서 환급하여 가계 부담을 덜어주는 복지 제도입니다.",
    target: "건강보험 가입자 및 피부양자 전체 대상 (소득 수준을 1~10분위로 분류하여 차등 적용)",
    steps: [
      { title: "상한액 초과금 여부 전산 확인", desc: "국민건강보험공단이 매년 환자의 총 진료비를 정산하여 본인부담상한액 초과 대상자를 자동 분류합니다." },
      { title: "지급 신청 안내문 발송", desc: "초과 대상자에게 매년 8월경부터 순차적으로 환급 신청 안내문과 신청서 서식을 우편 발송합니다." },
      { title: "환급금 신청서 접수", desc: "안내문을 수령한 보호자 또는 환자가 전화(1577-1000), 팩스, 우편, 또는 공단 홈페이지/앱을 통해 환급받을 계좌를 등록해 신청합니다." }
    ],
    docs: [
      "본인부담상한액 초과금 지급신청서 (공단 발송분)",
      "환자 본인 명의의 예금계좌 통장 사본",
      "환자 본인 신분증 사본 (보호자 대리 신청 시: 위임장, 가족관계증명서, 대리인 신분증 추가)"
    ],
    link: "https://www.nhis.or.kr/nhis/etc/personalLimitCeiling.do",
    linkText: "건보공단 본인부담상한제 페이지 바로가기 ↗"
  },
  disaster: {
    badge: "의료비 지원",
    badgeClass: "blue",
    title: "재난적의료비 지원 상세 안내",
    desc: "가구의 소득 수준 대비 과도한 의료비가 발생하여 생계유지가 곤란한 가구에게, 건강보험 본인부담금과 비급여 항목(일부 제외)을 포함한 본인부담 의료비의 50~80%를 연간 최대 5,000만원 한도 내에서 건강보험공단이 지원해 주는 제도입니다.",
    target: "기준중위소득 100% 이하 가구 (소득 대비 연간 본인부담 의료비 총액이 가구 연소득의 10%를 초과하고, 재산 합계액이 5억 4천만원 이하인 경우)",
    steps: [
      { title: "관할 공단 지사 사전 상담 (필수)", desc: "퇴원 전 또는 퇴원 후 180일 이내에 환자의 주소지 관할 국민건강보험공단 지사를 방문해 자격 조건 및 모의 계산 사전 상담을 받아야 합니다." },
      { title: "지급 신청서 및 증빙서류 제출", desc: "상담 완료 후 주치의 진단서, 진료비 영수증/비급여내역서 등 구비서류를 준비하여 공단 지사에 제출합니다." },
      { title: "서류 심사 및 지원금 입금", desc: "건보공단의 소득·재산 및 의료비 정밀 심사(통상 30일 이내)를 거쳐 환자 또는 병원(대납 시) 계좌로 직접 송금됩니다." }
    ],
    docs: [
      "재난적의료비 지원 신청서 (공단 지사 비치)",
      "진단서 및 입퇴원확인서 (외래진료 시 진료확인서)",
      "진료비 계산서·영수증 원본 및 비급여 상세내역서 일체",
      "가족관계증명서 (가구원 확인용)",
      "가구원 소득·재산 증빙 서류 (건강보험료 납부확인서 등)"
    ],
    link: "https://www.nhis.or.kr",
    linkText: "국민건강보험공단 홈페이지 바로가기 ↗"
  },
  longterm: {
    badge: "간병/장기요양",
    badgeClass: "green",
    title: "노인장기요양보험 신청 가이드",
    desc: "고령이나 노인성 질환(치매, 뇌혈관질환, 파킨슨병 등)으로 일상생활을 혼자 수행하기 어려운 분들에게 가사·신체활동 지원 및 간병 혜택을 제공하여 가족의 요양 부담을 경감하고 대상자의 삶의 질을 높이는 사회보험제도입니다. (장애인복지법의 장애정도심사와는 별도 제도입니다.)",
    target: "만 65세 이상 고령자 또는 만 65세 미만 중 노인성 질병(파킨슨병, 뇌출혈/뇌경색, 치매 등)으로 거동 장애를 가진 자",
    steps: [
      { title: "장기요양 인정 신청 접수", desc: "국민건강보험공단 지사 방문, 우편, 팩스 또는 노인장기요양보험 홈페이지(www.longtermcare.or.kr)를 통해 신청서를 접수합니다." },
      { title: "공단 직원의 댁내 방문 인정조사", desc: "신청 완료 후 건보공단 소속 직원이 가정을 방문해 신체/정신 기능 상태를 직접 인정조사합니다." },
      { title: "장기요양 의사소견서 제출 및 등급 판정", desc: "의료기관에서 발급받은 '장기요양 의사소견서'와 인정조사 결과를 바탕으로 등급판정위원회가 심의·결정합니다." }
    ],
    docs: [
      "장기요양인정신청서 (기본 서류)",
      "장기요양 의사소견서 (의료기관 발급, 통상 6개월분 의무기록 일괄 제출이나 테이핑 규정 적용 대상 아님)",
      "공단에서 별도 요구하는 경우 관련 진단서·검사결과"
    ],
    link: "https://www.nhis.or.kr/static/html/wbda/c/wbdac02.html",
    linkText: "건보공단 장기요양인정 공식 안내 바로가기 ↗"
  }
};

function initWelfareModal() {
  const modalEl = document.getElementById('welfare-modal');
  const closeBtnEl = document.getElementById('modal-close');
  const modalBodyEl = document.getElementById('modal-body');
  
  if (!modalEl || !closeBtnEl || !modalBodyEl) return;
  
  window.openWelfareModal = (type) => {
    const data = WELFARE_INFO[type];
    if (!data) return;
    
    modalBodyEl.innerHTML = `
      <div class="modal-header">
        <span class="badge ${data.badgeClass}">${data.badge}</span>
        <h2>${data.title}</h2>
      </div>
      <div class="modal-section">
        <h4>💡 어떤 제도인가요?</h4>
        <p>${data.desc}</p>
      </div>
      <div class="modal-section">
        <h4>👥 지원 대상은 누구인가요?</h4>
        <p>${data.target}</p>
      </div>
      <div class="modal-section">
        <h4>📋 한눈에 보는 신청 절차</h4>
        <div class="modal-steps">
          ${data.steps.map((s, idx) => `
            <div class="modal-step-item">
              <div class="modal-step-badge">${idx + 1}</div>
              <div class="modal-step-content">
                <b>${s.title}</b>
                <span>${s.desc}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="modal-section">
        <h4>📂 신청 시 필수 구비 서류</h4>
        <ul class="modal-docs-list ${data.badgeClass}-box">
          ${data.docs.map(doc => `<li>${doc}</li>`).join('')}
        </ul>
      </div>
      <div class="modal-action-row">
        <button type="button" class="modal-btn secondary-btn" onclick="window.closeWelfareModal()">닫기</button>
        <a href="${data.link}" target="_blank" rel="noopener" class="modal-btn primary-btn">${data.linkText}</a>
      </div>
    `;
    
    modalEl.classList.add('show');
    document.body.style.overflow = 'hidden';
  };
  
  window.closeWelfareModal = () => {
    modalEl.classList.remove('show');
    document.body.style.overflow = '';
  };
  
  closeBtnEl.onclick = () => window.closeWelfareModal();
  
  modalEl.onclick = (e) => {
    if (e.target === modalEl) {
      window.closeWelfareModal();
    }
  };
}

initWelfareModal();
document.querySelectorAll('.welfare-card').forEach(card => {
  card.onclick = () => window.openWelfareModal(card.dataset.welfare);
});

// 개인정보처리방침 및 이용약관 데이터 정의
const LEGAL_CONTENT = {
  privacy: {
    title: "개인정보처리방침",
    desc: `
      <p>본 서비스(이하 '장애·장해서류 길잡이')는 이용자의 개인정보를 매우 소중하게 생각하며, 개인정보보호법 등 관련 법령을 성실히 준수합니다.</p>
      <br>
      <h4>1. 개인정보의 수집 및 이용 목적</h4>
      <p>본 서비스는 별도의 회원가입이나 로깅 없이 즉각적으로 이용 가능한 정적 정보 제공 웹사이트입니다. <strong>장애정도 예측 시뮬레이터 및 발급 체크리스트 등을 포함한 서비스 이용 전체 과정에서 이용자의 이름, 연락처, 신체 계측 정보 등의 개인식별 정보를 서버에 전송하거나 임의 수집하지 않습니다.</strong> 모든 입력 데이터는 이용자 본인의 모바일 또는 PC 브라우저상에서 즉시 처리 후 소멸됩니다.</p>
      <br>
      <h4>2. 제3자 정보 제공 및 개인정보 위탁</h4>
      <p>본 서비스는 개인정보 자체를 수집하지 않으므로, 수집된 정보를 타 기관에 공유하거나 외부에 분석 위탁을 수행하지 않습니다.</p>
      <br>
      <h4>3. 쿠키(Cookie) 및 제휴 서비스 광고 정책</h4>
      <p>이용자에게 맞춤형 혜택 정보와 광고 등을 제공하기 위해 구글 애드센스(Google AdSense) 등 외부 광고 플랫폼을 게재할 수 있으며, 이 과정에서 분석 쿠키가 활용될 수 있습니다. 이용자는 브라우저 개인정보 옵션을 통해 쿠키 수집을 전면 차단할 수 있습니다.</p>
      <br>
      <h4>4. 문의처</h4>
      <p>서비스 관리 책임자 메일: rkstmtk@gmail.com</p>
    `
  },
  terms: {
    title: "서비스 이용약관",
    desc: `
      <p>장애·장해서류 길잡이 포털 서비스를 이용해 주셔서 감사합니다. 본 약관은 서비스 이용조건 및 유의사항에 대해 설명합니다.</p>
      <br>
      <h4>1. 정보 제공의 목적</h4>
      <p>본 포털에서 제공하는 기관별·질환별 진단서 발급 및 구비서류 안내 정보는 국민연금공단, 국민건강보험공단, 근로복지공단 등 공식 기관 안내를 기반으로 의료기관 실무자와 보호자들의 이해를 돕기 위해 무상으로 제공되는 참고용 자료입니다. <strong>예측 시뮬레이터를 통해 산출된 등급 범위 및 가능성은 정밀한 공식 판정이 아니며 법적 보증 효력이 없습니다.</strong></p>
      <br>
      <h4>2. 면책 조항 및 손해 배상</h4>
      <p>정보의 적시성 및 신뢰성을 확보하기 위해 노력하고 있으나, 본 정보에 의존하여 행해진 결과나 대리 행위에 대해 관리자는 민형사상 법적 책임을 지지 않습니다. 공식 판정과 서류 접수는 반드시 담당 전문의의 의학적 소견과 제출기관의 최신 공식 기준에 기반해 처리되어야 합니다.</p>
      <br>
      <h4>3. 소유권 및 서비스 변경</h4>
      <p>본 사이트 내의 디자인 템플릿, 데이터 구조 및 자가진단 로직의 지적 재산권은 원작자에게 귀속되며 무단 복제 및 재배포를 금지합니다.</p>
    `
  }
};

function initLegalModal() {
  const legalModal = document.getElementById('legal-modal');
  const bodyEl = document.getElementById('legal-modal-body');
  if (!legalModal || !bodyEl) return;

  window.openLegalModal = (type) => {
    const data = LEGAL_CONTENT[type];
    if (!data) return;

    bodyEl.innerHTML = `
      <div class="modal-header">
        <span class="badge orange">안내 및 동의</span>
        <h2>${data.title}</h2>
      </div>
      <div class="modal-section" style="max-height: 45vh; overflow-y: auto; text-align: left; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #334155;">
        ${data.desc}
      </div>
      <div class="modal-action-row">
        <button type="button" class="modal-btn primary-btn" onclick="window.closeLegalModal()">동의 및 확인</button>
      </div>
    `;
    legalModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  window.closeLegalModal = () => {
    legalModal.style.display = 'none';
    document.body.style.overflow = '';
  };

  legalModal.onclick = (e) => {
    if (e.target === legalModal) {
      window.closeLegalModal();
    }
  };
}

initLegalModal();

function initContactModal() {
  const contactModal = document.getElementById('contact-modal');
  if (!contactModal) return;

  const originalHtml = contactModal.innerHTML;

  window.openContactModal = () => {
    contactModal.innerHTML = originalHtml;
    contactModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  window.closeContactModal = () => {
    contactModal.style.display = 'none';
    document.body.style.overflow = '';
  };

  window.submitContactForm = (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();
    const agree = document.getElementById('contact-agree').checked;

    if (!name || !phone || !email || !message || !agree) {
      alert("필수 입력 사항(*) 및 개인정보 제공에 동의하셔야 접수가 가능합니다.");
      return;
    }

    const contentBox = contactModal.querySelector('.modal-content');
    if (contentBox) {
      contentBox.innerHTML = `
        <button type="button" class="modal-close-btn" onclick="window.closeContactModal()">&times;</button>
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 56px; margin-bottom: 24px;">✉️</div>
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">온라인 문의가 완료되었습니다!</h2>
          <p style="font-size: 14.5px; color: #475569; line-height: 1.6; margin-bottom: 30px; word-break: keep-all;">
            작성하신 문의 사항이 관리자 메일(<strong>rkstmtk@gmail.com</strong>)로 정상적으로 송신 접수되었습니다.<br>
            검토 후 입력하신 이메일(<strong>${email}</strong>) 또는 연락처로 신속히 답변해 드리겠습니다.
          </p>
          <button type="button" class="modal-btn primary-btn" style="margin: 0 auto; display: block; width: 160px;" onclick="window.closeContactModal()">확인 및 닫기</button>
        </div>
      `;
    }
  };

  contactModal.onclick = (e) => {
    if (e.target === contactModal) {
      window.closeContactModal();
    }
  };
}

initContactModal();

window.scrollToSection = (e, selector) => {
  if (e) e.preventDefault();
  const target = document.querySelector(selector);
  if (target) {
    const offset = 75;
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

window.scrollToTop = (e) => {
  if (e) e.preventDefault();
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};
