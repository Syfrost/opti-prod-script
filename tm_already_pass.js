// ==UserScript==
// @name         Boutons Oui/Non Automatiques (dans container fixe)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Ajoute des boutons Oui/Non dans le coin inférieur droit selon la présence d'une question spécifique et simule un clic sur les boutons Bootstrap associés automatiquement
// @author       Cedric G
// @match        https://prod.cloud-collectorplus.mt.sncf.fr/Prm/Reparation/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const questionTexte = "La pièce est elle revenue deux fois ou plus dans une année pour des motifs similaire";

    const intervalCheck = setInterval(() => {
        const panels = document.querySelectorAll('.panel-pc');
        let panelTrouve = false;

        panels.forEach(panel => {
            const titrePanel = panel.querySelector('.title-panel')?.textContent?.trim();
            if (titrePanel?.includes(questionTexte)) {
                panelTrouve = true;

                const buttonContainer = document.querySelector('div[style*="position: fixed;"][style*="bottom: 10px;"][style*="right: 10px;"]');
                if (!buttonContainer || document.getElementById("btnOuiAuto") || document.getElementById("btnNonAuto")) return;

                const btnOui = document.createElement("button");
                btnOui.id = "btnOuiAuto";
                const spanOui = document.createElement("span");
                spanOui.innerText = " Oui";
                btnOui.appendChild(spanOui);
                btnOui.onclick = () => {
                    const btn = panel.querySelector('button[id^="btn_bool_input"][collector-value="1"]');
                    btn?.click();
                };
                window.styleButton(btnOui, "#28a745", "fa-check");

                const btnNon = document.createElement("button");
                btnNon.id = "btnNonAuto";
                const spanNon = document.createElement("span");
                spanNon.innerText = " Non";
                btnNon.appendChild(spanNon);
                btnNon.onclick = () => {
                    const btn = panel.querySelector('button[id^="btn_bool_input"][collector-value="0"]');
                    btn?.click();
                };
                window.styleButton(btnNon, "#dc3545", "fa-times");

                buttonContainer.prepend(btnNon);
                buttonContainer.prepend(btnOui);
            }
        });

        if (!panelTrouve) {
            retirerBoutons();
        }

    }, 1000);

    function retirerBoutons() {
        document.getElementById("btnOuiAuto")?.remove();
        document.getElementById("btnNonAuto")?.remove();
    }
})();
