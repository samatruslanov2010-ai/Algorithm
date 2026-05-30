(function () {
    const track = document.getElementById('track');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (!track || !prevBtn || !nextBtn) return;

    const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gap'), 10) || 24;

    function behavior() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    }

    function step() {
        const card = track.querySelector('.project');
        return card ? card.getBoundingClientRect().width + gap : 320;
    }

    function updateButtons() {
        const canScroll = track.scrollWidth > track.clientWidth + 1;
        const show = canScroll && window.innerWidth > 768;
        prevBtn.hidden = !show;
        nextBtn.hidden = !show;
    }

    nextBtn.addEventListener('click', function () {
        track.scrollBy({ left: step(), behavior: behavior() });
    });

    prevBtn.addEventListener('click', function () {
        track.scrollBy({ left: -step(), behavior: behavior() });
    });

    track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            track.scrollBy({ left: step(), behavior: behavior() });
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            track.scrollBy({ left: -step(), behavior: behavior() });
        }
    });

    updateButtons();
    window.addEventListener('resize', updateButtons);
    track.addEventListener('scroll', updateButtons, { passive: true });
})();