export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.ensureInitialized()

  const hasToken = !!auth.token.value

  if (!hasToken && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (hasToken && to.path === '/login') {
    return navigateTo('/')
  }
})


