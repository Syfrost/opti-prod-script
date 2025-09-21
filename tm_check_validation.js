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

    // Créer un conteneur pour les boutons
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

    // Bouton "Conforme"
    if (!document.getElementById("btnConforme")) {
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
    }

    // Bouton "Signer"
    if (!document.getElementById("btnSigner")) {
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
    }

    // Bouton "Valider"
    if (!document.getElementById("btnValider")) {
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
                console.warn('Impossible d’accéder à un iframe (cross-domain).', e);
            }
        }

        // 3. Ensuite exécuter la logique de base
        const btn = document.getElementById('fonctionnel_validateAndNext_form')
        || document.getElementById('fonctionnel_validate_form');
        if (btn) {
            btn.click();
        } else {
            //alert('Bouton Valider introuvable!');
        }
        };

        buttonContainer.appendChild(buttonValidate);
    }

})();