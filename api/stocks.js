export default async function handler(req, res) {
    // 주식 및 환율 티커 (야후 파이낸스)
    const symbols = {
        // 글로벌 증시
        kospi: '^KS11',
        kosdaq: '^KQ11',
        snp: '^GSPC',
        nasdaq: '^IXIC',
        nikkei: '^N225',
        shanghai: '000001.SS',
        // 환율 (원화 기준)
        usd: 'KRW=X',      // 1달러 = ?원
        jpy: 'JPYKRW=X',   // 1엔 = ?원 (나중에 100 곱함)
        cny: 'CNYKRW=X',   // 1위안 = ?원
        eur: 'EURKRW=X'    // 1유로 = ?원
    };

    try {
        const results = {};

        // 모든 데이터를 동시에 요청
        const fetchPromises = Object.entries(symbols).map(async ([key, symbol]) => {
            const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            
            if (!response.ok) throw new Error(`Failed to fetch ${symbol}`);
            const data = await response.json();

            const meta = data.chart.result[0].meta;
            const price = meta.regularMarketPrice;
            const prevClose = meta.chartPreviousClose;
            
            const changeRate = ((price - prevClose) / prevClose) * 100;

            results[key] = {
                price: price, // 계산을 위해 숫자 그대로 전달
                rate: parseFloat(changeRate.toFixed(2))
            };
        });

        await Promise.all(fetchPromises);
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(200).json(results);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '데이터를 가져오는 데 실패했습니다.' });
    }
}
