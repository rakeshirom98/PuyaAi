# Puya Ai

Puya Ai is a React/Vite chat application with a responsive settings workspace. The settings use the existing JavaScript and CSS setup in this repository; no separate TypeScript or Tailwind build step is configured.

## Run locally

Requirements: Node.js 20 or newer and npm.

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a local environment file from the example and configure the required API keys:

   ```sh
   cp .env.example .env
   ```

   Set `GROQ_API_KEY` in `.env`. Web search is optional and disabled by default. To enable it, choose Brave or Google and configure the corresponding provider credentials below. The API health check at `http://localhost:3001/api/health` reports the selected search provider and whether it is configured, without revealing any key values. Keep all API keys and OAuth client secrets on the server; never put them in browser storage or frontend environment variables.

   For Google sign-in, create a **Web application** OAuth client in Google Cloud Console. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`. Add `http://localhost:3001/api/auth/google/callback` as an authorized redirect URI in the OAuth client settings. Keep `GOOGLE_REDIRECT_URI` and `APP_ORIGIN` aligned with your API callback and frontend URLs. For production, use HTTPS and register the production callback URL in Google Cloud Console.

   For the `https://www.puyai.in` deployment, configure these values in the **production API host's environment** (not just the local `.env`):

   ```env
   APP_ORIGIN=https://www.puyai.in
   GOOGLE_REDIRECT_URI=https://www.puyai.in/api/auth/google/callback
   ```

   Add `https://www.puyai.in/api/auth/google/callback` as an authorized redirect URI for the same Google OAuth client, then restart/redeploy the API. The domain must resolve to the deployment, and the production API must serve `/api/auth/google/callback`.

   To enable Brave Search, set `WEB_SEARCH_PROVIDER=brave` and provide `BRAVE_SEARCH_API_KEY`. If you already have access to Google's Custom Search JSON API, set `WEB_SEARCH_PROVIDER=google`, `GOOGLE_SEARCH_API_KEY`, and `GOOGLE_SEARCH_ENGINE_ID`. Google requires a configured Programmable Search Engine (`cx`) and an API key. Note that Google says this API is unavailable to new customers and is scheduled to discontinue it on January 1, 2027; see the [official API overview](https://developers.google.com/custom-search/v1/overview).

3. Start the API and Vite development server:

   ```sh
   npm start
   ```

   The frontend runs at `http://localhost:5173`, and the API runs at `http://localhost:3001`.

## Build and deployment

Run `npm run build` to generate the static frontend in `dist/`. Deploy the `dist/` directory to a static host and deploy `server/index.js` as a Node.js service. Configure the production web server to route `/api` requests from the frontend origin to the Node service, and configure the service's allowed CORS origins for the production domain. Set `GROQ_API_KEY`, optional search provider credentials, and any other server-side configuration in the hosting provider's secret manager.

The current account and chat API stores its data in `server/data/store.json`; use persistent storage and backups for deployments that need durable user data. Google sign-in associates verified Google email addresses with existing Puya Ai accounts and stores the provider subject identifier; passwords are not requested or stored for Google-only accounts. The account, billing, payment, parental-control, trusted-contact, and third-party integration settings are explicitly marked unavailable until their corresponding provider APIs are configured.

## Settings and privacy

Web search is disabled by default (`WEB_SEARCH_PROVIDER=none`). When enabled, chat questions are sent from the API server to the configured Brave or Google search provider before the AI response is generated. The API supplies search snippets to the model and returns the result links as citations. Brave Search requires `BRAVE_SEARCH_API_KEY` and `WEB_SEARCH_PROVIDER=brave`. Google Programmable Search requires both `GOOGLE_SEARCH_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID`; choose it with `WEB_SEARCH_PROVIDER=google` if you already have API access. Google does not offer this API to new customers and plans to discontinue it on January 1, 2027. If an enabled provider is not configured, chat requests show a configuration error rather than silently answering without a search. Queries are sent to the selected provider, so avoid including sensitive personal information in a question.

Language, model, and response-style preferences use the app's existing browser preference storage. Settings for appearance, notifications, voice, and personalization are stored in browser `localStorage` under `puya-ai-settings-page-v1`; they do not contain passwords or authentication tokens. Authentication tokens are kept in `sessionStorage` (a one-time migration removes the previous local-storage token). Profile display-name edits and custom instructions are device-local; custom instructions and response preferences are sent to the authenticated chat API when generating a reply. Conversation archive, restore, deletion, and export controls operate on the signed-in user's conversations.
