// ==UserScript==
// @name         Tampermonkey Utils
// @namespace    https://github.com/Syfrost/JustWork-Next-Extension
// @version      1.0.0
// @description  Fonctions utilitaires partagées pour les scripts Tampermonkey
// @author       Cedric G
// ==/UserScript==

// Gestion de la taille des boutons
const UI_SCALE_KEY = 'tampermonkey_ui_scale';

// Récupérer la taille sauvegardée ou utiliser 1.0 par défaut
function getUIScale() {
    const saved = localStorage.getItem(UI_SCALE_KEY);
    return saved ? parseFloat(saved) : 1.0;
}

// Sauvegarder la nouvelle taille
function setUIScale(scale) {
    localStorage.setItem(UI_SCALE_KEY, scale.toString());
    applyUIScale(scale);
}

// Appliquer la taille aux boutons
function applyUIScale(scale) {
    document.documentElement.style.setProperty('--ui-scale', scale);
    console.log(`🎛️ Taille UI appliquée: ${scale}x`);
}

// Menu command pour changer la taille
GM_registerMenuCommand("🎛️ Changer taille UI", () => {
    const currentScale = getUIScale();
    const newScale = prompt(
        `Taille actuelle des boutons: ${currentScale}x\n\n` +
        `Entrez une nouvelle valeur numérique:\n` +
        `• 0.8 = 80% (plus petit)\n` +
        `• 1.0 = 100% (taille normale)\n` +
        `• 1.2 = 120% (plus grand)\n` +
        `• 1.5 = 150% (très grand)`,
        currentScale.toString()
    );
    
    if (newScale !== null) {
        const scale = parseFloat(newScale);
        if (!isNaN(scale) && scale > 0 && scale <= 3) {
            setUIScale(scale);
            alert(`✅ Taille UI changée à ${scale}x\nActualisez la page pour voir tous les changements.`);
        } else {
            alert("❌ Valeur invalide. Utilisez un nombre entre 0.1 et 3.0");
        }
    }
});

// Appliquer la taille sauvegardée au chargement
document.addEventListener('DOMContentLoaded', () => {
    applyUIScale(getUIScale());
});

// Appliquer immédiatement si le DOM est déjà chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyUIScale(getUIScale()));
} else {
    applyUIScale(getUIScale());
}

