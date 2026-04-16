// ==================== KARL - ASSISTANT PERSONNEL ====================
// Application CRM complète - Gestion Clients, Dossiers, Devis, Photos

const API_URL = '';

// ==================== STATE ====================
const state = {
  user: null,
  token: null,
  currentView: 'login',
  deals: [],
  clients: [],
  quotes: [],
  tasks: [],
  photos: [],
  currentDeal: null,
  currentClient: null,
  currentQuote: null,
  notifications: [],
  notificationUnreadCount: 0,
  notificationsVisible: false,
};

// ==================== UTILITIES ====================

// Helpers de protection anti-bugs
const safeArray = (arr) => Array.isArray(arr) ? arr : [];
const safeObject = (obj) => obj && typeof obj === 'object' ? obj : {};
const safeString = (str) => str && typeof str === 'string' ? str : '';
const safeNumber = (num) => typeof num === 'number' && !isNaN(num) ? num : 0;

const storage = {
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  get: (key) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  remove: (key) => localStorage.removeItem(key),
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatCurrency = (amount) => {
  if (!amount) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
};

// Horloge temps réel - Met à jour la date et l'heure dans le header
function updateHeaderClock() {
  const now = new Date();
  
  // Date complète en français
  const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const dateStr = now.toLocaleDateString('fr-FR', dateOptions);
  
  // Capitaliser première lettre (lundi → Lundi)
  const dateCapitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  
  // Heure au format HH:MM:SS
  const timeStr = now.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  // Mise à jour desktop
  const dateEl = document.getElementById('header-date');
  const timeEl = document.getElementById('header-time');
  if (dateEl) dateEl.textContent = dateCapitalized;
  if (timeEl) timeEl.textContent = timeStr;
  
  // Mise à jour mobile
  const dateElMobile = document.getElementById('header-date-mobile');
  const timeElMobile = document.getElementById('header-time-mobile');
  if (dateElMobile) dateElMobile.textContent = dateCapitalized;
  if (timeElMobile) timeElMobile.textContent = timeStr;
}

// Lancer l'horloge au chargement et rafraîchir chaque seconde
setInterval(updateHeaderClock, 1000);
updateHeaderClock();

// Format relatif pour timestamps - Convertit une date DB en texte relatif français
function formatRelativeTime(dbTimestamp) {
  if (!dbTimestamp) return '—';
  
  // Forcer UTC si pas de 'Z' à la fin
  const timestamp = dbTimestamp.endsWith('Z') ? dbTimestamp : dbTimestamp + 'Z';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Gestion des dates invalides
  if (isNaN(date.getTime())) return '—';
  
  // Date future (pour RDV à venir)
  if (diffMs < 0) {
    const absDiffMs = Math.abs(diffMs);
    const absDiffMinutes = Math.floor(absDiffMs / 60000);
    const absDiffHours = Math.floor(absDiffMinutes / 60);
    const absDiffDays = Math.floor(absDiffHours / 24);
    
    if (absDiffMinutes < 60) return `Dans ${absDiffMinutes} minute${absDiffMinutes > 1 ? 's' : ''}`;
    if (absDiffHours < 24) return `Dans ${absDiffHours} heure${absDiffHours > 1 ? 's' : ''}`;
    if (absDiffDays < 7) return `Dans ${absDiffDays} jour${absDiffDays > 1 ? 's' : ''}`;
    
    // Format complet pour dates futures lointaines
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // Dates passées
  if (diffSeconds < 10) return "À l'instant";
  if (diffSeconds < 60) return `Il y a ${diffSeconds} seconde${diffSeconds > 1 ? 's' : ''}`;
  if (diffMinutes < 60) return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  
  // Aujourd'hui
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `Aujourd'hui à ${timeStr}`;
  }
  
  // Hier
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth()) {
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `Hier à ${timeStr}`;
  }
  
  // Cette semaine (moins de 7 jours)
  if (diffDays < 7) {
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} à ${timeStr}`;
  }
  
  // Plus ancien : format complet
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
}


// ==================== IA: GÉNÉRATION EMAIL ====================

/**
 * Générateur IA de messages email pour devis
 * Simule une IA en utilisant des templates intelligents
 */
// Générer email de devis avec OpenAI (version IA)
async function generateQuoteEmail(quote, client, options = {}) {
  const { tone = 'professional' } = options;
  
  try {
    // Appeler l'API IA
    const response = await axios.post(`${API_URL}/api/ai/generate-quote-email`, {
      quote: {
        number: quote.number || quote.quote_number,
        deal_type: quote.deal_type,
        total_ttc: quote.total_ttc,
        validity_days: quote.validity_days || 30,
        deposit_rate: quote.deposit_rate || 50
      },
      client: {
        civility: client.civility,
        first_name: client.first_name,
        last_name: client.last_name,
        company: client.company
      },
      tone
    });
    
    return {
      subject: response.data.subject,
      message: response.data.message,
      metadata: {
        tone,
        quoteNumber: quote.number || quote.quote_number,
        amount: quote.total_ttc,
        clientName: `${client.first_name} ${client.last_name}`,
        generatedBy: 'OpenAI'
      }
    };
  } catch (error) {
    console.error('Erreur génération IA:', error);
    
    // Fallback vers template local en cas d'erreur
    return generateQuoteEmailFallback(quote, client, options);
  }
}

// Fallback : template local (ancien code)
function generateQuoteEmailFallback(quote, client, options = {}) {
  const {
    tone = 'professional',
    includeDetails = true,
    addCallToAction = true
  } = options;
  
  // Déterminer le genre et la civilité
  const civility = client.civility || (client.first_name ? 'M./Mme' : 'Monsieur/Madame');
  const clientName = client.last_name ? `${civility} ${client.last_name}` : civility;
  
  // Types de projets avec descriptions naturelles
  const projectDescriptions = {
    'portail': 'votre projet de portail',
    'portillon': 'votre projet de portillon',
    'cloture': 'votre projet de clôture',
    'ensemble': 'votre projet d\'ensemble (portail + clôture)',
    'sav': 'votre demande de service après-vente'
  };
  
  const projectType = quote.deal_type || 'portail';
  const projectDesc = projectDescriptions[projectType] || 'votre projet';
  
  // Calculer la date de validité
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + (quote.validity_days || 30));
  const formattedValidityDate = formatDate(validityDate.toISOString());
  
  // Intro selon le ton
  const intros = {
    professional: `Nous vous remercions pour votre demande concernant ${projectDesc}.`,
    friendly: `Merci de nous avoir contactés pour ${projectDesc} !`,
    formal: `Nous accusons réception de votre demande relative à ${projectDesc}.`
  };
  
  // Corps du message
  const bodies = {
    professional: `
Nous avons le plaisir de vous transmettre notre proposition commerciale détaillée.

Vous trouverez en pièce jointe notre devis n°${quote.quote_number} pour un montant total de ${formatCurrency(quote.total_ttc)}.`,
    friendly: `
Nous sommes ravis de pouvoir vous accompagner dans ce projet !

Vous trouverez ci-joint notre devis n°${quote.quote_number} d'un montant de ${formatCurrency(quote.total_ttc)}.`,
    formal: `
Veuillez trouver ci-joint notre proposition commerciale n°${quote.quote_number}, établie conformément à votre cahier des charges, pour un montant total de ${formatCurrency(quote.total_ttc)}.`
  };
  
  // Informations complémentaires
  let details = '';
  if (includeDetails) {
    const acompteInfo = quote.acompte_amount ? `\nUn acompte de ${formatCurrency(quote.acompte_amount)} sera à régler à la commande.` : '';
    const validityInfo = quote.validity_days ? `\n\nCe devis est valable jusqu'au ${formattedValidityDate}.` : '';
    
    details = `${acompteInfo}${validityInfo}`;
  }
  
  // Call to action
  const ctas = {
    professional: `\n\nNous restons à votre disposition pour toute question ou complément d'information.`,
    friendly: `\n\nN'hésitez pas à nous contacter si vous avez la moindre question, nous sommes là pour vous !`,
    formal: `\n\nNous demeurons à votre entière disposition pour tout renseignement complémentaire que vous jugeriez utile.`
  };
  
  const cta = addCallToAction ? ctas[tone] : '';
  
  // Signature
  const companyName = state.user?.company_name || 'PSM Portails Sur Mesure';
  const signature = `\n\nCordialement,\nL'équipe ${companyName}`;
  
  // Assembler le message
  const greeting = `Bonjour ${clientName},\n\n`;
  const intro = intros[tone];
  const body = bodies[tone];
  
  const fullMessage = `${greeting}${intro}${body}${details}${cta}${signature}`;
  
  // Générer aussi le sujet
  const subjects = {
    professional: `Devis n°${quote.quote_number} - ${projectDesc}`,
    friendly: `Votre devis pour ${projectDesc} 📄`,
    formal: `Proposition commerciale n°${quote.quote_number}`
  };
  
  return {
    subject: subjects[tone],
    message: fullMessage,
    metadata: {
      tone,
      projectType,
      quoteNumber: quote.quote_number,
      amount: quote.total_ttc,
      clientName
    }
  };
}

// ==================== API ====================
const api = {
  setToken: (token) => {
    state.token = token;
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      storage.set('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      storage.remove('token');
    }
  },

  async login(email, password) {
    const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    state.user = data.user;
    state.token = data.token;
    storage.set('user', data.user);
    api.setToken(data.token);
    return data;
  },

  async loginSimple(name) {
    const { data } = await axios.post(`${API_URL}/api/auth/login-simple`, { name });
    state.user = data.user;
    state.token = data.token;
    storage.set('user', data.user);
    api.setToken(data.token);
    return data;
  },

  async signup(userData) {
    const { data } = await axios.post(`${API_URL}/api/auth/signup`, userData);
    return data;
  },

  logout() {
    state.user = null;
    state.token = null;
    storage.remove('user');
    storage.remove('token');
    api.setToken(null);
  },
  
  // Profile
  updateProfile: (data) => axios.put(`${API_URL}/api/profile`, data).then(r => r.data),

  // Clients
  getClients: () => axios.get(`${API_URL}/api/clients`).then(r => r.data.clients),
  getClient: (id) => axios.get(`${API_URL}/api/clients/${id}`).then(r => r.data.client),
  createClient: (data) => axios.post(`${API_URL}/api/clients`, data).then(r => r.data),
  updateClient: (id, data) => axios.put(`${API_URL}/api/clients/${id}`, data).then(r => r.data),
  deleteClient: (id) => axios.delete(`${API_URL}/api/clients/${id}`).then(r => r.data),
  archiveClient: (id) => axios.put(`${API_URL}/api/clients/${id}`, { archived: true }).then(r => r.data),
  restoreClient: (id) => axios.put(`${API_URL}/api/clients/${id}`, { archived: false }).then(r => r.data),

  // Deals
  getDeals: () => axios.get(`${API_URL}/api/deals`).then(r => r.data.deals),
  getDealsPriority: () => axios.get(`${API_URL}/api/deals/priority`).then(r => r.data),
  getDeal: (id) => axios.get(`${API_URL}/api/deals/${id}`).then(r => r.data.deal),
  createDeal: (data) => axios.post(`${API_URL}/api/deals`, data).then(r => r.data),
  updateDeal: (id, data) => axios.put(`${API_URL}/api/deals/${id}`, data).then(r => r.data),
  deleteDeal: (id) => axios.delete(`${API_URL}/api/deals/${id}`).then(r => r.data),
  archiveDeal: (id) => axios.put(`${API_URL}/api/deals/${id}`, { archived: true }).then(r => r.data),
  restoreDeal: (id) => axios.put(`${API_URL}/api/deals/${id}`, { archived: false }).then(r => r.data),
  getArchivedDeals: () => axios.get(`${API_URL}/api/deals?archived=true`).then(r => r.data.deals),

  // Quotes
  getQuotes: () => axios.get(`${API_URL}/api/quotes`).then(r => r.data.quotes),
  getQuote: (id) => axios.get(`${API_URL}/api/quotes/${id}`).then(r => ({ ...r.data.quote, items: r.data.items })),
  createQuote: (data) => axios.post(`${API_URL}/api/quotes`, data).then(r => r.data),
  updateQuote: (id, data) => axios.put(`${API_URL}/api/quotes/${id}`, data).then(r => r.data),
  sendQuoteEmail: (id, emailData) => axios.post(`${API_URL}/api/quotes/${id}/send-email`, emailData).then(r => r.data),
  
  // AI
  chatWithAI: (message, context) => axios.post(`${API_URL}/api/ai/chat`, { message, context }).then(r => r.data),
  analyzeEmail: (emailContent, emailSubject) => axios.post(`${API_URL}/api/ai/analyze-email`, { emailContent, emailSubject }).then(r => r.data),
  
  // Email Templates
  getEmailTemplates: () => axios.get(`${API_URL}/api/email-templates`).then(r => r.data.templates),
  getEmailTemplate: (id) => axios.get(`${API_URL}/api/email-templates/${id}`).then(r => r.data.template),
  generateEmail: (templateId, variables) => axios.post(`${API_URL}/api/email-templates/${templateId}/generate`, { variables }).then(r => r.data),
  deleteQuote: (id) => axios.delete(`${API_URL}/api/quotes/${id}`).then(r => r.data),

  // Tasks
  getTasks: () => axios.get(`${API_URL}/api/tasks`).then(r => r.data.tasks),
  createTask: (data) => axios.post(`${API_URL}/api/tasks`, data).then(r => r.data),
  toggleTask: (id, status) => axios.put(`${API_URL}/api/tasks/${id}`, { status }).then(r => r.data),

  // Photos
  getPhotos: (dealId) => axios.get(`${API_URL}/api/photos?deal_id=${dealId}`).then(r => r.data.photos),
  getClientPhotos: (clientId) => axios.get(`${API_URL}/api/clients/${clientId}/photos`).then(r => r.data.photos),
  uploadPhoto: (data) => axios.post(`${API_URL}/api/photos`, data).then(r => r.data),
  deletePhoto: (id) => axios.delete(`${API_URL}/api/photos/${id}`).then(r => r.data),

  // Emails
  getEmails: (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return axios.get(`${API_URL}/api/emails?${queryParams}`).then(r => r.data.emails);
  },
  archiveEmail: (id, category) => axios.post(`${API_URL}/api/emails/${id}/archive`, { category }).then(r => r.data),
  deleteEmail: (id) => axios.delete(`${API_URL}/api/emails/${id}`).then(r => r.data),
  restoreEmail: (id) => axios.post(`${API_URL}/api/emails/${id}/restore`).then(r => r.data),
  clearArchivedEmails: () => axios.delete(`${API_URL}/api/emails/archived/clear`).then(r => r.data),
  processEmailAsLead: (id) => axios.post(`${API_URL}/api/emails/${id}/process-as-lead`).then(r => r.data),
  
  // Notifications
  getNotifications: () => axios.get(`${API_URL}/api/notifications`).then(r => r.data),
  markNotificationRead: (id) => axios.post(`${API_URL}/api/notifications/${id}/read`).then(r => r.data),
  markAllNotificationsRead: () => axios.post(`${API_URL}/api/notifications/read-all`).then(r => r.data),
  deleteNotification: (id) => axios.delete(`${API_URL}/api/notifications/${id}`).then(r => r.data),
  generateNotifications: () => axios.post(`${API_URL}/api/notifications/generate`).then(r => r.data),
  
  // Exports
  exportClients: () => {
    const token = storage.get('token');
    window.open(`${API_URL}/api/export/clients?token=${token}`, '_blank');
  },
  exportDeals: () => {
    const token = storage.get('token');
    window.open(`${API_URL}/api/export/deals?token=${token}`, '_blank');
  },
  // Calendrier
  getCalendar: (month, year) => {
    const params = month && year ? `?month=${month}&year=${year}` : '';
    return axios.get(`${API_URL}/api/calendar${params}`).then(r => r.data);
  },
  
  // Exports
  exportClients: () => {
    const token = storage.get('token');
    window.open(`${API_URL}/api/export/clients?token=${token}`, '_blank');
  },
  exportDeals: () => {
    const token = storage.get('token');
    window.open(`${API_URL}/api/export/deals?token=${token}`, '_blank');
  },
  exportQuotes: () => {
    const token = storage.get('token');
    window.open(`${API_URL}/api/export/quotes?token=${token}`, '_blank');
  },
  weeklyReport: () => {
    const token = storage.get('token');
    window.open(`${API_URL}/api/reports/weekly?token=${token}`, '_blank');
  },
  
  // Weekly Reports
  generateWeeklyReport: () => axios.post(`${API_URL}/api/reports/weekly/generate`).then(r => r.data),
  getReportsHistory: () => axios.get(`${API_URL}/api/reports/weekly/history`).then(r => r.data.reports),
  getReport: (id) => axios.get(`${API_URL}/api/reports/weekly/${id}`).then(r => r.data.report),
  
  // Advanced Stats
  getAdvancedStats: (period = '30') => axios.get(`${API_URL}/api/stats/advanced?period=${period}`).then(r => r.data),
  
  // Email Parsing with AI
  parseEmail: (emailText) => axios.post(`${API_URL}/api/parse-email`, { emailText }).then(r => r.data),
};

// ==================== RENDER FUNCTIONS ====================

// DASHBOARD - Page d'accueil
function renderDashboard() {
  console.log('🏠 renderDashboard() appelé');
  const content = `
    <div style="padding: 1.5rem;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="font-size: 1.75rem; font-weight: 700; color: var(--psm-text); margin-bottom: 0.5rem;">
          Tableau de bord
        </h1>
        <p style="color: var(--psm-text-muted);">
          Bienvenue ${state.user?.name || 'Utilisateur'}
        </p>
        <button class="btn btn-secondary mt-3" onclick="api.weeklyReport()" title="Voir le rapport hebdomadaire">
          <i class="fas fa-file-pdf"></i> Rapport Hebdomadaire
        </button>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; max-width: 600px; margin: 0 auto;">
        
        <!-- Pipeline -->
        <div onclick="navigate('pipeline')" class="dashboard-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div class="dashboard-card-icon">
            <i class="fas fa-columns" style="font-size: 2rem;"></i>
          </div>
          <div class="dashboard-card-title">Pipeline</div>
          <div class="dashboard-card-subtitle">Suivi des dossiers</div>
        </div>
        
        <!-- Clients -->
        <div onclick="navigate('clients')" class="dashboard-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <div class="dashboard-card-icon">
            <i class="fas fa-users" style="font-size: 2rem;"></i>
          </div>
          <div class="dashboard-card-title">Clients</div>
          <div class="dashboard-card-subtitle">Gestion contacts</div>
        </div>
        
        <!-- Devis -->
        <div onclick="navigate('quotes')" class="dashboard-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <div class="dashboard-card-icon">
            <i class="fas fa-file-invoice-dollar" style="font-size: 2rem;"></i>
          </div>
          <div class="dashboard-card-title">Devis</div>
          <div class="dashboard-card-subtitle">Propositions commerciales</div>
        </div>
        
        <!-- Tâches -->
        <div onclick="navigate('tasks')" class="dashboard-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <div class="dashboard-card-icon">
            <i class="fas fa-tasks" style="font-size: 2rem;"></i>
          </div>
          <div class="dashboard-card-title">Tâches</div>
          <div class="dashboard-card-subtitle">À faire</div>
        </div>
        
        <!-- Mails -->
        <div onclick="navigate('mails')" class="dashboard-card" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
          <div class="dashboard-card-icon">
            <i class="fas fa-envelope" style="font-size: 2rem;"></i>
          </div>
          <div class="dashboard-card-title">Mails</div>
          <div class="dashboard-card-subtitle">Emails reçus</div>
        </div>
        
        <!-- Paramètres -->
        <div onclick="navigate('settings')" class="dashboard-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
          <div class="dashboard-card-icon">
            <i class="fas fa-cog" style="font-size: 2rem;"></i>
          </div>
          <div class="dashboard-card-title">Paramètres</div>
          <div class="dashboard-card-subtitle">Configuration</div>
        </div>
        
        <!-- Efficacité (NOUVEAU) -->
        <div onclick="navigate('efficiency')" class="dashboard-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div class="dashboard-card-icon">
            <i class="fas fa-chart-line" style="font-size: 2rem;"></i>
          </div>
          <div class="dashboard-card-title">Efficacité</div>
          <div class="dashboard-card-subtitle">KPI & Analytics</div>
        </div>
        
      </div>
      
      <!-- Routine Aujourd'hui -->
      <div style="max-width: 600px; margin: 2rem auto 0;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 1rem; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); color: white;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <i class="fas fa-calendar-day" style="font-size: 1.5rem;"></i>
              <h3 style="font-size: 1.2rem; font-weight: 700; margin: 0;">Aujourd'hui</h3>
            </div>
            <div id="today-date" style="font-size: 0.9rem; opacity: 0.9;">--</div>
          </div>
          
          <div id="today-routine" style="display: grid; gap: 0.75rem; font-size: 0.9rem;">
            <div style="text-align: center; padding: 2rem; opacity: 0.7;">
              <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
              <div>Chargement de votre routine...</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Stats rapides -->
      <div style="max-width: 600px; margin: 2rem auto 0;">
        <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--psm-text); margin-bottom: 1rem;">
          📊 Statistiques rapides
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem;">
          <div class="stat-card">
            <div class="stat-value" id="stat-clients">-</div>
            <div class="stat-label">Clients</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="stat-deals">-</div>
            <div class="stat-label">Dossiers actifs</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="stat-quotes">-</div>
            <div class="stat-label">Devis en cours</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" id="stat-tasks">-</div>
            <div class="stat-label">Tâches</div>
          </div>
        </div>
      </div>
      
      <!-- Widget Temps Économisé -->
      <div style="max-width: 600px; margin: 2rem auto 0;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 1rem; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); color: white;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <i class="fas fa-clock" style="font-size: 1.5rem;"></i>
            <h3 style="font-size: 1.2rem; font-weight: 700; margin: 0;">Temps économisé cette semaine</h3>
          </div>
          
          <div style="text-align: center; margin: 1.5rem 0;">
            <div style="font-size: 3rem; font-weight: 800;" id="time-saved-total">--</div>
            <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 0.25rem;" id="time-saved-subtitle">Chargement...</div>
          </div>
          
          <div id="time-saved-details" style="display: grid; gap: 0.5rem; font-size: 0.9rem;">
            <!-- Rempli dynamiquement -->
          </div>
          
          <div id="time-saved-comparison" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.2); text-align: center; font-size: 0.85rem;">
            <!-- Rempli dynamiquement -->
          </div>
        </div>
      </div>
      
      <!-- Widget Indicateurs de Conversion -->
      <div style="max-width: 600px; margin: 2rem auto 0;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 1rem; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); color: white;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <i class="fas fa-chart-line" style="font-size: 1.5rem;"></i>
            <h3 style="font-size: 1.2rem; font-weight: 700; margin: 0;">Performance cette semaine</h3>
          </div>
          
          <div id="conversion-indicators" style="display: grid; gap: 0.75rem; font-size: 0.9rem;">
            <div style="text-align: center; padding: 2rem; opacity: 0.7;">
              <i class="fas fa-spinner fa-spin" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
              <div>Chargement des indicateurs...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('app').innerHTML = renderLayout(content);
  
  // Charger les stats
  loadDashboardStats();
}

async function loadDashboardStats() {
  try {
    const [clients, deals, quotes, tasks] = await Promise.all([
      api.getClients(),
      api.getDeals(),
      api.getQuotes(),
      api.getTasks()
    ]);
    
    document.getElementById('stat-clients').textContent = safeArray(clients).length;
    document.getElementById('stat-deals').textContent = safeArray(deals).length;
    document.getElementById('stat-quotes').textContent = safeArray(quotes).length;
    document.getElementById('stat-tasks').textContent = safeArray(tasks).filter(t => !t.completed_at).length;
    
    // ⚠️ Désactivé temporairement pour debug Gmail
    // await loadTodayRoutine();
    // await loadTimeSavingsStats();
    // await loadConversionIndicators();
  } catch (error) {
    console.error('Erreur chargement stats:', error);
  }
}

async function loadTodayRoutine() {
  try {
    const response = await fetch('/api/routine/today', {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erreur chargement routine');
    }
    
    const data = await response.json();
    
    // Date du jour
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('today-date').textContent = today.toLocaleDateString('fr-FR', options);
    
    const routineElement = document.getElementById('today-routine');
    
    // Si aucune action
    if (data.total_actions === 0) {
      routineElement.innerHTML = `
        <div style="text-align: center; padding: 2rem; opacity: 0.9;">
          <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
          <div style="font-size: 1.1rem; font-weight: 600;">Aucune action urgente !</div>
          <div style="font-size: 0.85rem; margin-top: 0.25rem;">Profitez-en pour traiter vos dossiers en cours</div>
        </div>
      `;
      return;
    }
    
    let html = '';
    
    // URGENT
    const urgentItems = [];
    
    // Devis expirant
    if (data.urgent.expiring_quotes && data.urgent.expiring_quotes.length > 0) {
      data.urgent.expiring_quotes.forEach(q => {
        const daysLeft = Math.round(q.days_left);
        urgentItems.push({
          icon: '⚠️',
          text: `Devis ${q.number} expire dans ${daysLeft}j - ${q.civility || 'M.'} ${q.first_name} ${q.last_name}`,
          action: `navigate('quotes')`,
          type: 'urgent'
        });
      });
    }
    
    // Devis anciens
    if (data.urgent.old_quotes && data.urgent.old_quotes.length > 0) {
      data.urgent.old_quotes.slice(0, 2).forEach(q => {
        urgentItems.push({
          icon: '📞',
          text: `Relancer ${q.civility || 'M.'} ${q.first_name} ${q.last_name} - devis envoyé il y a ${q.days_ago}j`,
          action: `navigate('quotes')`,
          type: 'urgent'
        });
      });
    }
    
    // Tâches en retard
    if (data.urgent.overdue_tasks && data.urgent.overdue_tasks.length > 0) {
      data.urgent.overdue_tasks.slice(0, 2).forEach(t => {
        urgentItems.push({
          icon: '⏰',
          text: `RETARD : ${t.title}`,
          action: `navigate('tasks')`,
          type: 'urgent'
        });
      });
    }
    
    if (urgentItems.length > 0) {
      html += `
        <div style="margin-bottom: 1rem;">
          <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>❗ URGENT</span>
            <span style="background: rgba(255,255,255,0.2); padding: 0.1rem 0.4rem; border-radius: 0.3rem; font-size: 0.75rem;">${urgentItems.length}</span>
          </div>
          ${urgentItems.map(item => `
            <div onclick="${item.action}" style="background: rgba(255,255,255,0.15); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
              <span style="margin-right: 0.5rem;">${item.icon}</span>
              <span>${item.text}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // À FAIRE
    const todoItems = [];
    
    // Tâches du jour
    if (data.todo.today_tasks && data.todo.today_tasks.length > 0) {
      data.todo.today_tasks.forEach(t => {
        todoItems.push({
          icon: '✅',
          text: t.title,
          action: `navigate('tasks')`,
          type: 'todo'
        });
      });
    }
    
    // Nouveaux leads
    if (data.todo.new_leads && data.todo.new_leads.length > 0) {
      todoItems.push({
        icon: '📬',
        text: `Traiter ${data.todo.new_leads.length} nouveau${data.todo.new_leads.length > 1 ? 'x' : ''} lead${data.todo.new_leads.length > 1 ? 's' : ''}`,
        action: `navigate('pipeline')`,
        type: 'todo'
      });
    }
    
    // Devis brouillon
    if (data.todo.draft_quotes && data.todo.draft_quotes.length > 0) {
      data.todo.draft_quotes.forEach(q => {
        todoItems.push({
          icon: '🧾',
          text: `Finaliser devis ${q.number} - ${q.first_name} ${q.last_name}`,
          action: `navigate('quotes')`,
          type: 'todo'
        });
      });
    }
    
    if (todoItems.length > 0) {
      html += `
        <div style="margin-bottom: 1rem;">
          <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>📋 À FAIRE</span>
            <span style="background: rgba(255,255,255,0.2); padding: 0.1rem 0.4rem; border-radius: 0.3rem; font-size: 0.75rem;">${todoItems.length}</span>
          </div>
          ${todoItems.slice(0, 4).map(item => `
            <div onclick="${item.action}" style="background: rgba(255,255,255,0.1); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
              <span style="margin-right: 0.5rem;">${item.icon}</span>
              <span>${item.text}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // SUIVIS
    if (data.follow_up.old_leads && data.follow_up.old_leads.length > 0) {
      html += `
        <div>
          <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>👁️ SUIVIS</span>
            <span style="background: rgba(255,255,255,0.2); padding: 0.1rem 0.4rem; border-radius: 0.3rem; font-size: 0.75rem;">${data.follow_up.old_leads.length}</span>
          </div>
          ${data.follow_up.old_leads.map(lead => `
            <div onclick="navigate('pipeline')" style="background: rgba(255,255,255,0.08); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
              <span style="margin-right: 0.5rem;">⏳</span>
              <span>Lead ${lead.first_name} ${lead.last_name} sans contact depuis ${lead.days_old}j</span>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    routineElement.innerHTML = html;
    
  } catch (error) {
    console.error('Erreur chargement routine:', error);
    document.getElementById('today-routine').innerHTML = `
      <div style="text-align: center; padding: 1rem; opacity: 0.7;">
        Impossible de charger la routine
      </div>
    `;
  }
}

// CALENDRIER - Vue des événements
async function renderCalendar() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  // Charger les événements
  const data = await api.getCalendar();
  const events = data.events || [];
  
  // Filtrer par période
  const today = safeArray(events).filter(e => e.date === now.toISOString().split('T')[0]);
  const thisWeek = safeArray(events).filter(e => {
    const eventDate = new Date(e.date);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= now && eventDate <= weekFromNow;
  });
  
  const content = `
    <div style="padding: 2rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
        <h1 style="font-size: 2rem; font-weight: 700; color: #111827; margin: 0;">
          <i class="fas fa-calendar-alt" style="color: var(--psm-primary); margin-right: 0.75rem;"></i>
          Calendrier
        </h1>
        <button onclick="navigate('dashboard')" style="background: white; color: #111827; border: 1px solid var(--psm-border); padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">
          <i class="fas fa-arrow-left"></i> Retour
        </button>
      </div>
      
      <!-- Section AUJOURD'HUI -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; color: white;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
          <i class="fas fa-calendar-day" style="font-size: 1.5rem;"></i>
          <h2 style="font-size: 1.3rem; font-weight: 700; margin: 0;">Aujourd'hui</h2>
        </div>
        ${today.length > 0 ? `
          <div style="display: grid; gap: 0.75rem;">
            ${today.map(event => `
              <div onclick="window.location.hash='${event.link}'" style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 0.75rem; cursor: pointer; transition: all 0.2s; backdrop-filter: blur(10px);" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="font-size: 1.5rem;">${event.icon}</span>
                  <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 1rem;">${event.title}</div>
                    <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 0.25rem;">${event.description}</div>
                  </div>
                  <span style="background: ${event.color}; color: white; padding: 0.25rem 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 600;">${event.type === 'rdv' ? 'RDV' : event.type === 'task' ? 'Tâche' : event.type === 'quote_sent' ? 'Devis' : 'Échéance'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="text-align: center; padding: 2rem; opacity: 0.8;">
            <i class="fas fa-check-circle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <p style="margin: 0;">Aucun événement aujourd'hui</p>
          </div>
        `}
      </div>
      
      <!-- Section CETTE SEMAINE -->
      <div style="background: white; color: #111827; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
          <i class="fas fa-calendar-week" style="font-size: 1.3rem; color: var(--psm-primary);"></i>
          <h2 style="font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827;">Cette semaine (${thisWeek.length})</h2>
        </div>
        ${thisWeek.length > 0 ? `
          <div style="display: grid; gap: 0.75rem;">
            ${thisWeek.map(event => {
              const eventDate = new Date(event.date);
              const dayName = eventDate.toLocaleDateString('fr-FR', { weekday: 'long' });
              const dayNum = eventDate.getDate();
              const monthName = eventDate.toLocaleDateString('fr-FR', { month: 'short' });
              
              return `
                <div onclick="window.location.hash='${event.link}'" style="border: 1px solid var(--psm-border); padding: 1rem; border-radius: 0.75rem; cursor: pointer; transition: all 0.2s; display: flex; gap: 1rem; align-items: center;" onmouseover="this.style.borderColor='${event.color}'; this.style.background='rgba(0,0,0,0.02)'" onmouseout="this.style.borderColor='var(--psm-border)'; this.style.background='white'">
                  <div style="text-align: center; min-width: 60px;">
                    <div style="font-size: 0.75rem; color: var(--psm-text-muted); text-transform: uppercase;">${dayName.substring(0, 3)}</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${event.color};">${dayNum}</div>
                    <div style="font-size: 0.75rem; color: var(--psm-text-muted); text-transform: uppercase;">${monthName}</div>
                  </div>
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                      <span style="font-size: 1.2rem;">${event.icon}</span>
                      <span style="font-weight: 600; color: #111827;">${event.title}</span>
                    </div>
                    <div style="font-size: 0.85rem; color: var(--psm-text-secondary);">${event.description}</div>
                  </div>
                  <span style="background: ${event.color}; color: white; padding: 0.25rem 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 600;">${event.type === 'rdv' ? 'RDV' : event.type === 'task' ? 'Tâche' : event.type === 'quote_sent' ? 'Devis' : 'Échéance'}</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div style="text-align: center; padding: 2rem; color: var(--psm-text-muted);">
            <i class="fas fa-calendar-times" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
            <p style="margin: 0;">Aucun événement cette semaine</p>
          </div>
        `}
      </div>
      
      <!-- Section TOUS LES ÉVÉNEMENTS -->
      <div style="background: white; color: #111827; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
          <i class="fas fa-list" style="font-size: 1.3rem; color: var(--psm-primary);"></i>
          <h2 style="font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827;">Tous les événements (${events.length})</h2>
        </div>
        ${events.length > 0 ? `
          <div style="display: grid; gap: 0.5rem;">
            ${safeArray(events).map(event => {
              const eventDate = new Date(event.date);
              const isPast = eventDate < now;
              
              return `
                <div onclick="window.location.hash='${event.link}'" style="padding: 0.75rem 1rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; display: flex; gap: 1rem; align-items: center; ${isPast ? 'opacity: 0.6;' : ''}" onmouseover="this.style.background='rgba(0,0,0,0.03)'" onmouseout="this.style.background='transparent'">
                  <span style="font-size: 1.2rem;">${event.icon}</span>
                  <div style="flex: 1;">
                    <div style="font-weight: 600; color: #111827; font-size: 0.95rem;">${event.title}</div>
                    <div style="font-size: 0.8rem; color: var(--psm-text-secondary);">${event.description}</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 0.85rem; font-weight: 600; color: ${event.color};">${eventDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                    <div style="font-size: 0.75rem; color: var(--psm-text-muted);">${event.type === 'rdv' ? 'RDV' : event.type === 'task' ? 'Tâche' : event.type === 'quote_sent' ? 'Devis' : 'Échéance'}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div style="text-align: center; padding: 3rem; color: var(--psm-text-muted);">
            <i class="fas fa-calendar-plus" style="font-size: 4rem; opacity: 0.2; margin-bottom: 1rem;"></i>
            <p style="margin: 0; font-size: 1.1rem;">Aucun événement à venir</p>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">Ajoutez des RDV ou des tâches pour les voir ici</p>
          </div>
        `}
      </div>
    </div>
  `;
  
  document.getElementById('app').innerHTML = renderLayout(content);
}

// PROJETS À PRIORISER - Vue scoring
// ==========================================
// REPORTS - Rapports hebdomadaires
// ==========================================

// ==========================================
// EFFICIENCY - Dashboard efficacité avancé
// ==========================================

let currentPeriod = '30'; // 7, 30, 90, 365

async function renderEfficiency() {
  try {
    const stats = await api.getAdvancedStats(currentPeriod);
    
    const content = `
      <div class="card-header">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-white"><i class="fas fa-chart-line"></i> Dashboard Efficacité</h2>
          <div class="flex gap-2">
            <button class="btn btn-sm ${currentPeriod === '7' ? 'btn-primary' : 'btn-secondary'}" onclick="changePeriod('7')">7j</button>
            <button class="btn btn-sm ${currentPeriod === '30' ? 'btn-primary' : 'btn-secondary'}" onclick="changePeriod('30')">30j</button>
            <button class="btn btn-sm ${currentPeriod === '90' ? 'btn-primary' : 'btn-secondary'}" onclick="changePeriod('90')">90j</button>
            <button class="btn btn-sm ${currentPeriod === '365' ? 'btn-primary' : 'btn-secondary'}" onclick="changePeriod('365')">1an</button>
          </div>
        </div>
      </div>
      
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-white opacity-80 text-sm">Taux de conversion</div>
              <div class="text-white font-bold text-3xl mt-1">${stats.kpis.conversion_rate.value}%</div>
              <div class="text-white opacity-70 text-xs mt-2">${stats.kpis.conversion_rate.accepted}/${stats.kpis.conversion_rate.total_quotes} devis acceptés</div>
            </div>
            <i class="fas fa-percentage" style="font-size: 2.5rem; color: rgba(255,255,255,0.3);"></i>
          </div>
        </div>
        
        <div class="card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-white opacity-80 text-sm">Délai moyen signature</div>
              <div class="text-white font-bold text-3xl mt-1">${stats.kpis.avg_sign_delay.value} j</div>
              <div class="text-white opacity-70 text-xs mt-2">Du lead au devis signé</div>
            </div>
            <i class="fas fa-clock" style="font-size: 2.5rem; color: rgba(255,255,255,0.3);"></i>
          </div>
        </div>
        
        <div class="card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-white opacity-80 text-sm">CA moyen / deal</div>
              <div class="text-white font-bold text-3xl mt-1">${stats.kpis.avg_revenue_per_deal.value.toLocaleString('fr-FR')}€</div>
              <div class="text-white opacity-70 text-xs mt-2">Min ${stats.kpis.avg_revenue_per_deal.min}€ - Max ${stats.kpis.avg_revenue_per_deal.max}€</div>
            </div>
            <i class="fas fa-euro-sign" style="font-size: 2.5rem; color: rgba(255,255,255,0.3);"></i>
          </div>
        </div>
      </div>
      
      <!-- Secondary KPIs -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="card">
          <h3 class="font-bold text-white mb-3"><i class="fas fa-shopping-cart"></i> Panier moyen</h3>
          <div class="text-white font-bold text-4xl">${stats.kpis.avg_basket.value.toLocaleString('fr-FR')}€</div>
          <p class="text-gray-400 text-sm mt-2">Montant moyen des devis (lignes devis)</p>
        </div>
        
        <div class="card">
          <h3 class="font-bold text-white mb-3"><i class="fas fa-phone"></i> Taux de relance</h3>
          <div class="text-white font-bold text-4xl">${stats.kpis.follow_up_rate.value}%</div>
          <p class="text-gray-400 text-sm mt-2">${stats.kpis.follow_up_rate.follow_ups}/${stats.kpis.follow_up_rate.total} deals en relance</p>
        </div>
      </div>
      
      <!-- Répartition par statut -->
      <div class="card">
        <h3 class="font-bold text-white mb-4"><i class="fas fa-chart-pie"></i> Répartition des deals par statut</h3>
        <div style="display: grid; gap: 0.75rem;">
          ${stats.trends.status_distribution.map(item => {
            const statusLabels = {
              'lead': { label: 'Lead', color: '#3b82f6', icon: 'fa-star' },
              'rdv_planifie': { label: 'RDV planifié', color: '#8b5cf6', icon: 'fa-calendar' },
              'devis_a_faire': { label: 'Devis à faire', color: '#f59e0b', icon: 'fa-edit' },
              'devis_envoye': { label: 'Devis envoyé', color: '#10b981', icon: 'fa-paper-plane' },
              'devis_direct': { label: 'Devis direct', color: '#06b6d4', icon: 'fa-bolt' },
              'relance': { label: 'Relance', color: '#ef4444', icon: 'fa-phone' },
              'signe': { label: 'Signé', color: '#22c55e', icon: 'fa-check-circle' },
              'perdu': { label: 'Perdu', color: '#6b7280', icon: 'fa-times-circle' },
              'clos': { label: 'Clos', color: '#9ca3af', icon: 'fa-archive' }
            };
            const status = statusLabels[item.status] || { label: item.status, color: '#6b7280', icon: 'fa-circle' };
            return `
              <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: var(--psm-bg); border-radius: 0.5rem; border-left: 4px solid ${status.color};">
                <div style="width: 40px; height: 40px; background: ${status.color}; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                  <i class="fas ${status.icon}" style="color: white;"></i>
                </div>
                <div style="flex: 1;">
                  <div class="text-white font-semibold">${status.label}</div>
                  <div class="text-gray-400 text-sm">${item.count} deal${item.count > 1 ? 's' : ''}</div>
                </div>
                <div class="text-white font-bold text-xl">${item.count}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    
    document.getElementById('app').innerHTML = renderLayout(content);
  } catch (error) {
    console.error('Erreur chargement stats efficacité:', error);
    alert('Erreur lors du chargement des statistiques');
  }
}

async function changePeriod(period) {
  currentPeriod = period;
  renderEfficiency();
}

// ==========================================
// REPORTS - Rapports hebdomadaires
// ==========================================

async function renderReports() {
  try {
    const reports = await api.getReportsHistory();
    
    const reportsHTML = reports.length > 0 ? safeArray(reports).map(report => {
      const timeHours = Math.floor(report.time_saved_seconds / 3600);
      const timeMinutes = Math.floor((report.time_saved_seconds % 3600) / 60);
      const periodStart = new Date(report.period_start).toLocaleDateString('fr-FR');
      const periodEnd = new Date(report.period_end).toLocaleDateString('fr-FR');
      
      return `
        <div class="card mb-3" onclick="viewReport(${report.id})" style="cursor: pointer;">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="badge badge-primary">Semaine ${report.week_number} / ${report.year}</span>
                ${report.email_sent ? '<span class="badge badge-success"><i class="fas fa-check"></i> Envoyé</span>' : '<span class="badge badge-secondary">Brouillon</span>'}
              </div>
              <h3 class="font-bold text-white text-lg">${periodStart} → ${periodEnd}</h3>
              <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-sm">
                <div>
                  <div class="text-gray-400">Leads</div>
                  <div class="text-white font-bold text-lg">${report.new_leads}</div>
                </div>
                <div>
                  <div class="text-gray-400">Devis envoyés</div>
                  <div class="text-white font-bold text-lg">${report.quotes_sent}</div>
                </div>
                <div>
                  <div class="text-gray-400">Signés</div>
                  <div class="text-green-400 font-bold text-lg">${report.quotes_accepted}</div>
                </div>
                <div>
                  <div class="text-gray-400">CA</div>
                  <div class="text-white font-bold text-lg">${report.revenue.toLocaleString('fr-FR')}€</div>
                </div>
                <div>
                  <div class="text-gray-400">Temps économisé</div>
                  <div class="text-blue-400 font-bold text-lg">${timeHours}h${timeMinutes}m</div>
                </div>
              </div>
            </div>
            <i class="fas fa-chevron-right text-gray-400 text-xl ml-4"></i>
          </div>
        </div>
      `;
    }).join('') : `
      <div class="card text-center py-12">
        <i class="fas fa-chart-line text-gray-600 text-6xl mb-4"></i>
        <p class="text-gray-400 text-lg">Aucun rapport généré</p>
        <p class="text-gray-500 text-sm mt-2">Générez votre premier rapport hebdomadaire</p>
      </div>
    `;
    
    const content = `
      <div class="card-header">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-white"><i class="fas fa-chart-bar"></i> Rapports Hebdomadaires</h2>
          <button class="btn btn-primary" onclick="generateNewReport()">
            <i class="fas fa-plus"></i> Générer Rapport
          </button>
        </div>
      </div>
      
      <div class="card mb-4" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div class="flex items-center gap-3">
          <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-info-circle" style="font-size: 1.5rem; color: white;"></i>
          </div>
          <div style="color: white;">
            <h3 class="font-bold text-lg">Rapports automatiques</h3>
            <p class="text-sm opacity-90 mt-1">Les rapports sont générés chaque semaine avec vos statistiques complètes</p>
          </div>
        </div>
      </div>
      
      ${reportsHTML}
    `;
    
    document.getElementById('app').innerHTML = renderLayout(content);
  } catch (error) {
    console.error('Erreur chargement rapports:', error);
    alert('Erreur lors du chargement des rapports');
  }
}

async function generateNewReport() {
  try {
    const confirmed = confirm('Générer un rapport pour la semaine en cours ?');
    if (!confirmed) return;
    
    const result = await api.generateWeeklyReport();
    alert(`✅ Rapport généré avec succès !\n\nSemaine ${result.report.week}/${result.report.year}\n- Leads: ${result.report.stats.new_leads}\n- Devis: ${result.report.stats.quotes_sent}\n- Signés: ${result.report.stats.quotes_accepted}\n- CA: ${result.report.stats.revenue}€\n- Temps économisé: ${result.report.stats.time_saved}`);
    renderReports(); // Recharger
  } catch (error) {
    console.error('Erreur génération rapport:', error);
    alert('Erreur lors de la génération du rapport');
  }
}

async function viewReport(reportId) {
  try {
    const report = await api.getReport(reportId);
    
    const timeHours = Math.floor(report.time_saved_seconds / 3600);
    const timeMinutes = Math.floor((report.time_saved_seconds % 3600) / 60);
    const periodStart = new Date(report.period_start).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const periodEnd = new Date(report.period_end).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const topDealsHTML = report.top_deals?.length > 0 ? report.top_deals.map(deal => `
      <tr>
        <td class="p-3 border-b border-gray-700">${deal.name || deal.company || `${deal.first_name || ''} ${deal.last_name || ''}`.trim() || 'Sans nom'}</td>
        <td class="p-3 border-b border-gray-700">${deal.type || 'N/A'}</td>
        <td class="p-3 border-b border-gray-700">${deal.status || 'N/A'}</td>
        <td class="p-3 border-b border-gray-700 text-right font-bold">${(deal.estimated_amount || 0).toLocaleString('fr-FR')} €</td>
      </tr>
    `).join('') : '<tr><td colspan="4" class="p-6 text-center text-gray-400">Aucun deal cette semaine</td></tr>';
    
    const modal = `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem;" onclick="closeModal(event)">
        <div style="background: var(--psm-bg-card); border-radius: 1rem; max-width: 900px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem;" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="text-2xl font-bold text-white"><i class="fas fa-chart-bar"></i> Rapport Semaine ${report.week_number}/${report.year}</h2>
              <p class="text-gray-400 text-sm mt-1">${periodStart} → ${periodEnd}</p>
            </div>
            <button onclick="closeModal(event)" class="btn btn-secondary"><i class="fas fa-times"></i></button>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div class="card text-center">
              <div class="text-gray-400 text-sm">Nouveaux leads</div>
              <div class="text-white font-bold text-2xl mt-1">${report.new_leads}</div>
            </div>
            <div class="card text-center">
              <div class="text-gray-400 text-sm">Devis envoyés</div>
              <div class="text-white font-bold text-2xl mt-1">${report.quotes_sent}</div>
            </div>
            <div class="card text-center">
              <div class="text-gray-400 text-sm">Devis signés</div>
              <div class="text-green-400 font-bold text-2xl mt-1">${report.quotes_accepted}</div>
            </div>
            <div class="card text-center">
              <div class="text-gray-400 text-sm">CA généré</div>
              <div class="text-white font-bold text-2xl mt-1">${report.revenue.toLocaleString('fr-FR')}€</div>
            </div>
            <div class="card text-center">
              <div class="text-gray-400 text-sm">Temps économisé</div>
              <div class="text-blue-400 font-bold text-2xl mt-1">${timeHours}h${timeMinutes}m</div>
            </div>
          </div>
          
          <div class="card">
            <h3 class="font-bold text-white mb-4"><i class="fas fa-fire"></i> Top 5 Deals de la semaine</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-900 text-gray-300">
                  <tr>
                    <th class="p-3 text-left">Client</th>
                    <th class="p-3 text-left">Projet</th>
                    <th class="p-3 text-left">Statut</th>
                    <th class="p-3 text-right">Montant estimé</th>
                  </tr>
                </thead>
                <tbody class="text-gray-200">
                  ${topDealsHTML}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="flex gap-2 mt-6">
            <button onclick="api.weeklyReport()" class="btn btn-secondary">
              <i class="fas fa-print"></i> Version PDF
            </button>
            <button onclick="closeModal(event)" class="btn btn-secondary ml-auto">Fermer</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
  } catch (error) {
    console.error('Erreur affichage rapport:', error);
    alert('Erreur lors de l\'affichage du rapport');
  }
}

// ==========================================
// PRIORITY - Projets à prioriser
// ==========================================

async function renderPriority() {
  const data = await api.getDealsPriority();
  const deals = data.deals || [];
  const stats = data.stats || {};
  
  // Helper pour afficher le badge de priorité
  const getPriorityBadge = (level, score) => {
    const badges = {
      hot: { icon: '🔥', label: 'CHAUD', color: '#ef4444', bgColor: '#fee2e2' },
      warm: { icon: '⚠️', label: 'MOYEN', color: '#f59e0b', bgColor: '#fef3c7' },
      cold: { icon: '❄️', label: 'FROID', color: '#3b82f6', bgColor: '#dbeafe' }
    };
    const badge = badges[level] || badges.cold;
    return `
      <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: ${badge.bgColor}; color: ${badge.color}; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 700;">
        <span>${badge.icon}</span>
        <span>${badge.label}</span>
        <span style="background: ${badge.color}; color: white; padding: 0.125rem 0.5rem; border-radius: 0.5rem;">${score}</span>
      </div>
    `;
  };
  
  const content = `
    <div style="padding: 2rem;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
        <h1 style="font-size: 2rem; font-weight: 700; color: #111827; margin: 0;">
          <i class="fas fa-fire" style="color: var(--psm-danger); margin-right: 0.75rem;"></i>
          Projets à prioriser
        </h1>
        <button onclick="navigate('dashboard')" style="background: white; color: #111827; border: 1px solid var(--psm-border); padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">
          <i class="fas fa-arrow-left"></i> Retour
        </button>
      </div>
      
      <!-- Statistiques -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <div style="background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); border-radius: 1rem; padding: 1.5rem; color: white;">
          <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">🔥 Projets CHAUDS</div>
          <div style="font-size: 2.5rem; font-weight: 800;">${stats.hot || 0}</div>
        </div>
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 1rem; padding: 1.5rem; color: white;">
          <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">⚠️ Projets MOYENS</div>
          <div style="font-size: 2.5rem; font-weight: 800;">${stats.warm || 0}</div>
        </div>
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 1rem; padding: 1.5rem; color: white;">
          <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">❄️ Projets FROIDS</div>
          <div style="font-size: 2.5rem; font-weight: 800;">${stats.cold || 0}</div>
        </div>
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 1rem; padding: 1.5rem; color: white;">
          <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">📊 Score moyen</div>
          <div style="font-size: 2.5rem; font-weight: 800;">${stats.avg_score || 0}<span style="font-size: 1.5rem; opacity: 0.8;">/100</span></div>
        </div>
      </div>
      
      <!-- Liste des deals -->
      <div style="background: white; color: #111827; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
          <i class="fas fa-list-ol" style="font-size: 1.3rem; color: var(--psm-primary);"></i>
          <h2 style="font-size: 1.2rem; font-weight: 700; margin: 0; color: #111827;">Top priorités (${deals.length})</h2>
        </div>
        
        ${deals.length > 0 ? `
          <div style="display: grid; gap: 1rem;">
            ${deals.map((deal, index) => {
              const fullName = deal.name || `${deal.first_name || ''} ${deal.last_name || ''}`.trim() || 'Sans nom';
              const company = deal.company ? ` - ${deal.company}` : '';
              const amount = deal.estimated_amount ? `${deal.estimated_amount.toLocaleString('fr-FR')} €` : 'Montant non renseigné';
              const statusLabels = {
                'lead': 'Lead',
                'rdv_planifie': 'RDV planifié',
                'metre_cours': 'Métré en cours',
                'devis_a_faire': 'Devis à faire',
                'devis_envoye': 'Devis envoyé',
                'relance': 'Relance'
              };
              const statusLabel = statusLabels[deal.status] || deal.status;
              
              return `
                <div onclick="window.location.hash='#/pipeline'" style="border: 2px solid ${deal.priority_level === 'hot' ? '#ef4444' : deal.priority_level === 'warm' ? '#f59e0b' : '#3b82f6'}; padding: 1.5rem; border-radius: 1rem; cursor: pointer; transition: all 0.2s; background: white; color: #111827;" onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
                        ${index + 1}
                      </div>
                      <div>
                        <div style="font-weight: 700; font-size: 1.1rem; color: #111827; margin-bottom: 0.25rem;">
                          ${fullName}${company}
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem; font-size: 0.85rem; color: var(--psm-text-secondary);">
                          <span><i class="fas fa-tag"></i> ${deal.type || 'Non renseigné'}</span>
                          <span><i class="fas fa-flag"></i> ${statusLabel}</span>
                          <span><i class="fas fa-euro-sign"></i> ${amount}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 1rem;">
                      ${getPriorityBadge(deal.priority_level, deal.score)}
                      <div style="text-align: right; font-size: 0.8rem; color: var(--psm-text-muted);">
                        <div>Créé il y a ${deal.days_old}j</div>
                        <div>MAJ il y a ${deal.days_since_update}j</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Détails scoring -->
                  <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--psm-border); display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem; font-size: 0.8rem;">
                    <div>
                      <div style="color: var(--psm-text-muted); margin-bottom: 0.25rem;">📅 Ancienneté</div>
                      <div style="font-weight: 600;">${deal.days_old <= 7 ? '⭐ Très récent' : deal.days_old <= 14 ? '✅ Récent' : deal.days_old <= 30 ? '⏰ Moyen' : '⚠️ Ancien'}</div>
                    </div>
                    <div>
                      <div style="color: var(--psm-text-muted); margin-bottom: 0.25rem;">💰 Montant</div>
                      <div style="font-weight: 600;">${deal.estimated_amount >= 10000 ? '⭐ Gros projet' : deal.estimated_amount >= 5000 ? '✅ Important' : deal.estimated_amount > 0 ? '📌 Renseigné' : '⚠️ Non renseigné'}</div>
                    </div>
                    <div>
                      <div style="color: var(--psm-text-muted); margin-bottom: 0.25rem;">🔄 Dernière MAJ</div>
                      <div style="font-weight: 600;">${deal.days_since_update <= 1 ? '⭐ Très récent' : deal.days_since_update <= 3 ? '✅ Récent' : deal.days_since_update <= 7 ? '📌 Cette semaine' : '⚠️ Ancien'}</div>
                    </div>
                    <div>
                      <div style="color: var(--psm-text-muted); margin-bottom: 0.25rem;">📋 Complétude</div>
                      <div style="font-weight: 600;">${(deal.type ? 1 : 0) + (deal.estimated_amount ? 1 : 0) + (deal.rdv_date ? 1 : 0) + (deal.client_email ? 1 : 0)}/4 infos</div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div style="text-align: center; padding: 4rem; color: var(--psm-text-muted);">
            <i class="fas fa-inbox" style="font-size: 4rem; opacity: 0.2; margin-bottom: 1rem;"></i>
            <p style="margin: 0; font-size: 1.1rem;">Aucun projet actif à prioriser</p>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">Les projets signés, perdus ou clos ne sont pas affichés</p>
          </div>
        `}
      </div>
    </div>
  `;
  
  document.getElementById('app').innerHTML = renderLayout(content);
}

async function loadTimeSavingsStats() {
  try {
    const response = await fetch('/api/stats/time-savings?period=week', {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erreur chargement temps économisé');
    }
    
    const data = await response.json();
    
    // Afficher le total
    const hours = data.total_hours || 0;
    const minutes = data.total_minutes || 0;
    const totalElement = document.getElementById('time-saved-total');
    const subtitleElement = document.getElementById('time-saved-subtitle');
    
    if (hours > 0) {
      totalElement.textContent = `${hours}h ${minutes}min`;
    } else {
      totalElement.textContent = `${minutes}min`;
    }
    
    const avgMinutes = Math.round((data.average_per_day || 0) / 60);
    subtitleElement.textContent = `Soit ~${avgMinutes}min/jour en moyenne`;
    
    // Afficher les détails par action
    const detailsElement = document.getElementById('time-saved-details');
    const actionLabels = {
      email_generated: '📧 Emails générés',
      quote_created: '📋 Devis créés',
      email_triaged: '📥 Emails triés',
      search_performed: '🔍 Recherches',
      task_auto: '✅ Tâches auto',
      email_analyzed: '🤖 Emails analysés'
    };
    
    if (data.by_action && data.by_action.length > 0) {
      detailsElement.innerHTML = data.by_action.map(action => {
        const label = actionLabels[action.action_type] || action.action_type;
        const minutes = Math.round(action.total_seconds / 60);
        const count = action.count || 0;
        return `
          <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(255,255,255,0.1); border-radius: 0.5rem;">
            <span>${label} : ${count}</span>
            <span style="font-weight: 600;">${minutes}min</span>
          </div>
        `;
      }).join('');
    } else {
      detailsElement.innerHTML = '<div style="text-align: center; opacity: 0.7; padding: 1rem;">Aucune donnée cette semaine</div>';
    }
    
    // Afficher la comparaison
    const comparisonElement = document.getElementById('time-saved-comparison');
    if (data.percent_change !== undefined && data.percent_change !== 0) {
      const icon = data.percent_change > 0 ? '📈' : '📉';
      const sign = data.percent_change > 0 ? '+' : '';
      comparisonElement.innerHTML = `${icon} ${sign}${data.percent_change}% vs semaine dernière`;
    } else {
      comparisonElement.innerHTML = '💡 Première semaine de suivi';
    }
    
  } catch (error) {
    console.error('Erreur chargement temps économisé:', error);
    document.getElementById('time-saved-total').textContent = '--';
    document.getElementById('time-saved-subtitle').textContent = 'Données indisponibles';
  }
}

async function loadConversionIndicators() {
  try {
    const response = await fetch('/api/stats/conversion', {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Erreur chargement indicateurs');
    }
    
    const data = await response.json();
    
    const indicatorsElement = document.getElementById('conversion-indicators');
    
    let html = '';
    
    // 1) Taux de conversion
    const convRate = data.conversion_rate.current;
    const convChange = data.conversion_rate.change;
    const convIcon = convChange > 0 ? '📈' : convChange < 0 ? '📉' : '➡️';
    const convColor = convChange > 0 ? 'rgba(16, 185, 129, 0.2)' : convChange < 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)';
    
    html += `
      <div style="background: ${convColor}; padding: 1rem; border-radius: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.85rem; opacity: 0.9;">Taux de conversion devis</div>
            <div style="font-size: 2rem; font-weight: 800; margin-top: 0.25rem;">${convRate}%</div>
            <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.25rem;">
              ${data.conversion_rate.quotes_accepted}/${data.conversion_rate.quotes_sent} devis acceptés
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.5rem;">${convIcon}</div>
            <div style="font-size: 0.85rem; font-weight: 600; margin-top: 0.25rem;">
              ${convChange > 0 ? '+' : ''}${convChange}%
            </div>
            <div style="font-size: 0.7rem; opacity: 0.8;">vs sem. dern.</div>
          </div>
        </div>
      </div>
    `;
    
    // 2) Leads générés
    const leadsCount = data.leads_generated.current;
    const leadsChange = data.leads_generated.change;
    const leadsIcon = leadsChange > 0 ? '📈' : leadsChange < 0 ? '📉' : '➡️';
    const leadsColor = leadsChange > 0 ? 'rgba(16, 185, 129, 0.2)' : leadsChange < 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)';
    
    html += `
      <div style="background: ${leadsColor}; padding: 1rem; border-radius: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.85rem; opacity: 0.9;">Leads générés</div>
            <div style="font-size: 2rem; font-weight: 800; margin-top: 0.25rem;">${leadsCount}</div>
            <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.25rem;">cette semaine</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.5rem;">${leadsIcon}</div>
            <div style="font-size: 0.85rem; font-weight: 600; margin-top: 0.25rem;">
              ${leadsChange > 0 ? '+' : ''}${leadsChange}
            </div>
            <div style="font-size: 0.7rem; opacity: 0.8;">vs sem. dern.</div>
          </div>
        </div>
      </div>
    `;
    
    // 3) Temps de réponse
    const avgTime = data.avg_response_time.current;
    const timeChange = data.avg_response_time.change;
    const timeIcon = timeChange < 0 ? '📈' : timeChange > 0 ? '📉' : '➡️'; // Inversé car moins c'est mieux
    const timeColor = timeChange < 0 ? 'rgba(16, 185, 129, 0.2)' : timeChange > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)';
    
    html += `
      <div style="background: ${timeColor}; padding: 1rem; border-radius: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.85rem; opacity: 0.9;">Temps moyen de réponse</div>
            <div style="font-size: 2rem; font-weight: 800; margin-top: 0.25rem;">${avgTime}h</div>
            <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.25rem;">lead → devis</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.5rem;">${timeIcon}</div>
            <div style="font-size: 0.85rem; font-weight: 600; margin-top: 0.25rem;">
              ${timeChange > 0 ? '+' : ''}${timeChange}h
            </div>
            <div style="font-size: 0.7rem; opacity: 0.8;">vs sem. dern.</div>
          </div>
        </div>
      </div>
    `;
    
    // 4) CA généré
    if (data.revenue.current > 0 || data.revenue.previous > 0) {
      const revenue = data.revenue.current;
      const revenueChange = data.revenue.change_percent;
      const revenueIcon = revenueChange > 0 ? '📈' : revenueChange < 0 ? '📉' : '➡️';
      const revenueColor = revenueChange > 0 ? 'rgba(16, 185, 129, 0.2)' : revenueChange < 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)';
      
      html += `
        <div style="background: ${revenueColor}; padding: 1rem; border-radius: 0.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.85rem; opacity: 0.9;">CA généré (devis acceptés)</div>
              <div style="font-size: 2rem; font-weight: 800; margin-top: 0.25rem;">${revenue.toLocaleString('fr-FR')}€</div>
              <div style="font-size: 0.75rem; opacity: 0.8; margin-top: 0.25rem;">cette semaine</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.5rem;">${revenueIcon}</div>
              <div style="font-size: 0.85rem; font-weight: 600; margin-top: 0.25rem;">
                ${revenueChange > 0 ? '+' : ''}${revenueChange}%
              </div>
              <div style="font-size: 0.7rem; opacity: 0.8;">vs sem. dern.</div>
            </div>
          </div>
        </div>
      `;
    }
    
    indicatorsElement.innerHTML = html;
    
  } catch (error) {
    console.error('Erreur chargement indicateurs:', error);
    document.getElementById('conversion-indicators').innerHTML = `
      <div style="text-align: center; padding: 1rem; opacity: 0.7;">
        Impossible de charger les indicateurs
      </div>
    `;
  }
}

// LOGIN
function renderLogin() {
  // État pour gérer l'onglet actif
  if (!window.loginState) {
    window.loginState = { activeTab: 'login' };
  }

  document.getElementById('app').innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 px-4">
      <div class="card" style="max-width: 480px; width: 100%;">
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl mb-4 shadow-lg">
            <i class="fas fa-door-open text-white text-3xl"></i>
          </div>
          <h1 class="text-2xl font-bold text-white">PSM Client Manager</h1>
          <p class="text-gray-300 mt-2">Portails Sur Mesure</p>
        </div>

        <!-- Onglets -->
        <div class="flex mb-6 bg-white bg-opacity-10 rounded-lg p-1">
          <button 
            id="tabLogin" 
            class="flex-1 py-2.5 px-4 rounded-md transition-all duration-200 font-medium"
            style="background: ${window.loginState.activeTab === 'login' ? 'white' : 'transparent'}; color: ${window.loginState.activeTab === 'login' ? '#1e3a8a' : 'white'};"
            onclick="switchLoginTab('login')"
          >
            <i class="fas fa-sign-in-alt mr-2"></i>
            Se connecter
          </button>
          <button 
            id="tabSignup" 
            class="flex-1 py-2.5 px-4 rounded-md transition-all duration-200 font-medium"
            style="background: ${window.loginState.activeTab === 'signup' ? 'white' : 'transparent'}; color: ${window.loginState.activeTab === 'signup' ? '#1e3a8a' : 'white'};"
            onclick="switchLoginTab('signup')"
          >
            <i class="fas fa-user-plus mr-2"></i>
            Créer un compte
          </button>
        </div>

        <!-- Formulaire de connexion simplifié -->
        <form id="loginForm" class="space-y-4" style="display: ${window.loginState.activeTab === 'login' ? 'block' : 'none'};">
          <div class="input-group">
            <label class="input-label">Votre nom</label>
            <input type="text" id="loginEmail" class="input" placeholder="Guillaume PINOIT" required autocomplete="name" />
          </div>
          <button type="submit" class="btn btn-primary w-full">
            <i class="fas fa-sign-in-alt"></i>
            Se connecter
          </button>
        </form>

        <!-- Formulaire d'inscription simplifié -->
        <form id="signupForm" class="space-y-4" style="display: ${window.loginState.activeTab === 'signup' ? 'block' : 'none'};">
          <div class="input-group">
            <label class="input-label">Votre nom</label>
            <input type="text" id="signupName" class="input" placeholder="Guillaume PINOIT" required />
          </div>
          <button type="submit" class="btn btn-primary w-full">
            <i class="fas fa-user-plus"></i>
            Créer mon compte
          </button>
        </form>

      </div>
    </div>
  `;

  // Event listener pour la connexion
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('loginEmail').value;
    
    try {
      // Connexion simplifiée sans mot de passe
      await api.loginSimple(name);
      navigate('dashboard');
    } catch (error) {
      alert('Erreur de connexion : ' + (error.response?.data?.error || error.message));
    }
  });

  // Event listener pour l'inscription
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    
    try {
      // Connexion simplifiée (crée l'utilisateur s'il n'existe pas)
      await api.loginSimple(name);
      
      alert('✅ Bienvenue sur KARL CRM !');
      navigate('dashboard');
    } catch (error) {
      alert('Erreur lors de la création du compte : ' + (error.response?.data?.error || error.message));
    }
  });
}

// Fonction pour changer d'onglet
function switchLoginTab(tab) {
  window.loginState.activeTab = tab;
  renderLogin();
}

// Afficher la page "Mot de passe oublié"
function showForgotPassword() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 px-4">
      <div class="card" style="max-width: 480px; width: 100%;">
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl mb-4 shadow-lg">
            <i class="fas fa-key text-white text-3xl"></i>
          </div>
          <h1 class="text-2xl font-bold text-white">Mot de passe oublié</h1>
          <p class="text-gray-300 mt-2">Réinitialisez votre mot de passe</p>
        </div>

        <div id="forgotPasswordStep1" style="display: block;">
          <form id="forgotPasswordForm" class="space-y-4">
            <div class="input-group">
              <label class="input-label">Email</label>
              <input type="email" id="forgotEmail" class="input" placeholder="votre@email.fr" required />
            </div>
            <button type="submit" class="btn btn-primary w-full">
              <i class="fas fa-paper-plane"></i>
              Demander un code
            </button>
            <button type="button" onclick="renderLogin()" class="btn btn-secondary w-full">
              <i class="fas fa-arrow-left"></i>
              Retour à la connexion
            </button>
          </form>
        </div>

        <div id="forgotPasswordStep2" style="display: none;">
          <div class="bg-blue-900 bg-opacity-50 p-4 rounded-lg mb-4">
            <p class="text-white text-sm">
              <i class="fas fa-info-circle mr-2"></i>
              <strong>Code affiché dans la console</strong><br/>
              Appuyez sur <kbd class="bg-gray-700 px-2 py-1 rounded">F12</kbd> pour ouvrir la console et copier votre code.
            </p>
          </div>
          <form id="resetPasswordForm" class="space-y-4">
            <div class="input-group">
              <label class="input-label">Code de réinitialisation (6 chiffres)</label>
              <input type="text" id="resetCode" class="input" placeholder="123456" required maxlength="6" pattern="[0-9]{6}" />
            </div>
            <div class="input-group">
              <label class="input-label">Nouveau mot de passe</label>
              <input type="password" id="resetPassword" class="input" placeholder="••••••••" required minlength="8" />
            </div>
            <div class="input-group">
              <label class="input-label">Confirmer le mot de passe</label>
              <input type="password" id="resetPasswordConfirm" class="input" placeholder="••••••••" required minlength="8" />
            </div>
            <button type="submit" class="btn btn-success w-full">
              <i class="fas fa-check"></i>
              Réinitialiser le mot de passe
            </button>
            <button type="button" onclick="renderLogin()" class="btn btn-secondary w-full">
              <i class="fas fa-arrow-left"></i>
              Retour à la connexion
            </button>
          </form>
        </div>

      </div>
    </div>
  `;

  // Event listener pour demander le code
  document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      
      // Afficher le code dans la console
      console.log('🔐 CODE DE RÉINITIALISATION:', response.data.devCode);
      console.log('📧 Email:', email);
      
      alert('✅ Code généré ! Ouvrez la console (F12) pour le récupérer.\n\nLe code est aussi affiché ci-dessous : ' + response.data.devCode);
      
      // Sauvegarder l'email pour l'étape 2
      window.resetEmail = email;
      
      // Passer à l'étape 2
      document.getElementById('forgotPasswordStep1').style.display = 'none';
      document.getElementById('forgotPasswordStep2').style.display = 'block';
    } catch (error) {
      alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
    }
  });

  // Event listener pour réinitialiser le mot de passe
  document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('resetCode').value;
    const newPassword = document.getElementById('resetPassword').value;
    const confirmPassword = document.getElementById('resetPasswordConfirm').value;
    
    if (newPassword !== confirmPassword) {
      alert('❌ Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 8) {
      alert('❌ Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    try {
      await axios.post('/api/auth/reset-password', {
        email: window.resetEmail,
        code: code,
        newPassword: newPassword
      });
      
      alert('✅ Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.');
      renderLogin();
    } catch (error) {
      alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
    }
  });
}

function renderLayout(content) {
  const isMobile = window.innerWidth < 769;
  const unreadCount = state.notificationUnreadCount || 0;
  
  return `
    ${!isMobile ? `
      <aside class="desktop-sidebar">
        <div class="logo" style="background: #1a202c; padding: 1rem; margin: -1.5rem -1.5rem 1rem -1.5rem; border-bottom: 2px solid rgba(255,255,255,0.2);">
          <div class="logo-icon"><i class="fas fa-wolf-pack-battalion"></i></div>
          <div style="flex: 1;">
            <h2 style="font-size: 1.2rem; font-weight: 800; color: #ffffff; margin: 0; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">KARL</h2>
            <p style="font-size: 0.8rem; color: #ffffff; margin: 0.25rem 0 0 0; opacity: 0.8;">${state.user?.company_name || 'Mon Entreprise'}</p>
          </div>
          <button onclick="toggleNotifications()" style="background: rgba(255,255,255,0.1); border: none; cursor: pointer; color: #ffffff; font-size: 1.3rem; padding: 0.5rem; border-radius: 8px; position: relative; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
            <i class="fas fa-bell"></i>
            ${unreadCount > 0 ? `<span style="position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; border-radius: 12px; padding: 3px 7px; font-size: 0.7rem; font-weight: 700; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
          </button>
        </div>
        
        <!-- Horloge temps réel -->
        <div style="padding: 0.75rem 1rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <div id="header-date" style="font-size: 0.8rem; color: rgba(255,255,255,0.8); font-weight: 600; margin-bottom: 0.25rem;">
            Chargement...
          </div>
          <div id="header-time" style="font-size: 1.3rem; color: #ffffff; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 1.5px;">
            --:--:--
          </div>
        </div>
        <nav>
          <button class="${state.currentView === 'pipeline' ? 'active' : ''}" onclick="navigate('pipeline')">
            <i class="fas fa-columns"></i> Pipeline
          </button>
          <button class="${state.currentView === 'clients' ? 'active' : ''}" onclick="console.log('🔴 Clic Desktop Clients!'); navigate('clients')">
            <i class="fas fa-users"></i> Clients
          </button>
          <button class="${state.currentView === 'quotes' ? 'active' : ''}" onclick="navigate('quotes')">
            <i class="fas fa-file-invoice"></i> Devis
          </button>
          <button class="${state.currentView === 'calendar' ? 'active' : ''}" onclick="navigate('calendar')">
            <i class="fas fa-calendar-alt"></i> Calendrier
          </button>
          <button class="${state.currentView === 'settings' ? 'active' : ''}" onclick="navigate('settings')">
            <i class="fas fa-cog"></i> Paramètres
          </button>
          <button onclick="handleLogout()" style="margin-top: 2rem; color: var(--psm-danger);">
            <i class="fas fa-sign-out-alt"></i> Déconnexion
          </button>
        </nav>
      </aside>
      <main class="desktop-content">${content}</main>
    ` : `
      <div style="position: sticky; top: 0; background: white; color: #111827; z-index: 100; padding: 1rem; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
          <div style="flex: 1;">
            <h1 style="font-size: 1.5rem; font-weight: 800; color: #1f2937; margin: 0; line-height: 1.2;">KARL</h1>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0.25rem 0 0 0; font-weight: 500;">${state.user?.company_name || 'Mon Entreprise'}</p>
          </div>
          <button onclick="toggleNotifications()" style="background: #f3f4f6; border: none; cursor: pointer; color: #1f2937; font-size: 1.5rem; padding: 0.5rem; border-radius: 8px; position: relative;">
            <i class="fas fa-bell"></i>
            ${unreadCount > 0 ? `<span style="position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; border-radius: 12px; padding: 3px 7px; font-size: 0.7rem; font-weight: 700; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}
          </button>
        </div>
        
        <!-- Horloge mobile -->
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem;">
          <div id="header-date-mobile" style="color: #374151; font-weight: 600;">Chargement...</div>
          <div id="header-time-mobile" style="font-family: 'Courier New', monospace; font-weight: 700; color: #1f2937; font-size: 0.9rem; letter-spacing: 0.5px;">--:--:--</div>
        </div>
      </div>
      <main style="padding: 1rem; padding-bottom: 6rem; min-height: 100vh; background: var(--psm-bg);">
        ${content}
      </main>
      <div class="mobile-tabs">
        <button class="${state.currentView === 'pipeline' ? 'active' : ''}" onclick="navigate('pipeline')">
          <i class="fas fa-columns"></i>
          <span>Pipeline</span>
        </button>
        <button class="${state.currentView === 'clients' ? 'active' : ''}" onclick="console.log('🔴 Clic sur Clients!'); navigate('clients')">
          <i class="fas fa-users"></i>
          <span>Clients</span>
        </button>
        <button class="${state.currentView === 'quotes' ? 'active' : ''}" onclick="navigate('quotes')">
          <i class="fas fa-file-invoice"></i>
          <span>Devis</span>
        </button>
        <button class="${state.currentView === 'calendar' ? 'active' : ''}" onclick="navigate('calendar')">
          <i class="fas fa-calendar-alt"></i>
          <span>Calendrier</span>
        </button>
        <button onclick="navigate('settings')">
          <i class="fas fa-cog"></i>
          <span>Plus</span>
        </button>
      </div>
    `}
  `;
}

// ==================== NOTIFICATIONS ====================

// Charger les notifications
async function loadNotifications() {
  // ⚠️ Temporairement désactivé pour debug Gmail
  console.log('⚠️ loadNotifications désactivé temporairement');
  return;
  
  try {
    const data = await api.getNotifications();
    state.notifications = data.notifications || [];
    state.notificationUnreadCount = data.unread_count || 0;
    
    // Refresh le layout pour afficher le badge
    if (state.currentView !== 'login') {
      render();
    }
  } catch (err) {
    console.error('Erreur chargement notifications:', err);
  }
}

// Toggle dropdown notifications
function toggleNotifications() {
  state.notificationsVisible = !state.notificationsVisible;
  
  // Si on ouvre le dropdown
  if (state.notificationsVisible) {
    showNotificationsDropdown();
  } else {
    hideNotificationsDropdown();
  }
}

// Afficher le dropdown
function showNotificationsDropdown() {
  // Supprimer l'ancien dropdown s'il existe
  const existingDropdown = document.getElementById('notifications-dropdown');
  if (existingDropdown) {
    existingDropdown.remove();
  }
  
  // Créer le dropdown
  const dropdown = document.createElement('div');
  dropdown.id = 'notifications-dropdown';
  dropdown.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    width: 400px;
    max-width: 90vw;
    max-height: 500px;
    background: white; color: #111827;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    z-index: 1000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  `;
  
  // Header
  const header = `
    <div style="padding: 1rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; background: #f9fafb;">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <i class="fas fa-bell" style="color: #3b82f6;"></i>
        <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0; color: #111827;">Notifications</h3>
        ${state.notificationUnreadCount > 0 ? `<span style="background: #ef4444; color: white; border-radius: 10px; padding: 2px 8px; font-size: 0.75rem; font-weight: 700;">${state.notificationUnreadCount}</span>` : ''}
      </div>
      <div style="display: flex; gap: 0.5rem;">
        ${state.notificationUnreadCount > 0 ? `<button onclick="markAllNotificationsRead()" style="background: none; border: none; cursor: pointer; color: #3b82f6; font-size: 0.85rem;"><i class="fas fa-check-double"></i></button>` : ''}
        <button onclick="toggleNotifications()" style="background: none; border: none; cursor: pointer; color: #6b7280; font-size: 1.2rem;"><i class="fas fa-times"></i></button>
      </div>
    </div>
  `;
  
  // Liste des notifications
  const notificationsList = safeArray(state.notifications).length > 0 
    ? safeArray(state.notifications).map(notif => {
        const isUnread = notif.is_read === 0;
        const icon = {
          'quote_expiring': '⏰',
          'new_lead': '📬',
          'no_contact_7d': '⚠️',
          'quote_accepted': '🎉',
          'task_overdue': '⏰'
        }[notif.type] || '📌';
        
        const priorityColor = {
          'urgent': '#ef4444',
          'high': '#f59e0b',
          'normal': '#3b82f6',
          'low': '#9ca3af'
        }[notif.priority] || '#3b82f6';
        
        return `
          <div onclick="${notif.link ? `handleNotificationClick(${notif.id}, '${notif.link}')` : `markNotificationRead(${notif.id})`}" style="padding: 1rem; border-bottom: 1px solid #e5e7eb; cursor: pointer; display: flex; gap: 0.75rem; background: ${isUnread ? '#f0f9ff' : 'white'}; transition: all 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='${isUnread ? '#f0f9ff' : 'white'}'">
            <div style="font-size: 1.5rem; flex-shrink: 0;">${icon}</div>
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span style="font-weight: ${isUnread ? '700' : '600'}; font-size: 0.95rem; color: #111827;">${notif.title}</span>
                ${isUnread ? `<span style="width: 8px; height: 8px; background: ${priorityColor}; border-radius: 50%; flex-shrink: 0;"></span>` : ''}
              </div>
              <p style="font-size: 0.85rem; color: #374151; margin: 0; overflow: hidden; text-overflow: ellipsis;">${notif.message}</p>
              <span style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; display: block; font-weight: 600;">${formatRelativeTime(notif.created_at)}</span>
            </div>
            <button onclick="event.stopPropagation(); deleteNotification(${notif.id})" style="background: none; border: none; cursor: pointer; color: #9ca3af; align-self: flex-start; padding: 0.25rem;"><i class="fas fa-trash-alt"></i></button>
          </div>
        `;
      }).join('')
    : `<div style="padding: 3rem 1rem; text-align: center; color: #9ca3af;">
         <i class="fas fa-bell-slash" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
         <p style="margin: 0;">Aucune notification</p>
       </div>`;
  
  dropdown.innerHTML = `
    ${header}
    <div style="overflow-y: auto; flex: 1;">
      ${notificationsList}
    </div>
  `;
  
  document.body.appendChild(dropdown);
  
  // Fermer au clic à l'extérieur
  setTimeout(() => {
    document.addEventListener('click', closeNotificationsOnClickOutside);
  }, 100);
}

// Cacher le dropdown
function hideNotificationsDropdown() {
  const dropdown = document.getElementById('notifications-dropdown');
  if (dropdown) {
    dropdown.remove();
  }
  document.removeEventListener('click', closeNotificationsOnClickOutside);
}

// Fermer au clic à l'extérieur
function closeNotificationsOnClickOutside(event) {
  const dropdown = document.getElementById('notifications-dropdown');
  if (dropdown && !dropdown.contains(event.target)) {
    // Vérifier aussi si ce n'est pas le bouton toggle
    const toggleButton = event.target.closest('[onclick*="toggleNotifications"]');
    if (!toggleButton) {
      toggleNotifications();
    }
  }
}

// Marquer une notification comme lue et naviguer
async function handleNotificationClick(notificationId, link) {
  await markNotificationRead(notificationId);
  if (link) {
    window.location.hash = link;
  }
}

// Marquer une notification comme lue
async function markNotificationRead(notificationId) {
  try {
    await api.markNotificationRead(notificationId);
    await loadNotifications();
  } catch (err) {
    console.error('Erreur marquage notification:', err);
  }
}

// Marquer toutes les notifications comme lues
async function markAllNotificationsRead() {
  try {
    await api.markAllNotificationsRead();
    await loadNotifications();
  } catch (err) {
    console.error('Erreur marquage toutes notifications:', err);
  }
}

// Supprimer une notification
async function deleteNotification(notificationId) {
  try {
    await api.deleteNotification(notificationId);
    await loadNotifications();
  } catch (err) {
    console.error('Erreur suppression notification:', err);
  }
}

// Générer automatiquement les notifications
async function generateNotifications() {
  try {
    await api.generateNotifications();
    await loadNotifications();
  } catch (err) {
    console.error('Erreur génération notifications:', err);
  }
}

// PIPELINE - Vue liste (par défaut)
async function renderPipeline() {
  console.log('📊 renderPipeline() appelé');
  console.trace('📍 Stack trace:');
  // Si filterStatus existe, afficher le Kanban filtré
  if (state.filterStatus) {
    return renderPipelineKanban(state.filterStatus);
  }
  
  // Sinon, afficher la liste des statuts
  state.deals = await api.getDeals();
  
  const statuses = [
    { key: 'lead', label: 'Lead', icon: 'fa-star', color: '#3b82f6' },
    { key: 'rdv_planifie', label: 'RDV planifié', icon: 'fa-calendar', color: '#8b5cf6' },
    { key: 'devis_a_faire', label: 'Devis à faire', icon: 'fa-edit', color: '#f59e0b' },
    { key: 'devis_envoye', label: 'Devis envoyé', icon: 'fa-paper-plane', color: '#10b981' },
    { key: 'relance', label: 'Relance', icon: 'fa-phone', color: '#ef4444' },
    { key: 'signe', label: 'Signé', icon: 'fa-check-circle', color: '#22c55e' },
  ];
  
  const statusRows = statuses.map(status => {
    const count = safeArray(state.deals).filter(d => (d.status || d.stage) === status.key).length;
    return `
      <div class="card mb-3" style="cursor: pointer; border-left: 4px solid ${status.color};" onclick="openPipelineStatus('${status.key}')">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div style="width: 48px; height: 48px; background: ${status.color}; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
              <i class="fas ${status.icon}" style="font-size: 1.5rem; color: white;"></i>
            </div>
            <div>
              <h3 class="font-bold text-white text-lg">${status.label}</h3>
              <p class="text-sm text-gray-300">${count} dossier${count > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge" style="background: ${status.color}; color: white; font-size: 1.25rem; padding: 0.5rem 1rem;">${count}</span>
            <i class="fas fa-chevron-right text-gray-400"></i>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  const content = `
    <div class="card-header">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-white"><i class="fas fa-columns"></i> Pipeline</h2>
        <div class="flex gap-2">
          <button class="btn btn-primary" onclick="openQuickLeadModal()" style="font-size: 1.1rem; padding: 0.75rem 1.5rem;">
            <i class="fas fa-plus-circle"></i> Nouveau Lead
          </button>
          <button class="btn btn-secondary" onclick="api.exportDeals()" title="Exporter en CSV">
            <i class="fas fa-download"></i>
          </button>
        </div>
      </div>
    </div>
    ${statusRows}
  `;
  
  document.getElementById('app').innerHTML = renderLayout(content);
}

// PIPELINE - Vue Kanban (quand on clique sur un statut)
async function renderPipelineKanban(filterStatus = null) {
  state.deals = await api.getDeals();
  
  const statuses = [
    { key: 'lead', label: 'Lead', icon: 'fa-star' },
    { key: 'rdv_planifie', label: 'RDV planifié', icon: 'fa-calendar' },
    { key: 'devis_a_faire', label: 'Devis à faire', icon: 'fa-edit' },
    { key: 'devis_envoye', label: 'Devis envoyé', icon: 'fa-paper-plane' },
    { key: 'relance', label: 'Relance', icon: 'fa-phone' },
    { key: 'signe', label: 'Signé', icon: 'fa-check-circle' },
  ];
  
  // Si filterStatus, afficher seulement ce statut
  const displayStatuses = filterStatus ? statuses.filter(s => s.key === filterStatus) : statuses;

  const columns = displayStatuses.map(status => {
    const deals = safeArray(state.deals).filter(d => (d.status || d.stage) === status.key);
    const cardsHTML = safeArray(deals).map(deal => {
      // Priorité : nom du contact (name) > first_name+last_name > title > client_name
      const contactName = deal.name || `${deal.first_name || ''} ${deal.last_name || ''}`.trim();
      const dealName = contactName || deal.title || deal.client_name || 'Sans nom';
      const dealType = deal.type || deal.title || 'Dossier';
      const dealAmount = deal.estimated_amount || deal.amount || 0;
      return `
      <div 
        class="kanban-card" 
        onclick="console.log('\uD83D\uDDB1\uFE0F Clic sur deal #${deal.id}'); viewDealModal(${deal.id})" 
        style="cursor: pointer;"
        data-deal-id="${deal.id}"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="badge badge-primary">#${deal.id}</span>
          <span class="text-xs text-gray-400 uppercase">${dealType}</span>
        </div>
        <h4 class="font-bold text-white mb-2">${dealName}</h4>
        ${deal.company ? `<p class="text-sm text-gray-300 mb-2"><i class="fas fa-building"></i> ${deal.company}</p>` : ''}
        ${deal.phone ? `<p class="text-sm text-gray-300 mb-1"><i class="fas fa-phone"></i> ${deal.phone}</p>` : ''}
        ${deal.email ? `<p class="text-sm text-gray-300 mb-2" style="word-break: break-word;"><i class="fas fa-envelope"></i> ${deal.email}</p>` : ''}
        ${dealAmount ? `<p class="text-sm font-semibold text-blue-400 mt-2">${formatCurrency(dealAmount)}</p>` : ''}
        ${deal.rdv_date ? `<p class="text-xs text-gray-400 mt-2"><i class="fas fa-calendar-alt"></i> ${formatDate(deal.rdv_date)}</p>` : ''}
      </div>
    `;
    }).join('');

    return `
      <div class="kanban-column">
        <div class="kanban-column-header">
          <div class="kanban-column-title">
            <i class="fas ${status.icon}"></i>
            ${status.label}
          </div>
          <span class="kanban-column-count">${deals.length}</span>
        </div>
        <div class="kanban-cards">${cardsHTML || '<p class="text-center text-gray-400 text-sm py-4">Aucun dossier</p>'}</div>
      </div>
    `;
  }).join('');
  
  const statusInfo = statuses.find(s => s.key === filterStatus);

  const content = `
    <div class="card-header">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          ${filterStatus ? `<button class="btn btn-secondary" onclick="closePipelineStatus()"><i class="fas fa-arrow-left"></i> Retour</button>` : ''}
          <h2 class="text-2xl font-bold text-white"><i class="fas ${statusInfo ? statusInfo.icon : 'fa-columns'}"></i> ${statusInfo ? statusInfo.label : 'Pipeline'}</h2>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          ${filterStatus === 'lead' ? `
            <button class="btn btn-success" onclick="openCreateLeadModal()" title="Créer un Lead rapide">
              <i class="fas fa-star"></i> Nouveau Lead
            </button>
          ` : ''}
          <button class="btn btn-primary" onclick="openCreateDealModal()">
            <i class="fas fa-plus"></i> Nouveau dossier
          </button>
        </div>
      </div>
    </div>
    <div class="kanban-board">${columns}</div>
    <button class="fab" onclick="openCreateDealModal()"><i class="fas fa-plus"></i></button>
  `;

  document.getElementById('app').innerHTML = renderLayout(content);
}

// CLIENTS

async function renderClients() {
  console.log('🔵 renderClients() appelé');
  
  // État de tri (alphabétique par défaut)
  if (!window.clientsSortOrder) {
    window.clientsSortOrder = 'alpha'; // 'alpha', 'date-recent', 'date-old'
  }
  
  try {
    state.clients = await api.getClients();
    console.log('✅ Clients récupérés:', safeArray(state.clients).length);
  } catch (error) {
    console.error('❌ Erreur lors du chargement des clients:', error);
    alert('Erreur lors du chargement des clients: ' + error.message);
    return;
  }
  
  // Trier les clients
  const sortedClients = [...safeArray(state.clients)];
  if (window.clientsSortOrder === 'alpha') {
    sortedClients.sort((a, b) => {
      const nameA = (a.name || `Client #${a.id}`).toLowerCase();
      const nameB = (b.name || `Client #${b.id}`).toLowerCase();
      return nameA.localeCompare(nameB, 'fr');
    });
  } else if (window.clientsSortOrder === 'date-recent') {
    // Tri par date (plus récent en premier)
    sortedClients.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
  } else {
    // Tri par date (plus ancien en premier)
    sortedClients.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateA - dateB;
      return dateB - dateA;
    });
  }
  
  const clientsHTML = sortedClients.map(client => {
    const displayName = client.name || `Client #${client.id}`;
    const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
    
    return `
    <div class="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors border border-gray-700" onclick="openEditClientModal(${client.id})">
      <div class="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        ${initials}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-white truncate">${displayName}</div>
        <div class="text-sm text-gray-400 truncate">
          ${client.phone ? `📞 ${client.phone}` : ''}
          ${client.phone && client.email ? ' • ' : ''}
          ${client.email ? `✉️ ${client.email}` : ''}
        </div>
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <button class="p-2 hover:bg-gray-600 rounded transition-colors" onclick="event.stopPropagation(); openClientDossier(${client.id})" title="Dossier">
          <i class="fas fa-folder text-blue-400"></i>
        </button>
        <button class="p-2 hover:bg-red-600 rounded transition-colors" onclick="event.stopPropagation(); confirmDeleteClient(${client.id})" title="Supprimer">
          <i class="fas fa-trash text-red-400"></i>
        </button>
      </div>
    </div>
    `;
  }).join('');

  const content = `
    <div class="card-header">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-white"><i class="fas fa-users"></i> Clients (${sortedClients.length})</h2>
        <div class="flex gap-2">
          <button class="btn ${window.clientsSortOrder === 'alpha' ? 'btn-primary' : 'btn-secondary'}" onclick="window.clientsSortOrder = 'alpha'; renderClients();" title="Tri alphabétique">
            <i class="fas fa-sort-alpha-down"></i> A-Z
          </button>
          <button class="btn ${window.clientsSortOrder === 'date-recent' ? 'btn-primary' : 'btn-secondary'}" onclick="window.clientsSortOrder = 'date-recent'; renderClients();" title="Plus récent en premier">
            <i class="fas fa-arrow-down"></i> Récent
          </button>
          <button class="btn ${window.clientsSortOrder === 'date-old' ? 'btn-primary' : 'btn-secondary'}" onclick="window.clientsSortOrder = 'date-old'; renderClients();" title="Plus ancien en premier">
            <i class="fas fa-arrow-up"></i> Ancien
          </button>
          <button class="btn btn-secondary" onclick="api.exportClients()" title="Exporter en CSV">
            <i class="fas fa-download"></i> Exporter
          </button>
          <button class="btn btn-primary" onclick="openCreateClientModal()">
            <i class="fas fa-plus"></i> Nouveau
          </button>
        </div>
      </div>
      <div class="mt-4">
        <input type="search" class="input" placeholder="🔍 Rechercher un client..." onkeyup="filterClients(this.value)" />
      </div>
    </div>
    <div class="space-y-2 p-4" id="clientsList">${clientsHTML}</div>
    <button class="fab" onclick="openCreateClientModal()"><i class="fas fa-plus"></i></button>
  `;

  console.log('🔵 Rendu HTML des clients...');
  document.getElementById('app').innerHTML = renderLayout(content);
  console.log('✅ Page Clients affichée');
}

// QUOTES - Vue tableau professionnelle type Gestion-Com

async function renderQuotes() {
  // État de tri (plus récent par défaut)
  if (!window.quotesSortOrder) {
    window.quotesSortOrder = 'recent'; // 'recent' ou 'old'
  }
  
  state.quotes = await api.getQuotes();
  
  // Trier les devis
  const sortedQuotes = [...safeArray(state.quotes)];
  if (window.quotesSortOrder === 'recent') {
    sortedQuotes.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA; // Plus récent en premier
    });
  } else {
    sortedQuotes.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateA - dateB; // Plus ancien en premier
    });
  }
  
  const statusColors = {
    'draft': 'warning',
    'sent': 'primary',
    'accepted': 'success',
    'rejected': 'danger',
    'invoiced': 'success',
  };
  
  const statusLabels = {
    'draft': 'Brouillon',
    'sent': 'Envoyé',
    'accepted': 'Accepté',
    'rejected': 'Refusé',
    'invoiced': 'Facturé',
  };

  const quotesHTML = sortedQuotes.map(quote => {
    const clientName = quote.client_name || 'Client inconnu';
    const quoteNumber = quote.number || `#${quote.id}`;
    const totalTTC = quote.total_ttc || 0;
    const depositAmount = quote.deposit_amount || 0;
    const remainingAmount = totalTTC - depositAmount;
    
    return `
    <tr class="hover:bg-gray-700 cursor-pointer" onclick="editQuote(${quote.id})">
      <td class="p-3 border-b border-gray-700 text-xs text-gray-400">${formatRelativeTime(quote.created_at)}</td>
      <td class="p-3 border-b border-gray-700">${quote.valid_until ? formatDate(quote.valid_until) : '—'}</td>
      <td class="p-3 border-b border-gray-700">${clientName}</td>
      <td class="p-3 border-b border-gray-700">
        <div class="font-medium">${quoteNumber}</div>
        ${quote.notes ? `<div class="text-xs text-gray-400">${quote.notes.substring(0, 30)}...</div>` : ''}
      </td>
      <td class="p-3 border-b border-gray-700 text-right font-bold">${totalTTC.toFixed(2)} €</td>
      <td class="p-3 border-b border-gray-700 text-right font-bold">${remainingAmount.toFixed(2)} €</td>
      <td class="p-3 border-b border-gray-700">
        <span class="badge badge-${statusColors[quote.status] || 'secondary'}">${statusLabels[quote.status] || quote.status}</span>
      </td>
    </tr>
  `;
  }).join('');

  const content = `
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-white">
          <i class="fas fa-file-invoice"></i> Devis (${sortedQuotes.length})
        </h2>
        <div class="flex gap-2">
          <button class="btn ${window.quotesSortOrder === 'recent' ? 'btn-primary' : 'btn-secondary'}" onclick="window.quotesSortOrder = 'recent'; renderQuotes();" title="Plus récent en premier">
            <i class="fas fa-arrow-down"></i> Récent
          </button>
          <button class="btn ${window.quotesSortOrder === 'old' ? 'btn-primary' : 'btn-secondary'}" onclick="window.quotesSortOrder = 'old'; renderQuotes();" title="Plus ancien en premier">
            <i class="fas fa-arrow-up"></i> Ancien
          </button>
          <button class="btn btn-secondary" onclick="api.exportQuotes()" title="Exporter en CSV">
            <i class="fas fa-download"></i> Exporter
          </button>
          <button class="btn btn-primary" onclick="openNewQuoteModal()">
            <i class="fas fa-plus"></i> Nouveau devis
          </button>
        </div>
      </div>
      
      <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <table class="w-full text-sm">
          <thead class="bg-gray-900 text-gray-300">
            <tr>
              <th class="p-3 text-left">Date</th>
              <th class="p-3 text-left">Validité</th>
              <th class="p-3 text-left">Client</th>
              <th class="p-3 text-left">N° / Libellé</th>
              <th class="p-3 text-right">Montant TTC</th>
              <th class="p-3 text-right">Reste à facturer</th>
              <th class="p-3 text-left">État</th>
            </tr>
          </thead>
          <tbody class="text-gray-200">
            ${quotesHTML}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('app').innerHTML = renderLayout(content);
}

// Fonction pour éditer un devis
// ==================== NEW QUOTE (EMPTY EDITOR) ====================

async function openNewQuoteModal() {
  // Charger les clients si pas déjà fait
  if (!state.clients || state.clients.length === 0) {
    try {
      console.log('📥 Chargement des clients...');
      state.clients = await api.getClients();
      console.log('✅ Clients chargés:', state.clients.length);
    } catch (error) {
      console.error('❌ Erreur chargement clients:', error);
      alert('Erreur lors du chargement des clients');
      return;
    }
  }

  // État local de l'éditeur (vide)
  window.currentQuote = {
    id: null,
    number: 'Nouveau devis',
    deal_id: null,
    validity_days: 30,
    deposit_rate: 50,
    status: 'brouillon'
  };
  window.quoteLines = [];
  
  const content = `
    <div class="p-4">
      <!-- En-tête du devis -->
      <div class="bg-gray-800 rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-2xl font-bold text-white">Nouveau devis</h2>
            <p class="text-gray-400 text-sm">Créé le ${formatDate(new Date().toISOString())}</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-secondary" onclick="navigate('quotes')">
              <i class="fas fa-arrow-left"></i> Retour
            </button>
            <button class="btn btn-success" onclick="saveNewQuote()">
              <i class="fas fa-save"></i> Créer le devis
            </button>
          </div>
        </div>
        
        <!-- Sélection client et paramètres -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label class="text-gray-400 mb-2 block">Client *</label>
            <select id="quote_client_id" class="w-full bg-gray-700 text-white p-3 rounded border border-gray-600" 
              onchange="updateClientInfo()" required>
              <option value="">Sélectionner un client...</option>
              ${safeArray(state.clients).map(c => `
                <option value="${c.id}" 
                  data-firstname="${c.first_name}" 
                  data-lastname="${c.last_name}"
                  data-company="${c.company || ''}"
                  data-address="${c.address || ''}"
                  data-civility="${c.civility || ''}">
                  ${c.civility || ''} ${c.first_name} ${c.last_name} ${c.company ? '(' + c.company + ')' : ''}
                </option>
              `).join('')}
            </select>
            <div id="selectedClientInfo" class="mt-2 text-gray-300 text-sm hidden">
              <!-- Infos client affichées ici après sélection -->
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-gray-400 text-xs">Validité (jours)</label>
              <input type="number" id="validity_days" value="15" 
                class="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
            </div>
            <div>
              <label class="text-gray-400 text-xs">Acompte (%)</label>
              <input type="number" id="deposit_rate" value="50" 
                class="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" 
                onchange="calculateTotals()" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Version MOBILE : Cartes (visible < 768px) -->
      <div class="md:hidden space-y-3 mb-4" id="quoteLinesCards">
        <!-- Cartes générées dynamiquement -->
      </div>
      
      <div class="md:hidden bg-gray-800 rounded-lg p-3 mb-4">
        <button class="btn btn-primary btn-sm w-full" onclick="openAddLineModal()">
          <i class="fas fa-plus"></i> Ajouter une ligne
        </button>
      </div>
      
      <!-- Version DESKTOP : Tableau (visible ≥ 768px) -->
      <div class="hidden md:block bg-gray-800 rounded-lg overflow-hidden mb-4">
        <table class="w-full text-sm" id="quoteTable">
          <thead class="bg-gray-900 text-gray-300">
            <tr>
              <th class="p-2 text-left w-8">#</th>
              <th class="p-2 text-left">Libellé</th>
              <th class="p-2 text-center w-20">Qté</th>
              <th class="p-2 text-center w-24">Unité</th>
              <th class="p-2 text-right w-32">Prix U. HT</th>
              <th class="p-2 text-center w-20">TVA</th>
              <th class="p-2 text-right w-32">Total HT</th>
              <th class="p-2 w-16"></th>
            </tr>
          </thead>
          <tbody id="quoteLinesBody" class="text-gray-200">
            <!-- Lignes générées dynamiquement -->
          </tbody>
        </table>
        
        <div class="p-3 bg-gray-900 border-t border-gray-700">
          <button class="btn btn-primary btn-sm" onclick="openAddLineModal()">
            <i class="fas fa-plus"></i> Ajouter une ligne
          </button>
        </div>
      </div>
      
      <!-- Totaux -->
      <div class="bg-gray-800 rounded-lg p-4">
        <div class="flex justify-end">
          <div class="w-80 space-y-2 text-sm">
            <div class="flex justify-between text-gray-300">
              <span>Total HT :</span>
              <span id="totalHT" class="font-medium">0,00 €</span>
            </div>
            <div class="flex justify-between text-gray-300">
              <span>TVA :</span>
              <span id="totalTVA" class="font-medium">0,00 €</span>
            </div>
            <div class="flex justify-between text-white text-lg font-bold border-t border-gray-700 pt-2">
              <span>Total TTC :</span>
              <span id="totalTTC">0,00 €</span>
            </div>
            <div class="flex justify-between text-blue-400">
              <span>Acompte (<span id="depositPercent">50</span>%) :</span>
              <span id="totalDeposit" class="font-medium">0,00 €</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('app').innerHTML = renderLayout(content);
  
  // Render les lignes (vide au départ)
  renderQuoteLines();
  calculateTotals();
}

// Mettre à jour les infos client après sélection
function updateClientInfo() {
  const select = document.getElementById('quote_client_id');
  const infoDiv = document.getElementById('selectedClientInfo');
  
  if (!select.value) {
    infoDiv.classList.add('hidden');
    return;
  }
  
  const option = select.options[select.selectedIndex];
  const civility = option.getAttribute('data-civility') || '';
  const firstName = option.getAttribute('data-firstname');
  const lastName = option.getAttribute('data-lastname');
  const company = option.getAttribute('data-company');
  const address = option.getAttribute('data-address');
  
  let html = `<p class="font-medium">${civility} ${firstName} ${lastName}</p>`;
  if (company) html += `<p>${company}</p>`;
  if (address) html += `<p>${address}</p>`;
  
  infoDiv.innerHTML = html;
  infoDiv.classList.remove('hidden');
}

// Sauvegarder le nouveau devis
async function saveNewQuote() {
  const clientId = document.getElementById('quote_client_id').value;
  
  if (!clientId) {
    alert('⚠️ Veuillez sélectionner un client');
    return;
  }
  
  if (window.quoteLines.length === 0) {
    alert('⚠️ Veuillez ajouter au moins une ligne au devis');
    return;
  }
  
  try {
    // 1. Charger les deals si pas encore chargés
    if (!state.deals) {
      state.deals = await api.getDeals();
    }
    
    // 2. Vérifier si le client a un dossier
    let deals = safeArray(state.deals).filter(d => d.client_id === parseInt(clientId));
    let dealId;
    
    if (deals.length === 0) {
      // Créer un dossier automatiquement
      const dealData = {
        client_id: parseInt(clientId),
        type: 'devis_direct',
        status: 'devis_a_faire',
        notes: 'Dossier créé automatiquement pour devis'
      };
      
      const newDeal = await api.createDeal(dealData);
      dealId = newDeal.id;
      
      // Recharger les dossiers
      state.deals = await api.getDeals();
    } else if (deals.length === 1) {
      // Utiliser le dossier existant
      dealId = deals[0].id;
    } else {
      // Si plusieurs dossiers, demander de choisir
      alert('⚠️ Ce client a plusieurs dossiers. Utilisez la création depuis un dossier spécifique.');
      return;
    }
    
    // 2. Créer le devis
    const validityDays = parseInt(document.getElementById('validity_days').value || 30);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);
    
    const quoteData = {
      deal_id: dealId,
      client_id: parseInt(clientId),
      deposit_rate: parseFloat(document.getElementById('deposit_rate').value || 50),
      vat_rate: 10, // TODO: calculer depuis les lignes
      validity_days: validityDays,
      valid_until: validUntil.toISOString().split('T')[0],
      items: window.quoteLines.map((line, index) => ({
        title: line.title,
        description: line.description || null,
        qty: parseFloat(line.qty),
        unit: line.unit,
        unit_price_ht: parseFloat(line.unit_price_ht),
        vat_rate: parseFloat(line.vat_rate || 10),
        discount_percent: parseFloat(line.discount_percent || 0),
        position: index,
        item_type: 'product'
      }))
    };
    
    const quote = await api.createQuote(quoteData);
    
    alert('✅ Devis ' + quote.number + ' créé avec succès !');
    
    // Rafraîchir et retourner à la liste
    state.quotes = await api.getQuotes();
    navigate('quotes');
  } catch (error) {
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// ==================== EDIT QUOTE (EXISTING) ====================

async function editQuote(quoteId) {
  const quote = await api.getQuote(quoteId);
  
  // État local de l'éditeur
  window.currentQuote = quote;
  window.quoteLines = quote.items || [];
  
  const content = `
    <div class="p-4">
      <!-- En-tête du devis -->
      <div class="bg-gray-800 rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-2xl font-bold text-white">Devis n° ${quote.number}</h2>
            <p class="text-gray-400 text-sm">Créé le ${formatDate(quote.created_at)}</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-secondary" onclick="navigate('quotes')">
              <i class="fas fa-arrow-left"></i> Retour
            </button>
            <button class="btn btn-success" onclick="saveQuote()">
              <i class="fas fa-save"></i> Enregistrer
            </button>
            <button class="btn btn-primary" onclick="downloadQuotePDF(${quoteId})">
              <i class="fas fa-file-pdf"></i> PDF
            </button>
          </div>
        </div>
        
        <!-- Infos client et paramètres -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-gray-400 mb-1">Client</p>
            <p class="text-white font-medium">${quote.first_name} ${quote.last_name}</p>
            <p class="text-gray-300">${quote.company || ''}</p>
            <p class="text-gray-300">${quote.address || ''}</p>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-gray-400 text-xs">Validité (jours)</label>
              <input type="number" id="validity_days" value="${quote.validity_days || 30}" 
                class="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
            </div>
            <div>
              <label class="text-gray-400 text-xs">Acompte (%)</label>
              <input type="number" id="deposit_rate" value="${quote.deposit_rate || 30}" 
                class="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" 
                onchange="calculateTotals()" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Version MOBILE : Cartes (visible < 768px) -->
      <div class="md:hidden space-y-3 mb-4" id="quoteLinesCards">
        <!-- Cartes générées dynamiquement -->
      </div>
      
      <div class="md:hidden bg-gray-800 rounded-lg p-3 mb-4">
        <button class="btn btn-primary btn-sm w-full" onclick="openAddLineModal()">
          <i class="fas fa-plus"></i> Ajouter une ligne
        </button>
      </div>
      
      <!-- Version DESKTOP : Tableau (visible ≥ 768px) -->
      <div class="hidden md:block bg-gray-800 rounded-lg overflow-hidden mb-4">
        <table class="w-full text-sm" id="quoteTable">
          <thead class="bg-gray-900 text-gray-300">
            <tr>
              <th class="p-2 text-left w-8">#</th>
              <th class="p-2 text-left">Libellé</th>
              <th class="p-2 text-center w-20">Qté</th>
              <th class="p-2 text-center w-24">Unité</th>
              <th class="p-2 text-right w-32">Prix U. HT</th>
              <th class="p-2 text-center w-20">TVA</th>
              <th class="p-2 text-right w-32">Total HT</th>
              <th class="p-2 w-16"></th>
            </tr>
          </thead>
          <tbody id="quoteLinesBody" class="text-gray-200">
            <!-- Lignes générées dynamiquement -->
          </tbody>
        </table>
        
        <div class="p-3 bg-gray-900 border-t border-gray-700">
          <button class="btn btn-primary btn-sm" onclick="openAddLineModal()">
            <i class="fas fa-plus"></i> Ajouter une ligne
          </button>
        </div>
      </div>
      
      <!-- Totaux -->
      <div class="bg-gray-800 rounded-lg p-4">
        <div class="flex justify-end">
          <div class="w-80 space-y-2 text-sm">
            <div class="flex justify-between text-gray-300">
              <span>Total HT :</span>
              <span id="totalHT" class="font-medium">0,00 €</span>
            </div>
            <div class="flex justify-between text-gray-300">
              <span>TVA :</span>
              <span id="totalTVA" class="font-medium">0,00 €</span>
            </div>
            <div class="flex justify-between text-white text-lg font-bold border-t border-gray-700 pt-2">
              <span>Total TTC :</span>
              <span id="totalTTC">0,00 €</span>
            </div>
            <div class="flex justify-between text-blue-400">
              <span>Acompte (<span id="depositPercent">30</span>%) :</span>
              <span id="totalDeposit" class="font-medium">0,00 €</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('app').innerHTML = renderLayout(content);
  
  // Render les lignes existantes
  renderQuoteLines();
  calculateTotals();
}

// Render les lignes du devis
function renderQuoteLines() {
  const tbody = document.getElementById('quoteLinesBody');
  const mobileContainer = document.getElementById('quoteLinesCards');
  
  if (!tbody && !mobileContainer) return;
  
  // Version DESKTOP (tableau)
  if (tbody) {
    tbody.innerHTML = window.quoteLines.map((line, index) => `
      <tr class="hover:bg-gray-700">
        <td class="p-2 text-gray-400">${index + 1}</td>
        <td class="p-2">
          <div class="font-semibold text-white">${line.title || 'Sans titre'}</div>
          <div class="text-xs text-gray-400 mt-1">${line.description || ''}</div>
        </td>
        <td class="p-2 text-center text-white">
          <input type="number" value="${line.qty}" step="0.01" min="0" 
            class="w-20 bg-gray-700 text-white p-1 rounded border border-gray-600 text-center"
            onchange="updateLine(${index}, 'qty', parseFloat(this.value)); renderQuoteLines()" />
        </td>
        <td class="p-2 text-center text-white">${line.unit || 'pce'}</td>
        <td class="p-2 text-right text-white">
          <input type="number" value="${parseFloat(line.unit_price_ht).toFixed(2)}" step="0.01" min="0" 
            class="w-28 bg-gray-700 text-white p-1 rounded border border-gray-600 text-right"
            onchange="updateLine(${index}, 'unit_price_ht', parseFloat(this.value)); renderQuoteLines()" />
        </td>
        <td class="p-2 text-center text-white">
          <select class="bg-gray-700 text-white p-1 rounded border border-gray-600"
            onchange="updateLine(${index}, 'vat_rate', parseFloat(this.value)); renderQuoteLines()">
            <option value="0" ${line.vat_rate == 0 ? 'selected' : ''}>0%</option>
            <option value="5.5" ${line.vat_rate == 5.5 ? 'selected' : ''}>5,5%</option>
            <option value="10" ${line.vat_rate == 10 ? 'selected' : ''}>10%</option>
            <option value="20" ${line.vat_rate == 20 ? 'selected' : ''}>20%</option>
          </select>
        </td>
        <td class="p-2 text-right font-medium text-white">${(line.qty * line.unit_price_ht).toFixed(2)} €</td>
        <td class="p-2 relative">
          <button class="text-gray-400 hover:text-white" onclick="toggleLineMenu(${index})" title="Actions">
            <i class="fas fa-ellipsis-v"></i>
          </button>
          <div id="line-menu-${index}" class="hidden absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-700">
            <div class="py-1">
              <button onclick="openEditLineModal(${index}); toggleLineMenu(${index})" class="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700 flex items-center gap-2">
                <i class="fas fa-edit w-4"></i> Modifier
              </button>
              <button onclick="duplicateLine(${index}); toggleLineMenu(${index})" class="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-gray-700 flex items-center gap-2">
                <i class="fas fa-copy w-4"></i> Dupliquer
              </button>
              ${index > 0 ? `
                <button onclick="moveLineUp(${index}); toggleLineMenu(${index})" class="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 flex items-center gap-2">
                  <i class="fas fa-arrow-up w-4"></i> Monter
                </button>
              ` : ''}
              ${index < window.quoteLines.length - 1 ? `
                <button onclick="moveLineDown(${index}); toggleLineMenu(${index})" class="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 flex items-center gap-2">
                  <i class="fas fa-arrow-down w-4"></i> Descendre
                </button>
              ` : ''}
              <hr class="border-gray-700 my-1">
              <button onclick="removeLine(${index}); toggleLineMenu(${index})" class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2">
                <i class="fas fa-trash w-4"></i> Supprimer
              </button>
            </div>
          </div>
        </td>
      </tr>
    `).join('');
  }
  
  // Version MOBILE (cartes)
  if (mobileContainer) {
    mobileContainer.innerHTML = window.quoteLines.map((line, index) => `
      <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 relative">
        <div class="absolute top-3 right-3">
          <button class="text-gray-400 hover:text-white" onclick="toggleLineMenu(${index})" title="Actions">
            <i class="fas fa-ellipsis-v"></i>
          </button>
          <div id="line-menu-${index}" class="hidden absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-700">
            <div class="py-1">
              <button onclick="openEditLineModal(${index}); toggleLineMenu(${index})" class="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-gray-700 flex items-center gap-2">
                <i class="fas fa-edit w-4"></i> Modifier
              </button>
              <button onclick="duplicateLine(${index}); toggleLineMenu(${index})" class="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-gray-700 flex items-center gap-2">
                <i class="fas fa-copy w-4"></i> Dupliquer
              </button>
              ${index > 0 ? `
                <button onclick="moveLineUp(${index}); toggleLineMenu(${index})" class="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 flex items-center gap-2">
                  <i class="fas fa-arrow-up w-4"></i> Monter
                </button>
              ` : ''}
              ${index < window.quoteLines.length - 1 ? `
                <button onclick="moveLineDown(${index}); toggleLineMenu(${index})" class="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 flex items-center gap-2">
                  <i class="fas fa-arrow-down w-4"></i> Descendre
                </button>
              ` : ''}
              <hr class="border-gray-700 my-1">
              <button onclick="removeLine(${index}); toggleLineMenu(${index})" class="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2">
                <i class="fas fa-trash w-4"></i> Supprimer
              </button>
            </div>
          </div>
        </div>
        
        <div class="mb-3">
          <div class="text-sm text-gray-400 mb-1">Ligne #${index + 1}</div>
          <div class="font-semibold text-white text-lg">${line.title || 'Sans titre'}</div>
          ${line.description ? `<div class="text-sm text-gray-400 mt-1">${line.description}</div>` : ''}
        </div>
        
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div class="text-gray-400">Quantité</div>
            <div class="text-white font-medium">${line.qty} ${line.unit || 'pce'}</div>
          </div>
          <div>
            <div class="text-gray-400">Prix unitaire HT</div>
            <div class="text-white font-medium">${parseFloat(line.unit_price_ht).toFixed(2)} €</div>
          </div>
          <div>
            <div class="text-gray-400">TVA</div>
            <div class="text-white font-medium">${line.vat_rate || 10}%</div>
          </div>
          <div>
            <div class="text-gray-400">Total HT</div>
            <div class="text-white font-bold text-lg">${(line.qty * line.unit_price_ht).toFixed(2)} €</div>
          </div>
        </div>
      </div>
    `).join('');
  }
}

// Ouvrir la modale d'édition de ligne
function openEditLineModal(index) {
  const line = window.quoteLines[index];
  if (!line) return;

  const modalHTML = `
    <div class="modal-backdrop" id="edit-line-modal" onclick="if(event.target.id === 'edit-line-modal') closeEditLineModal()">
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3><i class="fas fa-edit"></i> Modifier la ligne</h3>
          <button class="modal-close" onclick="closeEditLineModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="input-group">
            <label class="input-label">Libellé *</label>
            <input type="text" id="edit-line-title" class="input" value="${line.title || ''}" placeholder="Portail coulissant" />
          </div>

          <div class="input-group">
            <label class="input-label">Description</label>
            <textarea id="edit-line-description" class="input" rows="3" placeholder="Détails de la prestation...">${line.description || ''}</textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="input-group">
              <label class="input-label">Quantité *</label>
              <input type="number" id="edit-line-qty" class="input" value="${line.qty}" step="0.01" min="0" />
            </div>

            <div class="input-group">
              <label class="input-label">Unité</label>
              <select id="edit-line-unit" class="input">
                <option value="pce" ${line.unit === 'pce' ? 'selected' : ''}>Pièce (pce)</option>
                <option value="forfait" ${line.unit === 'forfait' ? 'selected' : ''}>Forfait</option>
                <option value="ml" ${line.unit === 'ml' ? 'selected' : ''}>Mètre linéaire (ml)</option>
                <option value="m2" ${line.unit === 'm2' ? 'selected' : ''}>Mètre carré (m²)</option>
                <option value="h" ${line.unit === 'h' ? 'selected' : ''}>Heure (h)</option>
                <option value="j" ${line.unit === 'j' ? 'selected' : ''}>Jour (j)</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="input-group">
              <label class="input-label">Prix unitaire HT *</label>
              <input type="number" id="edit-line-price" class="input" value="${parseFloat(line.unit_price_ht).toFixed(2)}" step="0.01" min="0" />
            </div>

            <div class="input-group">
              <label class="input-label">TVA (%)</label>
              <select id="edit-line-vat" class="input">
                <option value="0" ${line.vat_rate == 0 ? 'selected' : ''}>0%</option>
                <option value="5.5" ${line.vat_rate == 5.5 ? 'selected' : ''}>5,5%</option>
                <option value="10" ${line.vat_rate == 10 ? 'selected' : ''}>10%</option>
                <option value="20" ${line.vat_rate == 20 ? 'selected' : ''}>20%</option>
              </select>
            </div>
          </div>

          <div class="bg-gray-700 p-3 rounded mt-4">
            <div class="flex justify-between text-white">
              <span>Total HT :</span>
              <span class="font-bold" id="edit-line-total">0,00 €</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeEditLineModal()">
            <i class="fas fa-times"></i> Annuler
          </button>
          <button class="btn btn-primary" onclick="saveEditedLine(${index})">
            <i class="fas fa-save"></i> Enregistrer
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Calculer le total en temps réel
  const updateTotal = () => {
    const qty = parseFloat(document.getElementById('edit-line-qty').value) || 0;
    const price = parseFloat(document.getElementById('edit-line-price').value) || 0;
    const total = qty * price;
    document.getElementById('edit-line-total').textContent = total.toFixed(2) + ' €';
  };

  document.getElementById('edit-line-qty').addEventListener('input', updateTotal);
  document.getElementById('edit-line-price').addEventListener('input', updateTotal);
  updateTotal();
}

// Fermer la modale d'édition
function closeEditLineModal() {
  document.getElementById('edit-line-modal')?.remove();
}

// Sauvegarder la ligne modifiée
function saveEditedLine(index) {
  const title = document.getElementById('edit-line-title').value.trim();
  const description = document.getElementById('edit-line-description').value.trim();
  const qty = parseFloat(document.getElementById('edit-line-qty').value) || 1;
  const unit = document.getElementById('edit-line-unit').value;
  const price = parseFloat(document.getElementById('edit-line-price').value) || 0;
  const vat = parseFloat(document.getElementById('edit-line-vat').value) || 10;

  if (!title) {
    alert('Le libellé est obligatoire');
    return;
  }

  window.quoteLines[index] = {
    title,
    description,
    qty,
    unit,
    unit_price_ht: price,
    vat_rate: vat
  };

  closeEditLineModal();
  renderQuoteLines();
  calculateTotals();
}

// Dupliquer une ligne
function duplicateLine(index) {
  const line = window.quoteLines[index];
  if (!line) return;

  const duplicate = {
    ...line,
    title: line.title + ' (copie)'
  };

  window.quoteLines.splice(index + 1, 0, duplicate);
  renderQuoteLines();
  calculateTotals();
}

// Monter une ligne
function moveLineUp(index) {
  if (index === 0) return;

  const temp = window.quoteLines[index];
  window.quoteLines[index] = window.quoteLines[index - 1];
  window.quoteLines[index - 1] = temp;

  renderQuoteLines();
}

// Descendre une ligne
function moveLineDown(index) {
  if (index === window.quoteLines.length - 1) return;

  const temp = window.quoteLines[index];
  window.quoteLines[index] = window.quoteLines[index + 1];
  window.quoteLines[index + 1] = temp;

  renderQuoteLines();
}

// Mettre à jour une ligne
function updateLine(index, field, value) {
  if (window.quoteLines[index]) {
    window.quoteLines[index][field] = value;
    calculateTotals();
  }
}

// Calculer les totaux
function calculateTotals() {
  let totalHT = 0;
  let totalTVA = 0;
  
  window.quoteLines.forEach(line => {
    const lineHT = line.qty * line.unit_price_ht;
    const lineTVA = lineHT * ((line.vat_rate || 10) / 100);
    totalHT += lineHT;
    totalTVA += lineTVA;
  });
  
  const totalTTC = totalHT + totalTVA;
  const depositRate = parseFloat(document.getElementById('deposit_rate')?.value || 30);
  const totalDeposit = totalTTC * (depositRate / 100);
  
  document.getElementById('totalHT').textContent = totalHT.toFixed(2) + ' €';
  document.getElementById('totalTVA').textContent = totalTVA.toFixed(2) + ' €';
  document.getElementById('totalTTC').textContent = totalTTC.toFixed(2) + ' €';
  document.getElementById('totalDeposit').textContent = totalDeposit.toFixed(2) + ' €';
  document.getElementById('depositPercent').textContent = depositRate;
}

// Supprimer une ligne
function removeLine(index) {
  if (confirm('Supprimer cette ligne ?')) {
    window.quoteLines.splice(index, 1);
    renderQuoteLines();
    calculateTotals();
  }
}

// Toggle menu actions ligne
function toggleLineMenu(index) {
  const menu = document.getElementById(`line-menu-${index}`);
  if (!menu) return;
  
  // Fermer tous les autres menus
  document.querySelectorAll('[id^="line-menu-"]').forEach(m => {
    if (m.id !== `line-menu-${index}`) {
      m.classList.add('hidden');
    }
  });
  
  // Toggle le menu actuel
  menu.classList.toggle('hidden');
}

// Fermer les menus si on clique ailleurs
document.addEventListener('click', (e) => {
  if (!e.target.closest('[onclick^="toggleLineMenu"]') && !e.target.closest('[id^="line-menu-"]')) {
    document.querySelectorAll('[id^="line-menu-"]').forEach(m => m.classList.add('hidden'));
  }
});

// Catalogue PSM - Articles prédéfinis
const CATALOG_PSM = [
  {
    title: 'Moteur portail coulissant Nice Robus Hi Speed 250',
    description: '1 Opérateur\n2 Émetteurs (3 Canaux)\n1 Paire de photocellule\n1 Lampe clignotante\n* 10 secondes pour un portail de 4m\nGarantie 4 Ans',
    unit: 'pce',
    unit_price_ht: 875.00,
    vat_rate: 10
  },
  {
    title: 'Pose Motorisation',
    description: 'Mise en place des moteurs\nMise en place de la logique de commande\nMise en place des accessoires (photocellules, lampe clignotante...)\nRéglage, programmation et mise en service',
    unit: 'pce',
    unit_price_ht: 340.00,
    vat_rate: 10
  },
  {
    title: 'Préparation de câblage',
    description: 'Préparation câblage électrique',
    unit: 'h',
    unit_price_ht: 175.00,
    vat_rate: 10
  },
  {
    title: 'Photo cellule à pile radio',
    description: 'Photo cellule à pile radio pour communication avec le moteur',
    unit: 'pce',
    unit_price_ht: 125.00,
    vat_rate: 10
  },
  {
    title: 'Télécommande supplémentaire',
    description: 'Télécommande additionnelle 3 canaux',
    unit: 'pce',
    unit_price_ht: 35.00,
    vat_rate: 20
  },
  {
    title: 'Changement moteur coulissant sur portail existant',
    description: 'Remplacement moteur défaillant',
    unit: 'forfait',
    unit_price_ht: 450.00,
    vat_rate: 10
  },
  {
    title: 'Câblage ok pour alimentation',
    description: 'Préparation câblage alimentation électrique',
    unit: 'forfait',
    unit_price_ht: 180.00,
    vat_rate: 10
  },
  {
    title: 'Masque câblage pour photo cellule et feu clignotant',
    description: 'Installation gaine technique protection câblage',
    unit: 'forfait',
    unit_price_ht: 95.00,
    vat_rate: 10
  },
  {
    title: 'Portail coulissant alu 4m',
    description: 'Portail coulissant aluminium sur mesure 4m\nLames horizontales 200mm\nCouleur RAL au choix\nMotorisation intégrée',
    unit: 'forfait',
    unit_price_ht: 3500.00,
    vat_rate: 10
  },
  {
    title: 'Portail battant alu 2 vantaux 3,50m',
    description: 'Portail battant aluminium 2 vantaux\nLargeur totale 3,50m\nLames horizontales 200mm\nCouleur RAL au choix',
    unit: 'forfait',
    unit_price_ht: 2800.00,
    vat_rate: 10
  },
  {
    title: 'Portillon assorti',
    description: 'Portillon alu assorti au portail\nLargeur 1m\nSerrure 3 points',
    unit: 'pce',
    unit_price_ht: 850.00,
    vat_rate: 10
  },
  {
    title: 'Pose portail coulissant',
    description: 'Installation complète portail coulissant\nScellement piliers\nRéglage et mise en service',
    unit: 'forfait',
    unit_price_ht: 1200.00,
    vat_rate: 10
  },
  {
    title: 'Pose portail battant',
    description: 'Installation complète portail battant\nScellement gonds\nRéglage et mise en service',
    unit: 'forfait',
    unit_price_ht: 950.00,
    vat_rate: 10
  },
  {
    title: 'Clôture aluminium H 1,80m',
    description: 'Clôture alu lames horizontales\nHauteur 1,80m\nCouleur RAL au choix\nPoteaux alu',
    unit: 'ml',
    unit_price_ht: 180.00,
    vat_rate: 10
  },
  {
    title: 'Pose clôture alu',
    description: 'Installation clôture aluminium\nScellement poteaux\nMise à niveau',
    unit: 'ml',
    unit_price_ht: 45.00,
    vat_rate: 10
  }
];

// Modal pour ajouter une ligne depuis le catalogue
function openAddLineModal() {
  const catalogHTML = CATALOG_PSM.map((item, index) => `
    <div class="bg-gray-700 p-3 rounded hover:bg-gray-600 cursor-pointer mb-2" onclick="selectCatalogItem(${index})">
      <div class="flex justify-between items-start mb-1">
        <div class="font-medium text-white flex-1">${item.title}</div>
        <div class="text-right ml-4">
          <div class="text-blue-400 font-bold">${item.unit_price_ht.toFixed(2)} €</div>
          <div class="text-xs text-gray-400">${item.unit} - TVA ${item.vat_rate}%</div>
        </div>
      </div>
      ${item.description ? `<div class="text-xs text-gray-300 whitespace-pre-line">${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</div>` : ''}
    </div>
  `).join('');
  
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 800px;">
        <div class="modal-header">
          <h3><i class="fas fa-list"></i> Catalogue PSM</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body" style="max-height: 600px; overflow-y: auto;">
          <div class="mb-4">
            <input type="search" id="catalogSearch" placeholder="🔍 Rechercher un article..." 
              class="w-full bg-gray-700 text-white p-3 rounded border border-gray-600"
              onkeyup="filterCatalog(this.value)" />
          </div>
          <div id="catalogList">
            ${catalogHTML}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          <button class="btn btn-primary" onclick="selectCatalogItem(-1)">
            <i class="fas fa-plus"></i> Ligne personnalisée
          </button>
        </div>
      </div>
    </div>
  `);
}

// Sélectionner un article du catalogue
function selectCatalogItem(index) {
  const item = index >= 0 ? CATALOG_PSM[index] : {
    title: '',
    description: '',
    unit: 'pce',
    unit_price_ht: 0,
    vat_rate: 10
  };
  
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fas fa-edit"></i> ${index >= 0 ? 'Ajouter une ligne' : 'Ligne personnalisée'}</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-white">Libellé *</label>
            <input type="text" id="lineTitle" value="${item.title}" 
              class="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" 
              placeholder="Ex: Portail coulissant aluminium 4m" />
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2 text-white">Description</label>
            <textarea id="lineDescription" rows="4" 
              class="w-full bg-gray-700 text-white p-2 rounded border border-gray-600"
              placeholder="Détails techniques, spécifications...">${item.description || ''}</textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-2 text-white">Quantité</label>
              <input type="number" id="lineQty" value="1" step="0.01" min="0" 
                class="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" 
                onchange="updateLinePreview()" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2 text-white">Unité</label>
              <select id="lineUnit" class="w-full bg-gray-700 text-white p-2 rounded border border-gray-600">
                <option value="pce" ${item.unit === 'pce' ? 'selected' : ''}>pce (pièce)</option>
                <option value="h" ${item.unit === 'h' ? 'selected' : ''}>h (heure)</option>
                <option value="ml" ${item.unit === 'ml' ? 'selected' : ''}>ml (mètre linéaire)</option>
                <option value="m2" ${item.unit === 'm2' ? 'selected' : ''}>m² (mètre carré)</option>
                <option value="forfait" ${item.unit === 'forfait' ? 'selected' : ''}>forfait</option>
              </select>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-2 text-white">Prix unitaire HT (€)</label>
              <input type="number" id="linePriceHT" value="${item.unit_price_ht}" step="0.01" min="0" 
                class="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" 
                onchange="updateLinePreview()" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2 text-white">TVA (%)</label>
              <select id="lineVAT" class="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" onchange="updateLinePreview()">
                <option value="0" ${item.vat_rate === 0 ? 'selected' : ''}>0% (Exonéré)</option>
                <option value="5.5" ${item.vat_rate === 5.5 ? 'selected' : ''}>5,5% (Réduit)</option>
                <option value="10" ${item.vat_rate === 10 ? 'selected' : ''}>10% (Intermédiaire)</option>
                <option value="20" ${item.vat_rate === 20 ? 'selected' : ''}>20% (Normal)</option>
              </select>
            </div>
          </div>
          
          <div class="bg-gray-700 p-3 rounded">
            <div class="flex justify-between text-sm mb-1">
              <span>Total HT :</span>
              <span id="previewHT" class="font-medium">0,00 €</span>
            </div>
            <div class="flex justify-between text-sm mb-1">
              <span>TVA :</span>
              <span id="previewTVA" class="font-medium">0,00 €</span>
            </div>
            <div class="flex justify-between font-bold text-blue-400">
              <span>Total TTC :</span>
              <span id="previewTTC">0,00 €</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="openAddLineModal()">
            <i class="fas fa-arrow-left"></i> Retour
          </button>
          <button class="btn btn-success" onclick="addLineToQuote()">
            <i class="fas fa-check"></i> Ajouter
          </button>
        </div>
      </div>
    </div>
  `);
  
  updateLinePreview();
}

// Mettre à jour l'aperçu de la ligne
function updateLinePreview() {
  const qty = parseFloat(document.getElementById('lineQty')?.value || 0);
  const priceHT = parseFloat(document.getElementById('linePriceHT')?.value || 0);
  const vatRate = parseFloat(document.getElementById('lineVAT')?.value || 10);
  
  const totalHT = qty * priceHT;
  const totalTVA = totalHT * (vatRate / 100);
  const totalTTC = totalHT + totalTVA;
  
  document.getElementById('previewHT').textContent = totalHT.toFixed(2) + ' €';
  document.getElementById('previewTVA').textContent = totalTVA.toFixed(2) + ' €';
  document.getElementById('previewTTC').textContent = totalTTC.toFixed(2) + ' €';
}

// Ajouter la ligne au devis
function addLineToQuote() {
  const newLine = {
    title: document.getElementById('lineTitle').value,
    description: document.getElementById('lineDescription').value,
    qty: parseFloat(document.getElementById('lineQty').value),
    unit: document.getElementById('lineUnit').value,
    unit_price_ht: parseFloat(document.getElementById('linePriceHT').value),
    vat_rate: parseFloat(document.getElementById('lineVAT').value)
  };
  
  window.quoteLines.push(newLine);
  closeModal();
  renderQuoteLines();
  calculateTotals();
}

// Filtrer le catalogue
function filterCatalog(search) {
  const filtered = CATALOG_PSM.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
  );
  
  const catalogHTML = filtered.map((item, index) => `
    <div class="bg-gray-700 p-3 rounded hover:bg-gray-600 cursor-pointer mb-2" onclick="selectCatalogItem(${CATALOG_PSM.indexOf(item)})">
      <div class="flex justify-between items-start mb-1">
        <div class="font-medium text-white flex-1">${item.title}</div>
        <div class="text-right ml-4">
          <div class="text-blue-400 font-bold">${item.unit_price_ht.toFixed(2)} €</div>
          <div class="text-xs text-gray-400">${item.unit} - TVA ${item.vat_rate}%</div>
        </div>
      </div>
      ${item.description ? `<div class="text-xs text-gray-300 whitespace-pre-line">${item.description.substring(0, 100)}${item.description.length > 100 ? '...' : ''}</div>` : ''}
    </div>
  `).join('');
  
  document.getElementById('catalogList').innerHTML = catalogHTML || '<p class="text-gray-400 text-center py-4">Aucun article trouvé</p>';
}

// Ligne personnalisée
function openCustomLineModal() {
  selectCatalogItem(-1); // Utilise la même modale mais avec des valeurs vides
  document.getElementById('lineTitle').value = '';
  document.getElementById('lineDescription').value = '';
  document.getElementById('lineQty').value = '1';
  document.getElementById('linePriceHT').value = '0';
  updateLinePreview();
}

// Sauvegarder le devis
async function saveQuote() {
  const quote = window.currentQuote;
  const items = window.quoteLines;
  
  // Déterminer si on est en mode édition ou création
  const isEditMode = document.getElementById('edit_quote_status') !== null;
  
  const data = {
    status: isEditMode 
      ? document.getElementById('edit_quote_status')?.value 
      : (quote?.status || 'brouillon'),
    deposit_rate: parseFloat(
      isEditMode 
        ? document.getElementById('edit_deposit_percent')?.value 
        : document.getElementById('deposit_rate')?.value
    ) || 50,
    validity_days: parseInt(
      isEditMode 
        ? document.getElementById('edit_validity_days')?.value 
        : document.getElementById('validity_days')?.value
    ) || 30,
    vat_rate: parseFloat(
      isEditMode 
        ? document.getElementById('edit_tva_percent')?.value 
        : document.getElementById('tva_percent')?.value
    ) || 20,
    items: items.map((item, index) => ({
      title: item.title,
      description: item.description,
      qty: item.qty,
      unit: item.unit,
      unit_price_ht: item.unit_price_ht,
      vat_rate: item.vat_rate || 10,
      position: index
    }))
  };
  
  try {
    await api.updateQuote(quote.id, data);
    alert('✅ Devis sauvegardé avec succès !');
    closeModal();
    navigate('quotes'); // Rafraîchir la liste
  } catch (error) {
    alert('❌ Erreur lors de la sauvegarde : ' + (error.response?.data?.error || error.message));
  }
}

// TASKS
async function renderTasks() {
  state.tasks = await api.getTasks();
  
  const pending = safeArray(state.tasks).filter(t => t.status === 'pending');
  const done = safeArray(state.tasks).filter(t => t.status === 'done');

  const taskHTML = (task) => `
    <div class="card">
      <div class="flex items-start gap-3">
        <input type="checkbox" ${task.status === 'done' ? 'checked' : ''} 
               onchange="toggleTask(${task.id}, this.checked)" 
               class="mt-1 w-5 h-5 cursor-pointer" />
        <div class="flex-1">
          <h4 class="font-semibold ${task.status === 'done' ? 'line-through text-gray-400' : 'text-white'}">${task.title}</h4>
          ${task.description ? `<p class="text-sm text-gray-300 mt-1">${task.description}</p>` : ''}
          ${task.due_date ? `<p class="text-xs text-gray-400 mt-2"><i class="fas fa-calendar"></i> Échéance ${formatRelativeTime(task.due_date)}</p>` : ''}
          ${task.deal_type ? `<span class="badge badge-primary mt-2">${task.deal_type}</span>` : ''}
        </div>
      </div>
    </div>
  `;

  const content = `
    <div class="card-header">
      <h2 class="text-2xl font-bold text-white"><i class="fas fa-tasks"></i> Tâches</h2>
    </div>
    
    <div class="mb-6">
      <h3 class="text-lg font-bold text-white mb-3">À faire (${pending.length})</h3>
      <div class="space-y-3">${pending.map(taskHTML).join('') || '<p class="text-gray-400 text-center py-6">Aucune tâche en attente</p>'}</div>
    </div>

    <div>
      <h3 class="text-lg font-bold text-white mb-3">Terminées (${done.length})</h3>
      <div class="space-y-3">${done.map(taskHTML).join('') || '<p class="text-gray-400 text-center py-6">Aucune tâche terminée</p>'}</div>
    </div>

    <button class="fab" onclick="openCreateTaskModal()"><i class="fas fa-plus"></i></button>
  `;

  document.getElementById('app').innerHTML = renderLayout(content);
}

// SETTINGS
function renderSettings() {
  const content = `
    <div class="card-header">
      <h2 class="text-2xl font-bold text-white"><i class="fas fa-cog"></i> Paramètres</h2>
    </div>
    
    <!-- Navigation rapide vers pages avancées -->
    <div class="card mb-4">
      <h3 class="font-bold text-white mb-3"><i class="fas fa-th"></i> Accès rapide</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem;">
        <button class="btn btn-secondary" onclick="navigate('tasks')" style="padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
          <i class="fas fa-tasks" style="font-size: 1.5rem;"></i>
          <span>Tâches</span>
        </button>
        <button class="btn btn-secondary" onclick="navigate('priority')" style="padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
          <i class="fas fa-fire" style="font-size: 1.5rem;"></i>
          <span>Priorité</span>
        </button>
        <button class="btn btn-secondary" onclick="navigate('reports')" style="padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
          <i class="fas fa-chart-bar" style="font-size: 1.5rem;"></i>
          <span>Rapports</span>
        </button>
        <button class="btn btn-secondary" onclick="navigate('trash')" style="padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
          <i class="fas fa-trash" style="font-size: 1.5rem;"></i>
          <span>Corbeille</span>
        </button>
      </div>
    </div>
    
    <div class="card mb-4">
      <h3 class="font-bold text-white mb-3"><i class="fas fa-building"></i> Personnalisation</h3>
      <div class="input-group">
        <label class="text-white">Nom de votre entreprise</label>
        <input 
          type="text" 
          id="companyNameInput" 
          class="input" 
          value="${state.user?.company_name || 'Mon Entreprise'}"
          placeholder="Ex: Atelier du Loup"
        >
      </div>
      <button class="btn btn-primary w-full mt-3" onclick="saveCompanyName()">
        <i class="fas fa-save"></i> Enregistrer
      </button>
    </div>
    
    <div class="card mb-4">
      <h3 class="font-bold text-white mb-3">Informations utilisateur</h3>
      <p class="text-sm text-gray-300 mb-2"><strong>Nom :</strong> ${state.user?.name}</p>
      <p class="text-sm text-gray-300 mb-2"><strong>Email :</strong> ${state.user?.email}</p>
      <p class="text-sm text-gray-300"><strong>Rôle :</strong> ${state.user?.role}</p>
    </div>
    
    <div class="card mb-4">
      <h3 class="font-bold text-white mb-3"><i class="fas fa-envelope"></i> Templates d'emails</h3>
      <p class="text-sm text-gray-300 mb-3">Utilisez des templates prédéfinis pour vos emails commerciaux avec différents tons.</p>
      <button class="btn btn-primary w-full" onclick="showEmailTemplateSelector({}, {})">
        <i class="fas fa-paper-plane"></i> Voir les templates
      </button>
    </div>
    
    <div class="card mb-4">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
          <i class="fas fa-robot" style="color: white;"></i>
        </div>
        <h3 class="font-bold text-white text-lg">🤖 Configuration de l'IA</h3>
      </div>
      
      <p class="text-sm text-gray-400 mb-4">
        Personnalisez le comportement de l'assistant IA selon vos besoins
      </p>
      
      <div class="space-y-4">
        <!-- Analyse d'emails -->
        <div>
          <label class="text-white font-semibold mb-2 block">
            📧 Instructions pour l'analyse d'emails
          </label>
          <textarea 
            id="aiEmailInstructions" 
            class="input" 
            rows="4"
            placeholder="Ex: Prioriser les projets de portails coulissants. Créer un Lead uniquement si le budget est supérieur à 3000€. Toujours noter la source 'Email entrant'..."
          >${state.aiConfig?.email_instructions || 'Analyser les emails entrants et créer des Leads qualifiés. Extraire : nom, email, téléphone, type de projet, budget estimé. Qualifier la priorité selon l\'urgence mentionnée.'}</textarea>
          <p class="text-xs text-gray-500 mt-1">
            💡 Définissez comment l'IA doit analyser et qualifier vos emails
          </p>
        </div>
        
        <!-- Création de Leads -->
        <div>
          <label class="text-white font-semibold mb-2 block">
            ⭐ Ton pour la création de Leads
          </label>
          <textarea 
            id="aiLeadTone" 
            class="input" 
            rows="3"
            placeholder="Ex: Utiliser un ton professionnel et chaleureux. Toujours proposer un RDV dans les 48h..."
          >${state.aiConfig?.lead_tone || 'Ton professionnel et accueillant. Mettre en avant notre expertise PSM et proposer systématiquement un RDV de prise de mesures.'}</textarea>
          <p class="text-xs text-gray-500 mt-1">
            💡 Comment l'IA doit-elle qualifier et présenter les nouveaux leads ?
          </p>
        </div>
        
        <!-- Critères de qualification -->
        <div>
          <label class="text-white font-semibold mb-2 block">
            🎯 Critères de qualification prioritaire
          </label>
          <textarea 
            id="aiQualificationCriteria" 
            class="input" 
            rows="3"
            placeholder="Ex: Budget > 5000€ = Haute priorité. Projet urgent (< 1 mois) = Haute priorité..."
          >${state.aiConfig?.qualification_criteria || 'Haute priorité : Budget > 5000€, Projet urgent (< 2 mois), Recommandation client. Moyenne : Budget 2000-5000€. Basse : Demande d\'info générale.'}</textarea>
          <p class="text-xs text-gray-500 mt-1">
            💡 Quels critères déterminent la priorité d'un Lead ?
          </p>
        </div>
        
        <!-- Style de relance -->
        <div>
          <label class="text-white font-semibold mb-2 block">
            📞 Style de communication pour relances
          </label>
          <textarea 
            id="aiFollowUpStyle" 
            class="input" 
            rows="3"
            placeholder="Ex: Relancer après 48h si pas de réponse. Utiliser un ton amical mais professionnel..."
          >${state.aiConfig?.followup_style || 'Relancer après 48h sans nouvelles. Ton courtois et professionnel. Rappeler notre expertise et disponibilité. Proposer des créneaux précis pour RDV.'}</textarea>
          <p class="text-xs text-gray-500 mt-1">
            💡 Comment l'IA doit-elle suggérer les relances ?
          </p>
        </div>
      </div>
      
      <button class="btn btn-primary w-full mt-4" onclick="saveAIConfig()">
        <i class="fas fa-save"></i> Enregistrer la configuration IA
      </button>
    </div>

    <div class="card">
      <h3 class="font-bold text-white mb-3">Actions</h3>
      <button class="btn btn-danger w-full" onclick="handleLogout()">
        <i class="fas fa-sign-out-alt"></i> Déconnexion
      </button>
    </div>
  `;

  document.getElementById('app').innerHTML = renderLayout(content);
}

function openCreateClientModal() {
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fas fa-user-plus"></i> Nouveau client</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="clientForm" class="modal-body">
          <div class="input-group">
            <label class="input-label">Civilité *</label>
            <select name="civility" class="input" required>
              <option value="">Choisir...</option>
              <option value="M.">M.</option>
              <option value="Mme">Mme</option>
              <option value="M. et Mme">M. et Mme</option>
            </select>
          </div>
          <div class="grid-2">
            <div class="input-group">
              <label class="input-label">Prénom *</label>
              <input type="text" name="first_name" class="input" required placeholder="Jean" />
            </div>
            <div class="input-group">
              <label class="input-label">Nom *</label>
              <input type="text" name="last_name" class="input" required placeholder="Dupont" />
            </div>
          </div>
          <div class="input-group">
            <label class="input-label">Société</label>
            <input type="text" name="company" class="input" placeholder="Entreprise Dupont SARL" />
          </div>
          <div class="input-group">
            <label class="input-label">Téléphone *</label>
            <input type="tel" name="phone" class="input" required placeholder="06 12 34 56 78" />
          </div>
          <div class="input-group">
            <label class="input-label">Email</label>
            <input type="email" name="email" class="input" placeholder="jean.dupont@email.fr" />
          </div>
          
          <div class="input-group">
            <label class="input-label">Adresse complète</label>
            <input type="text" name="address_street" id="address_street" class="input" placeholder="15 rue des Lilas" style="margin-bottom: 0.75rem;" />
            <div class="grid-2" style="gap: 0.75rem;">
              <input type="text" name="address_postal" id="address_postal" class="input" placeholder="Code postal" onchange="lookupCity(this.value)" />
              <select name="address_city" id="address_city" class="input">
                <option value="">Ville (saisir le CP d'abord)</option>
              </select>
            </div>
          </div>
          
          <div class="input-group">
            <label class="input-label">Source</label>
            <select name="source" class="input">
              <option value="">Choisir...</option>
              <option value="site_web">Site web</option>
              <option value="recommandation">Recommandation</option>
              <option value="publicite">Publicité</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Notes</label>
            <textarea name="notes" class="input" rows="2" placeholder="Informations complémentaires..."></textarea>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          <button class="btn btn-primary" onclick="submitClientForm()">
            <i class="fas fa-save"></i> Enregistrer
          </button>
        </div>
      </div>
    </div>
  `);
}

async function submitClientForm() {
  const form = document.getElementById('clientForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Combiner les champs d'adresse
  const street = data.address_street || '';
  const postal = data.address_postal || '';
  const city = data.address_city || '';
  
  data.address = [street, postal, city].filter(Boolean).join(', ');
  
  // Supprimer les champs temporaires
  delete data.address_street;
  delete data.address_postal;
  delete data.address_city;
  
  try {
    await api.createClient(data);
    closeModal();
    navigate('clients');
  } catch (error) {
    alert('Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// PIPELINE - Ouvrir un statut spécifique
function openPipelineStatus(status) {
  state.filterStatus = status;
  renderPipelineKanban(status);
}

// PIPELINE - Fermer le filtre et retourner à la liste
function closePipelineStatus() {
  state.filterStatus = null;
  renderPipeline();
}

// CREATE DEAL MODAL
function openCreateDealModal() {
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fas fa-folder-plus"></i> Nouveau dossier</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="dealForm" class="modal-body">
          <div class="input-group">
            <div class="flex items-center justify-between mb-2">
              <label class="input-label" style="margin-bottom: 0;">Client *</label>
              <button type="button" class="btn btn-sm btn-primary" onclick="openCreateClientFromDeal()">
                <i class="fas fa-user-plus"></i> Nouveau client
              </button>
            </div>
            <select name="client_id" id="dealClientSelect" class="input" required>
              <option value="">Sélectionner un client...</option>
              ${safeArray(state.clients).map(c => `<option value="${c.id}">${c.first_name} ${c.last_name} ${c.company ? '(' + c.company + ')' : ''}</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Type *</label>
            <select name="type" class="input" required>
              <option value="portail">Portail</option>
              <option value="portillon">Portillon</option>
              <option value="cloture">Clôture</option>
              <option value="ensemble">Ensemble</option>
              <option value="sav">SAV</option>
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Montant estimé (€)</label>
            <input type="number" name="estimated_amount" class="input" step="0.01" placeholder="Ex: 5000" />
          </div>
          
          <!-- Section RDV -->
          <div style="border-top: 1px solid var(--psm-border); margin: 1.5rem 0; padding-top: 1.5rem;">
            <h4 class="font-bold text-white mb-3" style="display: flex; align-items: center; gap: 0.5rem;">
              <i class="fas fa-calendar-plus" style="color: var(--psm-primary-light);"></i>
              Rendez-vous (optionnel)
            </h4>
            <p class="text-sm mb-3" style="color: var(--psm-text-muted);">
              Si vous planifiez un RDV, le dossier passera automatiquement en "RDV planifié"
            </p>
            
            <div class="input-group">
              <label class="input-label">
                <i class="fas fa-calendar"></i> Date et heure du RDV
              </label>
              <input type="datetime-local" name="rdv_date" id="rdv_date_input" class="input" />
            </div>
            <div class="input-group">
              <label class="input-label">
                <i class="fas fa-sticky-note"></i> Notes RDV
              </label>
              <textarea name="rdv_notes" class="input" rows="3" placeholder="Ex: Prise de mesures, accès par le côté gauche..."></textarea>
            </div>
          </div>
          
          <div class="input-group">
            <label class="input-label">Notes projet</label>
            <textarea name="notes" class="input" rows="2" placeholder="Détails du projet, demandes spécifiques..."></textarea>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          <button class="btn btn-primary" onclick="submitDealForm()">
            <i class="fas fa-save"></i> Créer le dossier
          </button>
        </div>
      </div>
    </div>
  `);
}

// CREATE CLIENT FROM DEAL (modale imbriquée)

function openCreateClientFromDeal() {
  // Sauvegarder l'état du formulaire dossier
  const dealForm = document.getElementById('dealForm');
  const dealFormData = new FormData(dealForm);
  window.tempDealData = Object.fromEntries(dealFormData);
  
  // Fermer la modale dossier
  closeModal();
  
  // Ouvrir la modale client
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fas fa-user-plus"></i> Nouveau client</h3>
          <button class="modal-close" onclick="cancelCreateClientFromDeal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="clientForm" class="modal-body">
          <div class="input-group">
            <label class="input-label">Civilité *</label>
            <select name="civility" class="input" required>
              <option value="">Choisir...</option>
              <option value="M.">M.</option>
              <option value="Mme">Mme</option>
              <option value="M. et Mme">M. et Mme</option>
            </select>
          </div>
          <div class="grid-2">
            <div class="input-group">
              <label class="input-label">Prénom *</label>
              <input type="text" name="first_name" class="input" required placeholder="Jean" />
            </div>
            <div class="input-group">
              <label class="input-label">Nom *</label>
              <input type="text" name="last_name" class="input" required placeholder="Dupont" />
            </div>
          </div>
          <div class="input-group">
            <label class="input-label">Société</label>
            <input type="text" name="company" class="input" placeholder="Entreprise Dupont SARL" />
          </div>
          <div class="input-group">
            <label class="input-label">Téléphone *</label>
            <input type="tel" name="phone" class="input" required placeholder="06 12 34 56 78" />
          </div>
          <div class="input-group">
            <label class="input-label">Email</label>
            <input type="email" name="email" class="input" placeholder="jean.dupont@email.fr" />
          </div>
          
          <div class="input-group">
            <label class="input-label">Adresse complète</label>
            <input type="text" name="address_street" id="address_street" class="input" placeholder="15 rue des Lilas" style="margin-bottom: 0.75rem;" />
            <div class="grid-2" style="gap: 0.75rem;">
              <input type="text" name="address_postal" id="address_postal" class="input" placeholder="Code postal" onchange="lookupCity(this.value)" />
              <select name="address_city" id="address_city" class="input">
                <option value="">Ville (saisir le CP d'abord)</option>
              </select>
            </div>
          </div>
          
          <div class="input-group">
            <label class="input-label">Source</label>
            <select name="source" class="input">
              <option value="">Choisir...</option>
              <option value="site_web">Site web</option>
              <option value="recommandation">Recommandation</option>
              <option value="publicite">Publicité</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Notes</label>
            <textarea name="notes" class="input" rows="2" placeholder="Informations complémentaires..."></textarea>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="cancelCreateClientFromDeal()">Annuler</button>
          <button class="btn btn-primary" onclick="submitClientFromDeal()">
            <i class="fas fa-save"></i> Enregistrer et continuer
          </button>
        </div>
      </div>
    </div>
  `);
}

async function submitClientFromDeal() {
  const form = document.getElementById('clientForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Combiner les champs d'adresse
  const street = data.address_street || '';
  const postal = data.address_postal || '';
  const city = data.address_city || '';
  
  data.address = [street, postal, city].filter(Boolean).join(', ');
  
  // Supprimer les champs temporaires
  delete data.address_street;
  delete data.address_postal;
  delete data.address_city;
  
  try {
    const result = await api.createClient(data);
    const newClientId = result.id;
    
    // Recharger la liste des clients
    state.clients = await api.getClients();
    
    // Fermer la modale client
    closeModal();
    
    // Rouvrir la modale dossier avec le nouveau client sélectionné
    openCreateDealModal();
    
    // Remplir le formulaire avec les données sauvegardées
    setTimeout(() => {
      const dealClientSelect = document.getElementById('dealClientSelect');
      if (dealClientSelect) {
        dealClientSelect.value = newClientId;
      }
      
      if (window.tempDealData) {
        const dealForm = document.getElementById('dealForm');
        if (dealForm) {
          Object.keys(window.tempDealData).forEach(key => {
            const input = dealForm.querySelector(`[name="${key}"]`);
            if (input && key !== 'client_id') {
              input.value = window.tempDealData[key];
            }
          });
        }
        delete window.tempDealData;
      }
    }, 100);
    
    alert(`Client ${data.first_name} ${data.last_name} créé avec succès !`);
  } catch (error) {
    alert('Erreur : ' + (error.response?.data?.error || error.message));
  }
}

function cancelCreateClientFromDeal() {
  closeModal();
  // Rouvrir la modale dossier
  openCreateDealModal();
  
  // Restaurer les données du formulaire
  setTimeout(() => {
    if (window.tempDealData) {
      const dealForm = document.getElementById('dealForm');
      if (dealForm) {
        Object.keys(window.tempDealData).forEach(key => {
          const input = dealForm.querySelector(`[name="${key}"]`);
          if (input) {
            input.value = window.tempDealData[key];
          }
        });
      }
      delete window.tempDealData;
    }
  }, 100);
}

async function submitDealForm() {
  const form = document.getElementById('dealForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  try {
    await api.createDeal(data);
    closeModal();
    navigate('pipeline');
  } catch (error) {
    alert('Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// VIEW DEAL MODAL (with Photos)
async function viewDealModal(dealId) {
  console.log('🔵 viewDealModal appelé avec dealId:', dealId);
  try {
    const deal = await api.getDeal(dealId);
    console.log('✅ Deal récupéré:', deal);
    state.currentDeal = deal;
    state.photos = await api.getPhotos(dealId);
    console.log('✅ Photos récupérées:', safeArray(state.photos).length);
  
    // Compatibilité ancien/nouveau format
    const dealName = deal.name || `${deal.first_name || ''} ${deal.last_name || ''}`.trim() || deal.title || deal.client_name || 'Sans nom';
    const dealStatus = deal.status || deal.stage || 'lead';
    const dealType = deal.type || deal.title || 'Dossier';
    const dealAmount = deal.estimated_amount || deal.amount || 0;
    const dealEmail = deal.email || deal.client_email || '';
    const dealPhone = deal.phone || deal.client_phone || '';
    const dealCompany = deal.company || '';
    
    showModal(`
      <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-folder-open"></i> Dossier #${deal.id} - ${dealName}</h3>
            <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <!-- Actions principales -->
            <div class="mb-4">
              <!-- Bouton principal selon statut -->
              ${getPrimaryActionButton(deal.id, dealStatus, deal.rdv_date)}
              
              <!-- Menu actions secondaires -->
              <div class="mt-2" style="position: relative; display: inline-block;">
                <button class="btn btn-secondary btn-sm" onclick="toggleDealActionsMenu(${deal.id})" id="dealActionsBtn_${deal.id}">
                  <i class="fas fa-ellipsis-v"></i> Autres actions
                </button>
                <div id="dealActionsMenu_${deal.id}" style="display: none; position: absolute; top: 100%; left: 0; background: #1f2937; border: 1px solid #374151; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.3); min-width: 200px; margin-top: 0.25rem; z-index: 1000;">
                  <button class="btn btn-sm" onclick="openEditLeadModal(${deal.id}); toggleDealActionsMenu(${deal.id})" style="width: 100%; text-align: left; border-radius: 0; border-bottom: 1px solid #374151;">
                    <i class="fas fa-edit"></i> Modifier le lead
                  </button>
                  <button class="btn btn-sm" onclick="openChangeStatusModal(${deal.id}, '${dealStatus}'); toggleDealActionsMenu(${deal.id})" style="width: 100%; text-align: left; border-radius: 0; border-bottom: 1px solid #374151;">
                    <i class="fas fa-arrow-right"></i> Changer statut
                  </button>
                  <button class="btn btn-sm" onclick="confirmArchiveDeal(${deal.id}); toggleDealActionsMenu(${deal.id})" style="width: 100%; text-align: left; border-radius: 0; color: #ef4444;">
                    <i class="fas fa-archive"></i> Archiver
                  </button>
                </div>
              </div>
            </div>
            
            <div class="mb-4">
              <h4 class="font-bold text-white mb-2">Informations</h4>
              <p class="text-sm mb-1"><strong>Type :</strong> ${dealType}</p>
              <p class="text-sm mb-1"><strong>Statut :</strong> <span class="badge badge-primary">${dealStatus}</span></p>
              ${dealAmount ? `<p class="text-sm mb-1"><strong>Montant estimé :</strong> ${formatCurrency(dealAmount)}</p>` : ''}
              ${deal.rdv_date ? `
                <p class="text-sm mb-1">
                  <strong>RDV :</strong> 
                  <span style="color: #10b981; font-weight: 600;">
                    <i class="fas fa-calendar-check"></i> ${formatDate(deal.rdv_date)}
                  </span>
                  <button 
                    onclick="exportRdvToCalendar(${deal.id})" 
                    class="btn btn-sm btn-success ml-2" 
                    style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                    title="Ajouter à Apple Calendar, Google Calendar, Outlook..."
                  >
                    <i class="fas fa-calendar-plus"></i> Calendrier
                  </button>
                </p>
              ` : '<p class="text-sm mb-1" style="color: #ef4444;"><strong>RDV :</strong> <i class="fas fa-calendar-times"></i> Pas de RDV planifié</p>'}
              ${deal.notes ? `<div class="text-sm mb-1 mt-2" style="background: #1f2937; padding: 0.75rem; border-radius: 8px; white-space: pre-wrap;">${deal.notes}</div>` : ''}
            </div>

            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-bold text-white">Client</h4>
                ${deal.client_id ? `<button class="btn btn-sm btn-secondary" onclick="openEditClientModal(${deal.client_id})" title="Modifier les informations du client">
                  <i class="fas fa-edit"></i> Modifier
                </button>` : ''}
              </div>
              <p class="text-sm mb-1"><strong>${dealName}</strong></p>
              ${dealCompany ? `<p class="text-sm mb-1"><i class="fas fa-building text-blue-500"></i> ${dealCompany}</p>` : ''}
              ${dealPhone ? `
                <p class="text-sm mb-1">
                  <i class="fas fa-phone text-blue-500"></i> 
                  <a href="tel:${dealPhone.replace(/\s/g, '')}" class="text-blue-400 hover:text-blue-300 underline" title="Appeler ${dealPhone}">
                    ${dealPhone}
                  </a>
                </p>
              ` : ''}
              ${dealEmail ? `
                <p class="text-sm mb-1">
                  <i class="fas fa-envelope text-blue-500"></i> 
                  <a href="mailto:${dealEmail}" class="text-blue-400 hover:text-blue-300 underline" title="Envoyer un email à ${dealEmail}">
                    ${dealEmail}
                  </a>
                </p>
              ` : ''}
              ${deal.client_address || deal.address || deal.client_zipcode || deal.client_city ? `
                <div class="text-sm mb-2 p-2 bg-gray-700/30 rounded" style="border-left: 3px solid #3b82f6;">
                  <div class="font-semibold text-blue-400 mb-1">
                    <i class="fas fa-map-marker-alt"></i> Adresse
                  </div>
                  <div class="text-gray-300">${deal.client_address || deal.address || ''}</div>
                  ${deal.client_zipcode || deal.client_city ? `
                    <div class="text-gray-300">${deal.client_zipcode || ''} ${deal.client_city || ''}</div>
                  ` : ''}
                  <a href="https://maps.google.com/?q=${encodeURIComponent(deal.client_address || deal.address || '')}" target="_blank" class="text-blue-400 hover:text-blue-300 text-xs mt-1 inline-block">
                    <i class="fas fa-external-link-alt"></i> Voir sur Google Maps
                  </a>
                </div>
              ` : ''}
              ${deal.client_notes ? `
                <div class="text-sm mb-2 p-2 bg-gray-700/30 rounded" style="border-left: 3px solid #f59e0b;">
                  <div class="font-semibold text-yellow-400 mb-1">
                    <i class="fas fa-sticky-note"></i> Notes
                  </div>
                  <div class="text-gray-300 whitespace-pre-wrap">${deal.client_notes}</div>
                </div>
              ` : ''}
              ${deal.source ? `<p class="text-sm mb-1" style="color: var(--psm-text-muted);"><i class="fas fa-tag"></i> Source : ${deal.source}</p>` : ''}
            </div>

            <div class="mb-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-bold text-white">Devis</h4>
                <button class="btn btn-sm btn-primary" onclick="openCreateQuoteModal(${deal.id})">
                  <i class="fas fa-file-invoice"></i> Créer un devis
                </button>
              </div>
              <div id="devisInfo">Chargement...</div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-bold text-white">Photos chantier (${safeArray(state.photos).length})</h4>
                <button class="btn btn-sm btn-primary" onclick="openCameraModal()">
                  <i class="fas fa-camera"></i> Ajouter
                </button>
              </div>
              <div class="photo-gallery" id="photoGallery">
                ${renderPhotoGallery()}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
          </div>
        </div>
      </div>
    `);
    
    // Load quotes for this deal
    loadDealQuotes(dealId);
  } catch (error) {
    console.error('❌ Erreur viewDealModal:', error);
    alert('❌ Erreur lors du chargement du dossier : ' + (error.message || 'Erreur inconnue'));
  }
}

// CONFIRM ARCHIVE DEAL (double confirmation)

// Helper: Toggle menu actions secondaires
function toggleDealActionsMenu(dealId) {
  const menu = document.getElementById(`dealActionsMenu_${dealId}`);
  if (!menu) return;
  
  if (menu.style.display === 'none') {
    menu.style.display = 'block';
    // Fermer le menu si on clique ailleurs
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!e.target.closest(`#dealActionsBtn_${dealId}`) && !e.target.closest(`#dealActionsMenu_${dealId}`)) {
          menu.style.display = 'none';
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  } else {
    menu.style.display = 'none';
  }
}

// Helper: Bouton principal selon statut
function getPrimaryActionButton(dealId, status, rdvDate) {
  // lead → Planifier RDV (vert)
  if (status === 'lead') {
    return `
      <button class="btn btn-primary" onclick="openScheduleRdvModal(${dealId})" style="width: 100%; padding: 1rem; font-size: 1.1rem; background: #10b981;">
        <i class="fas fa-calendar-plus"></i> 📅 Planifier le RDV
      </button>
    `;
  }
  
  // rdv_planifie → Créer le devis (vert)
  if (status === 'rdv_planifie') {
    return `
      <button class="btn btn-primary" onclick="openCreateQuoteModal(${dealId})" style="width: 100%; padding: 1rem; font-size: 1.1rem; background: #10b981;">
        <i class="fas fa-file-invoice"></i> 📝 Créer le devis
      </button>
    `;
  }
  
  // devis_a_faire → Créer le devis (orange)
  if (status === 'devis_a_faire') {
    return `
      <button class="btn btn-primary" onclick="openCreateQuoteModal(${dealId})" style="width: 100%; padding: 1rem; font-size: 1.1rem; background: #f59e0b;">
        <i class="fas fa-file-invoice"></i> 📝 Créer le devis
      </button>
    `;
  }
  
  // devis_envoye → Marquer comme signé (vert)
  if (status === 'devis_envoye') {
    return `
      <button class="btn btn-primary" onclick="markAsSigned(${dealId})" style="width: 100%; padding: 1rem; font-size: 1.1rem; background: #10b981;">
        <i class="fas fa-check-circle"></i> ✅ Marquer comme signé
      </button>
    `;
  }
  
  // relance → Créer devis ou contacter (bleu)
  if (status === 'relance') {
    return `
      <button class="btn btn-primary" onclick="openCreateQuoteModal(${dealId})" style="width: 100%; padding: 1rem; font-size: 1.1rem; background: #3b82f6;">
        <i class="fas fa-phone"></i> 📞 Relancer le client
      </button>
    `;
  }
  
  // signe → Voir le devis (vert foncé)
  if (status === 'signe') {
    return `
      <button class="btn btn-primary" onclick="openCreateQuoteModal(${dealId})" style="width: 100%; padding: 1rem; font-size: 1.1rem; background: #22c55e;">
        <i class="fas fa-check-double"></i> ✅ Devis signé - Voir le dossier
      </button>
    `;
  }
  
  // Défaut : actions principales combinées
  return `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
      <button class="btn btn-primary" onclick="openScheduleRdvModal(${dealId})" style="padding: 1rem;">
        <i class="fas fa-calendar-plus"></i> ${rdvDate ? 'Modifier RDV' : 'Planifier RDV'}
      </button>
      <button class="btn btn-primary" onclick="openCreateQuoteModal(${dealId})" style="padding: 1rem;">
        <i class="fas fa-file-invoice"></i> Créer devis
      </button>
    </div>
  `;
}

// Helper: Marquer comme signé
async function markAsSigned(dealId) {
  if (!confirm('Marquer ce devis comme signé ?')) return;
  
  try {
    await api.updateDeal(dealId, { stage: 'signe', status: 'signe' });
    showToast('✅ Devis marqué comme signé !', 'success');
    closeModal();
    navigate('pipeline');
  } catch (error) {
    console.error('Erreur:', error);
    showToast('❌ Erreur lors de la mise à jour', 'danger');
  }
}

async function loadDealQuotes(dealId) {
  try {
    const response = await axios.get(`${API_URL}/api/quotes?deal_id=${dealId}`);
    const quotes = safeArray(response.data.quotes || response.data);
    const devisInfo = document.getElementById('devisInfo');
    if (!devisInfo) return;
    
    if (quotes.length === 0) {
      devisInfo.innerHTML = '<p class="text-sm text-gray-400">Aucun devis pour ce dossier</p>';
    } else {
      devisInfo.innerHTML = quotes.map(q => `
        <div class="card mb-2" style="padding: 0.75rem; cursor: pointer;" onclick="editQuote(${q.id})">
          <div class="flex items-center justify-between">
            <div>
              <strong>${q.quote_number || 'Devis #' + q.id}</strong>
              <span class="badge badge-${q.status === 'brouillon' ? 'gray' : q.status === 'envoye' ? 'primary' : q.status === 'accepte' ? 'success' : 'danger'} ml-2">${q.status || 'brouillon'}</span>
            </div>
            <span class="text-xs text-gray-400">${q.created_at ? formatRelativeTime(q.created_at) : ''}</span>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading quotes:', error);
    const devisInfo = document.getElementById('devisInfo');
    if (devisInfo) {
      devisInfo.innerHTML = '<p class="text-sm text-gray-400">Aucun devis pour ce dossier</p>';
    }
  }
}

function renderPhotoGallery() {
  if (!safeArray(state.photos).length) {
    return '<p class="text-gray-400 text-sm">Aucune photo pour l\'instant</p>';
  }
  return safeArray(state.photos).map(photo => `
    <div class="photo-item">
      <img src="${photo.file_url}" alt="Photo chantier" />
      <button class="photo-item-delete" onclick="deletePhoto(${photo.id})">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');
}

// CAMERA MODAL
function openCameraModal() {
  showModal(`
    <div class="modal-backdrop" id="cameraModalBackdrop" onclick="closeCameraModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fas fa-camera"></i> Prendre une photo</h3>
          <button class="modal-close" onclick="closeCameraModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div style="position: relative; background: #000; border-radius: 12px; overflow: hidden;">
            <video id="cameraVideo" autoplay playsinline style="width: 100%; display: block; max-height: 400px; object-fit: cover;"></video>
            <canvas id="cameraCanvas" style="display: none;"></canvas>
          </div>
          <div class="mt-4">
            <label class="input-label">Tag</label>
            <select id="photoTag" class="input">
              <option value="avant">Avant travaux</option>
              <option value="pendant">Pendant travaux</option>
              <option value="apres">Après travaux</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeCameraModal()">Annuler</button>
          <button class="btn btn-primary" onclick="capturePhoto()">
            <i class="fas fa-camera"></i> Capturer
          </button>
        </div>
      </div>
    </div>
  `, true);
  
  startCamera();
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment', width: 1280, height: 720 } 
    });
    const video = document.getElementById('cameraVideo');
    video.srcObject = stream;
    window.currentStream = stream;
  } catch (error) {
    alert('Impossible d\'accéder à la caméra : ' + error.message);
    closeCameraModal();
  }
}

async function capturePhoto() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  const tag = document.getElementById('photoTag').value;
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  const base64 = canvas.toDataURL('image/jpeg', 0.8);
  
  try {
    await api.uploadPhoto({
      deal_id: state.currentDeal.id,
      file_url: base64,
      tags: tag,
    });
    
    closeCameraModal();
    state.photos = await api.getPhotos(state.currentDeal.id);
    document.getElementById('photoGallery').innerHTML = renderPhotoGallery();
  } catch (error) {
    alert('Erreur lors de l\'envoi de la photo : ' + error.message);
  }
}

function closeCameraModal(event) {
  if (event && event.target.id !== 'cameraModalBackdrop') return;
  
  if (window.currentStream) {
    window.currentStream.getTracks().forEach(track => track.stop());
    window.currentStream = null;
  }
  closeModal();
}

async function deletePhoto(photoId) {
  if (!confirm('Supprimer cette photo ?')) return;
  
  try {
    await api.deletePhoto(photoId);
    state.photos = await api.getPhotos(state.currentDeal.id);
    document.getElementById('photoGallery').innerHTML = renderPhotoGallery();
  } catch (error) {
    alert('Erreur : ' + error.message);
  }
}

// VIEW CLIENT MODAL
async function viewClientModal(clientId) {
  const client = await api.getClient(clientId);
  const photos = await api.getClientPhotos(clientId);
  
  const photosHTML = photos.length > 0 ? `
    <div class="mt-4">
      <h4 class="font-bold text-white mb-3">
        <i class="fas fa-images text-blue-600"></i> Photos chantier (${photos.length})
      </h4>
      <div class="photo-gallery">
        ${photos.map(photo => `
          <div class="photo-item">
            <img src="${photo.base64_data}" alt="${photo.label}" />
            <div class="photo-label">
              <span class="badge badge-${photo.label === 'avant' ? 'primary' : photo.label === 'pendant' ? 'warning' : photo.label === 'apres' ? 'success' : 'gray'}">
                ${photo.label}
              </span>
              <span class="text-xs text-gray-300">Dossier #${photo.deal_id}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';
  
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fas fa-user"></i> ${client.civility || ''} ${client.first_name} ${client.last_name}</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          ${client.company ? `<p class="text-sm mb-2"><strong>Société :</strong> ${client.company}</p>` : ''}
          ${client.phone ? `<p class="text-sm mb-2"><strong>Téléphone :</strong> <a href="tel:${client.phone}" class="text-blue-600">${client.phone}</a></p>` : ''}
          ${client.email ? `<p class="text-sm mb-2"><strong>Email :</strong> <a href="mailto:${client.email}" class="text-blue-600">${client.email}</a></p>` : ''}
          ${client.address ? `<p class="text-sm mb-2"><strong>Adresse :</strong> ${client.address}</p>` : ''}
          ${client.source ? `<p class="text-sm mb-2"><strong>Source :</strong> ${client.source}</p>` : ''}
          ${client.tags && client.tags.length > 0 ? `<p class="text-sm mb-2"><strong>Tags :</strong> ${Array.isArray(client.tags) ? client.tags.join(', ') : client.tags}</p>` : ''}
          ${photosHTML}
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="openCreateDealFromClient(${clientId})">
            <i class="fas fa-folder-plus"></i> Nouveau dossier
          </button>
          <button class="btn btn-primary" onclick="openCreateQuoteFromClient(${clientId})">
            <i class="fas fa-file-invoice"></i> Nouveau devis
          </button>
          <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
        </div>
      </div>
    </div>
  `);
}

// VIEW QUOTE MODAL
async function viewQuoteModal(quoteId) {
  const quote = await api.getQuote(quoteId);
  
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fas fa-file-invoice"></i> Devis ${quote.quote_number}</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="text-sm mb-2"><strong>Client :</strong> ${quote.first_name} ${quote.last_name}</p>
          <p class="text-sm mb-2"><strong>Dossier :</strong> #${quote.deal_id} (${quote.deal_type})</p>
          <p class="text-sm mb-2"><strong>Statut :</strong> <span class="badge badge-primary">${quote.status}</span></p>
          <p class="text-sm mb-2"><strong>Créé :</strong> ${formatRelativeTime(quote.created_at)}</p>
          ${quote.sent_at ? `<p class="text-sm mb-2"><strong>Envoyé :</strong> ${formatRelativeTime(quote.sent_at)}</p>` : ''}
          ${quote.valid_until ? `<p class="text-sm mb-2"><strong>Valide jusqu'au :</strong> ${formatDate(quote.valid_until)}</p>` : ''}
        </div>
        <div class="modal-footer">
          <button class="btn btn-warning" onclick="openEditQuoteModal(${quoteId})">
            <i class="fas fa-edit"></i> Modifier
          </button>
          <button class="btn btn-success" onclick="openSendQuoteEmailModal(${quoteId})">
            <i class="fas fa-paper-plane"></i> Envoyer par email
          </button>
          <button class="btn btn-primary" onclick="downloadQuotePDF(${quoteId})">
            <i class="fas fa-file-pdf"></i> Télécharger PDF
          </button>
          <button class="btn btn-secondary" onclick="closeModal()">Fermer</button>
        </div>
      </div>
    </div>
  `);
}

async function openEditQuoteModal(quoteId) {
  try {
    // Charger le devis avec ses lignes
    const quote = await api.getQuote(quoteId);
    
    // Stocker le devis et les lignes dans window pour les éditer
    window.currentQuote = quote.quote;
    window.quoteLines = quote.items.map((item, index) => ({
      id: item.id || Date.now() + index,
      title: item.title,
      description: item.description || '',
      qty: item.qty,
      unit: item.unit,
      unit_price_ht: item.unit_price_ht,
      vat_rate: item.vat_rate || 10,
      discount_percent: item.discount_percent || 0
    }));
    
    closeModal(); // Fermer la modale de visualisation
    
    // Ouvrir la modale d'édition
    showModal(`
      <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
        <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 800px;">
          <div class="modal-header">
            <h3><i class="fas fa-edit"></i> Modifier le devis ${quote.quote.number}</h3>
            <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
          </div>
          <form id="editQuoteForm" class="modal-body">
            <input type="hidden" name="quote_id" value="${quoteId}" />
            
            <div class="mb-4">
              <h4 class="font-bold text-white mb-3">Paramètres du devis</h4>
              <div class="input-group">
                <label class="input-label">Statut du devis</label>
                <select id="edit_quote_status" name="status" class="input">
                  <option value="brouillon" ${quote.quote.status === 'brouillon' ? 'selected' : ''}>📝 Brouillon</option>
                  <option value="envoye" ${quote.quote.status === 'envoye' ? 'selected' : ''}>📧 Envoyé</option>
                  <option value="accepte" ${quote.quote.status === 'accepte' ? 'selected' : ''}>✅ Accepté</option>
                  <option value="refuse" ${quote.quote.status === 'refuse' ? 'selected' : ''}>❌ Refusé</option>
                </select>
              </div>
              <div class="grid-2">
                <div class="input-group">
                  <label class="input-label">TVA (%)</label>
                  <input type="number" id="edit_tva_percent" name="tva_percent" class="input" value="${quote.quote.vat_rate || 20}" step="0.1" onchange="calculateQuoteTotals()" />
                </div>
                <div class="input-group">
                  <label class="input-label">Acompte (%)</label>
                  <input type="number" id="edit_deposit_percent" name="deposit_percent" class="input" value="${quote.quote.deposit_rate || 50}" step="1" onchange="calculateQuoteTotals()" />
                </div>
              </div>
              <div class="input-group">
                <label class="input-label">Validité (jours)</label>
                <input type="number" id="edit_validity_days" class="input" value="${quote.quote.validity_days || 30}" />
              </div>
            </div>

            <div class="mb-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-bold text-white">Lignes du devis</h4>
                <button type="button" class="btn btn-sm btn-primary" onclick="addEditQuoteLine()">
                  <i class="fas fa-plus"></i> Ajouter ligne
                </button>
              </div>
              <div id="editQuoteLinesContainer"></div>
            </div>

            <div class="mb-4" style="background: var(--psm-bg-card); padding: 1rem; border-radius: 12px;">
              <h4 class="font-bold text-white mb-3">Totaux</h4>
              <div class="flex justify-between mb-2">
                <span>Total HT :</span>
                <strong id="editTotalHT">0.00 €</strong>
              </div>
              <div class="flex justify-between mb-2">
                <span>TVA (<span id="editTvaPercent">20</span>%) :</span>
                <strong id="editTotalTVA">0.00 €</strong>
              </div>
              <div class="flex justify-between mb-2" style="font-size: 1.1rem; color: var(--psm-primary);">
                <span>Total TTC :</span>
                <strong id="editTotalTTC">0.00 €</strong>
              </div>
              <div class="flex justify-between" style="color: var(--psm-text-muted);">
                <span>Acompte (<span id="editDepositPercent">50</span>%) :</span>
                <strong id="editTotalDeposit">0.00 €</strong>
              </div>
            </div>

            <div class="input-group">
              <label class="input-label">Notes / Conditions particulières</label>
              <textarea name="notes" class="input" rows="3" placeholder="Conditions de paiement, délais, garanties...">${quote.quote.notes || ''}</textarea>
            </div>
          </form>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
            <button class="btn btn-primary" onclick="saveQuote()">
              <i class="fas fa-save"></i> Enregistrer les modifications
            </button>
          </div>
        </div>
      </div>
    `);
    
    // Rendre les lignes
    renderEditQuoteLines();
    calculateEditQuoteTotals();
    
  } catch (error) {
    alert('❌ Erreur lors du chargement du devis : ' + (error.response?.data?.error || error.message));
  }
}

function addEditQuoteLine() {
  const lineId = Date.now();
  window.quoteLines.push({
    id: lineId,
    title: '',
    description: '',
    qty: 1,
    unit: 'u',
    unit_price_ht: 0,
    vat_rate: 10,
    discount_percent: 0
  });
  renderEditQuoteLines();
  calculateEditQuoteTotals();
}

function removeEditQuoteLine(lineId) {
  window.quoteLines = window.quoteLines.filter(l => l.id !== lineId);
  renderEditQuoteLines();
  calculateEditQuoteTotals();
}

function updateEditQuoteLine(lineId, field, value) {
  const line = window.quoteLines.find(l => l.id === lineId);
  if (line) {
    line[field] = field === 'qty' || field === 'unit_price_ht' || field === 'vat_rate' || field === 'discount_percent' ? parseFloat(value) : value;
    calculateEditQuoteTotals();
  }
}

function renderEditQuoteLines() {
  const container = document.getElementById('editQuoteLinesContainer');
  if (!container) return;
  
  container.innerHTML = window.quoteLines.map((line, index) => `
    <div class="mb-3" style="background: var(--psm-bg-card); padding: 1rem; border-radius: 8px;">
      <div class="flex items-center justify-between mb-2">
        <strong class="text-white">Ligne ${index + 1}</strong>
        <button type="button" class="btn btn-sm btn-danger" onclick="removeEditQuoteLine(${line.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div class="input-group">
        <label class="input-label">Désignation</label>
        <input type="text" class="input" value="${line.title || ''}" onchange="updateEditQuoteLine(${line.id}, 'title', this.value)" />
      </div>
      <div class="input-group">
        <label class="input-label">Description</label>
        <textarea class="input" rows="2" onchange="updateEditQuoteLine(${line.id}, 'description', this.value)">${line.description || ''}</textarea>
      </div>
      <div class="grid-2">
        <div class="input-group">
          <label class="input-label">Quantité</label>
          <input type="number" class="input" value="${line.qty}" step="0.01" onchange="updateEditQuoteLine(${line.id}, 'qty', this.value)" />
        </div>
        <div class="input-group">
          <label class="input-label">Unité</label>
          <input type="text" class="input" value="${line.unit}" onchange="updateEditQuoteLine(${line.id}, 'unit', this.value)" />
        </div>
      </div>
      <div class="grid-2">
        <div class="input-group">
          <label class="input-label">Prix unitaire HT (€)</label>
          <input type="number" class="input" value="${line.unit_price_ht}" step="0.01" onchange="updateEditQuoteLine(${line.id}, 'unit_price_ht', this.value)" />
        </div>
        <div class="input-group">
          <label class="input-label">TVA (%)</label>
          <input type="number" class="input" value="${line.vat_rate || 10}" step="0.1" onchange="updateEditQuoteLine(${line.id}, 'vat_rate', this.value)" />
        </div>
      </div>
      <div class="flex justify-between mt-2" style="color: var(--psm-text-muted);">
        <span>Total ligne HT :</span>
        <strong>${(line.qty * line.unit_price_ht).toFixed(2)} €</strong>
      </div>
    </div>
  `).join('');
}

function calculateEditQuoteTotals() {
  if (!window.quoteLines) return;
  
  const totalHT = window.quoteLines.reduce((sum, line) => sum + (line.qty * line.unit_price_ht), 0);
  const tvaPercent = parseFloat(document.getElementById('edit_tva_percent')?.value || 10);
  const depositPercent = parseFloat(document.getElementById('edit_deposit_percent')?.value || 50);
  
  const totalTVA = totalHT * (tvaPercent / 100);
  const totalTTC = totalHT + totalTVA;
  const totalDeposit = totalTTC * (depositPercent / 100);
  
  const updateElement = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  
  updateElement('editTotalHT', totalHT.toFixed(2) + ' €');
  updateElement('editTotalTVA', totalTVA.toFixed(2) + ' €');
  updateElement('editTotalTTC', totalTTC.toFixed(2) + ' €');
  updateElement('editTotalDeposit', totalDeposit.toFixed(2) + ' €');
  updateElement('editTvaPercent', tvaPercent.toFixed(1));
  updateElement('editDepositPercent', depositPercent.toFixed(0));
}

async function downloadQuotePDF(quoteId) {
  try {
    // Utiliser fetch avec le token d'authentification
    const response = await axios.get(`${API_URL}/api/quotes/${quoteId}/pdf`, {
      responseType: 'blob' // Important pour recevoir le PDF en blob
    });
    
    // Créer un Blob depuis la réponse
    const blob = new Blob([response.data], { type: 'text/html' });
    
    // Créer une URL temporaire pour le blob
    const url = window.URL.createObjectURL(blob);
    
    // Ouvrir dans un nouvel onglet
    const newWindow = window.open(url, '_blank');
    
    // Nettoyer l'URL après un délai
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
    
    // Alternative : Télécharger directement
    // const link = document.createElement('a');
    // link.href = url;
    // link.download = `Devis_${quoteId}.html`;
    // link.click();
    // window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Erreur téléchargement PDF:', error);
    alert('❌ Erreur lors du téléchargement du devis : ' + (error.response?.data?.error || error.message));
  }
}

// ==================== ENVOI EMAIL DEVIS ====================

async function openSendQuoteEmailModal(quoteId) {
  try {
    // Charger le devis complet avec les infos client
    const quote = await api.getQuote(quoteId);
    
    // Récupérer l'email du client depuis le deal
    const deal = await api.getDeal(quote.deal_id);
    const clientEmail = deal.email || '';
    
    // Générer le message avec IA
    const aiEmail = generateQuoteEmail(quote, deal, {
      tone: 'professional',
      includeDetails: true,
      addCallToAction: true
    });
    
    showModal(`
      <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
        <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 700px;">
          <div class="modal-header">
            <h3>
              <i class="fas fa-paper-plane"></i> Envoyer devis n°${quote.quote_number} par email
            </h3>
            <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
          </div>
          
          <div class="modal-body">
            <!-- Info importante -->
            <div class="card" style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; margin-bottom: 1rem;">
              <p class="text-sm text-gray-300">
                <i class="fas fa-robot text-blue-500"></i> 
                <strong>Message généré par IA</strong> - Vous pouvez modifier le texte avant l'envoi
              </p>
            </div>
            
            <form id="sendQuoteEmailForm">
              <!-- Email destinataire -->
              <div class="input-group">
                <label class="input-label">
                  <i class="fas fa-envelope"></i> Email du client *
                </label>
                <input 
                  type="email" 
                  name="recipient_email" 
                  class="input" 
                  value="${clientEmail}"
                  placeholder="client@example.com"
                  required 
                />
              </div>
              
              <!-- Sujet -->
              <div class="input-group">
                <label class="input-label">
                  <i class="fas fa-heading"></i> Sujet
                </label>
                <input 
                  type="text" 
                  name="subject" 
                  class="input" 
                  value="${aiEmail.subject}"
                  required 
                />
              </div>
              
              <!-- Ton du message -->
              <div class="input-group">
                <label class="input-label">
                  <i class="fas fa-smile"></i> Ton du message
                </label>
                <select 
                  name="tone" 
                  class="input" 
                  onchange="regenerateEmailMessage(${quoteId}, this.value)"
                >
                  <option value="professional" selected>Professionnel</option>
                  <option value="friendly">Amical</option>
                  <option value="formal">Formel</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">
                  Le message sera régénéré automatiquement selon le ton choisi
                </p>
              </div>
              
              <!-- Message -->
              <div class="input-group">
                <label class="input-label">
                  <i class="fas fa-comment-alt"></i> Message
                </label>
                <textarea 
                  id="emailMessage"
                  name="message" 
                  class="input" 
                  rows="12" 
                  required
                  style="font-family: 'Courier New', monospace; font-size: 0.9rem; line-height: 1.6;"
                >${aiEmail.message}</textarea>
                <p class="text-xs text-gray-500 mt-1">
                  💡 Le devis PDF sera automatiquement joint à l'email
                </p>
              </div>
              
              <!-- Aperçu -->
              <div class="card" style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981;">
                <h4 class="text-sm font-bold text-white mb-2">
                  <i class="fas fa-eye text-green-500"></i> Aperçu
                </h4>
                <p class="text-xs text-gray-400 mb-1"><strong>À :</strong> ${clientEmail}</p>
                <p class="text-xs text-gray-400 mb-1"><strong>Sujet :</strong> ${aiEmail.subject}</p>
                <p class="text-xs text-gray-400"><strong>Pièce jointe :</strong> Devis_${quote.quote_number}.pdf</p>
              </div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
            <button class="btn btn-success" onclick="sendQuoteEmail(${quoteId})">
              <i class="fas fa-paper-plane"></i> Envoyer maintenant
            </button>
          </div>
        </div>
      </div>
    `);
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors du chargement du devis');
  }
}

// Régénérer le message avec un ton différent
async function regenerateEmailMessage(quoteId, tone) {
  try {
    const quote = await api.getQuote(quoteId);
    const deal = await api.getDeal(quote.deal_id);
    
    const aiEmail = generateQuoteEmail(quote, deal, {
      tone,
      includeDetails: true,
      addCallToAction: true
    });
    
    // Mettre à jour le message et le sujet
    document.getElementById('emailMessage').value = aiEmail.message;
    document.querySelector('input[name="subject"]').value = aiEmail.subject;
  } catch (error) {
    console.error('Erreur régénération:', error);
  }
}

// Envoyer l'email
async function sendQuoteEmail(quoteId) {
  const form = document.getElementById('sendQuoteEmailForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  if (!form.checkValidity()) {
    alert('❌ Veuillez remplir tous les champs obligatoires');
    return;
  }
  
  if (!confirm(`📧 Envoyer le devis par email à ${data.recipient_email} ?\n\nLe client recevra le devis en pièce jointe.`)) {
    return;
  }
  
  try {
    // Envoi de l'email
    const result = await api.sendQuoteEmail(quoteId, data);
    
    closeModal();
    alert(`✅ ${result.message}\n\nEmail envoyé à : ${result.sent_to}`);
    
    // Rafraîchir la vue
    if (state.currentView === 'quotes') {
      renderQuotes();
    } else if (state.currentView === 'pipeline') {
      renderPipeline();
    }
  } catch (error) {
    console.error('Erreur envoi email:', error);
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// CREATE TASK MODAL
function openCreateTaskModal() {
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fas fa-tasks"></i> Nouvelle tâche</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="taskForm" class="modal-body">
          <div class="input-group">
            <label class="input-label">Titre *</label>
            <input type="text" name="title" class="input" required />
          </div>
          <div class="input-group">
            <label class="input-label">Description</label>
            <textarea name="description" class="input" rows="3"></textarea>
          </div>
          <div class="input-group">
            <label class="input-label">Date d'échéance</label>
            <input type="date" name="due_date" class="input" />
          </div>
          <div class="input-group">
            <label class="input-label">Dossier lié</label>
            <select name="deal_id" class="input">
              <option value="">Aucun</option>
              ${safeArray(state.deals).map(d => `<option value="${d.id}">Dossier #${d.id} - ${d.first_name} ${d.last_name}</option>`).join('')}
            </select>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          <button class="btn btn-primary" onclick="submitTaskForm()">
            <i class="fas fa-save"></i> Créer
          </button>
        </div>
      </div>
    </div>
  `);
}

async function submitTaskForm() {
  const form = document.getElementById('taskForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  data.assigned_to = state.user.id;
  
  try {
    await api.createTask(data);
    closeModal();
    navigate('tasks');
  } catch (error) {
    alert('Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// ==================== ACTIONS ====================

async function toggleTask(taskId, done) {
  try {
    await api.toggleTask(taskId, done ? 'done' : 'pending');
    navigate('tasks');
  } catch (error) {
    alert('Erreur : ' + error.message);
  }
}

function filterClients(query) {
  const list = document.getElementById('clientsList');
  const filtered = safeArray(state.clients).filter(c => {
    const name = c.name || '';
    const company = c.company || '';
    const email = c.email || '';
    const phone = c.phone || '';
    const searchText = `${name} ${company} ${email} ${phone}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });
  
  list.innerHTML = filtered.map(client => {
    const displayName = client.name || `Client #${client.id}`;
    const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';
    
    return `
    <div class="flex items-center gap-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors border border-gray-700" onclick="openEditClientModal(${client.id})">
      <div class="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        ${initials}
      </div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-white truncate">${displayName}</div>
        <div class="text-sm text-gray-400 truncate">
          ${client.phone ? `📞 ${client.phone}` : ''}
          ${client.phone && client.email ? ' • ' : ''}
          ${client.email ? `✉️ ${client.email}` : ''}
        </div>
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <button class="p-2 hover:bg-gray-600 rounded transition-colors" onclick="event.stopPropagation(); openClientDossier(${client.id})" title="Dossier">
          <i class="fas fa-folder text-blue-400"></i>
        </button>
        <button class="p-2 hover:bg-red-600 rounded transition-colors" onclick="event.stopPropagation(); confirmDeleteClient(${client.id})" title="Supprimer">
          <i class="fas fa-trash text-red-400"></i>
        </button>
      </div>
    </div>
    `;
  }).join('');
}

// CREATE QUOTE MODAL (Éditeur de devis complet)
let quoteLines = [];

function openCreateQuoteModal(dealId) {
  quoteLines = []; // Reset lines
  
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 800px;">
        <div class="modal-header">
          <h3><i class="fas fa-file-invoice"></i> Nouveau devis - Dossier #${dealId}</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="quoteForm" class="modal-body">
          <input type="hidden" name="deal_id" value="${dealId}" />
          
          <div class="mb-4">
            <h4 class="font-bold text-white mb-3">Paramètres du devis</h4>
            <div class="input-group">
              <label class="input-label">Statut du devis</label>
              <select id="quote_status" name="status" class="input">
                <option value="brouillon">📝 Brouillon</option>
                <option value="envoye">📧 Envoyé</option>
                <option value="accepte">✅ Accepté</option>
                <option value="refuse">❌ Refusé</option>
              </select>
            </div>
            <div class="grid-2">
              <div class="input-group">
                <label class="input-label">TVA (%)</label>
                <input type="number" id="tva_percent" name="tva_percent" class="input" value="10" step="0.1" />
              </div>
              <div class="input-group">
                <label class="input-label">Acompte (%)</label>
                <input type="number" id="deposit_percent" name="deposit_percent" class="input" value="50" step="1" />
              </div>
            </div>
            <div class="input-group">
              <label class="input-label">Validité (jours)</label>
              <input type="number" id="validity_days" class="input" value="15" />
            </div>
          </div>

          <div class="mb-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-bold text-white">Lignes du devis</h4>
              <button type="button" class="btn btn-sm btn-primary" onclick="addQuoteLine()">
                <i class="fas fa-plus"></i> Ajouter ligne
              </button>
            </div>
            <div id="quoteLinesContainer"></div>
          </div>

          <div class="mb-4" style="background: var(--psm-bg-card); padding: 1rem; border-radius: 12px;">
            <h4 class="font-bold text-white mb-3">Totaux</h4>
            <div class="flex justify-between mb-2">
              <span>Total HT :</span>
              <strong id="totalHT">0.00 €</strong>
            </div>
            <div class="flex justify-between mb-2">
              <span>TVA (<span id="tvaPercent">10</span>%) :</span>
              <strong id="totalTVA">0.00 €</strong>
            </div>
            <div class="flex justify-between mb-2" style="font-size: 1.1rem; color: var(--psm-primary);">
              <span>Total TTC :</span>
              <strong id="totalTTC">0.00 €</strong>
            </div>
            <div class="flex justify-between" style="color: var(--psm-text-muted);">
              <span>Acompte (<span id="depositPercent">50</span>%) :</span>
              <strong id="totalDeposit">0.00 €</strong>
            </div>
          </div>

          <div class="input-group">
            <label class="input-label">Notes / Conditions particulières</label>
            <textarea name="notes" class="input" rows="3" placeholder="Conditions de paiement, délais, garanties..."></textarea>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          <button class="btn btn-primary" onclick="submitQuoteForm()">
            <i class="fas fa-save"></i> Créer le devis
          </button>
        </div>
      </div>
    </div>
  `);
  
  // Add first line by default
  addQuoteLine();
}

function addQuoteLine() {
  const lineId = Date.now();
  quoteLines.push({
    id: lineId,
    designation: '',
    quantity: 1,
    unit: 'unité',
    unit_price_ht: 0,
    discount_percent: 0
  });
  
  renderQuoteLines();
}

function removeQuoteLine(lineId) {
  quoteLines = quoteLines.filter(l => l.id !== lineId);
  renderQuoteLines();
  calculateQuoteTotals();
}

function updateQuoteLine(lineId, field, value) {
  const line = quoteLines.find(l => l.id === lineId);
  if (line) {
    line[field] = value;
    renderQuoteLines();
    calculateQuoteTotals();
  }
}

function calculateLineTotal(line) {
  return line.quantity * line.unit_price_ht * (1 - (line.discount_percent || 0) / 100);
}

function calculateQuoteTotals() {
  const totalHT = quoteLines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  const tvaPercent = parseFloat(document.getElementById('tva_percent')?.value || 10);
  const depositPercent = parseFloat(document.getElementById('deposit_percent')?.value || 50);
  
  const totalTVA = totalHT * (tvaPercent / 100);
  const totalTTC = totalHT + totalTVA;
  const totalDeposit = totalTTC * (depositPercent / 100);
  
  document.getElementById('totalHT').textContent = totalHT.toFixed(2) + ' €';
  document.getElementById('totalTVA').textContent = totalTVA.toFixed(2) + ' €';
  document.getElementById('totalTTC').textContent = totalTTC.toFixed(2) + ' €';
  document.getElementById('totalDeposit').textContent = totalDeposit.toFixed(2) + ' €';
  document.getElementById('tvaPercent').textContent = tvaPercent.toFixed(1);
  document.getElementById('depositPercent').textContent = depositPercent.toFixed(0);
}

async function submitQuoteForm() {
  const form = document.getElementById('quoteForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  if (quoteLines.length === 0) {
    alert('⚠️ Veuillez ajouter au moins une ligne au devis');
    return;
  }
  
  // Calculate validity date
  const validityDays = parseInt(document.getElementById('validity_days').value || 30);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + validityDays);
  
  try {
    // Create quote with items in same request
    const quoteData = {
      deal_id: parseInt(data.deal_id),
      status: document.getElementById('quote_status')?.value || 'brouillon',
      deposit_rate: parseFloat(data.deposit_percent || 50),
      vat_rate: parseFloat(data.tva_percent || 20),
      validity_days: validityDays,
      valid_until: validUntil.toISOString().split('T')[0],
      notes: data.notes || null,
      items: quoteLines.map((line, index) => ({
        title: line.title,
        description: line.description || null,
        qty: parseFloat(line.qty),
        unit: line.unit,
        unit_price_ht: parseFloat(line.unit_price_ht),
        vat_rate: parseFloat(line.vat_rate || 10),
        discount_percent: parseFloat(line.discount_percent || 0),
        position: index,
        item_type: 'product'
      }))
    };
    
    const quote = await api.createQuote(quoteData);
    
    alert('✅ Devis ' + quote.number + ' créé avec succès !');
    closeModal();
    
    // Rafraîchir la page devis
    navigate('quotes');
  } catch (error) {
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// Auto-complete city from postal code
async function lookupCity(postalCode) {
  if (!postalCode || postalCode.length < 5) return;
  
  try {
    // API gouvernement français pour les codes postaux
    const response = await axios.get(`https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom,code,codesPostaux&format=json`);
    const cities = response.data;
    
    const citySelect = document.getElementById('address_city');
    
    if (cities && cities.length > 0) {
      // Remplir le select avec toutes les villes
      citySelect.innerHTML = '<option value="">Choisir une ville...</option>' + 
        cities.map(city => `<option value="${city.nom}">${city.nom}</option>`).join('');
      
      // Si une seule ville, la sélectionner automatiquement
      if (cities.length === 1) {
        citySelect.value = cities[0].nom;
      }
    } else {
      citySelect.innerHTML = '<option value="">Aucune ville trouvée</option>';
    }
  } catch (error) {
    console.error('Erreur lors de la recherche de ville:', error);
    const citySelect = document.getElementById('address_city');
    if (citySelect) {
      citySelect.innerHTML = '<option value="">Erreur de chargement</option>';
    }
  }
}

async function saveCompanyName() {
  const companyName = document.getElementById('companyNameInput').value;
  if (!companyName) {
    alert('⚠️ Veuillez saisir un nom d\'entreprise');
    return;
  }
  
  try {
    await api.updateProfile({ company_name: companyName });
    
    // Mettre à jour state.user ET localStorage
    state.user.company_name = companyName;
    storage.set('user', state.user);
    
    alert('✅ Nom d\'entreprise enregistré ! La page va se recharger.');
    
    // Recharger la page pour mettre à jour le header
    location.reload();
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

function handleLogout() {
  if (confirm('Se déconnecter ?')) {
    api.logout();
    navigate('login');
  }
}

// ==================== NAVIGATION & MODALS ====================

// ==========================================
// EMAIL TEMPLATES - Helper functions
// ==========================================

async function showEmailTemplateSelector(client, deal) {
  try {
    const templates = await api.getEmailTemplates();
    
    const templatesHTML = templates.map(t => `
      <div class="card mb-3" onclick="selectEmailTemplate(${t.id}, '${client?.first_name || ''}', '${client?.last_name || ''}', '${deal?.type || ''}', ${deal?.estimated_amount || 0})" style="cursor: pointer; border-left: 4px solid ${getToneColor(t.tone)};">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="badge" style="background: ${getToneColor(t.tone)};">${t.tone.toUpperCase()}</span>
              <span class="badge badge-secondary">${t.category}</span>
            </div>
            <h3 class="font-bold text-white text-lg">${t.name}</h3>
            <p class="text-sm text-gray-400 mt-1">${t.subject}</p>
            <p class="text-xs text-gray-500 mt-2 italic">${t.preview}...</p>
            <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span><i class="fas fa-paper-plane"></i> Utilisé ${t.usage_count} fois</span>
              ${t.success_rate > 0 ? `<span><i class="fas fa-chart-line"></i> ${(t.success_rate * 100).toFixed(0)}% succès</span>` : ''}
            </div>
          </div>
          <i class="fas fa-chevron-right text-gray-400"></i>
        </div>
      </div>
    `).join('');
    
    const modal = `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem;" onclick="closeModal(event)">
        <div style="background: var(--psm-bg-card); border-radius: 1rem; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem;" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white"><i class="fas fa-envelope"></i> Choisir un template d'email</h2>
            <button onclick="closeModal(event)" class="btn btn-secondary"><i class="fas fa-times"></i></button>
          </div>
          
          <div class="mb-4">
            <p class="text-gray-400 text-sm">Sélectionnez un ton adapté pour votre email :</p>
          </div>
          
          ${templatesHTML}
          
          <div class="mt-6 text-center">
            <button onclick="closeModal(event)" class="btn btn-secondary">Annuler</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
  } catch (error) {
    console.error('Erreur chargement templates:', error);
    alert('Erreur lors du chargement des templates');
  }
}

function getToneColor(tone) {
  const colors = {
    'urgent': '#ef4444',
    'dernier_rappel': '#f59e0b',
    'upsell': '#8b5cf6',
    'remerciement': '#22c55e',
    'professionnel': '#3b82f6',
    'amical': '#06b6d4'
  };
  return colors[tone] || '#6b7280';
}

async function selectEmailTemplate(templateId, prenom, nom, typeProjet, montant) {
  try {
    closeModal();
    
    // Variables par défaut
    const variables = {
      prenom: prenom || 'Client',
      nom: nom || '',
      numero_devis: 'D2026-XXX',
      type_projet: typeProjet || 'votre projet',
      jours_restants: '7',
      description_projet: typeProjet || 'Projet',
      montant_ttc: montant || '0',
      montant_acompte: Math.round(montant * 0.5) || '0',
      nom_commercial: state.user?.name || 'Votre commercial',
      entreprise: 'PSM Portails',
      telephone: '06 XX XX XX XX',
      date_envoi: new Date().toLocaleDateString('fr-FR'),
      prenom_commercial: state.user?.name?.split(' ')[0] || 'Commercial',
      fonction: 'Commercial',
      jours_validite: '30',
      options_suggerees: '- Option 1\n- Option 2\n- Option 3',
      montant_options: '500',
      date_debut_prevue: 'À définir'
    };
    
    const result = await api.generateEmail(templateId, variables);
    
    // Afficher l'email généré dans une modale d'édition
    showGeneratedEmailModal(result.generated.subject, result.generated.body, result.template);
  } catch (error) {
    console.error('Erreur génération email:', error);
    alert('Erreur lors de la génération de l\'email');
  }
}

function showGeneratedEmailModal(subject, body, template) {
  const modal = `
    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem;" onclick="closeModal(event)">
      <div style="background: var(--psm-bg-card); border-radius: 1rem; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem;" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-white"><i class="fas fa-envelope-open-text"></i> Email généré</h2>
            <p class="text-sm text-gray-400 mt-1">Template: ${template.name} (${template.tone})</p>
          </div>
          <button onclick="closeModal(event)" class="btn btn-secondary"><i class="fas fa-times"></i></button>
        </div>
        
        <div class="mb-4">
          <label class="label">Sujet</label>
          <input type="text" class="input" value="${subject}" id="emailSubject">
        </div>
        
        <div class="mb-4">
          <label class="label">Corps du message</label>
          <textarea class="input" rows="15" id="emailBody">${body}</textarea>
        </div>
        
        <div class="flex gap-2">
          <button onclick="copyEmailToClipboard()" class="btn btn-secondary">
            <i class="fas fa-copy"></i> Copier
          </button>
          <button onclick="sendGeneratedEmail()" class="btn btn-primary">
            <i class="fas fa-paper-plane"></i> Envoyer
          </button>
          <button onclick="closeModal(event)" class="btn btn-secondary ml-auto">Fermer</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modal);
}

function copyEmailToClipboard() {
  const subject = document.getElementById('emailSubject').value;
  const body = document.getElementById('emailBody').value;
  const fullEmail = `Sujet: ${subject}\n\n${body}`;
  
  navigator.clipboard.writeText(fullEmail).then(() => {
    alert('✅ Email copié dans le presse-papiers !');
  }).catch(err => {
    console.error('Erreur copie:', err);
    alert('Erreur lors de la copie');
  });
}

function sendGeneratedEmail() {
  alert('🚧 Fonction d\'envoi d\'email en développement.\n\nPour l\'instant, copiez l\'email et envoyez-le via votre client email habituel.');
}

// ==========================================
// NAVIGATION
// ==========================================

function navigate(view) {
  console.log('🔵 navigate() appelé avec view:', view);
  console.trace('📍 Stack trace de l\'appel:'); // 👈 AJOUT DEBUG
  state.currentView = view;
  
  const routes = {
    'login': renderLogin,
    'dashboard': renderDashboard,
    'pipeline': renderPipeline,
    'clients': renderClients,
    'quotes': renderQuotes,
    'tasks': renderTasks,
    'calendar': renderCalendar,
    'priority': renderPriority,
    'reports': renderReports,
    'efficiency': renderEfficiency,
    'mails': renderMails,
    'trash': renderTrash,
    'settings': renderSettings,
  };
  
  if (routes[view]) {
    console.log('✅ Route trouvée, appel de la fonction...');
    routes[view]();
  } else {
    console.error('❌ Route non trouvée:', view);
  }
}

function showModal(html, isCamera = false) {
  const modalContainer = document.createElement('div');
  modalContainer.id = isCamera ? 'cameraModalContainer' : 'modalContainer';
  modalContainer.innerHTML = html;
  document.body.appendChild(modalContainer);
}

function closeModal(event) {
  if (event && event.target.id !== 'modalBackdrop' && event.target.id !== 'cameraModalBackdrop') return;
  
  if (window.currentStream) {
    window.currentStream.getTracks().forEach(track => track.stop());
    window.currentStream = null;
  }
  
  const modalContainer = document.getElementById('modalContainer') || document.getElementById('cameraModalContainer');
  if (modalContainer) {
    modalContainer.remove();
  }
}

// ==================== INITIALIZATION ====================

// ❌ ANCIENNE FONCTION D'INITIALISATION - NE PLUS UTILISER
// Cette fonction redirige vers Pipeline au lieu de Dashboard
// On utilise maintenant initApp() en fin de fichier qui va au Dashboard
/*
async function init() {
  // Check if already logged in
  const savedUser = storage.get('user');
  const savedToken = storage.get('token');
  
  if (savedUser && savedToken) {
    state.user = savedUser;
    state.token = savedToken;
    api.setToken(savedToken);
    
    // Load initial data
    try {
      state.clients = await api.getClients();
      state.deals = await api.getDeals();
      navigate('pipeline'); // 👈 PROBLÈME : redirige vers Pipeline !
    } catch (error) {
      console.error('Session expired', error);
      api.logout();
      navigate('login');
    }
  } else {
    navigate('login');
  }
}
*/

// ==================== CREATE DEAL FROM CLIENT ====================

async function openCreateDealFromClient(clientId) {
  const client = await api.getClient(clientId);
  
  closeModal(); // Fermer la modale client
  
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fas fa-folder-plus"></i> Nouveau dossier - ${client.first_name} ${client.last_name}</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="dealForm" class="modal-body">
          <input type="hidden" name="client_id" value="${clientId}" />
          
          <div class="mb-3 p-3 bg-blue-900 rounded">
            <p class="text-sm text-white">
              <strong>Client :</strong> ${client.civility || ''} ${client.first_name} ${client.last_name}
              ${client.company ? `<br/><strong>Société :</strong> ${client.company}` : ''}
            </p>
          </div>
          
          <div class="input-group">
            <label class="input-label">Type *</label>
            <select name="type" class="input" required>
              <option value="portail">Portail</option>
              <option value="portillon">Portillon</option>
              <option value="cloture">Clôture</option>
              <option value="ensemble">Ensemble</option>
              <option value="sav">SAV</option>
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Montant estimé (€)</label>
            <input type="number" name="estimated_amount" class="input" step="0.01" placeholder="Ex: 5000" />
          </div>
          <div class="input-group">
            <label class="input-label">Date RDV</label>
            <input type="datetime-local" name="rdv_date" class="input" />
          </div>
          <div class="input-group">
            <label class="input-label">Notes</label>
            <textarea name="notes" class="input" rows="3" placeholder="Détails du projet, demandes spécifiques..."></textarea>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          <button class="btn btn-primary" onclick="submitDealForm()">
            <i class="fas fa-save"></i> Créer le dossier
          </button>
        </div>
      </div>
    </div>
  `);
}

// ==================== CREATE QUOTE FROM CLIENT ====================

async function openCreateQuoteFromClient(clientId) {
  // Récupérer les dossiers du client
  const deals = state.safeArray(deals).filter(d => d.client_id === clientId);
  
  if (deals.length === 0) {
    // Créer automatiquement un dossier "Devis direct"
    const confirmed = confirm('⚠️ Ce client n\'a aucun dossier.\n\n✅ Créer automatiquement un dossier "Devis direct" ?');
    
    if (!confirmed) {
      return;
    }
    
    try {
      // Créer le dossier automatiquement
      const dealData = {
        client_id: clientId,
        type: 'devis_direct',
        status: 'devis_a_faire',
        notes: 'Dossier créé automatiquement pour devis'
      };
      
      const newDeal = await api.createDeal(dealData);
      
      // Recharger les dossiers
      state.deals = await api.getDeals();
      
      // Fermer la modale client et ouvrir l'éditeur de devis
      closeModal();
      openCreateQuoteModal(newDeal.id);
    } catch (error) {
      alert('❌ Erreur lors de la création du dossier : ' + (error.response?.data?.error || error.message));
    }
    return;
  }
  
  closeModal(); // Fermer la modale client
  
  // Si un seul dossier, créer directement le devis
  if (deals.length === 1) {
    openCreateQuoteModal(deals[0].id);
    return;
  }
  
  // Si plusieurs dossiers, demander de choisir
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fas fa-file-invoice"></i> Choisir un dossier</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="text-sm text-gray-300 mb-4">Sélectionnez le dossier pour lequel créer un devis :</p>
          <div class="space-y-2">
            ${deals.map(deal => `
              <div class="card card-hover p-3 cursor-pointer" onclick="openCreateQuoteModal(${deal.id})">
                <div class="flex items-center justify-between">
                  <div>
                    <strong class="text-white">Dossier #${deal.id}</strong>
                    <span class="badge badge-primary ml-2">${deal.type}</span>
                  </div>
                  <div class="text-right">
                    <div class="text-xs text-gray-400">${formatRelativeTime(deal.created_at)}</div>
                    ${deal.estimated_amount ? `<div class="text-blue-400 font-bold">${formatCurrency(deal.estimated_amount)}</div>` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </div>
    </div>
  `);
}

// ==================== SELECT CLIENT FOR NEW QUOTE (from Quotes page) ====================

function openSelectClientForQuote() {
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 800px;">
        <div class="modal-header">
          <h3><i class="fas fa-user"></i> Sélectionner un client</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body" style="max-height: 600px; overflow-y: auto;">
          <p class="text-sm text-gray-300 mb-4">Choisissez le client pour créer un devis :</p>
          
          <div class="mb-3">
            <input type="search" id="clientSearch" placeholder="🔍 Rechercher un client..." 
              class="w-full bg-gray-700 text-white p-3 rounded border border-gray-600"
              onkeyup="filterClientsForQuote(this.value)" />
          </div>
          
          <div id="clientsListForQuote" class="space-y-2">
            ${safeArray(state.clients).map(client => {
              const firstName = client.first_name?.trim() || '';
              const lastName = client.last_name?.trim() || '';
              const initials = (firstName[0] || '') + (lastName[0] || '') || '?';
              const fullName = (firstName || lastName) 
                ? `${client.civility || ''} ${firstName} ${lastName}`.trim()
                : `Client #${client.id}`;
              
              return `
              <div class="card card-hover p-3 cursor-pointer client-item" 
                onclick="openCreateQuoteFromClient(${client.id})" 
                data-search="${firstName} ${lastName} ${client.company || ''} ${client.email || ''}">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                      ${initials}
                    </div>
                    <div class="flex-1">
                      <div>
                        <strong class="text-white">${fullName}</strong>
                        ${client.company ? `<span class="text-gray-400 text-sm ml-2">(${client.company})</span>` : ''}
                      </div>
                      <div class="text-xs text-gray-400 mt-1">
                        ${client.phone ? `<i class="fas fa-phone"></i> ${client.phone}` : ''}
                        ${client.email ? ` • <i class="fas fa-envelope"></i> ${client.email}` : ''}
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <i class="fas fa-chevron-right text-gray-400"></i>
                  </div>
                </div>
              </div>
              `;
            }).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </div>
    </div>
  `);
}

function filterClientsForQuote(searchTerm) {
  const items = document.querySelectorAll('.client-item');
  const term = searchTerm.toLowerCase();
  
  items.forEach(item => {
    const searchData = item.getAttribute('data-search').toLowerCase();
    if (searchData.includes(term)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

// ==================== SELECT DEAL FOR NEW QUOTE (LEGACY - keep for compatibility) ====================

function openSelectDealForQuote() {
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 800px;">
        <div class="modal-header">
          <h3><i class="fas fa-folder-open"></i> Sélectionner un dossier</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body" style="max-height: 600px; overflow-y: auto;">
          <p class="text-sm text-gray-300 mb-4">Choisissez le dossier pour lequel créer un devis :</p>
          
          <div class="mb-3">
            <input type="search" id="dealSearch" placeholder="🔍 Rechercher un dossier..." 
              class="w-full bg-gray-700 text-white p-3 rounded border border-gray-600"
              onkeyup="filterDealsForQuote(this.value)" />
          </div>
          
          <div id="dealsListForQuote" class="space-y-2">
            ${safeArray(state.deals).map(deal => `
              <div class="card card-hover p-3 cursor-pointer deal-item" onclick="openCreateQuoteModal(${deal.id})" 
                data-search="${deal.first_name} ${deal.last_name} ${deal.company || ''} ${deal.type}">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div>
                      <strong class="text-white">${deal.first_name} ${deal.last_name}</strong>
                      ${deal.company ? `<span class="text-gray-400 text-sm ml-2">(${deal.company})</span>` : ''}
                    </div>
                    <div class="mt-1">
                      <span class="badge badge-sm badge-primary">${deal.type}</span>
                      <span class="badge badge-sm badge-gray ml-1">Dossier #${deal.id}</span>
                      ${deal.estimated_amount ? `<span class="text-blue-400 text-sm ml-2">${formatCurrency(deal.estimated_amount)}</span>` : ''}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs text-gray-400">${formatRelativeTime(deal.created_at)}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </div>
    </div>
  `);
}

function filterDealsForQuote(searchTerm) {
  const items = document.querySelectorAll('.deal-item');
  const term = searchTerm.toLowerCase();
  
  items.forEach(item => {
    const searchData = item.getAttribute('data-search').toLowerCase();
    if (searchData.includes(term)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

// Make functions globally accessible
window.navigate = navigate;
window.openNewQuoteModal = openNewQuoteModal;
window.updateClientInfo = updateClientInfo;
window.saveNewQuote = saveNewQuote;
window.openCreateClientModal = openCreateClientModal;
window.openCreateDealModal = openCreateDealModal;
window.openPipelineStatus = openPipelineStatus;
window.closePipelineStatus = closePipelineStatus;
window.openCreateTaskModal = openCreateTaskModal;
window.openCameraModal = openCameraModal;
window.viewDealModal = viewDealModal;
window.viewClientModal = viewClientModal;
window.viewQuoteModal = viewQuoteModal;
window.editQuote = editQuote;
window.renderQuoteLines = renderQuoteLines;
window.calculateTotals = calculateTotals;
window.removeLine = removeLine;
window.openAddLineModal = openAddLineModal;
window.selectCatalogItem = selectCatalogItem;
window.updateLinePreview = updateLinePreview;
window.addLineToQuote = addLineToQuote;
window.filterCatalog = filterCatalog;
window.openCustomLineModal = openCustomLineModal;
window.saveQuote = saveQuote;
window.submitClientForm = submitClientForm;
window.submitDealForm = submitDealForm;
window.submitTaskForm = submitTaskForm;
window.capturePhoto = capturePhoto;
window.closeCameraModal = closeCameraModal;
window.closeModal = closeModal;
window.toggleTask = toggleTask;
window.filterClients = filterClients;
window.deletePhoto = deletePhoto;
window.handleLogout = handleLogout;
window.openCreateQuoteModal = openCreateQuoteModal;
window.addQuoteLine = addQuoteLine;
window.removeQuoteLine = removeQuoteLine;
window.updateQuoteLine = updateQuoteLine;
window.submitQuoteForm = submitQuoteForm;
window.downloadQuotePDF = downloadQuotePDF;
window.openCreateClientFromDeal = openCreateClientFromDeal;
window.submitClientFromDeal = submitClientFromDeal;
window.cancelCreateClientFromDeal = cancelCreateClientFromDeal;
window.lookupCity = lookupCity;
window.openCreateDealFromClient = openCreateDealFromClient;
window.openCreateQuoteFromClient = openCreateQuoteFromClient;
window.openSelectClientForQuote = openSelectClientForQuote;
window.filterClientsForQuote = filterClientsForQuote;
window.openSelectDealForQuote = openSelectDealForQuote;
window.filterDealsForQuote = filterDealsForQuote;

// Start app - DÉSACTIVÉ : on utilise maintenant initApp() en fin de fichier
// init(); // ❌ ANCIENNE INITIALISATION - redirige vers Pipeline

// ========================================
// FONCTIONS EMAIL - Tri et gestion
// ========================================
async function categorizeAndProcessEmail(emailId, category) {
  if (!confirm('🎯 Traiter cet email comme un Lead ?\n\nUn nouveau client et un dossier seront créés automatiquement.')) {
    return;
  }
  
  try {
    const response = await axios.post(`${API_URL}/api/emails/${emailId}/process-as-lead`);
    const lead = response.data.lead;
    
    alert(`✅ Lead créé avec succès !\n\n📋 ${lead.name}\n📧 ${lead.email || 'N/A'}\n📞 ${lead.phone || 'N/A'}\n🏷️ Type: ${lead.type}\n\n➡️ Disponible dans Pipeline → Lead`);
    
    renderMails(); // Rafraîchir
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

async function categorizeEmail(emailId, category) {
  const labels = {
    spam: 'Spam',
    pub: 'Publicité',
    other: 'Autre'
  };
  
  if (!confirm(`Marquer cet email comme "${labels[category]}" ?\n\nIl sera archivé.`)) {
    return;
  }
  
  try {
    await axios.post(`${API_URL}/api/emails/${emailId}/categorize`, { category });
    alert(`✅ Email marqué comme ${labels[category]}`);
    renderMails(); // Rafraîchir
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de la catégorisation');
  }
}

// Archiver un email (spam/publicité)
async function archiveEmailAs(emailId, category) {
  const labels = {
    spam: 'Spam',
    publicite: 'Publicité'
  };
  
  if (!confirm(`🗑️ Archiver cet email comme "${labels[category]}" ?\n\nVous pourrez le restaurer depuis les archives.`)) {
    return;
  }
  
  try {
    await api.archiveEmail(emailId, category);
    alert(`✅ Email archivé comme ${labels[category]}`);
    renderMails();
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de l\'archivage');
  }
}

// Supprimer définitivement un email
async function deleteEmailPermanently(emailId) {
  if (!confirm('⚠️ ATTENTION : Supprimer définitivement cet email ?\n\n Cette action est IRRÉVERSIBLE !')) {
    return;
  }
  
  try {
    await api.deleteEmail(emailId);
    alert('✅ Email supprimé définitivement');
    renderMails();
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de la suppression');
  }
}

// Restaurer un email archivé
async function restoreArchivedEmail(emailId) {
  try {
    await api.restoreEmail(emailId);
    alert('✅ Email restauré dans "À trier"');
    renderMails();
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de la restauration');
  }
}

// Vider toutes les archives
async function clearArchivedEmails() {
  if (!confirm('⚠️ ATTENTION : Vider toutes les archives ?\n\nTous les emails archivés (spam/publicités) seront supprimés définitivement.\n\nCette action est IRRÉVERSIBLE !')) {
    return;
  }
  
  if (!confirm('🔴 DERNIÈRE CONFIRMATION\n\nÊtes-vous absolument certain ?\n\nCette action ne peut pas être annulée.')) {
    return;
  }
  
  try {
    const result = await api.clearArchivedEmails();
    alert(`✅ Archives vidées\n\n${result.deleted || 0} emails supprimés`);
    renderMails();
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors du nettoyage');
  }
}

// Voir le Lead lié à un email
async function viewLinkedDeal(dealId) {
  try {
    // Charger le deal
    const deal = await api.getDeal(dealId);
    
    // Naviguer vers Pipeline et ouvrir la modale du deal
    navigate('pipeline');
    
    // Attendre que le Pipeline soit rendu puis ouvrir la modale
    setTimeout(() => {
      viewDealModal(dealId);
    }, 300);
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors du chargement du Lead');
  }
}

// Catégoriser ET traiter comme Lead
function openAddEmailModal() {
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fas fa-envelope"></i> Ajouter un email reçu</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="text-sm text-gray-300 mb-4">
            Copiez-collez le contenu d'un email reçu. Il sera ajouté à la liste "À trier".
          </p>
          
          <label class="block mb-2 text-sm font-semibold text-white">Sujet (optionnel)</label>
          <input 
            type="text" 
            id="emailSubject" 
            class="input mb-4" 
            placeholder="Ex: Demande de devis"
          />
          
          <label class="block mb-2 text-sm font-semibold text-white">Contenu de l'email *</label>
          <textarea 
            id="emailContent" 
            rows="15" 
            class="input" 
            placeholder="Collez ici le contenu complet de l'email..."
          ></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          <button class="btn btn-primary" onclick="saveEmailForTriage()">
            <i class="fas fa-save"></i> Enregistrer
          </button>
        </div>
      </div>
    </div>
  `);
}

// Sauvegarder un email pour tri ultérieur
function openEmailProcessingModal() {
  const modal = `
    <div style="max-width: 800px;">
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
          <i class="fas fa-robot" style="font-size: 1.5rem; color: white;"></i>
        </div>
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 700; color: white; margin: 0;">
            🤖 Traitement IA des emails
          </h2>
          <p style="font-size: 0.875rem; color: #9ca3af; margin: 0.25rem 0 0 0;">
            L'IA analyse vos emails et crée automatiquement des leads qualifiés
          </p>
        </div>
      </div>
      
      <form id="emailProcessingForm">
        <div class="input-group">
          <label class="text-white font-semibold">📧 Collez vos emails ici</label>
          <textarea 
            id="emailContent" 
            class="input" 
            rows="12" 
            placeholder="Copiez-collez un ou plusieurs emails ici...

Exemple :
De: client@example.com
Objet: Demande de devis portail coulissant
Message: Bonjour, je souhaite un devis pour un portail coulissant de 4m...
---
De: autre@client.fr
Objet: Information portillon
..."
            required
          ></textarea>
        </div>
        
        <div class="bg-blue-900/30 p-4 rounded-lg mb-4">
          <p class="text-sm text-gray-300">
            <i class="fas fa-info-circle text-blue-400"></i>
            <strong class="text-white">L'IA va :</strong>
          </p>
          <ul class="text-sm text-gray-300 mt-2 space-y-1 ml-6">
            <li>✅ Détecter les opportunités commerciales</li>
            <li>✅ Extraire les coordonnées (nom, email, téléphone)</li>
            <li>✅ Identifier le type de projet (portail, portillon, etc.)</li>
            <li>✅ Estimer le montant si possible</li>
            <li>✅ Créer automatiquement des Leads dans le pipeline</li>
          </ul>
        </div>
        
        <div class="flex gap-3">
          <button type="button" class="btn btn-secondary flex-1" onclick="closeModal()">
            <i class="fas fa-times"></i> Annuler
          </button>
          <button type="submit" class="btn btn-primary flex-1">
            <i class="fas fa-magic"></i> Analyser avec l'IA
          </button>
        </div>
      </form>
    </div>
  `;
  
  showModal(modal);
  
  document.getElementById('emailProcessingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await processEmailsWithAI();
  });
}

async function processEmailsWithAI() {
  const emailContent = document.getElementById('emailContent').value;
  
  if (!emailContent.trim()) {
    alert('⚠️ Veuillez coller au moins un email');
    return;
  }
  
  // Afficher un loader
  const submitBtn = document.querySelector('#emailProcessingForm button[type="submit"]');
  const originalHTML = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyse en cours...';
  
  try {
    // TODO: Appeler l'API backend qui utilisera l'IA
    const response = await axios.post(`${API_URL}/api/ai/process-emails`, {
      content: emailContent,
      ai_config: state.aiConfig || {}
    });
    
    const { leads_created, leads_updated, summary } = response.data;
    
    closeModal();
    
    // Afficher le résumé
    alert(`✅ Traitement terminé !\n\n📊 Résumé :\n• ${leads_created} nouveaux leads créés\n• ${leads_updated} dossiers mis à jour\n\n${summary || ''}`);
    
    // Rafraîchir la vue appropriée
    if (state.currentView === 'mails') {
      navigate('mails');
    } else {
      navigate('pipeline');
    }
    
  } catch (error) {
    console.error('Erreur traitement emails:', error);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHTML;
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// Ouvrir la modale pour ajouter un email reçu
async function saveEmailForTriage() {
  const subject = document.getElementById('emailSubject').value.trim();
  const content = document.getElementById('emailContent').value.trim();
  
  if (!content) {
    alert('⚠️ Veuillez saisir le contenu de l\'email');
    return;
  }
  
  try {
    await axios.post(`${API_URL}/api/emails/save`, {
      subject: subject || 'Sans objet',
      content
    });
    
    alert('✅ Email enregistré ! Vous pouvez maintenant le trier.');
    closeModal();
    renderMails(); // Rafraîchir la liste
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de l\'enregistrement');
  }
}



// Fonction pour afficher la page Mails avec intégration Gmail
async function renderMails() {
  console.log('🔵 renderMails() avec Gmail démarré');
  
  const appDiv = document.getElementById('app');
  if (!appDiv) {
    console.error('❌ #app introuvable');
    return;
  }
  
  // Vérifier si Gmail est connecté
  const gmailToken = localStorage.getItem('gmail_access_token');
  const gmailEmail = localStorage.getItem('gmail_email');
  const gmailExpiresAt = localStorage.getItem('gmail_expires_at');
  
  const isGmailConnected = gmailToken && gmailExpiresAt && Date.now() < parseInt(gmailExpiresAt);
  
  if (!isGmailConnected) {
    // Afficher le bouton de connexion Gmail
    appDiv.innerHTML = `
      <div class="card-header">
        <div class="flex items-center gap-3">
          <button class="btn btn-secondary btn-sm" onclick="navigate('dashboard')">
            <i class="fas fa-arrow-left"></i> Retour
          </button>
          <h2 class="text-2xl font-bold text-white">
            <i class="fas fa-envelope"></i> Mails
          </h2>
        </div>
      </div>
      
      <div class="card" style="text-align: center; padding: 3rem;">
        <i class="fas fa-envelope" style="font-size: 4rem; color: #3b82f6; margin-bottom: 1.5rem;"></i>
        <h3 class="text-xl font-bold text-white mb-3">Connectez votre compte Gmail</h3>
        <p class="text-gray-400 mb-6">Pour accéder à vos emails, connectez votre compte Gmail professionnel</p>
        
        <button 
          class="btn btn-primary" 
          onclick="window.location.href='/api/auth/gmail'"
          style="font-size: 1.1rem; padding: 1rem 2rem;"
        >
          <i class="fab fa-google"></i> Connecter Gmail
        </button>
      </div>
    `;
    return;
  }
  
  // Gmail connecté, afficher l'interface
  appDiv.innerHTML = `
    <div class="card-header">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button class="btn btn-secondary btn-sm" onclick="navigate('dashboard')">
            <i class="fas fa-arrow-left"></i> Retour
          </button>
          <h2 class="text-2xl font-bold text-white">
            <i class="fas fa-envelope"></i> Mails
          </h2>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-400">
            ${gmailEmail}
          </span>
          <button class="btn btn-secondary btn-sm" onclick="disconnectGmail()">
            <i class="fas fa-sign-out-alt"></i> Déconnecter
          </button>
          <button class="btn btn-primary" onclick="refreshEmails()">
            <i class="fas fa-sync"></i> Actualiser
          </button>
        </div>
      </div>
    </div>
    
    <div id="emails-container">
      <div class="card" style="text-align: center; padding: 2rem;">
        <i class="fas fa-spinner fa-spin text-blue-500" style="font-size: 2rem;"></i>
        <p class="text-gray-400 mt-3">Chargement des emails...</p>
      </div>
    </div>
  `;
  
  // Charger les emails
  try {
    const response = await fetch(`/api/emails?access_token=${encodeURIComponent(gmailToken)}`);
    const data = await response.json();
    
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Erreur lors du chargement');
    }
    
    let emails = data.emails || [];
    
    // Classifier les emails avec l'IA
    console.log('🤖 Classification IA des emails...');
    const emailsContainer = document.getElementById('emails-container');
    if (emailsContainer) {
      emailsContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 2rem;">
          <i class="fas fa-brain fa-spin text-blue-500" style="font-size: 2rem;"></i>
          <p class="text-gray-400 mt-3">🤖 Classification intelligente avec IA...</p>
          <p class="text-sm text-gray-500 mt-1">Analyse de ${emails.length} emails</p>
        </div>
      `;
    }
    
    try {
      const classifyResponse = await fetch('/api/emails/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails })
      });
      
      if (classifyResponse.ok) {
        const classifyData = await classifyResponse.json();
        emails = classifyData.emails || emails;
        console.log('✅ Classification IA réussie !');
        
        // Utiliser la catégorie IA si disponible
        emails.forEach(email => {
          email.category = email.ai_category || 'autres';
          email.ai_classified = !!email.ai_category;
        });
      } else {
        console.warn('⚠️ Classification IA échouée, utilisation des règles simples');
        // Fallback: classification basique
        emails.forEach(email => {
          const subject = (email.subject || '').toLowerCase();
          const from = (email.from || '').toLowerCase();
          const snippet = (email.snippet || '').toLowerCase();
          const content = subject + ' ' + from + ' ' + snippet;
          
          if (content.match(/devis|quotation|quote|estimation|prix|demande|intéressé|projet|portail/)) email.category = 'prospect';
          else if (content.match(/facture|invoice|payment|paiement|règlement/)) email.category = 'factures';
          else if (content.match(/commande|order|achat|livraison/)) email.category = 'commandes';
          else if (content.match(/client|customer|psm/)) email.category = 'clients';
          else if (content.match(/fournisseur|supplier|vendor/)) email.category = 'fournisseurs';
          else if (content.match(/urgent|important|asap/)) email.category = 'urgent';
          else email.category = 'autres';
          
          email.ai_classified = false;
        });
      }
    } catch (classifyError) {
      console.error('Erreur classification IA:', classifyError);
      // Fallback: classification basique
      emails.forEach(email => {
        const subject = (email.subject || '').toLowerCase();
        const from = (email.from || '').toLowerCase();
        const snippet = (email.snippet || '').toLowerCase();
        const content = subject + ' ' + from + ' ' + snippet;
        
        if (content.match(/devis|quotation|quote|estimation|prix/)) email.category = 'devis';
        else if (content.match(/facture|invoice|payment|paiement|règlement/)) email.category = 'factures';
        else if (content.match(/commande|order|achat|livraison/)) email.category = 'commandes';
        else if (content.match(/client|customer|psm|portail/)) email.category = 'clients';
        else if (content.match(/fournisseur|supplier|vendor/)) email.category = 'fournisseurs';
        else if (content.match(/urgent|important|asap/)) email.category = 'urgent';
        else email.category = 'autres';
        
        email.ai_classified = false;
      });
    }
    
    // Charger les catégories manuellement modifiées depuis la base
    try {
      const token = storage.get('token');
      if (token) {
        const savedCategoriesResponse = await fetch('/api/emails/get-categories', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (savedCategoriesResponse.ok) {
          const savedData = await savedCategoriesResponse.json();
          const savedCategories = savedData.categories || {};
          
          // Remplacer les catégories par celles sauvegardées
          emails.forEach(email => {
            if (savedCategories[email.id]) {
              email.category = savedCategories[email.id];
              email.manually_classified = true;
            }
          });
          
          console.log('✅ Catégories sauvegardées chargées:', Object.keys(savedCategories).length);
        }
      }
    } catch (error) {
      console.warn('⚠️ Impossible de charger les catégories sauvegardées:', error);
    }
    
    // Stocker les emails dans l'état global
    window.currentEmails = emails;
    window.selectedCategory = window.selectedCategory || 'tous';
    
    // Afficher les emails
    if (emailsContainer) {
      if (emails.length === 0) {
        emailsContainer.innerHTML = `
          <div class="card" style="text-align: center; padding: 3rem;">
            <i class="fas fa-inbox text-gray-500" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <p class="text-gray-400">Aucun email trouvé</p>
          </div>
        `;
      } else {
        // Compter par catégorie
        const categories = {
          tous: emails.length,
          devis: emails.filter(e => e.category === 'devis').length,
          factures: emails.filter(e => e.category === 'factures').length,
          commandes: emails.filter(e => e.category === 'commandes').length,
          clients: emails.filter(e => e.category === 'clients').length,
          fournisseurs: emails.filter(e => e.category === 'fournisseurs').length,
          urgent: emails.filter(e => e.category === 'urgent').length,
          autres: emails.filter(e => e.category === 'autres').length
        };
        
        // Filtrer les emails par catégorie sélectionnée
        const filteredEmails = window.selectedCategory === 'tous' 
          ? emails 
          : emails.filter(e => e.category === window.selectedCategory);
        
        emailsContainer.innerHTML = `
          <!-- Filtres par catégorie -->
          <div class="card mb-4">
            <div class="flex flex-wrap gap-2 p-4">
              ${Object.entries(categories).map(([cat, count]) => `
                <button 
                  class="btn ${window.selectedCategory === cat ? 'btn-primary' : 'btn-secondary'} btn-sm"
                  onclick="filterEmailsByCategory('${cat}')"
                >
                  <i class="fas fa-${cat === 'tous' ? 'inbox' : cat === 'devis' ? 'file-invoice' : cat === 'factures' ? 'receipt' : cat === 'commandes' ? 'shopping-cart' : cat === 'clients' ? 'users' : cat === 'fournisseurs' ? 'truck' : cat === 'urgent' ? 'exclamation-triangle' : 'folder'}"></i>
                  ${cat.charAt(0).toUpperCase() + cat.slice(1)} (${count})
                </button>
              `).join('')}
            </div>
          </div>
          
          <!-- Liste des emails -->
          <div class="card">
            <div class="emails-list">
              ${filteredEmails.map((email, index) => `
                <div class="email-item" style="padding: 1rem; border-bottom: 1px solid #374151; cursor: pointer;" onclick="toggleEmailDetails(${index})">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-semibold text-white">${email.from || 'Expéditeur inconnu'}</span>
                        ${email.unread ? '<span class="badge badge-primary">Non lu</span>' : ''}
                        <span class="badge" style="background: ${
                          email.category === 'urgent' ? '#ef4444' : 
                          email.category === 'prospect' ? '#f59e0b' : 
                          email.category === 'factures' ? '#10b981' : 
                          email.category === 'commandes' ? '#3b82f6' : 
                          email.category === 'clients' ? '#8b5cf6' : 
                          email.category === 'fournisseurs' ? '#ec4899' : '#6b7280'
                        };">${email.category.toUpperCase()}</span>
                        ${email.ai_classified ? '<span class="badge" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-size: 0.65rem;"><i class="fas fa-brain"></i> IA</span>' : ''}
                      </div>
                      <div class="text-sm text-white mb-1">${email.subject || 'Sans objet'}</div>
                      <div class="text-xs text-gray-400">${email.snippet || ''}</div>
                      
                      <!-- Détails de l'email (masqués par défaut) -->
                      <div id="email-details-${index}" style="display: none; margin-top: 1rem; padding: 1rem; background: #1f2937; border-radius: 0.5rem;">
                        <div class="text-sm text-gray-300 mb-2">
                          <strong>De :</strong> ${email.from || 'Inconnu'}
                        </div>
                        <div class="text-sm text-gray-300 mb-2">
                          <strong>Date :</strong> ${new Date(email.date).toLocaleString('fr-FR')}
                        </div>
                        <div class="text-sm text-gray-300 mb-2">
                          <strong>Objet :</strong> ${email.subject || 'Sans objet'}
                        </div>
                        ${email.ai_classified ? `
                          <div class="text-sm mb-2" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 0.75rem; border-radius: 0.5rem;">
                            <div class="text-white font-semibold mb-1">
                              <i class="fas fa-brain"></i> Analyse IA
                            </div>
                            <div class="text-gray-100 text-xs">
                              ${email.ai_reason ? `<div><strong>Raison :</strong> ${email.ai_reason}</div>` : ''}
                              ${email.ai_priority ? `<div><strong>Priorité :</strong> ${email.ai_priority === 'high' ? '🔴 Haute' : email.ai_priority === 'low' ? '🟢 Basse' : '🟡 Moyenne'}</div>` : ''}
                              ${email.ai_suggested_action ? `<div><strong>Action suggérée :</strong> ${email.ai_suggested_action}</div>` : ''}
                              ${email.ai_confidence ? `<div><strong>Confiance :</strong> ${Math.round(email.ai_confidence * 100)}%</div>` : ''}
                            </div>
                          </div>
                        ` : ''}
                        <div class="text-sm text-gray-300 mb-3">
                          <strong>Contenu :</strong>
                        </div>
                        <div class="text-sm text-gray-400" style="white-space: pre-wrap; max-height: 400px; overflow-y: auto;">
                          ${email.snippet || 'Aucun contenu disponible'}
                        </div>
                        
                        <!-- Actions -->
                        <div class="flex gap-2 mt-4">
                          ${email.category === 'prospect' ? `
                          <button class="btn btn-success btn-sm" onclick="createLeadFromEmail('${email.id}', ${index})" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                            <i class="fas fa-plus-circle"></i> Créer Lead
                          </button>
                          ` : ''}
                          <button class="btn btn-primary btn-sm" onclick="replyToEmail('${email.id}')">
                            <i class="fas fa-reply"></i> Répondre
                          </button>
                          <button class="btn btn-primary btn-sm email-action-btn" data-action="view-thread" data-thread-id="${email.threadId}" data-email-id="${email.id}">
                            <i class="fas fa-comments"></i> Voir le fil
                          </button>
                          <button class="btn btn-secondary btn-sm email-action-btn" data-action="change-category" data-email-id="${email.id}" data-index="${index}">
                            <i class="fas fa-tag"></i> Changer catégorie
                          </button>
                        </div>
                      </div>
                    </div>
                    <div class="text-xs text-gray-500">
                      ${new Date(email.date).toLocaleDateString('fr-FR')}
                      <i class="fas fa-chevron-down ml-2" id="email-arrow-${index}"></i>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Erreur chargement emails:', error);
    const emailsContainer = document.getElementById('emails-container');
    if (emailsContainer) {
      emailsContainer.innerHTML = `
        <div class="card" style="text-align: center; padding: 2rem;">
          <i class="fas fa-exclamation-triangle text-red-500" style="font-size: 2rem;"></i>
          <p class="text-red-400 mt-3">Erreur: ${error.message}</p>
          <button class="btn btn-primary mt-3" onclick="refreshEmails()">
            <i class="fas fa-redo"></i> Réessayer
          </button>
        </div>
      `;
    }
  }
}

// Fonction pour déconnecter Gmail
function disconnectGmail() {
  if (confirm('Voulez-vous vraiment déconnecter votre compte Gmail ?')) {
    localStorage.removeItem('gmail_access_token');
    localStorage.removeItem('gmail_refresh_token');
    localStorage.removeItem('gmail_email');
    localStorage.removeItem('gmail_expires_at');
    renderMails();
  }
}

// Fonction pour rafraîchir les emails
function refreshEmails() {
  renderMails();
}

// ==================== EVENT LISTENER GLOBAL POUR LES ACTIONS EMAIL ====================
// Utiliser la délégation d'événements au lieu de onclick
document.addEventListener('click', function(event) {
  const target = event.target.closest('.email-action-btn');
  
  if (!target) return; // Pas un bouton d'action email
  
  const action = target.dataset.action;
  const index = target.dataset.index;
  const emailId = target.dataset.emailId;
  const threadId = target.dataset.threadId;
  
  console.log('🔘 Action email:', action, { index, emailId, threadId });
  
  switch(action) {
    case 'create-lead':
      if (emailId) {
        createLeadFromEmail(emailId, index !== undefined ? parseInt(index) : -1);
      } else if (index !== undefined) {
        createLeadFromEmail(null, parseInt(index));
      }
      break;
      
    case 'reply':
      if (emailId) {
        replyToEmail(emailId);
      }
      break;
      
    case 'view-thread':
      if (threadId && emailId) {
        viewThreadConversation(threadId, emailId);
      }
      break;
      
    case 'change-category':
      if (emailId && index !== undefined) {
        changeEmailCategory(emailId, parseInt(index));
      }
      break;
      
    default:
      console.warn('⚠️ Action inconnue:', action);
  }
});

// Fonction pour développer/réduire un email
function toggleEmailDetails(index) {
  const detailsDiv = document.getElementById(`email-details-${index}`);
  const arrowIcon = document.getElementById(`email-arrow-${index}`);
  
  if (detailsDiv) {
    if (detailsDiv.style.display === 'none') {
      detailsDiv.style.display = 'block';
      if (arrowIcon) arrowIcon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    } else {
      detailsDiv.style.display = 'none';
      if (arrowIcon) arrowIcon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
  }
}

// Fonction pour filtrer les emails par catégorie
function filterEmailsByCategory(category) {
  window.selectedCategory = category;
  renderMails();
}

// Fonction pour changer la catégorie d'un email
function changeEmailCategory(emailId, index) {
  const currentEmail = window.currentEmails[index];
  
  const categoryConfig = {
    prospect: { icon: 'fa-star', label: 'Prospect', color: '#f59e0b' },
    factures: { icon: 'fa-receipt', label: 'Factures', color: '#10b981' },
    commandes: { icon: 'fa-shopping-cart', label: 'Commandes', color: '#3b82f6' },
    clients: { icon: 'fa-users', label: 'Clients', color: '#8b5cf6' },
    fournisseurs: { icon: 'fa-truck', label: 'Fournisseurs', color: '#ec4899' },
    urgent: { icon: 'fa-exclamation-triangle', label: 'Urgent', color: '#ef4444' },
    autres: { icon: 'fa-folder', label: 'Autres', color: '#6b7280' }
  };
  
  // Créer la modale
  const modalHTML = `
    <div class="modal-backdrop" id="category-modal" onclick="if(event.target.id === 'category-modal') closeCategoryModal()">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-tag"></i> Changer la catégorie</h3>
          <button class="modal-close" onclick="closeCategoryModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div style="margin-bottom: 1.5rem;">
            <p class="text-sm text-gray-400 mb-2">Email : <strong class="text-white">${currentEmail.subject || 'Sans objet'}</strong></p>
            <p class="text-sm text-gray-400">Catégorie actuelle : 
              <span class="badge" style="background: ${categoryConfig[currentEmail.category].color};">
                <i class="fas ${categoryConfig[currentEmail.category].icon}"></i>
                ${categoryConfig[currentEmail.category].label}
              </span>
            </p>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;">
            ${Object.entries(categoryConfig).map(([key, config]) => `
              <button 
                class="category-option ${currentEmail.category === key ? 'active' : ''}"
                style="
                  padding: 1rem;
                  border-radius: 10px;
                  border: 2px solid ${currentEmail.category === key ? config.color : '#374151'};
                  background: ${currentEmail.category === key ? config.color + '20' : 'transparent'};
                  cursor: pointer;
                  transition: all 0.2s;
                  text-align: center;
                "
                onmouseover="this.style.borderColor='${config.color}'; this.style.background='${config.color}20';"
                onmouseout="if(!this.classList.contains('active')) { this.style.borderColor='#374151'; this.style.background='transparent'; }"
                onclick="selectCategory('${key}', ${index})"
              >
                <i class="fas ${config.icon}" style="font-size: 1.5rem; color: ${config.color}; margin-bottom: 0.5rem; display: block;"></i>
                <div class="text-white font-semibold">${config.label}</div>
              </button>
            `).join('')}
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeCategoryModal()">
            <i class="fas fa-times"></i> Annuler
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Fonction pour fermer la modale de catégorie
function closeCategoryModal() {
  const modal = document.getElementById('category-modal');
  if (modal) {
    modal.remove();
  }
}

// Fonction pour sélectionner une catégorie
async function selectCategory(category, index) {
  const email = window.currentEmails[index];
  
  try {
    const token = storage.get('token');
    if (!token) {
      alert('Vous devez être connecté');
      return;
    }
    
    console.log('🔄 Changement de catégorie...', { 
      emailId: email.id, 
      oldCategory: email.category, 
      newCategory: category 
    });
    
    // Sauvegarder le changement de catégorie via l'API
    const response = await fetch('/api/emails/update-category', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        emailId: email.id,
        category: category
      })
    });
    
    if (!response.ok) {
      console.warn('⚠️ Impossible de sauvegarder en base, changement local uniquement');
    } else {
      console.log('✅ Catégorie sauvegardée en base');
    }
    
    // Mettre à jour localement
    window.currentEmails[index].category = category;
    
    // Fermer la modale et rafraîchir l'affichage
    closeCategoryModal();
    renderMails();
    
    console.log('✅ Catégorie changée avec succès');
    
  } catch (error) {
    console.error('❌ Erreur changement catégorie:', error);
    // Continuer quand même avec le changement local
    window.currentEmails[index].category = category;
    closeCategoryModal();
    renderMails();
  }
}

// Fonction pour voir le fil complet d'une conversation
async function viewThreadConversation(threadId, currentEmailId) {
  const accessToken = localStorage.getItem('gmail_access_token');
  
  if (!accessToken) {
    alert('Token Gmail manquant');
    return;
  }
  
  try {
    // Créer une modale avec un spinner
    const modalHTML = `
      <div class="modal-backdrop" id="thread-modal" onclick="if(event.target.id === 'thread-modal') closeThreadModal()">
        <div class="modal-content" style="max-width: 900px; max-height: 80vh; overflow-y: auto;">
          <div class="modal-header">
            <h3><i class="fas fa-comments"></i> Fil de conversation</h3>
            <button class="modal-close" onclick="closeThreadModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body" id="thread-content">
            <div style="text-align: center; padding: 2rem;">
              <div class="loading-spinner"></div>
              <p class="text-gray-400 mt-3">Chargement du fil de conversation...</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Appel API pour récupérer le thread
    const response = await fetch(`/api/emails/thread/${threadId}?access_token=${accessToken}`);
    const data = await response.json();
    
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Erreur chargement thread');
    }
    
    const messages = data.messages || [];
    
    // Afficher tous les messages du fil
    const threadContent = document.getElementById('thread-content');
    threadContent.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${messages.map((msg, index) => {
          const isCurrentEmail = msg.id === currentEmailId;
          const isSentByMe = msg.from.includes(localStorage.getItem('gmail_email') || 'commercial.pinoit');
          
          return `
            <div class="card" style="
              ${isCurrentEmail ? 'border: 2px solid #3b82f6;' : ''}
              ${isSentByMe ? 'background: #1e293b; border-left: 4px solid #10b981;' : 'background: #2d3748; border-left: 4px solid #3b82f6;'}
            ">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                <div>
                  <div class="text-sm font-semibold" style="color: ${isSentByMe ? '#10b981' : '#3b82f6'};">
                    <i class="fas ${isSentByMe ? 'fa-paper-plane' : 'fa-inbox'}"></i>
                    ${isSentByMe ? 'Vous' : msg.from}
                  </div>
                  <div class="text-xs text-gray-500">
                    ${new Date(msg.date).toLocaleString('fr-FR')}
                  </div>
                </div>
                ${isCurrentEmail ? '<span class="badge" style="background: #3b82f6;">Email actuel</span>' : ''}
              </div>
              
              <div class="text-sm text-gray-300 mb-2">
                <strong>Objet :</strong> ${msg.subject || 'Sans objet'}
              </div>
              
              <div class="text-sm text-gray-400" style="white-space: pre-wrap; max-height: 300px; overflow-y: auto; padding: 0.75rem; background: #111827; border-radius: 0.5rem;">
                ${msg.body || msg.snippet || 'Aucun contenu'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="flex gap-2 mt-4">
        <button class="btn btn-primary" onclick="replyToThreadFromModal('${threadId}', '${currentEmailId}')">
          <i class="fas fa-reply"></i> Répondre
        </button>
        <button class="btn btn-secondary" onclick="closeThreadModal()">
          <i class="fas fa-times"></i> Fermer
        </button>
      </div>
    `;
    
  } catch (error) {
    console.error('Erreur thread:', error);
    alert('Erreur lors du chargement du fil : ' + error.message);
    closeThreadModal();
  }
}

// Fonction pour fermer la modale de fil
function closeThreadModal() {
  const modal = document.getElementById('thread-modal');
  if (modal) {
    modal.remove();
  }
}

// Fonction pour répondre depuis la modale de fil
function replyToThreadFromModal(threadId, emailId) {
  closeThreadModal();
  replyToEmail(emailId);
}

// Fonction pour créer un Lead à partir d'un email (VERSION SIMPLE SANS IA)
async function createLeadFromEmail(emailId, index = -1) {
  const email = window.currentEmails.find((item) => item.id === emailId) || window.currentEmails[index];
  
  if (!email) {
    alert('Email introuvable');
    return;
  }
  
  try {
    const token = storage.get('token');
    if (!token) {
      alert('Vous devez être connecté');
      return;
    }
    
    console.log('🔄 Extraction des infos depuis email...', { 
      from: email.from, 
      subject: email.subject,
      emailId: email.id 
    });
    
    // ÉTAPE 1 : Récupérer le contenu COMPLET de l'email
    const gmailToken = localStorage.getItem('gmail_access_token');
    let fullEmailBody = email.snippet || email.body || '';
    
    if (gmailToken && email.id) {
      try {
        const fullEmailResponse = await fetch(`/api/emails/${email.id}?access_token=${encodeURIComponent(gmailToken)}`);
        if (fullEmailResponse.ok) {
          const fullEmailData = await fullEmailResponse.json();
          fullEmailBody = fullEmailData.body || fullEmailData.snippet || fullEmailBody;
          console.log('✅ Contenu complet récupéré:', fullEmailBody.substring(0, 200) + '...');
        }
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer le contenu complet:', error);
      }
    }
    
    // ÉTAPE 2 : Parser le contenu avec la fonction dédiée
    console.log('🔍 CONTENU ENVOYÉ AU PARSER:', fullEmailBody);
    console.log('🔍 LONGUEUR DU CONTENU:', fullEmailBody.length, 'caractères');
    
    // DEBUG : Afficher le contenu dans une alerte si vide
    if (fullEmailBody.length < 50) {
      alert('⚠️ DEBUG: Le contenu de l\'email est trop court (' + fullEmailBody.length + ' caractères). Vérifiez la console (F12).');
    }
    
    const extractedData = parseEmailContent(fullEmailBody);
    
    console.log('📊 DONNÉES EXTRAITES PAR LE PARSER:', extractedData);
    console.log('  - Nom:', extractedData.last_name);
    console.log('  - Prénom:', extractedData.first_name);
    console.log('  - Email:', extractedData.email);
    console.log('  - Téléphone:', extractedData.phone);
    console.log('  - Type:', extractedData.type);
    
    // DEBUG : Si rien n'est extrait, afficher une alerte
    if (!extractedData.last_name && !extractedData.email && !extractedData.phone) {
      console.error('❌ AUCUNE DONNÉE EXTRAITE !');
      console.error('Le parser n\'a trouvé ni nom, ni email, ni téléphone dans le contenu suivant:');
      console.error(fullEmailBody);
    }
    
    // Extraire aussi l'email et le nom depuis le champ "De:" SEULEMENT si parser n'a rien trouvé
    const fromEmail = email.from.match(/[\w.-]+@[\w.-]+/)?.[0] || '';
    const fromName = email.from.replace(/<.*>/, '').trim().replace(fromEmail, '').trim();
    
    // ⚠️ NE PAS utiliser fromName/fromEmail comme fallback pour les emails Solocal
    // Car ils contiennent "Contact PSM" et "mailer@multiscreensite.com"
    
    // Fusionner les données SANS fallback sur les mauvaises infos
    const mergedData = {
      civility: extractedData.civility || 'M.',
      first_name: extractedData.first_name || '',
      last_name: extractedData.last_name || '',  // PAS de fallback
      phone: extractedData.phone || '',
      email: extractedData.email || '',           // PAS de fallback
      company: extractedData.company || '',
      address: extractedData.address || '',
      type: extractedData.type || '',
      notes: fullEmailBody,
      email_subject: email.subject || 'Demande depuis email',
      email_date: email.date || new Date().toISOString()
    };
    
    console.log('✅ Données fusionnées (SANS fallback défectueux):', mergedData);
    
    // ÉTAPE 3 : Afficher le formulaire pré-rempli
    showModal(`
      <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
        <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 700px;">
          <div class="modal-header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
            <h3><i class="fas fa-envelope"></i> Créer un lead depuis l'email</h3>
            <button class="modal-close" onclick="closeModal()" style="color: white;"><i class="fas fa-times"></i></button>
          </div>
          <form id="emailLeadForm" class="modal-body">
            <div class="bg-green-900 bg-opacity-30 p-3 rounded mb-4 text-sm text-green-200">
              <i class="fas fa-check-circle"></i> <strong>Informations extraites automatiquement !</strong> Vérifiez et complétez si nécessaire.
            </div>
            
            <h4 class="text-lg font-bold text-white mb-3"><i class="fas fa-user"></i> Informations du contact</h4>
            
            <div class="grid grid-cols-2 gap-3">
              <div class="input-group">
                <label class="input-label">Civilité</label>
                <select name="civility" class="input">
                  <option value="">Choisir...</option>
                  <option value="M." ${mergedData.civility === 'M.' ? 'selected' : ''}>M.</option>
                  <option value="Mme" ${mergedData.civility === 'Mme' ? 'selected' : ''}>Mme</option>
                  <option value="M. et Mme" ${mergedData.civility === 'M. et Mme' ? 'selected' : ''}>M. et Mme</option>
                </select>
              </div>
              
              <div class="input-group">
                <label class="input-label">Prénom</label>
                <input type="text" name="first_name" class="input" placeholder="Ex: Jean" value="${mergedData.first_name}" />
              </div>
            </div>
            
            <div class="input-group">
              <label class="input-label">Nom</label>
              <input type="text" name="last_name" class="input" placeholder="Ex: Dupont" value="${mergedData.last_name}" />
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div class="input-group">
                <label class="input-label">Téléphone</label>
                <input type="tel" name="phone" class="input" placeholder="Ex: 06 12 34 56 78" value="${mergedData.phone}" />
              </div>
              
              <div class="input-group">
                <label class="input-label">Email</label>
                <input type="email" name="email" class="input" placeholder="Ex: contact@example.com" value="${mergedData.email}" />
              </div>
            </div>
            
            <div class="input-group">
              <label class="input-label">Société</label>
              <input type="text" name="company" class="input" placeholder="Ex: Dupont Menuiserie" value="${mergedData.company}" />
            </div>
            
            <div class="input-group">
              <label class="input-label">Adresse</label>
              <input type="text" name="address" class="input" placeholder="Ex: 12 rue de la Paix, 44000 Nantes" value="${mergedData.address}" />
            </div>
            
            <hr class="my-4" style="border-color: rgba(255,255,255,0.1)">
            
            <h4 class="text-lg font-bold text-white mb-3"><i class="fas fa-bullseye"></i> Besoin / Projet</h4>
            
            <div class="input-group">
              <label class="input-label">Type de projet</label>
              <select name="type" class="input">
                <option value="">Choisir...</option>
                <option value="Portail coulissant" ${mergedData.type === 'Portail coulissant' ? 'selected' : ''}>Portail coulissant</option>
                <option value="Portail battant" ${mergedData.type === 'Portail battant' ? 'selected' : ''}>Portail battant</option>
                <option value="Portillon" ${mergedData.type === 'Portillon' ? 'selected' : ''}>Portillon</option>
                <option value="Clôture" ${mergedData.type === 'Clôture' ? 'selected' : ''}>Clôture</option>
                <option value="Motorisation" ${mergedData.type === 'Motorisation' ? 'selected' : ''}>Motorisation</option>
                <option value="Réparation" ${mergedData.type === 'Réparation' ? 'selected' : ''}>Réparation</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            
            <div class="input-group">
              <label class="input-label">Montant estimé (€)</label>
              <input type="number" name="estimated_amount" class="input" placeholder="Ex: 5000" step="0.01" />
            </div>
            
            <div class="input-group">
              <label class="input-label">Notes / Contexte</label>
              <textarea name="notes" class="input" rows="4" placeholder="Décrivez le besoin, la référence, le contexte...">${mergedData.notes}</textarea>
            </div>
            
            <!-- Champs cachés -->
            <input type="hidden" name="email_subject" value="${mergedData.email_subject}" />
            <input type="hidden" name="email_id" value="${email.id}" />
          </form>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
            <button class="btn btn-success" onclick="submitEmailLeadForm()" style="font-size: 1.1rem; padding: 0.75rem 1.5rem;">
              <i class="fas fa-check-circle"></i> Créer le lead
            </button>
          </div>
        </div>
      </div>
    `);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    alert('❌ Erreur lors de l\'extraction : ' + error.message);
  }
}

// Fonction pour fermer la modale de confirmation
function closeLeadConfirmModal() {
  const modal = document.getElementById('lead-confirm-modal');
  if (modal) {
    modal.remove();
  }
}

// Fonction pour aller aux Leads
async function goToLeads() {
  closeLeadConfirmModal();
  // Pour l'instant, on va au Pipeline
  // TODO: créer une page dédiée aux Leads
  navigate('pipeline');
}

// Fonction pour convertir un Lead en Client
async function convertLeadToClient(leadId) {
  try {
    const token = storage.get('token');
    if (!token) {
      alert('Vous devez être connecté');
      return;
    }
    
    console.log('🔄 Conversion du lead en client...', leadId);
    
    const response = await fetch(`/api/leads/${leadId}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erreur conversion:', errorData);
      throw new Error(errorData.error || 'Erreur conversion');
    }
    
    const { lead, client } = await response.json();
    console.log('✅ Lead converti en client:', { lead, client });
    
    // Fermer la modale actuelle
    closeLeadConfirmModal();
    
    // Afficher une nouvelle modale de succès
    const successHTML = `
      <div class="modal-backdrop" id="convert-success-modal">
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
            <h3><i class="fas fa-user-check"></i> Client créé !</h3>
          </div>
          
          <div class="modal-body">
            <div style="text-align: center; padding: 2rem;">
              <i class="fas fa-user-check text-blue-500" style="font-size: 4rem;"></i>
              <h4 class="text-white mt-4 mb-2">Lead converti en Client !</h4>
              <p class="text-gray-400 mb-4">
                <strong>${client.name}</strong> est maintenant un client
              </p>
              <div class="card" style="text-align: left; margin-top: 1rem;">
                <div class="text-sm text-gray-300 mb-2">
                  <strong>Nom :</strong> ${client.name}
                </div>
                <div class="text-sm text-gray-300 mb-2">
                  <strong>Email :</strong> ${client.email}
                </div>
                <div class="text-sm text-gray-300">
                  <strong>Statut :</strong> <span class="badge badge-success">CLIENT</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="closeConvertSuccessModal(); navigate('clients')">
              <i class="fas fa-users"></i> Voir les Clients
            </button>
            <button class="btn btn-secondary" onclick="closeConvertSuccessModal()">
              <i class="fas fa-times"></i> Fermer
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', successHTML);
    
  } catch (error) {
    console.error('Erreur conversion lead:', error);
    alert('Erreur lors de la conversion : ' + error.message);
  }
}

// Fonction pour fermer la modale de succès de conversion
function closeConvertSuccessModal() {
  const modal = document.getElementById('convert-success-modal');
  if (modal) {
    modal.remove();
  }
}

// Fonction pour aller au Pipeline
async function goToPipeline() {
  closeLeadConfirmModal();
  
  // Utiliser la fonction navigate standard
  navigate('pipeline');
}

// Fonction pour répondre à un email (placeholder)
// Fonction pour répondre à un email
function replyToEmail(emailId) {
  // Trouver l'email dans la liste
  const email = window.currentEmails.find(e => e.id === emailId);
  if (!email) {
    alert('Email introuvable');
    return;
  }
  
  // Créer la modale de réponse
  const modalHTML = `
    <div class="modal-backdrop" id="reply-modal" onclick="if(event.target.id === 'reply-modal') closeReplyModal()">
      <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
          <h3><i class="fas fa-reply"></i> Répondre</h3>
          <button class="modal-close" onclick="closeReplyModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div style="margin-bottom: 1rem; padding: 1rem; background: #1f2937; border-radius: 0.5rem;">
            <div class="text-sm text-gray-400 mb-1">
              <strong>À :</strong> ${email.from || 'Inconnu'}
            </div>
            <div class="text-sm text-gray-400 mb-1">
              <strong>Objet :</strong> Re: ${email.subject || 'Sans objet'}
            </div>
            <div class="text-sm text-gray-400">
              <strong>Message original :</strong> ${email.snippet || ''}
            </div>
          </div>
          
          <!-- CONTEXTE UTILISATEUR (nouveau) -->
          <div style="margin-bottom: 1rem;">
            <label class="input-label" style="font-size: 0.875rem; display: block; margin-bottom: 0.5rem; color: #9ca3af;">
              📝 Contexte pour l'IA (optionnel)
            </label>
            <textarea 
              id="user-context" 
              class="input" 
              rows="2" 
              placeholder="Ex: Je vais lui envoyer un devis, Je confirme le RDV demain 14h, Je refuse poliment..."
              style="font-family: inherit; resize: vertical; font-size: 0.875rem;"
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">💡 Donne du contexte à l'IA pour qu'elle adapte sa réponse (elle n'inventera RIEN d'autre)</p>
          </div>
          
          <!-- Boutons d'assistance IA -->
          <div style="margin-bottom: 1rem;">
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-sm" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;" onclick="generateAIResponse('${emailId}', 'professional')">
                <i class="fas fa-brain"></i> Réponse pro
              </button>
              <button class="btn btn-sm" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;" onclick="generateAIResponse('${emailId}', 'friendly')">
                <i class="fas fa-smile"></i> Réponse amicale
              </button>
              <button class="btn btn-sm" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;" onclick="generateAIResponse('${emailId}', 'brief')">
                <i class="fas fa-compress"></i> Réponse courte
              </button>
              <button class="btn btn-sm" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;" onclick="improveAIText('${emailId}')">
                <i class="fas fa-magic"></i> Améliorer
              </button>
            </div>
          </div>
          
          <div class="input-group">
            <label class="input-label">Votre message</label>
            <textarea 
              id="reply-message" 
              class="input" 
              rows="8" 
              placeholder="Écrivez votre réponse ici ou utilisez l'IA pour générer..."
              style="font-family: inherit; resize: vertical;"
            ></textarea>
          </div>
          
          <div id="reply-status" style="display: none; margin-top: 1rem;"></div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeReplyModal()">
            <i class="fas fa-times"></i> Annuler
          </button>
          <button class="btn btn-primary" onclick="sendReply('${emailId}')">
            <i class="fas fa-paper-plane"></i> Envoyer
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Focus sur le textarea
  setTimeout(() => {
    document.getElementById('reply-message')?.focus();
  }, 100);
}

// Fonction pour générer une réponse avec l'IA
async function generateAIResponse(emailId, tone) {
  const email = window.currentEmails.find(e => e.id === emailId);
  if (!email) return;
  
  const messageTextarea = document.getElementById('reply-message');
  const statusDiv = document.getElementById('reply-status');
  
  if (!messageTextarea || !statusDiv) return;
  
  // Afficher le statut de génération
  statusDiv.style.display = 'block';
  statusDiv.innerHTML = `
    <div style="text-align: center;">
      <i class="fas fa-brain fa-spin" style="font-size: 2rem; color: #667eea;"></i>
      <p class="text-gray-400 mt-2">🤖 L'IA rédige votre réponse...</p>
    </div>
  `;
  
  const toneInstructions = {
    professional: 'Rédige une réponse TRÈS professionnelle et formelle, avec un vocabulaire soutenu et courtois. Style business formel. Commence TOUJOURS par "Bonjour," ou "Bonjour [Prénom],". Vouvoie systématiquement.',
    friendly: 'Rédige une réponse chaleureuse et amicale, mais TOUJOURS professionnelle. Commence par "Bonjour," ou "Bonjour [Prénom],". Vouvoie systématiquement. Ton courtois mais plus détendu.',
    brief: 'Rédige une réponse courte et concise, mais TOUJOURS avec "Bonjour," au début. Vouvoie systématiquement. Va droit au but tout en restant poli et professionnel.'
  };
  
  // Récupérer le contexte utilisateur
  const contextField = document.getElementById('user-context');
  const userContext = contextField ? contextField.value.trim() : '';
  
  try {
    const response = await fetch('/api/emails/generate-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: {
          from: email.from,
          subject: email.subject,
          body: email.body || email.snippet, // Envoyer le contenu COMPLET
          snippet: email.snippet
        },
        tone: tone,
        instruction: toneInstructions[tone] || toneInstructions.professional,
        userContext: userContext // Nouveau : contexte fourni par l'utilisateur
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.reply) {
      messageTextarea.value = result.reply;
      statusDiv.innerHTML = `
        <div style="text-align: center; color: #10b981;">
          <i class="fas fa-check-circle" style="font-size: 1.5rem;"></i>
          <p class="text-sm mt-1">✅ Réponse générée ! Modifie-la si besoin.</p>
        </div>
      `;
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    } else {
      throw new Error(result.error || 'Erreur génération IA');
    }
  } catch (error) {
    console.error('Erreur génération IA:', error);
    statusDiv.innerHTML = `
      <div style="text-align: center; color: #ef4444;">
        <i class="fas fa-exclamation-triangle"></i>
        <p class="text-sm mt-1">❌ ${error.message}</p>
      </div>
    `;
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// Fonction pour améliorer le texte existant avec l'IA
async function improveAIText(emailId) {
  const messageTextarea = document.getElementById('reply-message');
  const statusDiv = document.getElementById('reply-status');
  
  if (!messageTextarea || !statusDiv) return;
  
  const currentText = messageTextarea.value.trim();
  if (!currentText) {
    alert('Écris d\'abord un brouillon, l\'IA va l\'améliorer !');
    return;
  }
  
  // Afficher le statut d'amélioration
  statusDiv.style.display = 'block';
  statusDiv.innerHTML = `
    <div style="text-align: center;">
      <i class="fas fa-magic fa-spin" style="font-size: 2rem; color: #667eea;"></i>
      <p class="text-gray-400 mt-2">✨ L'IA améliore votre texte...</p>
    </div>
  `;
  
  try {
    const response = await fetch('/api/emails/improve-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: currentText })
    });
    
    const result = await response.json();
    
    if (response.ok && result.improved) {
      messageTextarea.value = result.improved;
      statusDiv.innerHTML = `
        <div style="text-align: center; color: #10b981;">
          <i class="fas fa-check-circle" style="font-size: 1.5rem;"></i>
          <p class="text-sm mt-1">✅ Texte amélioré !</p>
        </div>
      `;
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    } else {
      throw new Error(result.error || 'Erreur amélioration');
    }
  } catch (error) {
    console.error('Erreur amélioration IA:', error);
    statusDiv.innerHTML = `
      <div style="text-align: center; color: #ef4444;">
        <i class="fas fa-exclamation-triangle"></i>
        <p class="text-sm mt-1">❌ ${error.message}</p>
      </div>
    `;
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// Fonction pour fermer la modale de réponse
function closeReplyModal() {
  const modal = document.getElementById('reply-modal');
  if (modal) {
    modal.remove();
  }
}

// Fonction pour envoyer la réponse
async function sendReply(emailId) {
  const messageTextarea = document.getElementById('reply-message');
  const statusDiv = document.getElementById('reply-status');
  const message = messageTextarea?.value?.trim();
  
  if (!message) {
    alert('Veuillez saisir un message');
    return;
  }
  
  // Trouver l'email
  const email = window.currentEmails.find(e => e.id === emailId);
  if (!email) {
    alert('Email introuvable');
    return;
  }
  
  // Extraire l'adresse email de l'expéditeur
  const fromMatch = email.from.match(/<(.+?)>/) || email.from.match(/([^\s]+@[^\s]+)/);
  const toEmail = fromMatch ? fromMatch[1] : email.from;
  
  // Récupérer le token Gmail
  const gmailToken = localStorage.getItem('gmail_access_token');
  if (!gmailToken) {
    alert('Session Gmail expirée, veuillez vous reconnecter');
    return;
  }
  
  // Afficher le statut d'envoi
  if (statusDiv) {
    statusDiv.style.display = 'block';
    statusDiv.innerHTML = `
      <div style="text-align: center;">
        <i class="fas fa-spinner fa-spin text-blue-500" style="font-size: 2rem;"></i>
        <p class="text-gray-400 mt-2">Envoi en cours...</p>
      </div>
    `;
  }
  
  // Désactiver le bouton d'envoi
  const sendButton = document.querySelector('[onclick*="sendReply"]');
  if (sendButton) {
    sendButton.disabled = true;
    sendButton.style.opacity = '0.5';
  }
  
  try {
    const response = await fetch('/api/emails/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: toEmail,
        subject: 'Re: ' + (email.subject || 'Sans objet'),
        message: message,
        accessToken: gmailToken,
        inReplyTo: email.id,
        threadId: email.threadId
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      if (statusDiv) {
        statusDiv.innerHTML = `
          <div style="text-align: center; color: #10b981;">
            <i class="fas fa-check-circle" style="font-size: 2rem;"></i>
            <p class="mt-2">✅ Email envoyé avec succès !</p>
          </div>
        `;
      }
      
      // Fermer la modale après 1.5 secondes
      setTimeout(() => {
        closeReplyModal();
      }, 1500);
    } else {
      throw new Error(result.error || 'Erreur d\'envoi');
    }
  } catch (error) {
    console.error('Erreur envoi email:', error);
    if (statusDiv) {
      statusDiv.innerHTML = `
        <div style="text-align: center; color: #ef4444;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem;"></i>
          <p class="mt-2">❌ Erreur : ${error.message}</p>
        </div>
      `;
    }
    
    // Réactiver le bouton
    if (sendButton) {
      sendButton.disabled = false;
      sendButton.style.opacity = '1';
    }
  }
}

async function viewEmailDetail(emailId) {
  try {
    const response = await axios.get(`${API_URL}/api/emails/${emailId}`);
    const email = response.data.email;
    
    // Parser les IDs des deals liés
    let dealIds = [];
    if (email.deals_ids) {
      try {
        dealIds = JSON.parse(email.deals_ids);
      } catch (e) {
        console.error('Erreur parsing deals_ids:', e);
      }
    }
    
    // Charger les détails des deals liés
    let linkedDeals = [];
    if (dealIds.length > 0) {
      try {
        const dealsPromises = dealIds.map(id => axios.get(`${API_URL}/api/deals/${id}`));
        const dealsResponses = await Promise.all(dealsPromises);
        linkedDeals = dealsResponses.map(r => r.data.deal).filter(d => d);
      } catch (e) {
        console.error('Erreur chargement deals:', e);
      }
    }
    
    const modal = `
      <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
        <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>
              <i class="fas fa-envelope"></i> ${email.subject || 'Sans objet'}
            </h3>
            <button class="modal-close" onclick="closeModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="space-y-4">
              <div class="card">
                <h3 class="font-bold text-white mb-2">📧 Informations</h3>
                ${email.sender_name ? `<p class="text-sm text-gray-300 mb-1"><strong>De :</strong> ${email.sender_name}</p>` : ''}
                ${email.sender_email ? `<p class="text-sm text-gray-300 mb-1"><strong>Email :</strong> ${email.sender_email}</p>` : ''}
                <p class="text-sm text-gray-300 mb-1"><strong>Reçu :</strong> ${formatRelativeTime(email.created_at)}</p>
                ${email.processed ? `<p class="text-sm text-gray-300"><strong>Traité :</strong> ${formatRelativeTime(email.processed_at)}</p>` : ''}
              </div>
              
              ${linkedDeals.length > 0 ? `
                <div class="card">
                  <h3 class="font-bold text-white mb-3">
                    <i class="fas fa-star"></i> Leads créés (${linkedDeals.length})
                  </h3>
                  <div class="space-y-2">
                    ${linkedDeals.map(deal => `
                      <div 
                        class="p-3 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700 transition-colors"
                        onclick="closeModal(); viewDealModal(${deal.id})"
                        style="border-left: 3px solid #3b82f6;"
                      >
                        <div class="flex items-center justify-between">
                          <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                              <span class="badge badge-primary">#${deal.id}</span>
                              <strong class="text-white">${deal.first_name} ${deal.last_name}</strong>
                            </div>
                            <div class="text-sm text-gray-400">
                              <i class="fas fa-briefcase"></i> ${deal.type || 'Type inconnu'}
                              ${deal.phone ? ` • <i class="fas fa-phone"></i> ${deal.phone}` : ''}
                              ${deal.email ? ` • <i class="fas fa-envelope"></i> ${deal.email}` : ''}
                            </div>
                            ${deal.address ? `
                              <div class="text-sm text-gray-400 mt-1">
                                <i class="fas fa-map-marker-alt"></i> ${deal.address}
                              </div>
                            ` : ''}
                          </div>
                          <div class="text-right">
                            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); closeModal(); viewDealModal(${deal.id})">
                              <i class="fas fa-eye"></i> Ouvrir
                            </button>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                  <p class="text-xs text-gray-500 mt-3">
                    💡 Cliquez sur un Lead pour voir ses coordonnées complètes et planifier un RDV
                  </p>
                </div>
              ` : ''}
              
              ${email.processed && email.result_summary ? `
                <div class="card">
                  <h3 class="font-bold text-white mb-2">📊 Résultats du traitement</h3>
                  <div class="bg-gray-700/50 p-3 rounded text-sm text-gray-300 whitespace-pre-wrap">${email.result_summary}</div>
                </div>
              ` : ''}
              
              <div class="card">
                <h3 class="font-bold text-white mb-2">📄 Contenu de l'email</h3>
                <div class="bg-gray-700/50 p-4 rounded text-sm text-gray-300 whitespace-pre-wrap" style="max-height: 400px; overflow-y: auto;">${email.content}</div>
              </div>
            </div>
            
            <div class="flex gap-3 mt-4">
              <button class="btn btn-secondary flex-1" onclick="closeModal()">
                <i class="fas fa-times"></i> Fermer
              </button>
              ${!email.processed ? `
                <button class="btn btn-primary flex-1" onclick="closeModal(); reprocessEmail(${email.id})">
                  <i class="fas fa-magic"></i> Traiter avec l'IA
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
    
    showModal(modal);
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors du chargement du détail');
  }
}

// Retraiter un email
async function reprocessEmail(emailId) {
  try {
    const response = await axios.get(`${API_URL}/api/emails/${emailId}`);
    const email = response.data.email;
    
    // Ouvrir la modale de traitement avec le contenu pré-rempli
    openEmailProcessingModal();
    
    // Attendre que la modale soit créée
    setTimeout(() => {
      const contentField = document.getElementById('emailContent');
      if (contentField) {
        contentField.value = email.content;
      }
    }, 100);
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors du chargement de l\'email');
  }
}

async function renderTrash() {
  console.log('🗑️ renderTrash() appelé');
  try {
    console.log('📡 Récupération des données archivées...');
    const archivedDeals = await api.getArchivedDeals();
    console.log('✅ archivedDeals:', archivedDeals.length);
    
    const archivedClients = await api.getClients('?archived=true').then(r => r.clients || []);
    console.log('✅ archivedClients:', archivedClients.length);
    
    // Stocker dans state pour les fonctions de restauration/suppression
    state.archivedClients = archivedClients;
    state.archivedDeals = archivedDeals;
  
  const content = `
    <div class="card-header">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-white">
          <i class="fas fa-trash-alt"></i> Corbeille
        </h2>
        <div class="flex gap-2">
          <span class="badge badge-warning">${archivedClients.length} client${archivedClients.length !== 1 ? 's' : ''}</span>
          <span class="badge badge-primary">${archivedDeals.length} dossier${archivedDeals.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
    
    ${archivedDeals.length === 0 && archivedClients.length === 0 ? `
      <div class="card text-center py-12">
        <i class="fas fa-trash-alt text-6xl text-gray-600 mb-4"></i>
        <p class="text-gray-400 text-lg mb-2">La corbeille est vide</p>
        <p class="text-gray-500 text-sm">Les dossiers et clients archivés apparaîtront ici</p>
      </div>
    ` : `
      ${archivedClients.length > 0 ? `
        <div class="mb-6">
          <h3 class="text-xl font-bold text-white mb-3">
            <i class="fas fa-users"></i> Clients archivés (${archivedClients.length})
          </h3>
          <div class="space-y-3">
            ${archivedClients.map(client => {
              const firstName = client.first_name?.trim() || '';
              const lastName = client.last_name?.trim() || '';
              const initials = (firstName[0] || '') + (lastName[0] || '') || '?';
              const fullName = (firstName || lastName) 
                ? `${client.civility ? client.civility + ' ' : ''}${firstName} ${lastName}`.trim()
                : `Client #${client.id}`;
              
              return `
              <div class="card" style="border-left: 4px solid #f59e0b;">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <div class="w-10 h-10 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                        ${initials}
                      </div>
                      <h3 class="font-bold text-white">
                        ${fullName}
                      </h3>
                      ${client.company ? `<span class="text-sm text-gray-400">(${client.company})</span>` : ''}
                    </div>
                    <div class="space-y-1">
                      ${client.phone ? `
                        <p class="text-sm text-gray-400">
                          <i class="fas fa-phone"></i> 
                          <a href="tel:${client.phone.replace(/\s/g, '')}" class="text-blue-400 hover:text-blue-300 underline" title="Appeler ${client.phone}">
                            ${client.phone}
                          </a>
                        </p>
                      ` : ''}
                      ${client.email ? `
                        <p class="text-sm text-gray-400">
                          <i class="fas fa-envelope"></i> 
                          <a href="mailto:${client.email}" class="text-blue-400 hover:text-blue-300 underline" title="Envoyer un email à ${client.email}">
                            ${client.email}
                          </a>
                        </p>
                      ` : ''}
                      ${client.address ? `<p class="text-sm text-gray-400"><i class="fas fa-map-marker-alt"></i> ${client.address}</p>` : ''}
                      ${client.archived_at ? `<p class="text-xs text-gray-500"><i class="fas fa-clock"></i> Archivé le ${formatDate(client.archived_at)}</p>` : ''}
                    </div>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <button 
                      class="btn btn-sm btn-success" 
                      onclick="confirmRestoreClient(${client.id})"
                      title="Restaurer ce client"
                    >
                      <i class="fas fa-undo"></i> Restaurer
                    </button>
                    <button 
                      class="btn btn-sm btn-danger" 
                      onclick="confirmDeleteClientPermanent(${client.id})"
                      title="Supprimer définitivement"
                    >
                      <i class="fas fa-trash"></i> Supprimer
                    </button>
                  </div>
                </div>
              </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
      
      ${archivedDeals.length > 0 ? `
        <div>
          <h3 class="text-xl font-bold text-white mb-3">
            <i class="fas fa-folder"></i> Dossiers archivés (${archivedDeals.length})
          </h3>
          <div class="space-y-3">
            ${archivedDeals.map(deal => `
              <div class="card" style="border-left: 4px solid #ef4444;">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="badge badge-primary">#${deal.id}</span>
                      <h3 class="font-bold text-white">${deal.first_name} ${deal.last_name}</h3>
                      ${deal.company ? `<span class="text-sm text-gray-400">(${deal.company})</span>` : ''}
                    </div>
                    <div class="text-sm text-gray-300 mb-2">
                      <span class="badge badge-secondary mr-2">${deal.type}</span>
                      <span class="badge badge-secondary">${deal.status}</span>
                    </div>
                    ${deal.estimated_amount ? `<p class="text-sm text-gray-400 mb-1">💰 ${formatCurrency(deal.estimated_amount)}</p>` : ''}
                    ${deal.archived_at ? `<p class="text-xs text-gray-500"><i class="fas fa-clock"></i> Archivé le ${formatDate(deal.archived_at)}</p>` : ''}
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <button 
                      class="btn btn-sm btn-success" 
                      onclick="confirmRestoreDeal(${deal.id})"
                      title="Restaurer ce dossier"
                    >
                      <i class="fas fa-undo"></i> Restaurer
                    </button>
                    <button 
                      class="btn btn-sm btn-danger" 
                      onclick="confirmDeleteDeal(${deal.id})"
                      title="Supprimer définitivement"
                    >
                      <i class="fas fa-trash"></i> Supprimer
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="card mt-4" style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444;">
        <div class="flex items-start gap-3">
          <i class="fas fa-info-circle text-red-500 mt-1"></i>
          <div class="text-sm text-gray-300">
            <strong class="text-white">Information :</strong>
            <p class="mt-1">Les éléments archivés restent dans la corbeille indéfiniment.</p>
            <p class="mt-1">Vous pouvez les <strong>restaurer</strong> pour les réintégrer, ou les <strong>supprimer définitivement</strong>.</p>
          </div>
        </div>
      </div>
    `}
  `;
  
  console.log('📝 Affichage du HTML...');
  document.getElementById('app').innerHTML = renderLayout(content);
  console.log('✅ Corbeille affichée avec succès !');
  } catch (error) {
    console.error('❌ Erreur dans renderTrash():', error);
    alert('❌ Erreur lors du chargement de la corbeille : ' + error.message);
  }
}

// CONFIRM RESTORE DEAL

// ========================================
// FONCTIONNALITÉS COMPLÈTES - Lead, Client, RDV, Calendrier, IA
// ========================================
function closeCalendarModalAndRefresh(dealId) {
  closeModal();
  viewDealModal(dealId);
}

// CHANGER STATUT MODAL

async function confirmArchiveDeal(dealId) {
  const deal = state.currentDeal;
  const firstName = deal.first_name?.trim() || '';
  const lastName = deal.last_name?.trim() || '';
  const clientName = (firstName || lastName) 
    ? `${firstName} ${lastName}`.trim() 
    : `Dossier #${dealId}`;
  
  // Une seule confirmation simple
  if (!confirm(`🗑️ Déplacer "${clientName}" dans la corbeille ?\n\nVous pourrez le restaurer depuis le menu Corbeille.`)) {
    return;
  }
  
  try {
    await api.archiveDeal(dealId);
    alert('✅ Dossier déplacé dans la corbeille !');
    closeModal();
    navigate('pipeline'); // Retour au pipeline
  } catch (error) {
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// Confirmation et archivage d'un client

async function confirmDeleteClientPermanent(clientId) {
  try {
    // Récupérer depuis state.archivedClients
    const client = state.archivedClients?.find(c => c.id === clientId);
    if (!client) {
      alert('❌ Client introuvable');
      return;
    }
    
    // Construire le nom (gérer les cas où first_name/last_name sont vides)
    const firstName = client.first_name?.trim() || '';
    const lastName = client.last_name?.trim() || '';
    const clientName = (firstName || lastName) 
      ? `${firstName} ${lastName}`.trim() 
      : `Client #${client.id}`;
    
    // 1ère confirmation
    if (!confirm(`⚠️ ATTENTION : Supprimer définitivement le client "${clientName}" ?\n\n❌ Cette action est IRRÉVERSIBLE !\n❌ Toutes les données client seront perdues.`)) {
      return;
    }
    
    // 2ème confirmation
    if (!confirm(`🚨 DERNIÈRE CONFIRMATION\n\nÊtes-vous ABSOLUMENT SÛR de vouloir supprimer définitivement ce client ?\n\nCette action ne peut PAS être annulée.`)) {
      return;
    }
    
    await api.deleteClient(clientId);
    alert('🗑️ Client supprimé définitivement.');
    renderTrash(); // Refresh
  } catch (error) {
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// SETTINGS

async function confirmDeleteDeal(dealId) {
  // 1ère confirmation
  if (!confirm(`⚠️ ATTENTION : Supprimer définitivement ce dossier ?\n\n❌ Cette action est IRRÉVERSIBLE !\n❌ Toutes les données (RDV, devis, photos) seront perdues.`)) {
    return;
  }
  
  // 2ème confirmation
  if (!confirm(`🚨 DERNIÈRE CONFIRMATION\n\nÊtes-vous ABSOLUMENT SÛR de vouloir supprimer définitivement ce dossier ?\n\nCette action ne peut PAS être annulée.`)) {
    return;
  }
  
  try {
    await api.deleteDeal(dealId);
    alert('🗑️ Dossier supprimé définitivement.');
    renderTrash(); // Refresh
  } catch (error) {
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// CONFIRM RESTORE CLIENT

async function confirmRestoreClient(clientId) {
  try {
    // Récupérer depuis state.archivedClients (dans renderTrash)
    const client = state.archivedClients?.find(c => c.id === clientId);
    if (!client) {
      alert('❌ Client introuvable');
      return;
    }
    
    // Construire le nom (gérer les cas où first_name/last_name sont vides)
    const firstName = client.first_name?.trim() || '';
    const lastName = client.last_name?.trim() || '';
    const clientName = (firstName || lastName) 
      ? `${firstName} ${lastName}`.trim() 
      : `Client #${client.id}`;
    
    // Restauration directe sans confirmation (c'est une action positive)
    await api.restoreClient(clientId);
    alert(`✅ "${clientName}" restauré avec succès !`);
    renderTrash(); // Refresh
  } catch (error) {
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// CONFIRM DELETE CLIENT PERMANENT

async function confirmRestoreDeal(dealId) {
  try {
    await api.restoreDeal(dealId);
    alert('✅ Dossier restauré avec succès !');
    renderTrash(); // Refresh
  } catch (error) {
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// CONFIRM DELETE DEAL (suppression définitive)

async function exportRdvToAppleCalendar(dealId) {
  try {
    const deal = await api.getDeal(dealId);
    
    if (!deal.rdv_date) {
      if (confirm('❌ Pas de RDV planifié pour ce dossier !\n\nVoulez-vous planifier un RDV maintenant ?')) {
        closeModal();
        openScheduleRdvModal(dealId);
      }
      return;
    }
    
    // Détecter si on est sur Mac/iPhone/iPad
    const isAppleDevice = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
    
    if (isAppleDevice) {
      // Sur Apple : télécharger le .ics et ouvrir automatiquement
      exportRdvToCalendar(dealId);
      alert('📅 Fichier .ics téléchargé !\n\n✅ Sur iPhone/iPad : Touchez le fichier dans Téléchargements, il s\'ouvrira dans Calendrier\n✅ Sur Mac : Le fichier s\'ouvre automatiquement dans Calendar.app');
    } else {
      // Sur autres plateformes : télécharger le .ics
      exportRdvToCalendar(dealId);
      alert('📱 Vous n\'êtes pas sur un appareil Apple.\n\n✅ Le fichier .ics a été téléchargé.\n✅ Transférez-le sur votre iPhone/Mac pour l\'ouvrir dans Apple Calendar.');
    }
    
    closeCalendarModalAndRefresh(dealId);
    
  } catch (error) {
    console.error('Error exporting to Apple Calendar:', error);
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// Close calendar modal and refresh deal view

async function exportRdvToCalendar(dealId) {
  try {
    const deal = await api.getDeal(dealId);
    
    if (!deal.rdv_date) {
      if (confirm('❌ Pas de RDV planifié pour ce dossier !\n\nVoulez-vous planifier un RDV maintenant ?')) {
        closeModal();
        openScheduleRdvModal(dealId);
      }
      return;
    }
    
    // Parse RDV date
    const rdvDate = new Date(deal.rdv_date);
    
    // Duration: 1 heure par défaut
    const endDate = new Date(rdvDate.getTime() + 60 * 60 * 1000);
    
    // Format dates for .ics (YYYYMMDDTHHMMSS)
    const formatICSDate = (date) => {
      const pad = (n) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    };
    
    const startICS = formatICSDate(rdvDate);
    const endICS = formatICSDate(endDate);
    const nowICS = formatICSDate(new Date());
    
    // Escape special characters for .ics
    const escapeICS = (str) => {
      if (!str) return '';
      return str.replace(/\\/g, '\\\\')
                .replace(/;/g, '\\;')
                .replace(/,/g, '\\,')
                .replace(/\n/g, '\\n');
    };
    
    // Build .ics content - Coordonnées complètes
    const clientName = deal.client_name || `${deal.first_name || ''} ${deal.last_name || ''}`.trim() || 'Client';
    const dealType = deal.type || deal.title || 'Dossier';
    const title = `RDV ${dealType} - ${clientName}`;
    const location = (deal.client_address || deal.address || '');
    
    // Description complète avec TOUTES les coordonnées
    const descParts = [];
    if (deal.rdv_notes) descParts.push(deal.rdv_notes);
    descParts.push('');
    descParts.push(`--- Client ---`);
    descParts.push(clientName);
    if (deal.client_phone || deal.phone) descParts.push(`Tel: ${deal.client_phone || deal.phone}`);
    if (deal.client_email || deal.email) descParts.push(`Email: ${deal.client_email || deal.email}`);
    if (location) descParts.push(`Adresse: ${location}`);
    if (deal.company) descParts.push(`Societe: ${deal.company}`);
    descParts.push('');
    descParts.push(`Dossier #${dealId} - ${dealType}`);
    if (deal.estimated_amount) descParts.push(`Montant estime: ${deal.estimated_amount} EUR`);
    
    const description = escapeICS(descParts.join('\n'));
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//KARL//PSM Manager//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:KARL - Rendez-vous',
      'X-WR-TIMEZONE:Europe/Paris',
      'BEGIN:VEVENT',
      `UID:${dealId}-${nowICS}@karl-psm.app`,
      `DTSTAMP:${nowICS}`,
      `DTSTART:${startICS}`,
      `DTEND:${endICS}`,
      `SUMMARY:${escapeICS(title)}`,
      `DESCRIPTION:${description}`,
      location ? `LOCATION:${escapeICS(location)}` : '',
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'DESCRIPTION:Rappel RDV dans 15 minutes',
      'ACTION:DISPLAY',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(line => line).join('\r\n');
    
    // Create and download .ics file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RDV_${clientName.replace(/\s/g, '_')}_${rdvDate.toISOString().slice(0, 10)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('📅 Fichier calendrier téléchargé !\n\n✅ Sur iPhone/iPad : Ouvre le fichier, il s\'ajoutera à Apple Calendar\n✅ Sur ordinateur : Ouvre le fichier avec ton calendrier (Apple Calendar, Google Calendar, Outlook...)');
    
  } catch (error) {
    console.error('Error exporting RDV:', error);
    alert('❌ Erreur lors de l\'export : ' + (error.response?.data?.error || error.message));
  }
}

// MODAL EXPORT CALENDRIER (choix Apple/Google)

async function exportRdvToGoogleCalendar(dealId) {
  try {
    const deal = await api.getDeal(dealId);
    
    if (!deal.rdv_date) {
      if (confirm('❌ Pas de RDV planifié pour ce dossier !\n\nVoulez-vous planifier un RDV maintenant ?')) {
        closeModal();
        openScheduleRdvModal(dealId);
      }
      return;
    }
    
    const rdvDate = new Date(deal.rdv_date);
    const endDate = new Date(rdvDate.getTime() + 60 * 60 * 1000);
    
    // Format dates for Google Calendar (YYYYMMDDTHHMMSS)
    const formatGoogleDate = (date) => {
      const pad = (n) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
    };
    
    const clientName = deal.client_name || `${deal.first_name || ''} ${deal.last_name || ''}`.trim() || 'Client';
    const dealType = deal.type || deal.title || 'Dossier';
    const title = `RDV ${dealType} - ${clientName}`;
    const location = deal.client_address || deal.address || '';
    
    // Description complète avec coordonnées
    const descParts = [];
    if (deal.rdv_notes) descParts.push(deal.rdv_notes);
    descParts.push('');
    descParts.push(`--- Client ---`);
    descParts.push(clientName);
    if (deal.client_phone || deal.phone) descParts.push(`Tél: ${deal.client_phone || deal.phone}`);
    if (deal.client_email || deal.email) descParts.push(`Email: ${deal.client_email || deal.email}`);
    if (location) descParts.push(`Adresse: ${location}`);
    if (deal.company) descParts.push(`Société: ${deal.company}`);
    descParts.push('');
    descParts.push(`Dossier #${dealId} - ${dealType}`);
    const description = descParts.filter(line => line !== undefined).join('\n');
    
    // Build Google Calendar URL
    const googleUrl = new URL('https://calendar.google.com/calendar/render');
    googleUrl.searchParams.append('action', 'TEMPLATE');
    googleUrl.searchParams.append('text', title);
    googleUrl.searchParams.append('dates', `${formatGoogleDate(rdvDate)}/${formatGoogleDate(endDate)}`);
    googleUrl.searchParams.append('details', description);
    googleUrl.searchParams.append('location', location);
    
    // Open in new tab
    window.open(googleUrl.toString(), '_blank');
    
    closeCalendarModalAndRefresh(dealId);
    
  } catch (error) {
    console.error('Error exporting to Google Calendar:', error);
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// EXPORT TO APPLE CALENDAR

async function lookupCityEdit(zipcode) {
  if (!zipcode || zipcode.length !== 5) return;
  
  try {
    const response = await axios.get(`https://geo.api.gouv.fr/communes?codePostal=${zipcode}&fields=nom`);
    const cityInput = document.getElementById('edit_address_city');
    
    if (response.data && response.data.length > 0) {
      cityInput.value = response.data[0].nom;
    }
  } catch (error) {
    console.error('Erreur lookup ville:', error);
  }
}

// Submit edit client

async function lookupCityEditLead() {
  const zipcode = document.getElementById('editLeadZipcode').value;
  if (zipcode.length === 5) {
    try {
      const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${zipcode}&fields=nom&limit=1`);
      const data = await response.json();
      if (data.length > 0) {
        document.getElementById('editLeadCity').value = data[0].nom;
      }
    } catch (error) {
      console.error('Erreur lookup ville:', error);
    }
  }
}

// Soumettre modification lead

function openChangeStatusModal(dealId, currentStatus) {
  const statuses = [
    { key: 'lead', label: 'Lead', icon: 'fa-star', color: '#3b82f6' },
    { key: 'rdv_planifie', label: 'RDV planifié', icon: 'fa-calendar', color: '#8b5cf6' },
    { key: 'devis_a_faire', label: 'Devis à faire', icon: 'fa-edit', color: '#f59e0b' },
    { key: 'devis_envoye', label: 'Devis envoyé', icon: 'fa-paper-plane', color: '#10b981' },
    { key: 'relance', label: 'Relance', icon: 'fa-phone', color: '#ef4444' },
    { key: 'signe', label: 'Signé', icon: 'fa-check-circle', color: '#22c55e' },
  ];
  
  const statusOptions = statuses.map(s => `
    <label style="
      display: flex; align-items: center; gap: 0.75rem;
      cursor: pointer; padding: 0.85rem 1rem; margin-bottom: 0.5rem;
      border-radius: 8px; border-left: 4px solid ${s.color};
      background: ${s.key === currentStatus ? 'rgba(59, 130, 246, 0.15)' : '#1e293b'};
      border: ${s.key === currentStatus ? '2px solid #3b82f6' : '1px solid #374151'};
      transition: background 0.2s;
    " onmouseover="this.style.background='rgba(59,130,246,0.1)'" onmouseout="this.style.background='${s.key === currentStatus ? 'rgba(59,130,246,0.15)' : '#1e293b'}'">
      <input 
        type="radio" 
        name="status" 
        value="${s.key}" 
        ${s.key === currentStatus ? 'checked' : ''}
        style="width: 18px; height: 18px; flex-shrink: 0;"
      />
      <i class="fas ${s.icon}" style="color: ${s.color}; font-size: 1.1rem; width: 20px; text-align: center; flex-shrink: 0;"></i>
      <strong style="color: white; flex: 1;">${s.label}</strong>
      ${s.key === currentStatus ? '<span style="color: #10b981; font-size: 0.8rem; flex-shrink: 0;">(actuel)</span>' : ''}
    </label>
  `).join('');
  
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 500px;">
        <div class="modal-header">
          <h3><i class="fas fa-arrow-right"></i> Changer le statut</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="changeStatusForm" class="modal-body">
          <p class="mb-4 text-sm" style="color: var(--psm-text-muted);">
            Sélectionnez le nouveau statut du dossier dans le pipeline :
          </p>
          
          <div class="mb-4">
            ${statusOptions}
          </div>
          
          <div class="flex gap-2">
            <button type="submit" class="btn btn-primary flex-1">
              <i class="fas fa-check"></i> Valider
            </button>
            <button type="button" class="btn btn-secondary" onclick="closeModal()">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  `);
  
  document.getElementById('changeStatusForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newStatus = document.querySelector('input[name="status"]:checked').value;
    
    if (newStatus === currentStatus) {
      alert('ℹ️ Le statut est déjà celui-là !');
      return;
    }
    
    try {
      await api.updateDeal(dealId, { status: newStatus });
      alert('✅ Statut changé !');
      closeModal();
      viewDealModal(dealId); // Refresh
    } catch (error) {
      alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
    }
  });
}

// CREATE QUOTE MODAL (Éditeur de devis complet)


function openCreateLeadModal() {
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
        <div class="modal-header">
          <h3><i class="fas fa-star"></i> Nouveau Lead</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="leadForm" class="modal-body">
          <p class="text-sm mb-4" style="color: var(--psm-text-muted);">
            Créez rapidement un Lead. Vous pourrez planifier le RDV ensuite en ouvrant la fiche.
          </p>
          
          <!-- Toggle Nouveau client / Client existant -->
          <div class="mb-4" style="display: flex; gap: 0.5rem; border-bottom: 1px solid var(--psm-border); padding-bottom: 0.75rem;">
            <button type="button" id="btnNewClient" class="btn btn-sm btn-primary" onclick="toggleLeadClientMode('new')" style="flex: 1;">
              <i class="fas fa-user-plus"></i> Nouveau client
            </button>
            <button type="button" id="btnExistingClient" class="btn btn-sm btn-secondary" onclick="toggleLeadClientMode('existing')" style="flex: 1;">
              <i class="fas fa-user-check"></i> Client existant
            </button>
          </div>
          
          <!-- Section Nouveau client (visible par défaut) -->
          <div id="newClientSection">
            <h4 class="font-bold text-white mb-3" style="font-size: 1rem;">
              <i class="fas fa-user"></i> Informations client
            </h4>
            
            <div class="input-group">
              <label class="input-label">Civilité *</label>
              <select name="civility" id="civility" class="input" required>
                <option value="">Choisir...</option>
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
                <option value="M. et Mme">M. et Mme</option>
              </select>
            </div>
            
            <div class="grid-2">
              <div class="input-group">
                <label class="input-label">Prénom *</label>
                <input type="text" name="first_name" id="first_name" class="input" required placeholder="Jean" />
              </div>
              <div class="input-group">
                <label class="input-label">Nom *</label>
                <input type="text" name="last_name" id="last_name" class="input" required placeholder="Dupont" />
              </div>
            </div>
            
            <div class="input-group">
              <label class="input-label">Téléphone *</label>
              <input type="tel" name="phone" id="phone" class="input" required placeholder="06 12 34 56 78" />
            </div>
            
            <div class="input-group">
              <label class="input-label">Email</label>
              <input type="email" name="email" id="email" class="input" placeholder="jean.dupont@email.fr" />
            </div>
            
            <div class="input-group">
              <label class="input-label">Société</label>
              <input type="text" name="company" id="company" class="input" placeholder="Entreprise Dupont SARL" />
            </div>
            
            <div class="input-group">
              <label class="input-label"><i class="fas fa-map-marker-alt" style="color: #ef4444;"></i> Adresse</label>
              <input type="text" name="address_street" id="address_street" class="input" placeholder="15 rue des Lilas" style="margin-bottom: 0.5rem;" />
              <div class="grid-2" style="gap: 0.5rem;">
                <input type="text" name="address_postal" id="address_postal" class="input" placeholder="Code postal" onchange="lookupCity(this.value)" />
                <select name="address_city" id="address_city" class="input">
                  <option value="">Ville</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- Section Client existant (cachée par défaut) -->
          <div id="existingClientSection" style="display: none;">
            <div class="input-group">
              <label class="input-label">Client *</label>
              <select name="client_id" id="leadClientSelect" class="input">
                <option value="">Sélectionner un client...</option>
                ${safeArray(state.clients).map(c => `<option value="${c.id}">${c.first_name} ${c.last_name} ${c.company ? '(' + c.company + ')' : ''}</option>`).join('')}
              </select>
            </div>
          </div>
          
          <!-- Section Projet (toujours visible) -->
          <div style="border-top: 1px solid var(--psm-border); margin: 1.5rem 0 0; padding-top: 1.5rem;">
            <h4 class="font-bold text-white mb-3" style="font-size: 1rem;">
              <i class="fas fa-briefcase"></i> Projet
            </h4>
            
            <div class="input-group">
              <label class="input-label">Type *</label>
              <select name="type" class="input" required>
                <option value="portail">Portail</option>
                <option value="portillon">Portillon</option>
                <option value="cloture">Clôture</option>
                <option value="ensemble">Ensemble</option>
                <option value="sav">SAV</option>
              </select>
            </div>
            
            <div class="input-group">
              <label class="input-label">Montant estimé (€)</label>
              <input type="number" name="estimated_amount" class="input" step="0.01" placeholder="Ex: 5000" />
            </div>
            
            <div class="input-group">
              <label class="input-label">Notes</label>
              <textarea name="notes" class="input" rows="3" placeholder="Détails du projet, demandes spécifiques..."></textarea>
            </div>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          <button class="btn btn-primary" onclick="submitLeadForm()">
            <i class="fas fa-save"></i> Créer le Lead
          </button>
        </div>
      </div>
    </div>
  `);
}

// Toggle entre nouveau client et client existant

async function openEditClientModal(clientId) {
  try {
    // Récupérer les infos du client
    const client = await api.getClient(clientId);
    
    // Parser l'adresse
    const addressParts = (client.address || '').split(',').map(s => s.trim());
    const street = addressParts[0] || '';
    const postal = addressParts[1] || '';
    const city = addressParts[2] || '';
    
    showModal(`
      <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-user-edit"></i> Modifier le client</h3>
            <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
          </div>
          <form id="editClientForm" class="modal-body">
            <div class="input-group">
              <label class="input-label">Civilité *</label>
              <select name="civility" class="input" required>
                <option value="">Choisir...</option>
                <option value="M." ${client.civility === 'M.' ? 'selected' : ''}>M.</option>
                <option value="Mme" ${client.civility === 'Mme' ? 'selected' : ''}>Mme</option>
                <option value="M. et Mme" ${client.civility === 'M. et Mme' ? 'selected' : ''}>M. et Mme</option>
              </select>
            </div>
            <div class="grid-2">
              <div class="input-group">
                <label class="input-label">Prénom *</label>
                <input type="text" name="first_name" class="input" required value="${client.first_name || ''}" />
              </div>
              <div class="input-group">
                <label class="input-label">Nom *</label>
                <input type="text" name="last_name" class="input" required value="${client.last_name || ''}" />
              </div>
            </div>
            <div class="input-group">
              <label class="input-label">Société</label>
              <input type="text" name="company" class="input" value="${client.company || ''}" />
            </div>
            <div class="input-group">
              <label class="input-label">Téléphone *</label>
              <input type="tel" name="phone" class="input" required value="${client.phone || ''}" />
            </div>
            <div class="input-group">
              <label class="input-label">Email</label>
              <input type="email" name="email" class="input" value="${client.email || ''}" />
            </div>
            
            <div class="input-group">
              <label class="input-label">Adresse complète</label>
              <input type="text" name="address_street" id="edit_address_street" class="input" value="${street}" placeholder="15 rue des Lilas" style="margin-bottom: 0.75rem;" />
              <div class="grid-2" style="gap: 0.75rem;">
                <input type="text" name="address_postal" id="edit_address_postal" class="input" value="${postal}" placeholder="Code postal" onchange="lookupCityEdit(this.value)" />
                <input type="text" name="address_city" id="edit_address_city" class="input" value="${city}" placeholder="Ville" />
              </div>
            </div>
            
            <div class="input-group">
              <label class="input-label">Source</label>
              <select name="source" class="input">
                <option value="">Choisir...</option>
                <option value="site_web" ${client.source === 'site_web' ? 'selected' : ''}>Site web</option>
                <option value="recommandation" ${client.source === 'recommandation' ? 'selected' : ''}>Recommandation</option>
                <option value="publicite" ${client.source === 'publicite' ? 'selected' : ''}>Publicité</option>
                <option value="autre" ${client.source === 'autre' ? 'selected' : ''}>Autre</option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Notes</label>
              <textarea name="notes" class="input" rows="2">${client.notes || ''}</textarea>
            </div>
          </form>
          <div class="modal-footer">
            <button class="btn btn-success" onclick="closeModal(); openCreateLeadFromClient(${clientId})">
              <i class="fas fa-plus-circle"></i> Créer un lead
            </button>
            <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
            <button class="btn btn-primary" onclick="submitEditClient(${clientId})">
              <i class="fas fa-save"></i> Enregistrer
            </button>
          </div>
        </div>
      </div>
    `);
  } catch (error) {
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// Lookup city for edit modal

function openEditLeadModal(dealId) {
  const deal = state.currentDeal;
  
  showModal(`
    <div style="max-width: 600px;">
      <h2 class="text-2xl font-bold text-white mb-4">
        <i class="fas fa-edit"></i> Modifier le lead #${dealId}
      </h2>
      
      <form id="editLeadForm" onsubmit="event.preventDefault(); submitEditLead(${dealId})">
        <div class="input-group">
          <label class="text-white font-semibold">Civilité *</label>
          <select name="civility" class="input" required>
            <option value="">Choisir...</option>
            <option value="M." ${deal.civility === 'M.' ? 'selected' : ''}>M.</option>
            <option value="Mme" ${deal.civility === 'Mme' ? 'selected' : ''}>Mme</option>
            <option value="M. et Mme" ${deal.civility === 'M. et Mme' ? 'selected' : ''}>M. et Mme</option>
          </select>
        </div>
        
        <div class="grid-2">
          <div class="input-group">
            <label class="text-white font-semibold">Prénom *</label>
            <input type="text" name="first_name" class="input" value="${deal.first_name || ''}" required placeholder="Jean" />
          </div>
          <div class="input-group">
            <label class="text-white font-semibold">Nom *</label>
            <input type="text" name="last_name" class="input" value="${deal.last_name || ''}" required placeholder="Dupont" />
          </div>
        </div>
        
        <div class="input-group">
          <label class="text-white font-semibold">Société</label>
          <input type="text" name="company" class="input" value="${deal.company || ''}" placeholder="Entreprise Dupont SARL" />
        </div>
        
        <div class="input-group">
          <label class="text-white font-semibold">Téléphone *</label>
          <input type="tel" name="phone" class="input" value="${deal.client_phone || ''}" required placeholder="06 12 34 56 78" />
        </div>
        
        <div class="input-group">
          <label class="text-white font-semibold">Email</label>
          <input type="email" name="email" class="input" value="${deal.client_email || ''}" placeholder="contact@example.com" />
        </div>
        
        <div class="input-group">
          <label class="text-white font-semibold">Adresse</label>
          <input type="text" name="address" class="input" value="${deal.client_address || ''}" placeholder="15 rue des Lilas" />
        </div>
        
        <div class="grid-2">
          <div class="input-group">
            <label class="text-white font-semibold">Code postal</label>
            <input 
              type="text" 
              name="zipcode" 
              id="editLeadZipcode" 
              class="input" 
              value="${deal.client_zipcode || ''}" 
              placeholder="75001"
              maxlength="5"
              onkeyup="if(this.value.length === 5) lookupCityEditLead()" 
            />
          </div>
          <div class="input-group">
            <label class="text-white font-semibold">Ville</label>
            <input 
              type="text" 
              name="city" 
              id="editLeadCity" 
              class="input" 
              value="${deal.client_city || ''}" 
              placeholder="Paris"
              readonly
              style="background: #374151;"
            />
          </div>
        </div>
        
        <div class="input-group">
          <label class="text-white font-semibold">Source</label>
          <input type="text" name="source" class="input" value="${deal.source || ''}" placeholder="Site web, Téléphone, Email..." />
        </div>
        
        <div class="input-group">
          <label class="text-white font-semibold">Notes</label>
          <textarea name="notes" class="input" rows="3" placeholder="Notes sur ce lead...">${deal.client_notes || ''}</textarea>
        </div>
        
        <div class="flex gap-3 mt-4">
          <button type="button" class="btn btn-secondary flex-1" onclick="closeModal()">
            <i class="fas fa-times"></i> Annuler
          </button>
          <button type="submit" class="btn btn-primary flex-1">
            <i class="fas fa-save"></i> Enregistrer
          </button>
        </div>
      </form>
    </div>
  `);
  
  document.getElementById('editLeadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitEditLead(dealId);
  });
}

// Lookup ville pour edit lead

function openMobileMenu() {
  const menuHTML = `
    <div style="max-width: 400px;">
      <h2 style="font-size: 1.5rem; font-weight: 700; color: white; margin-bottom: 1.5rem;">
        <i class="fas fa-bars"></i> Menu
      </h2>
      
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <button 
          class="btn ${state.currentView === 'tasks' ? 'btn-primary' : 'btn-secondary'} w-full text-left" 
          onclick="closeModal(); navigate('tasks')"
          style="justify-content: flex-start; gap: 0.75rem;"
        >
          <i class="fas fa-tasks" style="width: 20px;"></i>
          <span>Tâches</span>
        </button>
        
        <button 
          class="btn ${state.currentView === 'trash' ? 'btn-primary' : 'btn-secondary'} w-full text-left" 
          onclick="closeModal(); navigate('trash')"
          style="justify-content: flex-start; gap: 0.75rem;"
        >
          <i class="fas fa-trash-alt" style="width: 20px;"></i>
          <span>Corbeille</span>
        </button>
        
        <button 
          class="btn ${state.currentView === 'settings' ? 'btn-primary' : 'btn-secondary'} w-full text-left" 
          onclick="closeModal(); navigate('settings')"
          style="justify-content: flex-start; gap: 0.75rem;"
        >
          <i class="fas fa-cog" style="width: 20px;"></i>
          <span>Paramètres</span>
        </button>
        
        <hr style="border-color: rgba(255,255,255,0.1); margin: 0.5rem 0;">
        
        <button 
          class="btn w-full text-left" 
          onclick="closeModal(); handleLogout()"
          style="justify-content: flex-start; gap: 0.75rem; background: #ef4444; color: white;"
        >
          <i class="fas fa-sign-out-alt" style="width: 20px;"></i>
          <span>Déconnexion</span>
        </button>
        
        <button 
          class="btn btn-secondary w-full" 
          onclick="closeModal()"
        >
          <i class="fas fa-times"></i> Fermer
        </button>
      </div>
    </div>
  `;
  
  showModal(menuHTML);
}


function openScheduleRdvModal(dealId) {
  const deal = state.currentDeal;
  
  // Coordonnées client
  const clientName = deal?.client_name || `${deal?.first_name || ''} ${deal?.last_name || ''}`.trim() || deal?.title || '';
  const clientPhone = deal?.client_phone || deal?.phone || '';
  const clientEmail = deal?.client_email || deal?.email || '';
  const clientAddress = deal?.client_address || deal?.address || '';
  const clientCompany = deal?.company || '';
  
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 550px;">
        <div class="modal-header">
          <h3><i class="fas fa-calendar-plus"></i> Planifier un RDV</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="scheduleRdvForm" class="modal-body">
          
          <!-- Fiche client -->
          <div class="mb-4" style="background: #1e293b; border-radius: 10px; padding: 1rem; border-left: 4px solid #3b82f6;">
            <h4 class="font-bold text-white mb-2" style="font-size: 0.95rem;"><i class="fas fa-user"></i> Client</h4>
            <p class="text-white font-semibold mb-1" style="font-size: 1.05rem;">${clientName}</p>
            ${clientCompany ? `<p class="text-sm text-gray-300 mb-1"><i class="fas fa-building text-blue-400" style="width:16px;"></i> ${clientCompany}</p>` : ''}
            ${clientPhone ? `
              <p class="text-sm mb-1">
                <i class="fas fa-phone text-green-400" style="width:16px;"></i> 
                <a href="tel:${clientPhone.replace(/\\s/g, '')}" class="text-green-400 hover:text-green-300 underline" style="font-size: 1rem; font-weight: 600;">${clientPhone}</a>
              </p>
            ` : '<p class="text-sm text-gray-500 mb-1"><i class="fas fa-phone" style="width:16px;"></i> Pas de téléphone renseigné</p>'}
            ${clientEmail ? `
              <p class="text-sm mb-1">
                <i class="fas fa-envelope text-blue-400" style="width:16px;"></i> 
                <a href="mailto:${clientEmail}" class="text-blue-400 hover:text-blue-300 underline">${clientEmail}</a>
              </p>
            ` : ''}
            ${clientAddress ? `
              <p class="text-sm mb-1">
                <i class="fas fa-map-marker-alt text-red-400" style="width:16px;"></i> 
                <a href="https://maps.google.com/?q=${encodeURIComponent(clientAddress)}" target="_blank" class="text-red-400 hover:text-red-300 underline">${clientAddress}</a>
              </p>
            ` : '<p class="text-sm text-gray-500 mb-1"><i class="fas fa-map-marker-alt" style="width:16px;"></i> Pas d\'adresse renseignée</p>'}
          </div>

          <div class="mb-4">
            <label class="block mb-2 font-semibold">
              <i class="fas fa-calendar"></i> Date et heure du RDV *
            </label>
            <input 
              type="datetime-local" 
              id="rdv_date" 
              class="w-full p-2 rounded border bg-gray-700 border-gray-600 text-white"
              value="${deal?.rdv_date ? new Date(deal.rdv_date).toISOString().slice(0, 16) : ''}"
              required
            />
          </div>
          
          <div class="mb-4">
            <label class="block mb-2 font-semibold">
              <i class="fas fa-sticky-note"></i> Notes RDV
            </label>
            <textarea 
              id="rdv_notes" 
              class="w-full p-2 rounded border bg-gray-700 border-gray-600 text-white"
              rows="3"
              placeholder="Ex: Prise de mesures pour portail coulissant, accès par le côté gauche..."
            >${deal?.rdv_notes || ''}</textarea>
          </div>
          
          <div class="flex gap-2">
            <button type="submit" class="btn btn-primary flex-1">
              <i class="fas fa-check"></i> Enregistrer
            </button>
            ${deal?.rdv_date ? `
              <button type="button" class="btn btn-success" onclick="exportRdvToCalendar(${dealId})" title="Ajouter au calendrier (Apple, Google, Outlook...)">
                <i class="fas fa-calendar-plus"></i>
              </button>
            ` : ''}
            <button type="button" class="btn btn-secondary" onclick="closeModal()">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  `);
  
  document.getElementById('scheduleRdvForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const rdv_date = document.getElementById('rdv_date').value;
    const rdv_notes = document.getElementById('rdv_notes').value;
    
    try {
      await api.updateDeal(dealId, { 
        rdv_date, 
        rdv_notes,
        status: 'rdv_planifie' // Change automatiquement le statut
      });
      
      // Proposer d'ajouter au calendrier
      closeModal();
      showCalendarExportModal(dealId);
    } catch (error) {
      alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
    }
  });
}

// EXPORT RDV TO CALENDAR (.ics file)

async function saveAIConfig() {
  const aiConfig = {
    email_instructions: document.getElementById('aiEmailInstructions').value,
    lead_tone: document.getElementById('aiLeadTone').value,
    qualification_criteria: document.getElementById('aiQualificationCriteria').value,
    followup_style: document.getElementById('aiFollowUpStyle').value
  };
  
  try {
    // Sauvegarder dans localStorage pour l'instant
    localStorage.setItem('psm_ai_config', JSON.stringify(aiConfig));
    state.aiConfig = aiConfig;
    
    // TODO: Plus tard, sauvegarder dans la DB via API
    // await api.updateAIConfig(aiConfig);
    
    alert('✅ Configuration IA enregistrée !\n\nL\'assistant utilisera maintenant vos instructions personnalisées.');
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    alert('❌ Erreur : ' + error.message);
  }
}


async function showCalendarExportModal(dealId) {
  const deal = await api.getDeal(dealId);
  
  // Coordonnées client
  const clientName = deal?.client_name || `${deal?.first_name || ''} ${deal?.last_name || ''}`.trim() || deal?.title || '';
  const clientPhone = deal?.client_phone || deal?.phone || '';
  const clientEmail = deal?.client_email || deal?.email || '';
  const clientAddress = deal?.client_address || deal?.address || '';
  const rdvDateStr = deal?.rdv_date ? new Date(deal.rdv_date).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 550px;">
        <div class="modal-header">
          <h3><i class="fas fa-calendar-check"></i> RDV planifié !</h3>
          <button class="modal-close" onclick="closeCalendarModalAndRefresh(${dealId})"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="text-center mb-3" style="color: #10b981; font-size: 1.1rem;">
            ✅ Le dossier a été déplacé en "RDV planifié"
          </p>
          
          <!-- Récapitulatif RDV avec coordonnées -->
          <div class="mb-4" style="background: #1e293b; border-radius: 10px; padding: 1rem; border-left: 4px solid #10b981;">
            <p class="text-white font-bold mb-2" style="font-size: 1.05rem;">
              <i class="fas fa-calendar" style="color: #10b981;"></i> ${rdvDateStr}
            </p>
            <p class="text-white font-semibold mb-1"><i class="fas fa-user text-blue-400" style="width:16px;"></i> ${clientName}</p>
            ${clientPhone ? `
              <p class="text-sm mb-1">
                <i class="fas fa-phone text-green-400" style="width:16px;"></i> 
                <a href="tel:${clientPhone.replace(/\\s/g, '')}" class="text-green-400 hover:text-green-300 underline" style="font-weight: 600;">${clientPhone}</a>
              </p>
            ` : ''}
            ${clientEmail ? `
              <p class="text-sm mb-1">
                <i class="fas fa-envelope text-blue-400" style="width:16px;"></i> 
                <a href="mailto:${clientEmail}" class="text-blue-400 hover:text-blue-300 underline">${clientEmail}</a>
              </p>
            ` : ''}
            ${clientAddress ? `
              <p class="text-sm mb-1">
                <i class="fas fa-map-marker-alt text-red-400" style="width:16px;"></i> 
                <a href="https://maps.google.com/?q=${encodeURIComponent(clientAddress)}" target="_blank" class="text-red-400 hover:text-red-300 underline">${clientAddress}</a>
              </p>
            ` : ''}
            ${deal?.rdv_notes ? `<p class="text-sm mt-2" style="color: #94a3b8;"><i class="fas fa-sticky-note" style="width:16px;"></i> ${deal.rdv_notes}</p>` : ''}
          </div>
          
          <h4 class="text-white mb-3">📅 Ajouter à votre calendrier :</h4>
          
          <div style="display: grid; gap: 0.75rem;">
            <button 
              class="btn btn-primary" 
              onclick="exportRdvToGoogleCalendar(${dealId})"
              style="padding: 1rem; font-size: 1rem;"
            >
              <i class="fab fa-google"></i> Ouvrir dans Google Agenda
            </button>
            
            <button 
              class="btn btn-primary" 
              onclick="exportRdvToAppleCalendar(${dealId})"
              style="padding: 1rem; font-size: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"
            >
              <i class="fab fa-apple"></i> Ouvrir dans Apple Calendar
            </button>
            
            <button 
              class="btn btn-secondary" 
              onclick="exportRdvToCalendar(${dealId})"
              style="padding: 1rem; font-size: 1rem;"
            >
              <i class="fas fa-download"></i> Télécharger .ics universel
              <span style="font-size: 0.85rem; display: block; margin-top: 0.25rem; opacity: 0.8;">
                (Outlook, Thunderbird, autres calendriers...)
              </span>
            </button>
            
            <button 
              class="btn btn-secondary" 
              onclick="closeCalendarModalAndRefresh(${dealId})"
              style="padding: 0.75rem;"
            >
              <i class="fas fa-times"></i> Passer
            </button>
          </div>
        </div>
      </div>
    </div>
  `);
}

// EXPORT TO GOOGLE CALENDAR

async function submitEditClient(clientId) {
  const form = document.getElementById('editClientForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Combiner les champs d'adresse
  const street = data.address_street || '';
  const postal = data.address_postal || '';
  const city = data.address_city || '';
  
  data.address = [street, postal, city].filter(Boolean).join(', ');
  
  // Construire le name complet à partir de prénom/nom
  if (data.first_name || data.last_name) {
    data.name = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
  }
  
  // Supprimer les champs temporaires
  delete data.address_street;
  delete data.address_postal;
  delete data.address_city;
  
  try {
    await api.updateClient(clientId, data);
    
    // Recharger la liste des clients
    state.clients = await api.getClients();
    
    alert('✅ Client modifié avec succès !');
    closeModal();
    
    // Refresh la vue actuelle si on est sur un deal
    if (state.currentDeal && state.currentDeal.client_id === clientId) {
      viewDealModal(state.currentDeal.id);
    }
  } catch (error) {
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// Parser un email pour extraire les infos contact
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
  
  // Si le contenu est du HTML, le convertir en texte brut
  let cleanText = emailText;
  if (emailText.includes('<html') || emailText.includes('<body') || emailText.includes('<div')) {
    console.log('⚠️ Contenu HTML détecté - Conversion en texte brut...');
    // Créer un élément temporaire pour extraire le texte
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = emailText;
    cleanText = tempDiv.innerText || tempDiv.textContent || emailText;
    console.log('✅ Texte brut extrait:', cleanText.substring(0, 200) + '...');
  }
  
  // Nettoyer le texte des caractères encodés
  cleanText = cleanText
    .replace(/Ã©/g, 'é')
    .replace(/Ã /g, 'à')
    .replace(/Ã¨/g, 'è')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã®/g, 'î')
    .replace(/Ã¢/g, 'â')
    .replace(/Ã¹/g, 'ù')
    .replace(/Ã§/g, 'ç');
  
  // ===== EXTRACTION FORMULAIRE SOLOCAL/SITE WEB =====
  // Pattern exact des emails Solocal : "Nom* : VALUE"
  
  // 1. Extraire le NOM
  const nameMatch = cleanText.match(/Nom\*?\s*[:：]\s*([^\n\r]+)/i);
  if (nameMatch && nameMatch[1]) {
    const fullName = nameMatch[1].trim();
    console.log('🔍 Nom trouvé:', fullName);
    
    // Ignorer "Contact PSM" et autres valeurs système
    if (fullName !== 'Contact PSM' && 
        !fullName.match(/^(Contact|Prospect|Client|PSM|Solocal|Page)/i) &&
        fullName.length > 2) {
      
      // Séparer prénom et nom si espace présent
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
    
    // Ignorer les emails système
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
    
    // Nettoyer le message
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
  
  // 6. Détecter la CIVILITÉ
  if (cleanText.match(/\b(M\.|Monsieur|Mr)\b/i)) {
    result.civility = 'M.';
  } else if (cleanText.match(/\b(Mme|Madame)\b/i)) {
    result.civility = 'Mme';
  }
  
  return result;
}

// Modal d'import depuis email
function openImportEmailModal() {
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
        <div class="modal-header">
          <h3><i class="fas fa-envelope"></i> Importer depuis un email</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="bg-blue-900 bg-opacity-30 p-3 rounded mb-4 text-sm text-blue-200">
            <i class="fas fa-info-circle"></i> Copiez-collez le contenu complet de l'email ci-dessous. 
            L'IA extraira automatiquement le nom, téléphone, email, adresse et type de projet.
          </div>
          
          <div class="input-group">
            <label class="input-label">Contenu de l'email *</label>
            <textarea id="emailContent" class="input" rows="12" placeholder="Collez ici le texte complet de l'email (Ctrl+A puis Ctrl+C dans votre boîte mail)"></textarea>
          </div>
          
          <div class="text-xs text-gray-400 mt-2">
            💡 Astuce : Ouvrez l'email, sélectionnez tout (Ctrl+A), copiez (Ctrl+C), puis collez ici (Ctrl+V)
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          <button class="btn btn-primary" onclick="processImportEmail()">
            <i class="fas fa-magic"></i> Extraire les infos
          </button>
        </div>
        <div class="text-center mt-3">
          <a href="javascript:void(0)" onclick="closeModal(); setTimeout(() => openNewLeadModal(), 300)" class="text-sm text-gray-400 hover:text-blue-400">
            ou créer un lead manuellement
          </a>
        </div>
      </div>
    </div>
  `);
}

// Traiter l'import email
async function processImportEmail() {
  const emailContent = document.getElementById('emailContent').value.trim();
  
  if (!emailContent) {
    alert('⚠️ Veuillez coller le contenu de l\'email');
    return;
  }
  
  // Désactiver le bouton pendant le traitement
  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Extraction en cours...';
  
  try {
    // Appeler l'API backend pour parser avec GPT
    console.log('📧 Envoi email à GPT pour parsing...');
    const response = await api.parseEmail(emailContent);
    
    console.log('✅ Réponse GPT:', response);
    
    if (!response.success || !response.data) {
      throw new Error('Parsing failed');
    }
    
    const parsed = response.data;
    
    // Mapper les champs GPT vers notre format
    const mappedData = {
      civility: parsed.civility || '',
      first_name: parsed.first_name || '',
      last_name: parsed.last_name || '',
      phone: parsed.phone || '',
      email: parsed.email || '',
      company: parsed.company || '',
      address: parsed.address || '',
      type: parsed.project_type || '',
      notes: parsed.notes || emailContent
    };
    
    console.log('📋 Données mappées:', mappedData);
    
    // Fermer la modale d'import
    closeModal();
    
    // Ouvrir le formulaire "Nouveau Lead" pré-rempli
    setTimeout(() => {
      openNewLeadModalWithData(mappedData);
    }, 300);
    
  } catch (error) {
    console.error('❌ Erreur parsing email:', error);
    alert('❌ Erreur lors de l\'extraction : ' + (error.message || 'Erreur inconnue'));
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// Ouvrir le formulaire Nouveau Lead avec données pré-remplies
function openNewLeadModalWithData(data) {
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 700px;">
        <div class="modal-header">
          <h3><i class="fas fa-plus-circle"></i> Nouveau Lead</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="newLeadForm" class="modal-body">
          <div class="bg-green-900 bg-opacity-30 p-3 rounded mb-4 text-sm text-green-200">
            <i class="fas fa-check-circle"></i> Informations extraites de l'email ! Vérifiez et complétez si nécessaire.
          </div>
          
          <h4 class="text-lg font-bold text-white mb-3"><i class="fas fa-user"></i> Informations du contact</h4>
          
          <div class="grid grid-cols-2 gap-3">
            <div class="input-group">
              <label class="input-label">Civilité *</label>
              <select name="civility" class="input" required>
                <option value="">Choisir...</option>
                <option value="M." ${data.civility === 'M.' ? 'selected' : ''}>M.</option>
                <option value="Mme" ${data.civility === 'Mme' ? 'selected' : ''}>Mme</option>
                <option value="M. et Mme" ${data.civility === 'M. et Mme' ? 'selected' : ''}>M. et Mme</option>
              </select>
            </div>
            
            <div class="input-group">
              <label class="input-label">Prénom *</label>
              <input type="text" name="first_name" class="input" placeholder="Ex: Jean" value="${data.first_name || ''}" required />
            </div>
          </div>
          
          <div class="input-group">
            <label class="input-label">Nom *</label>
            <input type="text" name="last_name" class="input" placeholder="Ex: Dupont" value="${data.last_name || ''}" required />
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div class="input-group">
              <label class="input-label">Téléphone *</label>
              <input type="tel" name="phone" class="input" placeholder="Ex: 06 12 34 56 78" value="${data.phone || ''}" required />
            </div>
            
            <div class="input-group">
              <label class="input-label">Email</label>
              <input type="email" name="email" class="input" placeholder="Ex: contact@example.com" value="${data.email || ''}" />
            </div>
          </div>
          
          <div class="input-group">
            <label class="input-label">Société</label>
            <input type="text" name="company" class="input" placeholder="Ex: Dupont Menuiserie" value="${data.company || ''}" />
          </div>
          
          <div class="input-group">
            <label class="input-label">Adresse</label>
            <input type="text" name="address" class="input" placeholder="Ex: 12 rue de la Paix, 44000 Nantes" value="${data.address || ''}" />
          </div>
          
          <hr class="my-4" style="border-color: rgba(255,255,255,0.1)">
          
          <h4 class="text-lg font-bold text-white mb-3"><i class="fas fa-bullseye"></i> Besoin / Projet</h4>
          
          <div class="input-group">
            <label class="input-label">Type de projet *</label>
            <select name="type" class="input" required>
              <option value="">Choisir...</option>
              <option value="Portail coulissant" ${data.type === 'Portail coulissant' ? 'selected' : ''}>Portail coulissant</option>
              <option value="Portail battant" ${data.type === 'Portail battant' ? 'selected' : ''}>Portail battant</option>
              <option value="Portillon" ${data.type === 'Portillon' ? 'selected' : ''}>Portillon</option>
              <option value="Clôture" ${data.type === 'Clôture' ? 'selected' : ''}>Clôture</option>
              <option value="Motorisation" ${data.type === 'Motorisation' ? 'selected' : ''}>Motorisation</option>
              <option value="Réparation" ${data.type === 'Réparation' ? 'selected' : ''}>Réparation</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          
          <div class="input-group">
            <label class="input-label">Montant estimé (€)</label>
            <input type="number" name="estimated_amount" class="input" placeholder="Ex: 5000" step="0.01" />
          </div>
          
          <div class="input-group">
            <label class="input-label">Notes / Contexte</label>
            <textarea name="notes" class="input" rows="4" placeholder="Décrivez le besoin, la référence, le contexte...">${data.notes || ''}</textarea>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          <button class="btn btn-success" onclick="submitNewLeadForm()">
            <i class="fas fa-check"></i> Créer le lead
          </button>
        </div>
      </div>
    </div>
  `);
}

// NOUVEAU : Formulaire rapide simplifié (3 champs essentiels)
function openQuickLeadModal() {
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
        <div class="modal-header" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
          <h3><i class="fas fa-plus-circle"></i> Nouveau Lead - Formulaire rapide</h3>
          <button class="modal-close" onclick="closeModal()" style="color: white;"><i class="fas fa-times"></i></button>
        </div>
        <form id="quickLeadForm" class="modal-body">
          <div class="bg-blue-900 bg-opacity-30 p-3 rounded mb-4 text-sm text-blue-200">
            <i class="fas fa-info-circle"></i> <strong>Formulaire simplifié :</strong> Remplissez uniquement les 3 champs essentiels ci-dessous (≈30 secondes)
          </div>
          
          <!-- Champ 1 : Nom complet -->
          <div class="input-group">
            <label class="input-label" style="font-size: 1.1rem; font-weight: 700;">
              <i class="fas fa-user"></i> 1. Nom complet *
            </label>
            <input 
              type="text" 
              name="full_name" 
              class="input" 
              placeholder="Ex: Luc Boulé, Mme Moignard, Mr Lacrampe..." 
              required 
              style="font-size: 1.1rem; padding: 0.75rem;"
              autofocus
            />
            <p class="text-xs text-gray-400 mt-1">💡 Un seul champ, pas besoin de séparer Prénom/Nom</p>
          </div>
          
          <!-- Champ 2 : Téléphone -->
          <div class="input-group">
            <label class="input-label" style="font-size: 1.1rem; font-weight: 700;">
              <i class="fas fa-phone"></i> 2. Téléphone *
            </label>
            <input 
              type="tel" 
              name="phone" 
              class="input" 
              placeholder="Ex: 06 12 34 56 78, 0689674326..." 
              required 
              style="font-size: 1.1rem; padding: 0.75rem;"
            />
            <p class="text-xs text-gray-400 mt-1">💡 Format libre (avec ou sans espaces)</p>
          </div>
          
          <!-- Champ 3 : Type de projet -->
          <div class="input-group">
            <label class="input-label" style="font-size: 1.1rem; font-weight: 700;">
              <i class="fas fa-tools"></i> 3. Type de projet *
            </label>
            <select 
              name="type" 
              class="input" 
              required 
              style="font-size: 1.1rem; padding: 0.75rem;"
            >
              <option value="">Choisir le type de projet...</option>
              <option value="Portail coulissant">🚪 Portail coulissant</option>
              <option value="Portail battant">🚪 Portail battant</option>
              <option value="Portillon">🚪 Portillon</option>
              <option value="Clôture">🏗️ Clôture</option>
              <option value="Motorisation">⚙️ Motorisation</option>
              <option value="Réparation">🔧 Réparation</option>
              <option value="Autre">📋 Autre</option>
            </select>
          </div>
          
          <hr class="my-4" style="border-color: rgba(255,255,255,0.1)">
          
          <!-- Champs optionnels (accordéon replié) -->
          <details style="margin-bottom: 1rem;">
            <summary style="cursor: pointer; color: #60a5fa; font-weight: 600; padding: 0.5rem; border: 1px solid rgba(96, 165, 250, 0.3); border-radius: 8px; background: rgba(96, 165, 250, 0.1);">
              <i class="fas fa-chevron-down"></i> Informations complémentaires (optionnel)
            </summary>
            <div style="margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
              <div class="input-group">
                <label class="input-label">Email</label>
                <input type="email" name="email" class="input" placeholder="Ex: contact@example.com" />
              </div>
              
              <div class="input-group">
                <label class="input-label">Adresse</label>
                <input type="text" name="address" class="input" placeholder="Ex: Sainte-Luce-sur-Loire" />
              </div>
              
              <div class="input-group">
                <label class="input-label">Montant estimé (€)</label>
                <input type="number" name="estimated_amount" class="input" placeholder="Ex: 5000" step="0.01" />
              </div>
              
              <div class="input-group">
                <label class="input-label">Notes / Contexte</label>
                <textarea name="notes" class="input" rows="3" placeholder="Ex: Référence voisin, besoin urgent, budget flexible..."></textarea>
              </div>
            </div>
          </details>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          <button class="btn btn-success" onclick="submitQuickLeadForm()" style="font-size: 1.1rem; padding: 0.75rem 1.5rem;">
            <i class="fas fa-check-circle"></i> Créer le lead
          </button>
        </div>
      </div>
    </div>
  `);
}

// Soumettre le formulaire rapide
async function submitQuickLeadForm() {
  const form = document.getElementById('quickLeadForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Validation
  if (!data.full_name || !data.phone || !data.type) {
    alert('❌ Veuillez remplir les 3 champs obligatoires (Nom, Téléphone, Type de projet)');
    return;
  }
  
  try {
    // Séparer le nom complet en prénom/nom (simple heuristique)
    const nameParts = data.full_name.trim().split(/\s+/);
    let first_name = '';
    let last_name = '';
    let civility = '';
    
    // Détecter civilité
    if (nameParts[0].match(/^(M\.|Mr|Monsieur)$/i)) {
      civility = 'M.';
      nameParts.shift();
    } else if (nameParts[0].match(/^(Mme|Madame|Mlle)$/i)) {
      civility = 'Mme';
      nameParts.shift();
    }
    
    // Répartir prénom/nom
    if (nameParts.length === 1) {
      last_name = nameParts[0];
    } else if (nameParts.length >= 2) {
      first_name = nameParts.slice(0, -1).join(' ');
      last_name = nameParts[nameParts.length - 1];
    }
    
    // 1. Créer le client
    const clientData = {
      civility: civility || 'M.',
      first_name: first_name || '',
      last_name: last_name || data.full_name,
      name: data.full_name,
      phone: data.phone.replace(/\s/g, ''),
      email: data.email || '',
      address: data.address || '',
      notes: data.notes || ''
    };
    
    const clientResponse = await api.createClient(clientData);
    const clientId = clientResponse.id;
    
    // 2. Créer le lead
    const leadData = {
      client_id: clientId,
      title: data.type,
      type: data.type,
      amount: parseFloat(data.estimated_amount) || 0,
      estimated_amount: parseFloat(data.estimated_amount) || 0,
      stage: 'lead',
      status: 'lead',
      notes: data.notes || `Lead créé depuis formulaire rapide. Type: ${data.type}`
    };
    
    await api.createDeal(leadData);
    
    // 3. Rafraîchir les données
    state.clients = await api.getClients();
    state.deals = await api.getDeals();
    
    // 4. Afficher succès
    showToast(`✅ Lead créé pour ${data.full_name} !`, 'success');
    closeModal();
    
    // 5. Retourner au pipeline
    navigate('pipeline');
    
  } catch (error) {
    console.error('Erreur création lead:', error);
    alert('❌ Erreur lors de la création du lead : ' + (error.response?.data?.error || error.message));
  }
}

// Soumettre le formulaire de lead depuis email
async function submitEmailLeadForm() {
  const form = document.getElementById('emailLeadForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Validation minimale (au moins un identifiant : nom ou email ou téléphone)
  if (!data.first_name && !data.last_name && !data.email && !data.phone) {
    alert('❌ Veuillez renseigner au moins un identifiant (nom, email ou téléphone)');
    return;
  }
  
  try {
    const token = storage.get('token');
    if (!token) {
      alert('❌ Vous devez être connecté');
      return;
    }
    
    // 1. Rechercher ou créer le client
    let client = null;
    const clientsResponse = await fetch('/api/clients', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (clientsResponse.ok) {
      const clientsData = await clientsResponse.json().catch(() => ({}));
      const clients = Array.isArray(clientsData.clients) ? clientsData.clients : [];
      client = clients.find((item) => (item.email || '').toLowerCase() === data.email.toLowerCase()) || null;
    }
    
    // Créer le client si nécessaire
    if (!client) {
      const clientData = {
        civility: data.civility || 'M.',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        name: `${data.first_name} ${data.last_name}`.trim(),
        phone: data.phone.replace(/\s/g, ''),
        email: data.email || '',
        company: data.company || '',
        address: data.address || '',
        notes: `Lead créé depuis email: ${data.email_subject}`
      };
      
      const clientResponse = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientData)
      });
      
      if (!clientResponse.ok) {
        const errorData = await clientResponse.json().catch(() => ({}));
        console.error('❌ Erreur création client:', errorData);
        
        // Si erreur UNIQUE constraint, essayer de récupérer le client existant
        if (errorData.details && errorData.details.includes('UNIQUE constraint')) {
          const retryResponse = await fetch('/api/clients', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            const retryClients = Array.isArray(retryData.clients) ? retryData.clients : [];
            client = retryClients.find((item) => (item.email || '').toLowerCase() === data.email.toLowerCase());
          }
        }
        
        if (!client) {
          throw new Error(errorData.error || 'Erreur création client');
        }
      } else {
        client = await clientResponse.json();
      }
    }
    
    // 2. Créer le lead
    const leadData = {
      client_id: client.id,
      title: data.type,
      type: data.type,
      amount: parseFloat(data.estimated_amount) || 0,
      estimated_amount: parseFloat(data.estimated_amount) || 0,
      stage: 'lead',
      status: 'lead',
      notes: data.notes || `📧 Email reçu: ${data.email_subject}\n\n${data.notes}`
    };
    
    const dealResponse = await fetch('/api/deals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(leadData)
    });
    
    if (!dealResponse.ok) {
      const errorData = await dealResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erreur création lead');
    }
    
    // 3. Rafraîchir les données
    state.clients = await api.getClients();
    state.deals = await api.getDeals();
    
    // 4. Afficher succès
    showToast(`✅ Lead créé pour ${data.first_name} ${data.last_name} !`, 'success');
    closeModal();
    
    // 5. Marquer l'email comme traité (optionnel)
    if (data.email_id) {
      try {
        await fetch(`/api/emails/${data.email_id}/archive`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            access_token: localStorage.getItem('gmail_access_token') 
          })
        });
      } catch (archiveError) {
        console.warn('⚠️ Erreur archivage email:', archiveError);
      }
    }
    
    // 6. Retourner au pipeline
    navigate('pipeline');
    
  } catch (error) {
    console.error('❌ Erreur création lead:', error);
    alert('❌ Erreur lors de la création du lead : ' + error.message);
  }
}

// Créer un nouveau lead (sans client existant)
async function openNewLeadModal() {
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 700px;">
        <div class="modal-header">
          <h3><i class="fas fa-plus-circle"></i> Nouveau Lead</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="newLeadForm" class="modal-body">
          <div class="mb-4">
            <button type="button" class="btn btn-secondary w-full" onclick="openImportEmailModal()">
              <i class="fas fa-envelope"></i> 📧 Importer depuis un email
            </button>
          </div>
          
          <div class="bg-blue-900 bg-opacity-30 p-3 rounded mb-4 text-sm text-blue-200">
            <i class="fas fa-info-circle"></i> Créez un lead directement. Le contact sera automatiquement ajouté à vos clients.
          </div>
          
          <h4 class="text-lg font-bold text-white mb-3"><i class="fas fa-user"></i> Informations du contact</h4>
          
          <div class="grid grid-cols-2 gap-3">
            <div class="input-group">
              <label class="input-label">Civilité *</label>
              <select name="civility" class="input" required>
                <option value="">Choisir...</option>
                <option value="M.">M.</option>
                <option value="Mme">Mme</option>
                <option value="M. et Mme">M. et Mme</option>
              </select>
            </div>
            
            <div class="input-group">
              <label class="input-label">Prénom *</label>
              <input type="text" name="first_name" class="input" placeholder="Ex: Jean" required />
            </div>
          </div>
          
          <div class="input-group">
            <label class="input-label">Nom *</label>
            <input type="text" name="last_name" class="input" placeholder="Ex: Dupont" required />
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div class="input-group">
              <label class="input-label">Téléphone *</label>
              <input type="tel" name="phone" class="input" placeholder="Ex: 06 12 34 56 78" required />
            </div>
            
            <div class="input-group">
              <label class="input-label">Email</label>
              <input type="email" name="email" class="input" placeholder="Ex: contact@example.com" />
            </div>
          </div>
          
          <div class="input-group">
            <label class="input-label">Société</label>
            <input type="text" name="company" class="input" placeholder="Ex: Dupont Menuiserie" />
          </div>
          
          <div class="input-group">
            <label class="input-label">Adresse</label>
            <input type="text" name="address" class="input" placeholder="Ex: 12 rue de la Paix, 44000 Nantes" />
          </div>
          
          <hr class="my-4" style="border-color: rgba(255,255,255,0.1)">
          
          <h4 class="text-lg font-bold text-white mb-3"><i class="fas fa-bullseye"></i> Besoin / Projet</h4>
          
          <div class="input-group">
            <label class="input-label">Type de projet *</label>
            <select name="type" class="input" required>
              <option value="">Choisir...</option>
              <option value="Portail coulissant">Portail coulissant</option>
              <option value="Portail battant">Portail battant</option>
              <option value="Portillon">Portillon</option>
              <option value="Clôture">Clôture</option>
              <option value="Motorisation">Motorisation</option>
              <option value="Réparation">Réparation</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          
          <div class="input-group">
            <label class="input-label">Montant estimé (€)</label>
            <input type="number" name="estimated_amount" class="input" placeholder="Ex: 5000" step="0.01" />
          </div>
          
          <div class="input-group">
            <label class="input-label">Notes / Contexte</label>
            <textarea name="notes" class="input" rows="4" placeholder="Décrivez le besoin, la référence, le contexte..."></textarea>
          </div>
        </form>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
          <button class="btn btn-success" onclick="submitNewLeadForm()">
            <i class="fas fa-check"></i> Créer le lead
          </button>
        </div>
      </div>
    </div>
  `);
}

async function submitNewLeadForm() {
  const form = document.getElementById('newLeadForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  try {
    // 1. Créer le client d'abord
    const clientData = {
      civility: data.civility,
      first_name: data.first_name,
      last_name: data.last_name,
      name: `${data.first_name} ${data.last_name}`.trim(),
      phone: data.phone,
      email: data.email || null,
      company: data.company || null,
      address: data.address || null
    };
    
    console.log('📝 Création client:', clientData);
    const clientResult = await api.createClient(clientData);
    const clientId = clientResult.client?.id || clientResult.id;
    console.log('✅ Client créé, ID:', clientId);
    
    // 2. Créer le lead associé
    const dealData = {
      client_id: parseInt(clientId, 10),
      title: data.type || 'Nouveau projet',
      amount: parseFloat(data.estimated_amount) || 0,
      stage: 'lead',
      notes: data.notes || ''
    };
    
    console.log('📝 Création lead:', dealData);
    const dealResult = await api.createDeal(dealData);
    console.log('✅ Lead créé:', dealResult);
    
    // 3. Recharger les données
    state.clients = await api.getClients();
    state.deals = await api.getDeals();
    
    alert('✅ Lead créé avec succès !');
    closeModal();
    
    // 4. Naviguer vers le pipeline
    navigate('pipeline');
    
  } catch (error) {
    console.error('❌ Erreur création lead:', error);
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// Créer un lead depuis un client existant
async function openCreateLeadFromClient(clientId) {
  try {
    const client = await api.getClient(clientId);
    
    // Stocker le client_id dans state pour le récupérer lors de la soumission
    state.currentClientId = clientId;
    
    showModal(`
      <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
        <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 600px;">
          <div class="modal-header">
            <h3><i class="fas fa-plus-circle"></i> Créer un lead pour ${client.name || 'ce client'}</h3>
            <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
          </div>
          <form id="createLeadFromClientForm" class="modal-body">
            <input type="hidden" name="client_id" value="${clientId}" id="hiddenClientId" />
            
            <div class="bg-gray-700 p-3 rounded mb-4">
              <p class="text-sm text-gray-300 mb-1"><i class="fas fa-user"></i> <strong>${client.name || 'Sans nom'}</strong></p>
              ${client.company ? `<p class="text-sm text-gray-400 mb-1"><i class="fas fa-building"></i> ${client.company}</p>` : ''}
              ${client.phone ? `<p class="text-sm text-gray-400 mb-1"><i class="fas fa-phone"></i> ${client.phone}</p>` : ''}
              ${client.email ? `<p class="text-sm text-gray-400"><i class="fas fa-envelope"></i> ${client.email}</p>` : ''}
            </div>
            
            <div class="input-group">
              <label class="input-label">Type de projet *</label>
              <select name="type" class="input" required>
                <option value="">Choisir...</option>
                <option value="Portail coulissant">Portail coulissant</option>
                <option value="Portail battant">Portail battant</option>
                <option value="Portillon">Portillon</option>
                <option value="Clôture">Clôture</option>
                <option value="Motorisation">Motorisation</option>
                <option value="Réparation">Réparation</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            
            <div class="input-group">
              <label class="input-label">Montant estimé (€)</label>
              <input type="number" name="estimated_amount" class="input" placeholder="Ex: 5000" step="0.01" />
            </div>
            
            <div class="input-group">
              <label class="input-label">Notes / Contexte</label>
              <textarea name="notes" class="input" rows="4" placeholder="Décrivez le besoin du client, le contexte de la demande..."></textarea>
            </div>
            
            <div class="input-group">
              <label class="input-label">Statut initial</label>
              <select name="status" class="input">
                <option value="lead">🎯 Lead</option>
                <option value="rdv_planifie">📅 RDV planifié</option>
                <option value="devis_a_faire">📝 Devis à faire</option>
              </select>
            </div>
          </form>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
            <button class="btn btn-success" onclick="submitCreateLeadFromClient()">
              <i class="fas fa-check"></i> Créer le lead
            </button>
          </div>
        </div>
      </div>
    `);
  } catch (error) {
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

async function submitCreateLeadFromClient() {
  const form = document.getElementById('createLeadFromClientForm');
  const formData = new FormData(form);
  const rawData = Object.fromEntries(formData);
  
  // Récupérer le client_id depuis le formulaire OU depuis state
  const clientId = rawData.client_id || state.currentClientId;
  
  if (!clientId) {
    alert('❌ Erreur : client_id manquant');
    return;
  }
  
  // Mapper les champs du formulaire vers les champs API
  const data = {
    client_id: parseInt(clientId, 10),
    title: rawData.type || 'Nouveau projet',
    amount: parseFloat(rawData.estimated_amount) || 0,
    stage: rawData.status || 'lead',
    notes: rawData.notes || ''
  };
  
  console.log('🔍 Données envoyées à createDeal:', data);
  
  try {
    // Créer le deal/lead
    const newDeal = await api.createDeal(data);
    console.log('✅ Lead créé, réponse API:', newDeal);
    
    // Recharger la liste des deals pour avoir le lead enrichi
    state.deals = await api.getDeals();
    
    alert('✅ Lead créé avec succès !');
    closeModal();
    
    // Naviguer vers le pipeline
    navigate('pipeline');
  } catch (error) {
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}


async function submitEditLead(dealId) {
  const form = document.getElementById('editLeadForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  
  try {
    // Mettre à jour le client
    await api.updateClient(state.currentDeal.client_id, data);
    
    alert('✅ Lead modifié avec succès !');
    closeModal();
    
    // Recharger la modale du deal
    await viewDealModal(dealId);
  } catch (error) {
    console.error('Erreur modification lead:', error);
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// MODAL SCHEDULE RDV (Planifier un rendez-vous)

async function submitLeadForm() {
  const form = document.getElementById('leadForm');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Forcer le statut Lead
  data.status = 'lead';
  
  try {
    let clientId = data.client_id;
    
    // Si client_id est vide, c'est un nouveau client
    if (!clientId || clientId === '') {
      // Combiner l'adresse
      const street = data.address_street || '';
      const postal = data.address_postal || '';
      const city = data.address_city || '';
      const fullAddress = [street, postal, city].filter(Boolean).join(', ');
      
      // Créer le client d'abord
      const clientData = {
        civility: data.civility,
        first_name: data.first_name,
        last_name: data.last_name,
        name: [data.first_name, data.last_name].filter(Boolean).join(' ').trim(),
        phone: data.phone,
        email: data.email,
        company: data.company,
        address: fullAddress
      };
      
      const clientResult = await api.createClient(clientData);
      clientId = clientResult.client?.id || clientResult.id;
      
      // Ajouter le nouveau client à state.clients pour refresh
      await api.getClients().then(clients => state.clients = clients);
    }
    
    // Créer le deal avec le client_id
    const dealData = {
      client_id: clientId,
      type: data.type,
      estimated_amount: data.estimated_amount,
      notes: data.notes,
      status: 'lead'
    };
    
    const result = await api.createDeal(dealData);
    const dealId = result.deal?.id || result.id;
    
    closeModal();
    alert('✅ Lead créé ! Vous pouvez maintenant ouvrir la fiche pour planifier un RDV.');
    
    // Ouvrir automatiquement la fiche du Lead
    viewDealModal(dealId);
    
  } catch (error) {
    alert('Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// CREATE DEAL MODAL (complet avec RDV optionnel)

function toggleLeadClientMode(mode) {
  const newSection = document.getElementById('newClientSection');
  const existingSection = document.getElementById('existingClientSection');
  const btnNew = document.getElementById('btnNewClient');
  const btnExisting = document.getElementById('btnExistingClient');
  
  if (mode === 'new') {
    newSection.style.display = 'block';
    existingSection.style.display = 'none';
    btnNew.classList.remove('btn-secondary');
    btnNew.classList.add('btn-primary');
    btnExisting.classList.remove('btn-primary');
    btnExisting.classList.add('btn-secondary');
    
    // Rendre les champs client requis
    document.getElementById('civility').required = true;
    document.getElementById('first_name').required = true;
    document.getElementById('last_name').required = true;
    document.getElementById('phone').required = true;
    document.getElementById('leadClientSelect').required = false;
  } else {
    newSection.style.display = 'none';
    existingSection.style.display = 'block';
    btnNew.classList.remove('btn-primary');
    btnNew.classList.add('btn-secondary');
    btnExisting.classList.remove('btn-secondary');
    btnExisting.classList.add('btn-primary');
    
    // Rendre les champs client non requis
    document.getElementById('civility').required = false;
    document.getElementById('first_name').required = false;
    document.getElementById('last_name').required = false;
    document.getElementById('phone').required = false;
    document.getElementById('leadClientSelect').required = true;
  }
}

// CREATE CLIENT FROM LEAD (similaire à openCreateClientFromDeal)

async function confirmDeleteClient(clientId) {
  try {
    // Récupérer les infos du client
    const client = state.clients.find(c => c.id === clientId);
    if (!client) {
      alert('❌ Client introuvable');
      return;
    }
    
    // Construire le nom (gérer les cas où first_name/last_name sont vides)
    const firstName = client.first_name?.trim() || '';
    const lastName = client.last_name?.trim() || '';
    const clientName = (firstName || lastName) 
      ? `${firstName} ${lastName}`.trim() 
      : `Client #${client.id}`;
    
    // Une seule confirmation simple
    if (!confirm(`🗑️ Déplacer "${clientName}" dans la corbeille ?\n\nVous pourrez le restaurer depuis le menu Corbeille.`)) {
      return;
    }
    
    await api.archiveClient(clientId);
    alert('✅ Client déplacé dans la corbeille !');
    navigate('clients'); // Rafraîchir la liste des clients
  } catch (error) {
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}



// ==================== EMAIL INTERNE - SOUS-CATÉGORIES ====================

function openInternalCategoryModal(emailId) {
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 500px;">
        <div class="modal-header">
          <h3><i class="fas fa-building"></i> Classer email interne</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="mb-4 text-sm" style="color: var(--psm-text-muted);">
            Sélectionnez le type d'email interne :
          </p>
          
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <!-- Planning -->
            <button 
              class="card" 
              onclick="categorizeEmailInternal(${emailId}, 'planning')"
              style="cursor: pointer; padding: 1rem; text-align: left; border-left: 4px solid #8b5cf6; transition: all 0.2s;"
              onmouseover="this.style.background='rgba(139, 92, 246, 0.1)'"
              onmouseout="this.style.background='var(--psm-card-bg)'"
            >
              <div class="flex items-center gap-3">
                <div style="width: 40px; height: 40px; background: #8b5cf6; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                  <i class="fas fa-calendar-alt" style="color: white;"></i>
                </div>
                <div>
                  <div class="font-bold text-white">📋 Planning</div>
                  <div class="text-xs text-gray-400">RDV, chantiers, organisation</div>
                </div>
              </div>
            </button>
            
            <!-- Facturation -->
            <button 
              class="card" 
              onclick="categorizeEmailInternal(${emailId}, 'facturation')"
              style="cursor: pointer; padding: 1rem; text-align: left; border-left: 4px solid #10b981; transition: all 0.2s;"
              onmouseover="this.style.background='rgba(16, 185, 129, 0.1)'"
              onmouseout="this.style.background='var(--psm-card-bg)'"
            >
              <div class="flex items-center gap-3">
                <div style="width: 40px; height: 40px; background: #10b981; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                  <i class="fas fa-euro-sign" style="color: white;"></i>
                </div>
                <div>
                  <div class="font-bold text-white">💰 Facturation</div>
                  <div class="text-xs text-gray-400">Acomptes, factures à transférer</div>
                </div>
              </div>
            </button>
            
            <!-- Cotations -->
            <button 
              class="card" 
              onclick="categorizeEmailInternal(${emailId}, 'cotations')"
              style="cursor: pointer; padding: 1rem; text-align: left; border-left: 4px solid #f59e0b; transition: all 0.2s;"
              onmouseover="this.style.background='rgba(245, 158, 11, 0.1)'"
              onmouseout="this.style.background='var(--psm-card-bg)'"
            >
              <div class="flex items-center gap-3">
                <div style="width: 40px; height: 40px; background: #f59e0b; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                  <i class="fas fa-ruler-combined" style="color: white;"></i>
                </div>
                <div>
                  <div class="font-bold text-white">📐 Cotations</div>
                  <div class="text-xs text-gray-400">Côtes, mesures techniques</div>
                </div>
              </div>
            </button>
            
            <!-- Gestion -->
            <button 
              class="card" 
              onclick="categorizeEmailInternal(${emailId}, 'gestion')"
              style="cursor: pointer; padding: 1rem; text-align: left; border-left: 4px solid #ef4444; transition: all 0.2s;"
              onmouseover="this.style.background='rgba(239, 68, 68, 0.1)'"
              onmouseout="this.style.background='var(--psm-card-bg)'"
            >
              <div class="flex items-center gap-3">
                <div style="width: 40px; height: 40px; background: #ef4444; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                  <i class="fas fa-exclamation-triangle" style="color: white;"></i>
                </div>
                <div>
                  <div class="font-bold text-white">⚙️ Gestion</div>
                  <div class="text-xs text-gray-400">Problèmes, admin, urgences</div>
                </div>
              </div>
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
        </div>
      </div>
    </div>
  `);
}

async function categorizeEmailInternal(emailId, subcategory) {
  try {
    // D'abord récupérer l'email pour avoir son contenu
    const emailResponse = await axios.get(`${API_URL}/api/emails/${emailId}`);
    const email = emailResponse.data.email;
    
    // Classer l'email
    await axios.post(`${API_URL}/api/emails/${emailId}/categorize`, {
      category: 'internal',
      subcategory: subcategory
    });
    
    const labels = {
      planning: '📋 Planning',
      facturation: '💰 Facturation',
      cotations: '📐 Cotations',
      gestion: '⚙️ Gestion'
    };
    
    // Afficher la modale d'actions rapides
    openInternalActionsModal(emailId, subcategory, email);
    
  } catch (error) {
    alert('❌ Erreur : ' + (error.response?.data?.error || error.message));
  }
}

// ==================== ACTIONS RAPIDES EMAILS INTERNES ====================

function openInternalActionsModal(emailId, subcategory, email) {
  const labels = {
    planning: '📋 Planning',
    facturation: '💰 Facturation',
    cotations: '📐 Cotations',
    gestion: '⚙️ Gestion'
  };
  
  let actionsHTML = '';
  
  // Actions spécifiques selon la sous-catégorie
  if (subcategory === 'facturation') {
    actionsHTML = `
      <button class="btn btn-primary w-full mb-2" onclick="transferToClient(${emailId})">
        <i class="fas fa-paper-plane"></i> Transférer au client
      </button>
      <button class="btn btn-secondary w-full mb-2" onclick="viewEmailDetail(${emailId})">
        <i class="fas fa-eye"></i> Voir le détail
      </button>
      <button class="btn btn-secondary w-full" onclick="closeModal(); renderMails();">
        <i class="fas fa-archive"></i> Archiver
      </button>
    `;
  } else if (subcategory === 'planning') {
    actionsHTML = `
      <button class="btn btn-primary w-full mb-2" onclick="addToCalendar(${emailId})">
        <i class="fas fa-calendar-plus"></i> Ajouter au calendrier
      </button>
      <button class="btn btn-secondary w-full mb-2" onclick="linkToDeal(${emailId})">
        <i class="fas fa-link"></i> Lier à un dossier
      </button>
      <button class="btn btn-secondary w-full mb-2" onclick="viewEmailDetail(${emailId})">
        <i class="fas fa-eye"></i> Voir le détail
      </button>
      <button class="btn btn-secondary w-full" onclick="closeModal(); renderMails();">
        <i class="fas fa-check"></i> OK, c'est noté
      </button>
    `;
  } else if (subcategory === 'cotations') {
    actionsHTML = `
      <button class="btn btn-primary w-full mb-2" onclick="attachToQuote(${emailId})">
        <i class="fas fa-paperclip"></i> Joindre au devis
      </button>
      <button class="btn btn-secondary w-full mb-2" onclick="createNoteFromEmail(${emailId})">
        <i class="fas fa-sticky-note"></i> Créer une note
      </button>
      <button class="btn btn-secondary w-full mb-2" onclick="viewEmailDetail(${emailId})">
        <i class="fas fa-eye"></i> Voir le détail
      </button>
      <button class="btn btn-secondary w-full" onclick="closeModal(); renderMails();">
        <i class="fas fa-check"></i> OK, c'est noté
      </button>
    `;
  } else if (subcategory === 'gestion') {
    actionsHTML = `
      <button class="btn btn-primary w-full mb-2" onclick="createTaskFromEmail(${emailId})">
        <i class="fas fa-tasks"></i> Créer une tâche
      </button>
      <button class="btn btn-warning w-full mb-2" onclick="markAsUrgent(${emailId})">
        <i class="fas fa-exclamation-triangle"></i> Marquer urgent
      </button>
      <button class="btn btn-secondary w-full mb-2" onclick="viewEmailDetail(${emailId})">
        <i class="fas fa-eye"></i> Voir le détail
      </button>
      <button class="btn btn-secondary w-full" onclick="closeModal(); renderMails();">
        <i class="fas fa-check"></i> OK, c'est noté
      </button>
    `;
  }
  
  showModal(`
    <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 500px;">
        <div class="modal-header">
          <h3><i class="fas fa-bolt"></i> Actions rapides</h3>
          <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="mb-4 p-3 bg-green-900/30 rounded" style="border-left: 4px solid #10b981;">
            <div class="flex items-center gap-2 mb-2">
              <i class="fas fa-check-circle text-green-400"></i>
              <span class="font-bold text-white">Email classé : ${labels[subcategory]}</span>
            </div>
            <div class="text-sm text-gray-300">
              <strong>${email.subject}</strong>
            </div>
            <div class="text-xs text-gray-400 mt-1">
              De : ${email.sender_name || email.sender_email}
            </div>
          </div>
          
          <p class="mb-3 text-sm text-gray-400">Que voulez-vous faire ?</p>
          
          ${actionsHTML}
        </div>
      </div>
    </div>
  `);
}

// Actions pour Facturation
function transferToClient(emailId) {
  alert('📤 Fonctionnalité "Transférer au client" en cours de développement\n\nCette fonction permettra de :\n- Copier le contenu de l\'email\n- Préparer un email pour le client\n- Joindre la facture');
  closeModal();
  renderMails();
}

// Actions pour Planning
function addToCalendar(emailId) {
  alert('📅 Fonctionnalité "Ajouter au calendrier" en cours de développement\n\nCette fonction permettra de :\n- Extraire les dates et horaires\n- Créer un événement calendrier\n- Synchroniser avec Google/Apple Calendar');
  closeModal();
  renderMails();
}

function linkToDeal(emailId) {
  alert('🔗 Fonctionnalité "Lier à un dossier" en cours de développement\n\nCette fonction permettra de :\n- Sélectionner un dossier existant\n- Attacher l\'email au dossier\n- Afficher l\'historique des emails');
  closeModal();
  renderMails();
}

// Actions pour Cotations
function attachToQuote(emailId) {
  alert('📎 Fonctionnalité "Joindre au devis" en cours de développement\n\nCette fonction permettra de :\n- Sélectionner un devis existant\n- Attacher les informations de cotation\n- Mettre à jour les dimensions');
  closeModal();
  renderMails();
}

function createNoteFromEmail(emailId) {
  alert('📝 Fonctionnalité "Créer une note" en cours de développement\n\nCette fonction permettra de :\n- Extraire les informations techniques\n- Créer une note dans le dossier\n- Garder une trace des côtes');
  closeModal();
  renderMails();
}

// Actions pour Gestion
function createTaskFromEmail(emailId) {
  alert('✅ Fonctionnalité "Créer une tâche" en cours de développement\n\nCette fonction permettra de :\n- Extraire le problème à résoudre\n- Créer une tâche avec échéance\n- Assigner la tâche');
  closeModal();
  renderMails();
}

function markAsUrgent(emailId) {
  alert('⚠️ Email marqué comme URGENT\n\nUne notification sera envoyée et l\'email sera mis en priorité.');
  closeModal();
  renderMails();
}

// ==================== CHATBOT ASSISTANT IA ====================
let chatHistory = [];

function initChatbot() {
  const chatbotHTML = `
    <div id="chatbot-button" class="fixed bottom-6 right-6 z-50">
      <button onclick="toggleChatbot()" class="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
        <i class="fas fa-robot text-2xl"></i>
      </button>
    </div>

    <div id="chatbot-modal" class="hidden fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-2xl z-50 border border-gray-200">
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-lg flex justify-between items-center">
        <div class="flex items-center gap-2">
          <i class="fas fa-robot text-white text-xl"></i>
          <h3 class="text-white font-bold">Assistant KARL</h3>
        </div>
        <button onclick="toggleChatbot()" class="text-white hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div id="chat-messages" class="h-96 overflow-y-auto p-4 bg-gray-50">
        <div class="text-center text-gray-500 text-sm mb-4">
          <i class="fas fa-robot text-3xl text-blue-600 mb-2"></i>
          <p>Bonjour ! Je suis votre assistant IA KARL.</p>
          <p class="text-xs mt-1">Posez-moi des questions sur vos clients, devis, tâches...</p>
        </div>
      </div>

      <div class="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div class="flex gap-2">
          <input 
            type="text" 
            id="chat-input" 
            placeholder="Posez votre question..."
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"
            onkeypress="if(event.key === 'Enter') sendChatMessage()"
          />
          <button onclick="sendChatMessage()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', chatbotHTML);
}

function toggleChatbot() {
  const modal = document.getElementById('chatbot-modal');
  modal.classList.toggle('hidden');
  if (!modal.classList.contains('hidden')) {
    document.getElementById('chat-input').focus();
    // Charger les données si pas encore chargées
    loadChatbotData();
  }
}

async function loadChatbotData() {
  try {
    // Charger clients si pas encore chargés
    if (!state.clients || safeArray(state.clients).length === 0) {
      state.clients = await api.getClients();
    }
    // Charger deals si pas encore chargés
    if (!state.deals || safeArray(state.deals).length === 0) {
      state.deals = await api.getDeals();
    }
    // Charger quotes si pas encore chargés
    if (!state.quotes || safeArray(state.quotes).length === 0) {
      state.quotes = await api.getQuotes();
    }
    // Charger tasks si pas encore chargés
    if (!state.tasks || safeArray(state.tasks).length === 0) {
      state.tasks = await api.getTasks();
    }
  } catch (error) {
    console.error('Erreur chargement données chatbot:', error);
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Afficher le message utilisateur
  addChatMessage('user', message);
  input.value = '';
  
  // Contexte pour l'IA
  const context = {
    user: state.user,
    currentPage: window.location.hash || '#dashboard',
    clients: {
      count: state.clients?.length || 0,
      list: state.clients?.slice(0, 5).map(c => ({ 
        name: `${c.first_name} ${c.last_name}`, 
        company: c.company,
        source: c.source 
      })) || []
    },
    deals: {
      count: state.deals?.length || 0,
      byStatus: state.deals?.reduce((acc, d) => {
        acc[d.status || d.stage] = (acc[d.status || d.stage] || 0) + 1;
        return acc;
      }, {}) || {}
    },
    quotes: {
      count: state.quotes?.length || 0,
      byStatus: state.quotes?.reduce((acc, q) => {
        acc[q.status] = (acc[q.status] || 0) + 1;
        return acc;
      }, {}) || {}
    },
    tasks: {
      count: state.tasks?.length || 0,
      pending: state.tasks?.filter(t => t.status === 'pending').length || 0
    }
  };
  
  try {
    // Loader avec ID unique pour le supprimer facilement
    const messagesDiv = document.getElementById('chat-messages');
    const loaderHTML = `
      <div id="chat-loader" class="mb-3 text-left">
        <div class="inline-block max-w-[80%] p-3 rounded-lg bg-white text-gray-800 shadow-sm border border-gray-200 rounded-bl-none">
          <i class="fas fa-robot mr-2"></i>
          <i class="fas fa-circle-notch fa-spin text-blue-600"></i>
          <span class="text-gray-500 text-sm ml-2">Analyse en cours...</span>
        </div>
      </div>
    `;
    messagesDiv.insertAdjacentHTML('beforeend', loaderHTML);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    // Appel API
    const response = await api.chatWithAI(message, context);
    
    // Supprimer le loader par son ID
    const loader = document.getElementById('chat-loader');
    if (loader) loader.remove();
    
    // Afficher la réponse
    addChatMessage('assistant', response.response);
    
    // Ajouter à l'historique
    chatHistory.push({ role: 'user', content: message });
    chatHistory.push({ role: 'assistant', content: response.response });
    
  } catch (error) {
    console.error('Erreur chat IA:', error);
    const loader = document.getElementById('chat-loader');
    if (loader) loader.remove();
    addChatMessage('assistant', '❌ Erreur : Je ne peux pas répondre pour le moment.');
  }
}

function addChatMessage(role, content) {
  const messagesDiv = document.getElementById('chat-messages');
  const messageHTML = `
    <div class="mb-3 ${role === 'user' ? 'text-right' : 'text-left'}">
      <div class="inline-block max-w-[80%] p-3 rounded-lg ${
        role === 'user' 
          ? 'bg-blue-600 text-white rounded-br-none' 
          : 'bg-white text-gray-800 shadow-sm border border-gray-200 rounded-bl-none'
      }">
        ${role === 'assistant' ? '<i class="fas fa-robot mr-2"></i>' : ''}
        ${content}
      </div>
    </div>
  `;
  messagesDiv.insertAdjacentHTML('beforeend', messageHTML);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  
  // Intercepter les clics sur les liens pour naviguer dans l'app
  if (role === 'assistant') {
    const lastMessage = messagesDiv.lastElementChild;
    const links = lastMessage.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('href').substring(1); // Enlever le #
        toggleChatbot(); // Fermer le chatbot
        navigate(page); // Naviguer vers la page
      });
    });
  }
}

// ==================== AUTO-INITIALIZATION ====================
// Démarrage automatique de l'app
(function initApp() {
  console.log('🚀 Initialisation de KARL...');
  
  // Charger le token et l'utilisateur depuis le storage
  const savedToken = storage.get('token');
  const savedUser = storage.get('user');
  
  if (savedToken && savedUser) {
    // Token trouvé → Connexion automatique
    console.log('✅ Token trouvé, connexion automatique...');
    state.token = savedToken;
    state.user = savedUser;
    api.setToken(savedToken);
    
    // Initialiser la base de données (créer les tables si nécessaire)
    fetch('/api/init-db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${savedToken}`
      }
    }).then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log('✅ Base de données initialisée:', data.tables);
        }
      })
      .catch(err => console.warn('⚠️ Erreur init DB (peut-être déjà créée):', err));
    
    // Initialiser le chatbot
    initChatbot();
    
    // Charger et générer les notifications
    generateNotifications().then(() => loadNotifications());
    
    // Aller directement au Dashboard
    navigate('dashboard');
  } else {
    // Pas de token → Page de login
    console.log('❌ Pas de token, affichage du login');
    renderLogin();
  }
  
  // ==================== EXPOSITION GLOBALE DES FONCTIONS ====================
  // Exposer les fonctions nécessaires pour les onclick HTML
  window.navigate = navigate;
  window.createLeadFromEmail = createLeadFromEmail;
  window.convertLeadToClient = convertLeadToClient;
  window.closeLeadConfirmModal = closeLeadConfirmModal;
  window.closeConvertSuccessModal = closeConvertSuccessModal;
  window.goToLeads = goToLeads;
  window.goToPipeline = goToPipeline;
  window.filterEmailsByCategory = filterEmailsByCategory;
  window.toggleEmailDetails = toggleEmailDetails;
  window.replyToEmail = replyToEmail;
  window.closeReplyModal = closeReplyModal;
  window.generateAIResponse = generateAIResponse;
  window.showThreadModal = viewThreadConversation;
  window.closeThreadModal = closeThreadModal;
  window.replyToThreadFromModal = replyToThreadFromModal;
  window.changeEmailCategory = changeEmailCategory;
  window.closeCategoryModal = closeCategoryModal;
  window.selectCategory = selectCategory;
  
  // Fonctions d'authentification
  window.showForgotPassword = showForgotPassword;
  window.switchLoginTab = switchLoginTab;
  
  // Fonctions de gestion des lignes de devis
  window.openEditLineModal = openEditLineModal;
  window.closeEditLineModal = closeEditLineModal;
  window.saveEditedLine = saveEditedLine;
  window.removeLine = removeLine;
  window.duplicateLine = duplicateLine;
  window.moveLineUp = moveLineUp;
  window.moveLineDown = moveLineDown;
  window.updateLine = updateLine;
  window.calculateTotals = calculateTotals;
  window.toggleLineMenu = toggleLineMenu;
  
  console.log('✅ Fonctions globales exposées');
})();
