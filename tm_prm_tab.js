(function () {
    'use strict';

    const processedRows = new WeakSet();
    const iframeReloadAttempts = new WeakMap();

    // Flags pour éviter la création multiple des boutons
    let pasteButtonCreated = false;
    let triggerButtonCreated = false;
    let injectionButtonCreated = false;

    // Variables pour stocker les données collector
    let collectorData = [];

    function renderIframe(pk, element) {
        const row = element.closest('tr');
        const existingIframe = row.nextElementSibling;

        // Si déjà affichée => on la supprime et on remet le texte à "Afficher ici"
        if (existingIframe && existingIframe.classList.contains('iframe-row')) {
            existingIframe.remove();
            element.innerHTML = 'Afficher ici';
            console.log(`❎ Iframe fermée pour la réparation ${pk}`);
            return;
        }

        // Sinon, on crée et insère l'iframe
        const newRow = document.createElement('tr');
        newRow.classList.add('iframe-row');

        const cell = document.createElement('td');
        cell.colSpan = row.children.length;

        const iframe = document.createElement('iframe');
        iframe.src = `https://prod.cloud-collectorplus.mt.sncf.fr/Prm/Reparation/${pk}.html`;
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = '2px solid #444';
        iframe.style.marginTop = '10px';
        iframe.style.display = 'block';

        cell.appendChild(iframe);
        newRow.appendChild(cell);
        row.parentNode.insertBefore(newRow, row.nextSibling);

        // Mise à jour du texte du lien
        element.innerHTML = 'Cacher';
        console.log(`📂 Iframe affichée pour la réparation ${pk}`);
    }


    function monitorTable() {
        const table = document.getElementById('dataTablePrmFilles');
        if (!table) return;

        const rows = table.querySelectorAll('tr[idreparation]');
        rows.forEach(row => {
            if (processedRows.has(row)) return;

            const pk = row.getAttribute('idreparation');
            const existingLink = row.querySelector('a.openIframeLink');

            if (!existingLink && pk) {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 3) {
                    const targetCell = cells[2];
                    targetCell.classList.add('noRedirect', 'noColvis', 'noExportable', 'noClick');

                    const link = document.createElement('a');
                    link.className = 'dropdown-item openIframeLink';
                    link.setAttribute('pk', pk);
                    link.innerHTML = 'Afficher ici'; // texte initial
                    link.style.cursor = 'pointer';

                    link.addEventListener('click', function (e) {
                        e.preventDefault();
                        renderIframe(pk, this);
                    });


                    targetCell.appendChild(link);
                    console.log(`➕ Lien ajouté pour la réparation ${pk}`);
                }
            }

            processedRows.add(row);
        });

        const toolbar = document.querySelector('#dataTablePrmFilles_wrapper .dt-buttons');
        if (toolbar && !document.getElementById('btnOpenAllIframes')) {
            createOpenAllButton();
        }

        // Conditions pour le bouton injection
        const wrapperExists = document.getElementById('dataTablePrmFilles_wrapper') !== null;
        const prmUraActive = document.querySelector('#PRM_ura.active') !== null;
        const hasCollectorLinks = document.querySelectorAll('#dataTablePrmFilles a.openIframeLink').length > 0;
        const hasFormData = localStorage.getItem('formulaireCopie') !== null;
        const shouldShowInjection = wrapperExists && prmUraActive && hasCollectorLinks && hasFormData;

        // Gestion du bouton injection basée sur les conditions
        if (shouldShowInjection && !injectionButtonCreated) {
            const injectionContainer = getFloatingButtonArea();
            if (injectionContainer) {
                createInjectionButton();
            }
        } else if (!shouldShowInjection && injectionButtonCreated) {
            removeFloatingButton('btnInjectionAllIframes');
            injectionButtonCreated = false;
        }

        const iframes = document.querySelectorAll('tr.iframe-row iframe');

        if (iframes.length > 0) {
            if (!pasteButtonCreated) createPasteAllButton();
            if (!triggerButtonCreated) createTriggerAllButton();
            hideElementsInIframes();
            checkRedirectErrorsInIframes();
            makeErrorAlertsClosableInIframes();
        } else {
            removeFloatingButton('btnPasteAllIframes');
            removeFloatingButton('btnTriggerAllIframes');
            pasteButtonCreated = false;
            triggerButtonCreated = false;
        }
    }


    function createOpenAllButton() {
        const container = document.querySelector('#dataTablePrmFilles_wrapper .dt-buttons');
        if (!container || document.getElementById('btnOpenAllIframes')) return;

        const button = document.createElement('button');
        button.id = 'btnOpenAllIframes';
        button.className = 'btn btn-success btn-border-radius';
        button.innerHTML = '<span>Tout ouvrir</span>';
        button.style.marginLeft = '8px';
        button.title = 'Ouvrir toutes les réparations';

        button.addEventListener('click', () => {
            const links = Array.from(document.querySelectorAll('#dataTablePrmFilles a.openIframeLink'));
            const iframesOpened = document.querySelectorAll('tr.iframe-row').length > 0;

            if (iframesOpened) {
                // Fermer toutes les iframes
                button.innerHTML = 'Fermeture...';
                document.querySelectorAll('tr.iframe-row').forEach(row => row.remove());

                links.forEach(link => {
                    link.innerHTML = 'Afficher ici';
                });

                setTimeout(() => {
                    button.innerHTML = '<span>Tout ouvrir</span>';
                }, 1000);

                console.log('❎ Toutes les iframes ont été fermées');
                return;
            }

            // Ouvrir avec délai progressif
            const total = links.length;
            if (total === 0) {
                button.innerHTML = 'Aucun lien trouvé';
                return;
            }

            let count = 0;
            links.forEach((link, index) => {
                setTimeout(() => {
                    link.click();
                    count++;
                    button.innerHTML = `Ouverture ${count}/${total}`;

                    if (count === total) {
                        setTimeout(() => {
                            button.innerHTML = '✅ Tout ouvert';
                        }, 500);
                    }
                }, index * 250);
            });

            console.log(`▶️ Ouverture de ${total} iframes`);
        });

        container.appendChild(button);
        console.log('✅ Bouton "Tout ouvrir" ajouté');
    }

    function createPasteAllButton() {
        console.log("🔍 createPasteAllButton appelée");
        const container = getFloatingButtonArea();
        if (!container) {
            console.log("❌ Container non trouvé");
            return;
        }

        // Vérification plus stricte pour éviter les doublons
        if (document.getElementById("btnPasteAllIframes")) {
            console.log("⚠️ Bouton btnPasteAllIframes existe déjà");
            return;
        }

        console.log("🔍 Container trouvé, création du bouton...");
        const button = document.createElement("button");
        button.id = "btnPasteAllIframes";
        const spanPaste = document.createElement("span");
        spanPaste.innerText = "Coller le CRI";
        button.appendChild(spanPaste);
        button.onclick = pasteIntoIframes;

        // Vérification que window.styleButton existe
        if (typeof window.styleButton === 'function') {
            window.styleButton(button, "#17a2b8", "fa-paste");
        } else {
            console.error("❌ window.styleButton non disponible dans tm_prm_tab - createPasteAllButton");
            // Style de base en fallback
            button.style.backgroundColor = "#17a2b8";
            button.style.color = "white";
            button.style.padding = "5px 10px";
            button.style.border = "none";
            button.style.borderRadius = "5px";
            button.style.cursor = "pointer";
            button.style.margin = "5px";
        }

        container.prepend(button);
        pasteButtonCreated = true;
        console.log("✅ Bouton 'Coller Iframe' ajouté");
    }

    function createTriggerAllButton() {
        console.log("🔍 createTriggerAllButton appelée");
        const container = getFloatingButtonArea();
        if (!container) {
            console.log("❌ Container non trouvé");
            return;
        }

        // Vérification plus stricte pour éviter les doublons
        if (document.getElementById("btnTriggerAllIframes")) {
            console.log("⚠️ Bouton btnTriggerAllIframes existe déjà");
            return;
        }

        console.log("🔍 Container trouvé, création du bouton...");
        const button = document.createElement("button");
        button.id = "btnTriggerAllIframes";
        const spanTrigger = document.createElement("span");
        spanTrigger.innerText = "Etape suivante";
        button.appendChild(spanTrigger);
        button.onclick = triggerButtonsInIframes;

        // Vérification que window.styleButton existe
        if (typeof window.styleButton === 'function') {
            window.styleButton(button, "#007bff", "fa-bolt");
        } else {
            console.error("❌ window.styleButton non disponible dans tm_prm_tab - createTriggerAllButton");
            // Style de base en fallback
            button.style.backgroundColor = "#007bff";
            button.style.color = "white";
            button.style.padding = "5px 10px";
            button.style.border = "none";
            button.style.borderRadius = "5px";
            button.style.cursor = "pointer";
            button.style.margin = "5px";
        }

        container.prepend(button);
        triggerButtonCreated = true;
        console.log("✅ Bouton 'Traiter Iframe' ajouté");
    }

    function createInjectionButton() {
        console.log("🔍 createInjectionButton appelée");
        const container = getFloatingButtonArea();
        if (!container) {
            console.log("❌ Container non trouvé");
            return;
        }

        // Vérification plus stricte pour éviter les doublons
        if (document.getElementById("btnInjectionAllIframes")) {
            console.log("⚠️ Bouton btnInjectionAllIframes existe déjà");
            return;
        }

        console.log("🔍 Container trouvé, création du bouton...");
        const button = document.createElement("button");
        button.id = "btnInjectionAllIframes";
        const spanInjection = document.createElement("span");
        spanInjection.innerText = "Injection Cri";
        button.appendChild(spanInjection);
        button.onclick = injectDataToAllLinks;

        // Vérification que window.styleButton existe
        if (typeof window.styleButton === 'function') {
            window.styleButton(button, "#28a745", "fa-syringe");
        } else {
            console.error("❌ window.styleButton non disponible dans tm_prm_tab - createInjectionButton");
            // Style de base en fallback
            button.style.backgroundColor = "#28a745";
            button.style.color = "white";
            button.style.padding = "5px 10px";
            button.style.border = "none";
            button.style.borderRadius = "5px";
            button.style.cursor = "pointer";
            button.style.margin = "5px";
        }

        container.prepend(button);
        injectionButtonCreated = true;
        console.log("✅ Bouton 'Injection' ajouté");
    }

    function removeFloatingButton(id) {
        const btn = document.getElementById(id);
        if (btn) {
            btn.remove();
            console.log(`❌ Bouton '${id}' retiré`);
        }
    }

    function getFloatingButtonArea() {
        let container = document.querySelector('div[style*="position: fixed;"][style*="bottom: 10px;"][style*="right: 10px;"]');

        // Si le container n'existe pas, on le crée
        if (!container) {
            container = document.createElement('div');
            container.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                display: flex;
                flex-direction: column;
                gap: 5px;
                z-index: 9999;
            `;
            document.body.appendChild(container);
            console.log("🏗️ Container floating buttons créé");
        }

        return container;
    }

    function collectCollectorLinks() {
        const links = Array.from(document.querySelectorAll('#dataTablePrmFilles a.openIframeLink'));
        const collectorLinks = [];

        links.forEach(link => {
            const pk = link.getAttribute('pk');
            if (pk) {
                const collectorUrl = `https://prod.cloud-collectorplus.mt.sncf.fr/Prm/Reparation/${pk}.html`;
                collectorLinks.push({
                    pk: pk,
                    url: collectorUrl,
                    numeroReparation: pk
                });
            }
        });

        console.log(`📋 ${collectorLinks.length} liens collector récupérés`);
        return collectorLinks;
    }

    function fetchCollectorData(collectorUrl) {
        return new Promise((resolve, reject) => {
            fetch(collectorUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    const idSymboleInput = doc.getElementById('idSymbole');
                    const idUserInput = doc.getElementById('idUser');

                    resolve({
                        idSymbole: idSymboleInput ? idSymboleInput.value.trim() : '',
                        idUser: idUserInput ? idUserInput.value.trim() : ''
                    });
                })
                .catch(error => {
                    console.error('❌ Erreur lors de la récupération des données collector:', error);
                    reject(error);
                });
        });
    }

    async function injectDataToAllLinks() {
        const formData = JSON.parse(localStorage.getItem('formulaireCopie'));
        if (!formData) {
            if (typeof sytoast === 'function') {
                sytoast('warning', "Aucune donnée à injecter. Veuillez copier un formulaire d'abord.");
            } else {
                alert("Aucune donnée à injecter. Veuillez copier un formulaire d'abord.");
            }
            return;
        }

        const button = document.getElementById("btnInjectionAllIframes");
        const span = button.querySelector('span');
        const originalText = span.innerText;

        // Récupérer tous les liens collector
        const collectorLinks = collectCollectorLinks();

        if (collectorLinks.length === 0) {
            span.innerText = "Aucun lien";
            button.style.backgroundColor = "#dc3545";
            setTimeout(() => {
                span.innerText = originalText;
                button.style.backgroundColor = "#28a745";
            }, 2000);
            return;
        }

        span.innerText = `Traitement 0/${collectorLinks.length}`;
        button.style.backgroundColor = "#ffc107";

        let completed = 0;
        let errors = 0;

        for (const link of collectorLinks) {
            try {
                // Récupérer les données collector (idSymbole, idUser)
                const collectorInfo = await fetchCollectorData(link.url);

                // Préparer le payload avec les données du localStorage
                const payload = new URLSearchParams({
                    S_num_cri: formData.S_num_cri || '',
                    t_materiel_idt_materiel: formData.t_materiel_idt_materiel || '',
                    t_site_intervention_idt_site_intervention: formData.t_site_intervention_idt_site_intervention || '',
                    fk_cause_depose: formData.fk_cause_depose || '',
                    D_date_eve: formData.D_date_eve || '',
                    S_num_rame: formData.S_num_rame || '',
                    S_num_veh: formData.S_num_veh || '',
                    I_kilometrage: formData.I_kilometrage || '',
                    S_commentaire: formData.S_commentaire || '',
                    form_id: 'Saisie_CRI',
                    transition_id: '268',
                    idSymbole: collectorInfo.idSymbole,
                    idUser: collectorInfo.idUser,
                    current_repair_id: link.numeroReparation
                }).toString();

                // Faire la requête POST
                const response = await fetch('https://prod.cloud-collectorplus.mt.sncf.fr/Prm/Reparation/processTransitionForm', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: payload
                });

                if (response.status === 200) {
                    completed++;
                    console.log(`✅ Injection réussie pour ${link.numeroReparation}`);
                } else {
                    errors++;
                    console.error(`❌ Erreur HTTP ${response.status} pour ${link.numeroReparation}`);
                }

            } catch (error) {
                errors++;
                console.error(`❌ Erreur lors de l'injection pour ${link.numeroReparation}:`, error);
            }

            // Mettre à jour le texte du bouton
            span.innerText = `Traitement ${completed + errors}/${collectorLinks.length}`;
        }

        // Résultat final
        if (errors === 0) {
            span.innerText = `✅ ${completed}/${collectorLinks.length}`;
            button.style.backgroundColor = "#28a745";
        } else {
            span.innerText = `⚠️ ${completed}/${collectorLinks.length} (${errors} erreurs)`;
            button.style.backgroundColor = "#dc3545";
        }

        // Remettre le texte original après 3 secondes
        setTimeout(() => {
            span.innerText = originalText;
            button.style.backgroundColor = "#28a745";
        }, 3000);
    }

    function pasteIntoIframes() {
        const formData = JSON.parse(localStorage.getItem('formulaireCopie'));
        if (!formData) {
            sytoast('warning', "Aucune donnée à coller. Veuillez copier un formulaire d'abord.");
            return;
        }

        const iframes = document.querySelectorAll('tr.iframe-row iframe');

        iframes.forEach(iframe => {
            try {
                const doc = iframe.contentWindow.document;
                const form = doc.querySelector('#panel-body-groupe_saisie_cri');
                if (!form) return;

                form.querySelectorAll('input, select, textarea').forEach((el) => {
                    if (el.tagName === 'SELECT') {
                        el.value = formData[el.name];

                        const selectBtn = doc.querySelector(`button[data-id="${el.id}"]`);
                        const selectedOpt = el.querySelector(`option[value="${formData[el.name]}"]`);
                        const text = selectedOpt?.textContent?.trim() || '';
                        const filter = selectBtn?.querySelector('.filter-option');
                        if (filter) {
                            filter.textContent = text;
                        }
                    } else {
                        el.value = formData[el.name] || '';
                    }
                });

                console.log("✅ Formulaire collé dans une iframe");
            } catch (err) {
                console.error("⚠️ Erreur d'accès à une iframe :", err);
            }
        });
    }

    function triggerButtonsInIframes() {
        const iframes = document.querySelectorAll('tr.iframe-row iframe');

        // Liste des priorités : le premier trouvé est cliqué
        const priorityList = [
            'Saisie REX',
            'Saisie du plan de contrôle',
            'SAISIE ETIQUETTE ROUGE (CT10)',
            'SAISIE AUTRE',
            // Ajoute d'autres si nécessaire
        ];

        iframes.forEach(iframe => {
            try {
                const doc = iframe.contentWindow.document;
                let clicked = false;

                // Cas spécial : si "Saisie REX" et "Saisie du plan de contrôle" sont tous deux présents
                const saisieRexButton = doc.querySelector(`button[collector-form-name="Saisie REX"]`);
                const saisieControlButton = doc.querySelector(`button[collector-form-name="Saisie du plan de contrôle"]`);

                if (saisieRexButton && saisieControlButton) {
                    // Vérifier le contenu du span pour distinguer "Contrôle de sortie" de "Modifier Plan de Contrôle"
                    const controlButtonSpan = saisieControlButton.querySelector('span');
                    const controlButtonText = controlButtonSpan ? controlButtonSpan.textContent.trim() : '';

                    // Si c'est "Contrôle de sortie", on le privilégie
                    if (controlButtonText.includes('Contrôle de sortie')) {
                        saisieControlButton.click();
                        console.log(`🟢 Clic prioritaire sur 'Contrôle de sortie' dans une iframe`);
                        clicked = true;
                    } else {
                        // Sinon (ex: "Modifier Plan de Contrôle"), on privilégie "Saisie REX"
                        saisieRexButton.click();
                        console.log(`🟢 Clic prioritaire sur 'Saisie REX' (pas de contrôle de sortie) dans une iframe`);
                        clicked = true;
                    }
                } else {
                    // Logique normale de priorité
                    for (const label of priorityList) {
                        const button = doc.querySelector(`button[collector-form-name="${label}"]`);
                        if (button) {
                            button.click();
                            console.log(`🟢 Clic sur '${label}' dans une iframe`);
                            clicked = true;
                            break; // Stoppe à la première priorité trouvée
                        }
                    }
                }

                // Si aucun bouton prioritaire n'a été trouvé, chercher "Renvoi vers magasinier" en dernière priorité
                if (!clicked) {
                    const buttons = doc.querySelectorAll('button.btn.btn-primary.button-next_etat');
                    for (const button of buttons) {
                        const span = button.querySelector('span');
                        if (span && span.textContent.trim() === 'Renvoi vers magasinier') {
                            button.click();
                            console.log(`🟢 Clic sur 'Renvoi vers magasinier' (dernière priorité) dans une iframe`);
                            clicked = true;
                            break;
                        }
                    }
                }

                if (!clicked) {
                    console.log("⚠️ Aucun bouton prioritaire trouvé dans une iframe");
                }

            } catch (err) {
                console.error("❌ Impossible d'interagir avec une iframe :", err);
            }
        });
    }

    setInterval(monitorTable, 1000);

    function hideElementsInIframes() {
        const iframes = document.querySelectorAll('tr.iframe-row iframe');

        iframes.forEach(iframe => {
            try {
                const doc = iframe.contentWindow.document;

                const panel = doc.getElementById('repair_details_panel');
                if (panel) {
                    panel.style.display = 'none';
                    console.log("🙈 'repair_details_panel' masqué dans une iframe");
                }

            } catch (err) {
                console.error("❌ Impossible d'accéder à une iframe :", err);
            }
        });
    }
    function checkRedirectErrorsInIframes() {
        const iframes = document.querySelectorAll('tr.iframe-row iframe');

        iframes.forEach(iframe => {
            try {
                const doc = iframe.contentWindow.document;
                const bodyText = doc.body?.innerText || '';
                const titleText = doc.title || '';

                const isRedirectError = bodyText.includes("vous a redirigé à de trop nombreuses reprises")
                || titleText.toLowerCase().includes("redirigé");

                if (isRedirectError) {
                    const currentAttempts = iframeReloadAttempts.get(iframe) || 0;

                    if (currentAttempts >= 10) {
                        console.error("❌ Trop de tentatives de reload pour cette iframe. Abandon après 10 essais.");
                        return;
                    }

                    console.warn(`🔁 Redirection détectée (tentative ${currentAttempts + 1}/10). Reload dans 2s...`);

                    setTimeout(() => {
                        iframe.contentWindow.location.reload();
                        iframeReloadAttempts.set(iframe, currentAttempts + 1);
                        console.log("🔄 Iframe rechargée.");
                    }, 2000);
                }

            } catch (err) {
                console.error("❌ Erreur d'accès à une iframe :", err);
            }
        });
    }
    function makeErrorAlertsClosableInIframes() {
        const iframes = document.querySelectorAll('tr.iframe-row iframe');

        iframes.forEach(iframe => {
            try {
                const doc = iframe.contentWindow.document;
                const alert = doc.querySelector('.alert.alert-danger');

                if (
                    alert &&
                    alert.innerText.includes("Pas de transition applicable") &&
                    !alert.dataset.clickable
                ) {
                    alert.style.cursor = 'pointer';
                    alert.title = "Cliquer ici pour fermer cette iframe";
                    alert.dataset.clickable = "true"; // pour ne pas re-lier l'event plusieurs fois

                    alert.addEventListener('click', () => {
                        const tr = iframe.closest('tr.iframe-row');
                        if (tr) {
                            tr.remove();
                            console.log("❎ Iframe fermée après clic sur l'alerte 'Pas de transition applicable'");
                        }
                    });

                    console.log("🟠 Alerte détectée et rendue cliquable dans une iframe");
                }

            } catch (err) {
                console.error("❌ Erreur d'accès à une iframe pour rendre l'alerte cliquable :", err);
            }
        });
    }

    // Observer pour surveiller la disparition du wrapper et les changements d'onglet
    function initWrapperObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // Vérifier les nœuds supprimés
                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Si le wrapper lui-même est supprimé
                        if (node.id === 'dataTablePrmFilles_wrapper') {
                            console.log('🗑️ dataTablePrmFilles_wrapper supprimé - Retrait du bouton injection');
                            removeFloatingButton('btnInjectionAllIframes');
                            injectionButtonCreated = false;
                        }
                        // Ou si un parent contenant le wrapper est supprimé
                        else if (node.querySelector && node.querySelector('#dataTablePrmFilles_wrapper')) {
                            console.log('🗑️ Parent contenant dataTablePrmFilles_wrapper supprimé - Retrait du bouton injection');
                            removeFloatingButton('btnInjectionAllIframes');
                            injectionButtonCreated = false;
                        }
                    }
                });

                // Vérifier les changements d'attributs (changement d'onglet actif)
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.id === 'PRM_ura') {
                        const isActive = target.classList.contains('active');
                        if (!isActive && injectionButtonCreated) {
                            console.log('🔄 Onglet PRM_ura désactivé - Retrait du bouton injection');
                            removeFloatingButton('btnInjectionAllIframes');
                            injectionButtonCreated = false;
                        }
                    }
                }
            });

            // Double vérification : si les conditions ne sont plus remplies
            const wrapperExists = document.getElementById('dataTablePrmFilles_wrapper') !== null;
            const prmUraActive = document.querySelector('#PRM_ura.active') !== null;

            if ((!wrapperExists || !prmUraActive) && injectionButtonCreated) {
                console.log('🗑️ Conditions non remplies - Retrait du bouton injection');
                removeFloatingButton('btnInjectionAllIframes');
                injectionButtonCreated = false;
            }
        });

        // Observer les changements sur tout le document
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });

        console.log('👁️ Observer pour dataTablePrmFilles_wrapper et PRM_ura initialisé');
    }

    // Initialiser l'observer après un court délai
    setTimeout(initWrapperObserver, 1000);

})();
