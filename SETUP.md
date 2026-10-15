# Happy Hill Tracker — connect the Google Sheet (about 10 minutes)

The site (Cloudflare) talks to a small Google Apps Script that sits on your Google Sheet.
The sheet stays private; people only reach it by signing in through the site.

## 1. Create the sheet and paste the script
1. Go to https://sheets.new and name the sheet **Happy Hill Tracker Data**.
2. Menu **Extensions → Apps Script**.
3. Delete the sample code, then paste the whole of `apps-script/Code.gs` from this repo. Save (Ctrl+S).

## 2. Create the tabs and sample accounts
1. In the Apps Script editor, pick the function **setup** in the toolbar and click **Run**.
2. Approve the permissions when asked (Advanced → Go to project → Allow).
3. Go back to the sheet: you should now see the tabs Users, Colleges, Homes, Activities, Followups, MoUs, Reviews, Resources, Logs, Settings.

Sample accounts (password for all: `NK@12345`):

| Role | Email |
|---|---|
| Super Admin | superadmin@example.org |
| Admin / Intern | admin@example.org |
| District Administration | district@example.org |
| College Coordinator | coordinator1@example.org |
| Welfare Home | home1@example.org |

## 3. Publish it as a web app
1. Click **Deploy → New deployment → ⚙ Select type → Web app**.
2. **Execute as:** Me. **Who has access:** Anyone.
3. Click **Deploy** and copy the **Web app URL** (ends in `/exec`).

## 4. Point the site at it
1. In the GitHub repo, open `js/config.js` and edit it.
2. Paste the URL: `API_URL: 'https://script.google.com/macros/s/.../exec',`
3. Commit. Cloudflare redeploys by itself in about a minute.

## Good to know
- **Changing the script later:** after editing Code.gs choose **Deploy → Manage deployments → ✏ → Version: New version → Deploy**. The URL stays the same.
- **Real people:** add them from the **Users** page (Admin or Super Admin). New users get the default password and must change it at first sign-in. Disable or delete the sample accounts before going live, and set `SHOW_SAMPLE_ACCOUNTS: false` in `config.js`.
- **Passwords** are stored as salted hashes, never as plain text. Five wrong attempts lock an email for 15 minutes. Sessions last 6 hours.
- **Never share the sheet itself** with coordinators. They only use the site.
- **Audit log** is the `Logs` tab and the Audit Log page (Super Admin only).
