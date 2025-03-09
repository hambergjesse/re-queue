document.addEventListener('DOMContentLoaded', function() {
    // Add scroll behavior for header
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.style.backgroundColor = 'rgba(13, 13, 13, 0.95)';
            header.style.borderBottomColor = 'var(--border)';
        } else {
            header.style.backgroundColor = 'rgba(13, 13, 13, 0.8)';
            header.style.borderBottomColor = 'transparent';
        }
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Browser selector functionality
    const browserOptions = document.querySelectorAll('.browser-option');
    const primaryCta = document.querySelector('.primary-cta');
    
    browserOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            // Update active state
            browserOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            // Update primary CTA href to match the selected browser
            primaryCta.href = this.href;
            
            // Allow the browser default action to happen (follow the link)
        });
    });
    
    // Feature tabs functionality
    const featureNavButtons = document.querySelectorAll('.feature-nav-btn');
    const showcaseItems = document.querySelectorAll('.showcase-item');
    
    featureNavButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            
            // Update active button
            featureNavButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update active showcase item
            showcaseItems.forEach(item => {
                if (item.getAttribute('data-tab') === tab) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        });
    });
    
    // FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    otherAnswer.style.display = 'none';
                }
            });
            
            // Toggle current FAQ item
            item.classList.toggle('active');
            const answer = item.querySelector('.faq-answer');
            
            if (item.classList.contains('active')) {
                answer.style.display = 'block';
            } else {
                answer.style.display = 'none';
            }
        });
    });
    
    // Add animation for feature cards
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature-card, .workflow-step, .showcase-item, .chat-bubble').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Queue animation controls
    const resetQueueAnimation = () => {
        const waiting = document.querySelector('.queue-state.waiting');
        const accept = document.querySelector('.queue-state.accept');
        const success = document.querySelector('.queue-state.success');
        
        if (waiting && accept && success) {
            waiting.style.animation = 'none';
            accept.style.animation = 'none';
            success.style.animation = 'none';
            
            // Force reflow
            void waiting.offsetWidth;
            void accept.offsetWidth;
            void success.offsetWidth;
            
            waiting.style.animation = 'fadeInOut 6s infinite';
            accept.style.animation = 'showAccept 6s infinite';
            accept.style.animationDelay = '2s';
            success.style.animation = 'showSuccess 6s infinite';
            success.style.animationDelay = '4s';
        }
    };
    
    // Reset animation when it becomes visible
    const queueAnimation = document.querySelector('.queue-animation');
    if (queueAnimation) {
        const queueObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    resetQueueAnimation();
                }
            });
        }, { threshold: 0.5 });
        
        queueObserver.observe(queueAnimation);
    }
}); 