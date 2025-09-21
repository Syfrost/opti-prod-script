(function observerComposantRequis() {
    const observer = new MutationObserver(() => {
        const input = document.getElementById('B_composant_required');
        if (input && input.value === '1') {
            input.value = '0';
            console.log('✅ Valeur automatiquement mise à 0 pour #B_composant_required');
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
