// Main application controller
class App {
  constructor() {
    this.currentPage = "home"
    this.pages = {}
    this.isInitialized = false
    this.supabaseService = window.SupabaseService
    this.supabase = window.supabase
  }

  async init() {
    if (this.isInitialized) return

    const mainContent = document.getElementById("main-content")
    if (!mainContent) {
      console.error("Main content element not found")
      return
    }

    this.setupNavigation()
    this.initializePages()
    await this.loadPage("home")
    this.isInitialized = true
  }

  setupNavigation() {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const page = e.currentTarget.dataset.page
        this.loadPage(page)
      })
    })
  }

  initializePages() {
    this.pages = {
      home: new HomePage(this.supabaseService),
      locations: new LocationsPage(this.supabaseService),
      ranking: new RankingPage(this.supabaseService),
      profile: new ProfilePage(this.supabaseService),
    }
  }

  async loadPage(pageName) {
    console.log("[v0] loadPage called with:", pageName)

    // if (this.currentPage === pageName) {
    //   console.log("[v0] Page already loaded:", pageName)
    //   return
    // }

    this.showLoading(true)

    // Update navigation
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    const activeBtn = document.querySelector(`[data-page="${pageName}"]`)
    if (activeBtn) {
      activeBtn.classList.add("active")
    }

    // Load page content
    const page = this.pages[pageName]
    console.log("[v0] Page object:", page)

    if (page) {
      try {
        console.log("[v0] Rendering page:", pageName)
        const content = await page.render()
        console.log("[v0] Page content length:", content.length)

        const mainContent = document.getElementById("main-content")
        console.log("[v0] Main content element:", mainContent)

        if (mainContent) {
          mainContent.innerHTML = content
          console.log("[v0] Content set in main-content")

          // Initialize page-specific functionality
          if (page.init) {
            console.log("[v0] Initializing page:", pageName)
            page.init()
          }
        } else {
          console.error("[v0] Main content element not found!")
        }
      } catch (error) {
        console.error("[v0] Error loading page:", error)
        this.showToast("Erro ao carregar a página", "error")
      }
    } else {
      console.error("[v0] Page not found:", pageName)
    }

    this.currentPage = pageName
    this.showLoading(false)
    console.log("[v0] loadPage completed for:", pageName)
  }

  showLoading(show) {
    const loading = document.getElementById("loading")
    if (show) {
      loading.classList.add("active")
    } else {
      loading.classList.remove("active")
    }
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container")
    const toast = document.createElement("div")
    toast.className = `toast ${type}`
    toast.textContent = message

    container.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 5000)
  }
}

// Base Page class
class BasePage {
  constructor(supabaseService) {
    this.isLoaded = false
    this.supabaseService = supabaseService
    this.supabase = window.supabase
  }

  async render() {
    return "<div>Page content</div>"
  }

  init() {
    // Override in subclasses
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  formatRating(rating) {
    const stars = "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating))
    return `${stars} (${rating.toFixed(1)})`
  }
}

// Home Page
class HomePage extends BasePage {
  async render() {
    try {
      const { data: locations, error } = await this.supabaseService.getLocations()

      if (error) {
        return `
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">Erro</h2>
                            <p class="card-description">Não foi possível carregar os dados.</p>
                        </div>
                    </div>
                `
      }

      const featuredLocations = locations?.slice(0, 3) || []

      return `
                <div class="home-page">
                    <div class="welcome-section">
                        <h2>Bem-vindo ao LocalRate</h2>
                        <p>Descubra e avalie os melhores locais da sua cidade</p>
                    </div>

                    <div class="featured-section">
                        <h3>Locais em Destaque</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${featuredLocations.map((location) => this.renderLocationCard(location)).join("")}
                        </div>
                    </div>

                    <div class="stats-section">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="stat-card">
                                <div class="stat-number">${locations?.length || 0}</div>
                                <div class="stat-label">Locais Cadastrados</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number">${this.getTotalRatings(locations)}</div>
                                <div class="stat-label">Avaliações</div>
                            </div>
                        </div>
                    </div>
                </div>
            `
    } catch (error) {
      console.error("Error rendering home page:", error)
      return '<div class="card"><p>Erro ao carregar a página inicial.</p></div>'
    }
  }

