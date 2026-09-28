import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

interface IntroSplashProps {
  onDone: () => void;
  durationMs?: number;
}

const IntroSplash: React.FC<IntroSplashProps> = ({ onDone }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay prevented:", err);
        onDone();
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        ref={videoRef}
        src="/sandysintro.mp4"
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
