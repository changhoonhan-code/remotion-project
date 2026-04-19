/**
 * 폴라 좌표(각도, 반지름)를 데카르트 좌표(x, y)로 환산하는 헬퍼 함수
 */
export const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInRadians: number) => {
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };
  
/**
 * SVG Path의 'd' 속성을 생성하는 함수 부채꼴 모양을 만듭니다.
 */
export const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
// [중요 버그 수정]: 완전한 360도 원(Math.PI * 2)을 그릴 때 시작점과 끝점이 같아져 SVG Path가 사라지는 이슈 방지
let effectiveEndAngle = endAngle;
if (endAngle - startAngle >= Math.PI * 2) {
    effectiveEndAngle = startAngle + Math.PI * 2 - 0.0001;
}

const start = polarToCartesian(x, y, radius, effectiveEndAngle);
const end = polarToCartesian(x, y, radius, startAngle);
const largeArcFlag = effectiveEndAngle - startAngle <= Math.PI ? "0" : "1";

return [
    "M", x, y,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "Z",
].join(" ");
};
