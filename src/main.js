import { ColorExtractor } from './modules/ColorExtractor.js';
import { UIController } from './modules/UIController.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('main-canvas');
    const extractor = new ColorExtractor(canvas);
    
    const ui = new UIController({
        dropZone: '#drop-zone',
        fileInput: '#file-input',
        paletteContainer: '#palette-container',
        previewContainer: '#preview-container',
        statusTag: '#status-tag',
        resetBtn: '#reset-btn'
    });

    // Listen for file selection from UI
    window.addEventListener('fileSelected', (e) => {
        const file = e.detail;
        processImage(file);
    });

    async function processImage(file) {
        ui.setStatus('Analizando...', 'loading');
        
        try {
            const bitmap = await createImageBitmap(file);
            
            // Draw to canvas
            extractor.drawImage(bitmap, 1200);
            ui.showPreview();
            
            // Extract colors with slight delay for smoother transition
            setTimeout(() => {
                const palette = extractor.extract(5, 15); // Quality 15 for high speed
                ui.renderPalette(palette);
                ui.setStatus('Spectral Ready', 'success');
            }, 400);

        } catch (error) {
            console.error('Spectral Error:', error);
            ui.setStatus('Error al procesar', 'idle');
        }
    }
});
