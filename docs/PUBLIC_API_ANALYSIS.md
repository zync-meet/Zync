# Public APIs Analysis for Zync

## Executive Summary

Analysis of the [public-apis](https://github.com/public-apis/public-apis) repository (419k+ stars, 1400+ APIs) against Zync's current integrations and use case as a **developer collaboration platform**.

**Result**: The vast majority of listed APIs are **not relevant** to Zync's domain. However, a small subset can enhance security, team awareness, and operational simplicity.

---

## Current Zync Integrations (Not Replaceable via Public APIs)

| Service | Purpose | Status |
|---------|---------|--------|
| Firebase Auth | Authentication | Keep - no equivalent free replacement |
| GitHub API | Repos, webhooks, contributions | Keep - deep integration |
| Groq SDK + Google AI | AI project generation | Keep - no free AI alternative |
| Google Meet API | Video conferencing | Keep - no free alternative |
| Gmail API | Transactional emails | **Consider replacing** (see below) |
| Cloudinary | Image uploads | Keep - no free equivalent |
| MongoDB + Redis | Database + caching | Keep - core infrastructure |
| Google Calendar | Scheduling | Keep |
| Socket.IO + Yjs | Real-time collaboration | Keep |
| Puppeteer + Stealth | Design inspiration scraping | **Consider replacing** (see below) |

---

## Recommended Integrations

### Priority 1 - High Value

#### 1. HaveIBeenPwned (Security)
- **Auth**: apiKey
- **HTTPS**: Yes
- **Use Case**: Check user emails and passwords against known breach databases during signup and password changes.
- **Integration Point**: `backend/routes/userRoutes.js` - add breach check middleware during registration and profile updates.
- **Why**: Adds meaningful security without significant effort. Users get warned if their credentials appear in known breaches.
- **Endpoint**: `GET https://haveibeenpwned.com/api/v3/breachedaccount/{account}`

#### 2. Nager.Date (Calendar Enhancement)
- **Auth**: None
- **HTTPS**: Yes
- **CORS**: No (server-side only)
- **Use Case**: Display public holidays for 90+ countries on the team calendar. Critical for distributed teams to respect local holidays when scheduling meetings.
- **Integration Point**: `src/components/` calendar components - fetch holidays server-side, merge with Google Calendar events.
- **Why**: Free, no auth, direct value for meeting scheduling. Prevents scheduling meetings on team members' local holidays.
- **Endpoint**: `GET https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}`

#### 3. GeoJS / ipapi.co (Team Awareness)
- **Auth**: None
- **HTTPS**: Yes
- **CORS**: Yes
- **Use Case**: Detect and display team member timezones and approximate locations. Show timezone-aware "local time" next to each member in the team list.
- **Integration Point**: `backend/routes/userRoutes.js` or `src/hooks/` - resolve timezone on login or profile load.
- **Why**: Distributed teams need timezone awareness. Currently no timezone data is collected. Free, no auth required.
- **Endpoints**:
  - `GET https://get.geojs.io/v1/ip/geo.json`
  - `GET https://ipapi.co/{ip}/json/`

---

### Priority 2 - Medium Value

#### 4. CleanURI / 1pt (URL Shortening)
- **Auth**: None
- **HTTPS**: Yes
- **Use Case**: Shorten Google Meet links when sharing in chat messages or calendar invites.
- **Integration Point**: `backend/services/googleMeet.js` - shorten the Meet URL before returning it.
- **Why**: Meet URLs are long and ugly in chat. Simple improvement for UX.
- **Endpoints**:
  - `POST https://cleanuri.com/api/v1/shorten`
  - `GET https://1pt.co/add-longurl?url={url}`

#### 5. REST Countries (Profile Enrichment)
- **Auth**: None
- **HTTPS**: Yes
- **CORS**: Yes
- **Use Case**: Add country flags, currencies, and timezone info to team member profiles.
- **Integration Point**: User profile components - fetch country data based on user's country field.
- **Why**: Free, no auth, adds visual richness to team profiles. Useful for international teams.
- **Endpoint**: `GET https://restcountries.com/v3.1/name/{name}`

#### 6. SendGrid / Sendinblue (Email - Replace Gmail API)
- **Auth**: apiKey
- **HTTPS**: Yes
- **Use Case**: Replace the current Gmail API implementation for transactional emails (meeting invites, verification codes, support tickets).
- **Current Pain Point**: `backend/services/googleMeet.js` (`send_ZYNC_email`) uses ~80 lines of base64 encoding, MIME boundary construction, and raw Gmail API calls. An email service API reduces this to ~10 lines.
- **Trade-off**: Trading one API key dependency (Gmail OAuth) for another (SendGrid apiKey). Gmail API is already working but is over-engineered for transactional emails.
- **Why**: Cleaner code, better deliverability tracking, simpler auth (apiKey vs OAuth refresh tokens).

---

### Priority 3 - Low Value (Nice to Have)

#### 7. NewsData / Currents (Dashboard News Feed)
- **Auth**: apiKey
- **Use Case**: Developer news feed on the dashboard. Could show tech industry news relevant to the team.
- **Why Low**: Adds complexity, not core to collaboration. Requires API key management.

#### 8. Agify.io / Nationalize.io (Profile Enrichment)
- **Auth**: None
- **Use Case**: Estimate age/nationality from first names for user profile suggestions.
- **Why Low**: Novelty feature, not operationally useful.

#### 9. QR Code API (Meeting Links)
- **Auth**: None
- **Use Case**: Generate QR codes for Google Meet links - useful for in-person meetings or sharing via printed agendas.
- **Endpoint**: `GET https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={url}`
- **Why Low**: Nice UX touch but not a core need for a dev tool.

---

## Not Recommended (Explicitly Excluded)

The following API categories from the list were reviewed and found **not applicable** to Zync:

| Category | Reason |
|----------|--------|
| Animals, Anime, Art & Design | Consumer entertainment, not developer tools |
| Anti-Malware | Zync is not a security scanning product |
| Blockchain, Cryptocurrency | Not relevant to collaboration |
| Books, Dictionaries | Not relevant to core features |
| Food & Drink, Games & Comics | Consumer entertainment |
| Finance, Shopping | Not a commerce product |
| Music, Photography | Not a media platform |
| Social (Facebook, Instagram, etc.) | LinkedIn integration already exists |
| Weather | Could be added but not core to collaboration |
| Vehicle, Transportation | Not relevant |

---

## Puppeteer Scraping - Separate Recommendation

The **biggest improvement opportunity** is not from the public-apis list but worth noting:

**Current**: `backend/services/scraperService.js` runs headless Chromium with stealth plugins to scrape Dribbble, Godly, SiteInspire, LapaNinja, and Awwwards.

**Problems**:
- Heavy server resource usage (full browser per scrape)
- Fragile - breaks when sites change HTML structure
- Uses `puppeteer-extra-plugin-stealth` to bypass bot detection
- 450+ lines of site-specific scraping code

**Recommended alternatives** (from the public-apis list):
- **ZenRows** or **ScrapingDog** - managed scraping APIs that handle bot detection, proxies, and rendering. Removes Puppeteer dependency entirely.

**Or**: Expand the existing static dataset approach (`backend/data/inspiration.json`) and refresh it periodically via a separate script, not during user requests.

---

## Implementation Priority

If implementing these, the recommended order is:

1. **Nager.Date** - Easiest (no auth, server-side only, one endpoint)
2. **GeoJS** - Easiest (no auth, one endpoint, immediate UX value)
3. **HaveIBeenPwned** - Easy (apiKey, one endpoint, security value)
4. **CleanURI** - Easy (no auth, one endpoint)
5. **REST Countries** - Easy (no auth, enriches existing profiles)
6. **Replace Gmail API with SendGrid** - Medium effort (refactor email service, migrate templates)
7. **Replace Puppeteer** - High effort (architectural change to inspiration feature)
