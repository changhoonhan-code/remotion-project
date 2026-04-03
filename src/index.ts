import "./index.css";
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

// [임시 조치] MediaSession API의 음수 위치값 에러를 방지하기 위한 몽키 패치
if (typeof window !== "undefined" && window.navigator && window.navigator.mediaSession) {
  const originalSetPositionState = window.navigator.mediaSession.setPositionState;
  (window.navigator.mediaSession as any).setPositionState = function (state: any) {
    if (state && typeof state.position === 'number' && state.position < 0) {
      // 음수 위치값은 0으로 조정하여 에어 방지 (디버깅용)
      return originalSetPositionState.call(this, { ...state, position: 0 });
    }
    return originalSetPositionState.call(this, state);
  };
}

registerRoot(RemotionRoot);
