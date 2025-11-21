import env from '#start/env'
import { google } from 'googleapis'
import { inject } from '@adonisjs/core'
import type { OAuth2Client } from 'google-auth-library'
import OAuthException from '#exceptions/oauth_exception'
import ExternalApiException from '#exceptions/external_api_exception'

@inject()
export default class GmailOAuthService {
  private oauth2Client

  constructor() {
    // Default client for Gmail connection
    this.oauth2Client = new google.auth.OAuth2(
      env.get('GOOGLE_CLIENT_ID'),
      env.get('GOOGLE_CLIENT_SECRET'),
      env.get('GOOGLE_REDIRECT_URI')
    )
  }

  /**
   * Get a client with a specific redirect URI
   */
  protected getClientWithRedirect(redirectUri: string) {
    return new google.auth.OAuth2(
      env.get('GOOGLE_CLIENT_ID'),
      env.get('GOOGLE_CLIENT_SECRET'),
      redirectUri
    )
  }

  /**
   * Generate the URL to redirect the user to for Google login
   */
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.modify', // Allow reading and modifying (trash) emails
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      include_granted_scopes: true,
    })
  }

  /**
   * Generate URL for SSO Login (only email/profile scopes)
   */
  getLoginUrl() {
    const client = this.getClientWithRedirect(env.get('GOOGLE_LOGIN_REDIRECT_URI'))

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ]

    return client.generateAuthUrl({
      access_type: 'online', // We don't need refresh token for simple login
      scope: scopes,
    })
  }

  /**
   * Exchange the authorization code for tokens
   */
  async getTokens(code: string, redirectUri?: string) {
    const client = redirectUri ? this.getClientWithRedirect(redirectUri) : this.oauth2Client
    const { tokens } = await client.getToken(code)
    return tokens
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(accessToken: string) {
    const client = new google.auth.OAuth2()
    client.setCredentials({ access_token: accessToken })

    const oauth2 = google.oauth2({ version: 'v2', auth: client })
    const { data } = await oauth2.userinfo.get()
    return data
  }

  /**
   * Get a valid OAuth2 client with credentials set
   * Automatically refreshes tokens if expired
   */
  getClient(accessToken: string, refreshToken?: string | null) {
    const client = new google.auth.OAuth2(
      env.get('GOOGLE_CLIENT_ID'),
      env.get('GOOGLE_CLIENT_SECRET'),
      env.get('GOOGLE_REDIRECT_URI')
    )

    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken ?? null,
    })

    // Set up automatic token refresh
    this.setupAutoRefresh(client)

    return client
  }

  /**
   * Setup automatic token refresh on the OAuth2 client
   */
  private setupAutoRefresh(client: OAuth2Client) {
    // This event is fired when the access token is refreshed
    client.on('tokens', (tokens) => {
      console.log('OAuth tokens refreshed:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      })
    })
  }

  /**
   * Manually refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) {
      throw OAuthException.invalidToken()
    }

    try {
      const client = new google.auth.OAuth2(
        env.get('GOOGLE_CLIENT_ID'),
        env.get('GOOGLE_CLIENT_SECRET'),
        env.get('GOOGLE_REDIRECT_URI')
      )

      client.setCredentials({
        refresh_token: refreshToken,
      })

      const { credentials } = await client.refreshAccessToken()

      if (!credentials.access_token) {
        throw OAuthException.tokenExchangeFailed('Failed to refresh access token')
      }

      return {
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date || null,
      }
    } catch (error) {
      // Handle invalid or revoked refresh token
      if (error.response?.status === 400 || error.response?.status === 401) {
        throw OAuthException.invalidToken()
      }

      throw ExternalApiException.gmailApiFailed(`Token refresh failed: ${error.message}`)
    }
  }

  /**
   * Check if access token is expired or about to expire (within 5 minutes)
   */
  isTokenExpired(expiryDate: Date | null): boolean {
    if (!expiryDate) {
      return false // No expiry date means we assume it's valid
    }

    const now = new Date()
    const expiryTime = new Date(expiryDate)
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    return expiryTime <= fiveMinutesFromNow
  }
}
