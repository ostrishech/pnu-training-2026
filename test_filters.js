const fs = require('fs');
const path = require('path');

// Test logic mirroring index.html filter implementation
async function runTests() {
  const csvPath = path.join(__dirname, 'sample_data.csv');
  const csvText = fs.readFileSync(csvPath, 'utf8');

  // Simple CSV parser replicating PapaParse with header
  const lines = csvText.trim().split('\n');
  const rawHeaders = lines[0].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
  const headers = rawHeaders.map(h => h.replace(/^"|"$/g, '').trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    // Regex for CSV split handling quotes
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches = [];
    let match;
    while ((match = regex.exec(lines[i])) !== null) {
      let val = match[1] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      matches.push(val.trim());
      if (regex.lastIndex >= lines[i].length) break;
    }
    if (matches.length > 0 && matches[0]) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = matches[idx] || '';
      });
      if (obj['과정코드'] && obj['과정명']) {
        rows.push(obj);
      }
    }
  }

  console.log(`[TEST 1] Data Parsing: Loaded ${rows.length} valid courses.`);
  if (rows.length !== 32) throw new Error(`Expected 32 courses, got ${rows.length}`);

  // Test Filtering Function
  function filterCourses(category = 'ALL', type = 'ALL', target = 'ALL', method = 'ALL', query = '') {
    return rows.filter(item => {
      if (category !== 'ALL' && item['분야'] !== category) return false;
      if (type !== 'ALL') {
        const itemType = item['이수구분'] || '';
        if (type === '필수' && !itemType.includes('필수')) return false;
        if (type === '권장' && !itemType.includes('권장')) return false;
        if (type === '선택' && !itemType.includes('선택')) return false;
      }
      if (target !== 'ALL' && !(item['대상'] || '').includes(target)) return false;
      if (method !== 'ALL' && !(item['교육방식'] || '').includes(method)) return false;
      if (query) {
        const searchPool = [
          item['과정명'] || '',
          item['과정코드'] || '',
          item['분야'] || '',
          item['담당부서'] || '',
          item['한줄소개'] || '',
          item['상세소개'] || '',
          item['주요내용'] || '',
          item['대상'] || ''
        ].join(' ').toLowerCase();
        if (!searchPool.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }

  // [TEST 2] Category Filters
  const legal = filterCourses('법정의무교육');
  console.log(`[TEST 2] 법정의무교육 Category Filter: ${legal.length} courses (Expected: 6)`);
  if (legal.length !== 6) throw new Error('법정의무교육 count mismatch');

  const ai = filterCourses('정보화·AI·데이터');
  console.log(`[TEST 2] 정보화·AI·데이터 Filter: ${ai.length} courses (Expected: 4)`);
  if (ai.length !== 4) throw new Error('정보화·AI·데이터 count mismatch');

  // [TEST 3] Type Filter
  const required = filterCourses('ALL', '필수');
  console.log(`[TEST 3] 필수 이수구분 Filter: ${required.length} courses (Expected: 7 [6 필수 + 1 필수(해당자)])`);
  if (required.length !== 7) throw new Error('Required count mismatch');

  // [TEST 4] Method Filter
  const online = filterCourses('ALL', 'ALL', 'ALL', '온라인');
  console.log(`[TEST 4] 온라인 교육방식 Filter: ${online.length} courses (Expected: 8)`);
  if (online.length !== 8) throw new Error('Online method count mismatch');

  // [TEST 5] Search Query
  const searchAi = filterCourses('ALL', 'ALL', 'ALL', 'ALL', '생성형');
  console.log(`[TEST 5] Search '생성형': Found ${searchAi.length} courses. Matches:`, searchAi.map(c => c['과정명']));
  if (searchAi.length === 0) throw new Error('Search failed to find 생성형 AI course');

  const searchDept = filterCourses('ALL', 'ALL', 'ALL', 'ALL', '총무과');
  console.log(`[TEST 5] Search '총무과': Found ${searchDept.length} courses.`);
  if (searchDept.length === 0) throw new Error('Search failed to find 총무과 courses');

  // [TEST 6] Combined Filters
  const combined = filterCourses('법정의무교육', '필수', '전 직원', '온라인');
  console.log(`[TEST 6] Combined (법정 + 필수 + 전직원 + 온라인): ${combined.length} courses.`);
  if (combined.length === 0) throw new Error('Combined filter should have results');

  console.log('\n>>> ALL 6 TEST SUITES PASSED PERFECTLY! <<<');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
