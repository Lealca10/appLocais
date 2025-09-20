// Authentication management
class AuthManager {
  constructor() {
    this.currentUser = null
    this.init()
  }

  async init() {
    // Check for existing session
    const user = await window.SupabaseService.getCurrentUser()
    if (user) {
      this.currentUser = user
      await this.loadUserProfile()
      this.showApp()
    } else {
      this.showLogin()
    }

    // Listen for auth state changes
    window.supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        this.currentUser = session.user
        this.loadUserProfile()
        this.showApp()
      } else if (event === "SIGNED_OUT") {
        this.currentUser = null
        this.showLogin()
      }
    })

    this.setupEventListeners()
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tab = e.target.dataset.tab
        this.switchTab(tab)
      })
    })

    // Login form
    document.getElementById("login-form").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleLogin()
    })

    // Register form
    document.getElementById("register-form").addEventListener("submit", (e) => {
      e.preventDefault()
      this.handleRegister()
    })

    // User menu
    document.getElementById("user-btn").addEventListener("click", () => {
      this.toggleUserMenu()
    })

    // Logout
    document.getElementById("logout-btn").addEventListener("click", () => {
      this.handleLogout()
    })

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".user-menu")) {
        document.getElementById("user-dropdown").classList.remove("active")
      }
    })
  }

  switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active")
    })
    document.querySelector(`[data-tab="${tab}"]`).classList.add("active")

    // Update forms
    document.querySelectorAll(".auth-form").forEach((form) => {
      form.classList.remove("active")
    })
    document.getElementById(`${tab}-form`).classList.add("active")
  }

  async handleLogin() {
    const email = document.getElementById("login-email").value
    const password = document.getElementById("login-password").value

    this.showLoading(true)

    try {
      const { data, error } = await window.SupabaseService.signIn(email, password)

      if (error) {
        if (error.message.includes("email_not_confirmed") || error.message.includes("Email not confirmed")) {
          this.showToast(
            "Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.",
            "error",
          )
        } else {
          this.showToast("Erro ao fazer login: " + error.message, "error")
        }
      } else {
        this.showToast("Login realizado com sucesso!", "success")
      }
    } catch (error) {
      this.showToast("Erro inesperado: " + error.message, "error")
    } finally {
      this.showLoading(false)
    }
  }

  async handleRegister() {
    const name = document.getElementById("register-name").value
    const email = document.getElementById("register-email").value
    const password = document.getElementById("register-password").value
    const confirmPassword = document.getElementById("register-confirm").value

    if (password !== confirmPassword) {
      this.showToast("As senhas não coincidem", "error")
      return
    }

    if (password.length < 6) {
      this.showToast("A senha deve ter pelo menos 6 caracteres", "error")
      return
    }

    this.showLoading(true)

    try {
      const { data, error } = await window.SupabaseService.signUp(email, password, name)

      if (error) {
        this.showToast("Erro ao criar conta: " + error.message, "error")
      } else {
        if (data.user && !data.user.email_confirmed_at) {
          this.showToast("Conta criada! Verifique seu email para confirmar antes de fazer login.", "success")
        } else {
          this.showToast("Conta criada com sucesso!", "success")
        }
        this.switchTab("login")
      }
    } catch (error) {
      this.showToast("Erro inesperado: " + error.message, "error")
    } finally {
      this.showLoading(false)
    }
  }

  async handleLogout() {
    this.showLoading(true)

    try {
      const { error } = await window.SupabaseService.signOut()
      if (error) {
        this.showToast("Erro ao sair: " + error.message, "error")
      }
    } catch (error) {
      this.showToast("Erro inesperado: " + error.message, "error")
    } finally {
      this.showLoading(false)
    }
  }

  async loadUserProfile() {
    if (!this.currentUser) return

    try {
      const { data, error } = await window.SupabaseService.getProfile(this.currentUser.id)
      if (data) {
        document.getElementById("user-name").textContent = data.full_name || this.currentUser.email
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  toggleUserMenu() {
    document.getElementById("user-dropdown").classList.toggle("active")
  }

  showLogin() {
    const loginScreen = document.getElementById("login-screen")
    const appScreen = document.getElementById("app-screen")

    loginScreen.classList.add("active")
    appScreen.classList.remove("active")
  }

  showApp() {
    console.log("[v0] showApp() called")
    const loginScreen = document.getElementById("login-screen")
    const appScreen = document.getElementById("app-screen")

    console.log("[v0] Login screen before:", loginScreen.className)
    console.log("[v0] App screen before:", appScreen.className)

    loginScreen.classList.remove("active")
    appScreen.classList.add("active")

    console.log("[v0] Login screen after:", loginScreen.className)
    console.log("[v0] App screen after:", appScreen.className)

    setTimeout(() => {
      console.log("[v0] Timeout executed, checking window.App:", window.App)

      if (!window.app) {
        console.log("[v0] Creating new App instance")
        window.app = new window.App()
      } else {
        console.log("[v0] App instance already exists")
      }

      console.log("[v0] App isInitialized:", window.app.isInitialized)

      if (!window.app.isInitialized) {
        console.log("[v0] Initializing app")
        window.app.init()
      } else {
        console.log("[v0] App already initialized, loading home page")
        window.app.loadPage("home")
      }
    }, 100)
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

// Initialize auth manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.authManager = new AuthManager()
})
