import env from '#start/env'

export default {
  frontend: {
    url: env.get('FRONTEND_URL', 'http://localhost:5173'),
  },
  oauth: {
    google: {
      clientId: env.get('GOOGLE_CLIENT_ID'),
      clientSecret: env.get('GOOGLE_CLIENT_SECRET'),
      redirectUri: env.get('GOOGLE_REDIRECT_URI'),
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/gmail.readonly',
      ],
    },
  },
  openai: {
    apiKey: env.get('OPENAI_API_KEY'),
    assistantId: env.get('OPENAI_ASSISTANT_ID'),
    timeout: 30000, // 30 seconds
  },
}
