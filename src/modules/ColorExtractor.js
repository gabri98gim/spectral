import { rgbToHex, colorDistance } from './Utils.js';

export class ColorExtractor {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    }

    /**
     * Extracts the most dominant colors from the current canvas content.
     * @param {number} count Number of colors to extract.
     * @param {number} quality Sampling quality (1 = every pixel, higher = skip more).
     */
    extract(count = 5, quality = 10) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const colorMap = new Map();

        // Optimized sampling loop
        for (let i = 0; i < data.length; i += 4 * quality) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Ignore transparent pixels
            if (a < 125) continue;

            // Optional: Posterize to group similar colors early
            const factor = 10;
            const rGroup = Math.round(r / factor) * factor;
            const gGroup = Math.round(g / factor) * factor;
            const bGroup = Math.round(b / factor) * factor;
            
            const key = `${rGroup},${gGroup},${bGroup}`;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        // Sort by frequency
        const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1]);

        const palette = [];
        const minDistance = 45; // Minimum difference between colors to be considered distinct

        for (const [rgbStr] of sortedColors) {
            if (palette.length >= count) break;

            const [r, g, b] = rgbStr.split(',').map(Number);
            
            // Check if this color is distinct enough from already chosen ones
            const isDistinct = palette.every(p => {
                const dist = colorDistance(r, g, b, p.r, p.g, p.b);
                return dist > minDistance;
            });

            if (isDistinct) {
                palette.push({ r, g, b, hex: rgbToHex(r, g, b) });
            }
        }

        return palette;
    }

    /**
     * Resizes and draws an image to the canvas maintaining aspect ratio.
     */
    drawImage(img, maxWidth = 800) {
        const scale = Math.min(1, maxWidth / img.width);
        this.canvas.width = img.width * scale;
        this.canvas.height = img.height * scale;
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
    }
}
