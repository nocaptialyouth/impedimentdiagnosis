const D = window.GUIDE_DATA, $ = s => document.querySelector(s);
let purpose = "register", selected = null;

function purposeView() {
  $("#purposes").innerHTML = Object.entries(D.purposes).map(([k, v]) => `
    <button class="purpose ${purpose === k ? 'on' : ''}" data-purpose="${k}">
      <b>${v.name}</b>
      <span>${k === 'register' ? '신규등록·조정·재판정' : k === 'pension' ? '국민연금 1~4급 심사' : k === 'work' ? '근로능력 유무 평가' : '실손·생명·상해보험 청구'}</span>
    </button>
  `).join('');
  
  document.querySelectorAll('[data-purpose]').forEach(b => b.onclick = () => {
    purpose = b.dataset.purpose;
    purposeView();
    if (selected) resultView(selected);
  });
}

function list(q = '') {
  const t = q.trim().toLowerCase();
  const rows = D.conditions.filter(x => !t || (x.name + ' ' + x.keys).toLowerCase().includes(t));
  
  $("#conditions").innerHTML = rows.length ? rows.map(x => `
    <button data-index="${D.conditions.indexOf(x)}">
      <b>${x.name}</b>
      <span class="tag-small">${x.type}</span>
      <p>${x.tip}</p>
    </button>
  `).join('') : '<p class="empty">검색 결과가 없습니다. 마비·절단·관절·척추처럼 기능문제로 검색해 보세요.</p>';
  
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
        <h3>📊 장애정도 예측 시뮬레이터</h3>
        <p>환자의 현재 관절상태, 근력 수준 등을 선택하시면 복지부/공단 고시 기준을 대조하여 대략적인 장애등급 가능성을 예측해 드립니다.</p>
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
          <label class="q-title">1) 일상생활 수행 능력 (MBI 수정바델지수)</label>
          <div class="opt-grid">
            <label class="opt-btn"><input type="radio" name="q_park_mbi" value="mbi_high" checked> <span>대부분 자립 수행 가능 (MBI 97점 이상)</span></label>
            <label class="opt-btn"><input type="radio" name="q_park_mbi" value="mbi_mid"> <span>식사, 위생, 이동 시 부분적 도움 필요 (MBI 70~96점)</span></label>
            <label class="opt-btn"><input type="radio" name="q_park_mbi" value="mbi_low"> <span>식사, 목욕 등 대다수 일상에서 상당한 도움 필요 (MBI 54~69점)</span></label>
            <label class="opt-btn"><input type="radio" name="q_park_mbi" value="mbi_bed"> <span>와상 상태로 종일 24시간 전적인 간병 필요 (MBI 53점 이하)</span></label>
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
    let title = "";
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
        reason = "양측 고관절 모두에 인공관절 치환술을 성공적으로 마친 상태입니다.";
        guide = "양쪽 인공관절 삽입 수술 기록지와 삽입된 기구(임플란트) 명세 정보, 수술 후 정상적으로 고정된 X-ray 판독 사본을 제출합니다.";
      } else if (rom === 'double_50') {
        grade = "심한 장애 (기존 3급 상당)";
        reason = "양쪽 고관절의 관절가동범위(ROM)가 각각 정상에 비해 50% 이상 감소된 관절운동 제한 장해입니다.";
        guide = "재활의학과 또는 정형외과 전문의가 공식 계측기구로 정밀하게 측정한 관절운동범위 검사결과지가 필수입니다.";
      } else if (rom === 'ankylosis') {
        grade = "심하지 않은 장애 (기존 4급 상당)";
        reason = "한쪽 고관절이 완전히 굳어서(강직) 꺾이지 않는 영구 장해입니다.";
        guide = "관절면의 완전 융합 또는 기질적 골성 강직을 확인할 수 있는 X-ray/CT 영상 및 판독지가 주효합니다.";
      } else if (surgery === 'single') {
        grade = "심하지 않은 장애 (기존 5급 상당)";
        reason = "한쪽 고관절에 인공관절 치환술을 시행한 상태입니다.";
        guide = "인공관절 수술 사실을 입증하는 수술기록지와 영상 자료만 구비되면 비교적 명확히 5급 상당으로 판정됩니다.";
      } else if (rom === 'single_50') {
        grade = "심하지 않은 장애 (기존 5급 상당)";
        reason = "한쪽 고관절의 관절가동운동범위가 정상 대비 50% 이상 제한된 영구 장해상태입니다.";
        guide = "수술/사고 후 6개월 이상 충분한 치료를 받았음에도 관절 범위가 회복되지 않았다는 재활 경과기록 및 관절범위 검사 결과가 주 서류입니다.";
      } else {
        grade = "등급 기준 미달 (등급 외)";
        reason = "수술(내고정술 등) 이력이나 골절은 있으나 영구적 근력 저하(MMT 2이하)나 관절 운동범위 50% 이상 제한 등 영구 장애 요건에는 부족합니다.";
        guide = "뼈의 고정 수술을 받았으나 6개월 이내에 보행이나 구부림이 대부분 회복된 상태입니다. 일시적 재활기간에는 장애인 등록은 불가능하나, 65세 이상인 경우 노인장기요양보험 지원 등을 적극 검토하십시오.";
      }
    } else if (x.parkinson) {
      const mbi = $('input[name="q_park_mbi"]:checked').value;
      const hy = $('input[name="q_park_hy"]:checked').value;
      
      if (hy === 'hy_5' || mbi === 'mbi_bed') {
        grade = "심한 장애 (기존 1~2급 상당)";
        reason = "파킨슨 5단계(혼자서 활동 불능) 및 수정바델지수 53점 이하의 침상 전적 의존 생활 상태입니다.";
        guide = "지속적인 도파민 약물 복용 기록지(6개월 이상), 신경학적 결손을 입증하는 MRI/PET 뇌 영상자료, 그리고 전적 와상 상태임을 보여주는 간병기록이나 보행평가 진단서가 절대적입니다.";
      } else if (hy === 'hy_4' || mbi === 'mbi_low') {
        grade = "심한 장애 (기존 3급 상당)";
        reason = "파킨슨 4단계 또는 독립 보행 불가로 일상생활(MBI 54~69점)에 지대한 지장 및 타인의 집중 보조가 필요한 상태입니다.";
        guide = "휠체어에 의지해 생활하는 기록이나 식사/배뇨 등 필수 동작에 타인의 도움이 전적으로 개입되는 의무기록지가 중요 심사 대상입니다.";
      } else if (hy === 'hy_3' || mbi === 'mbi_mid') {
        grade = "심하지 않은 장애 (기존 4~5급 상당)";
        reason = "파킨슨 3단계(보행 장애 및 자세불안정 출현) 또는 일상생활(MBI 70~96점)에서 부분적 간호/지도가 필요한 장애 상태입니다.";
        guide = "경도 보행 장애 및 평정 척도(UPDRS) 점수표, 그리고 6개월간 지속 치료를 받았음에도 서서히 진행 중인 진료 기록이 갖추어져야 합니다.";
      } else {
        grade = "등급 기준 미달 (등급 외)";
        reason = "초기 단계의 파킨슨병(1~2단계)으로 떨림은 관찰되나 자세불안정이 없고 수정바델지수 97점 이상으로 일상에 유의미한 제한이 입증되지 않은 상태입니다.";
        guide = "치료제를 복용하면서 추이를 관찰하십시오. 파킨슨은 진행성 질환이므로 향후 보행 장애나 일상 제한이 악화되면 재진단을 신청하실 수 있습니다.";
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
        <p class="sim-notice">※ 본 진단기는 공단의 공식 등급 심사를 대신하지 않으며, 의료진이 기재한 최종 소견서 및 서류 심사 결과에 따라 최종 결과는 변동될 수 있습니다.</p>
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
            <p>고관절·골반·대퇴 골절 수술 및 관절치환술 후 집중적인 재활이 필요할 경우, <strong>보건복지부 지정 회복기 재활의료기관(근골격계 환자군)</strong> 대상인지 병원 사회사업실이나 주치의에게 확인하십시오. 집중 재활을 통해 입원/치료 혜택을 확대 적용받을 수 있습니다.</p>
            <div class="link-row">
              <a href="https://www.hira.or.kr/ra/eval/getRecurRehabHospList.do" target="_blank" class="hira-link-btn">🏥 심평원 지정 회복기 재활병원 조회하기 ↗</a>
            </div>
          </div>
        </div>
        <div class="process-step">
          <div class="p-num">2</div>
          <div class="p-content">
            <h4>장애진단 검토기 (수술 또는 부상 6개월 경과 시)</h4>
            <p>단순히 뼈가 부러진 사건이나 수술을 받은 사실만으로는 장애가 등록되지 않습니다. <strong>충분한 치료 후에도 영구적으로 극복되지 않는 관절 각도 제한(ROM), 하지 근력의 결손(MMT 2이하), 기립 및 보행의 장애 유무</strong>가 핵심 기준입니다.</p>
          </div>
        </div>
        <div class="process-step">
          <div class="p-num">3</div>
          <div class="p-content">
            <h4>퇴원 후 복귀 및 제도 활용기</h4>
            <p>의료비 보전을 위해 건강보험공단의 <strong>본인부담상한제</strong>와 <strong>재난적의료비 지원</strong> 자격을 필히 검토하시고, 환자가 만 65세 이상이거나 노인성 질병(파킨슨병, 뇌경색 등)으로 거동이 크게 어려운 상태라면 건보공단에 <strong>노인장기요양보험 등급</strong>도 별도로 신청하십시오.</p>
          </div>
        </div>
      </div>
    </div>
  ` : '';

  const simHtml = renderSimulator(x);

  $("#result").hidden = false;
  const isInsurance = purpose === 'insurance';
  const tipTitle = isInsurance ? "💡 전문의가 전하는 사보험 후유장해(AMA) 청구 꿀팁" : "💡 전문의가 전하는 장애 심사 서류 보완 꿀팁";
  const tipContent = isInsurance ? x.insuranceTip : x.tip;
  const tipSubNotice = isInsurance 
    ? "※ 사보험 청구 요령: 개인보험(생명/손해보험) 후유장해는 국가 장애인등록 기준보다 각도나 마비 요건이 조금 더 정량적으로 명시되어 있습니다. 단, 보험사에서는 퇴행성 기왕증(이미 가지고 있던 고관절염 등)을 이유로 장해율을 삭감하려 하는 경우가 많으므로, 장해진단서상에 '재해/외상과의 인과관계(외상 기여도)'가 뚜렷이 기술되도록 주치의와 상담하십시오."
    : "※ 병원에 소견서 발급을 요청하실 때는 단순히 장애진단용이라고만 말씀하시기보다, 환자분이 실제 집안에서 식사를 하거나, 계단을 오르거나, 거동할 때 어떤 구체적인 제한(예: 보호자 지지 없이 단독 보행 불가, 숟가락질 곤란 등)을 겪는지 메모를 작성해 의사에게 전달하십시오. 주치의가 진단서에 해당 일상생활 제한 내용을 훨씬 더 꼼꼼하고 실질적으로 기재하는 데 지대한 영향을 미칩니다.";

  $("#result").innerHTML = `
    <div class="result-header">
      <small>🎯 ${p.name} 필수 제출 서류 목록</small>
      <h2>${x.name}</h2>
      <span class="tag">${x.type}</span>
    </div>
    <div class="result-grid">
      <article class="doc-card">
        <h3>📋 ${p.name} 기본 공통 서류</h3>
        <ul>${p.base.map(v => `<li>${v}</li>`).join('')}</ul>
      </article>
      <article class="doc-card">
        <h3>🔬 질환별 의학적 상태 증빙서류</h3>
        <ul>${x.docs.map(v => `<li>${v}</li>`).join('')}</ul>
      </article>
      <article class="doc-card" style="grid-column: span 2;">
        <h3>${tipTitle}</h3>
        <p style="font-size: 14.5px; line-height: 1.6; color: var(--ink);">${tipContent}</p>
        <p style="font-size: 13.5px; line-height: 1.5; color: var(--muted); margin-top: 12px; border-top: 1px dashed var(--line); padding-top: 10px;">
          ${tipSubNotice}
        </p>
      </article>
    </div>
    ${hipGuide}
    ${simHtml}
    <div class="result-footer">
      <p class="caution">※ 안내 사항: 최종 심사 결과는 공단 전문의 심사 위원회의 정밀 의학적 기준에 근거하여 확정됩니다. 환자분과 가족분들의 순조로운 쾌유와 사회 복귀를 진심으로 응원합니다.</p>
    </div>
  `;
  
  bindSimulatorEvent(x);
  $("#result").scrollIntoView({behavior: 'smooth'});
}

purposeView();
list();

$("#search").oninput = e => list(e.target.value);

["뇌출혈", "척수손상", "고관절 골절", "파킨슨병"].forEach(x => {
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
    desc: "고령이나 노인성 질환(치매, 뇌혈관질환, 파킨슨병 등)으로 일상생활을 혼자 수행하기 어려운 분들에게 가사·신체활동 지원 및 간병 혜택을 제공하여 가족의 요양 부담을 경감하고 대상자의 삶의 질을 높이는 사회보험제도입니다.",
    target: "만 65세 이상 고령자 또는 만 65세 미만 중 노인성 질병(파킨슨병, 뇌출혈/뇌경색, 치매 등)으로 거동 장애를 가진 자",
    steps: [
      { title: "장기요양 인정 신청 접수", desc: "국민건강보험공단 지사 방문, 우편, 팩스 또는 노인장기요양보험 홈페이지(www.longtermcare.or.kr)를 통해 신청서를 접수합니다." },
      { title: "공단 직원의 댁내 방문 조사", desc: "신청 완료 후 건보공단 소속 간호사/사회복지사가 가정을 방문해 신체/정신 상태 52개 항목을 인터뷰 방식으로 직접 대면 조사합니다." },
      { title: "등급 판정 및 요양인정서 교부", desc: "주치의 의사소견서를 제출하면 등급판정위원회의 심의를 거쳐 장기요양등급(1~5등급, 인지지원등급)이 최종 확정되며 요양 서비스를 개시합니다." }
    ],
    docs: [
      "장기요양인정신청서",
      "의사소견서 (방문조사 이후 공단이 지정한 기한 내 제출 필요)",
      "신청인 신분증 (대리인 신청 시: 대리인의 신분증 및 위임 서명 필요)"
    ],
    link: "https://www.longtermcare.or.kr",
    linkText: "노인장기요양보험 공식 홈페이지 바로가기 ↗"
  }
};

function initWelfareModal() {
  const modalEl = document.getElementById('welfare-modal');
  const closeBtnEl = document.getElementById('modal-close');
  const modalBodyEl = document.getElementById('modal-body');
  
  if (!modalEl || !closeBtnEl || !modalBodyEl) return;
  
  // 모달 열기 함수
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
        <a href="${data.link}" target="_blank" class="modal-btn primary-btn">${data.linkText}</a>
      </div>
    `;
    
    modalEl.classList.add('show');
    document.body.style.overflow = 'hidden'; // 부모 스크롤 잠금
  };
  
  // 모달 닫기 함수
  window.closeWelfareModal = () => {
    modalEl.classList.remove('show');
    document.body.style.overflow = '';
  };
  
  closeBtnEl.onclick = () => window.closeWelfareModal();
  
  // 바깥 레이어 클릭 시 닫기
  modalEl.onclick = (e) => {
    if (e.target === modalEl) {
      window.closeWelfareModal();
    }
  };
}

