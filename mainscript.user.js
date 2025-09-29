// ==UserScript==
// @name         Script collector auto
// @namespace    https://github.com/Syfrost/opti-prod-script
// @version      1.7.2
// @description  Améliorations diverses pour Collector+ (Copie CRI, REX, Validation, Onglets PRM...)
// @author       Cedric GEORGES
// @connect      prod.cloud-collectorplus.mt.sncf.fr
// @match        https://prod.cloud-collectorplus.mt.sncf.fr/Prm/Reparation/*
// @match        https://prod.cloud-collectorplus.mt.sncf.fr/*
// @require      https://raw.githubusercontent.com/Syfrost/opti-prod-script/main/tm_utils.js
// @require      https://raw.githubusercontent.com/Syfrost/opti-prod-script/main/tm_toast.js
// @require      https://raw.githubusercontent.com/Syfrost/opti-prod-script/main/tm_check_validation.js
// @require      https://raw.githubusercontent.com/Syfrost/opti-prod-script/main/tm_copy_cri.js
// @require      https://raw.githubusercontent.com/Syfrost/opti-prod-script/main/tm_copy_rex.js
// @require      https://raw.githubusercontent.com/Syfrost/opti-prod-script/main/tm_prm_tab.js
// @updateURL    https://raw.githubusercontent.com/Syfrost/opti-prod-script/main/mainscript.user.js
// @downloadURL  https://raw.githubusercontent.com/Syfrost/opti-prod-script/main/mainscript.user.js
// @grant        GM_info
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
    'use strict';

    const versionLocale = GM_info.script.version;
    const scriptURL = "https://raw.githubusercontent.com/Syfrost/opti-prod-script/main/mainscript.user.js";

    console.log("[Script Collector Auto] Version locale :", versionLocale);

    fetch(scriptURL)
        .then(r => r.text())
        .then(text => {
            const match = text.match(/@version\s+([^\n]+)/);
            if (match) {
                const versionDistante = match[1].trim();
                console.log("[Script Collector Auto] Version distante :", versionDistante);
                console.log("[Script Collector Auto] Version locale :", versionLocale);

                if (estNouvelleVersion(versionLocale, versionDistante)) {
                    console.log("[Script Collector Auto] ➕ Mise à jour disponible !");
                    afficherBoutonMAJ(versionDistante, scriptURL);
                } else {
                    console.log("[Script Collector Auto] ✅ Script à jour.");
                }
            } else {
                console.warn("[Script Collector Auto] ⚠️ Impossible de détecter la version distante.");
            }
        })
        .catch(err => console.error("[Script Collector Auto] ❌ Erreur récupération version distante :", err));

    function estNouvelleVersion(local, distante) {
        const toNum = v => v.split('.').map(Number);
        const [l, d] = [toNum(local), toNum(distante)];
        for (let i = 0; i < Math.max(l.length, d.length); i++) {
            const a = l[i] || 0, b = d[i] || 0;
            if (b > a) return true;
            if (b < a) return false;
        }
        return false;
    }

    function afficherBoutonMAJ(versionDistante, installUrl) {
        const container = document.querySelector('div[style*="position: fixed"][style*="bottom: 10px"][style*="right: 10px"]');
        if (!container || document.getElementById("btnMajScript")) return;

        const btn = document.createElement("button");
        btn.id = "btnMajScript";
        const spanBtn = document.createElement("span");
        spanBtn.innerText = `🆕 MAJ dispo (${versionDistante})`;
        btn.appendChild(spanBtn);
        btn.onclick = () => {
            sytoast('info', 'Une nouvelle version du script est disponible.<br>Un nouvel onglet va s’ouvrir pour l’installation.');
            window.open(installUrl, "_blank");
        };

        // Récupérer le message du dernier commit via l’API GitHub
        fetch("https://api.github.com/repos/Syfrost/opti-prod-script/commits?path=mainscript.user.js&page=1&per_page=1")
            .then(res => res.json())
            .then(data => {
                if (data && data[0] && data[0].commit && data[0].commit.message) {
                    btn.title = data[0].commit.message; // Affiche le message au hover
                }
            })
            .catch(err => {
                console.warn("[Script Collector Auto] ⚠️ Erreur récupération commit :", err);
            });

        window.styleButton(btn, "#ffc107", "fa-arrow-up");
        container.appendChild(btn);
    }

    GM_addStyle(`
    .autoelement {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        width: 100%;
        border-radius: 5px !important;
        border: 2px solid rgb(255, 128, 0) !important;
        background: rgba(0, 0, 0, 0.5) !important;
        backdrop-filter: blur(5px);
        box-shadow: 0 2px 8px rgba(255, 104, 0, 0.8);
        padding: 5px;
    }
    .autoelement__img__container {
        display: block;
        position: relative;
        padding: 4px 4px 4px 4px;
        margin: 0;
        width: auto;
        height: auto;
        border-radius: 50px;
        overflow: hidden;
    }
    .autoelement__img__source {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 25px !important;
        height: 20px !important;
        overflow: hidden;
    }
    .autoelement__text {
        padding-right: 5px;
        color: rgb(204,204,204) !important;
        font-family: 'Montserrat', sans-serif;
        font-weight: 400;
        font-size: 0.8rem;
    }
        `);
        injecterPoliceMontserrat();

    function injecterPoliceMontserrat() {
        if (!document.getElementById('font')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css?family=Montserrat:300,400,700,900&display=swap';
            link.id = 'font';
            document.head.appendChild(link);
            console.log('🔤 Police Montserrat injectée.');
        }
    }
})();
