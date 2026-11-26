// 시공 사례 — 광고주에게 받은 현장 사진으로 채웁니다 (블로그 글과 별개)
// 사진은 img/cases/ 폴더에 넣고 경로를 적습니다. 첫 번째 사진이 목록 대표 사진이 됩니다.
// service 값: 기와 · 징크 · 칼라강판 · 옥상방수 · 빗물받이 · 외벽 (필터 버튼과 같아야 함, 사례가 없는 버튼은 자동으로 숨김)
//   기와 = 한식 기와형 강판·기와형 칼라강판 / 칼라강판 = 평판·골강판 지붕
// region 값: 양주 · 동두천 · 일산 · 포천 · 연천 · 그 밖의 지역 이름 (그 밖의 지역은 '그 밖의 지역' 필터로 묶임)
// period(공사 기간), material(자재)은 확인되면 적습니다. 비어 있으면 화면에 나오지 않습니다.
const C = (slug, names) => names.map((n) => `img/cases/${slug}-${n}.jpg`);
window.CASES = [
  { title: '양주 봉암리 한옥 기와형 강판 지붕', service: '기와', region: '양주', period: '', material: '',
    photos: C('yangju', ['after', 'before', 'frame-1', 'frame-2', 'finish-1', 'finish-2']),
    note: '내려앉기 시작한 한옥 기와 지붕을 걷어 내고, 목재로 지붕 틀을 새로 짠 뒤 한식 기와형 강판으로 덮었습니다. 처마 끝 장식까지 한옥 모양 그대로 살렸습니다.' },
  { title: '포천 송우리 빌라 기와형 강판 지붕', service: '기와', region: '포천', period: '', material: '',
    photos: C('pocheon', ['after', 'before', 'frame-1', 'frame-2', 'finish-1', 'finish-2']),
    note: '4층 빌라의 낡은 지붕 위에 각재로 틀을 잡고, 빨간 기와형 강판으로 새로 덮었습니다. 드론으로 찍은 시공 전·중·후 사진입니다.' },
  { title: '동두천 단독주택 기와형 강판 지붕', service: '기와', region: '동두천', period: '', material: '',
    photos: ['img/cases/dongducheon-ba-after.jpg', 'img/cases/dongducheon-ba-before.jpg', 'img/cases/dongducheon-frame-1.jpg', 'img/cases/dongducheon-frame-2.jpg', 'img/cases/dongducheon-frame-3.jpg', 'img/cases/dongducheon-finish-1.jpg'],
    note: '낡은 지붕 위에 목재로 새 틀을 짜고, 기와 모양 칼라강판으로 덮었습니다. 시공 전 → 틀 작업 → 마감 순서로 사진을 넘겨 보세요.' },
  { title: '연천 단층 주택 기와형 강판 지붕', service: '기와', region: '연천', period: '', material: '',
    photos: C('yeoncheon-b', ['after', 'before', 'finish-1', 'finish-2', 'finish-3']),
    note: '방수포를 덮어 두었던 단층 주택 지붕을 녹색 기와형 강판으로 새로 덮고, 용마루와 처마 끝 장식까지 마감했습니다.' },
  { title: '연천 단층 건물 칼라강판 지붕', service: '칼라강판', region: '연천', period: '', material: '',
    photos: C('yeoncheon-a', ['after', 'before', 'frame-1', 'frame-2']),
    note: '파란 방수포로 덮여 있던 지붕 위에 각재로 틀을 잡고, 녹색 칼라강판으로 덮었습니다. 출입구 위 작은 지붕까지 함께 바꿨습니다.' },
  { title: '철원 동송 건물 골강판 지붕 교체', service: '칼라강판', region: '철원', period: '', material: '포스코 강판',
    photos: C('cheorwon', ['after', 'before', 'frame-1', 'posco', 'sheet']),
    note: '빛바랜 강판 지붕 위에 각재를 대고, 포스코 정품 골강판으로 새로 덮었습니다. 양옆 벽면도 같은 색으로 맞췄습니다.' },
  { title: '인천 제물포 빌라 평지붕 위 경사 지붕', service: '기와', region: '인천', period: '', material: '',
    photos: C('incheon', ['after', 'before', 'finish-1', 'finish-2', 'finish-3', 'finish-4']),
    note: '물이 고이기 쉬운 평평한 옥상 위에 경사 지붕을 새로 올리고, 갈색 기와형 강판으로 덮었습니다.' },
];
