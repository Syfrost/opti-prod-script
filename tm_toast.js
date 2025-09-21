(function () {
    'use strict';

    // Injection du CSS pour les toasts
    const toastCSS = `
        @import url('https://fonts.googleapis.com/css2?family=Varela+Round&display=swap');
        
        :root {
            --tr: all 0.5s ease 0s;
            --ch1: #05478a;
            --ch2: #0070e0;
            --ch3: #0070e040;
            --cs1: #005e38;
            --cs2: #03a65a;
            --cs3: #03a65a40;
            --cw1: #c24914;
            --cw2: #fc8621;
            --cw3: #fc862140;
            --ce1: #851d41;
            --ce2: #db3056;
            --ce3: #db305640;
        }

        @property --bg-help {
            syntax: '<percentage>';
            inherits: false;
            initial-value: -10%;
        }

        @property --bg-success {
            syntax: '<percentage>';
            inherits: false;
            initial-value: 145%;
        }

        @property --bg-warning {
            syntax: '<percentage>';
            inherits: false;
            initial-value: -55%;
        }

        @property --bg-error {
            syntax: '<percentage>';
            inherits: false;
            initial-value: 112%;
        }

        @property --bsc {
            syntax: '<color>';
            inherits: false;
            initial-value: red;
        }

        .sytoast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
            font-family: "Varela Round", sans-serif;
        }

        .sytoast {
            background: linear-gradient(90deg, #1f2333, #22232b);
            color: #f5f5f5;
            padding: 1rem 2rem 1rem 6rem;
            text-align: left;
            border-radius: 0.5rem;
            position: relative;
            font-weight: 300;
            max-width: 350px;
            transition: var(--tr);
            opacity: 0;
            transform: translateX(100%);
            border: 0.15rem solid #fff2;
            box-shadow: inset 0 0 0.5rem 0 #1d1e26, 0 4px 12px rgba(0,0,0,0.3);
            animation: sytoast-slide-in 0.5s ease forwards;
        }

        .sytoast.show {
            opacity: 1;
            transform: translateX(0);
        }

        .sytoast.hide {
            opacity: 0;
            transform: translateX(100%);
            animation: sytoast-slide-out 0.3s ease forwards;
        }

        @keyframes sytoast-slide-in {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes sytoast-slide-out {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }

        .sytoast:before {
            content: "";
            position: absolute;
            width: 6.5rem;
            height: 6.15rem;
            bottom: -0.15rem;
            left: -0.15rem;
            z-index: 0;
            border-radius: 0.35rem;
            background: radial-gradient(circle at 0% 50%, var(--clr), #fff0 5rem), radial-gradient(circle at -50% 50%, var(--bg), #fff0 5rem);
            opacity: 0.5;
        }

        .sytoast:after {
            content: "";
            position: absolute;
            width: 3.5rem;
            height: 3.5rem;
            background: radial-gradient(circle at 50% 50%, var(--clr) 1.25rem, var(--brd) calc(1.25rem + 1px) 100%);
            top: 1.2rem;
            left: 1rem;
            border-radius: 3rem;
            padding-top: 0.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.75rem;
            box-sizing: border-box;
        }

        .sytoast h3 {
            font-size: 1.35rem;
            margin: 0 0 0.5rem 0;
            line-height: 1.35rem;
            font-weight: 300;
            position: relative;
            z-index: 1;
        }

        .sytoast p {
            position: relative;
            font-size: 0.95rem;
            z-index: 1;
            margin: 0;
            line-height: 1.4;
        }

        .sytoast-close {
            position: absolute;
            width: 1.35rem;
            height: 1.35rem;
            text-align: center;
            right: 1rem;
            top: 1rem;
            cursor: pointer;
            border-radius: 100%;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            color: #fff;
            transition: var(--tr);
        }

        .sytoast-close:hover {
            background: var(--clr);
            color: #22232c;
        }

        .sytoast-close:after {
            content: "+";
            transform: rotate(45deg);
        }

        /* Types de toasts */
        .sytoast.help {
            --bg: var(--ch1);
            --clr: var(--ch2);
            --brd: var(--ch3);
        }
        .sytoast.help:after {
            content: "?";
        }

        .sytoast.success {
            --bg: var(--cs1);
            --clr: var(--cs2);
            --brd: var(--cs3);
        }
        .sytoast.success:after {
            content: "L";
            font-size: 1.5rem;
            font-weight: bold;
            padding-bottom: 0.35rem;
            transform: rotateY(180deg) rotate(-38deg);
            text-indent: 0.1rem;
        }

        .sytoast.warning {
            --bg: var(--cw1);
            --clr: var(--cw2);
            --brd: var(--cw3);
        }
        .sytoast.warning:after {
            content: "!";
            font-weight: bold;
        }

        .sytoast.error {
            --bg: var(--ce1);
            --clr: var(--ce2);
            --brd: var(--ce3);
        }
        .sytoast.error:after {
            content: "+";
            font-size: 2.85rem;
            line-height: 1.2rem;
            transform: rotate(45deg);
        }

        .sytoast.info {
            --bg: var(--ch1);
            --clr: var(--ch2);
            --brd: var(--ch3);
        }
        .sytoast.info:after {
            content: "i";
            font-weight: bold;
            font-style: italic;
        }
    `;

    // Injection du CSS
    const style = document.createElement('style');
    style.textContent = toastCSS;
    document.head.appendChild(style);

    // Créer le conteneur de toasts s'il n'existe pas
    function getToastContainer() {
        let container = document.querySelector('.sytoast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'sytoast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    // Fonction principale pour afficher les toasts
    window.sytoast = function(type, message, duration = 5000) {
        const container = getToastContainer();
        
        // Créer l'élément toast
        const toast = document.createElement('div');
        toast.className = `sytoast ${type}`;
        
        // Créer le contenu
        const title = getTitle(type);
        toast.innerHTML = `
            <div class="sytoast-close"></div>
            <h3>${title}</h3>
            <p>${message}</p>
        `;
        
        // Ajouter au conteneur
        container.appendChild(toast);
        
        // Déclencher l'animation d'apparition
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Gestion de la fermeture par clic
        const closeBtn = toast.querySelector('.sytoast-close');
        closeBtn.addEventListener('click', () => {
            removeToast(toast);
        });
        
        // Fermeture automatique
        if (duration > 0) {
            setTimeout(() => {
                removeToast(toast);
            }, duration);
        }
        
        return toast;
    };

    // Fonction pour supprimer un toast
    function removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.classList.add('hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    // Fonction pour obtenir le titre selon le type
    function getTitle(type) {
        const titles = {
            'success': 'Succès',
            'warning': 'Attention',
            'error': 'Erreur',
            'info': 'Information',
            'help': 'Aide'
        };
        return titles[type] || 'Notification';
    }

    // Fonctions de raccourci pour chaque type
    window.sytoastSuccess = function(message, duration) {
        return sytoast('success', message, duration);
    };

    window.sytoastWarning = function(message, duration) {
        return sytoast('warning', message, duration);
    };

    window.sytoastError = function(message, duration) {
        return sytoast('error', message, duration);
    };

    window.sytoastInfo = function(message, duration) {
        return sytoast('info', message, duration);
    };

    window.sytoastHelp = function(message, duration) {
        return sytoast('help', message, duration);
    };

    // Fonction pour nettoyer tous les toasts
    window.sytoastClear = function() {
        const container = document.querySelector('.sytoast-container');
        if (container) {
            container.innerHTML = '';
        }
    };

    console.log('🍞 Système de toasts SyToast chargé !');
    console.log('📖 Utilisation:');
    console.log('  sytoast(type, message, duration)');
    console.log('  Types: success, warning, error, info, help');
    console.log('  Exemple: sytoast("success", "Opération réussie !", 3000)');
    console.log('  Raccourcis: sytoastSuccess(), sytoastWarning(), etc.');

})();
