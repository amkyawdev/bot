function imageApp() {
    return {
        // ===== STATE =====
        prompt: '',
        style: 'photorealistic',
        size: '1024x1024',
        quality: 'standard',
        numImages: 1,
        images: [],
        isGenerating: false,
        showModal: false,
        selectedImage: '',
        
        // Settings
        settings: {
            theme: 'dark',
            apiEndpoint: 'https://oh.amkai.workers.dev'
        },
        
        // ===== INIT =====
        init() {
            this.loadImages();
            this.loadSettings();
            this.setupMessageListener();
            this.initApiService();
        },
        
        initApiService() {
            if (window.ApiService) {
                window.ApiService.setBaseUrl(this.settings.apiEndpoint);
            }
        },
        
        loadSettings() {
            const saved = localStorage.getItem('app_settings');
            if (saved) {
                try {
                    const settings = JSON.parse(saved);
                    this.settings = { ...this.settings, ...settings };
                } catch (e) {}
            }
        },
        
        setupMessageListener() {
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'global-theme-change') {
                    this.applyTheme(event.data);
                }
            });
        },
        
        applyTheme(data) {
            if (data.theme) {
                document.documentElement.setAttribute('data-theme', data.theme);
            }
        },
        
        // ===== IMAGE FUNCTIONS =====
        loadImages() {
            const saved = localStorage.getItem('generated_images');
            if (saved) {
                try {
                    this.images = JSON.parse(saved);
                } catch (e) {
                    this.images = [];
                }
            }
        },
        
        saveImages() {
            if (this.images.length > 50) {
                this.images = this.images.slice(0, 50);
            }
            localStorage.setItem('generated_images', JSON.stringify(this.images));
        },
        
        async generateImage() {
            if (!this.prompt.trim() || this.isGenerating) return;
            
            this.isGenerating = true;
            
            try {
                let imageUrls = [];
                
                if (window.ApiService) {
                    const result = await window.ApiService.image.generate(this.prompt, {
                        style: this.style,
                        size: this.size,
                        quality: this.quality,
                        numImages: this.numImages
                    });
                    
                    if (result.success) {
                        if (result.data.images) {
                            imageUrls = result.data.images;
                        } else if (result.data.imageUrl) {
                            imageUrls = [result.data.imageUrl];
                        }
                    } else {
                        throw new Error(result.error);
                    }
                } else {
                    // Fallback to direct fetch
                    const response = await fetch(`${this.settings.apiEndpoint}/api/generate-image`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            prompt: this.prompt,
                            style: this.style,
                            size: this.size,
                            quality: this.quality,
                            num_images: this.numImages
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.images) {
                        imageUrls = data.images;
                    } else if (data.imageUrl) {
                        imageUrls = [data.imageUrl];
                    }
                }
                
                // Add images to gallery
                if (imageUrls && imageUrls.length > 0) {
                    imageUrls.forEach((url, index) => {
                        const newImage = {
                            id: Date.now() + index + Math.random(),
                            url: url,
                            prompt: this.prompt,
                            style: this.style,
                            size: this.size,
                            timestamp: Date.now()
                        };
                        
                        this.images.unshift(newImage);
                    });
                } else {
                    // Fallback to placeholder images
                    for (let i = 0; i < this.numImages; i++) {
                        const newImage = {
                            id: Date.now() + i + Math.random(),
                            url: `https://picsum.photos/1024/1024?random=${Date.now() + i}`,
                            prompt: this.prompt,
                            style: this.style,
                            size: this.size,
                            timestamp: Date.now()
                        };
                        
                        this.images.unshift(newImage);
                    }
                }
                
                this.saveImages();
                this.prompt = '';
                
            } catch (error) {
                console.error('Generation error:', error);
                
                // Fallback to placeholder images
                for (let i = 0; i < this.numImages; i++) {
                    const newImage = {
                        id: Date.now() + i + Math.random(),
                        url: `https://picsum.photos/1024/1024?random=${Date.now() + i}`,
                        prompt: this.prompt,
                        style: this.style,
                        size: this.size,
                        timestamp: Date.now()
                    };
                    
                    this.images.unshift(newImage);
                }
                
                this.saveImages();
                this.prompt = '';
                
            } finally {
                this.isGenerating = false;
            }
        },
        
        openModal(url) {
            this.selectedImage = url;
            this.showModal = true;
        },
        
        closeModal() {
            this.showModal = false;
            this.selectedImage = '';
        },
        
        downloadImage() {
            if (!this.selectedImage) return;
            
            const a = document.createElement('a');
            a.href = this.selectedImage;
            a.download = `amkyawdev-image-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },
        
        clearGallery() {
            if (confirm('Delete all images?')) {
                this.images = [];
                this.saveImages();
            }
        },
        
        refreshGallery() {
            this.loadImages();
        },
        
        // ===== UTILITY =====
        formatDate(timestamp) {
            return new Date(timestamp).toLocaleDateString();
        }
    };
}

window.imageApp = imageApp;