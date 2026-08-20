export const extractDominantColor = (
  imgUrl: string
): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();

    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(null);
          return;
        }

        // Don't process the full-size image
        const size = 50;

        canvas.width = size;
        canvas.height = size;

        // Resize the image before processing
        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(
          0,
          0,
          size,
          size
        );

        const data = imageData.data;

        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        // Every pixel = 4 values: R, G, B, A
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue;

          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];

          const avg = (red + green + blue) / 3;

          if (avg < 20 || avg > 230) continue;

          r += red;
          g += green;
          b += blue;

          count++;
        }

        if (count === 0) {
          resolve(null);
          return;
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        // Force a high minimum brightness
        const max = Math.max(r, g, b);

        if (max > 0) {
          const targetMax = Math.min(255, Math.max(200, max * 1.4));
          const ratio = targetMax / max;

          r = Math.min(255, Math.floor(r * ratio));
          g = Math.min(255, Math.floor(g * ratio));
          b = Math.min(255, Math.floor(b * ratio));
        }

        resolve(`rgb(${r}, ${g}, ${b})`);
      } catch (err) {
        console.error("Color extraction failed:", err);
        resolve(null);
      }
    };

    img.onerror = () => {
      resolve(null);
    };

    // Don't add Date.now() or cors=true
    img.src = imgUrl;
  });
};
