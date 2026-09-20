# Vercel Web Analytics Setup & Privacy Architecture

This document details the configuration, privacy guarantees, metrics, and verification steps for privacy-friendly analytics on **Renz.dev (Human-Centered Systems Lab)**.

---

## 1. Overview & Privacy Principles

Renz.dev utilizes **Vercel Web Analytics**, an anonymous, cookieless, and lightweight telemetry solution engineered for modern web applications.

### Key Privacy Guarantees:
- **No Cookies**: Does not set cookies or utilize persistent local storage identifiers for tracking.
- **No Personal Identifiable Information (PII)**: IP addresses are anonymized and discarded immediately. No names, email addresses, or device serials are ever stored.
- **Zero Cross-Site Tracking**: Telemetry is isolated to this origin and cannot track visitors across other websites.
- **Compliance**: Fully compliant out-of-the-box with GDPR, CCPA, PECR, and Philippine Data Privacy Act (DPA) standards without requiring intrusive cookie consent banners.

---

## 2. Dashboard Activation Instructions

To enable live traffic monitoring on your Vercel deployment:

1. **Log in to Vercel**: Navigate to [vercel.com](https://vercel.com) and access your project (`renniel120921/portfolio-website` or `renzdev-portfolio`).
2. **Open Analytics Tab**: In the top navigation bar of your project dashboard, click **Analytics**.
3. **Enable Web Analytics**:
   - Click the **Enable Web Analytics** button.
   - Select your desired plan environment (Hobby / Free tier includes basic anonymous web analytics).
4. **Deploy**: Push changes to production or trigger a redeployment. The tracking script is automatically served by Vercel edge infrastructure at `/_vercel/insights/script.js`.

---

## 3. Code Integration Details

### Snippet in `index.html` (`<head>`)
The lightweight asynchronous queue snippet is included in `<head>`:

```html
<!-- Privacy-Friendly Vercel Web Analytics Queue -->
<script>
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
</script>
<script defer src="/_vercel/insights/script.js"></script>
```

### Safe Custom Event Wrapper in `script.js`
Custom interaction telemetry is dispatched through a safe wrapper:

```javascript
window.trackEvent = function (name, data) {
  try {
    if (typeof window.va === 'function') {
      window.va('event', { name, ...data });
    }
  } catch (_) {
    // Safe no-op on non-supporting tiers/environments
  }
};
```

### Tracked Custom User Flows:
1. `spotlight_opened`: Triggered when Spotlight AI Navigator is opened (`source: button | shortcut`).
2. `ai_query_submitted`: Triggered when an AI query is passed to the chatbot (`source: spotlight | standard`).
3. `case_study_opened`: Triggered when a case-study sheet is inspected (`project: likha | tipid`).
4. `archive_filtered`: Dispatched when an archive filter pill is toggled (`category: pwa | client | ...`).
5. `archive_expansion_toggled`: Dispatched when "Show More / Show Less" projects is clicked.
6. `lightbox_opened`: Dispatched when a milestone image is previewed.
7. `chat_opened`: Dispatched when the AI assistant drawer is launched.

> [!NOTE]
> On the Vercel Hobby (Free) plan, basic pageviews, top paths, referrers, and device categories are tracked automatically. Custom events (`window.va('event')`) are supported when custom event collection is enabled on eligible plans. The wrapper safely suppresses errors if custom events are disabled.

---

## 4. Verification Steps

1. **Deploy to Vercel**:
   Ensure the site is deployed to `https://renzdev-portfolio.vercel.app`.
2. **Open Developer Tools**:
   Press `F12` and switch to the **Network** tab.
3. **Filter Network Requests**:
   Type `insights` into the filter box.
4. **Trigger Actions**:
   - Reload the page: You should observe a request to `/_vercel/insights/view` returning status `200 OK`.
   - Open Spotlight or click a case study: You should observe calls to `/_vercel/insights/event`.
5. **Inspect Vercel Dashboard**:
   Traffic metrics will populate in real time under the **Analytics** tab of the Vercel dashboard.