  renderLocationCard(location) {
    const avgRating = this.calculateAverageRating(location.ratings)
    const ratingCount = location.ratings?.length || 0

    return `
            <div class="location-card" data-location-id="${location.id}">
                <div class="location-image">
                    <img src="${location.image_url || "https://via.placeholder.com/150x250?text=Sem+Imagem"}" 
                         alt="${location.name}" />
                </div>
                <div class="location-info">
                    <h4>${location.name}</h4>
                    <p class="location-description">${location.description || ""}</p>
                    <div class="location-rating">
                        ${this.formatRating(avgRating)} (${ratingCount} avaliações)
                    </div>
                    <p class="location-address">${location.address || ""}</p>
                </div>
            </div>
        `
  }

  calculateAverageRating(ratings) {
    if (!ratings || ratings.length === 0) return 0
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0)
    return sum / ratings.length
  }

  getTotalRatings(locations) {
    if (!locations) return 0
    return locations.reduce((total, location) => {
      return total + (location.ratings?.length || 0)
    }, 0)
  }

  init() {
    // Add click handlers for location cards
    document.querySelectorAll(".location-card").forEach((card) => {
      card.addEventListener("click", () => {
        const locationId = card.dataset.locationId
        this.showLocationDetails(locationId)
      })
    })
  }

  showLocationDetails(locationId) {
    // Switch to locations page and show details
    window.app.loadPage("locations")
    // TODO: Show specific location details
  }
}

// Locations Page
class LocationsPage extends BasePage {
  constructor(supabaseService) {
    super(supabaseService)
    this.locations = []
    this.filteredLocations = []
  }

  async render() {
    try {
      const { data: locations, error } = await this.supabaseService.getLocations()

      if (error) {
        return `
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">Erro</h2>
                            <p class="card-description">Não foi possível carregar os locais.</p>
                        </div>
                    </div>
                `
      }

      this.locations = locations || []
      this.filteredLocations = this.locations

      return `
                <div class="locations-page">
                    <div class="page-header">
                        <h2>Locais</h2>
                    </div>
                    
                    <div class="locations-controls" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem;">
                        <button id="add-location-btn" class="btn-primary" style="flex-shrink: 0;">
                            <i class="fas fa-plus"></i> Adicionar<br>Local
                        </button>
                        
                        <div class="search-bar" style="flex: 1;">
                            <input type="text" id="location-search" placeholder="Buscar locais..." />
                            <i class="fas fa-search"></i>
                        </div>
                    </div>

                    <div class="locations-grid">
                        ${this.renderLocationsList()}
                    </div>
                </div>

                <!-- Add Location Modal -->
                <div id="add-location-modal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Adicionar Novo Local</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <form id="add-location-form">
                            <div class="form-group">
                                <label for="location-name">Nome do Local</label>
                                <input type="text" id="location-name" required />
                            </div>
                            <div class="form-group">
                                <label for="location-description">Descrição</label>
                                <textarea id="location-description" rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="location-address">Endereço</label>
                                <input type="text" id="location-address" />
                            </div>
                            <div class="form-group">
                                <label for="location-image">URL da Imagem</label>
                                <input type="url" id="location-image" />
                            </div>
                            <div class="modal-actions">
                                <button type="button" class="btn-secondary" id="cancel-location">Cancelar</button>
                                <button type="submit" class="btn-primary">Adicionar</button>
                            </div>
                        </form>
                    </div>
                </div>
            `
    } catch (error) {
      console.error("Error rendering locations page:", error)
      return '<div class="card"><p>Erro ao carregar os locais.</p></div>'
    }
  }

