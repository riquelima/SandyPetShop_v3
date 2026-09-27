import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

interface IntroSplashProps {
  onDone: () => void;
  durationMs?: number;
}

const IntroSplash: React.FC<IntroSplashProps> = ({ onDone }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const handleVideoEnded = () => {
    if (!rootRef.current) return;
    anime({
      targets: rootRef.current,
      opacity: [1, 0],
      duration: 500,
      easing: 'easeInOutQuad',
      complete: () => onDone()
    });
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black"
      style={{ opacity: 1 }}
    >
      <video
        src="/splash_video.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnded}
        className="w-full h-full object-cover sm:max-w-[calc(100vh*9/16)]"
      />
    </div>
  );
};

export default IntroSplash;
