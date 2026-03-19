document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  const currentPage = document.body.dataset.page;
  if(currentPage){
    document.querySelectorAll(".site-nav a[data-page]").forEach((link) => {
      if(link.dataset.page === currentPage){
        link.setAttribute("aria-current", "page");
      }
    });
  }

  const waBtn = document.querySelector(".whatsapp-btn");
  if(waBtn){
    let lastPop = 0;
    window.addEventListener("scroll", () => {
      const now = Date.now();
      if(now - lastPop < 900) return;
      lastPop = now;
      waBtn.classList.add("is-pop");
      setTimeout(() => waBtn.classList.remove("is-pop"), 220);
    }, { passive: true });
  }

  const storyToggle = document.querySelector(".story-toggle");
  if(storyToggle){
    const panelId = storyToggle.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    if(panel){
      panel.hidden = storyToggle.getAttribute("aria-expanded") !== "true";
      storyToggle.addEventListener("click", () => {
        const nextExpanded = storyToggle.getAttribute("aria-expanded") !== "true";
        storyToggle.setAttribute("aria-expanded", String(nextExpanded));
        panel.hidden = !nextExpanded;
      });
    }
  }

  const slider = document.querySelector(".promo-slider");
  if(slider){
    const track = slider.querySelector(".promo-track");
    const slides = Array.from(slider.querySelectorAll(".promo-slide"));
    const slideVideos = slides.map((slide) => slide.querySelector("video"));
    const prevBtn = slider.querySelector(".promo-prev");
    const nextBtn = slider.querySelector(".promo-next");
    const dotsWrap = slider.querySelector(".promo-dots");
    let index = 0;
    let autoplayId = null;
    const AUTOPLAY_MS = 9000;

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "promo-dot";
      dot.setAttribute("aria-label", `Go to promotion ${i + 1}`);
      dot.addEventListener("click", () => goTo(i, true));
      dotsWrap.appendChild(dot);
    });

    const dots = Array.from(slider.querySelectorAll(".promo-dot"));

    slideVideos.forEach((video) => {
      if(!video) return;
      const loopEnd = Number(video.dataset.loopEnd);
      if(!loopEnd) return;
      video.addEventListener("timeupdate", () => {
        if(video.currentTime >= loopEnd){
          video.currentTime = 0;
          const promise = video.play();
          if(promise && typeof promise.catch === "function") promise.catch(() => {});
        }
      });
    });

    function update(){
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((dot, i) => {
        dot.setAttribute("aria-current", i === index ? "true" : "false");
      });
      slideVideos.forEach((video, i) => {
        if(!video) return;
        if(i === index){
          const promise = video.play();
          if(promise && typeof promise.catch === "function") promise.catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    }

    function goTo(i, userAction = false){
      index = (i + slides.length) % slides.length;
      update();
      if(userAction) restartAutoplay();
    }
    function next(userAction = false){ goTo(index + 1, userAction); }
    function prev(userAction = false){ goTo(index - 1, userAction); }
    function stopAutoplay(){
      if(autoplayId) clearInterval(autoplayId);
      autoplayId = null;
    }
    function startAutoplay(){
      stopAutoplay();
      autoplayId = setInterval(() => next(false), AUTOPLAY_MS);
    }
    function restartAutoplay(){ startAutoplay(); }

    prevBtn.addEventListener("click", () => prev(true));
    nextBtn.addEventListener("click", () => next(true));
    slider.addEventListener("mouseenter", stopAutoplay);
    slider.addEventListener("mouseleave", startAutoplay);
    slider.addEventListener("keydown", (e) => {
      if(e.key === "ArrowRight") next(true);
      if(e.key === "ArrowLeft") prev(true);
    });

    let startX = 0;
    let isDown = false;
    slider.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      isDown = true;
      stopAutoplay();
    }, { passive: true });
    slider.addEventListener("touchend", (e) => {
      if(!isDown) return;
      isDown = false;
      const endX = e.changedTouches[0].clientX;
      const dx = endX - startX;
      if(Math.abs(dx) > 40){
        dx < 0 ? next(true) : prev(true);
      } else {
        restartAutoplay();
      }
    }, { passive: true });

    update();
    startAutoplay();
  }

  const form = document.getElementById("waBookingForm");
  if(form){
    const WA_NUMBER = "919000445081";
    const nameEl = document.getElementById("name");
    const phoneEl = document.getElementById("phone");
    const serviceEl = document.getElementById("service");
    const messageEl = document.getElementById("message");

    function getErrEl(input){
      let err = input.parentElement.querySelector(`.field-error[data-for="${input.id}"]`);
      if(!err){
        err = document.createElement("div");
        err.className = "field-error";
        err.dataset.for = input.id;
        input.insertAdjacentElement("afterend", err);
      }
      return err;
    }

    function setError(input, msg){
      input.classList.add("invalid");
      input.setAttribute("aria-invalid", "true");
      getErrEl(input).textContent = msg;
    }

    function clearError(input){
      input.classList.remove("invalid");
      input.removeAttribute("aria-invalid");
      const err = input.parentElement.querySelector(`.field-error[data-for="${input.id}"]`);
      if(err) err.textContent = "";
    }

    function normalizeIndianPhone(raw){
      const digits = (raw || "").replace(/\D/g, "");
      if(digits.length === 10) return `91${digits}`;
      if(digits.length === 12 && digits.startsWith("91")) return digits;
      return null;
    }

    function validate(){
      let ok = true;
      const normalizedPhone = normalizeIndianPhone(phoneEl.value.trim());
      if(nameEl.value.trim().length < 2){
        setError(nameEl, "Please enter your name.");
        ok = false;
      } else {
        clearError(nameEl);
      }
      if(!normalizedPhone){
        setError(phoneEl, "Enter a valid phone (10 digits) or +91XXXXXXXXXX.");
        ok = false;
      } else {
        clearError(phoneEl);
      }
      return { ok, normalizedPhone };
    }

    [nameEl, phoneEl].forEach((field) => {
      field.addEventListener("input", () => {
        clearError(field);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const { ok, normalizedPhone } = validate();
      if(!ok) return;
      const text =
`Hello Sri Varsha Beauty,
Name: ${nameEl.value.trim()}
Phone: +${normalizedPhone}
Service: ${serviceEl.value.trim() || "-"}
Details: ${messageEl.value.trim() || "-"}`;
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    });
  }
});
