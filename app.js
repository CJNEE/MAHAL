/* ==========================================================================
   ROMANTIC BIRTHDAY APP - CORE LOGIC (APP.JS)
   Theme: Dust Blue, Soft White, and Light Pink Accents
   ========================================================================== */

class BirthdayApp {
    constructor() {
        this.config = {};
        this.activeScreen = 'splash';
        this.countdownInterval = null;
        
        // Letter typewriter state
        this.typewriterTimer = null;
        this.typewriterIndex = 0;
        this.typewriterSpeed = 50; // ms per char
        this.isTyping = false;
        
        // Reasons deck state
        this.currentReasonIndex = 0;
        this.reasons = [];
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        this.draggedCard = null;
        
        // Memories state
        this.currentMemoryIndex = 0;
        this.memories = [];
        this.editingMemoryIndex = null;
        
        // Confetti physics state
        this.confettiParticles = [];
        this.confettiActive = false;
        this.confettiAnimationId = null;
        
        // Music state
        this.isPlaying = false;
        this.synthInterval = null;
        this.audioContext = null;
        this.synthActive = false;

        // Initialize App
        this.init();
    }

    /* --------------------------------------------------------------------------
       1. INITIALIZATION & LOCAL STORAGE CONFIG
       -------------------------------------------------------------------------- */
    init() {
        this.loadSettings();
        this.setupDOMReferences();
        this.setupEventListeners();
        this.populateStaticContent();
        
        // Start background engines
        this.startFloatingParticles();
        this.startCountdown();
        this.initConfettiCanvas();
        this.renderMemories();
        this.renderReasonsDeck();

        // Check if birthday has already passed on startup
        this.checkBirthdayStatus(true);
    }

    /* Storage key constants — never change these after first release */
    get SETTINGS_KEY() { return 'forjane_settings'; }
    get MEMORIES_KEY() { return 'forjane_user_memories'; }