  renderLocationsList() {
    if (this.filteredLocations.length === 0) {
      return `
                <div class="empty-state">
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>Nenhum local encontrado</h3>
                    <p>Seja o primeiro a adicionar um local!</p>
                </div>
            `
    }

    return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${this.filteredLocations.map((location) => this.renderLocationCard(location)).join("")}
            </div>
        `
  }

  renderLocationCard(location) {
    const avgRating = this.calculateAverageRating(location.ratings)
    const ratingCount = location.ratings?.length || 0

    return `
            <div class="location-card" data-location-id="${location.id}">
                <div class="location-image">
                    <img src="${location.image_url || "https://via.placeholder.com/200x300?text=Sem+Imagem"}" 
                         alt="${location.name}" />
                </div>
                <div class="location-info">
                    <h4>${location.name}</h4>
                    <p class="location-description">${location.description || ""}</p>
                    <div class="location-rating">
                        ${this.formatRating(avgRating)} (${ratingCount} avaliações)
                    </div>
                    <p class="location-address">${location.address || ""}</p>
                    <div class="location-actions">
                        <button class="btn-primary rate-btn" data-location-id="${location.id}">
                            Avaliar
                        </button>
                    </div>
                </div>
            </div>
        `
  }

  calculateAverageRating(ratings) {
    if (!ratings || ratings.length === 0) return 0
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0)
    return sum / ratings.length
  }

  init() {
    // Search functionality
    const searchInput = document.getElementById("location-search")
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.filterLocations(e.target.value)
      })
    }

    // Add location modal
    const addBtn = document.getElementById("add-location-btn")
    const modal = document.getElementById("add-location-modal")
    const closeBtn = modal?.querySelector(".modal-close")
    const cancelBtn = document.getElementById("cancel-location")

    if (addBtn && modal) {
      addBtn.addEventListener("click", () => {
        modal.classList.add("active")
      })
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("active")
      })
    }

    if (cancelBtn && modal) {
      cancelBtn.addEventListener("click", () => {
        modal.classList.remove("active")
      })
    }

    // Add location form
    const form = document.getElementById("add-location-form")
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleAddLocation()
      })
    }

    // Rate buttons
    document.querySelectorAll(".rate-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const locationId = btn.dataset.locationId
        this.showRatingModal(locationId)
      })
    })
  }

  filterLocations(searchTerm) {
    const term = searchTerm.toLowerCase()
    this.filteredLocations = this.locations.filter(
      (location) =>
        location.name.toLowerCase().includes(term) ||
        (location.description && location.description.toLowerCase().includes(term)) ||
        (location.address && location.address.toLowerCase().includes(term)),
    )

    // Re-render locations list
    const container = document.querySelector(".locations-grid")
    if (container) {
      container.innerHTML = this.renderLocationsList()
      this.initLocationCards()
    }
  }

  initLocationCards() {
    document.querySelectorAll(".rate-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const locationId = btn.dataset.locationId
        this.showRatingModal(locationId)
      })
    })
  }

  async handleAddLocation() {
    const name = document.getElementById("location-name").value
    const description = document.getElementById("location-description").value
    const address = document.getElementById("location-address").value
    const imageUrl = document.getElementById("location-image").value

    window.app.showLoading(true)

    try {
      const { data, error } = await this.supabaseService.createLocation({
        name,
        description,
        address,
        image_url: imageUrl,
      })

      if (error) {
        window.app.showToast("Erro ao adicionar local: " + error.message, "error")
      } else {
        window.app.showToast("Local adicionado com sucesso!", "success")
        document.getElementById("add-location-modal").classList.remove("active")
        // Reload page
        window.app.loadPage("locations")
      }
    } catch (error) {
      window.app.showToast("Erro inesperado: " + error.message, "error")
    } finally {
      window.app.showLoading(false)
    }
  }

  showRatingModal(locationId) {
    // TODO: Implement rating modal
    window.app.showToast("Funcionalidade de avaliação em desenvolvimento", "info")
  }
}

// Ranking Page
class RankingPage extends BasePage {
  async render() {
    try {
      const { data: locations, error } = await this.supabaseService.getLocations()

      if (error) {
        return `
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">Erro</h2>
                            <p class="card-description">Não foi possível carregar o ranking.</p>
                        </div>
                    </div>
                `
      }

      // Calculate rankings
      const rankedLocations = this.calculateRankings(locations || [])

      return `
                <div class="ranking-page">
                    <div class="page-header">
                        <h2>Ranking dos Locais</h2>
                        <p>Os locais mais bem avaliados pelos usuários</p>
                    </div>

                    <div class="ranking-list">
                        ${rankedLocations.map((location, index) => this.renderRankingItem(location, index + 1)).join("")}
                    </div>
                </div>
            `
    } catch (error) {
      console.error("Error rendering ranking page:", error)
      return '<div class="card"><p>Erro ao carregar o ranking.</p></div>'
    }
  }

  calculateRankings(locations) {
    return locations
      .map((location) => ({
        ...location,
        avgRating: this.calculateAverageRating(location.ratings),
        ratingCount: location.ratings?.length || 0,
      }))
      .filter((location) => location.ratingCount > 0)
      .sort((a, b) => {
        // Sort by average rating, then by number of ratings
        if (b.avgRating !== a.avgRating) {
          return b.avgRating - a.avgRating
        }
        return b.ratingCount - a.ratingCount
      })
  }

  calculateAverageRating(ratings) {
    if (!ratings || ratings.length === 0) return 0
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0)
    return sum / ratings.length
  }

  renderRankingItem(location, position) {
    const medal = this.getMedal(position)

    return `
            <div class="ranking-item">
                <div class="ranking-position">
                    <span class="position-number">${position}</span>
                    ${medal}
                </div>
                <div class="ranking-image">
                    <img src="${location.image_url || "https://via.placeholder.com/80x80?text=Sem+Imagem"}" 
                         alt="${location.name}" />
                </div>
                <div class="ranking-info">
                    <h4>${location.name}</h4>
                    <div class="ranking-rating">
                        ${this.formatRating(location.avgRating)}
                    </div>
                    <p class="ranking-count">${location.ratingCount} avaliações</p>
                </div>
                <div class="ranking-score">
                    <span class="score">${location.avgRating.toFixed(1)}</span>
                </div>
            </div>
        `
  }

  getMedal(position) {
    switch (position) {
      case 1:
        return '<i class="fas fa-medal medal-gold"></i>'
      case 2:
        return '<i class="fas fa-medal medal-silver"></i>'
      case 3:
        return '<i class="fas fa-medal medal-bronze"></i>'
      default:
        return ""
    }
  }
}

// Profile Page
class ProfilePage extends BasePage {
  constructor(supabaseService) {
    super(supabaseService)
    this.userProfile = null
  }

  async render() {
    try {
      const user = await this.supabaseService.getCurrentUser()
      if (!user) {
        return '<div class="card"><p>Usuário não encontrado.</p></div>'
      }

      const { data: profile, error } = await this.supabaseService.getProfile(user.id)
      this.userProfile = profile

      if (error) {
        return `
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">Erro</h2>
                            <p class="card-description">Não foi possível carregar o perfil.</p>
                        </div>
                    </div>
                `
      }

      return `
                <div class="profile-page">
                    <div class="page-header">
                        <h2>Meu Perfil</h2>
                    </div>

                    <div class="profile-card">
                        <div class="profile-avatar">
                            <img src="${profile?.avatar_url || "https://via.placeholder.com/100x100?text=Avatar"}" 
                                 alt="Avatar" />
                        </div>
                        <div class="profile-info">
                            <h3>${profile?.full_name || "Nome não informado"}</h3>
                            <p>${user.email}</p>
                            <p class="profile-date">Membro desde ${this.formatDate(profile?.created_at)}</p>
                        </div>
                    </div>

                    <div class="profile-form">
                        <h3>Editar Perfil</h3>
                        <form id="profile-form">
                            <div class="form-group">
                                <label for="profile-name">Nome Completo</label>
                                <input type="text" id="profile-name" 
                                       value="${profile?.full_name || ""}" />
                            </div>
                            <div class="form-group">
                                <label for="profile-avatar">URL do Avatar</label>
                                <input type="url" id="profile-avatar" 
                                       value="${profile?.avatar_url || ""}" />
                            </div>
                            <button type="submit" class="btn-primary">Salvar Alterações</button>
                        </form>
                    </div>

                    <div class="profile-stats">
                        <h3>Minhas Estatísticas</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-number" id="user-ratings-count">0</div>
                                <div class="stat-label">Avaliações Feitas</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number" id="user-locations-count">0</div>
                                <div class="stat-label">Locais Adicionados</div>
                            </div>
                        </div>
                    </div>
                </div>
            `
    } catch (error) {
      console.error("Error rendering profile page:", error)
      return '<div class="card"><p>Erro ao carregar o perfil.</p></div>'
    }
  }

  init() {
    // Profile form
    const form = document.getElementById("profile-form")
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleUpdateProfile()
      })
    }

    // Load user stats
    this.loadUserStats()
  }

  async handleUpdateProfile() {
    const name = document.getElementById("profile-name").value
    const avatarUrl = document.getElementById("profile-avatar").value

    window.app.showLoading(true)

    try {
      const user = await this.supabaseService.getCurrentUser()
      const { data, error } = await this.supabaseService.updateProfile(user.id, {
        full_name: name,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        window.app.showToast("Erro ao atualizar perfil: " + error.message, "error")
      } else {
        window.app.showToast("Perfil atualizado com sucesso!", "success")
        // Update user name in header
        document.getElementById("user-name").textContent = name || user.email
      }
    } catch (error) {
      window.app.showToast("Erro inesperado: " + error.message, "error")
    } finally {
      window.app.showLoading(false)
    }
  }

  async loadUserStats() {
    try {
      const user = await this.supabaseService.getCurrentUser()

      // Get user's ratings count
      const { data: ratings } = await this.supabase.from("ratings").select("id").eq("user_id", user.id)

      // Get user's locations count
      const { data: locations } = await this.supabase.from("locations").select("id").eq("created_by", user.id)

      document.getElementById("user-ratings-count").textContent = ratings?.length || 0
      document.getElementById("user-locations-count").textContent = locations?.length || 0
    } catch (error) {
      console.error("Error loading user stats:", error)
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App()
})
