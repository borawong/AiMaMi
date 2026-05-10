/**
 * Magic UI Cool Mode — click/drag particle burst (https://magicui.design/docs/components/cool-mode)
 * Div circles, single transform update. RAF runs only while particles exist or drag-spawn is active
 * (aligned with upstream behavior: no perpetual idle loop).
 */
import { type ReactNode, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/** Below modal stack (see `dialog.tsx`); above app chrome (~z-70). */
const COOL_MODE_Z = 90;

export interface BaseParticle {
  element: HTMLDivElement;
  left: number;
  size: number;
  top: number;
}

export interface BaseParticleOptions {
  particle?: string;
  size?: number;
}

export interface CoolParticle extends BaseParticle {
  direction: number;
  speedHorz: number;
  speedUp: number;
  spinSpeed: number;
  spinVal: number;
}

export interface CoolParticleOptions extends BaseParticleOptions {
  particleCount?: number;
  speedHorz?: number;
  speedUp?: number;
  /** Max simultaneous particles — upstream default ~45 */
  maxParticles?: number;
  spawnIntervalMs?: number;
  burstOnPress?: number;
  spreadPx?: number;
}

const getContainer = () => {
  const id = "_coolMode_effect";
  const existingContainer = document.getElementById(id);

  if (existingContainer) {
    return existingContainer;
  }

  const container = document.createElement("div");
  container.setAttribute("id", id);
  container.setAttribute(
    "style",
    `overflow:hidden;position:fixed;inset:0;height:100%;pointer-events:none;z-index:${COOL_MODE_Z};contain:strict`,
  );

  document.body.appendChild(container);

  return container;
};

let instanceCounter = 0;

const applyParticleEffect = (
  element: HTMLElement,
  options?: CoolParticleOptions,
): (() => void) => {
  instanceCounter++;

  const defaultParticle = "circle";
  const particleType = options?.particle || defaultParticle;
  const sizes = [10, 14, 18, 22, 28, 34];
  const limit = options?.maxParticles ?? 45;
  const particleGenerationDelay = options?.spawnIntervalMs ?? 24;
  const burstOnPress = options?.burstOnPress ?? 12;
  const spreadPx = options?.spreadPx ?? 12;

  let particles: CoolParticle[] = [];
  let autoAddParticle = false;
  let mouseX = 0;
  let mouseY = 0;

  const container = getContainer();

  let viewportBottom = Math.max(
    window.innerHeight,
    document.documentElement.clientHeight,
  );
  const onResize = () => {
    viewportBottom = Math.max(
      window.innerHeight,
      document.documentElement.clientHeight,
    );
  };
  window.addEventListener("resize", onResize, { passive: true });

  const appendCircleParticle = (particle: HTMLDivElement, size: number) => {
    const hue = Math.floor(Math.random() * 360);
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.borderRadius = "50%";
    particle.style.background = `hsl(${hue} 72% 56%)`;
    particle.style.boxShadow = "0 0 1px hsl(0 0 0 / 0.12)";
  };

  const appendImageParticle = (
    particle: HTMLDivElement,
    imageSrc: string,
    size: number,
  ) => {
    const image = document.createElement("img");
    image.src = imageSrc;
    image.width = size;
    image.height = size;
    image.alt = "";
    image.style.borderRadius = "50%";

    particle.appendChild(image);
  };

  const appendTextParticle = (
    particle: HTMLDivElement,
    particleContent: string,
    size: number,
  ) => {
    const fontSizeMultiplier = 3;
    const emojiSize = size * fontSizeMultiplier;
    const content = document.createElement("div");

    content.textContent = particleContent;
    content.style.fontSize = `${emojiSize}px`;
    content.style.lineHeight = "1";
    content.style.textAlign = "center";
    content.style.width = `${size}px`;
    content.style.height = `${size}px`;
    content.style.display = "flex";
    content.style.alignItems = "center";
    content.style.justifyContent = "center";
    content.style.transform = `scale(${fontSizeMultiplier})`;
    content.style.transformOrigin = "center";

    particle.appendChild(content);
  };

  function generateParticle() {
    const size =
      options?.size || sizes[Math.floor(Math.random() * sizes.length)];
    const speedHorz = options?.speedHorz ?? Math.random() * 10;
    const speedUp = options?.speedUp ?? Math.random() * 25;
    const spinVal = Math.random() * 360;
    const spinSpeed = Math.random() * 35 * (Math.random() <= 0.5 ? -1 : 1);
    const jx = (Math.random() - 0.5) * spreadPx;
    const jy = (Math.random() - 0.5) * spreadPx;
    const top = mouseY + jy - size / 2;
    const left = mouseX + jx - size / 2;
    const direction = Math.random() <= 0.5 ? -1 : 1;

    const particle = document.createElement("div");
    particle.style.position = "absolute";
    particle.style.pointerEvents = "none";
    particle.style.willChange = "transform";

    if (particleType === "circle") {
      appendCircleParticle(particle, size);
    } else if (
      particleType.startsWith("http") ||
      particleType.startsWith("/")
    ) {
      appendImageParticle(particle, particleType, size);
    } else {
      appendTextParticle(particle, particleType, size);
    }

    particle.style.transform = `translate3d(${left}px, ${top}px, 0) rotate(${spinVal}deg)`;

    container.appendChild(particle);

    particles.push({
      direction,
      element: particle,
      left,
      size,
      speedHorz,
      speedUp,
      spinSpeed,
      spinVal,
      top,
    });
  }

  function refreshParticles() {
    const next: CoolParticle[] = [];
    const bottom = viewportBottom;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.left = p.left - p.speedHorz * p.direction;
      p.top = p.top - p.speedUp;
      p.speedUp = Math.min(p.size, p.speedUp - 1);
      p.spinVal = p.spinVal + p.spinSpeed;

      if (p.top >= bottom + p.size) {
        p.element.remove();
        continue;
      }

      p.element.style.transform = `translate3d(${p.left}px, ${p.top}px, 0) rotate(${p.spinVal}deg)`;
      next.push(p);
    }
    particles = next;
  }

  let rafId = 0;
  let lastParticleTimestamp = 0;

  function loop() {
    const currentTime = performance.now();
    if (
      autoAddParticle &&
      particles.length < limit &&
      currentTime - lastParticleTimestamp > particleGenerationDelay
    ) {
      generateParticle();
      lastParticleTimestamp = currentTime;
    }

    refreshParticles();
    const stillActive = particles.length > 0 || autoAddParticle;
    if (stillActive) {
      rafId = requestAnimationFrame(loop);
    } else {
      rafId = 0;
    }
  }

  function ensureLoop() {
    if (rafId === 0) {
      rafId = requestAnimationFrame(loop);
    }
  }

  const isTouchInteraction = "ontouchstart" in window;

  const tap = isTouchInteraction ? "touchstart" : "mousedown";
  const tapEnd = isTouchInteraction ? "touchend" : "mouseup";
  const move = isTouchInteraction ? "touchmove" : "mousemove";

  const updateMousePosition = (e: MouseEvent | TouchEvent) => {
    if ("touches" in e && e.touches?.[0]) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    } else if (!("touches" in e)) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
  };

  const tapHandler = (e: MouseEvent | TouchEvent) => {
    ensureLoop();
    updateMousePosition(e);
    autoAddParticle = true;
    const n = Math.min(burstOnPress, Math.max(0, limit - particles.length));
    for (let i = 0; i < n; i++) {
      generateParticle();
    }
  };

  const disableAutoAddParticle = () => {
    autoAddParticle = false;
  };

  element.addEventListener(move, updateMousePosition, { passive: true });
  element.addEventListener(tap, tapHandler, { passive: true });
  element.addEventListener(tapEnd, disableAutoAddParticle, { passive: true });
  element.addEventListener("mouseleave", disableAutoAddParticle, {
    passive: true,
  });

  return () => {
    element.removeEventListener(move, updateMousePosition);
    element.removeEventListener(tap, tapHandler);
    element.removeEventListener(tapEnd, disableAutoAddParticle);
    element.removeEventListener("mouseleave", disableAutoAddParticle);
    window.removeEventListener("resize", onResize);

    if (rafId !== 0) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    for (const p of particles) {
      p.element.remove();
    }
    particles = [];

    if (--instanceCounter === 0) {
      container.remove();
    }
  };
};

export interface CoolModeProps {
  children: ReactNode;
  options?: CoolParticleOptions;
  className?: string;
}

export function CoolMode({ children, options, className }: CoolModeProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    return applyParticleEffect(el, optsRef.current);
  }, []);

  return (
    <span ref={ref} className={cn("inline-flex", className)}>
      {children}
    </span>
  );
}
