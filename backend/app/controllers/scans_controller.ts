import type { HttpContext } from '@adonisjs/core/http'
import ScanJob from '#models/scan_job'
import EmailAccount from '#models/email_account'
import EmailAccountPolicy from '#policies/email_account_policy'
import ScanJobPolicy from '#policies/scan_job_policy'
import { createScanValidator } from '#validators/create_scan_validator'
import { addEmailScanJob } from '#services/queue_service'

export default class ScansController {
  async index({ auth, response, bouncer }: HttpContext) {
    const user = auth.user!
    await bouncer.with(ScanJobPolicy).authorize('viewAny')
    const jobs = await ScanJob.query()
      .where('userId', user.id)
      .orderBy('createdAt', 'desc')
      .limit(20)
    return response.ok(jobs)
  }

  async store({ request, response, auth, bouncer }: HttpContext) {
    const user = auth.user!
    await bouncer.with(ScanJobPolicy).authorize('create')
    const data = await request.validateUsing(createScanValidator)

    // Verify ownership
    const account = await EmailAccount.query()
      .where('id', data.emailAccountId)
      .where('userId', user.id)
      .firstOrFail()
    await bouncer.with(EmailAccountPolicy).authorize('scan', account)

    // Create scan job
    const scanJob = await ScanJob.create({
      userId: user.id,
      emailAccountId: account.id,
      status: 'PENDING',
    })

    // Add to queue for asynchronous processing
    await addEmailScanJob(scanJob.id, account.id)

    return response.created({
      ...scanJob.toJSON(),
      message: 'Scan job queued successfully',
    })
  }
}
