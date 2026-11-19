# ហាងលក់ផ្លែឈើស្រស់ ភូមិគិរី
## Full-stack fruit shop management

This is a deployable React + TypeScript + Supabase application. Supabase provides hosted PostgreSQL, authentication and row-level security. The browser app never contains a service-role key.

### Features
- Khmer / English interface
- USD and KHR product pricing, sales and expense recording, with configurable display conversion rate
- Fruit catalog, descriptions, unit (kg / box), purchase and selling prices
- Stock-in, manual stock-out and stock movement history
- Sales recording that atomically reduces stock
- Expenses and weekly / monthly / yearly reports
- Dashboard, low-stock alerts, CSV export

### 1. Create the database
1. Create a project at https://supabase.com.
2. Open **SQL Editor** in the Supabase dashboard.
3. Run all of `supabase/schema.sql`.
4. In **Authentication → Providers**, enable Email.
5. In **Authentication → URL Configuration**, add your deployed site URL to Site URL and Redirect URLs.

### 2. Configure the app
```bash
npm install
cp .env.example .env
```
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase → Project Settings → API. Use the publishable/anon key only. Never put a service-role key in the browser.

### 3. Run locally
```bash
npm run dev
```
Open the local URL printed by Vite. Create an account using the sign-up form.

### 4. Publish online
1. Push this folder to a private or public GitHub repository.
2. Import the repository into https://vercel.com (or Netlify).
3. Add the two `VITE_SUPABASE_*` environment variables in the hosting dashboard.
4. Deploy. Add the resulting HTTPS domain to Supabase Authentication URL Configuration.

### Currency
The app stores the currency used on each sale/expense. The dashboard can display converted totals using the exchange rate setting. The initial reference rate is 1 USD = 4,100 KHR; change it to the rate your shop actually uses. Historical transaction amounts are not silently rewritten.

### Important operating notes
- Create one account per shop owner. Row-level security isolates each account's records.
- Back up your Supabase database regularly.
- This starter is ready for deployment, but it is not yet published to a public URL because it requires your Supabase project and hosting account credentials.
