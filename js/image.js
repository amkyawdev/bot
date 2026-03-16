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
            soundEnabled: true,
            theme: 'dark'
        },
        
        // ===== INIT =====
        init() {
            this.loadImages();
            this.loadSettings();
            this.setupMessageListener();
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
                if (event.data && event.data.type) {
                    this.handleParentMessage(event.data);
                }
            });
        },
        
        handleParentMessage(data) {
            switch(data.type) {
                case 'theme-change':
                    this.applyTheme(data);
                    break;
                case 'play-sound':
                    if (window.NotificationSystem && this.settings.soundEnabled) {
                        NotificationSystem.playSound(data.sound);
                    }
                    break;
            }
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
            
            // Play sound
            if (window.NotificationSystem && this.settings.soundEnabled) {
                NotificationSystem.playSound('success');
            }
            
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Generate multiple images
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
                
                // Clear prompt
                this.prompt = '';
                
                // Play completion sound
                if (window.NotificationSystem && this.settings.soundEnabled) {
                    NotificationSystem.playSound('chime');
                }
                
            } catch (error) {
                console.error('Generation error:', error);
                if (window.NotificationSystem && this.settings.soundEnabled) {
                    NotificationSystem.playSound('error');
                }
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
            
            if (window.NotificationSystem && this.settings.soundEnabled) {
                NotificationSystem.playSound('pop');
            }
        },
        
        clearGallery() {
            if (confirm('Delete all images?')) {
                this.images = [];
                this.saveImages();
                
                if (window.NotificationSystem && this.settings.soundEnabled) {
                    NotificationSystem.playSound('pop');
                }
            }
        },
        
        refreshGallery() {
            this.loadImages();
            if (window.NotificationSystem && this.settings.soundEnabled) {
                NotificationSystem.playSound('pop');
            }
        },
        
        // ===== UTILITY =====
        formatDate(timestamp) {
            return new Date(timestamp).toLocaleDateString();
        }
    };
}

window.imageApp = imageApp;