(function() {
    'use strict';

    function masquerSiPlannerView(element) {
        if (location.href.includes("planner.cloud.microsoft")) {
            element.classList.add('hide');
        }
    }

    const style = document.createElement('style');
    style.textContent = `
    .hide {
        display: none !important;
    }
    `;
    document.head.appendChild(style);

    // Récupérer la valeur de l'élément #idUser ou chaîne vide si absent
    const cpPersoValue = (document.getElementById("idUser") || {}).value || "";

    // Créer un conteneur pour les boutons (TOUJOURS créé)
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'collectorpanel';
    buttonContainer.style.position = 'fixed';
    buttonContainer.style.bottom = '10px';
    buttonContainer.style.right = '10px';
    buttonContainer.style.zIndex = '1000';
    buttonContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    buttonContainer.style.padding = '10px';
    buttonContainer.style.borderRadius = '5px';
    buttonContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    document.body.appendChild(buttonContainer);
    masquerSiPlannerView(buttonContainer);

    // Fonctions pour créer/supprimer les boutons selon la présence des éléments cibles

    function createConformeButton() {
        if (document.getElementById("btnConforme")) return; // Déjà créé

        const buttonConfo = document.createElement('button');
        buttonConfo.id = "btnConforme";
        const spanConfo = document.createElement('span');
        spanConfo.innerText = 'Conforme';
        buttonConfo.appendChild(spanConfo);
        window.styleButton(buttonConfo, 'blue', 'fa-check');
        buttonConfo.onclick = function() {
            document.querySelectorAll('button[title="Conforme"]').forEach(button => button.click());
        };
        buttonContainer.appendChild(buttonConfo);
        console.log("✅ Bouton 'Conforme' ajouté");
    }

    function removeConformeButton() {
        const btn = document.getElementById("btnConforme");
        if (btn) {
            btn.remove();
            console.log("❌ Bouton 'Conforme' retiré");
        }
    }

    function createSignerButton() {
        if (document.getElementById("btnSigner")) return; // Déjà créé

        const buttonSign = document.createElement('button');
        buttonSign.id = "btnSigner";
        const spanSign = document.createElement('span');
        spanSign.innerText = 'Signer';
        buttonSign.appendChild(spanSign);
        window.styleButton(buttonSign, 'orange', 'fa-pen');
        buttonSign.onclick = function() {
            console.log("cpPersoValue =", cpPersoValue);
            document.querySelectorAll(`button[cp="${cpPersoValue}"]`).forEach(button => button.click());
        };
        buttonContainer.appendChild(buttonSign);
        console.log("✅ Bouton 'Signer' ajouté");
    }

    function removeSignerButton() {
        const btn = document.getElementById("btnSigner");
        if (btn) {
            btn.remove();
            console.log("❌ Bouton 'Signer' retiré");
        }
    }

    function createValiderButton() {
        if (document.getElementById("btnValider")) return; // Déjà créé

        const buttonValidate = document.createElement('button');
        buttonValidate.id = "btnValider";
        const spanValidate = document.createElement('span');
        spanValidate.innerText = 'Valider';
        buttonValidate.appendChild(spanValidate);
        window.styleButton(buttonValidate, 'green', 'fa-arrow-right');
        buttonValidate.classList.add('validateBtn');

        buttonValidate.onclick = function() {
            // 1. Cliquer sur tous les .validateBtn (dans la page principale)
            document.querySelectorAll('.validateBtn').forEach(el => {
                if (el !== buttonValidate) { // éviter que ton propre bouton se reclique
                    el.click();
                }
            });

            // 2. Clique sur tous les .validateBtn dans les iframes
            const iframes = document.querySelectorAll('iframe');
            for (const iframe of iframes) {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    doc.querySelectorAll('.validateBtn').forEach(el => el.click());
                } catch (e) {
                    console.warn('Impossible d\'accéder à un iframe (cross-domain).', e);
                }
            }

            // 3. Ensuite exécuter la logique de base
            const btn = document.getElementById('fonctionnel_validateAndNext_form')
            || document.getElementById('fonctionnel_validate_form');
            if (btn) {
                btn.click();
            } else {
                sytoast('warning', 'Bouton Valider introuvable!');
            }
        };

        buttonContainer.appendChild(buttonValidate);
        console.log("✅ Bouton 'Valider' ajouté");
    }

    function removeValiderButton() {
        const btn = document.getElementById("btnValider");
        if (btn) {
            btn.remove();
            console.log("❌ Bouton 'Valider' retiré");
        }
    }

    // Fonctions de vérification de la présence des éléments cibles
    function checkConformeElements() {
        return document.querySelector('button[title="Conforme"]') !== null;
    }

    function checkSignerElements() {
        return document.querySelector('button[id^="signature_select"]') !== null;
    }

    function checkValiderElements() {
        // Vérifier la présence de l'onglet PRM_ura actif
        const prmUraActive = document.querySelector('#PRM_ura.active') !== null;
        if (prmUraActive) return true;

        // Vérifier la présence des boutons fonctionnels principaux
        const functionalBtn = document.getElementById('fonctionnel_validateAndNext_form')
            || document.getElementById('fonctionnel_validate_form');
        if (functionalBtn) return true;

        // Vérifier SEULEMENT dans les iframes (pas la page principale)
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (doc.querySelector('.validateBtn')) return true;
            } catch (e) {
                // Ignorer les erreurs de cross-domain
            }
        }
        return false;
    }

    // Fonction pour mettre à jour les boutons selon la présence des éléments
    function updateButtons() {
        // Bouton Conforme
        if (checkConformeElements()) {
            createConformeButton();
        } else {
            removeConformeButton();
        }

        // Bouton Signer
        if (checkSignerElements()) {
            createSignerButton();
        } else {
            removeSignerButton();
        }

        // Bouton Valider
        if (checkValiderElements()) {
            createValiderButton();
        } else {
            removeValiderButton();
        }
    }

    // Observer pour surveiller les changements dans le DOM
    function initObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;

            mutations.forEach((mutation) => {
                // Vérifier si des éléments ont été ajoutés ou supprimés
                if (mutation.type === 'childList') {
                    const addedNodes = Array.from(mutation.addedNodes);
                    const removedNodes = Array.from(mutation.removedNodes);

                    // Vérifier si des éléments pertinents ont été ajoutés/supprimés
                    [...addedNodes, ...removedNodes].forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            // Vérifier si c'est un bouton Conforme
                            if (node.matches && node.matches('button[title="Conforme"]')) {
                                shouldUpdate = true;
                            }
                            // Vérifier si c'est un bouton Signer
                            else if (node.matches && node.matches('button[id^="signature_select"]')) {
                                shouldUpdate = true;
                            }
                            // Vérifier si c'est un élément validateBtn (IGNORÉ - on ne surveille que les iframes)
                            // Note: Les .validateBtn de la page principale ne déclenchent pas la création du bouton
                            // else if (node.matches && node.matches('.validateBtn')) {
                            //     shouldUpdate = true;
                            // }
                            // Vérifier si c'est un bouton fonctionnel de validation
                            else if (node.matches && (
                                node.matches('#fonctionnel_validateAndNext_form') ||
                                node.matches('#fonctionnel_validate_form')
                            )) {
                                shouldUpdate = true;
                            }
                            // Vérifier si un des descendants contient ces éléments
                            else if (node.querySelector) {
                                if (node.querySelector('button[title="Conforme"], button[id^="signature_select"], #fonctionnel_validateAndNext_form, #fonctionnel_validate_form')) {
                                    shouldUpdate = true;
                                }
                                // Note: .validateBtn retiré car on ne surveille que les iframes pour cet élément
                            }
                        }
                    });
                }

                // Vérifier les changements d'attributs (changement d'onglet actif)
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.id === 'PRM_ura') {
                        console.log('🔄 Changement détecté sur #PRM_ura');
                        shouldUpdate = true;
                    }
                }
            });

            if (shouldUpdate) {
                updateButtons();
            }
        });

        // Observer les changements sur tout le document
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });

        console.log('👁️ Observer pour les boutons collector initialisé');
    }

    // Initialisation
    updateButtons(); // Vérification initiale
    initObserver();  // Démarrage de l'observateur

})();
