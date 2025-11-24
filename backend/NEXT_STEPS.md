# Prochaines Étapes - Refactoring Backend

## ✅ Phases Complétées

1. **Phase 1.1** - Model Scopes ✅
2. **Phase 4.1** - Token Encryption 🔒 (CRITIQUE)
3. **Phase 2.1** - Architecture en Couches ✅

---

## 🔄 Migration Progressive

### Étape 1: Tester le nouveau code (MAINTENANT)

```bash
# 1. Vérifier que tout compile
cd backend
npm run build

# 2. Lancer un scan test
node ace scan:promos

# 3. Vérifier l'API
# Tester les endpoints /api/promos et /api/emails/trash
```

### Étape 2: Migration des tokens existants (OPTIONNEL)

Si vous avez déjà des utilisateurs avec des tokens non-chiffrés:

```typescript
// Créer une commande de migration
// commands/migrate_tokens.ts

import { BaseCommand } from '@adonisjs/core/ace'
import EmailAccount from '#models/email_account'
import encryption from '@adonisjs/core/services/encryption'

export default class MigrateTokens extends BaseCommand {
  static commandName = 'migrate:tokens'

  async run() {
    const accounts = await EmailAccount.all()

    for (const account of accounts) {
      // Force re-save to trigger encryption
      account.accessToken = account.accessToken
      if (account.refreshToken) {
        account.refreshToken = account.refreshToken
      }
      await account.save()
    }

    this.logger.success('Tokens migrated successfully')
  }
}
```

### Étape 3: Nettoyer l'ancien code (APRÈS TESTS)

Une fois que tout fonctionne correctement:

```bash
# Supprimer l'ancien service
rm app/services/gmail_scan_service.ts

# Renommer le nouveau
mv app/services/gmail_scan_service_v2.ts app/services/gmail_scan_service.ts

# Mettre à jour les imports dans scan_promos.ts
```

---

## 🎯 Phases Recommandées pour Plus Tard

### Phase 1.2: Centraliser la Configuration ⏳

**Objectif**: Éliminer les valeurs hardcodées

**Fichiers à créer:**

```typescript
// config/services.ts (déjà créé)
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
}
```

**Fichiers à modifier:**

- `app/controllers/auth_controller.ts` - Utiliser `config.frontend.url`
- `app/services/gmail_o_auth_service.ts` - Utiliser `config.oauth.google`
- `app/controllers/email_accounts_controller.ts` - Utiliser config

---

### Phase 1.3: Extraire UserService ⏳

**Objectif**: Sortir la logique utilisateur des controllers

**Fichier à créer:**

```typescript
// app/services/user_service.ts
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class UserService {
  /**
   * Create user from OAuth provider
   */
  async createFromOAuth(providerData: {
    providerId: string
    email: string
    provider: string
  }): Promise<User> {
    return User.firstOrCreate(
      { providerId: providerData.providerId },
      {
        email: providerData.email,
        password: '', // OAuth users don't have passwords
        provider: providerData.provider,
      }
    )
  }

  /**
   * Create user from credentials
   */
  async createFromCredentials(email: string, password: string): Promise<User> {
    return User.create({
      email,
      password: await hash.make(password),
    })
  }

  /**
   * Verify user credentials
   */
  async verifyCredentials(email: string, password: string): Promise<User | null> {
    const user = await User.findBy('email', email)
    if (!user) return null

    const isValid = await hash.verify(user.password, password)
    return isValid ? user : null
  }
}
```

**Fichier à modifier:**

- `app/controllers/auth_controller.ts` - Utiliser `UserService`

---

### Phase 1.4: Custom Exceptions ⏳

**Objectif**: Gestion d'erreurs structurée

**Fichiers à créer:**

```typescript
// app/exceptions/oauth_exception.ts
import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class OAuthException extends Exception {
  async handle(error: this, ctx: HttpContext) {
    ctx.response.status(error.status).send({
      error: 'OAuth Error',
      message: error.message,
    })
  }
}

// app/exceptions/email_scan_exception.ts
export default class EmailScanException extends Exception {
  // Similar structure
}

// app/exceptions/promo_extraction_exception.ts
export default class PromoExtractionException extends Exception {
  // Similar structure
}
```

**Utilisation:**

```typescript
// Dans les services
if (!assistantId) {
  throw new PromoExtractionException('Assistant ID is required', 500)
}
```

---

### Phase 4.2: Validators (Recommandé) 🎯

**Objectif**: Valider les inputs utilisateur

**Installation:**

```bash
npm install @vinejs/vine
node ace configure @vinejs/vine
```

**Fichiers à créer:**

