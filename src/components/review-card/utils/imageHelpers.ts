import { staticFile } from 'remotion';

// 상대 경로인 경우 Remotion의 public 폴더 참조를 위해 staticFile로 감싸주는 헬퍼
export const getImageUrl = (url: string) => {
    if (url.startsWith('http') || url.startsWith('data:')) {
        return url;
    }
    return staticFile(url);
};