GM_addStyle(`
    :root {
        --ui-scale: 1.0;
    }

    .button_Sy_DA {
        --color-primary: #644dff;
        --color-dark: #4836bb;
        --color-shadow: #654dff63;
        cursor: pointer;
        width: auto;
        min-width: calc(120px * var(--ui-scale));
        height: calc(30px * var(--ui-scale));
        display: flex;
        align-items: center;
        justify-content: center;
        gap: calc(0.5rem * var(--ui-scale));
        font-size: calc(12px * var(--ui-scale));
        font-weight: 800;
        letter-spacing: calc(1px * var(--ui-scale));
        text-transform: uppercase;
        color: #fff;
        background: var(--color-primary);
        border: calc(2px * var(--ui-scale)) solid var(--color-dark);
        border-radius: calc(0.75rem * var(--ui-scale));
        box-shadow: 0 calc(6px * var(--ui-scale)) 0 var(--color-dark);
        transform: skew(-10deg);
        transition: all 0.1s ease;
        filter: drop-shadow(0 calc(10px * var(--ui-scale)) calc(15px * var(--ui-scale)) var(--color-shadow));
        padding: calc(6px * var(--ui-scale)) calc(16px * var(--ui-scale));
        margin: calc(5px * var(--ui-scale));
    }

    .button_Sy_DA:hover {
        transform: skew(-10deg) translateY(calc(2px * var(--ui-scale)));
        box-shadow: 0 calc(4px * var(--ui-scale)) 0 var(--color-dark);
        filter: drop-shadow(0 calc(8px * var(--ui-scale)) calc(12px * var(--ui-scale)) var(--color-shadow));
    }

    .button_Sy_DA:active {
        letter-spacing: 0px;
        transform: skew(-10deg) translateY(calc(6px * var(--ui-scale)));
        box-shadow: 0 0 0 var(--color-dark);
        filter: drop-shadow(0 calc(2px * var(--ui-scale)) calc(5px * var(--ui-scale)) var(--color-shadow));
    }

    .button_Sy_DA span {
        //transform: skew(10deg) !important;
        display: inline-block;
    }

    .button_Sy_DA svg {
        //transform: skew(10deg) !important;
        display: inline-block;
    }

    .button_Sy_DA i {
        //transform: skew(10deg);
        display: inline-block;
    }

    .collectorpanel {
        display: flex;
        flex-direction: row;
        overflow: visible !important;
        //transform: skew(10deg);
        background-color: rgba(20, 22, 22, 0) !important;
        box-shadow: 0 0 10px hsla(0, 0%, 0%, 0.00) !important;
        border-radius: 0px !important;
        margin-right: calc(10px * var(--ui-scale)) !important;
        padding: calc(10px * var(--ui-scale));
    }

    /* Forcer l'overflow sur le conteneur parent si nécessaire */
    .collectorpanel, .collectorpanel * {
        overflow: visible !important;
    }

    /* Styles pour le drag and drop */
    .draggable-button {
        cursor: grab !important;
    }

    .draggable-button:active {
        cursor: grabbing !important;
    }

    .draggable-button.dragging {
        opacity: 0.6 !important;
        transform: skew(-10deg) scale(calc(1.1 * var(--ui-scale))) !important;
        z-index: 1000 !important;
        box-shadow: 0 calc(8px * var(--ui-scale)) calc(20px * var(--ui-scale)) rgba(0,0,0,0.3) !important;
        filter: brightness(1.1) !important;
    }

    .drop-zone {
        border: calc(2px * var(--ui-scale)) dashed #6f42c1 !important;
        background: rgba(111, 66, 193, 0.1) !important;
        border-radius: calc(0.75rem * var(--ui-scale)) !important;
        margin: calc(2px * var(--ui-scale)) !important;
    }

    .drop-indicator {
        width: calc(4px * var(--ui-scale)) !important;
        height: calc(35px * var(--ui-scale)) !important;
        background: #6f42c1 !important;
        border-radius: calc(2px * var(--ui-scale)) !important;
        margin: 0 calc(3px * var(--ui-scale)) !important;
        transition: all 0.2s ease !important;
        animation: dropPulse 1s infinite ease-in-out !important;
        box-shadow: 0 0 calc(10px * var(--ui-scale)) #6f42c1 !important;
    }

    .ghost-button {
        opacity: 0.4 !important;
        transform: skew(-10deg) scale(calc(0.95 * var(--ui-scale))) !important;
        background: #6f42c1 !important;
        border: calc(2px * var(--ui-scale)) dashed #6f42c1 !important;
        box-shadow: 0 calc(4px * var(--ui-scale)) 0 rgba(111, 66, 193, 0.6) !important;
        filter: drop-shadow(0 calc(5px * var(--ui-scale)) calc(10px * var(--ui-scale)) rgba(111, 66, 193, 0.3)) !important;
        pointer-events: none !important;
        animation: ghostPulse 1s infinite ease-in-out !important;
        margin: calc(5px * var(--ui-scale)) !important;
    }

    @keyframes ghostPulse {
        0%, 100% { 
            opacity: 0.3; 
            transform: skew(-10deg) scale(calc(0.9 * var(--ui-scale))); 
        }
        50% { 
            opacity: 0.6; 
            transform: skew(-10deg) scale(calc(0.95 * var(--ui-scale))); 
        }
    }

    @keyframes dropPulse {
        0%, 100% { opacity: 0.7; transform: scaleY(1); }
        50% { opacity: 1; transform: scaleY(1.1); }
    }

    /* Animation glow pulse pour les indicateurs d'enregistrement */
    @keyframes glowPulse {
        0% {
            opacity: 1;
        }
        50% {
            opacity: 1;
        }
        50.01% {
            opacity: 0;
        }
        100% {
            opacity: 0;
        }
    }

    //.xhr-recording-glow {
    //    animation: glowPulse 2s infinite ease-in-out;
    //}

    .xhr-recording-info {
        font-size: calc(12px * var(--ui-scale));
        color: rgba(185, 34, 34, 1);
        font-weight: bold;
        padding: 0px calc(18px * var(--ui-scale)) 0px calc(10px * var(--ui-scale));
        background: rgba(185, 34, 34, 0.1);
        border-radius: calc(3px * var(--ui-scale));
        box-shadow: calc(-3px * var(--ui-scale)) 0 0 0 rgba(185, 34, 34, 0.3);
        float: right;
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: calc(8px * var(--ui-scale));
    }

    .xhr-indicator-dot {
        width: 10px;
        height: 10px;
        background-color: red;
        border-radius: 50%;
        animation: glowPulse 1s infinite step-end;
    }

        `);

