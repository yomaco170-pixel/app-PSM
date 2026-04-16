// Test du parser avec l'email Solocal réel

const testEmail = `ci-joint contact

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
Cordialement.`;

function parseEmailContent(emailText) {
  const result = {
    civility: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    company: '',
    address: '',
    type: '',
    notes: emailText
  };
  
  // Nettoyer le texte des caractères encodés
  let cleanText = emailText
    .replace(/Ã©/g, 'é')
    .replace(/Ã /g, 'à')
    .replace(/Ã¨/g, 'è')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã®/g, 'î')
    .replace(/Ã¢/g, 'â')
    .replace(/Ã¹/g, 'ù')
    .replace(/Ã§/g, 'ç');
  
  // ===== EXTRACTION FORMULAIRE SOLOCAL/SITE WEB =====
  
  // 1. Extraire le NOM
  const nameMatch = cleanText.match(/Nom\*?\s*[:：]\s*([^\n\r]+)/i);
  if (nameMatch && nameMatch[1]) {
    const fullName = nameMatch[1].trim();
    console.log('🔍 Nom trouvé:', fullName);
    
    if (fullName !== 'Contact PSM' && 
        !fullName.match(/^(Contact|Prospect|Client|PSM|Solocal|Page)/i) &&
        fullName.length > 2) {
      
      const nameParts = fullName.split(/\s+/);
      if (nameParts.length >= 2) {
        result.first_name = nameParts.slice(0, -1).join(' ');
        result.last_name = nameParts[nameParts.length - 1];
      } else {
        result.last_name = fullName;
      }
      console.log('✅ Nom extrait:', result.first_name, result.last_name);
    }
  }
  
  // 2. Extraire l'EMAIL
  const emailMatch = cleanText.match(/E-?mail\*?\s*[:：]\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch && emailMatch[1]) {
    const email = emailMatch[1].trim();
    console.log('🔍 Email trouvé:', email);
    
    if (!email.includes('multiscreensite.com') && 
        !email.includes('psm-portails.fr') && 
        !email.startsWith('mailer@') &&
        !email.startsWith('contact@')) {
      result.email = email;
      console.log('✅ Email extrait:', result.email);
    }
  }
  
  // 3. Extraire le TÉLÉPHONE
  const phoneMatch = cleanText.match(/Téléphone\*?\s*[:：]\s*([0-9\s\.\-\+]+)/i);
  if (phoneMatch && phoneMatch[1]) {
    const phone = phoneMatch[1].trim()
      .replace(/[\s.-]/g, '')
      .replace(/^\+33/, '0');
    
    if (phone.match(/^0[1-9]\d{8}$/)) {
      result.phone = phone;
      console.log('✅ Téléphone extrait:', result.phone);
    }
  }
  
  // 4. Extraire le MESSAGE
  const messageMatch = cleanText.match(/Message\*?\s*[:：]\s*([\s\S]+?)(?=\n\n|Répondre au client|Cordialement|--|$)/i);
  if (messageMatch && messageMatch[1]) {
    let message = messageMatch[1].trim();
    
    message = message
      .split('\n')
      .filter(line => {
        const lower = line.toLowerCase().trim();
        return lower.length > 3 &&
               !lower.includes('répondre au client') &&
               !lower.includes('cet e-mail a été vérifié') &&
               !lower.includes('www.avast.com');
      })
      .join('\n')
      .trim();
    
    if (message.length > 10) {
      result.notes = message;
      console.log('✅ Message extrait:', message.substring(0, 50) + '...');
    }
  }
  
  // 5. Détecter le TYPE DE PROJET
  const projectTypes = [
    { keywords: ['portail coulissant', 'coulissant'], value: 'Portail coulissant' },
    { keywords: ['portail battant', 'battant', 'battans'], value: 'Portail battant' },
    { keywords: ['portillon'], value: 'Portillon' },
    { keywords: ['clôture', 'cloture', 'clôturer'], value: 'Clôture' },
    { keywords: ['motorisation', 'moteur', 'motoriser'], value: 'Motorisation' },
    { keywords: ['réparation', 'reparation', 'réparer', 'reparer'], value: 'Réparation' }
  ];
  
  const lowerText = cleanText.toLowerCase();
  for (const type of projectTypes) {
    if (type.keywords.some(kw => lowerText.includes(kw))) {
      result.type = type.value;
      console.log('✅ Type de projet détecté:', result.type);
      break;
    }
  }
  
  return result;
}

// TEST
console.log('\n🧪 TEST DU PARSER AVEC EMAIL SOLOCAL RÉEL\n');
console.log('='.repeat(60));
const parsed = parseEmailContent(testEmail);
console.log('='.repeat(60));

console.log('\n📋 RÉSULTAT FINAL :\n');
console.log('Nom        :', parsed.last_name || '❌ NON EXTRAIT');
console.log('Prénom     :', parsed.first_name || '-');
console.log('Email      :', parsed.email || '❌ NON EXTRAIT');
console.log('Téléphone  :', parsed.phone || '❌ NON EXTRAIT');
console.log('Type       :', parsed.type || '❌ NON EXTRAIT');
console.log('Message    :', parsed.notes ? parsed.notes.substring(0, 100) + '...' : '❌ NON EXTRAIT');

console.log('\n');
console.log('✅ ATTENDU : MARQUER / chihuahuadm@yahoo.fr / 0630859280 / Clôture');
