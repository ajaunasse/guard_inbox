/*
|--------------------------------------------------------------------------
| Bouncer policies
|--------------------------------------------------------------------------
|
| You may define a collection of policies inside this file and pre-register
| them when creating a new bouncer instance.
|
| Pre-registered policies and abilities can be referenced as a string by their
| name. Also they are must if want to perform authorization inside Edge
| templates.
|
*/

import Email from '#models/email'
import EmailAccount from '#models/email_account'
import ScanJob from '#models/scan_job'
import EmailPolicy from '#policies/email_policy'
import EmailAccountPolicy from '#policies/email_account_policy'
import ScanJobPolicy from '#policies/scan_job_policy'

export const policies = {
  EmailPolicy: EmailPolicy,
  EmailAccountPolicy: EmailAccountPolicy,
  ScanJobPolicy: ScanJobPolicy,
}

// Type mapping for better type inference
export const policyModels = {
  Email: EmailPolicy,
  EmailAccount: EmailAccountPolicy,
  ScanJob: ScanJobPolicy,
}