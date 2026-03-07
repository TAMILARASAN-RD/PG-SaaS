/**
 * background-sequence.js
 * Vanilla JS port of the BackgroundSequence React component
 * Plays a looping image sequence on a canvas element
 */

(function () {
    const FRAME_COUNT = 192;
    const FPS = 24;
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const images = [];
    let loadedImages = 0;
    let frameIndex = 0;
    let lastTime = 0;

    // Utility: draw image like object-fit: cover
    function drawImageCover(ctx, img, x, y, w, h) {
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        let r = Math.min(w / iw, h / ih);
        let nw = iw * r;
        let nh = ih * r;
        let ar = 1;

        if (nw < w) ar = w / nw;
        if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;
        nw *= ar;
        nh *= ar;

        const cw = iw / (nw / w);
        const ch = ih / (nh / h);
        const cx = (iw - cw) * 0.5;
        const cy = (ih - ch) * 0.5;

        ctx.drawImage(img,
            Math.max(0, cx), Math.max(0, cy),
            Math.min(cw, iw), Math.min(ch, ih),
            x, y, w, h
        );
    }

    // Resize canvas to fill parent
    function handleResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (images[frameIndex] && images[frameIndex].complete) {
            drawImageCover(ctx, images[frameIndex], 0, 0, canvas.width, canvas.height);
        }
    }

    // Animation loop
    function render(time) {
        if (!lastTime) lastTime = time;
        const delta = time - lastTime;
        const interval = 1000 / FPS;

        if (delta >= interval) {
            lastTime = time - (delta % interval);
            if (loadedImages >= FRAME_COUNT) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const img = images[frameIndex];
                if (img && img.complete) {
                    drawImageCover(ctx, img, 0, 0, canvas.width, canvas.height);
                }
                frameIndex = (frameIndex + 1) % FRAME_COUNT;
            }
        }
        requestAnimationFrame(render);
    }

    // Load frames
    for (let i = 1; i <= FRAME_COUNT; i++) {
        const img = new Image();
        img.src = `assets/sequence/24 (${i}).jpg`;
        img.onload = function () {
            loadedImages++;
            if (i === 1) {
                handleResize();
                drawImageCover(ctx, img, 0, 0, canvas.width, canvas.height);
            }
        };
        images.push(img);
    }

    window.addEventListener('resize', handleResize);
    handleResize();
    requestAnimationFrame(render);
})();
