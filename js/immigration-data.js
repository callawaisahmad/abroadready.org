/* AbroadReady — immigration & study-abroad knowledge base for the AI Advisor.
   Data mirrors the country guides in /pages (immigrate-to-*, study-in-*). */
(function () {
  'use strict';

  var COUNTRIES = [
    {
      name: 'Canada', iso: 'ca', slug: 'canada',
      ease: 'Easiest — points-based Express Entry; PR in ~6–12 months; most routes need no job offer',
      programs: 'Express Entry (CRS score + draws), Provincial Nominee Program (PNP), Canadian Experience Class',
      simple: 'Canada picks immigrants on a points score (age, education, language, work experience). High scorers get invited to apply for permanent residence directly — no employer needed.',
      blurb: 'The most accessible big country: a transparent points system, no job offer required for most routes, and permanent residence in under a year for strong profiles.',
      fees: 'CAD 1,590 (Express Entry + PR fee)'
    },
    {
      name: 'Australia', iso: 'au', slug: 'australia',
      ease: 'Very attainable — points-tested skilled visas; invites typically land at 85–95 points',
      programs: 'Skilled 189/190/491 (points), Skills in Demand 482, Employer Nomination 186, National Innovation Visa',
      simple: 'Australia scores you on age, English, experience and education. If you clear ~85+ points you get invited to apply for a skilled visa and permanent residence.',
      blurb: 'A long-established points system with realistic invite scores (85–95) and strong permanent-residence outcomes for skilled professionals.',
      fees: 'AUD 4,640+ (Skilled visa 189)'
    },
    {
      name: 'New Zealand', iso: 'nz', slug: 'new-zealand',
      ease: 'Very attainable — 6-point Skilled Migrant + Green List; many occupations go Straight-to-Residence',
      programs: 'Skilled Migrant Category (6-point), Green List (Straight-to-Residence / Work-to-Residence), AEWV',
      simple: 'NZ awards you points for experience, qualifications and pay. Occupations on the Green List can go straight to residence, sometimes without a job offer.',
      blurb: 'One of the most predictable skilled systems: the Green List fast-tracks in-demand occupations to permanent residence, plus a clear 6-point pathway.',
      fees: 'NZD 5,000+ (Skilled Migrant)'
    },
    {
      name: 'Germany', iso: 'de', slug: 'germany',
      ease: 'Very attainable — EU Blue Card & Opportunity Card; PR possible in 21–27 months',
      programs: 'EU Blue Card (€50,700 / €45,934 shortage), Opportunity (Chances) Card, Skilled Worker visa',
      simple: 'Germany gives fast-track residence to skilled workers with a job offer above a salary threshold. The Opportunity Card lets you come first and look for a job while you\'re there.',
      blurb: 'Europe\'s strongest economy with an EU Blue Card that can lead to permanent residence in under two years for some cases.',
      fees: '~€75–160 (visa)'
    },
    {
      name: 'United Kingdom', iso: 'gb', slug: 'uk',
      ease: 'Attainable — Skilled Worker visa; ILR (settlement) after 5 years',
      programs: 'Skilled Worker (£41,700 threshold), Health & Care Worker, Graduate Route, Global Talent, High Potential Individual',
      simple: 'The UK sponsors skilled workers through the Skilled Worker visa. Stay 5 years on eligible routes and you can apply for Indefinite Leave to Remain, then citizenship.',
      blurb: 'A large, English-speaking labour market with multiple routes, including the Graduate Route after UK study and Global Talent for exceptional professionals.',
      fees: '£719–1,500+ (Skilled Worker)'
    },
    {
      name: 'United States', iso: 'us', slug: 'usa',
      ease: 'Hardest of the big four — H-1B lottery (~35%) + per-country green-card backlogs',
      programs: 'H-1B work visa, EB-1/EB-2/EB-3 green cards, DV Lottery, O-1, L-1',
      simple: 'The US has no points system. Most paths need an employer to sponsor you, H-1B selection is a lottery, and green cards for India/China face decade-long waits. The Diversity Visa lottery is free to enter.',
      blurb: 'Highest salaries but the most competitive system: an H-1B lottery, per-country caps and green-card backlogs (12–14 years for India EB-2).',
      fees: 'US$215 registration + $3,595+ petition (employer)'
    },
    {
      name: 'France', iso: 'fr', slug: 'france',
      ease: 'Attainable for specialists — Talent Passport & EU Blue Card; citizenship now needs B2 French (2026)',
      programs: 'Talent (Passport Talent), EU Blue Card (€59,373), Entrepreneur route, family reunification',
      simple: 'France fast-tracks high-earners and talent categories with the Talent Passport, and the EU Blue Card for big salaries. Citizenship from 2026 requires B2-level French.',
      blurb: 'Generous talent routes for professionals and researchers, with French proficiency becoming essential for citizenship from 2026.',
      fees: '€100–400 (talent/resident card)'
    },
    {
      name: 'Netherlands', iso: 'nl', slug: 'netherlands',
      ease: 'Attainable — Highly Skilled Migrant route; PR after 5 years; 30% tax ruling',
      programs: 'Highly Skilled Migrant (€4,357/€5,942 monthly), Orientation Year, self-employment',
      simple: 'If you\'re hired by an accredited Dutch employer above the salary threshold, residence follows quickly. The 30% tax ruling makes Dutch offers extra valuable.',
      blurb: 'A top destination for tech and research talent, with a well-oiled Highly Skilled Migrant route and the 30% tax break.',
      fees: '€370 (residence permit)'
    },
    {
      name: 'Ireland', iso: 'ie', slug: 'ireland',
      ease: 'Very attainable — Critical Skills Permit; fastest path to citizenship in Europe (5-in-9 rule)',
      programs: 'Critical Skills Employment Permit (€40,904), General Employment Permit (€36,605), Stamp 1G graduate scheme',
      simple: 'Ireland\'s Critical Skills permit needs no labour-market test for in-demand jobs, and you can apply for citizenship after just 5 of the last 9 years of residence.',
      blurb: 'An English-speaking gateway to the EU with a strong tech sector and the fastest citizenship timeline in Western Europe.',
      fees: '€500–1,000 (permit)'
    },
    {
      name: 'Sweden', iso: 'se', slug: 'sweden',
      ease: 'Attainable with a job offer — work permit; new 8-year citizenship rule from June 2026',
      programs: 'Work permit (SEK 34,470/month), EU Blue Card (SEK 53,625), self-employment',
      simple: 'Sweden grants work permits to those with a Swedish job offer above the salary floor. From June 2026 citizenship requires 8 years of residence.',
      blurb: 'Straightforward work-permit route for anyone with a qualifying job offer; language and longer residency matter for citizenship.',
      fees: 'SEK 2,200 (work permit)'
    },
    {
      name: 'Spain', iso: 'es', slug: 'spain',
      ease: 'Attainable — Digital Nomad & Non-Lucrative visas; PR after 5 years, citizenship after 10',
      programs: 'Digital Nomad Visa (€2,849/month), Non-Lucrative Visa (€28,800/year), self-employment',
      simple: 'Spain is ideal for remote workers (Digital Nomad) or those with savings (Non-Lucrative). Residence builds to PR after 5 years and citizenship after 10.',
      blurb: 'A favourite for digital nomads and retirees — lower salary bars than work-permit countries, but citizenship is a 10-year horizon.',
      fees: '€80–240 (visa)'
    },
    {
      name: 'Italy', iso: 'it', slug: 'italy',
      ease: 'Attainable but quota-limited — EU Blue Card & Decreto Flussi; PR after 5 years, citizenship after 10',
      programs: 'EU Blue Card (€35,500), Decreto Flussi quota, digital nomad visa',
      simple: 'Italy offers the EU Blue Card for well-paid roles plus a yearly quota system (Decreto Flussi) for other workers. Residence after 5 years leads to PR.',
      blurb: 'A solid EU Blue Card option with a lower salary threshold, though the quota system adds a lottery-like element.',
      fees: '€116 (permesso di soggiorno)'
    },
    {
      name: 'Switzerland', iso: 'ch', slug: 'switzerland',
      ease: 'Hard — strict quotas (8,500/yr) + labour-market precedence; C permit after 10 years',
      programs: 'B/L work permits, self-employment, C permit (10 years), naturalisation',
      simple: 'Switzerland only issues a limited number of permits for non-EU workers, and employers must first prove no Swiss/EU candidate exists. The C permit comes after 10 years.',
      blurb: 'Extraordinary salaries but the toughest admission bar in Western Europe — permits are quota-capped and heavily restricted.',
      fees: 'CHF 200–500 (permit)'
    },
    {
      name: 'Turkey', iso: 'tr', slug: 'turkey',
      ease: 'Attainable — residence permits are accessible; citizenship by investment from US$400K',
      programs: 'Work permit (salary thresholds), residence permits, citizenship by investment (US$400K property), Turquoise Card, long-term residence after 8 years',
      simple: 'Turkey is one of the easiest places to get a residence permit, and investment (US$400K in property) can lead to citizenship in months.',
      blurb: 'Accessible residence permits and the fastest citizenship-by-investment path on the list.',
      fees: 'US$1,115 (residence permit + card)'
    }
  ];

  var HUBS = {
    immigration: { title: 'Immigration & Work Visa Guides', page: 'immigration' },
    visa: { title: 'Student Visa Guidance', page: 'visa-guidance' },
    ielts: { title: 'IELTS Guidance', page: 'ielts-guidance' },
    study: { title: 'Study Abroad Hub', page: 'study' }
  };

  var STUDY = {
    'canada': 'study-in-canada', 'australia': 'study-in-australia',
    'new zealand': 'study-in-new-zealand', 'germany': 'study-in-germany',
    'uk': 'study-in-uk', 'usa': 'study-in-usa', 'france': 'study-in-france',
    'netherlands': 'study-in-netherlands', 'ireland': 'study-in-ireland',
    'sweden': 'study-in-sweden', 'spain': 'study-in-spain', 'italy': 'study-in-italy',
    'switzerland': 'study-in-switzerland', 'turkey': 'study-in-turkey'
  };

  var NAME_PATTERNS = [
    ['canada', 'Canada'], ['australia', 'Australia'], ['germany', 'Germany'],
    ['france', 'France'], ['ireland', 'Ireland'], ['italy', 'Italy'], ['sweden', 'Sweden'],
    ['spain', 'Spain'], ['turkey', 'Turkey'], ['turkiye', 'Turkey'],
    ['netherlands', 'Netherlands'], ['holland', 'Netherlands'],
    ['new zealand', 'New Zealand'], ['switzerland', 'Switzerland'],
    ['united kingdom', 'United Kingdom'], ['britain', 'United Kingdom'], ['england', 'United Kingdom'],
    ['united states', 'United States'], ['usa', 'United States'], ['america', 'United States']
  ];

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function findCountry(q) {
    q = ' ' + q.toLowerCase().replace(/[?!.,]/g, ' ') + ' ';
    if (/\bus\b/.test(q) && !/\bunited states\b/.test(q)) return byName('United States');
    if (/\buk\b/.test(q)) return byName('United Kingdom');
    for (var i = 0; i < NAME_PATTERNS.length; i++) {
      if (q.indexOf(' ' + NAME_PATTERNS[i][0] + ' ') !== -1) return byName(NAME_PATTERNS[i][1]);
    }
    return null;
  }
  function byName(name) {
    for (var i = 0; i < COUNTRIES.length; i++) if (COUNTRIES[i].name === name) return COUNTRIES[i];
    return null;
  }
  function bySlug(slug) {
    for (var i = 0; i < COUNTRIES.length; i++) if (COUNTRIES[i].slug === slug) return COUNTRIES[i];
    return null;
  }
  function flag(c, size) {
    size = size || 24;
    return '<img src="https://flagcdn.com/' + size + 'x' + Math.round(size * 0.75) + '/' + c.iso + '.png" alt="' + esc(c.name) + ' flag" width="' + size + '" height="' + Math.round(size * 0.75) + '" loading="lazy">';
  }
  function studyLink(c) { return STUDY[c.slug] ? '<a href="' + STUDY[c.slug] + '" style="color:var(--primary);font-weight:600;">Study in ' + esc(c.name) + ' →</a>' : ''; }
  function guideLink(c) { return '<a href="immigrate-to-' + c.slug + '" style="color:var(--primary);font-weight:600;">Full ' + esc(c.name) + ' guide →</a>'; }

  function countryCard(c, simple) {
    var html = '<p><strong>' + flag(c, 22) + ' &nbsp;Immigrating to ' + esc(c.name) + ' — the essentials:</strong></p>';
    html += '<p><strong>Main routes:</strong> ' + esc(c.programs) + '.</p>';
    html += '<p>' + (simple ? esc(c.simple) : esc(c.blurb)) + '</p>';
    html += '<p><strong>Difficulty:</strong> ' + esc(c.ease) + '.</p>';
    html += '<p><strong>Fees:</strong> ' + esc(c.fees) + '.</p>';
    var links = [guideLink(c)];
    var sl = studyLink(c);
    if (sl) links.push(sl);
    links.push('<a href="' + HUBS.immigration.page + '" style="color:var(--primary);font-weight:600;">All immigration guides →</a>');
    html += '<p>' + links.join(' · ') + '</p>';
    return html;
  }

  function easiest(simple) {
    var rank = [
      ['Canada', 'points-based Express Entry, no job offer needed, PR in ~6–12 months'],
      ['Germany', 'EU Blue Card / Opportunity Card, PR in 21–27 months'],
      ['Australia', 'points visas 189/190 with invites at 85–95 points'],
      ['New Zealand', 'Green List occupations can go Straight-to-Residence'],
      ['Ireland', 'Critical Skills permit and Europe\'s fastest citizenship (5-in-9)'],
      ['Netherlands', 'Highly Skilled Migrant route + 30% tax ruling']
    ];
    var lis = rank.map(function (r) {
      var c = byName(r[0]);
      return '<li><strong>' + esc(r[0]) + '</strong> — ' + esc(r[1]) + ' (' + guideLink(c) + ')</li>';
    }).join('');
    var html = '<p><strong>Easiest countries to migrate to in 2026 (for skilled professionals):</strong></p><ol>' + lis + '</ol>';
    html += '<p>Hardest: the <strong>United States</strong> (H-1B lottery + green-card backlogs) and <strong>Switzerland</strong> (strict quotas). For a no-job-offer points path, start with ' +
      guideLink(byName('Canada')) + ' or ' + guideLink(byName('Australia')) + '.</p>';
    html += '<p>Not sure? <a href="' + HUBS.immigration.page + '" style="color:var(--primary);font-weight:600;">Browse all 13 immigration guides →</a></p>';
    return html;
  }

  window.IMM = {
    count: COUNTRIES.length,
    countries: COUNTRIES,
    hubs: HUBS,
    findCountry: findCountry,
    byName: byName,
    bySlug: bySlug,
    countryCard: countryCard,
    easiest: easiest,
    guideLink: guideLink,
    studyLink: studyLink,
    flag: flag,
    esc: esc
  };
})();
