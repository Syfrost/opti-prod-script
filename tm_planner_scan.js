// -------------------- MODULE LISTE --------------------

// Liste configurable par l'utilisateur
const DEFAULT_LIST = "non trouvé, ATTENTE RT, ATTENTE REBUT, ATTENTE COMPOSANT, EN ATTENTE SOUS-TRAITANCE,CONTROLE QUALITE, ATTENTE SUPPORT";

function getList() {
    return GM_getValue("autoListFinish", DEFAULT_LIST).split(",").map(s => s.trim());
}

function editList() {
    const current = GM_getValue("autoListFinish", DEFAULT_LIST);
    const next = prompt("Entre ta liste d'éléments séparés par des virgules:", current);
    if (next !== null) GM_setValue("autoListFinish", next);
}

function showList() {
    alert("Liste actuelle:\n" + getList().join("\n"));
}

// Fonctions pour l'auto-checker
function isAutoCheckerEnabled() {
    return GM_getValue("autoCheckerEnabled", true);
}

function toggleAutoChecker() {
    const current = isAutoCheckerEnabled();
    GM_setValue("autoCheckerEnabled", !current);
    alert(`Auto-checker ${!current ? 'activé' : 'désactivé'}`);
}

// Menus Tampermonkey pour la liste
GM_registerMenuCommand("✏️ Modifier la liste", editList);
GM_registerMenuCommand("📋 Afficher la liste", showList);
GM_registerMenuCommand("🔄 Activer/Désactiver Auto-checker", toggleAutoChecker);

// -------------------- SCRIPT PRINCIPAL --------------------


