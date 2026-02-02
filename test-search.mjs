/**
 * 测试基金搜索功能
 */

async function testSearch() {
  const url = `https://fund.eastmoney.com/js/fundcode_search.js?timestamp=${Date.now()}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    // 解析返回的数据
    const match = text.match(/var r = (\[.*?\]);/);
    if (!match) {
      console.error('无法解析基金数据');
      return;
    }

    const fundsData = JSON.parse(match[1]);
    console.log(`总基金数量: ${fundsData.length}`);

    // 测试搜索 110022
    const keyword = '110022';
    const filtered = fundsData.filter(fund => {
      const code = fund[0] || '';
      const name = fund[2] || '';
      return code.includes(keyword) || name.includes(keyword);
    });

    console.log(`\n搜索 "${keyword}" 结果: ${filtered.length} 条`);
    filtered.slice(0, 5).forEach(fund => {
      console.log(`- ${fund[0]}: ${fund[2]} (${fund[3]})`);
    });

    // 测试搜索 易方达
    const keyword2 = '易方达';
    const filtered2 = fundsData.filter(fund => {
      const code = fund[0] || '';
      const name = fund[2] || '';
      const pinyin = fund[1] || '';
      return code.includes(keyword2) || name.includes(keyword2) || pinyin.includes(keyword2);
    }).slice(0, 5);

    console.log(`\n搜索 "${keyword2}" 前5条:`);
    filtered2.forEach(fund => {
      console.log(`- ${fund[0]}: ${fund[2]} (${fund[3]})`);
    });

  } catch (error) {
    console.error('测试失败:', error);
  }
}

testSearch();
