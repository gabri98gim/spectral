/**
 * Spectral | UIController
 * Manages DOM interactions, animations, and rendering.
 */

export class UIController {
    constructor(selectors) {
        this.nodes = {
            dropZone: document.querySelector(selectors.dropZone),
            fileInput: document.querySelector(selectors.fileInput),
            paletteContainer: document.querySelector(selectors.paletteContainer),
            previewContainer: document.querySelector(selectors.previewContainer),
            statusTag: document.querySelector(selectors.statusTag),
            resetBtn: document.querySelector(selectors.resetBtn),
            copyAllBtn: document.querySelector('#copy-all-btn'),
            exportCssBtn: document.querySelector('#export-css-btn'),
            downloadMapBtn: document.querySelector('#download-map-btn')
        };
        
        this.currentPalette = [];
        
        this.initEventListeners();
    }

    initEventListeners() {
        this.nodes.dropZone.onclick = () => this.nodes.fileInput.click();
        
        this.nodes.fileInput.onchange = (e) => {
            if (e.target.files[0]) this.onFileSelected(e.target.files[0]);
        };

        // Drag and Drop Effects
        ['dragover', 'dragenter'].forEach(evt => {
            this.nodes.dropZone.addEventListener(evt, (e) => {
                e.preventDefault();
                this.nodes.dropZone.classList.add('is-dragging');
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            this.nodes.dropZone.addEventListener(evt, () => {
                this.nodes.dropZone.classList.remove('is-dragging');
            });
        });

        this.nodes.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) this.onFileSelected(file);
        });

        if (this.nodes.resetBtn) {
            this.nodes.resetBtn.onclick = () => this.reset();
        }

        if (this.nodes.copyAllBtn) {
            this.nodes.copyAllBtn.onclick = () => this.copyAll();
        }

        if (this.nodes.exportCssBtn) {
            this.nodes.exportCssBtn.onclick = () => this.exportCSS();
        }

        if (this.nodes.downloadMapBtn) {
            this.nodes.downloadMapBtn.onclick = () => this.exportSpectralMap();
        }
    }

    onFileSelected(file) {
        if (!file.type.startsWith('image/')) return;
        this.dispatchEvent('fileSelected', file);
    }

    setStatus(text, type = 'idle') {
        this.nodes.statusTag.textContent = text;
        this.nodes.statusTag.dataset.status = type;
        
        // Tailwind mappings for status
        const colors = {
            idle: 'text-slate-500 bg-slate-800/50',
            loading: 'text-blue-400 bg-blue-500/10',
            success: 'text-emerald-400 bg-emerald-500/10'
        };
        
        this.nodes.statusTag.className = `text-[9px] px-2 py-1 rounded font-bold uppercase tracking-widest italic transition-colors ${colors[type]}`;
    }

    showPreview() {
        this.nodes.previewContainer.classList.remove('hidden');
        this.nodes.dropZone.classList.add('hidden');
    }

    reset() {
        this.nodes.previewContainer.classList.add('hidden');
        this.nodes.dropZone.classList.remove('hidden');
        this.nodes.copyAllBtn.classList.add('hidden');
        this.nodes.exportCssBtn.classList.add('hidden');
        this.nodes.downloadMapBtn.classList.add('hidden');
        this.nodes.paletteContainer.innerHTML = `
            <div class="py-20 text-center border border-slate-800/50 rounded-3xl bg-slate-900/20">
                <p class="text-slate-600 text-sm font-medium italic">Esperando datos ópticos...</p>
            </div>
        `;
        this.setStatus('Standby', 'idle');
        this.nodes.fileInput.value = '';
        this.currentPalette = [];
    }

    renderPalette(colors) {
        this.currentPalette = colors;
        this.nodes.paletteContainer.innerHTML = '';
        
        // Show action buttons
        this.nodes.copyAllBtn.classList.remove('hidden');
        this.nodes.exportCssBtn.classList.remove('hidden');
        this.nodes.downloadMapBtn.classList.remove('hidden');
        
        colors.forEach((color, index) => {
            const card = document.createElement('div');
            card.className = 'spectral-card group';
            card.style.setProperty('--delay', `${index * 0.1}s`);
            
            card.innerHTML = `
                <div class="color-swatch shadow-2xl shadow-black/40" style="background: ${color.hex}"></div>
                <div class="flex-1">
                    <span class="color-hex">${color.hex}</span>
                    <div class="color-rgb">RGB: ${color.r}, ${color.g}, ${color.b}</div>
                    <span class="copy-label">Copy to clipboard</span>
                </div>
                <div class="copy-icon">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                </div>
            `;

            card.onclick = () => {
                this.copyToClipboard(color.hex, card.querySelector('.copy-label'));
            };

            this.nodes.paletteContainer.appendChild(card);
        });
    }

    copyToClipboard(text, labelElement) {
        navigator.clipboard.writeText(text);
        const originalText = labelElement.textContent;
        labelElement.textContent = 'Hex Copied! ✓';
        labelElement.classList.add('text-emerald-400');
        setTimeout(() => {
            labelElement.textContent = originalText;
            labelElement.classList.remove('text-emerald-400');
        }, 2000);
    }

    copyAll() {
        const allHex = this.currentPalette.map(c => c.hex).join(', ');
        navigator.clipboard.writeText(allHex);
        
        const originalBtnText = this.nodes.copyAllBtn.textContent;
        this.nodes.copyAllBtn.textContent = 'All Copied! ✓';
        this.nodes.copyAllBtn.classList.add('text-emerald-400', 'border-emerald-500/30');
        setTimeout(() => {
            this.nodes.copyAllBtn.textContent = originalBtnText;
            this.nodes.copyAllBtn.classList.remove('text-emerald-400', 'border-emerald-500/30');
        }, 2000);
    }

    exportCSS() {
        const cssVariables = this.currentPalette.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n');
        const completeCSS = `:root {\n${cssVariables}\n}`;
        
        navigator.clipboard.writeText(completeCSS);
        
        const originalBtnText = this.nodes.exportCssBtn.textContent;
        this.nodes.exportCssBtn.textContent = 'CSS Exported! ✓';
        this.nodes.exportCssBtn.classList.add('bg-emerald-500/10', 'text-emerald-400');
        setTimeout(() => {
            this.nodes.exportCssBtn.textContent = originalBtnText;
            this.nodes.exportCssBtn.classList.remove('bg-emerald-500/10', 'text-emerald-400');
        }, 2000);
    }

    exportSpectralMap() {
        const width = 1000;
        const height = 200;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;

        const swatchWidth = width / this.currentPalette.length;

        this.currentPalette.forEach((color, i) => {
            // Draw background rectangle
            ctx.fillStyle = color.hex;
            ctx.fillRect(i * swatchWidth, 0, swatchWidth, height);

            // Draw HEX code text
            // Determine text color based on brightness
            const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
            ctx.fillStyle = brightness > 125 ? '#000000' : '#FFFFFF';
            
            ctx.font = 'bold 24px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(color.hex.toUpperCase(), i * swatchWidth + swatchWidth / 2, height / 2);
        });

        // Trigger Download
        const link = document.createElement('a');
        link.download = `spectral-palette-${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    // Simple event emitter pattern
    dispatchEvent(name, detail) {
        const event = new CustomEvent(name, { detail });
        window.dispatchEvent(event);
    }
}
