# Worksheet Hub - GitHub Pages sandbox (TEST site)

A fake e-commerce site for the Practical Revision Course. It carries your GTM container (GTM-N9RZK8W4). There is NO direct gtag code: GA4 is fired only from GTM.

## Upload steps
1. Open your repository (my-practice-site-2) on GitHub.
2. Click Add file > Upload files. Drag in EVERYTHING from this folder, including the `files` folder.
3. WARNING: index.html, about.html and contact.html will REPLACE your existing versions. If you want to keep the old ones, rename them first or download a copy.
4. Commit. Wait 1-2 minutes, then open https://f-fahadshaikh.github.io/my-practice-site-2/ and hard-refresh (Ctrl+F5).

## Pages and what they are for
| Page | pageType | Events the SITE pushes | Course use |
|---|---|---|---|
| index.html | home | none | page_view, UTM test (add ?utm_source=test&utm_medium=email&utm_campaign=nov_sale) |
| shop.html | category | view_item_list | e-commerce tag |
| product-maths-grade-5 / science-grade-5 | product | view_item, add_to_cart (on success) | items array |
| product-english-grade-5 | product | view_item only (out of stock) | negative test |
| cart.html | cart | view_cart, remove_from_cart | |
| checkout.html | checkout | begin_checkout, add_shipping_info, add_payment_info | funnel |
| thank-you.html | confirmation | purchase (once per order) | de-duplication test |
| delivery.html, about.html | content | none | page_view only |
| contact.html | contact | generate_lead | form + click triggers |
| every page footer | | sign_up (valid newsletter email) | custom event trigger |

## Click triggers for GTM to build (the site pushes nothing for these)
- WhatsApp: Click URL contains wa.me (ids whatsapp-link, footer-whatsapp)
- Phone: Click URL starts with tel: (ids phone-link, footer-phone)
- Brochure: Click URL ends with .pdf (id brochure-link; also check Enhanced measurement file_download)
- Outbound: Click URL contains example.com

## Settings in script.js (top of file)
- `pushDataLayer:false` - site pushes nothing (practise click-only tracking)
- `guardPurchase:false` - purchase repeats on reload, so you can SEE a duplicate and then fix it
- `currency` - PKR

## Rules
- Fake data only. Nothing is stored except cart/order summary in your own browser's localStorage.
- Order numbers are TEST-001, TEST-002... Reset by clearing site data in DevTools > Application.
- value = items subtotal, excluding shipping.
