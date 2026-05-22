export default async function handler(req, res) {
    // 가져올 야후 파이낸스 증시 티커(심볼) 목록
    const symbols = {
        kospi: '^KS11',
        kosdaq: '^KQ11',
        snp: '^GSPC',
        nasdaq: '^IXIC',
        nikkei: '^N225',
        shanghai: '000001.SS'
    };

    try {
        const results = {};

        // 모든 티커에 대해 동시에 데이터를 요청
        const fetchPromises = Object.entries(symbols).map(async ([key, symbol]) => {
            // 야후 파이낸스 차트 API 호출 (무료, 키 불필요)
            const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`, {
                headers: {
                    // 야후에서 차단하지 않도록 일반 브라우저인 척 위장
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });
            
            if (!response.ok) throw new Error(`Failed to fetch ${symbol}`);
            const data = await response.json();

            // 응답 데이터에서 현재 가격과 이전 종가 추출
            const meta = data.chart.result[0].meta;
            const price = meta.regularMarketPrice;
            const prevClose = meta.chartPreviousClose;
            
            // 등락률 계산: ((현재가 - 이전종가) / 이전종가) * 100
            const changeRate = ((price - prevClose) / prevClose) * 100;

            results[key] = {
                price: price.toLocaleString('en-US', { maximumFractionDigits: 2 }),
                rate: parseFloat(changeRate.toFixed(2))
            };
        });

        // 모든 요청이 끝날 때까지 대기
        await Promise.all(fetchPromises);
        
        // 프론트엔드로 데이터 전달 (CORS 허용)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json(results);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '증시 데이터를 가져오는 데 실패했습니다.' });
    }
}
