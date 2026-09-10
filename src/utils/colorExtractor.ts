const memoryCache = new Map<string, string | null>();

export const extractDominantColor = (
  imgUrl: string
): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!imgUrl) return resolve(null);

    // 1. Check in-memory cache
    if (memoryCache.has(imgUrl)) {
      return resolve(memoryCache.get(imgUrl) || null);
    }

    // 2. Check sessionStorage cache
    try {
      const stored = sessionStorage.getItem(`color_${imgUrl}`);
      if (stored !== null) {
        memoryCache.set(imgUrl, stored === 'null' ? null : stored);
        return resolve(stored === 'null' ? null : stored);
      }
    } catch (e) {
      // Ignore sessionStorage errors
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          memoryCache.set(imgUrl, null);
          return resolve(null);
        }

        // Reduced size for much faster processing
        const size = 25;
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          // Ignore highly transparent pixels
          if (data[i + 3] < 128) continue;

          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];

          const avg = (red + green + blue) / 3;

          // Ignore pitch black or pure white pixels
          if (avg < 20 || avg > 230) continue;

          r += red;
          g += green;
          b += blue;
          count++;
        }

        if (count === 0) {
          memoryCache.set(imgUrl, null);
          try { sessionStorage.setItem(`color_${imgUrl}`, 'null'); } catch (e) {}
          return resolve(null);
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        const max = Math.max(r, g, b);
        if (max > 0) {
          const targetMax = Math.min(255, Math.max(200, max * 1.4));
          const ratio = targetMax / max;

          r = Math.min(255, Math.floor(r * ratio));
          g = Math.min(255, Math.floor(g * ratio));
          b = Math.min(255, Math.floor(b * ratio));
        }

        const finalColor = `rgb(${r}, ${g}, ${b})`;
        
        // Save to caches
        memoryCache.set(imgUrl, finalColor);
        try { sessionStorage.setItem(`color_${imgUrl}`, finalColor); } catch (e) {}
        
        resolve(finalColor);
      } catch (err) {
        console.error("Color extraction failed:", err);
        memoryCache.set(imgUrl, null);
        resolve(null);
      }
    };

    img.onerror = () => {
      memoryCache.set(imgUrl, null);
      resolve(null);
    };

    img.src = imgUrl;
  });
};
