# What sells: conversion rules for local business sites

Research-backed (Sept 2026). Sources at the bottom.

## Why these rules
- 60% of Brazilians go online only by smartphone (86% in classes D/E). Build for the phone first.
- 82% of Brazilian small businesses sell through WhatsApp and only 10% through their own site. The site's job is to send people to WhatsApp with context, not to replace it.
- 96% of Brazilian consumers check Google reviews before choosing a local store. Purchase intent peaks at 4.0-4.7 stars; a perfect 5.0 looks less credible.
- 0.1 s faster mobile load raised lead-form progression by 21.6%.
- 57% of viewing time is above the fold, 74% in the first two screens.
- Pages written at a 5th-7th grade level convert about 2x better than professional-level copy.

## Rules
1. Design the 390px viewport first; desktop is the adaptation.
2. Fixed WhatsApp button on mobile. Pre-filled message specific to the business and page ("Olá! Vi o site e quero agendar uma avaliação").
3. First screen: what the business is + neighborhood/city + main CTA (WhatsApp) + secondary CTA (`tel:` or booking) + star rating with review count.
4. Real Google reviews with first name and date, near the top and again near the final CTA. Show the real average.
5. Restaurants: HTML menu with prices and photos, one tap from the top. Delivery app links if the brief has them.
6. Salons, clinics, gyms: booking link or "quero agendar" WhatsApp message; opening hours with an "Aberto agora / Fechado agora" state computed in JS from the hours.
7. Trades (mechanics, electricians, repair): service area, response time if given, before/after photos, guarantee if given.
8. Clinics and health: professional registration (CRM/CRO/CREFITO/CRP) when the brief has it.
9. Address with a lazy-loaded map (static image that opens Google Maps on tap), "Como chegar" link.
10. Real photos of the place, team and work. No stock.
11. One CTA after every major section, always the same action.
12. Instagram as secondary proof link in the footer.
13. Add `data-track="whatsapp"` / `data-track="phone"` on CTAs so analytics can be added later.
14. Plain, specific benefits over features: "Seu carro pronto no mesmo dia", not "Serviços automotivos de qualidade".

## Sources
- TIC Domicílios 2024: https://abranet.org.br/noticias/tic-domicilios-2024-60-usam-internet-exclusivamente-pelo-smartphone/
- Sebrae 2026 WhatsApp sales: https://agenciasebrae.com.br/dados/whatsapp-se-consolida-nas-vendas-on-line-enquanto-facebook-e-lojas-proprias-perdem-folego/
- Reviews (Harmo/Reclame Aqui 2025): https://exame.com/bussola/96-dos-consumidores-checam-avaliacoes-antes-de-escolher-uma-loja-fisica/
- Spiegel review study: https://spiegel.medill.northwestern.edu/how-online-reviews-influence-sales/
- Milliseconds make millions: https://web.dev/case-studies/milliseconds-make-millions
- NN/g scrolling and attention: https://www.nngroup.com/articles/scrolling-and-attention/
- Unbounce conversion benchmark: https://unbounce.com/conversion-benchmark-report/
- Restaurant sites: https://www.owner.com/blog/restaurant-website-design
