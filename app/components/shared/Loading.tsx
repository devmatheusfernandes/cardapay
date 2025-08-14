"use client";

import React from "react";
import { Data, DotLottieReact } from "@lottiefiles/dotlottie-react";
import { SectionContainer } from "./Container";

interface LoadingProps {
  animationUrl?: string | object; // Aceita string (URL) ou objeto JSON
  size?: number;
  text?: string;
  fullScreen?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  animationUrl,
  size = 120,
  text,
  fullScreen = false,
  loop = true,
  autoplay = true,
  className = "",
}) => {
  const containerClasses = fullScreen
    ? "fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-[999]"
    : `flex items-center justify-center p-4 ${className}`;

  return (
    <SectionContainer className="flex flex-col items-center justify-center min-h-screen overflow-y-hidden">
      <div className={containerClasses}>
        <div className="flex flex-col items-center justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            {animationUrl ? (
              <DotLottieReact
                src={
                  typeof animationUrl === "string" ? animationUrl : undefined
                }
                data={
                  typeof animationUrl === "object"
                    ? (animationUrl as Data)
                    : undefined
                }
                loop={loop}
                autoplay={autoplay}
                style={{ width: size, height: size }}
              />
            ) : (
              <div className="mt-6 animate-spin rounded-full border-5 border-emerald-200 border-t-emerald-600 w-12 h-12" />
            )}
          </div>
          {text && (
            <p className="text-sm font-medium text-gray-700 animate-pulse text-center">
              {text}
            </p>
          )}
        </div>
      </div>
    </SectionContainer>
  );
};

export default Loading;
