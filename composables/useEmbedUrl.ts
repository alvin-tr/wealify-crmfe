const METABASE_SITE_URL = 'https://db.wealify.app'
const METABASE_SECRET_KEY = '6df2136f15372a840b942a06c65e0e4f6bca8b9355301946e46dcc222e397f7d'

export interface GenerateEmbedUrlOptions {
  dashboard?: number
  customerId?: number | string
  customerIds?: (string | number)[]
}

// Simple base64url encoding helper
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Simple HMAC-SHA256 implementation using Web Crypto API
async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const messageData = encoder.encode(message)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const hashArray = Array.from(new Uint8Array(signature))
  
  // Convert bytes to base64url directly
  const bytes = new Uint8Array(hashArray)
  return base64UrlEncode(String.fromCharCode(...bytes))
}

// Create JWT token using browser-compatible APIs
async function createJWT(payload: Record<string, any>, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`
  const signature = await hmacSha256(secret, signatureInput)
  
  return `${signatureInput}.${signature}`
}

export const useEmbedUrl = () => {
  const generateCustomerAnalyticsUrl = async (options: GenerateEmbedUrlOptions = {}): Promise<string | null> => {
    try {
      const {
        dashboard = 75,
        customerId,
        customerIds,
      } = options

      // Xác định customer ID(s) để sử dụng
      let ids: (string | number)[] = []
      
      if (customerId !== undefined) {
        const numeric = Number(customerId)
        if (Number.isFinite(numeric)) {
          ids = [numeric]
        } else if (typeof customerId === 'string' && customerId.trim()) {
          ids = [customerId.trim()]
        }
      }

      if (!ids.length && customerIds !== undefined && customerIds.length > 0) {
        ids = customerIds.map((id) => {
          const numeric = Number(id)
          return Number.isFinite(numeric) ? numeric : String(id).trim()
        }).filter((id) => id !== '' && id !== null && id !== undefined)
      }

      // Default customer ID nếu không có
      if (!ids.length) {
        ids = [76]
      }

      // Tạo JWT token cho Metabase embed
      const payload = {
        resource: { dashboard },
        params: { customer_id: ids[0] },
        exp: Math.round(Date.now() / 1000) + 10 * 60, // 10 minutes expiry
      }

      const token = await createJWT(payload, METABASE_SECRET_KEY)
      const iframeUrl = `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=true`

      console.log('[generateCustomerAnalyticsUrl] Generated URL for customer:', ids[0], 'dashboard:', dashboard)
      
      return iframeUrl
    } catch (error) {
      console.error('[generateCustomerAnalyticsUrl] Error generating embed URL:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[generateCustomerAnalyticsUrl] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      return null
    }
  }

  const generateGroupAnalyticsUrl = async (memberIds: (string | number)[]): Promise<string | null> => {
    try {
      if (!memberIds || memberIds.length === 0) {
        console.warn('[generateGroupAnalyticsUrl] No member IDs provided')
        return null
      }

      // Convert IDs to comma-separated string
      const idsString = memberIds
        .map((id) => {
          const numeric = Number(id)
          return Number.isFinite(numeric) ? numeric : String(id).trim()
        })
        .filter((id) => id !== '' && id !== null && id !== undefined)
        .join(',')

      if (!idsString) {
        console.warn('[generateGroupAnalyticsUrl] No valid member IDs')
        return null
      }

      // Tạo JWT token cho Metabase embed với format params: { ids: "74,46" }
      const payload = {
        resource: { dashboard: 83 },
        params: { ids: idsString },
        exp: Math.round(Date.now() / 1000) + 10 * 60, // 10 minutes expiry
      }

      const token = await createJWT(payload, METABASE_SECRET_KEY)
      const iframeUrl = `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=true`

      console.log('[generateGroupAnalyticsUrl] Generated URL for group with member IDs:', idsString)
      
      return iframeUrl
    } catch (error) {
      console.error('[generateGroupAnalyticsUrl] Error generating embed URL:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[generateGroupAnalyticsUrl] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      return null
    }
  }

  const generateSalesAnalyticsUrl = async (saleUserId: string | number): Promise<string | null> => {
    try {
      if (saleUserId === null || saleUserId === undefined) {
        console.warn('[generateSalesAnalyticsUrl] No sale user ID provided')
        return null
      }

      // Convert sale user ID to string
      const numeric = Number(saleUserId)
      const saleIdString = Number.isFinite(numeric) ? String(numeric) : String(saleUserId).trim()

      if (!saleIdString) {
        console.warn('[generateSalesAnalyticsUrl] No valid sale user ID')
        return null
      }

      // Tạo JWT token cho Metabase embed với format params: { sale_id: "123" }
      const payload = {
        resource: { dashboard: 72 },
        params: { sale_id: saleIdString },
        exp: Math.round(Date.now() / 1000) + 10 * 60, // 10 minutes expiry
      }

      const token = await createJWT(payload, METABASE_SECRET_KEY)
      const iframeUrl = `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=true`

      console.log('[generateSalesAnalyticsUrl] Generated URL for sales with sale user ID:', saleIdString)
      
      return iframeUrl
    } catch (error) {
      console.error('[generateSalesAnalyticsUrl] Error generating embed URL:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[generateSalesAnalyticsUrl] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      return null
    }
  }
  const generateAdminOverviewUrl = async (dashboardId: number = 72): Promise<string | null> => {
    try {
      // Admin overview: embed dashboard without restrictive param filters
      // This shows ALL data (no sale_id, customer_id, etc. filter)
      const payload = {
        resource: { dashboard: dashboardId },
        params: {},  // No params = shows all data
        exp: Math.round(Date.now() / 1000) + 60 * 60, // 1 hour expiry for admin
      }

      const token = await createJWT(payload, METABASE_SECRET_KEY)
      const iframeUrl = `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=true`

      console.log('[generateAdminOverviewUrl] Generated admin overview URL for dashboard:', dashboardId)
      
      return iframeUrl
    } catch (error) {
      console.error('[generateAdminOverviewUrl] Error generating embed URL:', error)
      return null
    }
  }
  
  return {
    generateCustomerAnalyticsUrl,
    generateGroupAnalyticsUrl,
    generateSalesAnalyticsUrl,
    generateAdminOverviewUrl,
  }
}

