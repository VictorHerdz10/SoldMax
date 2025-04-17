export function setupActiveSectionHighlight() {
    const sections = ["dashboard", "productos", "ofertas", "favoritos", "compras"];
    
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                const offset = element.offsetTop;
                const height = element.offsetHeight;
                
                if (scrollPosition >= offset && scrollPosition < offset + height) {
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.remove('text-blue-300', 'font-semibold');
                    });
                    
                    const activeLinks = document.querySelectorAll(`.nav-link[data-section="${section}"]`);
                    activeLinks.forEach(link => {
                        link.classList.add('text-blue-300', 'font-semibold');
                    });
                }
            }
        });
    });
}