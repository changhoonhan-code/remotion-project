import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  random,
} from 'remotion';

// --- [ 더미 데이터 설정 ] ---
const WORDS = ['Right', 'Now', 'Market', 'Crushing', 'Quantum', 'Turbo'];
const INITIAL_PRICE = 2841.07;

/**
 * 1. 왼쪽 컬럼: 코드가 흐르는 배경 레이어
 */
const CodeSection: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div className="flex-1 h-full bg-[#0a0a0a] border-r border-white/5 relative overflow-hidden p-6">
      <div 
        className="text-blue-400/20 font-mono text-sm leading-relaxed whitespace-pre"
        style={{ transform: `translateY(${-frame * 0.5}px)` }}
      >
        {`class Program {
  static void Main() {
    var market = new MarketData();
    while(true) {
      market.Analyze();
      if(market.IsBullish) {
        ExecuteTrade("BUY");
      }
    }
  }
}`}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
      <div className="relative z-10 h-full flex items-center justify-center">
        <span className="text-white/10 font-black text-8xl rotate-90 whitespace-nowrap">METAVERSE</span>
      </div>
    </div>
  );
};

/**
 * 2. 중앙 컬럼: 실시간 데이터 지터 및 텍스트 전환
 */
const MarketSection: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 15프레임마다 단어 교체 (Flicker/Glitch 효과 시뮬레이션)
  const wordIndex = Math.floor(frame / 12) % WORDS.length;
  const currentWord = WORDS[wordIndex];

  // 가격 지터 애니메이션 (실시간 시장 데이터 느낌)
  // [권장] 결정론적 렌더링을 위해 remotion의 random() 함수를 사용합니다.
  const priceChange = Math.sin(frame * 0.8) * 50 + (random(frame) - 0.5) * 5;
  const currentPrice = (INITIAL_PRICE + priceChange).toFixed(2);
  const isUp = priceChange > 0;

  const spr = spring({ frame, fps, config: { damping: 12 } });
  const scale = interpolate(spr, [0, 1], [0.8, 1]);

  return (
    <div className="flex-1 h-full bg-[#080808] border-r border-white/5 flex flex-col items-center justify-center p-4 relative">
      <div 
        className="absolute inset-0 opacity-10"
        style={{ 
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 0)', 
          backgroundSize: '20px 20px' 
        }}
      />
      
      {/* 고속 텍스트 교체 (Glitch) */}
      <h2 
        className={`text-7xl font-black mb-4 transition-colors duration-75 ${isUp ? 'text-green-500' : 'text-red-500'}`}
        style={{ transform: `scale(${scale})` }}
      >
        {currentWord}
      </h2>

      <div className="text-center font-mono">
        <div className="text-white text-xl font-bold mb-1">Price: {currentPrice}</div>
        <div className={isUp ? 'text-green-400' : 'text-red-400'}>
          ({isUp ? '+' : ''}{priceChange.toFixed(2)}, {((priceChange / INITIAL_PRICE) * 100).toFixed(2)}%)
        </div>
      </div>

      <div className="absolute bottom-10 text-white/5 font-black text-6xl tracking-tighter uppercase select-none">AMZN MSFT</div>
    </div>
  );
};

/**
 * 3. 오른쪽 컬럼: 스포트라이트 하이라이트 효과가 있는 리뷰
 */
const ReviewSection: React.FC = () => {
  const frame = useCurrentFrame();
  
  // 스포트라이트 위치 애니메이션 (좌우 왕복)
  const spotlightX = interpolate(
    Math.sin(frame / 20),
    [-1, 1],
    [20, 80]
  );

  return (
    <div className="flex-1 h-full bg-[#050505] flex flex-col justify-center p-10 relative">
      <div className="flex gap-1 mb-6">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-yellow-400 text-3xl">★</span>
        ))}
      </div>

      <div className="relative">
        {/* 스포트라이트 마스크 레이어 */}
        <div 
          className="absolute w-40 h-20 bg-white/20 blur-3xl rounded-full pointer-events-none -translate-y-1/2 top-1/2"
          style={{ left: `${spotlightX}%` }}
        />
        
        <p className="text-white/60 text-2xl font-medium leading-relaxed italic z-10 relative">
          "Everything exactly finish as to support is expected. 
          <span className="text-white"> Seamless and works super </span>
          interface experience Incredible clean."
        </p>
      </div>

      <div className="mt-10 text-right">
        <span className="text-white/40 font-mono text-lg">- Quantum_User_x4</span>
      </div>
    </div>
  );
};

export const SplitScreenReview: React.FC = () => {
  return (
    <AbsoluteFill className="flex flex-row overflow-hidden">
      <CodeSection />
      <MarketSection />
      <ReviewSection />
    </AbsoluteFill>
  );
};