    loadSettings() {
        const defaults = this.getDefaultConfig();

        // Load user settings (name, date, letter, gift message)
        const savedSettings = localStorage.getItem(this.SETTINGS_KEY);
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                let giftMsg = parsed.giftMessage ?? defaults.giftMessage;
                // Migrate from old default gift message if detected
                if (giftMsg.includes("cozy stargazing walk")) {
                    giftMsg = defaults.giftMessage;
                }
                
                this.config = {
                    ...defaults,
                    name: parsed.name ?? defaults.name,
                    birthdayDate: parsed.birthdayDate ?? defaults.birthdayDate,
                    letterText: parsed.letterText ?? defaults.letterText,
                    giftMessage: giftMsg,
                    reasons: parsed.reasons ?? defaults.reasons,
                    memories: [...defaults.memories]
                };
            } catch (e) {
                console.error('Error parsing saved settings', e);
                this.config = { ...defaults, memories: [...defaults.memories] };
            }
        } else {
            this.config = { ...defaults, memories: [...defaults.memories] };
        }

        // Load memories (entire list if saved, otherwise falls back to defaults loaded above)
        const savedMemories = localStorage.getItem(this.MEMORIES_KEY);
        if (savedMemories) {
            try {
                const parsedMemories = JSON.parse(savedMemories);
                if (Array.isArray(parsedMemories)) {
                    this.config.memories = parsedMemories;
                }
            } catch (e) {
                console.error('Error parsing saved memories', e);
            }
        }
    }

    saveConfig() {
        // Save settings (everything except memories)
        const { memories, ...settingsOnly } = this.config;
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settingsOnly));

        // Save entire memories array (including default, edited, and user-added memories)
        localStorage.setItem(this.MEMORIES_KEY, JSON.stringify(this.config.memories));
    }

    getDefaultConfig() {
        // Default target: 7 days and 3 hours from now to make the countdown active
        const now = new Date();
        const defaultTargetDate = new Date(now.getTime() + (7 * 24 + 3) * 60 * 60 * 1000);

        
        return {
            name: "Jane",
            birthdayDate: defaultTargetDate.toISOString().slice(0, 16), // datetime-local format
            letterText: "Dearest Jane,\n\nFrom the moment you walked into my life, everything became brighter, softer, and more beautiful. You have this quiet strength, this gentle laugh, and a heart that makes me want to be the best version of myself.\n\nOn your birthday, I want to remind you of how deeply you are appreciated, how much you are loved, and how grateful I am for every single second we share. Whether we're exploring new places or just sitting together in quiet comfort, my favorite place is always by your side.\n\nHere is to your special day, and to all the adventures waiting for us in the years ahead.\n\nHappy Birthday, my love.",
            giftMessage: `You’ve unlocked a special gift 💙\n\nA gift that doesn’t come inside a box or wrapped with a ribbon, but something that comes from the deepest part of my heart. This gift is my promise to you: that I will always love you, support you, and be here for you no matter what happens.\n\nEver since the moment I met you, I felt something different. Even when there were so many people around, you were the one I noticed. You were the one I looked at, the one who stood out to me, and the one I wanted to know more about. Somehow, my eyes always found you, and without even realizing it, I started falling for you.\n\nAs time passed, my feelings for you only grew stronger. I fell in love with the way you are, the way you make me smile, the way you make ordinary moments feel special, and the happiness you bring into my life. You became someone I truly value, someone I want to protect, and someone I want to keep choosing every single day.\n\nI want you to know that this gift is not just words. This is my promise to you. I promise that I will always support you in your dreams, stand beside you during your struggles, and celebrate with you during your happiest moments. No matter how hard things get, I want you to remember that you have someone who believes in you and will always be cheering for you.\n\nWhenever you feel tired, lost, or when you need someone to talk to, I want you to know that I’ll always be here. I’ll listen to you, understand you, and remind you that you are never alone. I may not always have the perfect words or the ability to fix everything, but I will always give you my time, my effort, and my love.\n\nI love you so much, and I always will. ❤️ You are someone truly special to me, and I’m grateful for every moment, every laugh, every memory, and every second I get to spend with you.\n\nThe gift I’m giving you is me. My love, my support, my loyalty, and my promise that no matter what happens, I will always be here for you. I’ll continue to love you, care for you, and choose you again and again.\n\nThank you for being part of my life. Thank you for being the person who made my heart feel this way. I hope you always remember how loved you are, because you deserve all the love and happiness in the world. 💙`,
            reasons: [
                { num: 1, icon: "😄", text: "Your Laugh: It's my favorite sound in the world, and it instantly brightens up even my darkest days." },
                { num: 2, icon: "🌸", text: "Your Kindness: The way you care for everyone around you, showing endless empathy and gentleness." },
                { num: 3, icon: "🌙", text: "Our Late Night Talks: How we can talk about anything and everything under the stars, losing track of time." },
                { num: 4, icon: "🛡️", text: "Your Support: You always believe in me, even when I struggle to believe in myself, giving me strength." },
                { num: 5, icon: "✨", text: "Your Quiet Strength: The grace with which you handle life's challenges, inspiring me every single day." },
                { num: 6, icon: "💖", text: "Your Beautiful Smile: One look from you, and all my worries melt away in an instant." },
                { num: 7, icon: "🤝", text: "The Way You Hold My Hand: It feels like a promise that no matter what happens, we're in this together." },
                { num: 8, icon: "🤪", text: "Your Silly Side: The adorable jokes and funny faces that only I get to see. I cherish them." },
                { num: 9, icon: "🤗", text: "Your Warm Embraces: Getting hugged by you feels like coming home after a long journey." },
                { num: 10, icon: "🥰", text: "You Are Simply You: I love every part of you, exactly as you are. You are my home." }
            ],
            memories: [
                { photo: "assets/images/IMG_0835.PNG", date: "", title: "", desc: "" },
                { photo: "assets/images/IMG_0997.JPG", date: "", title: "", desc: "" },
                { photo: "assets/images/IMG_0998.JPG", date: "", title: "", desc: "" },
                { photo: "assets/images/IMG_1001.JPG", date: "", title: "", desc: "" },
                { photo: "assets/images/IMG_6497.JPG", date: "", title: "", desc: "" },
                { photo: "assets/images/IMG_6498.JPG", date: "", title: "", desc: "" },
                { photo: "assets/images/IMG_6550.JPG", date: "", title: "", desc: "" },
                { photo: "assets/images/IMG_6553.JPG", date: "", title: "", desc: "" },
                { photo: "assets/images/IMG_6554.JPG", date: "", title: "", desc: "" },
                { photo: "assets/images/UPAK3154.JPEG", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6165734499455536690_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6206030844699282691_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6206030844699282692_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6208282644512967993_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6208282644512967996_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6208282644512967997_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6208282644512967998_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6217632204200808334_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6217632204200808335_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6217632204200808336_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6217632204200808337_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6217632204200808338_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6217632204200808341_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6217632204200808344_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6217632204200808345_w.jpg", date: "", title: "", desc: "" },
                { photo: "assets/images/photo_6217632204200808350_w.jpg", date: "", title: "", desc: "" }
            ]
        };
    }



    setupDOMReferences() {
        this.dom = {
            // General
            particleContainer: document.getElementById('particle-container'),
            openSettingsBtn: document.getElementById('open-settings-btn'),
            closeSettingsBtn: document.getElementById('close-settings-btn'),
            settingsModal: document.getElementById('settings-modal'),
            saveSettingsBtn: document.getElementById('save-settings-btn'),
            resetDefaultsBtn: document.getElementById('reset-defaults-btn'),
            headerName: document.getElementById('header-name'),
            
            // Splash Screen
            splashScreen: document.getElementById('splash-screen'),
            splashName: document.getElementById('splash-name'),
            enterAppBtn: document.getElementById('enter-app-btn'),
            
            // Dashboard
            dashboardScreen: document.getElementById('dashboard-screen'),
            countdownTrigger: document.getElementById('countdown-trigger'),
            days: document.getElementById('days'),
            hours: document.getElementById('hours'),
            minutes: document.getElementById('minutes'),
            seconds: document.getElementById('seconds'),
            countdownDateStr: document.getElementById('countdown-date-str'),
            countdownStatusBadge: document.getElementById('countdown-status-badge'),
            
            // Love Letter
            letterScreen: document.getElementById('letter-screen'),
            envelope: document.getElementById('envelope'),
            openEnvelopeBtn: document.getElementById('open-envelope-btn'),
            restartLetterBtn: document.getElementById('restart-letter-btn'),
            handwrittenText: document.getElementById('handwritten-text'),
            letterPaper: document.getElementById('letter-paper'),
            letterSig: document.getElementById('letter-sig'),
            
            // Memories
            memoriesScreen: document.getElementById('memories-screen'),
            galleryCarousel: document.getElementById('gallery-carousel'),
            carouselDots: document.getElementById('carousel-dots'),
            memoryTimeline: document.getElementById('memory-timeline'),
            
            // Reasons why I love you
            reasonsScreen: document.getElementById('reasons-screen'),
            reasonsDeck: document.getElementById('reasons-deck'),
            prevReasonBtn: document.getElementById('prev-reason-btn'),
            nextReasonBtn: document.getElementById('next-reason-btn'),
            deckCounter: document.getElementById('deck-counter'),
            
            // Gift Box
            giftScreen: document.getElementById('gift-screen'),
            giftBoxContainer: document.getElementById('gift-box-container'),
            giftWrapper: document.getElementById('gift-wrapper'),
            giftLid: document.getElementById('gift-lid'),
            giftMain: document.getElementById('gift-main'),
            giftInstructionText: document.getElementById('gift-instruction-text'),
            surpriseRevealCard: document.getElementById('surprise-reveal-card'),
            revealMessageText: document.getElementById('reveal-message-text'),
            resetGiftBtn: document.getElementById('reset-gift-btn'),
            
            // Navigation
            navItems: document.querySelectorAll('.bottom-nav .nav-item'),
            
            // Music Widget
            musicPlayerWidget: document.getElementById('music-player-widget'),
            audioPlayBtn: document.getElementById('audio-play-btn'),
            miniPlayerPanel: document.getElementById('mini-player-panel'),
            miniPlayBtn: document.getElementById('mini-play-btn'),
            miniPlayIcon: document.getElementById('mini-play-icon'),
            volumeSlider: document.getElementById('volume-slider'),
            bgMusic: document.getElementById('bg-music'),
            visualizerBars: document.getElementById('visualizer-bars'),
            
            // Confetti
            confettiCanvas: document.getElementById('confetti-canvas'),
            
            // Form Config Inputs
            cfgName: document.getElementById('cfg-name'),
            cfgDate: document.getElementById('cfg-date'),
            cfgLetter: document.getElementById('cfg-letter'),
            cfgGiftMsg: document.getElementById('cfg-gift-msg'),
            memoriesMgrList: document.getElementById('memories-mgr-list'),
            newMemDate: document.getElementById('new-mem-date'),
            newMemTitle: document.getElementById('new-mem-title'),
            newMemDesc: document.getElementById('new-mem-desc'),
            newMemFile: document.getElementById('new-mem-file'),
            addMemBtn: document.getElementById('add-mem-btn')
        };
    }

    setupEventListeners() {
        // Splash Action
        this.dom.enterAppBtn.addEventListener('click', () => {
            this.navigateTo('dashboard');
        });

        // Tab Navigation
        this.dom.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const target = item.getAttribute('data-target');
                this.navigateTo(target);
            });
        });

        // Settings Dialog triggers
        this.dom.openSettingsBtn.addEventListener('click', () => this.openSettings());
        this.dom.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.dom.saveSettingsBtn.addEventListener('click', () => this.saveSettingsFromForm());
        this.dom.resetDefaultsBtn.addEventListener('click', () => this.resetToDefaults());
        
        // Double tap on countdown card to trigger settings
        this.dom.countdownTrigger.addEventListener('dblclick', () => this.openSettings());

        // Envelope Actions
        this.dom.openEnvelopeBtn.addEventListener('click', () => this.toggleEnvelope());
        this.dom.restartLetterBtn.addEventListener('click', () => {
            this.resetEnvelopeState();
            this.dom.envelope.classList.add('open');
            this.dom.envelope.closest('.envelope-wrapper').classList.add('expanded');
            this.dom.openEnvelopeBtn.classList.add('hidden');
            setTimeout(() => {
                this.startTypewriter();
            }, 800);
        });

        // Memories Manager Actions
        this.dom.addMemBtn.addEventListener('click', () => {
            if (this.editingMemoryIndex !== null) {
                this.handleSaveEditMemory(this.editingMemoryIndex);
            } else {
                this.handleAddNewMemory();
            }
        });

        // Reasons Deck Controls — handled via inline onclick on buttons in HTML
        // this.dom.prevReasonBtn.addEventListener('click', () => this.rotateDeckPrev());
        // this.dom.nextReasonBtn.addEventListener('click', () => this.rotateDeckNext());

        // Gift Box Action
        this.dom.giftWrapper.addEventListener('click', () => this.unlockSurpriseGift());
        this.dom.resetGiftBtn.addEventListener('click', () => this.lockSurpriseGift());

        // Music Controls
        this.dom.audioPlayBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMusicMenu();
        });
        
        this.dom.miniPlayBtn.addEventListener('click', () => this.togglePlayState());
        
        this.dom.volumeSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.dom.bgMusic.volume = val;
        });

        // Close mini player drawer on body click
        document.body.addEventListener('click', (e) => {
            if (!this.dom.musicPlayerWidget.contains(e.target)) {
                this.dom.miniPlayerPanel.classList.add('hidden');
            }
        });

        // Handle window resizing for Confetti Canvas
        window.addEventListener('resize', () => {
            if (this.dom.confettiCanvas) {
                this.dom.confettiCanvas.width = this.dom.confettiCanvas.parentElement.clientWidth;
                this.dom.confettiCanvas.height = this.dom.confettiCanvas.parentElement.clientHeight;
            }
        });
    }

    populateStaticContent() {
        this.dom.headerName.textContent = this.config.name;
        this.dom.splashName.textContent = this.config.name;
        
        // Setup Form Inputs default values
        this.dom.cfgName.value = this.config.name;
        this.dom.cfgDate.value = this.config.birthdayDate;
        this.dom.cfgLetter.value = this.config.letterText;
        this.dom.cfgGiftMsg.value = this.config.giftMessage;
        
        // Format countdown target date visual representation
        const target = new Date(this.config.birthdayDate);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        this.dom.countdownDateStr.textContent = target.toLocaleDateString('en-US', options);
    }

    /* --------------------------------------------------------------------------
       2. SCREEN ROUTER & NAVIGATION
       -------------------------------------------------------------------------- */
    navigateTo(screenName) {
        if (screenName === this.activeScreen) return;
        
        const screens = ['splash', 'dashboard', 'letter', 'memories', 'reasons', 'gift'];
        screens.forEach(s => {
            const el = document.getElementById(`${s}-screen`);
            if (el) {
                el.classList.remove('active');
            }
        });

        const activeEl = document.getElementById(`${screenName}-screen`);
        if (activeEl) {
            activeEl.classList.add('active');
            this.activeScreen = screenName;
        }

        // Update Bottom Nav Bar selection
        this.dom.navItems.forEach(item => {
            const target = item.getAttribute('data-target');
            if (target === screenName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Screen specific triggers
        if (screenName === 'letter') {
            // If envelope is not open yet, just show the open button
            // If it IS open and typing hasn't started or finished, restart typing
            if (this.dom.envelope.classList.contains('open') && !this.isTyping) {
                this.dom.handwrittenText.innerHTML = '';
                this.dom.letterSig.style.opacity = 0;
                this.typewriterIndex = 0;
                this.startTypewriter();
            }
        }
    }

    /* --------------------------------------------------------------------------
       3. SETTINGS CONTROLLER (LOCAL PERSISTENCE)
       -------------------------------------------------------------------------- */
    openSettings() {
        this.dom.settingsModal.classList.remove('hidden');
        this.renderMemoriesManager();
    }

    closeSettings() {
        this.dom.settingsModal.classList.add('hidden');
    }

    saveSettingsFromForm() {
        this.config.name = this.dom.cfgName.value;
        this.config.birthdayDate = this.dom.cfgDate.value;
        this.config.letterText = this.dom.cfgLetter.value;
        this.config.giftMessage = this.dom.cfgGiftMsg.value;
        
        this.saveConfig();
        this.populateStaticContent();
        
        // Restart engines
        this.startCountdown();
        this.checkBirthdayStatus(false);
        this.closeSettings();
        
        // Rebuild reasons array and reset memories list
        this.reasons = null;
        this.renderReasonsDeck();
        this.renderMemories();
        
        // Reset envelope typewriter state so it runs cleanly again
        this.resetEnvelopeState();
    }

    resetToDefaults() {
        if (confirm('Are you sure you want to reset all customized values to default? This will clear all your changes including added memories.')) {
            // Clear both storage keys
            localStorage.removeItem(this.SETTINGS_KEY);
            localStorage.removeItem(this.MEMORIES_KEY);

            const defaults = this.getDefaultConfig();
            this.config = { ...defaults, memories: [...defaults.memories] };

            this.populateStaticContent();
            this.startCountdown();
            this.checkBirthdayStatus(false);
            
            this.reasons = null;
            this.renderReasonsDeck();
            this.renderMemories();
            this.renderMemoriesManager();

            this.resetEnvelopeState();
            this.closeSettings();
        }
    }

    resetEnvelopeState() {
        this.dom.envelope.classList.remove('open');
        this.dom.envelope.closest('.envelope-wrapper').classList.remove('expanded');
        this.dom.openEnvelopeBtn.classList.remove('hidden');
        this.dom.restartLetterBtn.classList.add('hidden');
        this.dom.handwrittenText.innerHTML = '';
        this.dom.letterSig.style.opacity = 0;
        this.isTyping = false;
        this.typewriterIndex = 0;
        clearInterval(this.typewriterTimer);
    }

    /* --------------------------------------------------------------------------
       4. BACKGROUND ENGINES & FLOATING PARTICLES
       -------------------------------------------------------------------------- */
    startFloatingParticles() {
        const colors = ['#f8bbd0', '#ff8a80', '#a7c0cd', '#e8f0fe', '#fff9c4'];
        const types = ['❤️', '✨', '🌸', '🎈', '💖'];

        setInterval(() => {
            if (document.hidden) return; // Save memory when tab is inactive
            
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            
            const randomType = types[Math.floor(Math.random() * types.length)];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            particle.textContent = randomType;
            if (randomType === '✨' || randomType === '🎈') {
                particle.style.color = randomColor;
            }
            
            const startX = Math.random() * 100;
            const startScale = Math.random() * 0.8 + 0.4;
            const duration = Math.random() * 12 + 8; // 8s to 20s
            
            particle.style.left = `${startX}%`;
            particle.style.bottom = `-5%`;
            particle.style.transform = `scale(${startScale})`;
            particle.style.opacity = '0';
            
            this.dom.particleContainer.appendChild(particle);

            // Trigger reflow & animate using CSS variables
            particle.animate([
                { bottom: '-5%', opacity: 0, transform: `scale(${startScale}) translateX(0)` },
                { opacity: 0.8, offset: 0.1 },
                { opacity: 0.8, offset: 0.8 },
                { bottom: '105%', opacity: 0, transform: `scale(${startScale}) translateX(${(Math.random() - 0.5) * 60}px) rotate(${Math.random() * 360}deg)` }
            ], {
                duration: duration * 1000,
                easing: 'ease-in-out'
            });

            // Cleanup particle
            setTimeout(() => {
                particle.remove();
            }, duration * 1000);
        }, 1500); // Spawn one every 1.5 seconds
    }

    /* --------------------------------------------------------------------------
       5. LIVE COUNTDOWN TIMER ENGINE
       -------------------------------------------------------------------------- */
    startCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }

        const updateClock = () => {
            const targetDate = new Date(this.config.birthdayDate).getTime();
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference <= 0) {
                // Countdown Finished
                this.dom.days.textContent = "00";
                this.dom.hours.textContent = "00";
                this.dom.minutes.textContent = "00";
                this.dom.seconds.textContent = "00";
                
                this.dom.countdownStatusBadge.textContent = "Celebrating! 🎂";
                this.dom.countdownStatusBadge.classList.add('celebrating');
                
                clearInterval(this.countdownInterval);
                return;
            }

            this.dom.countdownStatusBadge.textContent = "Counting Down";
            this.dom.countdownStatusBadge.classList.remove('celebrating');

            const d = Math.floor(difference / (1000 * 60 * 60 * 24));
            const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((difference % (1000 * 60)) / 1000);

            this.dom.days.textContent = String(d).padStart(2, '0');
            this.dom.hours.textContent = String(h).padStart(2, '0');
            this.dom.minutes.textContent = String(m).padStart(2, '0');
            this.dom.seconds.textContent = String(s).padStart(2, '0');
        };

        updateClock();
        this.countdownInterval = setInterval(updateClock, 1000);
    }

    checkBirthdayStatus(isStartup) {
        const targetDate = new Date(this.config.birthdayDate).getTime();
        const now = new Date().getTime();
        
        if (now >= targetDate) {
            // It is her birthday or has passed!
            // Fire off a celebration confetti burst
            setTimeout(() => {
                this.triggerConfettiCelebration();
            }, isStartup ? 2000 : 500);
        }
    }

    /* --------------------------------------------------------------------------
       6. ROMANTIC TYPEWRITER LOVE LETTER EFFECT
       -------------------------------------------------------------------------- */
    toggleEnvelope() {
        const env = this.dom.envelope;
        const wrapper = env.closest('.envelope-wrapper');
        
        if (!env.classList.contains('open')) {
            env.classList.add('open');
            wrapper.classList.add('expanded');
            this.dom.openEnvelopeBtn.classList.add('hidden');
            
            // Always reset and start typing fresh
            this.isTyping = false;
            this.typewriterIndex = 0;
            clearInterval(this.typewriterTimer);
            this.dom.handwrittenText.innerHTML = '';
            this.dom.letterSig.style.opacity = 0;
            this.dom.restartLetterBtn.classList.add('hidden');

            // Start reading/typing message after envelope animation
            setTimeout(() => {
                this.startTypewriter();
            }, 800);
        }
    }

    startTypewriter() {
        if (this.isTyping) return;
        this.isTyping = true;
        this.typewriterIndex = 0;
        this.dom.handwrittenText.innerHTML = '';
        this.dom.letterSig.style.opacity = 0;
        this.dom.letterSig.style.transition = 'opacity 1s ease';

        this.startTypewriterInterval();
    }

    startTypewriterInterval() {
        const text = this.config.letterText;
        this.typewriterTimer = setInterval(() => {
            if (this.typewriterIndex < text.length) {
                const char = text.charAt(this.typewriterIndex);
                if (char === '\n') {
                    this.dom.handwrittenText.innerHTML += '<br>';
                } else {
                    this.dom.handwrittenText.innerHTML += char;
                }
                this.typewriterIndex++;
                
                // Auto scroll letter paper downwards as text gets added
                this.dom.letterPaper.scrollTop = this.dom.letterPaper.scrollHeight;
            } else {
                this.finishTypewriter();
            }
        }, 50); // Hardcoded typewriter speed: 50ms
    }

    finishTypewriter() {
        clearInterval(this.typewriterTimer);
        this.isTyping = false;
        // Fade in signature
        this.dom.letterSig.style.opacity = 1;
        this.dom.letterPaper.scrollTop = this.dom.letterPaper.scrollHeight;
        this.dom.restartLetterBtn.classList.remove('hidden');
    }

    finishTypewriterImmediately() {
        clearInterval(this.typewriterTimer);
        this.isTyping = false;
        const text = this.config.letterText;
        this.dom.handwrittenText.innerHTML = text.replace(/\n/g, '<br>');
        this.dom.letterSig.style.opacity = 1;
        this.dom.letterPaper.scrollTop = this.dom.letterPaper.scrollHeight;
        this.dom.restartLetterBtn.classList.remove('hidden');
    }

    /* --------------------------------------------------------------------------
       7. MEMORIES GALLERY CAROUSEL & JOURNEY TIMELINE
       -------------------------------------------------------------------------- */
    renderMemories() {
        // Clear templates
        this.dom.galleryCarousel.innerHTML = '';
        this.dom.carouselDots.innerHTML = '';
        this.dom.memoryTimeline.innerHTML = '';
        
        const memoriesList = this.config.memories;
        
        memoriesList.forEach((mem, index) => {
            const hasDetails = mem.title || mem.date || mem.desc;

            // Render Carousel Item
            const card = document.createElement('div');
            card.className = 'carousel-card';
            card.innerHTML = `
                <div class="memory-photo-frame">
                    <img src="${mem.photo}" alt="${mem.title || 'Memory'}" class="memory-img">
                </div>
                ${hasDetails ? `
                <div class="memory-details">
                    ${mem.date ? `<span class="memory-date">${mem.date}</span>` : ''}
                    ${mem.title ? `<h5 class="memory-title">${mem.title}</h5>` : ''}
                    ${mem.desc ? `<p class="memory-desc">${mem.desc}</p>` : ''}
                </div>` : ''}
            `;
            this.dom.galleryCarousel.appendChild(card);
            
            // Render Carousel Indicator Dot
            const dot = document.createElement('div');
            dot.className = `dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => {
                this.scrollCarouselTo(index);
            });
            this.dom.carouselDots.appendChild(dot);

            // Render Journey Timeline Item — only if there's meaningful content
            if (hasDetails) {
                const timelineItem = document.createElement('div');
                timelineItem.className = 'timeline-item';
                timelineItem.innerHTML = `
                    <div class="timeline-dot"></div>
                    ${mem.date ? `<span class="timeline-date">${mem.date}</span>` : ''}
                    <div class="timeline-content glass-card">
                        ${mem.photo ? `
                        <div class="timeline-photo-wrapper" style="width: 100%; max-height: 160px; border-radius: 8px; overflow: hidden; margin-bottom: 10px;">
                            <img src="${mem.photo}" alt="${mem.title || 'Memory'}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        ` : ''}
                        ${mem.title ? `<h5>${mem.title}</h5>` : ''}
                        ${mem.desc ? `<p>${mem.desc}</p>` : ''}
                    </div>
                `;
                this.dom.memoryTimeline.appendChild(timelineItem);
            }
        });

        // Show empty state for timeline if nothing has details
        if (this.dom.memoryTimeline.children.length === 0) {
            this.dom.memoryTimeline.innerHTML = `
                <p style="font-size:11px;color:var(--light-text);text-align:center;padding:16px 0">
                    Edit your memories in ⚙️ Settings to add dates and stories to your timeline.
                </p>`;
        }

        // Attach scroll event tracker to carousel to update dots automatically
        this.dom.galleryCarousel.addEventListener('scroll', () => {
            this.updateCarouselDots();
        });
    }

    scrollCarouselTo(index) {
        const cardWidth = this.dom.galleryCarousel.clientWidth;
        this.dom.galleryCarousel.scrollTo({
            left: index * cardWidth,
            behavior: 'smooth'
        });
        this.currentMemoryIndex = index;
    }

    updateCarouselDots() {
        const track = this.dom.galleryCarousel;
        const width = track.clientWidth;
        if (width === 0) return;
        
        const activeIndex = Math.round(track.scrollLeft / width);
        this.currentMemoryIndex = activeIndex;

        const dots = this.dom.carouselDots.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            if (index === activeIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    /* --------------------------------------------------------------------------
       8. SWIPEABLE "REASONS WHY I LOVE YOU" CARD DECK
       -------------------------------------------------------------------------- */
    renderReasonsDeck() {
        this.dom.reasonsDeck.innerHTML = '';
        
        // Initialize reasons deck array only once, so shifting and pushing rotates items
        if (!this.reasons || this.reasons.length === 0) {
            this.reasons = [...this.config.reasons];
        }
        
        this.reasons.forEach((reason, index) => {
            const card = document.createElement('div');
            card.className = 'reason-card';
            card.style.zIndex = this.reasons.length - index;
            card.style.transform = this.getCardTransformForIndex(index);
            card.style.opacity = index < 3 ? (1 - index * 0.15) : 0;
            card.style.pointerEvents = index === 0 ? 'auto' : 'none';
            
            card.innerHTML = `
                <span class="reason-num">Reason #${reason.num}</span>
                <div class="reason-icon">${reason.icon}</div>
                <p class="reason-text">“${reason.text}”</p>
            `;
            
            // Swipe handlers for top card
            if (index === 0) {
                this.attachSwipeHandlers(card);
            }

            this.dom.reasonsDeck.appendChild(card);
        });
        
        this.updateDeckCounter();
    }

    getCardTransformForIndex(index) {
        if (index === 0) return 'translateZ(0px) rotate(0deg)';
        if (index === 1) return 'translateZ(-15px) translateY(8px) scale(0.95) rotate(1deg)';
        if (index === 2) return 'translateZ(-30px) translateY(16px) scale(0.9) rotate(-1.5deg)';
        return 'translateZ(-45px) translateY(24px) scale(0.85)';
    }

    updateDeckCounter() {
        const topCard = this.reasons ? this.reasons[0] : null;
        if (!topCard) return;
        
        const index = this.config.reasons.findIndex(r => r.num === topCard.num);
        const currentNum = index !== -1 ? index + 1 : 1;
        const total = this.config.reasons.length;
        this.dom.deckCounter.textContent = `${currentNum} / ${total}`;
    }

    rotateDeckNext() {
        const cards = this.dom.reasonsDeck.querySelectorAll('.reason-card');
        if (!cards.length) return;

        const topCard = cards[0];
        topCard.style.transition = 'transform 0.35s ease, opacity 0.35s ease';
        topCard.style.transform = 'translateX(350px) rotate(20deg)';
        topCard.style.opacity = '0';

        // Shift the top item to the end of the array
        const swiped = this.reasons.shift();
        this.reasons.push(swiped);

        setTimeout(() => {
            this.renderReasonsDeck();
        }, 350);
    }

    rotateDeckPrev() {
        // Move bottom item to front
        const last = this.reasons.pop();
        this.reasons.unshift(last);
        this.renderReasonsDeck();
    }

    attachSwipeHandlers(card) {
        // Mouse swipe handling
        card.addEventListener('mousedown', (e) => this.dragStart(e));
        document.addEventListener('mousemove', (e) => this.dragMove(e));
        document.addEventListener('mouseup', (e) => this.dragEnd(e));

        // Touch swipe handling
        card.addEventListener('touchstart', (e) => this.dragStart(e));
        document.addEventListener('touchmove', (e) => this.dragMove(e));
        document.addEventListener('touchend', (e) => this.dragEnd(e));
    }

    dragStart(e) {
        this.isDragging = true;
        this.draggedCard = e.currentTarget;
        this.draggedCard.style.transition = 'none';
        
        this.startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    }

    dragMove(e) {
        if (!this.isDragging || !this.draggedCard) return;
        
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        this.currentX = clientX - this.startX;
        
        // Rotate card slightly based on drag distance
        const rotate = this.currentX * 0.08;
        this.draggedCard.style.transform = `translateX(${this.currentX}px) rotate(${rotate}deg)`;
    }

    dragEnd(e) {
        if (!this.isDragging || !this.draggedCard) return;
        this.isDragging = false;
        
        const threshold = 110; // Swipe threshold distance
        this.draggedCard.style.transition = 'transform 0.4s ease, opacity 0.4s ease';

        if (this.currentX > threshold) {
            // Swiped right
            this.draggedCard.classList.add('swiped-right');
            setTimeout(() => {
                const swiped = this.reasons.shift();
                this.reasons.push(swiped);
                this.renderReasonsDeck();
            }, 300);
        } else if (this.currentX < -threshold) {
            // Swiped left
            this.draggedCard.classList.add('swiped-left');
            setTimeout(() => {
                const swiped = this.reasons.shift();
                this.reasons.push(swiped);
                this.renderReasonsDeck();
            }, 300);
        } else {
            // Reset position
            this.draggedCard.style.transform = 'translateX(0px) rotate(0deg)';
        }

        this.draggedCard = null;
        this.currentX = 0;
    }

    /* --------------------------------------------------------------------------
       9. CONFETTI CELEBRATION ENGINE (PURE HTML5 CANVAS)
       -------------------------------------------------------------------------- */
    initConfettiCanvas() {
        const canvas = this.dom.confettiCanvas;
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }

    triggerConfettiCelebration() {
        this.confettiActive = true;
        this.confettiParticles = [];
        
        const canvas = this.dom.confettiCanvas;
        const ctx = canvas.getContext('2d');
        
        // Colors of confetti
        const colors = [
            '#ff8a80', '#ffccd5', '#f8bbd0', '#f06292', // pinks
            '#78909c', '#b0bec5', '#eef2f5', '#a7c0cd', // blues/whites
            '#ffe082', '#ffecb3', '#fff9c4'             // gold/creams
        ];

        // Create initial batch of particles
        const particleCount = 140;
        for (let i = 0; i < particleCount; i++) {
            this.confettiParticles.push(this.createConfettiParticle(canvas, colors));
        }

        if (this.confettiAnimationId) {
            cancelAnimationFrame(this.confettiAnimationId);
        }

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            let active = false;
            
            this.confettiParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx += p.wind;
                p.rotation += p.rotationSpeed;
                
                // Draw particle
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                
                if (p.shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.shape === 'heart') {
                    ctx.beginPath();
                    ctx.moveTo(0, -p.r/4);
                    // Left curve
                    ctx.bezierCurveTo(-p.r/2, -p.r, -p.r, -p.r/2, -p.r, 0);
                    ctx.bezierCurveTo(-p.r, p.r/2, -p.r/4, p.r, 0, p.r * 1.2);
                    // Right curve
                    ctx.bezierCurveTo(p.r/4, p.r, p.r, p.r/2, p.r, 0);
                    ctx.bezierCurveTo(p.r, -p.r/2, p.r/2, -p.r, 0, -p.r/4);
                    ctx.fill();
                } else {
                    // Rectangle
                    ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
                }
                ctx.restore();
                
                // If particle is still inside viewport boundaries
                if (p.y < canvas.height + 20) {
                    active = true;
                }
            });
            
            if (active && this.confettiActive) {
                this.confettiAnimationId = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.confettiActive = false;
            }
        };

        render();
    }

    createConfettiParticle(canvas, colors) {
        const shapeType = ['rect', 'circle', 'heart'];
        const chosenShape = shapeType[Math.floor(Math.random() * shapeType.length)];
        
        return {
            x: Math.random() * canvas.width,
            // Spawn in lower 10% of screen or random vertical heights above screen to simulate explosion
            y: Math.random() * -canvas.height * 0.4, 
            vx: (Math.random() - 0.5) * 6,
            vy: Math.random() * 8 + 4,
            gravity: 0.15,
            wind: (Math.random() - 0.5) * 0.05,
            r: Math.random() * 6 + 4,
            w: Math.random() * 10 + 6,
            h: Math.random() * 6 + 6,
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: chosenShape
        };
    }

    /* --------------------------------------------------------------------------
       10. INTERACTIVE GIFT UNLOCK ENGINE
       -------------------------------------------------------------------------- */
    unlockSurpriseGift() {
        const gift = this.dom.giftWrapper;
        if (gift.classList.contains('opening')) return;
        
        gift.classList.add('opening');
        this.dom.giftInstructionText.textContent = 'Opening...';

        // Play synth tone chime on open
        this.playUnlockTone();

        setTimeout(() => {
            // Confetti burst!
            this.triggerConfettiCelebration();
            
            // Hide the WHOLE gift box container, show reveal at top
            this.dom.giftBoxContainer.style.display = 'none';
            this.dom.surpriseRevealCard.classList.remove('hidden');
            this.dom.revealMessageText.textContent = this.config.giftMessage;
        }, 750);
    }

    lockSurpriseGift() {
        this.dom.surpriseRevealCard.classList.add('hidden');
        this.dom.giftBoxContainer.style.display = 'flex';
        this.dom.giftWrapper.classList.remove('opening');
        this.dom.giftWrapper.style.display = '';
        this.dom.giftInstructionText.style.display = '';
        this.dom.giftInstructionText.textContent = 'Tap the gift to open!';
        
        if (this.confettiAnimationId) {
            cancelAnimationFrame(this.confettiAnimationId);
            const canvas = this.dom.confettiCanvas;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.confettiActive = false;
        }
    }

    /* --------------------------------------------------------------------------
       11. AUDIO CONTROLLER & WEBAUDIO OFFLINE SYNTHESISER FALLBACK
       -------------------------------------------------------------------------- */
    toggleMusicMenu() {
        this.dom.miniPlayerPanel.classList.toggle('hidden');
    }

    togglePlayState() {
        if (this.isPlaying) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
    }

    playMusic() {
        this.isPlaying = true;
        this.dom.audioPlayBtn.classList.add('playing');
        this.dom.miniPlayIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`; // Pause symbol

        // Try playing standard audio MP3
        this.dom.bgMusic.play()
            .then(() => {
                this.synthActive = false;
                console.log("Audio MP3 playing successfully");
            })
            .catch(err => {
                // Play failed (offline or browser security blocks autoplay without interaction)
                console.warn("Audio file blocked or failed. Starting Web Audio synthesizer engine fallback.");
                this.startSynthesizerFallback();
            });
    }

    pauseMusic() {
        this.isPlaying = false;
        this.dom.audioPlayBtn.classList.remove('playing');
        this.dom.miniPlayIcon.innerHTML = `<path d="M8 5v14l11-7z"/>`; // Play symbol

        this.dom.bgMusic.pause();
        this.stopSynthesizerFallback();
    }

    startSynthesizerFallback() {
        if (this.synthActive) return;
        this.synthActive = true;
        
        // Initialize AudioContext on gesture
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        let step = 0;
        
        // Beautiful, lush jazz/romantic chord progression (Maj9, min9, add9 chords)
        const melody = [
            [261.63, 329.63, 392.00, 493.88, 587.33], // C Maj9 (C4, E4, G4, B4, D5) - Warm romantic home
            [220.00, 261.63, 329.63, 392.00, 493.88], // A min9 (A3, C4, E4, G4, B4) - Cozy dreaminess
            [174.61, 220.00, 261.63, 329.63, 523.25], // F Maj9 (F3, A3, C4, E4, C5) - Soft longing
            [196.00, 246.94, 293.66, 392.00, 440.00]  // G 6/9 (G3, B3, D4, G4, A4) - Gentle resolution
        ];

        const playArpeggio = () => {
            const chord = melody[step % melody.length];
            const now = this.audioContext.currentTime;
            
            chord.forEach((freq, idx) => {
                const osc1 = this.audioContext.createOscillator();
                const osc2 = this.audioContext.createOscillator(); // Sparkle harmonic
                const osc2Gain = this.audioContext.createGain();
                const mainGain = this.audioContext.createGain();
                
                // Primary sine oscillator (fundamental warm note)
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(freq, now + idx * 0.20);
                
                // Secondary octave-up chime oscillator (music-box bell style)
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(freq * 2, now + idx * 0.20);
                
                // Volume of the secondary bell octave (soft and glasslike)
                osc2Gain.gain.setValueAtTime(0.18, now + idx * 0.20);
                
                // Connect notes through nodes
                osc1.connect(mainGain);
                osc2.connect(osc2Gain);
                osc2Gain.connect(mainGain);
                mainGain.connect(this.audioContext.destination);
                
                // Volume envelope for the chime (immediate attack, slow bell-like ring out)
                mainGain.gain.setValueAtTime(0, now + idx * 0.20);
                mainGain.gain.linearRampToValueAtTime(0.08 * this.dom.volumeSlider.value, now + idx * 0.20 + 0.03);
                mainGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.20 + 2.5);
                
                // Start and stop arpeggiated oscillators
                osc1.start(now + idx * 0.20);
                osc2.start(now + idx * 0.20);
                osc1.stop(now + idx * 0.20 + 2.6);
                osc2.stop(now + idx * 0.20 + 2.6);
            });
            
            step++;
        };

        playArpeggio();
        this.synthInterval = setInterval(playArpeggio, 3200); // 3.2s chord cycles
    }

    stopSynthesizerFallback() {
        this.synthActive = false;
        if (this.synthInterval) {
            clearInterval(this.synthInterval);
        }
    }

    playUnlockTone() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;
            
            // Chime up: C5 -> E5 -> G5 -> C6
            const notes = [523.25, 659.25, 783.99, 1046.50];
            
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'triangle'; // Sweet flute-like triangle wave
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                
                gain.gain.setValueAtTime(0, now + idx * 0.08);
                gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.6);
            });
        } catch (e) {
            console.log("No web audio chime possible on unlock");
        }
    }
    /* --------------------------------------------------------------------------
       12. DYNAMIC MEMORIES & TIMELINE MANAGER (SETTINGS DIALOG)
       -------------------------------------------------------------------------- */
    renderMemoriesManager() {
        const listEl = this.dom.memoriesMgrList;
        listEl.innerHTML = '';
        
        if (this.config.memories.length === 0) {
            listEl.innerHTML = '<p style="font-size:11px;color:var(--light-text);text-align:center;padding:12px">No memories yet. Add one below!</p>';
            return;
        }

        this.config.memories.forEach((mem, index) => {
            const item = document.createElement('div');
            item.className = 'memory-mgr-item';
            item.innerHTML = `
                <img src="${mem.photo}" alt="Thumb" class="memory-mgr-thumb">
                <div class="memory-mgr-info">
                    <div class="memory-mgr-title">${mem.title}</div>
                    <div class="memory-mgr-date">${mem.date}</div>
                </div>
                <div style="display:flex;gap:4px;flex-shrink:0">
                    <button class="memory-mgr-edit" data-index="${index}" aria-label="Edit Memory" style="background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center">
                        <svg viewBox="0 0 24 24" style="width:15px;height:15px;stroke:var(--dust-blue-dark);stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="memory-mgr-delete" data-index="${index}" aria-label="Delete Memory" style="background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center">
                        <svg viewBox="0 0 24 24" style="width:15px;height:15px;stroke:#e91e63;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;
            
            item.querySelector('.memory-mgr-edit').addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
                this.openEditMemoryForm(idx);
            });

            item.querySelector('.memory-mgr-delete').addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
                this.deleteMemory(idx);
            });
            
            listEl.appendChild(item);
        });
    }

    openEditMemoryForm(index) {
        const mem = this.config.memories[index];
        if (!mem) return;

        // Pre-fill the add form fields for editing
        this.dom.newMemDate.value = mem.date;
        this.dom.newMemTitle.value = mem.title;
        this.dom.newMemDesc.value = mem.desc;
        this.dom.newMemFile.value = '';

        // Change add button to save-edit mode
        const addBtn = this.dom.addMemBtn;
        addBtn.textContent = `Save Changes to "${mem.title}"`;  
        addBtn.dataset.editIndex = index;
        this.editingMemoryIndex = index;
    }

    handleSaveEditMemory(index) {
        const dateVal = this.dom.newMemDate.value.trim();
        const titleVal = this.dom.newMemTitle.value.trim();
        const descVal = this.dom.newMemDesc.value.trim();
        const fileInput = this.dom.newMemFile;

        if (!dateVal || !titleVal || !descVal) {
            alert('Please fill in Date, Title, and Description.');
            return;
        }

        const saveEdit = (photoUrl) => {
            this.config.memories[index] = {
                photo: photoUrl || this.config.memories[index].photo,
                date: dateVal,
                title: titleVal,
                desc: descVal
            };
            this.saveConfig();
            this.renderMemories();
            this.renderMemoriesManager();
            this.resetMemoryForm();
        };

        if (fileInput.files && fileInput.files[0]) {
            this.compressAndSaveImage(fileInput.files[0], saveEdit);
        } else {
            saveEdit(null);
        }
    }

    resetMemoryForm() {
        this.dom.newMemDate.value = '';
        this.dom.newMemTitle.value = '';
        this.dom.newMemDesc.value = '';
        this.dom.newMemFile.value = '';
        const addBtn = this.dom.addMemBtn;
        addBtn.textContent = 'Add Memory';
        this.editingMemoryIndex = null;
    }

    deleteMemory(index) {
        if (confirm("Are you sure you want to delete this memory?")) {
            this.config.memories.splice(index, 1);
            this.saveConfig();
            this.renderMemoriesManager();
            this.renderMemories(); // Update main memories screen
        }
    }

    handleAddNewMemory() {
        const dateVal = this.dom.newMemDate.value.trim();
        const titleVal = this.dom.newMemTitle.value.trim();
        const descVal = this.dom.newMemDesc.value.trim();
        const fileInput = this.dom.newMemFile;

        if (!dateVal || !titleVal || !descVal) {
            alert('Please fill in the Date, Title, and Description fields.');
            return;
        }

        const addMemoryObj = (photoUrl) => {
            this.config.memories.push({
                photo: photoUrl || 'assets/couple_memories.png',
                date: dateVal,
                title: titleVal,
                desc: descVal
            });
            this.saveConfig();
            this.renderMemories();
            this.renderMemoriesManager();
            this.resetMemoryForm();
        };

        if (fileInput.files && fileInput.files[0]) {
            this.compressAndSaveImage(fileInput.files[0], addMemoryObj);
        } else {
            addMemoryObj(null);
        }
    }

    compressAndSaveImage(file, callback) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const max_width = 450;
                const scale = max_width / img.width;
                canvas.width = max_width;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                callback(canvas.toDataURL('image/jpeg', 0.65));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Instantiate the App global variable once DOM is ready
let app;
window.addEventListener('DOMContentLoaded', () => {
    app = new BirthdayApp();
});
