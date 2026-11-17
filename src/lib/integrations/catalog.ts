/** Browser-safe list of integrations the Admin manages in the Integration Centre. Only services this website really uses are listed. */
export type IntegrationField = { key: string; label: string; secret?: boolean; placeholder?: string; options?: { value: string; label: string }[] };
export type IntegrationDef = { provider: 'zoho_invoice' | 'meta_leads' | 'zoho_books' | 'razorpay' | 'zoho_payments'; name: string; category: string; description: string; fields: IntegrationField[]; external: string[]; canSync?: boolean };

export const integrationCatalog: IntegrationDef[] = [
  {
    provider: 'zoho_invoice', name: 'Zoho Invoice', category: 'Finance', canSync: true,
    description: 'Reads invoices and payment status into Accounts & Finance. Read-only: invoices and GST stay in Zoho.',
    fields: [
      { key: 'data_center', label: 'Zoho data centre', options: [{ value: 'in', label: 'India (zoho.in)' }, { value: 'com', label: 'Global (zoho.com)' }, { value: 'eu', label: 'Europe (zoho.eu)' }] },
      { key: 'organization_id', label: 'Organization ID', placeholder: 'From Zoho Invoice → Settings → Organization' },
      { key: 'client_id', label: 'Client ID', secret: true }, { key: 'client_secret', label: 'Client secret', secret: true },
      { key: 'refresh_token', label: 'Refresh token (scope ZohoInvoice.invoices.READ)', secret: true },
    ],
    external: ['Create a Self Client at api-console.zoho.in (or .com) and generate a refresh token with scope ZohoInvoice.invoices.READ.'],
  },
  {
    provider: 'meta_leads', name: 'Meta Lead Ads', category: 'Marketing',
    description: 'Facebook / Instagram lead forms arrive in the CRM automatically.',
    fields: [{ key: 'app_secret', label: 'App secret', secret: true }, { key: 'page_access_token', label: 'Page access token', secret: true }, { key: 'verify_token', label: 'Webhook verify token', secret: true }],
    external: ['In Meta for Developers, set the webhook URL to <your site>/api/public/meta-leads (Page → leadgen) and use the same verify token.'],
  },
  {
    provider: 'zoho_books', name: 'Zoho Books', category: 'Finance',
    description: 'Accounting: connect your Zoho Books organisation so Accounts & Finance can work with it. Books stays the source of truth.',
    fields: [{ key: 'data_center', label: 'Zoho data centre', options: [{ value: 'in', label: 'India (zoho.in)' }, { value: 'com', label: 'Global (zoho.com)' }, { value: 'eu', label: 'Europe (zoho.eu)' }] }, { key: 'organization_id', label: 'Organization ID', placeholder: 'Zoho Books → Settings → Organization profile' }, { key: 'client_id', label: 'Client ID', secret: true }, { key: 'client_secret', label: 'Client secret', secret: true }, { key: 'refresh_token', label: 'Refresh token (scope ZohoBooks.fullaccess.all)', secret: true }],
    external: ['Create a Self Client at api-console.zoho.in and generate a refresh token with scope ZohoBooks.fullaccess.all.'],
  },
  {
    provider: 'razorpay', name: 'Razorpay', category: 'Payments',
    description: 'Online payments with Razorpay. Keys are stored encrypted and only used on the server.',
    fields: [{ key: 'key_id', label: 'Key ID', placeholder: 'rzp_live_... or rzp_test_...' }, { key: 'key_secret', label: 'Key secret', secret: true }, { key: 'webhook_secret', label: 'Webhook secret', secret: true }],
    external: ['Razorpay Dashboard → Account & Settings → API Keys. Webhook secret: Settings → Webhooks.'],
  },
  {
    provider: 'zoho_payments', name: 'Zoho Payments', category: 'Payments',
    description: 'Online payments with Zoho Payments. Keys are stored encrypted and only used on the server.',
    fields: [{ key: 'data_center', label: 'Zoho data centre', options: [{ value: 'in', label: 'India (zoho.in)' }, { value: 'com', label: 'Global (zoho.com)' }, { value: 'eu', label: 'Europe (zoho.eu)' }] }, { key: 'account_id', label: 'Account ID', placeholder: 'Zoho Payments → Settings → Developer space' }, { key: 'client_id', label: 'Client ID', secret: true }, { key: 'client_secret', label: 'Client secret', secret: true }, { key: 'refresh_token', label: 'Refresh token (scope ZohoPay.payments.READ)', secret: true }],
    external: ['Create a Self Client at api-console.zoho.in and generate a refresh token with Zoho Payments scopes.'],
  },
];

export const integrationDef = (p: string) => integrationCatalog.find(d => d.provider === p);

/** Which fields must be filled before an integration can be saved as connected. */
export function missingFields(def: IntegrationDef, config: Record<string, string>, savedSecrets: boolean, secrets: Record<string, string>): string[] {
  return def.fields.filter(f => f.secret ? !(savedSecrets || secrets[f.key]?.trim()) : !config[f.key]?.trim()).map(f => f.label);
}

/** Masks a secret for display: never more than the last 4 characters. */
export const maskSecret = (v: string) => (v.length <= 4 ? '••••' : `••••${v.slice(-4)}`);
