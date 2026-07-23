/* ============================================
   ABROADREADY.ORG — Landing Page JS Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ---- Navbar Scroll Effect ---- */
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    /* ---- Mobile Menu ---- */
    const hamburger = document.getElementById('nav-hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            const spans = hamburger.querySelectorAll('span');
            if (mobileMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
                document.body.style.overflow = 'hidden'; 
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
                document.body.style.overflow = '';
            }
        });

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                const spans = hamburger.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
                document.body.style.overflow = '';
            });
        });
    }

    /* ---- Number Counters Animation ---- */
    const stats = document.querySelectorAll('.hero-stat-number');
    
    const observerOptions = {
        threshold: 0.5
    };

    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-count'));
                let count = 0;
                const duration = 2000; // ms
                const increment = target / (duration / 16); // 60fps

                const updateCount = () => {
                    count += increment;
                    if (count < target) {
                        entry.target.innerText = Math.ceil(count);
                        requestAnimationFrame(updateCount);
                    } else {
                        entry.target.innerText = target;
                    }
                };

                updateCount();
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    stats.forEach(stat => statsObserver.observe(stat));

    /* ---- Live Activity Stream ---- */
    const activities = [
        "Ahmed from Lahore just matched with 8 scholarships",
        "Fatima from Karachi started her Chevening SOP",
        "Usman from Islamabad got accepted to TUM Germany!",
        "Zainab from Peshawar added Fulbright to her wishlist",
        "Bilal completed his profile setup — 100% matched!"
    ];
    let activityIndex = 0;
    const activityTextElement = document.querySelector('.activity-text');
    const activityTimeElement = document.querySelector('.activity-time');

    if (activityTextElement && activityTimeElement) {
        setInterval(() => {
            activityIndex = (activityIndex + 1) % activities.length;
            activityTextElement.style.opacity = 0;
            
            setTimeout(() => {
                activityTextElement.innerText = activities[activityIndex];
                activityTimeElement.innerText = "Just now";
                activityTextElement.style.opacity = 1;
            }, 500);

        }, 8000); 
    }

    /* ---- Live Scholarship Feed (real data via window.SB) ---- */
    const feedGrid = document.getElementById('feed-grid');
    let feedItems = [];

    if (window.SB && window.SB.all && window.SB.all.length) {
        // Build the feed from the real dataset, soonest deadlines first.
        feedItems = window.SB.all.map(s => {
            const d = window.SB.deadlineInfo(s);
            return {
                id: s.id,
                flag: s.country,
                title: s.name,
                tags: [s.fundingType, (s.levels || []).join('/'), s.country],
                deadline: d.hasDate ? (d.daysLeft + ' days left') : 'Rolling',
                daysLeft: d.hasDate ? d.daysLeft : 99999,
                status: d.status
            };
        }).sort((a, b) => a.daysLeft - b.daysLeft);

        // Update the "View all" button + hero counts to real numbers.
        const viewAllBtn = document.querySelector('a[href="pages/results.html"].btn-outline');
        if (viewAllBtn) viewAllBtn.textContent = 'View all ' + window.SB.all.length + ' scholarships →';
        const schStat = document.querySelector('.hero-stat-number[data-count="500"]');
        if (schStat) schStat.setAttribute('data-count', window.SB.all.length);
        const cStat = document.querySelector('.hero-stat-number[data-count="48"]');
        if (cStat && window.SB.meta.countryCount) cStat.setAttribute('data-count', window.SB.meta.countryCount);
    } else {
        feedItems = [
            { flag: "United Kingdom", title: "Chevening Scholarship", tags: ["Fully Funded", "Masters", "UK"], deadline: "12 days left" },
            { flag: "Germany", title: "DAAD Scholarship", tags: ["Fully Funded", "Masters/PhD", "Germany"], deadline: "48 days left" },
            { flag: "United States", title: "Fulbright Program", tags: ["Fully Funded", "Masters/PhD", "USA"], deadline: "34 days left" }
        ];
    }

    // ---- Data-driven deadline ticker ----
    (function buildTicker() {
        const track = document.getElementById('ticker-track');
        if (!track || !window.SB || !window.SB.all) return;
        const withDates = window.SB.all
            .map(s => ({ s, d: window.SB.deadlineInfo(s) }))
            .filter(x => x.d.hasDate)
            .sort((a, b) => a.d.daysLeft - b.d.daysLeft)
            .slice(0, 10);
        if (!withDates.length) return;
        const items = withDates.map(x =>
            `<div class="ticker-item"><span class="ticker-dot${x.d.daysLeft <= 30 ? ' urgent' : ''}"></span>${x.s.name.split('(')[0].trim()} — ${x.d.daysLeft} days left</div>`
        ).join('');
        track.innerHTML = items + items; // duplicate for seamless loop
    })();

    // Initial Render
    renderFeed();

    // Gently rotate which 6 are shown (keeps the "live feed" feel, real data).
    if (feedGrid && feedItems.length > 6) {
        let offset = 0;
        setInterval(() => {
            offset = (offset + 3) % feedItems.length;
            feedGrid.style.opacity = 0.5;
            setTimeout(() => { renderFeed(offset); feedGrid.style.opacity = 1; }, 300);
        }, 15000);
    }

    function renderFeed(offset) {
        if (!feedGrid) return;
        offset = offset || 0;
        feedGrid.innerHTML = '';
        const rotated = feedItems.slice(offset).concat(feedItems.slice(0, offset));
        rotated.slice(0, 6).forEach(scholarship => {
            const card = document.createElement('div');
            card.className = 'scholarship-card animate-fade-in-up';
            const tagsHTML = scholarship.tags.filter(Boolean).map(tag => `<span class="sc-tag">${tag}</span>`).join('');
            const href = scholarship.id ? `pages/scholarship.html?id=${encodeURIComponent(scholarship.id)}` : 'pages/results.html';
            card.innerHTML = `
                <div class="sc-header">
                    <span class="sc-flag">${window.SB && SB.flagImg ? SB.flagImg(scholarship.flag, 32) : scholarship.flag}</span>
                    <span class="sc-match">${scholarship.status === 'closing' ? '🔥 Closing soon' : '🎓 Open'}</span>
                </div>
                <h3 class="sc-title">${scholarship.title}</h3>
                <div class="sc-tags">${tagsHTML}</div>
                <div class="sc-footer">
                    <a href="${href}" class="btn btn-ghost btn-sm" style="padding:0; color:var(--primary);">View Details →</a>
                    <span class="sc-deadline">⏳ ${scholarship.deadline}</span>
                </div>
            `;
            feedGrid.appendChild(card);
        });
    }

    /* ---- Quiz Logic ---- */
    const quizQuestions = [
        {
            question: "What is your highest level of education?",
            options: ["High School / A-Levels", "Bachelor's Degree", "Master's Degree", "PhD"]
        },
        {
            question: "What degree do you want to pursue abroad?",
            options: ["Bachelor's", "Master's", "PhD", "Short Course / Exchange"]
        },
        {
            question: "Which field of study?",
            options: ["Engineering / Tech", "Business / Management", "Medical / Sciences", "Arts / Humanities"]
        },
        {
            question: "What is your approximate CGPA?",
            options: ["Below 2.5", "2.5 - 3.0", "3.0 - 3.5", "Above 3.5"]
        },
        {
            question: "Have you taken an English proficiency test?",
            options: ["IELTS (6.5+)", "TOEFL (90+)", "No, but planning to", "No, looking for waivers"]
        },
        {
            question: "What is your primary destination preference?",
            options: ["UK / Europe", "USA / Canada", "Australia / New Zealand", "Open to Anywhere"]
        },
        {
            question: "What level of funding do you need?",
            options: ["Fully Funded (Need everything covered)", "Partial Funding (Can pay living costs)", "Tuition Waiver Only", "Self-funded but looking for grants"]
        },
        {
            question: "When do you plan to start?",
            options: ["This year (Urgent)", "Next year", "In 2 years", "Just exploring"]
        }
    ];

    let currentQuestion = 0;
    const answers = {};
    const quizBody = document.getElementById('quiz-body');
    const btnPrev = document.getElementById('quiz-prev');
    const btnNext = document.getElementById('quiz-next');
    const progressFill = document.getElementById('quiz-progress-fill');
    const stepLabel = document.getElementById('quiz-step-label');

    function renderQuestion() {
        if(!quizBody) return;

        // Guard against overshooting the last question (e.g. rapid double-clicks):
        // once we pass the final question, go straight to the results.
        if (currentQuestion >= quizQuestions.length) { showQuizLoading(); return; }
        if (currentQuestion < 0) currentQuestion = 0;

        // Update Progress
        const progress = ((currentQuestion) / quizQuestions.length) * 100;
        progressFill.style.width = `${progress}%`;
        stepLabel.innerText = `Question ${currentQuestion + 1} of ${quizQuestions.length}`;

        // Update Buttons
        btnPrev.disabled = currentQuestion === 0;
        if (currentQuestion === quizQuestions.length - 1) {
            btnNext.innerText = "Show My Matches 🎯";
            btnNext.classList.add('btn-accent');
        } else {
            btnNext.innerText = "Next →";
            btnNext.classList.remove('btn-accent');
        }

        const q = quizQuestions[currentQuestion];
        
        let optionsHtml = '';
        q.options.forEach((opt, index) => {
            const isSelected = answers[currentQuestion] === index ? 'selected' : '';
            optionsHtml += `<div class="quiz-option ${isSelected}" data-index="${index}">${opt}</div>`;
        });

        quizBody.innerHTML = `
            <div class="quiz-question active">
                <h3 class="quiz-q-title">${q.question}</h3>
                <div class="quiz-options">
                    ${optionsHtml}
                </div>
            </div>
        `;

        // Add event listeners to new options
        const optionElements = quizBody.querySelectorAll('.quiz-option');
        optionElements.forEach(opt => {
            opt.addEventListener('click', function() {
                // Remove selected from all
                optionElements.forEach(o => o.classList.remove('selected'));
                // Add to clicked
                this.classList.add('selected');
                // Save answer
                answers[currentQuestion] = parseInt(this.getAttribute('data-index'));
                
                // Auto advance after short delay
                if (currentQuestion < quizQuestions.length - 1) {
                    setTimeout(() => {
                        currentQuestion++;
                        renderQuestion();
                    }, 400);
                }
            });
        });
    }

    // Initialize Quiz
    renderQuestion();

    btnNext?.addEventListener('click', () => {
        if (answers[currentQuestion] === undefined) {
            // Shake effect if trying to advance without answering
            const qDiv = quizBody.querySelector('.quiz-question');
            qDiv.style.transform = 'translateX(10px)';
            setTimeout(() => qDiv.style.transform = 'translateX(-10px)', 100);
            setTimeout(() => qDiv.style.transform = 'translateX(10px)', 200);
            setTimeout(() => qDiv.style.transform = 'translateX(0)', 300);
            return;
        }

        if (currentQuestion < quizQuestions.length - 1) {
            currentQuestion++;
            renderQuestion();
        } else {
            // Finish Quiz
            showQuizLoading();
        }
    });

    btnPrev?.addEventListener('click', () => {
        if (currentQuestion > 0) {
            currentQuestion--;
            renderQuestion();
        }
    });

    function buildResultsQuery() {
        // Map quiz answers to results-page filters (degree wanted + destination).
        const params = new URLSearchParams();
        const levelMap = { 0: 'Bachelors', 1: 'Masters', 2: 'PhD' };          // Q2
        const regionMap = { 0: 'UK,Europe', 1: 'North America', 2: 'Oceania' }; // Q6
        if (answers[1] !== undefined && levelMap[answers[1]]) params.set('level', levelMap[answers[1]]);
        if (answers[5] !== undefined && regionMap[answers[5]]) params.set('region', regionMap[answers[5]]);
        const qs = params.toString();
        return 'pages/results.html' + (qs ? ('?' + qs) : '');
    }

    function showQuizLoading() {
        if(!quizBody) return;
        progressFill.style.width = '100%';
        stepLabel.innerText = 'Analyzing profile...';

        const total = (window.SB && window.SB.all) ? window.SB.all.length : '500+';
        const countries = (window.SB && window.SB.meta && window.SB.meta.countryCount) ? window.SB.meta.countryCount : '48';
        quizBody.innerHTML = `
            <div class="quiz-loading animate-fade-in">
                <div class="spinner"></div>
                <h3 style="color: white; margin-bottom: 8px;">Finding your matches...</h3>
                <p style="color: var(--gray-400);">Filtering ${total} scholarships across ${countries} countries</p>
            </div>
        `;

        const nav = document.getElementById('quiz-nav');
        if(nav) nav.style.display = 'none';

        const dest = buildResultsQuery();
        setTimeout(() => {
            triggerConfetti();
            setTimeout(() => { window.location.href = dest; }, 1500);
        }, 2500);
    }

    /* ---- Quiz Timer ---- */
    let timeLeft = 120; // 2 minutes
    const timerDisplay = document.getElementById('timer-display');
    const timerContainer = document.getElementById('quiz-timer');
    
    if(timerDisplay && timerContainer) {
        const timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            timerDisplay.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            
            if (timeLeft <= 30) {
                timerContainer.classList.add('warning');
            }
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerDisplay.innerText = "0:00";
                // Optional: Auto submit or show message
            }
        }, 1000);
    }

    /* ---- Progress Toast ---- */
    const toast = document.getElementById('progress-toast');
    const toastClose = document.getElementById('toast-close');
    
    if(toast) {
        // Show after 3 seconds
        setTimeout(() => {
            toast.classList.add('show');
        }, 3000);

        if(toastClose) {
            toastClose.addEventListener('click', () => {
                toast.classList.remove('show');
            });
        }
    }

    /* ---- Simple Confetti Implementation ---- */
    function triggerConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = [];
        const colors = ['#c9a84c', '#e8452a', '#1a3a2a', '#2a6adb', '#ffffff'];

        for (let i = 0; i < 100; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                w: Math.random() * 10 + 5,
                h: Math.random() * 10 + 5,
                c: colors[Math.floor(Math.random() * colors.length)],
                dx: Math.random() * 4 - 2,
                dy: Math.random() * 5 + 2,
                rot: Math.random() * 360,
                dRot: Math.random() * 10 - 5
            });
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;

            pieces.forEach(p => {
                p.y += p.dy;
                p.x += p.dx;
                p.rot += p.dRot;

                if (p.y < canvas.height) active = true;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot * Math.PI / 180);
                ctx.fillStyle = p.c;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });

            if (active) {
                requestAnimationFrame(draw);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        draw();
    }

    /* ---- Newsletter Form ---- */
    const newsletterForm = document.getElementById('newsletter-form');
    if(newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = newsletterForm.querySelector('button');
            const originalText = btn.innerText;
            
            btn.innerText = 'Subscribing...';
            btn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                btn.innerText = 'Subscribed! 🎉';
                btn.classList.replace('btn-primary', 'btn-accent');
                newsletterForm.querySelector('input').value = '';
                
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.classList.replace('btn-accent', 'btn-primary');
                    btn.disabled = false;
                }, 3000);
            }, 1000);
        });
    }
});
