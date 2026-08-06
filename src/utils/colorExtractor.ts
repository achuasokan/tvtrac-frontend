export const extractDominantColor = (imgUrl: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(null);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let r = 0, g = 0, b = 0;
        let count = 0;
        
        for (let i = 0; i < data.length; i += 16) {
          if (data[i + 3] < 128) continue;
          const avg = (data[i] + data[i+1] + data[i+2]) / 3;
          if (avg < 20 || avg > 230) continue;
          
          r += data[i];
          g += data[i+1];
          b += data[i+2];
          count++;
        }
        
        if (count === 0) {
          resolve(null);
          return;
        }
        
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        
        // Force a high minimum brightness so it pops on dark backgrounds
        const max = Math.max(r, g, b);
        if (max > 0) {
          const targetMax = Math.max(200, max * 1.4);
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
    
    // Add cache buster to prevent CORS errors from cached images
    img.src = imgUrl + (imgUrl.includes('?') ? '&' : '?') + 'cors=' + Date.now();
  });
};
