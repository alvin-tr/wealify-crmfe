export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()

  try {
    await auth.ensureInitialized()
  } catch (error) {
    console.error('[auth middleware] ensureInitialized failed', error)
  }

  if (auth.isAuthenticated.value) {
    if (to.path === '/login') {
      return navigateTo('/')
    }
    return
  }

  if (to.path !== '/login') {
    return navigateTo('/login', { replace: true })
  }
})