// Fonction globale pour styliser les boutons
window.styleButton = function(button, backgroundColor, iconClass) {
    button.className = 'button_Sy_DA';
    
    // Fonction pour convertir les noms de couleurs en hexadécimal
    function colorNameToHex(color) {
        const colors = {
            'red': '#FF0000',
            'green': '#008000',
            'blue': '#0000FF',
            'orange': '#FFA500',
            'yellow': '#FFFF00',
            'purple': '#800080',
            'pink': '#FFC0CB',
            'brown': '#A52A2A',
            'black': '#000000',
            'white': '#FFFFFF',
            'gray': '#808080',
            'grey': '#808080',
            'cyan': '#00FFFF',
            'magenta': '#FF00FF',
            'lime': '#00FF00',
            'navy': '#000080',
            'teal': '#008080',
            'silver': '#C0C0C0',
            'maroon': '#800000',
            'olive': '#808000'
        };
        
        // Si c'est déjà un code hex, le retourner tel quel
        if (color.startsWith('#')) {
            return color;
        }
        
        // Sinon, chercher dans le dictionnaire des couleurs
        return colors[color.toLowerCase()] || '#808080'; // Gris par défaut si couleur inconnue
    }
    
    // Convertir la couleur en hexadécimal si nécessaire
    const hexColor = colorNameToHex(backgroundColor);
    
    // Fonction pour convertir hex en rgba
    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // Fonction pour assombrir une couleur
    function darkenColor(hex, percent) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const newR = Math.max(0, Math.floor(r * (1 - percent)));
        const newG = Math.max(0, Math.floor(g * (1 - percent)));
        const newB = Math.max(0, Math.floor(b * (1 - percent)));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    
    // Générer les variations de couleur avec la couleur convertie
    const primaryColor = hexColor;
    const darkColor = darkenColor(hexColor, 0.2); // 20% plus sombre
    const shadowColor = hexToRgba(hexColor, 0.4); // 40% d'opacité pour l'ombre
    
    // Ajouter un style CSS spécifique pour ce bouton avec les couleurs personnalisées
    if (button.id) {
        GM_addStyle(`
            #${button.id} {
                --color-primary: ${primaryColor} !important;
                --color-dark: ${darkColor} !important;
                --color-shadow: ${shadowColor} !important;
                background: ${primaryColor} !important;
                border-color: ${darkColor} !important;
                box-shadow: 0 6px 0 ${darkColor} !important;
                filter: drop-shadow(0 10px 15px ${shadowColor}) !important;
            }
            
            #${button.id}:hover {
                background: ${primaryColor} !important;
                border-color: ${darkColor} !important;
                box-shadow: 0 4px 0 ${darkColor} !important;
                filter: drop-shadow(0 8px 12px ${shadowColor}) !important;
            }
            
            #${button.id}:active {
                background: ${primaryColor} !important;
                border-color: ${darkColor} !important;
                box-shadow: 0 0 0 ${darkColor} !important;
                filter: drop-shadow(0 2px 5px ${shadowColor}) !important;
            }
        `);
    }
    
    // Trouver le span à l'intérieur du bouton et ajouter l'icône
    const span = button.querySelector('span');
    if (span) {
        // Créer l'icône séparément
        const icon = document.createElement('i');
        icon.className = `fa ${iconClass}`;
        
        // Insérer l'icône AVANT le span
        button.insertBefore(icon, span);
        button.insertBefore(document.createTextNode(' '), span); // Espace entre icône et texte
    } else {
        // Fallback si pas de span trouvé
        button.innerHTML = `<i class='fa ${iconClass}'></i> ` + button.innerText;
    }
};