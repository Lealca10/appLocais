// Supabase configuration
const SUPABASE_URL = "https://kwfalsltkfhkslsapksq.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZmFsc2x0a2Zoa3Nsc2Fwa3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMzU2MTEsImV4cCI6MjA3MzgxMTYxMX0.WOvCOVBAap8A5BkB1R7UyqCx7c_wi8NnW2UV_P1ZM-0"

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Supabase service functions
const SupabaseService = {
  // Authentication
  async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: window.location.origin,
      },
    })
    return { data, error }
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  },

  // Profile management
  async getProfile(userId) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()
    return { data, error }
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId)
    return { data, error }
  },

  // Locations
  async getLocations() {
    const { data, error } = await supabase
      .from("locations")
      .select(`
                *,
                ratings (
                    rating,
                    comment,
                    profiles (full_name)
                )
            `)
      .order("created_at", { ascending: false })
    return { data, error }
  },

  async createLocation(location) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase.from("locations").insert({
      ...location,
      created_by: user.id,
    })
    return { data, error }
  },

  // Ratings
  async getRatings(locationId) {
    const { data, error } = await supabase
      .from("ratings")
      .select(`
                *,
                profiles (full_name)
            `)
      .eq("location_id", locationId)
      .order("created_at", { ascending: false })
    return { data, error }
  },

  async createRating(locationId, rating, comment) {
    const user = await this.getCurrentUser()
    const { data, error } = await supabase.from("ratings").insert({
      location_id: locationId,
      user_id: user.id,
      rating,
      comment,
    })
    return { data, error }
  },

  async updateRating(ratingId, rating, comment) {
    const { data, error } = await supabase.from("ratings").update({ rating, comment }).eq("id", ratingId)
    return { data, error }
  },

  // Get top rated locations
  async getTopRatedLocations(limit = 10) {
    const { data, error } = await supabase.rpc("get_top_rated_locations", { limit_count: limit })
    return { data, error }
  },
}

window.SupabaseService = SupabaseService
window.supabase = supabase
