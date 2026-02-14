// ==================== DOSSIER CLIENT ====================

// Variable globale pour stocker les documents
window.currentClientDocuments = {
  devis: [],
  photos: [],
  notes: []
};

// Fonction principale : Ouvrir le dossier client
async function openClientDossier(clientId) {
  console.log('📁 Ouverture dossier client', clientId);
  
  try {
    // Récupérer les infos du client
    const client = state.clients.find(c => c.id === clientId);
    if (!client) {
      alert('Client introuvable');
      return;
    }

    const firstName = client.first_name?.trim() || '';
    const lastName = client.last_name?.trim() || '';
    const fullName = (firstName || lastName) 
      ? `${client.civility ? client.civility + ' ' : ''}${firstName} ${lastName}`.trim()
      : `Client #${client.id}`;

    // Créer la modale du dossier
    const modalHTML = `
      <div class="modal-backdrop" id="dossier-modal" onclick="if(event.target.id === 'dossier-modal') closeDossierModal()">
        <div class="modal-content" style="max-width: 1200px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;">
          <!-- Header -->
          <div class="modal-header" style="flex-shrink: 0;">
            <h3><i class="fas fa-folder-open"></i> Dossier Client : ${fullName}</h3>
            <button class="modal-close" onclick="closeDossierModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <!-- Onglets -->
          <div style="flex-shrink: 0; border-bottom: 2px solid #374151; background: #1f2937;">
            <div class="flex gap-2 px-6">
              <button class="dossier-tab active" data-tab="infos" onclick="switchDossierTab('infos', ${clientId})">
                <i class="fas fa-info-circle"></i> Informations
              </button>
              <button class="dossier-tab" data-tab="devis" onclick="switchDossierTab('devis', ${clientId})">
                <i class="fas fa-file-invoice"></i> Devis
              </button>
              <button class="dossier-tab" data-tab="photos" onclick="switchDossierTab('photos', ${clientId})">
                <i class="fas fa-images"></i> Photos
              </button>
              <button class="dossier-tab" data-tab="notes" onclick="switchDossierTab('notes', ${clientId})">
                <i class="fas fa-sticky-note"></i> Notes
              </button>
            </div>
          </div>
          
          <!-- Contenu des onglets -->
          <div id="dossier-content" style="flex: 1; overflow-y: auto; padding: 1.5rem;">
            <!-- Le contenu sera chargé dynamiquement -->
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Ajouter les styles pour les onglets
    addDossierStyles();

    // Charger l'onglet Infos par défaut
    switchDossierTab('infos', clientId);

  } catch (error) {
    console.error('Erreur ouverture dossier:', error);
    alert('Erreur lors de l\'ouverture du dossier');
  }
}

// Ajouter les styles CSS pour les onglets
function addDossierStyles() {
  if (document.getElementById('dossier-styles')) return;

  const styles = document.createElement('style');
  styles.id = 'dossier-styles';
  styles.textContent = `
    .dossier-tab {
      padding: 0.75rem 1.5rem;
      background: transparent;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      transition: all 0.2s;
      border-bottom: 3px solid transparent;
      font-weight: 500;
    }
    .dossier-tab:hover {
      color: #fff;
      background: rgba(59, 130, 246, 0.1);
    }
    .dossier-tab.active {
      color: #60a5fa;
      border-bottom-color: #60a5fa;
    }
    .document-card {
      background: #1f2937;
      border: 1px solid #374151;
      border-radius: 0.5rem;
      padding: 1rem;
      transition: all 0.2s;
    }
    .document-card:hover {
      border-color: #60a5fa;
      transform: translateY(-2px);
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    .photo-card {
      position: relative;
      aspect-ratio: 1;
      border-radius: 0.5rem;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .photo-card:hover {
      transform: scale(1.05);
    }
    .photo-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .upload-zone {
      border: 2px dashed #374151;
      border-radius: 0.5rem;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .upload-zone:hover {
      border-color: #60a5fa;
      background: rgba(59, 130, 246, 0.05);
    }
    .upload-zone.drag-over {
      border-color: #60a5fa;
      background: rgba(59, 130, 246, 0.1);
    }
  `;
  document.head.appendChild(styles);
}

// Basculer entre les onglets
async function switchDossierTab(tab, clientId) {
  console.log('🔄 Switch to tab:', tab);

  // Mettre à jour les onglets actifs
  document.querySelectorAll('.dossier-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

  const content = document.getElementById('dossier-content');
  if (!content) return;

  // Récupérer les infos du client
  const client = state.clients.find(c => c.id === clientId);
  if (!client) return;

  switch(tab) {
    case 'infos':
      content.innerHTML = renderClientInfos(client);
      break;
    case 'devis':
      await loadAndRenderDocuments(clientId, 'devis');
      break;
    case 'photos':
      await loadAndRenderDocuments(clientId, 'photo');
      break;
    case 'notes':
      await loadAndRenderNotes(clientId);
      break;
  }
}

// Afficher les informations du client
function renderClientInfos(client) {
  const firstName = client.first_name?.trim() || '';
  const lastName = client.last_name?.trim() || '';
  const fullName = (firstName || lastName) 
    ? `${client.civility ? client.civility + ' ' : ''}${firstName} ${lastName}`.trim()
    : `Client #${client.id}`;

  return `
    <div class="space-y-6">
      <!-- Carte principale -->
      <div class="document-card">
        <h4 class="text-xl font-bold text-white mb-4">
          <i class="fas fa-user"></i> ${fullName}
        </h4>
        <div class="grid grid-cols-2 gap-4">
          ${client.company ? `
            <div>
              <label class="text-sm text-gray-400">Entreprise</label>
              <p class="text-white"><i class="fas fa-building mr-2"></i>${client.company}</p>
            </div>
          ` : ''}
          ${client.email ? `
            <div>
              <label class="text-sm text-gray-400">Email</label>
              <p class="text-white"><i class="fas fa-envelope mr-2"></i><a href="mailto:${client.email}" class="text-blue-400 hover:underline">${client.email}</a></p>
            </div>
          ` : ''}
          ${client.phone ? `
            <div>
              <label class="text-sm text-gray-400">Téléphone</label>
              <p class="text-white"><i class="fas fa-phone mr-2"></i><a href="tel:${client.phone}" class="text-blue-400 hover:underline">${client.phone}</a></p>
            </div>
          ` : ''}
          ${client.address || client.zipcode || client.city ? `
            <div class="col-span-2">
              <label class="text-sm text-gray-400">Adresse</label>
              <p class="text-white"><i class="fas fa-map-marker-alt mr-2"></i>${client.address || ''} ${client.zipcode || ''} ${client.city || ''}</p>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Activité récente -->
      <div class="document-card">
        <h4 class="text-lg font-bold text-white mb-4">
          <i class="fas fa-history"></i> Activité récente
        </h4>
        <div class="space-y-2 text-gray-300">
          <div class="flex items-center gap-2">
            <i class="fas fa-clock text-blue-500"></i>
            <span>Client créé ${formatRelativeTime(client.created_at)}</span>
          </div>
          ${client.status ? `
            <div class="flex items-center gap-2">
              <i class="fas fa-tag text-blue-500"></i>
              <span>Statut : <span class="badge badge-${client.status === 'lead' ? 'warning' : 'success'}">${client.status}</span></span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Notes -->
      ${client.notes ? `
        <div class="document-card">
          <h4 class="text-lg font-bold text-white mb-4">
            <i class="fas fa-sticky-note"></i> Notes
          </h4>
          <p class="text-gray-300 italic">${client.notes}</p>
        </div>
      ` : ''}
    </div>
  `;
}

// Charger et afficher les documents (devis/photos)
async function loadAndRenderDocuments(clientId, type) {
  const content = document.getElementById('dossier-content');
  if (!content) return;

  // Loader
  content.innerHTML = `
    <div class="text-center py-8">
      <i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
      <p class="text-gray-400 mt-4">Chargement...</p>
    </div>
  `;

  try {
    const token = state.token;
    const response = await fetch(`/api/documents/${clientId}?type=${type}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Erreur chargement documents');

    const data = await response.json();
    const documents = data.documents || [];

    // Stocker dans la variable globale
    if (type === 'devis') {
      window.currentClientDocuments.devis = documents;
    } else {
      window.currentClientDocuments.photos = documents;
    }

    // Afficher
    if (type === 'devis') {
      content.innerHTML = renderDevisList(clientId, documents);
    } else {
      content.innerHTML = renderPhotosGrid(clientId, documents);
    }

  } catch (error) {
    console.error('Erreur chargement documents:', error);
    content.innerHTML = `
      <div class="text-center py-8 text-red-400">
        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
        <p>Erreur lors du chargement</p>
      </div>
    `;
  }
}

// Afficher la liste des devis
function renderDevisList(clientId, documents) {
  return `
    <div class="space-y-4">
      <!-- Zone d'upload -->
      <div class="upload-zone" onclick="document.getElementById('upload-devis-${clientId}').click()">
        <i class="fas fa-cloud-upload-alt text-4xl text-blue-500 mb-2"></i>
        <p class="text-white font-semibold">Cliquez pour ajouter un devis (PDF)</p>
        <p class="text-gray-400 text-sm">Ou glissez-déposez un fichier ici</p>
        <input type="file" id="upload-devis-${clientId}" accept=".pdf" style="display: none" onchange="uploadDocument(${clientId}, 'devis', this.files[0])">
      </div>

      <!-- Liste des devis -->
      <div class="space-y-2">
        <h4 class="text-lg font-bold text-white mb-2">
          <i class="fas fa-file-invoice"></i> Devis (${documents.length})
        </h4>
        ${documents.length === 0 ? `
          <p class="text-gray-400 text-center py-4">Aucun devis pour le moment</p>
        ` : documents.map(doc => `
          <div class="document-card flex items-center justify-between">
            <div class="flex items-center gap-3 flex-1">
              <i class="fas fa-file-pdf text-red-500 text-2xl"></i>
              <div>
                <p class="text-white font-semibold">${doc.title || doc.file_name}</p>
                <p class="text-gray-400 text-sm">
                  ${formatFileSize(doc.file_size)} • ${formatRelativeTime(doc.created_at)}
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-primary" onclick="downloadDocument(${doc.id}, '${doc.file_name}')">
                <i class="fas fa-download"></i> Télécharger
              </button>
              <button class="btn btn-sm btn-danger" onclick="deleteDocument(${doc.id}, ${clientId}, 'devis')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Afficher la grille de photos
function renderPhotosGrid(clientId, documents) {
  return `
    <div class="space-y-4">
      <!-- Zone d'upload -->
      <div class="upload-zone" onclick="document.getElementById('upload-photo-${clientId}').click()">
        <i class="fas fa-image text-4xl text-blue-500 mb-2"></i>
        <p class="text-white font-semibold">Cliquez pour ajouter des photos</p>
        <p class="text-gray-400 text-sm">JPG, PNG • Maximum 10 MB</p>
        <input type="file" id="upload-photo-${clientId}" accept="image/*" multiple style="display: none" onchange="uploadMultiplePhotos(${clientId}, this.files)">
      </div>

      <!-- Grille de photos -->
      ${documents.length === 0 ? `
        <p class="text-gray-400 text-center py-8">Aucune photo pour le moment</p>
      ` : `
        <div class="photo-grid">
          ${documents.map(doc => `
            <div class="photo-card" onclick="viewPhotoLightbox(${doc.id})">
              <img src="/api/documents/file/${doc.id}" alt="${doc.title || doc.file_name}" loading="lazy">
              <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 0.5rem;">
                <p class="text-white text-sm font-semibold truncate">${doc.title || doc.file_name}</p>
                <button class="btn btn-sm btn-danger" style="position: absolute; top: 0.5rem; right: 0.5rem;" onclick="event.stopPropagation(); deleteDocument(${doc.id}, ${clientId}, 'photo')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

// Upload un document
async function uploadDocument(clientId, type, file) {
  if (!file) return;

  // Vérifier la taille (max 10 MB)
  if (file.size > 10 * 1024 * 1024) {
    alert('Fichier trop volumineux (maximum 10 MB)');
    return;
  }

  const formData = new FormData();
  formData.append('client_id', clientId);
  formData.append('type', type);
  formData.append('title', file.name);
  formData.append('file', file);

  try {
    const token = state.token;
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) throw new Error('Erreur upload');

    const data = await response.json();
    console.log('✅ Document uploadé:', data);

    // Recharger la liste
    await loadAndRenderDocuments(clientId, type);

    // Notification
    showNotification('success', 'Document ajouté avec succès !');

  } catch (error) {
    console.error('Erreur upload:', error);
    alert('Erreur lors de l\'upload');
  }
}

// Upload multiple photos
async function uploadMultiplePhotos(clientId, files) {
  if (!files || files.length === 0) return;

  for (let file of files) {
    await uploadDocument(clientId, 'photo', file);
  }
}

// Télécharger un document
async function downloadDocument(id, filename) {
  try {
    const token = state.token;
    const response = await fetch(`/api/documents/file/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Erreur téléchargement');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

  } catch (error) {
    console.error('Erreur téléchargement:', error);
    alert('Erreur lors du téléchargement');
  }
}

// Supprimer un document
async function deleteDocument(id, clientId, type) {
  if (!confirm('Supprimer ce document ?')) return;

  try {
    const token = state.token;
    const response = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Erreur suppression');

    // Recharger la liste
    await loadAndRenderDocuments(clientId, type);

    showNotification('success', 'Document supprimé');

  } catch (error) {
    console.error('Erreur suppression:', error);
    alert('Erreur lors de la suppression');
  }
}

// Voir photo en lightbox
function viewPhotoLightbox(id) {
  const lightbox = `
    <div class="modal-backdrop" id="photo-lightbox" onclick="if(event.target.id === 'photo-lightbox') closePhotoLightbox()" style="z-index: 10000;">
      <div style="max-width: 90vw; max-height: 90vh; position: relative;">
        <button onclick="closePhotoLightbox()" style="position: absolute; top: -3rem; right: 0; background: rgba(0,0,0,0.8); color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">
          <i class="fas fa-times"></i> Fermer
        </button>
        <img src="/api/documents/file/${id}" style="max-width: 100%; max-height: 90vh; border-radius: 0.5rem;" alt="Photo">
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', lightbox);
}

function closePhotoLightbox() {
  document.getElementById('photo-lightbox')?.remove();
}

// Charger et afficher les notes
async function loadAndRenderNotes(clientId) {
  const content = document.getElementById('dossier-content');
  if (!content) return;

  // Loader
  content.innerHTML = `
    <div class="text-center py-8">
      <i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i>
      <p class="text-gray-400 mt-4">Chargement...</p>
    </div>
  `;

  try {
    const token = state.token;
    const response = await fetch(`/api/documents/${clientId}?type=note`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Erreur chargement notes');

    const data = await response.json();
    const notes = data.documents || [];

    window.currentClientDocuments.notes = notes;

    content.innerHTML = renderNotesList(clientId, notes);

  } catch (error) {
    console.error('Erreur chargement notes:', error);
    content.innerHTML = `
      <div class="text-center py-8 text-red-400">
        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
        <p>Erreur lors du chargement</p>
      </div>
    `;
  }
}

// Afficher la liste des notes
function renderNotesList(clientId, notes) {
  return `
    <div class="space-y-4">
      <button class="btn btn-primary" onclick="openNoteEditor(${clientId})">
        <i class="fas fa-plus"></i> Nouvelle note
      </button>

      ${notes.length === 0 ? `
        <p class="text-gray-400 text-center py-8">Aucune note pour le moment</p>
      ` : `
        <div class="space-y-2">
          ${notes.map(note => `
            <div class="document-card">
              <div class="flex items-start justify-between mb-2">
                <h4 class="text-white font-semibold flex-1">${note.title}</h4>
                <div class="flex gap-2">
                  <button class="btn btn-sm btn-secondary" onclick="openNoteEditor(${clientId}, ${note.id})">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="deleteDocument(${note.id}, ${clientId}, 'note')">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <p class="text-gray-300 whitespace-pre-wrap">${(note.content || '').substring(0, 200)}${note.content?.length > 200 ? '...' : ''}</p>
              <p class="text-gray-500 text-xs mt-2">${formatRelativeTime(note.created_at)}</p>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

// Ouvrir l'éditeur de note
function openNoteEditor(clientId, noteId = null) {
  const note = noteId ? window.currentClientDocuments.notes.find(n => n.id === noteId) : null;

  const editorHTML = `
    <div class="modal-backdrop" id="note-editor-modal" onclick="if(event.target.id === 'note-editor-modal') closeNoteEditor()">
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h3><i class="fas fa-sticky-note"></i> ${note ? 'Modifier' : 'Nouvelle'} note</h3>
          <button class="modal-close" onclick="closeNoteEditor()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="input-group">
            <label class="input-label">Titre</label>
            <input type="text" id="note-title" class="input" value="${note?.title || ''}" placeholder="Titre de la note">
          </div>

          <div class="input-group">
            <label class="input-label">Contenu</label>
            <textarea id="note-content" class="input" rows="15" placeholder="Écrivez votre note ici...">${note?.content || ''}</textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeNoteEditor()">
            <i class="fas fa-times"></i> Annuler
          </button>
          <button class="btn btn-primary" onclick="saveNote(${clientId}, ${noteId})">
            <i class="fas fa-save"></i> Enregistrer
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', editorHTML);
}

function closeNoteEditor() {
  document.getElementById('note-editor-modal')?.remove();
}

// Sauvegarder une note
async function saveNote(clientId, noteId = null) {
  const title = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();

  if (!title || !content) {
    alert('Titre et contenu obligatoires');
    return;
  }

  try {
    const token = state.token;
    const response = await fetch('/api/documents/note', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        client_id: clientId,
        title,
        content,
        id: noteId
      })
    });

    if (!response.ok) throw new Error('Erreur sauvegarde note');

    closeNoteEditor();
    await loadAndRenderNotes(clientId);
    showNotification('success', 'Note enregistrée !');

  } catch (error) {
    console.error('Erreur sauvegarde note:', error);
    alert('Erreur lors de la sauvegarde');
  }
}

// Fermer la modale du dossier
function closeDossierModal() {
  document.getElementById('dossier-modal')?.remove();
}

// Helper: Format file size
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper: Show notification
function showNotification(type, message) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notif.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}
