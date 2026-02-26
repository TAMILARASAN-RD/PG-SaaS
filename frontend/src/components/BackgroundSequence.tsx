'use client'

import React, { useEffect, useRef } from 'react';

const FRAME_COUNT = 192;
const FPS = 24;

export default function BackgroundSequence() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Load all images into memory for smooth playback
        const images: HTMLImageElement[] = [];
        let loadedImages = 0;

        for (let i = 1; i <= FRAME_COUNT; i++) {
            const img = new Image();
            img.src = `/sequence/24 (${i}).jpg`;
            img.onload = () => {
                loadedImages++;
                // Draw first frame immediately when it loads
                if (i === 1) drawImageProp(ctx, img, 0, 0, canvas.width, canvas.height);
            };
            images.push(img);
        }

        let frameIndex = 0;
        let lastTime = 0;
        let animationFrameId: number;

        const render = (time: number) => {
            // Calculate delta time to enforce FPS
            if (!lastTime) lastTime = time;
            const deltaTime = time - lastTime;
            const frameInterval = 1000 / FPS;

            if (deltaTime >= frameInterval) {
                lastTime = time - (deltaTime % frameInterval);

                if (loadedImages === FRAME_COUNT) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    const currentImg = images[frameIndex];
                    if (currentImg && currentImg.complete) {
                        drawImageProp(ctx, currentImg, 0, 0, canvas.width, canvas.height);
                    }
                    frameIndex = (frameIndex + 1) % FRAME_COUNT;
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Redraw current frame on resize
            if (images[frameIndex]) {
                drawImageProp(ctx, images[frameIndex], 0, 0, canvas.width, canvas.height);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial sizing

        animationFrameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Utility to simulate 'object-fit: cover' on canvas
    function drawImageProp(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, offsetX = 0.5, offsetY = 0.5) {
        if (arguments.length === 2) {
            x = y = 0;
            w = ctx.canvas.width;
            h = ctx.canvas.height;
        }

        // Keep bounds [0.0, 1.0]
        if (offsetX < 0) offsetX = 0;
        if (offsetY < 0) offsetY = 0;
        if (offsetX > 1) offsetX = 1;
        if (offsetY > 1) offsetY = 1;

        let iw = img.width,
            ih = img.height,
            r = Math.min(w / iw, h / ih),
            nw = iw * r,
            nh = ih * r,
            cx, cy, cw, ch, ar = 1;

        // Decide which gap to fill    
        if (nw < w) ar = w / nw;
        if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;
        nw *= ar;
        nh *= ar;

        // Calc source coords
        cw = iw / (nw / w);
        ch = ih / (nh / h);

        cx = (iw - cw) * offsetX;
        cy = (ih - ch) * offsetY;

        if (cx < 0) cx = 0;
        if (cy < 0) cy = 0;
        if (cw > iw) cw = iw;
        if (ch > ih) ch = ih;

        ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
    }

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
        />
    );
}
