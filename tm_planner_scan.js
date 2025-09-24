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
    let totalTaches = 0;
    let tachesTraitees = 0;
    let boutonScan = null;

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

        // Supprimer l'ancien bouton s'il existe
        const ancienBouton = document.getElementById('scan-button');
        if (ancienBouton) ancienBouton.remove();

        const bouton = document.createElement('div');
        bouton.id = 'scan-button';
        bouton.style.position = 'fixed';
        bouton.style.width = '65px';
        bouton.style.height = '65px';
        bouton.style.bottom = '20px';
        bouton.style.right = '20px';
        bouton.style.zIndex = '9999';
        bouton.style.background = 'rgba(0, 0, 0, 0.65)';
        bouton.style.border = '2px solid rgb(255, 128, 0)';
        bouton.style.borderRadius = '50px';
        bouton.style.cursor = 'pointer';
        bouton.style.boxShadow = '0 2px 8px rgba(255, 104, 0, 0.8)';
        bouton.style.backdropFilter = 'blur(5px)';
        bouton.style.display = 'flex';
        bouton.style.justifyContent = 'center';
        bouton.style.alignItems = 'center';
        bouton.style.flexDirection = 'column';

        // SVG pour la barre de progression circulaire
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.top = '2px';
        svg.style.left = '2px';
        svg.style.width = '61px';
        svg.style.height = '61px';
        svg.style.transform = 'rotate(-90deg)';
        svg.style.pointerEvents = 'none';

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '30.5');
        circle.setAttribute('cy', '30.5');
        circle.setAttribute('r', '28');
        circle.setAttribute('stroke', 'rgba(255, 128, 0, 0.8)');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke-dasharray', '175.929'); // 2 * PI * 28
        circle.setAttribute('stroke-dashoffset', '175.929');
        circle.setAttribute('stroke-linecap', 'round');
        circle.style.transition = 'stroke-dashoffset 0.3s ease';
        circle.id = 'progress-circle';

        svg.appendChild(circle);
        bouton.appendChild(svg);

        // Contenu du bouton
        const contenu = document.createElement('div');
        contenu.style.position = 'relative';
        contenu.style.zIndex = '10';
        contenu.style.display = 'flex';
        contenu.style.flexDirection = 'column';
        contenu.style.alignItems = 'center';
        contenu.style.justifyContent = 'center';
        contenu.style.pointerEvents = 'none';

        const texte = document.createElement('span');
        texte.textContent = 'SCAN';
        texte.style.color = '#fff';
        texte.style.fontSize = '10px';
        texte.style.fontWeight = 'bold';
        texte.style.marginBottom = '2px';
        texte.id = 'scan-text';

        const compteur = document.createElement('span');
        compteur.textContent = '0/0';
        compteur.style.color = '#fff';
        compteur.style.fontSize = '8px';
        compteur.style.opacity = '0.8';
        compteur.style.display = 'none'; // Masqué par défaut à l'initialisation
        compteur.id = 'scan-counter';

        contenu.appendChild(texte);
        contenu.appendChild(compteur);
        bouton.appendChild(contenu);

        bouton.addEventListener('click', scanContainers);

        document.body.appendChild(bouton);
        boutonScan = bouton;
    }

    function mettreAJourProgression() {
        const circle = document.getElementById('progress-circle');
        const compteur = document.getElementById('scan-counter');
        const texte = document.getElementById('scan-text');
        
        if (circle && compteur) {
            const pourcentage = totalTaches > 0 ? tachesTraitees / totalTaches : 0;
            const circonference = 175.929; // 2 * PI * 28
            const offset = circonference - (pourcentage * circonference);
            
            circle.setAttribute('stroke-dashoffset', offset.toString());
            
            // Afficher ou masquer le compteur selon l'état du scan
            if (totalTaches === 0) {
                compteur.style.display = 'none';
            } else {
                compteur.style.display = 'block';
                compteur.textContent = `${tachesTraitees}/${totalTaches}`;
            }
            
            if (tachesTraitees === totalTaches && totalTaches > 0) {
                texte.textContent = 'OK';
                setTimeout(() => {
                    texte.textContent = 'SCAN';
                    circle.setAttribute('stroke-dashoffset', '175.929');
                    compteur.style.display = 'none';
                }, 2000);
            }
        }
    }

    function reinitialiserProgression() {
        tachesTraitees = 0;
        totalTaches = 0;
        mettreAJourProgression();
    }


    function scanContainers() {
        console.log('[Planner Script] Démarrage avec scan des conteneurs...');
        
        // Réinitialiser la progression
        reinitialiserProgression();
        
        const containers = document.querySelectorAll('div.ms-FocusZone');
        console.log(containers);
        
        // Compter le nombre total de tâches à traiter
        let tachesValides = 0;
        containers.forEach(container => {
            const taskCard = container.querySelector('div.taskCard');
            if (!taskCard) return;

            const lienElement = container.querySelector('a.referencePreviewDescription');
            let lien = lienElement?.getAttribute('href') || lienElement?.getAttribute('title');

            if (lien && !lien.endsWith('.html')) lien += '.html';
            if (lien && lien.includes('.html')) {
                tachesValides++;
            }
        });
        
        totalTaches = tachesValides;
        mettreAJourProgression();
        
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
            ajouterOverlayTaskCard(taskCard, numeroReparation, 'Chargement...', lien);
            testerLienHttp(lien, taskCard);
        });
    }

    function ajouterOverlayTaskCard(taskCard, numeroReparation, texteLabel = 'Chargement...', lienCollector = null) {
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
        container.style.cursor = 'pointer'; // Ajoute le curseur pointer
        container.style.transition = 'transform 0.2s ease'; // Ajoute une transition

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

        // Stocke le lien dans un attribut data pour pouvoir le récupérer plus tard
        if (lienCollector) {
            container.setAttribute('data-collector-link', lienCollector);
            console.log('[Debug] Lien collector stocké:', lienCollector);
        } else {
            console.warn('[Debug] Aucun lien collector fourni');
        }

        // Ajoute les événements de clic et hover
        container.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const link = container.getAttribute('data-collector-link');
            console.log('[Debug] Clic sur autoelement, lien:', link);
            if (link) {
                window.open(link, '_blank');
            } else {
                console.warn('[Debug] Aucun lien trouvé dans data-collector-link');
            }
        });

        container.addEventListener('mouseenter', () => {
            container.style.transform = 'translate(-50%, -50%) scale(1.05)';
        });

        container.addEventListener('mouseleave', () => {
            container.style.transform = 'translate(-50%, -50%) scale(1)';
        });

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
                        // Mettre à jour le lien collector
                        overlay.setAttribute('data-collector-link', lien);
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
                    tachesTraitees++;
                    mettreAJourProgression();

                } else {
                    if (tentative < maxTentatives) {
                        setTimeout(() => testerLienHttp(lien, taskCard, tentative + 1), 2000);
                    } else {
                        if (overlay) {
                            overlay.querySelector('.text-collector').textContent = `Erreur ${response.status}`;
                            overlay.classList.add('http-co-error');
                        }
                        liensEnCours = Math.max(0, liensEnCours - 1);
                        tachesTraitees++;
                        mettreAJourProgression();
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
                    tachesTraitees++;
                    mettreAJourProgression();
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

    /*function extraireValeurDivParTexte(doc, libelle) {
        const divs = Array.from(doc.querySelectorAll('div'));
        for (let i = 0; i < divs.length; i++) {
            if (divs[i].textContent.trim() === libelle) {
                const suivant = divs[i + 1];
                if (suivant) {
                    return suivant.textContent.trim();
                }
            }
        }
        return 'non trouvé';
    }*/



})();

