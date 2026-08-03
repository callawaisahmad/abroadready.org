/* =========================================================================
   AbroadReady — AI Advisor engine (shared by the AI Advisor page and the
   floating widget). Every answer is a concise, plain-English LEAD paragraph
   plus optional structured EXTRA (lists, cards, links).
   Requires: scholarships-data.js, scholarships.js (window.SB),
             immigration-data.js (window.IMM).
   ========================================================================= */
(function () {
  "use strict";

  var SB = window.SB;

  function esc(s) { return SB ? SB.esc(s) : String(s); }

  // ---- distinctive keyword → scholarship id ----
  var ALIASES = {
    'chevening': 'chevening', 'commonwealth master': 'commonwealth-masters', 'commonwealth phd': 'commonwealth-phd',
    'commonwealth': 'commonwealth-masters', 'erasmus': 'erasmus-mundus', 'epos': 'daad-epos', 'daad': 'daad-epos',
    'eiffel': 'eiffel-excellence', 'swedish': 'si-sisgp', 'sisgp': 'si-sisgp', 'swiss': 'swiss-government-excellence',
    'fulbright': 'fulbright-foreign-student', 'knight': 'knight-hennessy-scholars', 'hennessy': 'knight-hennessy-scholars',
    'gates': 'gates-cambridge', 'rhodes': 'rhodes-scholarship', 'clarendon': 'clarendon-scholarship-oxford',
    'vanier': 'vanier-canada-graduate-scholarships', 'schwarzman': 'schwarzman-scholars', 'ireland': 'goi-ies', 'goi': 'goi-ies',
    'mext': 'mext-japan', 'japan': 'mext-japan', 'gks': 'gks-korea', 'global korea': 'gks-korea', 'korea': 'gks-korea',
    'turkiye': 'turkiye-burslari', 'turkey': 'turkiye-burslari', 'burslari': 'turkiye-burslari', 'kaust': 'kaust-fellowship',
    'australia awards': 'australia-awards', 'rtp': 'australia-rtp', 'research training': 'australia-rtp',
    'manaaki': 'manaaki-new-zealand', 'new zealand': 'manaaki-new-zealand', 'hungaricum': 'stipendium-hungaricum', 'hungary': 'stipendium-hungaricum',
    'holland': 'holland-scholarship', 'orange tulip': 'orange-tulip-scholarship', 'tulip': 'orange-tulip-scholarship',
    'csc': 'chinese-government-scholarship-csc', 'chinese government': 'chinese-government-scholarship-csc',
    'romania': 'romanian-government-scholarship', 'romanian': 'romanian-government-scholarship',
    'mastercard': 'mastercard-foundation-scholars-program', 'kaist': 'kaist-international-undergraduate-scholarship',
    'bocconi': 'bocconi-merit-international-awards', 'twente': 'university-of-twente-scholarship-uts'
  };

  function findScholarship(q) {
    for (var k in ALIASES) {
      if (q.indexOf(k) !== -1) { var s = SB && SB.byId(ALIASES[k]); if (s) return s; }
    }
    if (SB) {
      for (var i = 0; i < SB.all.length; i++) { if (q.indexOf(SB.all[i].name.toLowerCase()) !== -1) return SB.all[i]; }
    }
    return null;
  }

  function link(s) { return '<a href="scholarship.html?id=' + s.id + '" style="color:var(--primary);font-weight:600;">' + esc(s.name) + ' →</a>'; }
  function ul(items) { return '<ul>' + (items || []).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>'; }

  // Collapse a list of facts into one concise sentence.
  function concise(list, n) {
    list = list || [];
    n = n || 2;
    if (!list.length) return '';
    var t = list.slice(0, n).map(esc).join('; ');
    return list.length > n ? t + ' — plus ' + (list.length - n) + ' more points (full list below).' : t + '.';
  }

  function renderCards(list) {
    if (!list.length) return '';
    var top = list.slice(0, 6);
    return top.map(function (s) {
      var d = SB.deadlineInfo(s), sm = SB.statusMeta(d.status);
      var saved = window.Saved && window.Saved.has(s.id);
      return '<div class="chat-card">' +
        '<div class="cc-top"><span class="cc-flag">' + SB.flagImg(s.country, 22) + '</span>' +
          '<span class="cc-status ' + sm.cls + '">' + sm.text + '</span>' +
          '<button class="cc-heart' + (saved ? ' is-saved' : '') + '" data-save="' + s.id + '" title="Save">' + (saved ? '\u2665' : '\u2661') + '</button></div>' +
        '<div class="cc-name">' + esc(s.name) + '</div>' +
        '<div class="cc-meta">' + esc(s.country) + ' \u00b7 ' + esc(s.fundingType) + (d.hasDate ? ' \u00b7 ' + d.daysLeft + 'd left' : '') + '</div>' +
        '<a class="cc-link" href="scholarship.html?id=' + encodeURIComponent(s.id) + '">View details \u2192</a>' +
        '</div>';
    }).join('');
  }

  // ---- intent helpers ----
  function detectLevels(q) {
    var lv = [];
    if (/bachelor|undergrad/.test(q)) lv.push('Bachelors');
    if (/master|msc|ma\b|mba|postgrad/.test(q)) lv.push('Masters');
    if (/phd|doctora|dphil/.test(q)) lv.push('PhD');
    if (/postdoc|post-doc/.test(q)) lv.push('Postdoc');
    return lv;
  }
  function detectRegionOrCountry(q) {
    var out = { regions: [], countries: [] };
    if (SB) SB.all.forEach(function (s) {
      if (q.indexOf(s.country.toLowerCase()) !== -1 && out.countries.indexOf(s.country) === -1) out.countries.push(s.country);
    });
    ['UK', 'Europe', 'North America', 'Asia', 'Middle East', 'Oceania', 'Global'].forEach(function (r) {
      if (q.indexOf(r.toLowerCase()) !== -1) out.regions.push(r);
    });
    if (/\buk\b|britain|england/.test(q) && out.regions.indexOf('UK') === -1) out.regions.push('UK');
    if (/usa|america|united states|\bus\b/.test(q) && out.regions.indexOf('North America') === -1) out.regions.push('North America');
    return out;
  }
  function detectField(q) {
    if (/\bcs\b|computer|software|\bit\b|engineer|technolog/.test(q)) return 'Engineering & Tech';
    if (/business|econom|manage|finance|mba/.test(q)) return 'Business & Economics';
    if (/law|social|politic|development|public health|education/.test(q)) return 'Social Sciences & Law';
    if (/science|biolog|health|medic|environment|physics|chemistry/.test(q)) return 'Natural & Life Sciences';
    if (/art|humanit|media|music|design/.test(q)) return 'Arts & Humanities';
    return null;
  }

  var HUBS = {
    visa: 'visa-guidance.html', ielts: 'ielts-guidance.html',
    immigration: 'immigration.html', study: 'study.html', results: 'results.html', blog: 'blog.html'
  };

  function answer(raw) {
    var q = ' ' + String(raw || '').toLowerCase().replace(/[?.!,]/g, ' ') + ' ';
    var s = findScholarship(q);
    var IMM = window.IMM;
    var immCountry = IMM ? IMM.findCountry(q) : null;
    var simpleAsk = /simple|simpler|simplif|explain|easy to understand|beginner|overview|in a nutshell|basics|simple terms|straight/.test(q);
    var immAsk = /immigrat|migrat|move to|permanent resid|\bpr\b|citizenship|settle|green card|work permit|work visa|express entry|points system|skilled worker|relocat|\bvisa\b|settlement|naturalis/.test(q);
    var visaAsk = /student visa|study visa|\bvisa\b/.test(q);

    // Greetings
    if (/^\s*(hi|hey|hello|salam|assalam)\b/.test(q) && String(raw).length < 20) {
      return {
        lead: '<p><strong>Hi! \uD83D\uDC4B</strong> I\u2019m your AI advisor for studying and moving abroad. Ask me anything \u2014 scholarships, immigration, PR, study visas or IELTS \u2014 and I\u2019ll give you a short, plain-English answer.</p>',
        extra: ''
      };
    }

    // A specific scholarship is named — answer by intent, always with a short lead.
    if (s) {
      var d = SB.deadlineInfo(s);
      if (/eligib|qualif|can i apply|am i able|do i qualify/.test(q)) {
        return { lead: '<p><strong>Eligibility for ' + esc(s.name) + ' \u2014 in short:</strong> ' + concise(s.eligibility, 3) + '</p>', extra: ul(s.eligibility) + '<p>Full eligibility and how to apply: ' + link(s) + '</p>' };
      }
      if (/document|require|need to submit|paperwork|what do i need/.test(q)) {
        return { lead: '<p><strong>Documents for ' + esc(s.name) + ' \u2014 in short:</strong> you\u2019ll usually need ' + concise(s.documentsRequired, 3) + '</p>', extra: ul(s.documentsRequired) + '<p>' + link(s) + '</p>' };
      }
      if (/deadline|when|due|closing|date/.test(q)) {
        return { lead: '<p><strong>' + esc(s.name) + ' deadline \u2014 in short:</strong> ' + esc(s.deadlineNote || 'it varies by year') + (d.hasDate ? ' (about <strong>' + d.daysLeft + ' days</strong> from now)' : '') + '. Intake: ' + esc(s.intake) + '.</p>', extra: '<p>' + link(s) + '</p>' };
      }
      if (/fee|cost to apply|free|how much to apply/.test(q)) {
        return { lead: '<p><strong>Cost to apply for ' + esc(s.name) + ' \u2014 in short:</strong> ' + (s.isFree ? 'it\u2019s completely <strong>free to apply</strong> \u2014 no application fee.' : 'there is an application fee of <strong>' + esc(s.applicationFee) + '</strong>.') + '</p>', extra: '<p>' + link(s) + '</p>' };
      }
      if (/benefit|cover|fund|stipend|how much|worth|money|salary/.test(q)) {
        return { lead: '<p><strong>What ' + esc(s.name) + ' covers \u2014 in short:</strong> ' + esc(s.fundingSummary) + ' ' + concise(s.benefits, 3) + '</p>', extra: ul(s.benefits) + '<p>' + link(s) + '</p>' };
      }
      if (/before|prepare|ready|prerequisite/.test(q)) {
        return { lead: '<p><strong>Before you apply to ' + esc(s.name) + ' \u2014 in short:</strong> have ' + concise(s.thingsToHaveBeforeApply, 3) + '</p>', extra: ul(s.thingsToHaveBeforeApply) + '<p>' + link(s) + '</p>' };
      }
      return {
        lead: '<p><strong>' + esc(s.name) + ' \u2014 in short:</strong> ' + esc(s.fundingType) + ' ' + (s.levels || []).join('/') + ' in ' + esc(s.country) + '. ' + esc(s.fundingSummary) + '</p>',
        extra: '<p>Fee: ' + (s.isFree ? 'Free' : esc(s.applicationFee)) + ' \u00b7 Deadline: ' + esc(s.deadlineNote || 'varies') + '</p>' +
          '<p>Ask me about its <em>eligibility</em>, <em>documents</em>, <em>benefits</em> or <em>deadline</em> \u2014 or open it: ' + link(s) + '</p>'
      };
    }

    // Visitor / tourist / business (B1/B2-style) visas — temporary, non-immigrant.
    var visitorAsk = /b-?1\b|\bb-?2\b|tourist|visitor|vacation|holiday|sightsee|family visit|visiting family|tourism|travel visa/.test(q);
    if (visitorAsk) {
      var cname = immCountry ? ' in ' + esc(immCountry.name) : '';
      if (/how long|length of stay|how many months|how many days|max stay|maximum stay|duration/.test(q)) {
        return {
          lead: '<p><strong>How long you can stay on a visitor visa \u2014 in short:</strong> usually up to <strong>6 months</strong> per visit' + cname + '. It\u2019s for temporary visits, not long-term living.</p>',
          extra: '<p>To stay longer (study, work or settle) you need a different visa \u2014 see <a href="' + HUBS.visa + '" style="color:var(--primary);font-weight:600;">student visa guidance \u2192</a> or ask me about work/immigration visas.</p>'
        };
      }
      if (/work|job|employ|earn money|study/.test(q)) {
        return {
          lead: '<p><strong>Working or studying on a visitor visa \u2014 in short:</strong> <strong>no</strong> \u2014 a B1/B2-style visitor visa does not allow you to work or study as your main activity' + cname + '. A B1 (business) visitor can attend meetings, but can\u2019t take a job.</p>',
          extra: '<p>For work you need a work visa (e.g. the US H-1B); for study, a student visa (F-1). See <a href="' + HUBS.visa + '" style="color:var(--primary);font-weight:600;">student visa guidance \u2192</a>.</p>'
        };
      }
      if (/apply|process|how to get|fee|cost|document|interview|appointment|ds-?160|obtain/.test(q)) {
        return {
          lead: '<p><strong>Getting a visitor visa \u2014 in short:</strong> fill in the online application, pay the fee (US$185 for the US), book an appointment and attend the visa interview with your passport and supporting documents' + cname + '.</p>',
          extra: '<p>Approval is not a guarantee of entry \u2014 border officers make the final call on the day. See <a href="' + HUBS.visa + '" style="color:var(--primary);font-weight:600;">student visa guidance \u2192</a>.</p>'
        };
      }
      if (/difference|vs\b|green card|permanent|immigrat|\bpr\b|settle/.test(q)) {
        return {
          lead: '<p><strong>Visitor visa vs immigration \u2014 in short:</strong> a B1/B2-style visitor visa is <strong>temporary</strong> (just a visit), while immigration/PR means <strong>permanent</strong> residency. A visitor visa is not a route to a green card' + cname + '.</p>',
          extra: '<p>For permanent options ask <em>"green card"</em> or <em>"immigrate to ' + (immCountry ? esc(immCountry.name) : 'Canada') + '"</em>.</p>'
        };
      }
      return {
        lead: '<p><strong>B1/B2 visitor visa \u2014 in short:</strong> it\u2019s a <strong>temporary</strong> visa for visiting \u2014 B1 for business (meetings, conferences) and B2 for tourism, family visits or short courses' + cname + '. It does <strong>not</strong> let you work or study long-term, and it\u2019s not a path to permanent residency.</p>',
        extra: '<p>You usually get up to <strong>6 months</strong> per visit. To apply: online form \u2192 fee (US$185 for the US) \u2192 embassy interview. Even with a visa, border officers decide whether you enter.</p>' +
          '<p><a href="' + HUBS.visa + '" style="color:var(--primary);font-weight:600;">Student visa guidance \u2192</a> \u00b7 <a href="' + HUBS.immigration + '" style="color:var(--primary);font-weight:600;">Immigration &amp; work visas \u2192</a></p>'
      };
    }

    // Immigration / visa / PR knowledge
    if (immAsk) {
      if (visaAsk && /student|study/.test(q)) {
        var vExtra = '<p><a href="' + HUBS.visa + '" style="color:var(--primary);font-weight:600;">Student visa guidance \u2192</a>';
        if (immCountry) vExtra += ' \u00b7 ' + IMM.studyLink(immCountry) + ' \u00b7 ' + IMM.guideLink(immCountry);
        return {
          lead: '<p><strong>Student visa \u2014 in short:</strong> you\u2019ll need your admission letter, proof of funds and a valid passport; the exact documents, fees and timeline depend on your destination.</p>',
          extra: vExtra + '</p>'
        };
      }
      if (visaAsk && /what is a visa|visa types|what are visas|visa meaning|what does a visa|whats a visa/.test(q) && !immCountry) {
        return {
          lead: '<p><strong>What is a visa \u2014 in short:</strong> a visa is official permission from a country that lets you enter and stay for a specific purpose and time \u2014 for example to study, work, or just visit.</p>',
          extra: '<p>Common types: <strong>student visa</strong> (study), <strong>work visa</strong> (job), <strong>visitor/tourist visa</strong> (short visits) and <strong>PR/immigration</strong> (permanent). Ask about any of these \u2014 or see <a href="' + HUBS.visa + '" style="color:var(--primary);font-weight:600;">student visa guidance \u2192</a>.</p>'
        };
      }
      if (visaAsk && !immCountry) {
        return {
          lead: '<p><strong>Visa guidance \u2014 in short:</strong> we cover both sides \u2014 student visas for studying abroad, and work/immigration visas for moving permanently.</p>',
          extra: '<p><a href="' + HUBS.visa + '" style="color:var(--primary);font-weight:600;">Student visa guidance \u2192</a> \u00b7 <a href="' + HUBS.immigration + '" style="color:var(--primary);font-weight:600;">Immigration &amp; work visas \u2192</a></p>'
        };
      }
      if (/easy|easiest|which country.*(best|easy|easiest)|where.*migrat|best country.*migrat|country is.*migrat/.test(q)) {
        var rank = [
          ['Canada', 'points-based Express Entry, no job offer needed, PR in ~6\u201312 months'],
          ['Germany', 'EU Blue Card / Opportunity Card, PR in 21\u201327 months'],
          ['Australia', 'points visas 189/190 with invites at 85\u201395 points'],
          ['New Zealand', 'Green List occupations can go Straight-to-Residence'],
          ['Ireland', 'Critical Skills permit and Europe\u2019s fastest citizenship (5-in-9)'],
          ['Netherlands', 'Highly Skilled Migrant route + 30% tax ruling']
        ];
        var lis = rank.map(function (r) {
          var c = IMM.byName(r[0]);
          return '<li><strong>' + esc(r[0]) + '</strong> \u2014 ' + esc(r[1]) + ' (' + IMM.guideLink(c) + ')</li>';
        }).join('');
        return {
          lead: '<p><strong>Easiest countries to migrate to \u2014 in short:</strong> for skilled professionals the most accessible are Canada, Germany, Australia, New Zealand, Ireland and the Netherlands. The hardest are the USA (lottery + backlogs) and Switzerland (strict quotas).</p>',
          extra: '<ol>' + lis + '</ol>' +
            '<p>Start with a no-job-offer points path: ' + IMM.guideLink(IMM.byName('Canada')) + ' or ' + IMM.guideLink(IMM.byName('Australia')) + '. Browse all 13: <a href="' + HUBS.immigration + '" style="color:var(--primary);font-weight:600;">immigration guides \u2192</a></p>'
        };
      }
      if (immCountry) {
        var c = immCountry;
        return {
          lead: '<p><strong>Immigrating to ' + esc(c.name) + ' \u2014 in short:</strong> ' + (simpleAsk ? esc(c.simple) : esc(c.blurb)) + ' Main routes: ' + esc(c.programs) + '. Difficulty: ' + esc(c.ease) + '.</p>',
          extra: '<p><strong>Fees:</strong> ' + esc(c.fees) + '.</p><p>' + IMM.guideLink(c) + ' \u00b7 ' + IMM.studyLink(c) + ' \u00b7 <a href="' + HUBS.immigration + '" style="color:var(--primary);font-weight:600;">All immigration guides \u2192</a></p>'
        };
      }
      if (/green card|h-?1b/.test(q)) {
        var us = IMM.byName('United States');
        return {
          lead: '<p><strong>US green card \u2014 in short:</strong> ' + esc(us.simple) + '</p>',
          extra: '<p>' + IMM.guideLink(us) + ' \u00b7 <a href="' + HUBS.immigration + '" style="color:var(--primary);font-weight:600;">All immigration guides \u2192</a></p>'
        };
      }
      return {
        lead: '<p><strong>Immigration guides \u2014 in short:</strong> we have 2026 guides for 13 countries \u2014 points systems, work visas, PR and citizenship. Pick one:</p>',
        extra: '<div class="chat-cards">' + IMM.countries.map(function (cc) {
          return '<div class="chat-card"><div class="cc-top">' + IMM.flag(cc, 22) + '</div>' +
            '<div class="cc-name">' + esc(cc.name) + '</div>' +
            '<a class="cc-link" href="immigrate-to-' + cc.slug + '.html">View guide \u2192</a></div>';
        }).join('') + '</div>'
      };
    }

    // IELTS / TOEFL
    if (/ielts|toefl|band score|english test|english language test/.test(q) && !/no ielts|without ielts/.test(q)) {
      return {
        lead: '<p><strong>IELTS \u2014 in short:</strong> it\u2019s scored from 1 to 9, and most universities ask for a <strong>6.0\u20137.0</strong> overall (no section below 6.0). It has four parts: Listening, Reading, Writing and Speaking.</p>',
        extra: '<p><a href="' + HUBS.ielts + '" style="color:var(--primary);font-weight:600;">Full IELTS guidance \u2192</a> \u00b7 <a href="toefl-vs-ielts-which-test.html" style="color:var(--primary);font-weight:600;">TOEFL vs IELTS \u2192</a></p>'
      };
    }

    // Essay / SOP help
    if (/sop|statement of purpose|essay|leadership|motivation letter|personal statement|write/.test(q)) {
      return {
        lead: '<p><strong>Writing your essay / SOP \u2014 in short:</strong> open with a specific story, use the <strong>STAR method</strong> (Situation, Task, Action, Result) for leadership examples, and tie every paragraph back to <em>why this scholarship</em> and <em>your future plan</em>.</p>',
        extra: ul(['Open with a specific story, not a generic statement.', 'Quantify impact ("cut deployment time 80%") wherever you can.']) +
          '<p>Draft and score it in the <a href="sop-builder.html" style="color:var(--primary);font-weight:600;">SOP Builder \u2192</a></p>'
      };
    }

    // "No IELTS" advice
    if (/no ielts|without ielts|ielts waiver|english test|without english/.test(q)) {
      return {
        lead: '<p><strong>No IELTS? \u2014 in short:</strong> many European programmes accept a <strong>medium-of-instruction letter</strong> instead, and some scholarships (like Chevening) no longer set their own English requirement.</p>',
        extra: '<p>Look at <a href="' + HUBS.results + '?region=Europe" style="color:var(--primary);font-weight:600;">scholarships in Europe \u2192</a> and always check the specific programme\u2019s language rule.</p>'
      };
    }

    // Studying in a specific country
    if (/study in|study abroad/.test(q) && immCountry) {
      return {
        lead: '<p><strong>Studying in ' + esc(immCountry.name) + ' \u2014 in short:</strong> our 2026 guide covers the best universities, tuition costs, the student visa route and available scholarships.</p>',
        extra: '<p>' + IMM.studyLink(immCountry) + ' \u00b7 ' + IMM.guideLink(immCountry) + ' \u00b7 <a href="' + HUBS.study + '" style="color:var(--primary);font-weight:600;">All study destinations \u2192</a></p>' +
          '<p>Want funding? Ask <em>"scholarships in ' + esc(immCountry.name) + '"</em>.</p>'
      };
    }

    // Closing soon
    if (/closing|soon|urgent|earliest|nearest deadline|expiring/.test(q)) {
      var closing = SB.all.filter(function (x) { return SB.deadlineInfo(x).status === 'closing'; })
        .sort(function (a, b) { return SB.deadlineInfo(a).daysLeft - SB.deadlineInfo(b).daysLeft; });
      if (!closing.length) {
        return {
          lead: '<p><strong>Closing soon \u2014 in short:</strong> nothing is in the final 30-day window right now.</p>',
          extra: '<p>Browse by soonest deadline: <a href="' + HUBS.results + '" style="color:var(--primary);font-weight:600;">all scholarships \u2192</a></p>'
        };
      }
      return {
        lead: '<p><strong>Closing soon \u2014 in short:</strong> ' + closing.length + ' scholarship' + (closing.length === 1 ? ' is' : 's are') + ' in their final 30-day window.</p>',
        extra: renderCards(closing)
      };
    }

    // Search by level / region / field / funding
    var levels = detectLevels(q);
    var loc = detectRegionOrCountry(q);
    var field = detectField(q);
    var wantFunded = /fully funded|full funding|full scholarship|fully-funded/.test(q);
    var wantFree = /no fee|free to apply|without fee|fee-free/.test(q);

    if (levels.length || loc.regions.length || loc.countries.length || field || wantFunded || wantFree) {
      var list = SB.all.filter(function (x) {
        if (levels.length && !levels.some(function (l) { return (x.levels || []).indexOf(l) !== -1; })) return false;
        if (loc.regions.length && loc.regions.indexOf(x.region) === -1 && !loc.countries.length) return false;
        if (loc.countries.length && loc.countries.indexOf(x.country) === -1 && !loc.regions.length) return false;
        if (loc.regions.length && loc.countries.length && loc.regions.indexOf(x.region) === -1 && loc.countries.indexOf(x.country) === -1) return false;
        if (field && (x.fieldTags || []).indexOf(field) === -1 && (x.fieldTags || []).indexOf('All fields') === -1) return false;
        if (wantFunded && x.fundingType !== 'Fully Funded') return false;
        if (wantFree && !x.isFree) return false;
        return true;
      });
      var parts = [];
      if (wantFunded) parts.push('fully funded');
      if (levels.length) parts.push(levels.join('/'));
      if (field) parts.push(field.toLowerCase());
      if (loc.countries.length) parts.push('in ' + loc.countries.join('/'));
      else if (loc.regions.length) parts.push('in ' + loc.regions.join('/'));
      if (wantFree) parts.push('free to apply');

      if (!list.length) {
        return {
          lead: '<p><strong>' + (parts.join(', ') || 'That') + ' \u2014 in short:</strong> I couldn\u2019t find an exact match, but here\u2019s the closest.</p>',
          extra: '<p>Try <a href="' + HUBS.results + '" style="color:var(--primary);font-weight:600;">browsing all scholarships \u2192</a> or ask about a level, country or field.</p>'
        };
      }
      return {
        lead: '<p><strong>' + (parts.join(', ') || 'That') + ' \u2014 in short:</strong> I found <strong>' + list.length + '</strong> matching scholarship' + (list.length === 1 ? '' : 's') + (list.length > 6 ? ' (top 6 shown)' : '') + '.</p>',
        extra: renderCards(list)
      };
    }

    // Fallback
    return {
      lead: '<p><strong>Here\u2019s how I can help \u2014 in short:</strong> I cover scholarships, immigration, PR, studying abroad, visas and IELTS \u2014 in plain, to-the-point language.</p>',
      extra: '<ul>' +
        '<li><em>"Am I eligible for Fulbright?"</em> \u2014 any scholarship by name</li>' +
        '<li><em>"fully funded PhD in Europe"</em> \u2014 matches by level, field, region</li>' +
        '<li><em>"immigrate to Canada"</em> or <em>"USA PR in simple terms"</em> \u2014 immigration guides</li>' +
        '<li><em>"which country is easy to migrate to"</em> \u2014 a ranked comparison</li>' +
        '<li><em>"study in Germany"</em>, <em>"student visa"</em>, <em>"IELTS score"</em> \u2014 our guides</li>' +
        '</ul>' +
        '<p>Browse: <a href="' + HUBS.results + '" style="color:var(--primary);font-weight:600;">scholarships \u2192</a> \u00b7 <a href="' + HUBS.immigration + '" style="color:var(--primary);font-weight:600;">immigration \u2192</a> \u00b7 <a href="' + HUBS.blog + '" style="color:var(--primary);font-weight:600;">blog \u2192</a></p>'
    };
  }

  function renderAnswer(ans) {
    var h = '';
    if (ans && ans.lead) h += '<div class="msg-lead">' + ans.lead + '</div>';
    if (ans && ans.extra) h += '<div class="msg-extra">' + ans.extra + '</div>';
    return h;
  }

  function greeting() {
    return {
      lead: '<p><strong>Hi! \uD83D\uDC4B</strong> I\u2019m your AI advisor for studying and moving abroad. Ask me anything \u2014 scholarships, immigration, PR, study visas or IELTS \u2014 and I\u2019ll give you a short, plain-English answer.</p>',
      extra: ''
    };
  }

  var CHIPS = [
    'Am I eligible for Chevening?',
    'Fully funded PhD scholarships',
    'Which country is easiest to migrate to?',
    'Explain US immigration in simple terms',
    'Tell me about Canada PR',
    'What IELTS score do I need?',
    'How do I study in Germany?',
    'Is Fulbright free to apply?'
  ];

  window.ADVISOR = {
    answer: answer,
    renderAnswer: renderAnswer,
    greeting: greeting,
    chips: CHIPS,
    esc: esc,
    concise: concise
  };
})();