(function () {
    'use strict';

    const processedSections = new WeakMap();
    const donneesTaches = []; // tableau global pour stocker les infos extraites
    let liensEnCours = 0;
    let postEnCours = 0;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            scanContainers();
            ajouterBoutonScanManuel();
        });
    } else {
        scanContainers();
        ajouterBoutonScanManuel();
    }

    function ajouterBoutonScanManuel() {
        if (!location.href.includes("planner.cloud.microsoft")) {
            return; // Ne pas afficher le bouton si on n'est pas sur Microsoft Planner
        }

        const bouton = document.createElement('button');
        bouton.textContent = 'SCAN';
        bouton.style.position = 'fixed';
        bouton.style.width = '65px';
        bouton.style.height = '65px';
        bouton.style.bottom = '20px';
        bouton.style.right = '20px';
        bouton.style.zIndex = '9999';
        bouton.style.padding = '10px 15px';
        bouton.style.background = 'rgba(0, 0, 0, 0.1)';
        bouton.style.color = '#fff';
        bouton.style.border = '2px solid rgb(255, 128, 0)';
        bouton.style.borderRadius = '50px';
        bouton.style.fontSize = '14px';
        bouton.style.cursor = 'pointer';
        bouton.style.boxShadow = '0 2px 8px rgba(255, 104, 0, 0.8)';
        bouton.style.backdropFilter = 'blur(5px)';
        bouton.style.display = 'flex';
        bouton.style.justifyContent = 'center';
        bouton.style.alignItems = 'center';

        bouton.addEventListener('click', scanContainers);

        document.body.appendChild(bouton);
    }


    function scanContainers() {
        console.log('[Planner Script] Démarrage avec scan des conteneurs...');
        const containers = document.querySelectorAll('div.ms-FocusZone');
        console.log(containers);
        containers.forEach(container => {
            const taskCard = container.querySelector('div.taskCard');
            if (!taskCard) {
                console.log("return");
                return;
            }

            const lienElement = container.querySelector('a.referencePreviewDescription');
            let lien = lienElement?.getAttribute('href') || lienElement?.getAttribute('title');
            console.log(lien);

            if (lien && !lien.endsWith('.html')) lien += '.html';
            if (!lien || !lien.includes('.html')) return;

            const numeroReparation = lien.match(/\/(\d+)(?:\.html)?$/)?.[1] || 'inconnu';
            ajouterOverlayTaskCard(taskCard, numeroReparation, 'Chargement...');
            testerLienHttp(lien, taskCard);
        });
    }

    function ajouterOverlayTaskCard(taskCard, numeroReparation, texteLabel = 'Chargement...') {
        const thumbnail = taskCard.querySelector('.thumbnail.placeholder');
        if (!thumbnail) return;

        // Supprime s’il existe déjà (évite doublons)
        const existing = thumbnail.querySelector('.autoelement');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.className = 'autoelement';
        container.id = `idreparation-status-${numeroReparation}`;
        container.style.position = 'absolute';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.zIndex = '10';
        container.style.borderRadius = '6px';
        container.style.padding = '5px 10px';
        container.style.fontSize = '12px';
        container.style.maxWidth = '160px';
        container.style.textAlign = 'center';

        container.innerHTML = `
        <div class="autoelement__img__container" style="text-align:center;">
            <img src="https://prod.cloud-collectorplus.mt.sncf.fr/assets/images/sprite_src/pictos/Collector_accueil.png"
                 alt="Icon"
                 class="autoelement__img__source"
                 style="width: 24px; height: 24px;">
        </div>
        <span class="autoelement__text text-numeroreparation" style="display:block; font-weight:bold; margin-top:4px;">
            ${numeroReparation}
        </span>
        <span class="autoelement__text text-collector" style="display:block; color: #333;">
            ${texteLabel}
        </span>
    `;

        thumbnail.style.position = 'relative';
        thumbnail.appendChild(container);

        // Ajuste dynamiquement la hauteur du thumbnail
        setTimeout(() => {
            const hauteurOverlay = container.scrollHeight;
            const hauteurMin = Math.max(hauteurOverlay + 20, 100);
            thumbnail.style.minHeight = hauteurMin + 'px';
        }, 0);
    }

    // Fonction qui vérifie si on doit cliquer sur le bouton "complete"
    function tryClickComplete(taskCard, numeroReparation, texteLabel) {
        // Vérifie si l'auto-checker est activé
        if (!isAutoCheckerEnabled()) {
            //console.log(`[Planner Script] Auto-checker désactivé pour la tâche ${numeroReparation}`);
            return;
        }

        // Vérifie si on est sur la page personnelle
        if (!location.href.includes("planner.cloud.microsoft/webui/mytasks/assignedtome/")) {
            return; // Ne pas autocheck si pas sur la page personnelle
        }

        const completeButton = taskCard.querySelector('.completeButtonWithAnimation');
        if (!completeButton) return;

        if (completeButton.getAttribute('aria-checked') === 'true') {
            console.log(`[Planner Script] Bouton déjà coché pour la tâche ${numeroReparation}, pas de clic`);
            return;
        }

        // Cas 1 : PV terminé
        if (texteLabel === 'Terminé / PV') {
            setTimeout(() => {
                completeButton.click();
                console.log(`[Planner Script] Bouton complete cliqué (PV) pour la tâche ${numeroReparation}`);
            }, 500);
            return;
        }

        // Cas 2 : correspond à un élément de la liste
        const autoListFinish = getList();
        const match = autoListFinish.some(item => texteLabel.includes(item));
        if (match) {
            setTimeout(() => {
                completeButton.click();
                console.log(`[Planner Script] Bouton complete cliqué (liste match: "${texteLabel}") pour la tâche ${numeroReparation}`);
            }, 500);
        }
    }


    function testerLienHttp(lien, taskCard, tentative = 1) {
        liensEnCours++;

        const maxTentatives = 5;
        const numeroReparation = lien.match(/\/(\d+)\.html$/)?.[1] || 'inconnu';

        GM_xmlhttpRequest({
            method: 'GET',
            url: lien,
            onload: function (response) {
                const overlay = taskCard.querySelector(`#idreparation-status-${numeroReparation}`);

                if (response.status === 200) {
                    const html = response.responseText;
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    const label = doc.querySelector('span.label-success');

                    const symbole = doc.getElementById('idSymbole')?.value?.trim() || 'non trouvé';
                    const idUser = doc.getElementById('idUser')?.value?.trim() || 'non trouvé';

                    let texteLabel = label?.textContent?.trim() || 'non trouvé';
                    tryClickComplete(taskCard, numeroReparation, texteLabel);
                    if (texteLabel === 'non trouvé' && response.finalUrl?.includes('/Prm/AfficherPv/')) {
                        texteLabel = 'Terminé / PV';
                    }
                    else {
                        // ✅ Récupérer le nombre d'historique (si existe)
                        let nombreHistorique = 0;
                        const h3List = Array.from(doc.querySelectorAll('h3'));

                        for (const h3 of h3List) {
                            const spanParent = h3.querySelector('span');
                            if (spanParent && spanParent.textContent.includes('Historique')) {
                                const badge = spanParent.querySelector('.badge.badge-onglet');
                                if (badge) {
                                    const val = parseInt(badge.textContent.trim());
                                    if (!isNaN(val)) {
                                        nombreHistorique = val;
                                    }
                                }
                                break; // dès qu'on a trouvé un bloc historique, on sort
                            }
                        }

                        const leftSection = taskCard.querySelector('.leftSection');
                        if (leftSection) {
                            // Vérifie si un élément historique a déjà été injecté
                            if (!leftSection.querySelector('.badge-historique')) {
                                const historiqueDiv = document.createElement('div');
                                historiqueDiv.className = 'badge-historique';
                                historiqueDiv.textContent = `Historique : ${nombreHistorique}`;
                                historiqueDiv.style.marginLeft = 'auto';
                                historiqueDiv.style.padding = '2px 6px';
                                historiqueDiv.style.background = 'rgba(0,0,0,0.3)';
                                historiqueDiv.style.color = '#fff';
                                historiqueDiv.style.fontSize = '11px';
                                historiqueDiv.style.borderRadius = '4px';
                                historiqueDiv.style.alignSelf = 'center';

                                leftSection.appendChild(historiqueDiv);
                            }
                        }

                        if (nombreHistorique > 0 && idUser !== 'non trouvé') {
                            const urlHistorique = `https://prod.cloud-collectorplus.mt.sncf.fr/Prm/Reparation/ongletHistorique/${numeroReparation}?idUser=${idUser}&current_repair_id=${numeroReparation}`;

                            GM_xmlhttpRequest({
                                method: 'GET',
                                url: urlHistorique,
                                onload: function (res) {
                                    const parser = new DOMParser();
                                    const docHistorique = parser.parseFromString(res.responseText, 'text/html');
                                    const lignes = Array.from(docHistorique.querySelectorAll('#dataTablesHistoriqueReparation tbody tr'));

                                    const donnees = lignes.map(tr => {
                                        const tds = tr.querySelectorAll('td');
                                        return {
                                            numeroSerie: tds[2]?.textContent.trim(),
                                            numeroOf: tds[3]?.textContent.trim(),
                                            typeOf: tds[4]?.textContent.trim(),
                                            dateDebut: tds[6]?.textContent.trim(),
                                            etat: tds[7]?.textContent.trim(),
                                            consistance: tds[8]?.textContent.trim(),
                                        };
                                    });

                                    const badge = leftSection.querySelector('.badge-historique');
                                    if (badge) {
                                        const overlay = document.createElement('div');
                                        overlay.className = 'overlay-historique';
                                        overlay.style.position = 'absolute';
                                        overlay.style.top = '50%';
                                        overlay.style.left = '50%';
                                        overlay.style.transform = 'translate(-50%, -50%)';
                                        overlay.style.background = 'rgba(0,0,0,0.85)';
                                        overlay.style.color = '#fff';
                                        overlay.style.padding = '10px';
                                        overlay.style.borderRadius = '6px';
                                        overlay.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5)';
                                        overlay.style.fontSize = '11px';
                                        overlay.style.zIndex = '99999';
                                        overlay.style.display = 'none';
                                        //overlay.style.maxWidth = '900px';
                                        overlay.style.overflowX = 'auto';

                                        const table = document.createElement('table');
                                        table.style.borderCollapse = 'separate';
                                        table.style.width = '100%';
                                        table.style.borderSpacing = '7px';
                                        table.querySelectorAll('td, th').forEach(cell => {
                                            cell.style.padding = '4px 7px';
                                        });
                                        table.innerHTML = `<thead><tr><th>N° Série</th><th>OF</th><th>Type</th><th>Date Début</th><th>État</th><th>Consistance</th></tr></thead><tbody>${donnees.map(d => `<tr><td>${d.numeroSerie}</td><td>${d.numeroOf}</td><td>${d.typeOf}</td><td>${d.dateDebut}</td><td>${d.etat}</td><td>${d.consistance}</td></tr>`).join('')}</tbody>`;

                                        overlay.appendChild(table);
                                        document.body.appendChild(overlay);

                                        badge.addEventListener('mouseenter', () => overlay.style.display = 'block');
                                        badge.addEventListener('mouseleave', () => overlay.style.display = 'none');
                                    }
                                }
                            });
                        }
                    }

                    const modificateur = extraireValeurParLibelle(doc, 'Dernière modif par :');
                    const dateModif    = extraireValeurParLibelle(doc, 'Date dernière modif :');
                    const infoAgent    = extraireValeurParLibelle(doc, 'Info Agent :');

                    const index = donneesTaches.findIndex(t => t.numeroReparation === numeroReparation);
                    const nouvelleTache = {
                        lien,
                        numeroReparation,
                        label: texteLabel,
                        idSymbole: symbole,
                        idUser: idUser,
                        modificateur,
                        dateModif,
                        infoAgent
                    };

                    if (index !== -1) {
                        donneesTaches[index] = nouvelleTache;
                    } else {
                        donneesTaches.push(nouvelleTache);
                    }

                    if (overlay) {
                        overlay.querySelector('.text-collector').textContent = texteLabel;
                        overlay.querySelector('.text-numeroreparation').textContent = numeroReparation;
                        overlay.classList.remove('http-error');
                    }

                    const topBar = taskCard.querySelector('.topBar');
                    if (topBar) {
                        let infoBox = topBar.querySelector('.collector-infos');
                        if (!infoBox) {
                            infoBox = document.createElement('div');
                            infoBox.className = 'collector-infos';
                            infoBox.style.marginBottom = '15px';
                            infoBox.style.background = 'rgba(0,0,0,0.5)';
                            infoBox.style.border = '1px solid #f97731';
                            infoBox.style.borderRadius = '4px';
                            infoBox.style.padding = '4px 6px';
                            infoBox.style.fontSize = '11px';
                            infoBox.style.lineHeight = '1.4';
                            infoBox.style.color = 'rgb(204,204,204)';
                            infoBox.style.fontFamily = "'Montserrat', sans-serif";
                            infoBox.style.fontWeight = '400';

                            // 🟠 Insérer AVANT le premier enfant de .topBar
                            topBar.insertBefore(infoBox, topBar.firstChild);
                        } else {
                            infoBox.innerHTML = '';
                        }

                        const addInfo = (label, val) => {
                            const span = document.createElement('span');
                            span.style.display = 'block';
                            span.innerHTML = `<strong>${label}</strong> ${val}`;
                            infoBox.appendChild(span);
                        };

                        if (texteLabel === 'Terminé / PV') {
                            addInfo('Terminé', '');
                            //addInfo('Date Expédition :', dateExpe);
                        } else {
                            addInfo('Modifié par :', modificateur);
                            addInfo('Date modif :', dateModif);
                            addInfo('Info Agent :', infoAgent);
                        }

                        masquerPlanProduction();
                    }


                    liensEnCours = Math.max(0, liensEnCours - 1);

                } else {
                    if (tentative < maxTentatives) {
                        setTimeout(() => testerLienHttp(lien, taskCard, tentative + 1), 2000);
                    } else {
                        if (overlay) {
                            overlay.querySelector('.text-collector').textContent = `Erreur ${response.status}`;
                            overlay.classList.add('http-co-error');
                        }
                        liensEnCours = Math.max(0, liensEnCours - 1);
                    }
                }
            },
            onerror: function () {
                if (tentative < maxTentatives) {
                    setTimeout(() => testerLienHttp(lien, taskCard, tentative + 1), 2000);
                } else {
                    const overlay = taskCard.querySelector(`#idreparation-status-${numeroReparation}`);
                    if (overlay) {
                        overlay.querySelector('.text-collector').textContent = `Erreur réseau`;
                        overlay.classList.add('http-error');
                    }
                    liensEnCours = Math.max(0, liensEnCours - 1);
                }
            }
        });
    }

    function masquerPlanProduction() {
        const plans = document.querySelectorAll('div.planName');

        for (const plan of plans) {
            const texte = plan.textContent.trim();
            if (texte.includes('Production ')) {
                plan.style.display = 'none';
            }
        }
    }

    function extraireValeurParLibelle(doc, libelle) {
        const spans = [...doc.querySelectorAll('span')];
        for (const span of spans) {
            if (span.textContent.trim() === libelle) {
                const parentDiv = span.closest('div');
                const container = parentDiv?.parentElement;
                if (container) {
                    const infos = container.querySelectorAll('div');
                    if (infos.length >= 2) {
                        const valeur = infos[1]?.textContent?.trim();
                        if (valeur) return valeur;
                    }
                }
            }
        }
        return '✖️';
    }
})();

