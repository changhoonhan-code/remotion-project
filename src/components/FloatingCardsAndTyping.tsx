import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Img,
} from "remotion";

/**
 * 카드의 개별 속성을 정의하는 인터페이스
 */
interface CardProps {
  title: string;
  source: string;
  x: number;
  y: number;
  delay: number;
}

/**
 * 컴포넌트 전체 프롭스 정의
 */
interface FloatingCardsAndTypingProps {
  typingText?: string;
  cards?: CardProps[];
}

export const FloatingCardsAndTyping: React.FC<FloatingCardsAndTypingProps> = ({
  typingText = "Writing newsletter commentary takes forever.",
  cards = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- [ 타이핑 애니메이션 원리 ] ---
  // interpolate 함수를 사용하여 시간에 따라 보여줄 글자 수를 결정합니다.
  // 0프레임에서 80프레임까지 진행되면서 0개부터 전체 글자 수까지 선형적으로 증가합니다.
  const charsShown = Math.floor(
    interpolate(frame, [45, 120], [0, typingText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const displayedText = typingText.slice(0, charsShown);

  return (
    <AbsoluteFill className="bg-[#f0f0f0] overflow-hidden font-sans">
      {/* 
        [ 배경 이미지 설정 ]
        레퍼런스 영상과 유사한 분위기를 내기 위해 생성된 흑백 풍경 이미지를 사용합니다.
      */}
      <AbsoluteFill>
        <Img 
          src={staticFile("background.png")} 
          alt="background" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'grayscale(1) brightness(1.1) contrast(1.1)',
            opacity: 0.7
          }} 
        />
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'radial-gradient(rgba(0,0,0,0.1) 1px, transparent 0)',
            backgroundSize: '15px 15px',
            opacity: 0.3
          }}
        />
      </AbsoluteFill>

      {/* 
        [ 중앙 타이핑 텍스트 ]
        카드들 뒤에 깔리거나 위치 관계를 위해 먼저 렌더링하거나 z-index 조절.
        중앙 배치를 위해 전용 absolute flex 컨테이너 사용.
      */}
      <AbsoluteFill className="flex items-center justify-center z-10 pointer-events-none">
        <div className="w-[1000px] text-center mt-20">
          <h1 
            className="text-6xl font-black text-gray-900 leading-tight drop-shadow-sm"
            style={{ 
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '-0.02em'
            }}
          >
            {displayedText}
            {/* 깜빡이는 커서 효과 */}
            <span 
              className="inline-block w-[4px] h-[60px] bg-slate-900 ml-2 align-middle rounded-full"
              style={{ 
                opacity: Math.floor(frame / 10) % 2 === 0 ? 1 : 0,
                visibility: charsShown === typingText.length && (Math.floor(frame / 15) % 2 === 0) ? 'hidden' : 'visible'
              }}
            />
          </h1>
        </div>
      </AbsoluteFill>

      {/* 
        [ 카드 렌더링 및 애니메이션 ]
        각 카드는 개별적인 딜레이를 가지고 'spring' 효과와 함께 등장합니다.
        z-index를 주어 텍스트 앞에 오도록 설정.
      */}
      {cards.map((card, i) => {
        const spr = spring({
          frame: frame - card.delay,
          fps,
          config: {
            damping: 15,
            stiffness: 120,
          },
        });

        const hoverFloat = Math.sin(frame / 30 + i) * 10;
        const scale = interpolate(spr, [0, 1], [0.5, 1]);
        const opacity = interpolate(spr, [0, 0.5], [0, 1]);
        const translateY = interpolate(spr, [0, 1], [30, 0]);

        const topBarColors = ['#ff5f57', '#ffbd2e', '#27c93f', '#007aff'];
        const barColor = topBarColors[i % topBarColors.length];

        return (
          <div
            key={i}
            className="absolute rounded-xl shadow-2xl bg-white/95 border border-black/5 flex flex-col p-4 w-[320px] z-20"
            style={{
              left: `${card.x}px`,
              top: `${card.y}px`,
              transform: `scale(${scale}) translateY(${translateY + hoverFloat}px)`,
              opacity,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div 
              className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" 
              style={{ backgroundColor: barColor }} 
            />
            
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: barColor }} />
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{card.source}</span>
            </div>
            <div className="text-gray-800 text-lg font-bold leading-tight">{card.title}</div>
          </div>
        );
      })}

      {/* 영상 테두리 비네팅 효과 (Vignette) */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.05)] z-30" />
    </AbsoluteFill>
  );
};