"use client";

import React, { useEffect, useRef, useState } from "react";

interface FadeInOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

/**
 * FadeInOnScroll
 * Componente que aplica una animación suave de entrada (fade-in + ligero slide)
 * al ingresar en el viewport durante el scroll del usuario.
 */
export function FadeInOnScroll({
  children,
  className = "",
  delayMs = 0,
  direction = "up",
}: FadeInOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Si el usuario prefiere no tener animaciones (accesibilidad)
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    // Si el elemento ya está visible en el viewport al renderizar, marcarlo visible
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const getTransformClasses = () => {
    if (isVisible) {
      return "opacity-100 translate-x-0 translate-y-0";
    }

    switch (direction) {
      case "up":
        return "opacity-0 translate-y-6";
      case "down":
        return "opacity-0 -translate-y-6";
      case "left":
        return "opacity-0 translate-x-6";
      case "right":
        return "opacity-0 -translate-x-6";
      case "none":
        return "opacity-0";
      default:
        return "opacity-0 translate-y-6";
    }
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delayMs}ms`,
      }}
      className={`transition-all duration-700 ease-out will-change-[opacity,transform] ${getTransformClasses()} ${className}`}
    >
      {children}
    </div>
  );
}