```typescript
// app/validators/register_validator.ts
import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      }),
    password: vine.string().minLength(8),
  })
)

// app/validators/create_scan_validator.ts
export const createScanValidator = vine.compile(
  vine.object({
    emailAccountId: vine.number().positive(),
  })
)
```

**Utilisation dans controllers:**

```typescript
async register({ request, response }: HttpContext) {
  const data = await request.validateUsing(registerValidator)
  // data est typé et validé
}
```

---

### Phase 4.3: Authorization Policies 🎯

**Objectif**: Sécuriser l'accès aux ressources

**Fichiers à créer:**

```typescript
// app/policies/email_policy.ts
import User from '#models/user'
import Email from '#models/email'

export default class EmailPolicy {
  async view(user: User, email: Email): Promise<boolean> {
    await email.load('emailAccount')
    return email.emailAccount.userId === user.id
  }

  async delete(user: User, email: Email): Promise<boolean> {
    await email.load('emailAccount')
    return email.emailAccount.userId === user.id
  }
}

// app/policies/email_account_policy.ts
export default class EmailAccountPolicy {
  async disconnect(user: User, emailAccount: EmailAccount): Promise<boolean> {
    return emailAccount.userId === user.id
  }
}
```

**Configuration:**

```typescript
// start/kernel.ts
import router from '@adonisjs/core/services/router'

router.use([() => import('@adonisjs/bouncer/bouncer_middleware')])
```

**Utilisation:**

```typescript
// Dans controllers
import { bounce } from '@adonisjs/bouncer'

async show({ params, bouncer }: HttpContext) {
  const email = await Email.findOrFail(params.id)
  await bouncer.with('EmailPolicy').authorize('view', email)
  return email
}
```

---

### Phase 5.1: Tests Unitaires 🧪

**Objectif**: Garantir la qualité du code

**Installation:**

```bash
npm install -D @japa/runner @japa/assert @japa/api-client
node ace configure @japa/runner
```

**Fichiers à créer:**

```typescript
// tests/unit/repositories/email_repository.spec.ts
import { test } from '@japa/runner'
import EmailRepository from '#repositories/email_repository'

test.group('EmailRepository', () => {
  test('find email by gmail message id', async ({ assert }) => {
    const repo = new EmailRepository()
    const email = await repo.findByGmailMessageId('test-123')
    assert.isNull(email)
  })

  test('create email', async ({ assert }) => {
    const repo = new EmailRepository()
    const email = await repo.create({
      emailAccountId: 1,
      gmailMessageId: 'test-456',
      subject: 'Test',
      from: 'test@test.com',
      to: 'me@me.com',
      sentAt: DateTime.now(),
      snippet: 'Test snippet',
    })
    assert.exists(email.id)
  })
})

// tests/unit/services/gmail_message_fetcher.spec.ts
// tests/unit/services/promo_extraction_service.spec.ts
```

---

## 📊 Priorités par Impact

| Phase                   | Impact    | Effort    | Priorité |
| ----------------------- | --------- | --------- | -------- |
| Phase 4.2 (Validators)  | 🔴 Élevé  | 🟡 Moyen  | **1**    |
| Phase 4.3 (Policies)    | 🔴 Élevé  | 🟡 Moyen  | **2**    |
| Phase 1.3 (UserService) | 🟢 Moyen  | 🟢 Faible | **3**    |
| Phase 1.2 (Config)      | 🟢 Moyen  | 🟢 Faible | **4**    |
| Phase 5.1 (Tests)       | 🟡 Moyen  | 🔴 Élevé  | **5**    |
| Phase 1.4 (Exceptions)  | 🟡 Faible | 🟢 Faible | **6**    |

---

## 🎓 Ressources Utiles

### AdonisJS Documentation:

- [Validation with VineJS](https://docs.adonisjs.com/guides/validation)
- [Authorization with Bouncer](https://docs.adonisjs.com/guides/authorization)
- [Testing](https://docs.adonisjs.com/guides/testing)
- [Dependency Injection](https://docs.adonisjs.com/guides/dependency-injection)

### Patterns:

- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

## ✅ Quick Wins Immédiatement Disponibles

1. **Utiliser les scopes partout**

   ```typescript
   // Au lieu de:
   Email.query().whereHas('emailAccount', (q) => q.where('userId', userId))

   // Utiliser:
   Email.query().apply((scopes) => scopes.forUser(userId))
   ```

2. **Utiliser les repositories dans les nouveaux endpoints**

   ```typescript
   // Dans un nouveau controller:
   constructor(protected emailRepository: EmailRepository) {}
   ```

3. **Tokens automatiquement sécurisés**
   - Rien à faire! Le chiffrement est automatique

---

**Bon refactoring! 🚀**
