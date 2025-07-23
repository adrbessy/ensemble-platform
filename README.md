🌟 Chill and Go
Le moyen simple de sortir, se détendre et rencontrer des gens

Chill and Go est une plateforme web conçue pour faciliter la création de liens autour d’activités partagées.
✨ Fonctionnalités principales

Page d'accueil
    Page affichant la liste des activités


Navbar déconnectée
    [Chill and Go] ----------- [Connexion] [Inscription]
    Au clic sur Chill and Go, on arrive à la page affichant la liste des activités.
Navbar connectée
    [Chill and Go] ----------- [Créer une activité] [Contacts] [Groupes] [messagerie] [notifications] [photo de profil]
    Au clic sur la photo de profil, on arrive sur la page de compte/paramètres

Page d'Inscription
    Champs obligatoires :
    -> une photo de profil,
    -> son prénom, 
    -> son nom,
    -> son email,
    -> un mot de passe (avec confirmation),
    -> son sexe (homme ou femme ou autre), 
    -> sa date de naissance.
    
Page de connexion
    -> son email,
    -> un mot de passe.
    possibilité pour l'utilisateur de regénérer un mot de passe en lui envoyant un mail si il l'a oublié.

Page affichant la liste des activités :
    -> Affichage des filtres actifs (par défaut "Tous les types d'activités", "tout âges", "< 10km", "parité") + bouton 3 petits points qui mène à la page des filtres.
    -> Affichage des événements (avec des places restantes) par date (avec possibilité de cliquer sur la date pour masquer les événements prévus à cette date, si on reclique sur la date, ça les refait apparaître).
    -> Chaque événement a :
        -> Une heure de début (heure de fin facultative)
        -> Lieu (nom du lieu + ville)
        -> Tag (en gros et gras)
        -> Description (si dépasse la taille seulement le début de la description)
        -> Photos des personnes actuellement inscrites à l'activité
        -> nombre d'inscrits / nombre possibles d'inscrits au maximum (comment est-ce qu'on pourrait afficher l'information du nombre minimal d'inscrits pour que l'activité ait lieu, information qui est facultative).
        -> bouton "participer" (absent si on n'est pas connecté)
        -> Lors du clic sur l'activité, on va dans la page de l'activité (on ne peut pas si on n'est pas connecté)
    Quand non connecté, message "Pas encore inscrit ? Créez un compte pour participer aux activités." et gros bouton "S'inscrire".
        -> Bouton switch "Mes événements" (quand connecté)
        -> Bouton switch "Mes contacts y participent" (quand connecté)

Page de filtres : 
    -> Tags : Mettre les 10 les plus utilisés puis mettre une barre de recherche pour en ajouter un autre. Sélection et désélection possible. Bouton "Tous les types d'activités".
    -> Date
    -> Ville(s) ou Distance par rapport à sa localisation (<2km, <5km, <10km, <25km);
    -> Répartition du genre dans les activités : Aucune contrainte, Parité femmes/hommes, Femmes uniquement, Hommes uniquement. Les personnes non binaires comptent hommes ou femmes.
    -> Ages : Age minimum, âge maximum;
    -> Masquer les activités pour lesquels des personnes que l'on a bloqué participent (sauf si les personnes bloqués se rajoute ensuite à l'activité à laquelle on a d'abord participé).

Page de création d'une activité :
    Titre : "Je crée une activité"
    -> Tag tag d'activité (jeux de société, bar, randonnée, ...) : Mettre les 10 les plus utilisés puis mettre une barre de recherche pour en sélectionner un autre. Sélection d'un unique tag d'activité obligatoire.
    -> description : (quelle limite de texte ?), possibilité de mettre des émoticônes. Obligatoire
    -> Date : jour (Impossibilité de sélectionner un jour antérieur), heure de début. Obligatoires. Heure de fin facultative.
    -> Nom du lieu, et adresse exacte du lieu (base de données de google map ?). Obligatoire.
    -> Nombre de participants : nombre minimum (facultatif), nombre maximum obligatoire (8 par défaut)
    -> Age minimum et age maximum (facultatif)
    -> Genres : Parité (par défaut) (50% hommes 50% femmes, si nombre de participants impairs alors différence de +1 ou -1 femme) ou mixte (partité non obligatoire) ou uniquement femmes, ou uniquement hommes.
    -> Visibilité de l'activité : les personnes bloquées ne verront pas l'activité. Choix entre :
        -> Public (par défaut)
        -> Privé - réservé à mes amis
        -> privé - réservé à un groupe d'amis. -> Si sélectionné, un nouveau champ s'affiche demandant de sélectioner le groupe désiré.
        -> privé - sélection d'amis. -> Si sélectionné, un nouveau champ s'affiche demandant de sélectioner les amis désirés.
    Préciser que la visibilité pourra être modifié ultérieurement si besoin !

Page d'une activité :
    -> Date de l'activité et toutes les autres infos + entiéreté de la description + carte google map indiquant le lieu avec bouton Itinéraire google map.
    -> Bouton pour rejoindre ou se désinscrire de l'activité.
    Le créateur de l'activité peut modifier des champs, dans ce cas cela enverrait une notification aux personnes déjà inscrites pour les prévenir du ou des changements.
    Possibilité pour l'organisateur de supprimer son activité si personne d'autres n'est encore inscrit.
    Si au moins une autre personne est déjà inscrite, si le créateur se désinscrit, cela avertira la deuxième personne qui s'est inscrit à l'activité qu'elle est devenue l'organisateur de l'activité.
    -> Chat de groupe pour les personnes participant à l'activité.

Page historique de messagerie :
    -> Champ de recherche pour sélectionner les conversations dans lesquels participent un de nos contacts.
    -> On y retrouve les chats de nos activités, ainsi que les chats d'autres groupes rejoins ou créés, ainsi que les chats 1 to 1 avec un de nos contacts.
    Quand on clique sur un chat, on va sur la page du chat.

Page du chat :
    -> dans les chats de groupe, on a la possibilité de cliquer sur la photo d'une personne, on peut alors soit faire une demande de contact, soit retirer cette personne de notre liste de contact, soit bloquer la personne, soit envoyer un message privé si cette personne fait partie de nos contacts.
    -> dans le chat individuel, retirer cette personne de notre liste de contact, on a aussi la possibilité de bloquer la personne.

Page de groupes :
    -> Bouton "+ Créer un groupe"
    -> Liste de nos groupes avec titre, image du groupe, photos des personnes, nombre de personnes.
    -> Quand on clique sur un groupe on accède à la page d'un groupe.

Page d'un groupe :
    -> Ajout de contacts si on est administrative du groupe.

Page de création d'un groupe :
    -> Nom du groupe
    -> description (facultative)
    -> Ajout de contacts dans le groupe.
    -> possibilité de nommer des co-administrateurs.

Page de compte/paramètres
    -> Possibilité de changer nos informations
    -> options de notifications : 
        -> Envoyer un mail ou une notification lorsque un contact participe à une activité.
        -> Prévenir si une personne nous a écrit, si une personne s'est ajouté à notre activité créée (ou si elle s'en est retirée).
        -> Prévenir si une personne que l'on a bloqué s'est ajouté à une activité à laquelle on participe.
        -> prévenir si une personne nous a fait une demande de contact.
    -> Choix de fond d'écran (8 possibilités par défaut), possibilité d'en charger 2 autres.
    -> Statistiques : 
        -> Historique des activités auxquelles on a participé (nombre d'activités indiqués) : on clique sur un bouton pour accéder à la liste.
        -> Nombre d'activités que l'on a créé.
        -> Nombre de contacts.
    -> Déconnexion
    -> Désincription possible


Il y aura aussi une application mobile.

Liste des tags : atelier/échange de langues, jeux (inclut jeux de société, jeux extérieur, quizz), jeux de société, jeux extérieur, quizz, café/bar/détente/discussions, randonnée/balade, plage, musée, restaurant (inclut brunch), brunch, musique(inclut concert), concert, sport (inclut badminton, squash, football, tennis, pickle ball, volley, danse, ...), danse (inclut bachata, rock, salsa, ...), apéro, pique-nique, cinéma, spectacle (inclut théâtre, stand-up), théâtre, stand-up.

-----
Peut-être plus tard :

Voir les personnes qui ont déjà fait des activités ensemble.

Envies spontanées
    Exprimez une envie (ex. : "jouer au loup") sans créer immédiatement un événement.
    → L’algorithme vous connecte à d’autres personnes partageant cette même envie.
    → Vous pouvez ensuite co-organiser ensemble (choisir une date, un lieu, etc.).

Cadre de confiance
    Nombre minimum de participants requis pour valider une activité
    Mixité encouragée pour plus de confort et de diversité
    Est-ce que les autres inscrits à l'activité se connaissent déjà ? Ont-ils déjà fait des activités ensemble ?

    Messagerie contextuelle
        Un chat est automatiquement créé pour chaque activité
        Le chat reste accessible après l’événement pour garder contact, échanger à nouveau ou réorganiser

    Historique de lien social
    Lors de l'inscription à une activité, vous pouvez voir :

        Les participants à l'activité avec une indication sur les personnes que vous connaissez déjà ou avec qui vous avez déjà fait une ou des activités.

    Respect de l’intimité

        Pas un site de rencontres : priorité à la connexion via des activités vécues