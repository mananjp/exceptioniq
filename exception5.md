# Implementation Plan - Zoho Books OAuth Client-Facing Connect Flow

This plan implements a one-click "Connect Zoho Books" OAuth flow so clients
never need to manually generate tokens. It modifies the existing
`IntegrationsViewSet` in `apps/integrations/views.py`, updates
`Integrations.tsx`, and adds 4 environment variables.

## User Review Required

> [!IMPORTANT]
> **Redirect URI**: The callback URL
> `http://localhost:8000/api/v1/integrations/zoho/callback/` must already be
> registered in Zoho API Console → your app → Authorized Redirect URIs.
> This was done during initial Zoho setup.

> [!IMPORTANT]
> **permission_classes=[AllowAny]** on `zoho_callback` is intentional and
> required. Zoho's redirect carries no auth header — any auth check will
> cause a 403 and break the flow for all clients.

> [!WARNING]
> **Do not** add `zoho_callback` to CSRF protection. It is a GET redirect
> from Zoho's servers, not a form submission.

---

## Proposed Changes

### 1. Environment Variables

#### [MODIFY] `backend/.env`
Add:ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REDIRECT_URI=http://localhost:8000/api/v1/integrations/zoho/callback/
FRONTEND_URL=http://localhost:5173

#### [MODIFY] `backend/.env.example`
Add the same 4 keys with empty values as documentation.

---

### 2. Backend ViewSet

#### [MODIFY] `backend/apps/integrations/views.py`
Add 3 new `@action` methods to the existing `IntegrationsViewSet`.
Do NOT remove or modify any existing actions.

**`zoho_connect`** — `GET`, `url_path='zoho/connect'`
- Reads `entity_id` from query params
- Builds Zoho OAuth URL with `scope=ZohoBooks.fullaccess.all`,
  `access_type=offline`, `state=entity_id`
- Returns `redirect()` to Zoho auth URL

**`zoho_callback`** — `GET`, `url_path='zoho/callback'`,
`permission_classes=[AllowAny]`
- Reads `code` and `state` (entity_id) from query params
- If `error` param present or no `code` → redirect to
  `{FRONTEND_URL}/integrations?zoho=denied`
- POSTs to `https://accounts.zoho.in/oauth/v2/token` with code,
  client_id, client_secret, redirect_uri, grant_type=authorization_code
- If response has no `refresh_token` → redirect to
  `{FRONTEND_URL}/integrations?zoho=error&reason=no_refresh_token`
- Saves `access_token`, `refresh_token`, `token_expiry` to Entity
- Redirects to `{FRONTEND_URL}/integrations?zoho=connected`
- Catches `Entity.DoesNotExist` → redirect `zoho=error&reason=entity_not_found`
- Catches all other exceptions → redirect `zoho=error&reason=token_exchange_failed`

**`zoho_disconnect`** — `POST`, `url_path='zoho/disconnect'`
- Reads `entity_id` from request.data
- Clears `zoho_access_token`, `zoho_refresh_token`, `zoho_token_expiry`
  on Entity using `update_fields`
- Returns `{'status': 'disconnected'}`

All three actions use `os.environ.get()` for credentials — no hardcoded values.

---

### 3. RBAC

#### [MODIFY] `backend/apps/api/permissions.py`
Add to `ROLE_ACTION_MAP`:
```python
'zoho_connect':    {'admin'},
'zoho_callback':   {'*'},
'zoho_disconnect': {'admin'},
```

---

### 4. Frontend

#### [MODIFY] `frontend/src/pages/Integrations.tsx`

**Add `useEffect` at component top** (runs once on mount):
- Read `new URLSearchParams(window.location.search).get('zoho')`
- `'connected'` → `toast.success('Zoho Books connected successfully!')` +
  call `refetchEntity()`
- `'denied'` → `toast.error('Zoho connection cancelled.')`
- `'error'` → `toast.error('Zoho connection failed. Please try again.')`
- For any non-null value → `window.history.replaceState({}, '', '/integrations')`
  to clean the URL

**Replace current Zoho connect form/button** with:

`isZohoConnected` = `!!entity?.zoho_refresh_token`

`handleConnectZoho`:window.location.href = /api/v1/integrations/zoho/connect/?entity_id=${currentEntity.id}

`handleDisconnectZoho`:await api.post('/integrations/zoho/disconnect/', { entity_id: currentEntity.id })
toast.success('Zoho Books disconnected.')
refetchEntity()


Zoho Books card JSX:
- If `isZohoConnected`: show green "✅ Connected" badge + org ID text +
  outlined "Disconnect" button calling `handleDisconnectZoho`
- If not connected: show gray "Not Connected" badge + description text +
  primary "Connect Zoho Books" button calling `handleConnectZoho`

---

## Verification Plan

### Automated
```bash
npx tsc --noEmit
```
Zero TypeScript errors expected — no new types introduced, only
`entity.zoho_refresh_token` (already exists on Entity interface from Phase 3).

### Manual
1. Start Django backend (`python manage.py runserver`)
2. Start frontend (`npm run dev`)
3. Go to `/integrations` → click "Connect Zoho Books"
4. Should redirect to Zoho consent screen
5. Accept → should redirect back and show "✅ Zoho Books Connected"
6. Click "Disconnect" → badge reverts to "Not Connected"
7. Test with wrong entity_id → should redirect with `zoho=error`

---

## File Count Summary

| Category | Modified Files | New Files |
|---|---|---|
| Backend ViewSet | 1 (`views.py`) | 0 |
| Backend RBAC | 1 (`permissions.py`) | 0 |
| Environment | 2 (`.env`, `.env.example`) | 0 |
| Frontend | 1 (`Integrations.tsx`) | 0 |
| **Total** | **5** | **0** |