/* =========================================================================
   AbroadReady — AI Advisor engine (shared by the AI Advisor page and the
   floating widget). Every answer is a concise, plain-English LEAD paragraph
   plus optional structured EXTRA (lists, cards, links).

   Query-first: `classify()` tags EVERY question with its intent — greeting,
   named scholarship, visitor/student/work visa, PR & immigration, IELTS,
   essay, study & costs, or site tools — and the dispatch below answers the
   strongest matching intent in priority order, so a question is never
   shoehorned into the scholarship path.
   Requires: scholarships-data.js, scholarships.js (window.SB),
             immigration-data.js (window.IMM).
   ========================================================================= */
(function () {
  "use strict";

  var SB = window.SB;

  function esc(s) { return SB ? SB.esc(s) : String(s); }

  function pmtLink(hub, label) {
    return '<a href="' + hub + '" style="color:var(--primary);font-weight:600;">' + label + ' \u2192</a>';
  }

  // Links to top-level files (index.html) need a ../ prefix from the
  // pages/ folder but no prefix when running inside the root-level widget.
  function siteRoot(p) {
    return (window.location.pathname.indexOf('/pages/') !== -1 ? '../' : '') + p;
  }

  // Pull the lines of a list (eligibility / documents) that match a regex.
  function pickLines(list, re) {
    return (list || []).filter(function (l) { return re.test(l); });
  }

  // Human phrasing for the stored competition level.
  function compPhrase(s) {
    var c = s.competition || '';
    if (c === 'Very High') return 'rated <strong>very high</strong> \u2014 thousands apply for a handful of spots, so your SOP and references really matter.';
    if (c === 'High') return '<strong>high</strong> \u2014 a strong SOP, references and proof of impact will set you apart.';
    if (c === 'Moderate') return '<strong>moderate</strong> \u2014 a clean, complete application has a real chance.';
    return 'intense \u2014 apply early and make your SOP count.';
  }

  // Part-time work while studying (used by both the visa and study paths).
  function partTimeAns() {
    return {
      lead: '<p><strong>Working while you study \u2014 in short:</strong> most student visas allow <strong>10\u201320 hours</strong> per week during term and full-time in holidays \u2014 Canada, Australia, Germany, UK and NZ. The US F-1 visa is stricter (on-campus mostly).</p>',
      extra: '<p>' + pmtLink(HUBS.visa, 'Student visa guidance \u2192') + '</p>'
    };
  }

  // Ranked easiest/hardest destinations for skilled migration.
  function countryRanking() {
    var IMM = window.IMM;
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
        '<p>Start with a no-job-offer points path: ' + IMM.guideLink(IMM.byName('Canada')) + ' or ' + IMM.guideLink(IMM.byName('Australia')) + '. Browse all guides: ' + pmtLink(HUBS.immigration, 'immigration guides \u2192') + '</p>'
    };
  }

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

  function link(s) { return '<a href="scholarship?id=' + s.id + '" style="color:var(--primary);font-weight:600;">' + esc(s.name) + ' →</a>'; }
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
        '<a class="cc-link" href="scholarship?id=' + encodeURIComponent(s.id) + '">View details \u2192</a>' +
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
    visa: 'visa-guidance', ielts: 'ielts-guidance',
    immigration: 'immigration', study: 'study', results: 'results', blog: 'blog'
  };

  // ============================================================
  //  STEP 1 — UNDERSTAND THE QUERY: tag every question with its
  //  intent before any answer is chosen.
  // ============================================================
  function classify(q, raw, s) {
    var t = {};
    t.greeting = /^\s*(hi|hey|hello|salam|assalam)\b/.test(q) && String(raw).length < 20;
    t.thanks = /^(thanks|thank you|thx|ty|tysm|great|awesome|nice|perfect|ok|okay)\b/.test(q) && String(raw).length < 30;
    t.named = !!s;
    t.visitor = /b-?1\b|\bb-?2\b|tourist|visitor|vacation|holiday|sightsee|family visit|visiting family|tourism|travel visa/.test(q);
    t.noIelts = /no ielts|without ielts|ielts waiver|without english/.test(q);
    t.ielts = /ielts|toefl|band score|english test|english language test|pte|duolingo|english.*(score|proficien)|score do i need/.test(q);
    t.sopBuilder = /sop builder|use.*sop builder|open.*sop builder/.test(q);
    t.sop = /sop|statement of purpose|essay|leadership|motivation letter|personal statement|write/.test(q);
    t.postStudy = /post.?study|psw\b|\bopt\b|graduate route|work.*after.*(study|graduate|degree|master)|stay.*after.*(study|graduate|degree)/.test(q);
    t.partTime = /part.?time|work while|while.*(study|studying)|hours.*(week|work)|student.*(job|work)|work.*(during|breaks?)/.test(q);
    t.studentVisa = /student visa|study visa|study permit|student permit|f-?1\b|study.*visa|visa.*study|visa.*student/.test(q);
    t.workVisa = /work visa|work permit|job offer|skilled worker visa|blue card|employer.*(sponsor|visa)|job.*visa/.test(q);
    t.h1b = /h-?1b/.test(q);
    t.greenCard = /green card/.test(q);
    t.visa = /\bvisa\b|entry permit|travel permit/.test(q);
    t.immigration = /immigrat|migrat|move to|permanent resid|\bpr\b|citizenship|settle|express entry|points system|skilled worker|relocat|settlement|naturalis|spouse|wife|husband|partner|dependents|family|dual citizenship|draw/.test(q);
    t.scholarship = /scholarship|fellowship|funding|grant|stipend|bursary|award/.test(q);
    t.interview = /visa.*interview|interview.*visa|embassy.*interview|interview.*embassy/.test(q);
    t.refusal = /(visa|application|entry).*(refus|denied|reject)|(refus|denied|reject).*(visa|entry)/.test(q);
    t.cost = /cost|tuition|fees|expensive|how much.*(study|cost)|price/.test(q);
    t.study = /study|uni|university|college|student|degree|abroad|master|undergrad|school/.test(q);
    t.accommodation = /accommodation|housing|dormitor|where.*(live|stay)|rent|rooms?/.test(q);
    t.englishTaught = /english.?taught|programs? in english|degrees? in english|taught in english/.test(q);
    t.freeStudy = /study.*(free|for free|without tuition|tuition.?free)|free.*(education|study|tuition|university)/.test(q);
    t.worth = /worth it|is it worth|should i (study|go abroad|move)/.test(q);
    t.closing = /closing|soon|urgent|earliest|nearest deadline|expiring/.test(q);
    t.quiz = /quiz/.test(q);
    t.save = /save|saved|bookmark|heart/.test(q);
    t.contact = /contact|feedback|report.*(bug|issue)|complaint/.test(q);
    t.blocked = /blocked account|sperrkonto|blocked amount|blocked funds/.test(q);
    t.capability = /what can you (do|help|answer|tell)|how do you (work|help)|what are you|who are you|what do you know|help me|what topics|what questions/.test(q);
    t.easyCountry = /(easiest|easy) (country|to migrate|to immigrate|to move|to get a (work )?visa)|which country.*(easy|easiest|best|migrat|visa|pr|move)|best country.*(migrat|work|visa|pr)|where.*(migrate|immigrate|move)/.test(q);
    t.hardest = /hardest|most difficult|strictest|hard to (migrat|immigrat)/.test(q);
    return t;
  }

  // ============================================================
  //  STEP 2 — ANSWER: dispatch the strongest matching intent.
  // ============================================================
  function answer(raw) {
    var q = ' ' + String(raw || '').toLowerCase().replace(/[?.!,]/g, ' ') + ' ';
    var s = findScholarship(q);
    var IMM = window.IMM;
    var immCountry = IMM ? IMM.findCountry(q) : null;
    var simpleAsk = /simple|simpler|simplif|explain|easy to understand|beginner|overview|in a nutshell|basics|simple terms|straight/.test(q);
    var t = classify(q, raw, s);

    // 1) Greetings
    if (t.greeting) {
      return {
        lead: '<p><strong>Hi! \uD83D\uDC4B</strong> I\u2019m your AI advisor for studying and moving abroad. Ask me anything \u2014 scholarships, immigration, PR, study visas or IELTS \u2014 and I\u2019ll give you a short, plain-English answer.</p>',
        extra: ''
      };
    }

    // 2) Quick acknowledgements
    if (t.thanks) {
      return {
        lead: '<p>You\u2019re welcome! \uD83D\uDC4D Anything else about scholarships, visas, PR or studying abroad \u2014 just ask.</p>',
        extra: ''
      };
    }

    // 3) A specific scholarship is named — answer by intent, always with a short lead.
    if (t.named) {
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
      if (/how (do|can|should) i apply|how to apply|application process/.test(q)) {
        var applyPre = (s.thingsToHaveBeforeApply || []).slice(0, 4);
        return {
          lead: '<p><strong>How to apply for ' + esc(s.name) + ' \u2014 in short:</strong> check you\u2019re eligible, prepare the required documents, and submit your application on the <strong>official portal</strong> before the deadline.</p>',
          extra: (applyPre.length ? '<p>Have ready:</p>' + ul(applyPre) : '') + '<p>' + link(s) + '</p>'
        };
      }
      var eLines = pickLines((s.eligibility || []).concat(s.documentsRequired || []), /ielts|toefl|english|language/);
      if (/ielts|toefl|english.*(require|test|level|profici)|language.*(require|test)|score do i need/.test(q)) {
        return {
          lead: '<p><strong>English requirement for ' + esc(s.name) + ' \u2014 in short:</strong> ' + (eLines.length ? concise(eLines, 2) : 'you\u2019ll usually need an English test (IELTS/TOEFL) or a medium-of-instruction letter \u2014 the exact rule varies by programme.') + '</p>',
          extra: eLines.length ? ul(eLines) : '<p>' + link(s) + '</p>'
        };
      }
      var gLines = pickLines(s.eligibility, /gpa|grade|rank|top \d|class|marks/);
      if (/gpa|grade|marks|academic record|top \d/.test(q)) {
        return {
          lead: '<p><strong>Academic / GPA requirement for ' + esc(s.name) + ' \u2014 in short:</strong> ' + (gLines.length ? concise(gLines, 2) : 'no published GPA cut-off \u2014 eligibility focuses on citizenship, experience and programme fit.') + '</p>',
          extra: gLines.length ? ul(gLines) : '<p>Strong academics still help, but a great SOP and references can outweigh an average GPA. ' + link(s) + '</p>'
        };
      }
      var aLines = pickLines(s.eligibility, /age/);
      if (/age limit|age.*(requirement|restriction|matter)|how old|too old/.test(q)) {
        return {
          lead: '<p><strong>Age limit for ' + esc(s.name) + ' \u2014 in short:</strong> ' + (aLines.length ? concise(aLines, 2) : 'no hard age limit is published \u2014 eligibility focuses on citizenship and experience.') + '</p>',
          extra: aLines.length ? ul(aLines) : '<p>' + link(s) + '</p>'
        };
      }
      if (/acceptance|chances?|how hard|competitive|selecti?on rate|win/.test(q)) {
        return {
          lead: '<p><strong>How hard is it to win ' + esc(s.name) + '? \u2014 in short:</strong> ' + compPhrase(s) + '</p>',
          extra: '<p>Competition is rated <strong>' + esc(s.competition || 'high') + '</strong> \u2014 a standout SOP, strong references and proof of impact give you the best shot. ' + link(s) + '</p>'
        };
      }
      if (/select|shortlist|interview|how.*chosen|stage|panel|review|evaluat/.test(q)) {
        return {
          lead: '<p><strong>Selection for ' + esc(s.name) + ' \u2014 in short:</strong> applications are checked against eligibility, then shortlisted; shortlisted candidates often face an <strong>interview</strong>.</p>',
          extra: '<p>Practice motivation, leadership, future plans and impact questions \u2014 see ' + pmtLink('scholarship-interview-questions-how-to-answer', 'interview prep \u2192') + ' or ask <em>"how to prepare for the interview"</em>.</p>'
        };
      }
      if (/renew|second year|extend|continu/.test(q)) {
        return {
          lead: '<p><strong>Duration &amp; renewal for ' + esc(s.name) + ' \u2014 in short:</strong> ' + esc(s.durationNote || 'it covers the standard duration of your programme.') + '</p>',
          extra: '<p>Funding type: ' + esc(s.fundingType) + '. ' + link(s) + '</p>'
        };
      }
      if (/repay|pay back|return|refund|loan/.test(q)) {
        return {
          lead: '<p><strong>Do you repay ' + esc(s.name) + '? \u2014 in short:</strong> no \u2014 a scholarship is a <strong>grant</strong>, not a loan, so you don\u2019t pay the money back.</p>',
          extra: '<p>It\u2019s ' + esc(s.fundingType) + ' \u2014 ' + esc(s.fundingSummary) + '</p>'
        };
      }
      if (/multiple|how many.*(apply|scholarship)|apply.*(several|more than one)/.test(q)) {
        return {
          lead: '<p><strong>Applying to multiple scholarships \u2014 in short:</strong> yes \u2014 apply to as many as you qualify for. Just don\u2019t reuse one SOP; tailor each one.</p>',
          extra: '<p>For ' + esc(s.name) + ': ' + link(s) + '</p>'
        };
      }
      if (/result|announc|when.*(know|out)|outcome|decision/.test(q)) {
        return {
          lead: '<p><strong>When you hear back \u2014 in short:</strong> results usually come a few weeks to a few months after the deadline; shortlisted candidates may be interviewed first.</p>',
          extra: '<p>For ' + esc(s.name) + ': deadline ' + esc(s.deadlineNote || 'varies') + ' \u00b7 ' + link(s) + '</p>'
        };
      }
      return {
        lead: '<p><strong>' + esc(s.name) + ' \u2014 in short:</strong> ' + esc(s.fundingType) + ' ' + (s.levels || []).join('/') + ' in ' + esc(s.country) + '. ' + esc(s.fundingSummary) + '</p>',
        extra: '<p>Fee: ' + (s.isFree ? 'Free' : esc(s.applicationFee)) + ' \u00b7 Deadline: ' + esc(s.deadlineNote || 'varies') + ' \u00b7 Competition: ' + esc(s.competition || 'high') + '</p>' +
          '<p>Ask me about its <em>eligibility</em>, <em>documents</em>, <em>benefits</em>, <em>deadline</em> or <em>interview</em> \u2014 or open it: ' + link(s) + '</p>'
      };
    }

    // 4) Visitor / tourist / business (B1/B2-style) visas — temporary, non-immigrant.
    if (t.visitor) {
      var cname = immCountry ? ' in ' + esc(immCountry.name) : '';
      if (/how long|length of stay|how many months|how many days|max stay|maximum stay|duration/.test(q)) {
        return {
          lead: '<p><strong>How long you can stay on a visitor visa \u2014 in short:</strong> usually up to <strong>6 months</strong> per visit' + cname + '. It\u2019s for temporary visits, not long-term living.</p>',
          extra: '<p>To stay longer (study, work or settle) you need a different visa \u2014 see ' + pmtLink(HUBS.visa, 'student visa guidance \u2192') + ' or ask me about work/immigration visas.</p>'
        };
      }
      if (/work|job|employ|earn money|study/.test(q)) {
        return {
          lead: '<p><strong>Working or studying on a visitor visa \u2014 in short:</strong> <strong>no</strong> \u2014 a B1/B2-style visitor visa does not allow you to work or study as your main activity' + cname + '. A B1 (business) visitor can attend meetings, but can\u2019t take a job.</p>',
          extra: '<p>For work you need a work visa (e.g. the US H-1B); for study, a student visa (F-1). See ' + pmtLink(HUBS.visa, 'student visa guidance \u2192') + '.</p>'
        };
      }
      if (/apply|process|how to get|fee|cost|document|interview|appointment|ds-?160|obtain/.test(q)) {
        return {
          lead: '<p><strong>Getting a visitor visa \u2014 in short:</strong> fill in the online application, pay the fee (US$185 for the US), book an appointment and attend the visa interview with your passport and supporting documents' + cname + '.</p>',
          extra: '<p>Approval is not a guarantee of entry \u2014 border officers make the final call on the day. See ' + pmtLink(HUBS.visa, 'student visa guidance \u2192') + '.</p>'
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
          '<p>' + pmtLink(HUBS.visa, 'Student visa guidance \u2192') + ' \u00b7 ' + pmtLink(HUBS.immigration, 'Immigration &amp; work visas \u2192') + '</p>'
      };
    }

    // 5) English tests (IELTS / TOEFL / PTE / Duolingo) — before visas so
    //    "IELTS for Canada PR" answers the English test, not the PR blurb.
    if (t.noIelts) {
      return {
        lead: '<p><strong>No IELTS? \u2014 in short:</strong> many European programmes accept a <strong>medium-of-instruction letter</strong> instead, and some scholarships (like Chevening) no longer set their own English requirement.</p>',
        extra: '<p>Look at ' + pmtLink(HUBS.results + '?region=Europe', 'scholarships in Europe \u2192') + ' and always check the specific programme\u2019s language rule.</p>'
      };
    }
    if (t.ielts) {
      if (/valid|expir|how long.*(ielts|test)/.test(q)) {
        return {
          lead: '<p><strong>How long IELTS is valid \u2014 in short:</strong> <strong>2 years</strong> from your test date. After that, most universities won\u2019t accept it.</p>',
          extra: '<p>' + pmtLink(HUBS.ielts, 'Full IELTS guidance \u2192') + '</p>'
        };
      }
      if (/book|register|test date|center|centre|fee|cost|how.*take.*(ielts|test)|where.*(ielts|test)/.test(q)) {
        return {
          lead: '<p><strong>Booking IELTS \u2014 in short:</strong> register online at <strong>ielts.org</strong> or the British Council / IDP; the test costs roughly US$220\u2013260 and results come in about 13 days.</p>',
          extra: '<p>Book 1\u20132 months ahead \u2014 slots fill fast. ' + pmtLink(HUBS.ielts, 'IELTS guidance \u2192') + '</p>'
        };
      }
      if (/pte|duolingo/.test(q)) {
        return {
          lead: '<p><strong>PTE and Duolingo \u2014 in short:</strong> both are widely accepted as IELTS alternatives \u2014 PTE Academic is scored 10\u201390, and Duolingo English Test is online. Check each university\u2019s accepted tests and minimum scores.</p>',
          extra: '<p>' + pmtLink('toefl-vs-ielts-which-test', 'TOEFL vs IELTS \u2192') + ' \u00b7 ' + pmtLink(HUBS.ielts, 'IELTS guidance \u2192') + '</p>'
        };
      }
      return {
        lead: '<p><strong>IELTS \u2014 in short:</strong> it\u2019s scored from 1 to 9, and most universities ask for a <strong>6.0\u20137.0</strong> overall (no section below 6.0). It has four parts: Listening, Reading, Writing and Speaking.</p>',
        extra: '<p>' + pmtLink(HUBS.ielts, 'Full IELTS guidance \u2192') + ' \u00b7 ' + pmtLink('toefl-vs-ielts-which-test', 'TOEFL vs IELTS \u2192') + '</p>'
      };
    }

    // 6) SOP / essay writing
    if (t.sopBuilder) {
      return {
        lead: '<p><strong>SOP Builder \u2014 in short:</strong> our free tool walks you through a winning statement of purpose step by step, with a built-in score.</p>',
        extra: '<p>' + pmtLink('sop-builder', 'Open the SOP Builder \u2192') + '</p>'
      };
    }
    if (t.sop) {
      return {
        lead: '<p><strong>Writing your essay / SOP \u2014 in short:</strong> open with a specific story, use the <strong>STAR method</strong> (Situation, Task, Action, Result) for leadership examples, and tie every paragraph back to <em>why this scholarship</em> and <em>your future plan</em>.</p>',
        extra: ul(['Open with a specific story, not a generic statement.', 'Quantify impact ("cut deployment time 80%") wherever you can.']) +
          '<p>Draft and score it in the ' + pmtLink('sop-builder', 'SOP Builder \u2192') + '</p>'
      };
    }

    // 7) Working after you graduate
    if (t.postStudy) {
      return {
        lead: '<p><strong>Working after you graduate \u2014 in short:</strong> most major destinations give you <strong>1\u20133 years</strong> after your degree \u2014 Canada (PGWP up to 3 yrs), UK (Graduate Route 2 yrs), Australia (up to 4 yrs for some), US (OPT 1\u20133 yrs).</p>',
        extra: '<p>' + (immCountry ? IMM.studyLink(immCountry) + ' \u00b7 ' + IMM.guideLink(immCountry) : pmtLink(HUBS.visa, 'Student visa guidance \u2192')) + '</p>'
      };
    }

    // 8) Part-time work while studying
    if (t.partTime && (t.studentVisa || t.study || t.visa)) {
      return partTimeAns();
    }

    // 9) Easiest / hardest countries (skilled migration & work-visa comparisons)
    if (t.easyCountry && !t.studentVisa && !/fastest|quickest/.test(q)) {
      return countryRanking();
    }
    if (t.hardest) {
      return {
        lead: '<p><strong>Hardest countries to migrate to \u2014 in short:</strong> the USA (H-1B lottery + decade-long green-card backlogs for India/China) and Switzerland (strict work quotas) are the toughest for most applicants.</p>',
        extra: '<p>Easier alternatives: ' + IMM.guideLink(IMM.byName('Canada')) + ' or ' + IMM.guideLink(IMM.byName('Germany')) + ' points routes \u2014 or ask <em>"which country is easiest to migrate to"</em>.</p>'
      };
    }

    // 10) German blocked account (Sperrkonto) & general proof of funds
    var fundsQ = t.blocked || /proof of funds|bank statement|financial.*(proof|evidence|support|requirement)|how much money do i need|how much.*(need to show|to show|deposit|in my account)|savings.*(need|required)/.test(q);
    var deRef = IMM && IMM.byName('Germany');
    if (t.blocked || (fundsQ && /germany|german|deutschland|deutsch/.test(q))) {
      return {
        lead: '<p><strong>German blocked account (Sperrkonto) \u2014 in short:</strong> for 2026 you need <strong>\u20AC11,904</strong> deposited \u2014 that\u2019s <strong>\u20AC992 per month</strong> for 12 months \u2014 and the amount has been unchanged since 2024.</p>',
        extra: '<ul>' +
          '<li>You deposit the full \u20AC11,904 upfront with an approved provider; after you arrive, \u20AC992 is released to you each month.</li>' +
          '<li>It\u2019s the standard proof of funds for a German <strong>student visa</strong> (the Opportunity Card path needs \u20AC1,091/month).</li>' +
          '<li>Open it 4\u20136 weeks before your visa appointment \u2014 the blocking confirmation is part of your application.</li>' +
          '</ul>' +
          (deRef ? '<p>' + IMM.studyLink(deRef) + ' \u00b7 ' + IMM.guideLink(deRef) + '</p>' : '')
      };
    }
    if (fundsQ && (t.study || t.studentVisa || t.visa)) {
      return {
        lead: '<p><strong>Proof of funds \u2014 in short:</strong> most student visas ask you to show you can cover <strong>tuition plus about a year of living costs</strong>' + (immCountry ? ' in ' + esc(immCountry.name) : '') + ' \u2014 the exact amount is set by each country and updated yearly.</p>',
        extra: '<p>You usually provide 3\u20136 months of bank statements, a sponsor letter, or a blocked account. ' + (immCountry && IMM ? IMM.studyLink(immCountry) + ' \u00b7 ' : '') + pmtLink(HUBS.visa, 'Student visa guidance \u2192') + '</p>'
      };
    }

    // 11) Student visas
    if (t.studentVisa) {
      var vExtra = '<p>' + pmtLink(HUBS.visa, 'Student visa guidance \u2192');
      if (immCountry) vExtra += ' \u00b7 ' + IMM.studyLink(immCountry) + ' \u00b7 ' + IMM.guideLink(immCountry);
      return {
        lead: '<p><strong>Student visa \u2014 in short:</strong> you\u2019ll need your admission letter, proof of funds and a valid passport; the exact documents, fees and timeline depend on your destination.</p>',
        extra: vExtra + '</p>'
      };
    }

    // 12) Work visas (incl. H-1B) and green cards
    if (t.greenCard) {
      var us = IMM.byName('United States');
      return {
        lead: '<p><strong>US green card \u2014 in short:</strong> ' + esc(us.simple) + '</p>',
        extra: '<p>' + IMM.guideLink(us) + ' \u00b7 ' + pmtLink(HUBS.immigration, 'All immigration guides \u2192') + '</p>'
      };
    }
    if (t.h1b) {
      return {
        lead: '<p><strong>H-1B work visa \u2014 in short:</strong> the main US work visa for skilled professionals. An employer must sponsor you, and you\u2019re entered into an annual <strong>lottery</strong> (~1 in 3 odds) because far more people apply than the 85,000 spots.</p>',
        extra: '<p>Winning the lottery is only step one \u2014 the visa is tied to that employer. See ' + IMM.guideLink(IMM.byName('United States')) + ' or ask <em>"green card"</em> for the path to permanent residency.</p>'
      };
    }
    if (t.workVisa && !t.easyCountry) {
      return {
        lead: '<p><strong>Work visa \u2014 in short:</strong> you generally need a <strong>job offer from an employer who sponsors you</strong>, plus a skill level the country wants. Well-known routes: US H-1B (lottery), EU Blue Card (Germany), UK Skilled Worker, Canada Express Entry (points).</p>',
        extra: (immCountry ? '<p>' + IMM.guideLink(immCountry) + ' covers the exact work-visa routes for that country.</p>' : '') +
          '<p>' + pmtLink(HUBS.immigration, 'All immigration &amp; work visa guides \u2192') + '</p>'
      };
    }

    // 13) Visa process & generic visa guidance
    if (t.visa) {
      if (t.interview) {
        return {
          lead: '<p><strong>Visa interview \u2014 in short:</strong> be honest and consistent with your application. Expect questions on your study/work plan, funding, and ties back home.</p>',
          extra: '<ul>' +
            '<li>Bring your passport, offer/employment letter and proof of funds.</li>' +
            '<li>Answer in 1\u20132 sentences; don\u2019t volunteer extra detail.</li>' +
            '<li>Dress neatly and arrive early.</li>' +
            '</ul>' +
            '<p>' + pmtLink(HUBS.visa, 'Student visa guidance \u2192') + '</p>'
        };
      }
      if (t.refusal) {
        return {
          lead: '<p><strong>Visa refusal \u2014 in short:</strong> the usual reasons are weak proof of funds, missing documents, or doubts about your intent to return. Address the exact reason stated in the refusal letter, then reapply.</p>',
          extra: '<p>Common fixes: stronger bank statements, a clearer study/career plan, and full supporting documents. See ' + pmtLink(HUBS.visa, 'student visa guidance \u2192') + '.</p>'
        };
      }
      if (/processing time|how long.*(visa|take)|visa.*(processing|waiting)|wait.*visa|timeline.*visa/.test(q)) {
        return {
          lead: '<p><strong>Visa processing time \u2014 in short:</strong> it varies widely \u2014 student visas typically take <strong>2\u201312 weeks</strong> depending on the country, season and your case.</p>',
          extra: '<p>Apply as soon as you have your offer, and check the official processing times for your country: ' + pmtLink(HUBS.visa, 'visa guidance \u2192') + '</p>'
        };
      }
      if (/document|require|need to submit|paperwork|what do i need/.test(q)) {
        return {
          lead: '<p><strong>Visa documents \u2014 in short:</strong> you\u2019ll usually need a valid passport, completed application form, photos, proof of funds and travel/study plans \u2014 plus an appointment or biometrics for most countries.</p>',
          extra: '<p>Exact lists vary by country and visa type \u2014 see ' + pmtLink(HUBS.visa, 'student visa guidance \u2192') + ' or ask about a specific country.</p>'
        };
      }
      if (/proof of funds|bank statement|financial.*(proof|evidence|support)|money.*(bank|need|required)|savings|how much money/.test(q)) {
        return {
          lead: '<p><strong>Proof of funds \u2014 in short:</strong> most visas ask you to show you can cover <strong>tuition + about a year of living costs</strong> \u2014 the amount varies by country.</p>',
          extra: '<p>Usually bank statements from the last 3\u20136 months, sometimes with a sponsor letter. See ' + pmtLink(HUBS.visa, 'visa guidance \u2192') + '.</p>'
        };
      }
      if (/what is a visa|visa types|what are visas|visa meaning|what does a visa|whats a visa/.test(q) && !immCountry) {
        return {
          lead: '<p><strong>What is a visa \u2014 in short:</strong> a visa is official permission from a country that lets you enter and stay for a specific purpose and time \u2014 for example to study, work, or just visit.</p>',
          extra: '<p>Common types: <strong>student visa</strong> (study), <strong>work visa</strong> (job), <strong>visitor/tourist visa</strong> (short visits) and <strong>PR/immigration</strong> (permanent). Ask about any of these \u2014 or see ' + pmtLink(HUBS.visa, 'student visa guidance \u2192') + '.</p>'
        };
      }
      if (immCountry) {
        return {
          lead: '<p><strong>Visa for ' + esc(immCountry.name) + ' \u2014 in short:</strong> ' + esc(immCountry.name) + ' issues different visas depending on why you\u2019re going \u2014 study, work or visit \u2014 each with its own documents, fees and processing time.</p>',
          extra: '<p>' + IMM.studyLink(immCountry) + ' \u00b7 ' + IMM.guideLink(immCountry) + '</p>'
        };
      }
      return {
        lead: '<p><strong>Visa guidance \u2014 in short:</strong> we cover both sides \u2014 student visas for studying abroad, and work/immigration visas for moving permanently.</p>',
        extra: '<p>' + pmtLink(HUBS.visa, 'Student visa guidance \u2192') + ' \u00b7 ' + pmtLink(HUBS.immigration, 'Immigration &amp; work visas \u2192') + '</p>'
      };
    }

    // 14) Immigration, PR & citizenship
    if (t.immigration) {
      if (t.interview) {
        return {
          lead: '<p><strong>Visa interview \u2014 in short:</strong> be honest and consistent with your application. Expect questions on your study/work plan, funding, and ties back home.</p>',
          extra: '<ul>' +
            '<li>Bring your passport, offer/employment letter and proof of funds.</li>' +
            '<li>Answer in 1\u20132 sentences; don\u2019t volunteer extra detail.</li>' +
            '<li>Dress neatly and arrive early.</li>' +
            '</ul>' +
            '<p>' + pmtLink(HUBS.visa, 'Student visa guidance \u2192') + '</p>'
        };
      }
      if (t.refusal) {
        return {
          lead: '<p><strong>Visa refusal \u2014 in short:</strong> the usual reasons are weak proof of funds, missing documents, or doubts about your intent to return. Address the exact reason stated in the refusal letter, then reapply.</p>',
          extra: '<p>Common fixes: stronger bank statements, a clearer study/career plan, and full supporting documents. See ' + pmtLink(HUBS.visa, 'student visa guidance \u2192') + '.</p>'
        };
      }
      if (/processing time|how long.*(visa|take)|visa.*(processing|waiting)|wait.*visa|timeline.*visa/.test(q)) {
        return {
          lead: '<p><strong>Visa processing time \u2014 in short:</strong> it varies widely \u2014 student visas typically take <strong>2\u201312 weeks</strong> depending on the country, season and your case.</p>',
          extra: '<p>Apply as soon as you have your offer, and check the official processing times for your country: ' + pmtLink(HUBS.visa, 'visa guidance \u2192') + '</p>'
        };
      }
      if (/proof of funds|bank statement|financial.*(proof|evidence|support)|money.*(bank|need|required)|savings|how much money/.test(q)) {
        return {
          lead: '<p><strong>Proof of funds \u2014 in short:</strong> most visas ask you to show you can cover <strong>tuition + about a year of living costs</strong> \u2014 the amount varies by country.</p>',
          extra: '<p>Usually bank statements from the last 3\u20136 months, sometimes with a sponsor letter. See ' + pmtLink(HUBS.visa, 'visa guidance \u2192') + '.</p>'
        };
      }
      if (/express entry|points system|what is.*(crs|points)/.test(q)) {
        return {
          lead: '<p><strong>Express Entry (Canada) \u2014 in short:</strong> Canada\u2019s points-based system for skilled workers \u2014 you\u2019re scored on age, education, language and experience (CRS), and the highest scores get Invitations to Apply in regular draws.</p>',
          extra: '<p>' + IMM.guideLink(IMM.byName('Canada')) + ' \u00b7 ' + pmtLink(HUBS.immigration, 'All immigration guides \u2192') + '</p>'
        };
      }
      if (/fastest|quickest|which country.*(pr|permanent|citizenship|passport)|pr.*fastest|citizenship.*fastest/.test(q)) {
        return {
          lead: '<p><strong>Fastest routes to PR / citizenship \u2014 in short:</strong> fastest <strong>PR</strong>: Canada (6\u201312 months) and Germany (21\u201327 months). Fastest <strong>citizenship</strong>: Ireland (5 of the last 9 years) and Canada (3 of the last 5).</p>',
          extra: '<p>' + IMM.guideLink(IMM.byName('Canada')) + ' \u00b7 ' + IMM.guideLink(IMM.byName('Ireland')) + '</p>'
        };
      }
      if (/age limit|too old|maximum age|age.*(require|restrict|matter)/.test(q)) {
        return {
          lead: '<p><strong>Age and migration \u2014 in short:</strong> most countries don\u2019t set a hard age cap, but points systems reward youth \u2014 e.g. Canada\u2019s Express Entry gives more points under 30 and effectively caps skilled-worker PR in the mid-40s.</p>',
          extra: '<p>Work visas (like the EU Blue Card) are generally fine at any age. Ask about a specific country for its exact rules.</p>'
        };
      }
      if (/bring.*(family|spouse|children|kids|wife|husband|parents)|family.*(join|reunif|sponsor|with me|move)|dependents?|spouse visa|wife|husband|partner/.test(q)) {
        return {
          lead: '<p><strong>Bringing your family \u2014 in short:</strong> most work/PR visas let you bring your spouse and children. In Canada, Australia and New Zealand your spouse usually gets an <strong>open work permit</strong>; in the US an H-1B spouse can\u2019t automatically work.</p>',
          extra: '<p>Parents are harder \u2014 most points programmes only include spouse and dependent children.' +
            (immCountry ? ' ' + IMM.guideLink(immCountry) : ' ' + pmtLink(HUBS.immigration, 'All immigration guides \u2192')) + '</p>'
        };
      }
      if (/dual citizenship|become (a )?citizen|naturali[sz]|citizenship.*how long/.test(q)) {
        return {
          lead: '<p><strong>Getting citizenship \u2014 in short:</strong> after PR, you usually need a few years of residence to naturalize \u2014 Ireland (5-in-9), Canada (3-of-5) and Germany (~5 years) are among the fastest; most countries allow dual citizenship.</p>',
          extra: '<p>Check your country\u2019s guide for the exact residency clock: ' + pmtLink(HUBS.immigration, 'all 13 guides \u2192') + '</p>'
        };
      }
      if (immCountry) {
        var c = immCountry;
        return {
          lead: '<p><strong>Immigrating to ' + esc(c.name) + ' \u2014 in short:</strong> ' + (simpleAsk ? esc(c.simple) : esc(c.blurb)) + ' Main routes: ' + esc(c.programs) + '. Difficulty: ' + esc(c.ease) + '.</p>',
          extra: '<p><strong>Fees:</strong> ' + esc(c.fees) + '.</p><p>' + IMM.guideLink(c) + ' \u00b7 ' + IMM.studyLink(c) + ' \u00b7 ' + pmtLink(HUBS.immigration, 'All immigration guides \u2192') + '</p>'
        };
      }
      return {
        lead: '<p><strong>Immigration guides \u2014 in short:</strong> we have 2026 guides for 13 countries \u2014 points systems, work visas, PR and citizenship. Pick one:</p>',
        extra: '<div class="chat-cards">' + IMM.countries.map(function (cc) {
          return '<div class="chat-card"><div class="cc-top">' + IMM.flag(cc, 22) + '</div>' +
            '<div class="cc-name">' + esc(cc.name) + '</div>' +
            '<a class="cc-link" href="immigrate-to-' + cc.slug + '">View guide \u2192</a></div>';
        }).join('') + '</div>'
      };
    }

    // 15) General scholarship knowledge (no specific scholarship named)
    if (t.scholarship) {
      if (/women|female|girls?/.test(q)) {
        return {
          lead: '<p><strong>Scholarships for women \u2014 in short:</strong> a few scholarships are women-only or women-priority; most others are open to all genders.</p>',
          extra: '<p>Filter on ' + pmtLink(HUBS.results, 'the results page \u2192') + ' or ask about a specific country.</p>'
        };
      }
      if (/international (students?|applicants?)/.test(q)) {
        return {
          lead: '<p><strong>Scholarships for international students \u2014 in short:</strong> almost every scholarship here is open to international students \u2014 eligibility usually depends on nationality, level and field, not on being local.</p>',
          extra: '<p>Filter by your level, country and field on ' + pmtLink(HUBS.results, 'the results page \u2192') + '</p>'
        };
      }
      if (/recommend|suggest|match|which scholarship|what scholarship|for me|fit me|suited|best.*(scholarship|for me)/.test(q)) {
        return {
          lead: '<p><strong>Which scholarship fits you \u2014 in short:</strong> tell me your <em>level</em> (Bachelor/Masters/PhD), <em>field</em>, <em>country</em> and whether you need <em>fully funded</em> \u2014 and I\u2019ll pull matches.</p>',
          extra: '<p>Try: <em>"fully funded Masters in Computer Science"</em> or <em>"scholarships in the UK"</em>. Browse all: ' + pmtLink(HUBS.results, 'scholarships \u2192') + '</p>'
        };
      }
      if (/how (do|can|should) i (apply|get)|how to (apply|get)|application process|steps? to apply/.test(q)) {
        return {
          lead: '<p><strong>How to apply for scholarships \u2014 in short:</strong> find ones you\u2019re eligible for \u2192 prepare transcripts, SOP, CV, references and an English test \u2192 submit on the <strong>official portal</strong> before the deadline.</p>',
          extra: '<ul>' +
            '<li>Filter by level, country, field and funding on ' + pmtLink(HUBS.results, 'the results page \u2192') + '</li>' +
            '<li>Always use the official apply link \u2014 never pay a third party.</li>' +
            '<li>Start 3\u20136 months before deadlines.</li>' +
            '</ul>'
        };
      }
      if (/how (do|can|i) (find|search)|how to (find|search)|where (can|do|to) (find|search)/.test(q)) {
        return {
          lead: '<p><strong>How to find scholarships \u2014 in short:</strong> filter the results page by your level, country and field, and check deadlines sorted by soonest.</p>',
          extra: '<p>' + pmtLink(HUBS.results, 'Browse scholarships \u2192') + ' \u00b7 ' + pmtLink('how-to-find-scholarships-actually-eligible', 'How to find ones you\u2019re actually eligible for \u2192') + '</p>'
        };
      }
      if (/easiest|how hard|chances?|competitive|win|easy to (get|win)|hard to (get|win)/.test(q)) {
        return {
          lead: '<p><strong>Easiest scholarships to win \u2014 in short:</strong> less-famous, country-specific and partial scholarships are far less competitive than Chevening or Fulbright. Every page shows a competition rating (Very High / High / Moderate).</p>',
          extra: '<p>Sort by funding type on ' + pmtLink(HUBS.results, 'the results page \u2192') + ' \u2014 or ask <em>"easiest scholarships for Masters"</em>.</p>'
        };
      }
      if (/more than one|multiple|how many.*(scholarship|apply)|apply.*(several|many)/.test(q)) {
        return {
          lead: '<p><strong>How many scholarships can you apply to \u2014 in short:</strong> as many as you qualify for \u2014 spread your risk across 3\u20135. Just tailor each SOP.</p>',
          extra: '<p>Watch combined-benefit rules: some countries cap how much funding you can stack.</p>'
        };
      }
      if (/deadline|due date|when.*apply/.test(q)) {
        return {
          lead: '<p><strong>Scholarship deadlines \u2014 in short:</strong> they vary \u2014 the big ones usually close <strong>Nov\u2013Mar</strong> for a September intake, and many roll monthly.</p>',
          extra: '<p>See live counts on ' + pmtLink(HUBS.results, 'the results page \u2192') + ' (sorted by soonest) or ask <em>"closing soon"</em>.</p>'
        };
      }
      if (/loan|borrow|scholarship.*(or|vs).*loan/.test(q)) {
        return {
          lead: '<p><strong>Scholarship vs education loan \u2014 in short:</strong> a scholarship is free money you don\u2019t repay; a loan must be paid back with interest. Exhaust scholarships, grants and part-time work before borrowing.</p>',
          extra: '<p>' + pmtLink(HUBS.results, 'Browse scholarships \u2192') + ' \u00b7 ' + pmtLink('fund-studies-abroad-without-full-scholarship', 'Funding studies without a full scholarship \u2192') + '</p>'
        };
      }
      if (/(gpa|grades|marks)/.test(q) && /(low|bad|below|less|average|poor|not.*good)/.test(q)) {
        return {
          lead: '<p><strong>Low GPA? \u2014 in short:</strong> you still have options \u2014 many government scholarships weigh your SOP, references and leadership over grades, and some don\u2019t require a GPA at all.</p>',
          extra: '<p>Focus on your story and impact, and target scholarships you clearly meet: ' + pmtLink(HUBS.results, 'browse all \u2192') + '</p>'
        };
      }
      if (/(for|from).*(pakistan|india|bangladesh|nigeria|kenya|philip|nepal|sri lanka|ghana|egypt|afghan|vietnam|indonesia|malaysia|somalia|ethiopia)|nationalit/.test(q)) {
        return {
          lead: '<p><strong>Nationality-based scholarships \u2014 in short:</strong> many top awards are open to specific nationalities \u2014 e.g. Chevening (eligible countries), Commonwealth (Commonwealth citizens) and Australia Awards (specific regions).</p>',
          extra: '<p>Each scholarship\u2019s eligibility lists who can apply \u2014 check on ' + pmtLink(HUBS.results, 'the results page \u2192') + ' or ask about one by name.</p>'
        };
      }
    }

    // 16) Studying abroad — costs, funding, part-time work, accommodation
    if (t.study) {
      if (t.cost) {
        return {
          lead: '<p><strong>Cost of studying' + (immCountry ? ' in ' + esc(immCountry.name) : ' abroad') + ' \u2014 in short:</strong> tuition and living costs vary hugely by country and city \u2014 Germany is nearly free, while the US, UK and Australia are expensive.' + (immCountry ? ' Our ' + esc(immCountry.name) + ' guide has a full breakdown.' : '') + '</p>',
          extra: '<p>' + (immCountry ? IMM.studyLink(immCountry) : pmtLink(HUBS.study, 'All study destinations \u2192')) + ' \u00b7 ' + pmtLink('fund-studies-abroad-without-full-scholarship', 'Funding studies abroad \u2192') + '</p>'
        };
      }
      if (t.freeStudy) {
        return {
          lead: '<p><strong>Studying for free \u2014 in short:</strong> Germany and Norway charge little-to-no tuition at public universities \u2014 the real cost is living (\u20AC900\u20131,200+/month) plus proof of funds.</p>',
          extra: '<p>' + pmtLink('how-to-study-in-germany-for-free', 'How to study in Germany for free \u2192') + ' \u00b7 ' + IMM.studyLink(IMM.byName('Germany')) + '</p>'
        };
      }
      if (t.partTime) {
        return partTimeAns();
      }
      if (t.worth) {
        return {
          lead: '<p><strong>Is studying abroad worth it? \u2014 in short:</strong> yes if it advances a clear goal \u2014 a job, PR eligibility or a specific career \u2014 but costs differ hugely: Germany is nearly free, while the US/UK/Australia are expensive.</p>',
          extra: '<p>' + pmtLink(HUBS.study, 'Study destinations \u2192') + ' \u00b7 ' + pmtLink(HUBS.blog, 'Blog \u2192') + '</p>'
        };
      }
      if (t.englishTaught) {
        return {
          lead: '<p><strong>English-taught programmes \u2014 in short:</strong> at Master\u2019s level, most European countries (Germany, Netherlands, Nordics) offer English-taught degrees; the US, UK, Australia and Canada do by default.</p>',
          extra: '<p>' + pmtLink(HUBS.study, 'Study destinations \u2192') + '</p>'
        };
      }
      if (t.accommodation) {
        return {
          lead: '<p><strong>Student accommodation \u2014 in short:</strong> budget roughly <strong>\u20AC300\u2013800/month</strong> depending on country and city; university residences are usually the easiest for your first year.</p>',
          extra: '<p>' + pmtLink(HUBS.study, 'Study hub \u2192') + '</p>'
        };
      }
      if (/study in|study abroad/.test(q) && immCountry) {
        return {
          lead: '<p><strong>Studying in ' + esc(immCountry.name) + ' \u2014 in short:</strong> our 2026 guide covers the best universities, tuition costs, the student visa route and available scholarships.</p>',
          extra: '<p>' + IMM.studyLink(immCountry) + ' \u00b7 ' + IMM.guideLink(immCountry) + ' \u00b7 ' + pmtLink(HUBS.study, 'All study destinations \u2192') + '</p>' +
            '<p>Want funding? Ask <em>"scholarships in ' + esc(immCountry.name) + '"</em>.</p>'
        };
      }
    }

    // 17) Closing soon
    if (t.closing) {
      var closing = SB.all.filter(function (x) { return SB.deadlineInfo(x).status === 'closing'; })
        .sort(function (a, b) { return SB.deadlineInfo(a).daysLeft - SB.deadlineInfo(b).daysLeft; });
      if (!closing.length) {
        return {
          lead: '<p><strong>Closing soon \u2014 in short:</strong> nothing is in the final 30-day window right now.</p>',
          extra: '<p>Browse by soonest deadline: ' + pmtLink(HUBS.results, 'all scholarships \u2192') + '</p>'
        };
      }
      return {
        lead: '<p><strong>Closing soon \u2014 in short:</strong> ' + closing.length + ' scholarship' + (closing.length === 1 ? ' is' : 's are') + ' in their final 30-day window.</p>',
        extra: renderCards(closing)
      };
    }

    // 18) Tools & site help
    if (t.quiz) {
      return {
        lead: '<p><strong>Scholarship quiz \u2014 in short:</strong> answer a few quick questions and we\u2019ll shortlist scholarships matched to your profile.</p>',
        extra: '<p>' + pmtLink(siteRoot('#quiz'), 'Take the quiz \u2192') + '</p>'
      };
    }
    if (t.save && t.scholarship) {
      return {
        lead: '<p><strong>Saving scholarships \u2014 in short:</strong> tap the <strong>heart</strong> on any scholarship card to save it \u2014 your list lives on the Saved page.</p>',
        extra: '<p>' + pmtLink('saved', 'Open your saved list \u2192') + '</p>'
      };
    }
    if (t.contact) {
      return {
        lead: '<p><strong>Get in touch \u2014 in short:</strong> we\u2019d love to hear from you \u2014 questions, feedback or bugs.</p>',
        extra: '<p>' + pmtLink('contact', 'Contact us \u2192') + '</p>'
      };
    }
    if (t.capability) {
      return {
        lead: '<p><strong>What I can help with \u2014 in short:</strong> scholarships (eligibility, documents, deadlines, fees, funding), immigration &amp; PR, work/student/visitor visas, studying abroad, costs, IELTS and essay writing \u2014 all in plain English.</p>',
        extra: '<ul>' +
          '<li><em>"Am I eligible for Chevening?"</em></li>' +
          '<li><em>"fully funded PhD in Europe"</em></li>' +
          '<li><em>"which country is easiest to migrate to"</em></li>' +
          '<li><em>"explain the B1/B2 visa in simple terms"</em></li>' +
          '<li><em>"what IELTS score do I need"</em></li>' +
          '</ul>'
      };
    }

    // 19) Search by level / region / field / funding
    var levels = detectLevels(q);
    var loc = detectRegionOrCountry(q);
    var field = detectField(q);
    var wantFunded = /fully funded|full funding|full scholarship|fully-funded/.test(q);
    var wantFree = /no fee|free to apply|without fee|fee-free/.test(q);
    var schIntent = t.scholarship || wantFunded || wantFree || !!field || levels.length > 0 ||
      /scholarship|scholarships|fellowship|grant|stipend|bursary|award|funding|funded|financial aid|tuition|university|universities|college|degree|program|course|study/.test(q);

    if (schIntent && (levels.length || loc.regions.length || loc.countries.length || field || wantFunded || wantFree)) {
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
          extra: '<p>Try ' + pmtLink(HUBS.results, 'browsing all scholarships \u2192') + ' or ask about a level, country or field.</p>'
        };
      }
      return {
        lead: '<p><strong>' + (parts.join(', ') || 'That') + ' \u2014 in short:</strong> I found <strong>' + list.length + '</strong> matching scholarship' + (list.length === 1 ? '' : 's') + (list.length > 6 ? ' (top 6 shown)' : '') + '.</p>',
        extra: renderCards(list)
      };
    }

    // 20) Fallback
    return {
      lead: '<p><strong>Here\u2019s how I can help \u2014 in short:</strong> I cover scholarships, immigration, PR, studying abroad, visas and IELTS \u2014 in plain, to-the-point language.</p>',
      extra: '<ul>' +
        '<li><em>"Am I eligible for Fulbright?"</em> \u2014 any scholarship by name</li>' +
        '<li><em>"fully funded PhD in Europe"</em> \u2014 matches by level, field, region</li>' +
        '<li><em>"immigrate to Canada"</em> or <em>"USA PR in simple terms"</em> \u2014 immigration guides</li>' +
        '<li><em>"which country is easy to migrate to"</em> \u2014 a ranked comparison</li>' +
        '<li><em>"explain the B1/B2 visa"</em>, <em>"student visa"</em>, <em>"IELTS score"</em> \u2014 our guides</li>' +
        '</ul>' +
        '<p>Browse: ' + pmtLink(HUBS.results, 'scholarships \u2192') + ' \u00b7 ' + pmtLink(HUBS.immigration, 'immigration \u2192') + ' \u00b7 ' + pmtLink(HUBS.blog, 'blog \u2192') + '</p>'
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