// 초기화 호출 및 이벤트 연결
initWelfareModal();
document.querySelectorAll('.welfare-card').forEach(card => {
  card.onclick = () => window.openWelfareModal(card.dataset.welfare);
});

// 개인정보처리방침 및 이용약관 데이터 정의
const LEGAL_CONTENT = {
  privacy: {
    title: "개인정보처리방침",
    desc: `
      <p>본 서비스(이하 '장애서류 길잡이')는 이용자의 개인정보를 매우 소중하게 생각하며, 개인정보보호법 등 관련 법령을 성실히 준수합니다.</p>
      <br>
      <h4>1. 개인정보의 수집 및 이용 목적</h4>
      <p>본 서비스는 별도의 회원가입이나 로깅 없이 즉각적으로 이용 가능한 정적 정보 제공 웹사이트입니다. <strong>장애정도 예측 시뮬레이터 등을 포함한 서비스 이용 전체 과정에서 이용자의 이름, 연락처, 신체 계측 정보 등의 개인식별 정보를 서버에 전송하거나 임의 수집하지 않습니다.</strong> 모든 입력 데이터는 이용자 본인의 모바일 또는 PC 브라우저상에서 즉시 모의 연산 후 소멸됩니다.</p>
      <br>
      <h4>2. 제3자 정보 제공 및 개인정보 위탁</h4>
      <p>본 서비스는 개인정보 자체를 수집하지 않으므로, 수집된 정보를 타 기관에 공유하거나 외부에 분석 위탁을 수행하지 않습니다.</p>
      <br>
      <h4>3. 쿠키(Cookie) 및 제휴 서비스 광고 정책</h4>
      <p>이용자에게 맞춤형 혜택 정보와 광고 등을 제공하기 위해 구글 애드센스(Google AdSense) 등 외부 광고 플랫폼을 게재할 수 있으며, 이 과정에서 분석 쿠키가 활용될 수 있습니다. 이용자는 브라우저 개인정보 옵션을 통해 쿠키 수집을 전면 차단할 수 있습니다.</p>
      <br>
      <h4>4. 문의 처</h4>
      <p>서비스 관리 책임자 메일: rkstmtk@gmail.com</p>
    `
  },
  terms: {
    title: "서비스 이용약관",
    desc: `
      <p>장애서류 길잡이 포털 서비스를 이용해 주셔서 감사합니다. 본 약관은 서비스 이용조건 및 유의사항에 대해 설명합니다.</p>
      <br>
      <h4>1. 정보 제공의 목적</h4>
      <p>본 포털에서 제공하는 질환별 장애진단 서류 안내 및 복지 제도 혜택 정보는 보건복지부, 국민연금공단, 건강보험공단의 공식 고시 법령을 기반으로 보호자들의 이해를 돕기 위해 무상으로 제공되는 교육/정보용 자료입니다. <strong>예측 시뮬레이터를 통해 산출된 등급 범위 및 가능성은 정밀한 공식 판정이 아니며 법적 보증 효력이 없습니다.</strong></p>
      <br>
      <h4>2. 면책 조항 및 손해 배상</h4>
      <p>정보의 적시성 및 신뢰성을 확보하기 위해 노력하고 있으나, 본 정보에 의존하여 행해진 결과나 대리 행위에 대해 관리자는 민형사상 법적 책임을 지지 않습니다. 공식 판정은 반드시 전문의의 정밀 소견과 국가 심사 기관의 최종 결과에 기반해 처리되어야 합니다.</p>
      <br>
      <h4>3. 소유권 및 서비스 변경</h4>
      <p>본 사이트 내의 독창적인 디자인 템플릿, 데이터 구조 및 자가진단 로직의 지적 재산권은 원작자에게 귀속되며 무단 복제 및 재배포를 금지합니다.</p>
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

// 약관 초기화 호출
initLegalModal();

// 온라인 문의 모달 제어 로직
function initContactModal() {
  const contactModal = document.getElementById('contact-modal');
  if (!contactModal) return;

  // 닫고 다시 열 때를 대비해 초기 모달 내용 캐싱
  const originalHtml = contactModal.innerHTML;

  window.openContactModal = () => {
    // 매번 열 때마다 폼 형태 복원
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

    // 성공 완료 템플릿 렌더링
    const contentBox = contactModal.querySelector('.modal-content');
    if (contentBox) {
      contentBox.innerHTML = `
        <button type="button" class="modal-close-btn" onclick="window.closeContactModal()">&times;</button>
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 56px; margin-bottom: 24px; animation: scaleUp 0.3s ease-out;">✉️</div>
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

// 부드러운 스크롤 이동 기능 (Sticky Header 오프셋 보정)
window.scrollToSection = (e, selector) => {
  e.preventDefault();
  const target = document.querySelector(selector);
  if (target) {
    const offset = 75; // 헤더 높이
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

// 최상단으로 스무스 스크롤 이동
window.scrollToTop = (e) => {
  if (e) e.preventDefault();
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};
