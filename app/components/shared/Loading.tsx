import React, { useEffect, useRef, useState } from "react";

// Tipos para as props do componente
interface LoadingProps {
  animationData?: object; // JSON do Lottie
  animationUrl?: string; // URL para carregar o JSON
  variant?: "spinner" | "dots" | "pulse" | "upload" | "download" | "search";
  size?: number; // Tamanho em pixels
  speed?: number; // Velocidade da animação (1 = normal)
  text?: string;
  fullScreen?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  animationData,
  animationUrl,
  variant = "spinner",
  size = 120,
  speed = 1,
  text,
  fullScreen = false,
  loop = true,
  autoplay = true,
  className = "",
}) => {
  const animationContainer = useRef<HTMLDivElement>(null);
  const [lottieAnimation, setLottieAnimation] = useState<any>(null);
  const [isLottieLoaded, setIsLottieLoaded] = useState(false);
  const [animationJson, setAnimationJson] = useState<object | null>(null);

  const defaultAnimations = {
    spinner: {
      v: "5.7.4",
      fr: 30,
      ip: 0,
      op: 60,
      w: 120,
      h: 120,
      nm: "Spinner",
      ddd: 0,
      assets: [],
      layers: [
        {
          ddd: 0,
          ind: 1,
          ty: 4,
          nm: "Circle",
          sr: 1,
          ks: {
            o: { a: 0, k: 100 },
            r: {
              a: 1,
              k: [
                { i: { x: [0], y: [1] }, o: { x: [1], y: [0] }, t: 0, s: [0] },
                { t: 60, s: [360] },
              ],
            },
            p: { a: 0, k: [60, 60] },
            a: { a: 0, k: [0, 0] },
            s: { a: 0, k: [100, 100] },
          },
          ao: 0,
          shapes: [
            {
              ty: "gr",
              it: [
                {
                  d: 1,
                  ty: "el",
                  s: { a: 0, k: [60, 60] },
                  p: { a: 0, k: [0, 0] },
                },
                {
                  ty: "st",
                  c: { a: 0, k: [0.2, 0.6, 1, 1] },
                  o: { a: 0, k: 100 },
                  w: { a: 0, k: 4 },
                },
                {
                  ty: "tr",
                  p: { a: 0, k: [0, 0] },
                  a: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [100, 100] },
                  r: { a: 0, k: 0 },
                  o: { a: 0, k: 100 },
                },
              ],
            },
          ],
          ip: 0,
          op: 60,
          st: 0,
        },
      ],
    },
    dots: {
      v: "5.7.4",
      fr: 30,
      ip: 0,
      op: 90,
      w: 120,
      h: 40,
      nm: "Dots",
      ddd: 0,
      assets: [],
      layers: [],
    },
    pulse: {
      v: "5.7.4",
      fr: 30,
      ip: 0,
      op: 60,
      w: 120,
      h: 120,
      nm: "Pulse",
      ddd: 0,
      assets: [],
      layers: [],
    },
  };

  // Simula o carregamento da biblioteca Lottie
  useEffect(() => {
    const loadLottie = async () => {
      try {
        // Em um projeto real, você instalaria: npm install lottie-web
        // e faria: import lottie from 'lottie-web';

        // Simulando o Lottie para demonstração
        const mockLottie = {
          loadAnimation: (config: any) => ({
            play: () => {},
            pause: () => {},
            stop: () => {},
            setSpeed: (speed: number) => {},
            destroy: () => {},
            addEventListener: (event: string, callback: Function) => {},
          }),
        };

        setLottieAnimation(mockLottie);
        setIsLottieLoaded(true);
      } catch (error) {
        console.error("Erro ao carregar Lottie:", error);
        setIsLottieLoaded(false);
      }
    };

    loadLottie();
  }, []);

  // Carrega animação por URL
  useEffect(() => {
    if (animationUrl) {
      fetch(animationUrl)
        .then((response) => response.json())
        .then((data) => setAnimationJson(data))
        .catch((error) => console.error("Erro ao carregar animação:", error));
    }
  }, [animationUrl]);

  // Inicializa a animação Lottie
  useEffect(() => {
    if (lottieAnimation && animationContainer.current && isLottieLoaded) {
      const animData =
        animationData ||
        animationJson ||
        defaultAnimations[variant as keyof typeof defaultAnimations];

      if (animData) {
        const anim = lottieAnimation.loadAnimation({
          container: animationContainer.current,
          renderer: "svg",
          loop: loop,
          autoplay: autoplay,
          animationData: animData,
        });

        anim.setSpeed(speed);

        return () => {
          anim.destroy();
        };
      }
    }
  }, [
    lottieAnimation,
    isLottieLoaded,
    animationData,
    animationJson,
    variant,
    loop,
    autoplay,
    speed,
  ]);

  // Fallback CSS quando Lottie não está disponível
  const CSSFallback = () => {
    const fallbackStyles = {
      spinner:
        "border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin",
      dots: "flex space-x-2",
      pulse: "bg-blue-600 rounded-full animate-ping",
    };

    if (variant === "dots") {
      return (
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        className={
          fallbackStyles[variant as keyof typeof fallbackStyles] ||
          fallbackStyles.spinner
        }
        style={{ width: size / 4, height: size / 4 }}
      />
    );
  };

  // Container base
  const containerClasses = fullScreen
    ? "fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50"
    : `flex items-center justify-center p-4 ${className}`;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center">
        <div className={containerClasses}>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {isLottieLoaded ? (
                <div
                  ref={animationContainer}
                  style={{ width: size, height: size }}
                  className="flex items-center justify-center"
                />
              ) : (
                <div
                  className="flex items-center justify-center"
                  style={{ width: size, height: size }}
                >
                  <CSSFallback />
                </div>
              )}
            </div>

            {text && (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 animate-pulse">
                  {text}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
