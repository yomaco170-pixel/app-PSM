/**
 * Fixtures = jeux de données d'emails réels (ou réalistes) pour tester le parser.
 * Chaque cas a un "expected" = ce que le parser DEVRAIT extraire.
 *
 * Ajoute ici tous tes emails qui foirent actuellement, et on valide qu'ils passent.
 */

export const EMAIL_FIXTURES = [
  // ======================================================================
  // CAS 1 : FORMULAIRE SOLOCAL / PAGES JAUNES (encodage UTF-8 cassé)
  // ======================================================================
  {
    id: 'solocal-classique',
    description: 'Formulaire Solocal avec encodage UTF-8 cassé (Ã©, Ã , etc.)',
    from: 'mailer@multiscreensite.com',
    subject: 'Vous avez reçu un contact depuis votre site internet',
    body: `ci-joint contact

bonne journÃ©e,

De : mailer@multiscreensite.com [mailto:mailer@multiscreensite.com] De la
part de Votre site Solocal
EnvoyÃ© : jeudi 16 avril 2026 11:17
Ã : contact@psm-portails.fr
Objet : Vous avez reÃ§u un contact depuis votre site internet

Avis de rÃ©ponse au formulaire

Vous avez reÃ§u le formulaire suivant Soumission du formulaire sur le site
Contact page de votre site Web - https://www.psm-portails.fr.
Nom* : MARQUER
E-mail* : chihuahuadm@yahoo.fr
TÃ©lÃ©phone* : 0630859280
Message* : Bonjour,
Nous souhaitons clÃ´turer notre maison, en changeant l'existant, par quelques
choses de trÃ¨s sÃ©curisant.
Nous recherchons un interlocuteur rapide, efficace et avec un budget
abordable et cohÃ©rent.
Cordialement.`,
    expected: {
      last_name: 'MARQUER',
      email: 'chihuahuadm@yahoo.fr',
      phone: '0630859280',
      type: 'Clôture',
      notesContains: ['clôturer', 'sécurisant']
    }
  },

  // ======================================================================
  // CAS 2 : FORMULAIRE SITE WEB PSM (format avec prénom + nom)
  // ======================================================================
  {
    id: 'site-web-psm-prenom-nom',
    description: 'Formulaire site web PSM avec prénom et nom',
    from: 'noreply@psm-portails.fr',
    subject: 'Nouvelle demande de devis',
    body: `Bonjour,

Une nouvelle demande a été soumise depuis le formulaire de contact :

Nom* : Luc BOULÉ
E-mail* : luc.boule@wanadoo.fr
Téléphone : 06 89 67 43 26
Message : Je souhaite remplacer mon ancien portail coulissant par un modèle motorisé
de 4m de large. Merci de me recontacter pour un devis.

Cordialement,
L'équipe du site`,
    expected: {
      first_name: 'Luc',
      last_name: 'BOULÉ',
      email: 'luc.boule@wanadoo.fr',
      phone: '0689674326',
      type: 'Portail coulissant',
      notesContains: ['remplacer', 'motorisé']
    }
  },

  // ======================================================================
  // CAS 3 : EMAIL LIBRE (client qui écrit directement, PAS de formulaire)
  // ======================================================================
  {
    id: 'email-libre-client',
    description: 'Email rédigé à la main par le client (cas le plus courant mais mal géré)',
    from: 'Jean Dupont <jean.dupont@gmail.com>',
    subject: 'Demande de devis portail battant',
    body: `Bonjour Monsieur,

Je me permets de vous contacter suite à la recommandation de mon voisin qui
a fait poser un portail chez vous l'an dernier.

Je souhaiterais faire installer un portail battant motorisé chez moi, de
3m50 de large environ, en aluminium gris anthracite.

Mon adresse : 45 rue des Lilas, 44300 Nantes.
Vous pouvez me joindre au 06 12 34 56 78 de préférence le soir après 18h.

Dans l'attente de votre retour,
Cordialement,

Jean Dupont`,
    expected: {
      first_name: 'Jean',
      last_name: 'Dupont',
      email: 'jean.dupont@gmail.com',
      phone: '0612345678',
      address: 'Nantes',   // au moins la ville doit être extraite
      type: 'Portail battant',
      civility: 'M.'
    }
  },

  // ======================================================================
  // CAS 4 : EMAIL AVEC SIGNATURE PRO (entreprise)
  // ======================================================================
  {
    id: 'email-signature-pro',
    description: 'Email avec signature entreprise (société + téléphone dans la signature)',
    from: 'marie.martin@entreprise-martin.fr',
    subject: 'Devis clôture pour notre siège',
    body: `Bonjour,

Notre entreprise souhaite faire installer une clôture rigide
autour de notre parking (environ 80m linéaires).

Pouvez-vous nous faire parvenir un devis ?

Cordialement,

Marie MARTIN
Directrice administrative
Entreprise Martin SARL
12 avenue de la République
44000 Nantes
Tél : 02 40 12 34 56
Port : 06 98 76 54 32
marie.martin@entreprise-martin.fr`,
    expected: {
      first_name: 'Marie',
      last_name: 'MARTIN',
      email: 'marie.martin@entreprise-martin.fr',
      phone: '0698765432',  // on prend le portable en priorité
      company: 'Entreprise Martin',
      type: 'Clôture',
      civility: 'Mme'
    }
  },

  // ======================================================================
  // CAS 5 : EMAIL TRÈS COURT (minimal)
  // ======================================================================
  {
    id: 'email-court',
    description: 'Email très court, 2 lignes max',
    from: 'pierre@orange.fr',
    subject: 'Portillon',
    body: `Bonjour, je voudrais un devis pour un portillon. Merci. 06 11 22 33 44`,
    expected: {
      email: 'pierre@orange.fr',
      phone: '0611223344',
      type: 'Portillon'
    }
  },

  // ======================================================================
  // CAS 6 : FORMULAIRE AVEC VARIATIONS (tel au lieu de téléphone, mail au lieu d'e-mail)
  // ======================================================================
  {
    id: 'formulaire-variations',
    description: 'Formulaire avec variations de libellés (Tél, Mail, sans astérisque)',
    from: 'formulaire@autresite.com',
    subject: 'Nouveau contact',
    body: `Nom : Sophie LEROY
Prénom : Sophie
Mail : sophie.leroy@free.fr
Tél : +33 7 88 99 00 11
Sujet : Motorisation portail existant
Adresse : 8 impasse des Roses, 44100 Nantes`,
    expected: {
      first_name: 'Sophie',
      last_name: 'LEROY',
      email: 'sophie.leroy@free.fr',
      phone: '0788990011',
      type: 'Motorisation'
    }
  },

  // ======================================================================
  // CAS 7 : EMAIL DE RÉPARATION URGENTE
  // ======================================================================
  {
    id: 'reparation-urgente',
    description: 'Demande de réparation avec urgence',
    from: 'Patricia Simon <p.simon@sfr.fr>',
    subject: 'URGENT - Portail cassé',
    body: `Bonjour,

Mon portail ne s'ouvre plus depuis ce matin, la motorisation ne fonctionne plus.
C'est vraiment urgent, je ne peux plus sortir ma voiture.

Pouvez-vous intervenir rapidement ? Je suis au 06.55.44.33.22.

Merci beaucoup
Patricia SIMON`,
    expected: {
      first_name: 'Patricia',
      last_name: 'SIMON',
      email: 'p.simon@sfr.fr',
      phone: '0655443322',
      type: 'Réparation',
      civility: 'Mme'
    }
  },

  // ======================================================================
  // CAS 8 : EMAIL TRANSFÉRÉ / FORWARD
  // ======================================================================
  {
    id: 'email-forward',
    description: 'Email transféré avec ---------- Forwarded message ----------',
    from: 'commercial.pinoit.psm@gmail.com',
    subject: 'Fwd: Demande renseignement',
    body: `---------- Forwarded message ----------
From: Bernard DUBOIS <bdubois@laposte.net>
Date: lun. 15 avr. 2026 à 10:30
Subject: Demande renseignement
To: <contact@psm-portails.fr>

Bonjour,

Je souhaite faire poser un portail coulissant motorisé de 5m
devant chez moi. Je suis au 06 44 55 66 77.

Bien cordialement,
Bernard DUBOIS`,
    expected: {
      first_name: 'Bernard',
      last_name: 'DUBOIS',
      email: 'bdubois@laposte.net',
      phone: '0644556677',
      type: 'Portail coulissant'
    }
  },

  // ======================================================================
  // CAS 9 : COUPLE (M. et Mme)
  // ======================================================================
  {
    id: 'couple-m-et-mme',
    description: 'Email signé par un couple (civilité M. et Mme)',
    from: 'famille.petit@gmail.com',
    subject: 'Projet clôture + portail',
    body: `Bonjour,

Mon épouse et moi-même avons un projet de clôture autour de notre terrain
(environ 60m) + un portail battant à l'entrée.

Merci de nous rappeler au 06 77 88 99 00.

Monsieur et Madame PETIT
Nantes`,
    expected: {
      last_name: 'PETIT',
      email: 'famille.petit@gmail.com',
      phone: '0677889900',
      civility: 'M. et Mme'
    }
  },

  // ======================================================================
  // CAS 10 : BRUIT (emails à IGNORER - pas des leads)
  // ======================================================================
  {
    id: 'spam-newsletter',
    description: 'Newsletter / spam (ne devrait PAS créer de lead valide)',
    from: 'newsletter@promo-bricolage.com',
    subject: 'Profitez de -20% sur tous nos portails !',
    body: `Ne manquez pas notre mega promo ! -20% sur tous les portails.
Cliquez ici pour en profiter : www.promo-bricolage.com`,
    expected: {
      isLikelyNotALead: true  // flag spécial : le parser doit signaler que c'est probablement pas un lead
    }
  }
]

// Score minimum attendu sur l'ensemble des cas (sauf le cas 10 = spam)
export const MIN_SUCCESS_RATE = 0.85   // 85% des champs clés doivent être correctement extraits
