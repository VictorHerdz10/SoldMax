export function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileMenu = document.getElementById("mobileMenu");
    const closeMobileMenuBtn = document.getElementById("closeMobileMenu");

    const toggleMobileMenu = () => {
        mobileMenu.classList.toggle("-translate-x-full");
    };

    mobileMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleMobileMenu();
    });

    closeMobileMenuBtn.addEventListener("click", () => {
        mobileMenu.classList.add("-translate-x-full");
    });

    document.querySelectorAll("#mobileMenu a").forEach((link) => {
        link.addEventListener("click", () => {
            mobileMenu.classList.add("-translate-x-full");
        });
    });

    document.addEventListener("click", (e) => {
        if (!mobileMenu.contains(e.target) && e.target !== mobileMenuBtn) {
            mobileMenu.classList.add("-translate-x-full");
        }
    });
}