import env from '#start/env'
import { google } from 'googleapis'
import { inject } from '@adonisjs/core'

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
      'https://www.googleapis.com/auth/gmail.readonly',
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
   */
  getClient(accessToken: string, refreshToken: string | null) {
    const client = new google.auth.OAuth2(
      env.get('GOOGLE_CLIENT_ID'),
      env.get('GOOGLE_CLIENT_SECRET'),
      env.get('GOOGLE_REDIRECT_URI')
    )

    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    return client
  }
}