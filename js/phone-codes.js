/* =========================================================================
   AbroadReady — Shared country phone-code list & helpers
   Used by the contact form and the admission guidance form to render a
   country-code dropdown (with per-country validation) for phone fields.
   ========================================================================= */
(function () {
  "use strict";

  window.PHONE_CODES = [
    {c:"AF",d:"+93",n:"Afghanistan",r:/^(?:\+93)?[78]\d{8}$/},
    {c:"AL",d:"+355",n:"Albania",r:/^(?:\+355)?[67]\d{8}$/},
    {c:"DZ",d:"+213",n:"Algeria",r:/^(?:\+213)?[5-7]\d{8}$/},
    {c:"AR",d:"+54",n:"Argentina",r:/^(?:\+54)?[1-9]\d{9,10}$/},
    {c:"AU",d:"+61",n:"Australia",r:/^(?:\+61)?[2-9]\d{8,9}$/},
    {c:"AT",d:"+43",n:"Austria",r:/^(?:\+43)?[1-9]\d{6,12}$/},
    {c:"BD",d:"+880",n:"Bangladesh",r:/^(?:\+880)?[1-9]\d{9}$/},
    {c:"BE",d:"+32",n:"Belgium",r:/^(?:\+32)?[1-9]\d{7,8}$/},
    {c:"BR",d:"+55",n:"Brazil",r:/^(?:\+55)?[1-9]\d{9,10}$/},
    {c:"BG",d:"+359",n:"Bulgaria",r:/^(?:\+359)?[2-9]\d{7,8}$/},
    {c:"KH",d:"+855",n:"Cambodia",r:/^(?:\+855)?[1-9]\d{8}$/},
    {c:"CM",d:"+237",n:"Cameroon",r:/^(?:\+237)?[26]\d{8}$/},
    {c:"CA",d:"+1",n:"Canada",r:/^(?:\+1)?[2-9]\d{9}$/},
    {c:"CN",d:"+86",n:"China",r:/^(?:\+86)?1[3-9]\d{9}$/},
    {c:"CO",d:"+57",n:"Colombia",r:/^(?:\+57)?[3-9]\d{9}$/},
    {c:"HR",d:"+385",n:"Croatia",r:/^(?:\+385)?[1-9]\d{7,8}$/},
    {c:"CZ",d:"+420",n:"Czech Republic",r:/^(?:\+420)?[1-9]\d{8}$/},
    {c:"DK",d:"+45",n:"Denmark",r:/^(?:\+45)?[2-9]\d{7}$/},
    {c:"EG",d:"+20",n:"Egypt",r:/^(?:\+20)?[1][0-9]\d{8}$/},
    {c:"EE",d:"+372",n:"Estonia",r:/^(?:\+372)?[5-9]\d{6,7}$/},
    {c:"FI",d:"+358",n:"Finland",r:/^(?:\+358)?[4-9]\d{6,9}$/},
    {c:"FR",d:"+33",n:"France",r:/^(?:\+33)?[1-9]\d{8}$/},
    {c:"DE",d:"+49",n:"Germany",r:/^(?:\+49)?[1-9]\d{6,14}$/},
    {c:"GH",d:"+233",n:"Ghana",r:/^(?:\+233)?[2-5]\d{8}$/},
    {c:"GR",d:"+30",n:"Greece",r:/^(?:\+30)?[2-9]\d{9}$/},
    {c:"HU",d:"+36",n:"Hungary",r:/^(?:\+36)?[1-9]\d{8}$/},
    {c:"IN",d:"+91",n:"India",r:/^(?:\+91)?[6-9]\d{9}$/},
    {c:"ID",d:"+62",n:"Indonesia",r:/^(?:\+62)?[1-9]\d{8,11}$/},
    {c:"IR",d:"+98",n:"Iran",r:/^(?:\+98)?[1-9]\d{9}$/},
    {c:"IQ",d:"+964",n:"Iraq",r:/^(?:\+964)?[7-9]\d{9}$/},
    {c:"IE",d:"+353",n:"Ireland",r:/^(?:\+353)?[1-9]\d{7,8}$/},
    {c:"IL",d:"+972",n:"Israel",r:/^(?:\+972)?[5-9]\d{8}$/},
    {c:"IT",d:"+39",n:"Italy",r:/^(?:\+39)?[3-9]\d{8,9}$/},
    {c:"JP",d:"+81",n:"Japan",r:/^(?:\+81)?[1-9]\d{9}$/},
    {c:"JO",d:"+962",n:"Jordan",r:/^(?:\+962)?[7-9]\d{8}$/},
    {c:"KE",d:"+254",n:"Kenya",r:/^(?:\+254)?[17]\d{8,9}$/},
    {c:"KR",d:"+82",n:"South Korea",r:/^(?:\+82)?[1-9]\d{8,9}$/},
    {c:"KW",d:"+965",n:"Kuwait",r:/^(?:\+965)?[5-9]\d{7}$/},
    {c:"LV",d:"+371",n:"Latvia",r:/^(?:\+371)?[2-9]\d{7}$/},
    {c:"LB",d:"+961",n:"Lebanon",r:/^(?:\+961)?[3-9]\d{6,7}$/},
    {c:"LY",d:"+218",n:"Libya",r:/^(?:\+218)?[1-9]\d{8}$/},
    {c:"LT",d:"+370",n:"Lithuania",r:/^(?:\+370)?[3-9]\d{7}$/},
    {c:"MY",d:"+60",n:"Malaysia",r:/^(?:\+60)?[1-9]\d{8,9}$/},
    {c:"MV",d:"+960",n:"Maldives",r:/^(?:\+960)?[7-9]\d{6}$/},
    {c:"MX",d:"+52",n:"Mexico",r:/^(?:\+52)?[1-9]\d{9}$/},
    {c:"MA",d:"+212",n:"Morocco",r:/^(?:\+212)?[5-7]\d{8}$/},
    {c:"MM",d:"+95",n:"Myanmar",r:/^(?:\+95)?[1-9]\d{7,9}$/},
    {c:"NP",d:"+977",n:"Nepal",r:/^(?:\+977)?[1-9]\d{9}$/},
    {c:"NL",d:"+31",n:"Netherlands",r:/^(?:\+31)?[1-9]\d{8}$/},
    {c:"NZ",d:"+64",n:"New Zealand",r:/^(?:\+64)?[2-9]\d{7,9}$/},
    {c:"NG",d:"+234",n:"Nigeria",r:/^(?:\+234)?[7-9]\d{9}$/},
    {c:"NO",d:"+47",n:"Norway",r:/^(?:\+47)?[4-9]\d{7}$/},
    {c:"OM",d:"+968",n:"Oman",r:/^(?:\+968)?[7-9]\d{7}$/},
    {c:"PK",d:"+92",n:"Pakistan",r:/^(?:\+92)?[3]\d{9}$/},
    {c:"PS",d:"+970",n:"Palestine",r:/^(?:\+970)?[5-9]\d{8}$/},
    {c:"PH",d:"+63",n:"Philippines",r:/^(?:\+63)?[9]\d{9}$/},
    {c:"PL",d:"+48",n:"Poland",r:/^(?:\+48)?[1-9]\d{8}$/},
    {c:"PT",d:"+351",n:"Portugal",r:/^(?:\+351)?[1-9]\d{8}$/},
    {c:"QA",d:"+974",n:"Qatar",r:/^(?:\+974)?[3-9]\d{7}$/},
    {c:"RO",d:"+40",n:"Romania",r:/^(?:\+40)?[2-9]\d{8}$/},
    {c:"RU",d:"+7",n:"Russia",r:/^(?:\+7)?[3-9]\d{9}$/},
    {c:"SA",d:"+966",n:"Saudi Arabia",r:/^(?:\+966)?[5]\d{8}$/},
    {c:"SN",d:"+221",n:"Senegal",r:/^(?:\+221)?[7-9]\d{8}$/},
    {c:"RS",d:"+381",n:"Serbia",r:/^(?:\+381)?[1-9]\d{7,8}$/},
    {c:"SG",d:"+65",n:"Singapore",r:/^(?:\+65)?[6-9]\d{7}$/},
    {c:"SK",d:"+421",n:"Slovakia",r:/^(?:\+421)?[1-9]\d{8}$/},
    {c:"SI",d:"+386",n:"Slovenia",r:/^(?:\+386)?[1-9]\d{7}$/},
    {c:"ZA",d:"+27",n:"South Africa",r:/^(?:\+27)?[1-9]\d{8}$/},
    {c:"ES",d:"+34",n:"Spain",r:/^(?:\+34)?[6-9]\d{8}$/},
    {c:"SE",d:"+46",n:"Sweden",r:/^(?:\+46)?[7-9]\d{7,9}$/},
    {c:"CH",d:"+41",n:"Switzerland",r:/^(?:\+41)?[7-9]\d{8}$/},
    {c:"TW",d:"+886",n:"Taiwan",r:/^(?:\+886)?[9]\d{8}$/},
    {c:"TZ",d:"+255",n:"Tanzania",r:/^(?:\+255)?[6-7]\d{8}$/},
    {c:"TH",d:"+66",n:"Thailand",r:/^(?:\+66)?[6-9]\d{8}$/},
    {c:"TN",d:"+216",n:"Tunisia",r:/^(?:\+216)?[2-9]\d{7}$/},
    {c:"TR",d:"+90",n:"Turkey",r:/^(?:\+90)?[1-9]\d{9}$/},
    {c:"UG",d:"+256",n:"Uganda",r:/^(?:\+256)?[7-9]\d{8}$/},
    {c:"UA",d:"+380",n:"Ukraine",r:/^(?:\+380)?[3-9]\d{8}$/},
    {c:"AE",d:"+971",n:"UAE",r:/^(?:\+971)?[5-9]\d{8}$/},
    {c:"GB",d:"+44",n:"United Kingdom",r:/^(?:\+44)?[1-9]\d{9,10}$/},
    {c:"US",d:"+1",n:"United States",r:/^(?:\+1)?[2-9]\d{9}$/},
    {c:"UZ",d:"+998",n:"Uzbekistan",r:/^(?:\+998)?[3-9]\d{8}$/},
    {c:"VN",d:"+84",n:"Vietnam",r:/^(?:\+84)?[3-9]\d{8,9}$/},
    {c:"YE",d:"+967",n:"Yemen",r:/^(?:\+967)?[7-9]\d{7}$/},
    {c:"ZM",d:"+260",n:"Zambia",r:/^(?:\+260)?[7-9]\d{8}$/},
    {c:"ZW",d:"+263",n:"Zimbabwe",r:/^(?:\+263)?[7-9]\d{8}$/}
  ];

  /* Populate a <select> with "dial country" + name options.
     defaultCode (e.g. "PK") is preselected when present. */
  window.populatePhoneSelect = function (selectId, defaultCode) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    window.PHONE_CODES.forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c.d;
      opt.textContent = c.d + " " + c.n;
      opt.setAttribute("data-regex", c.r.source);
      sel.appendChild(opt);
      if (c.c === defaultCode) opt.selected = true;
    });
  };

  /* Validate a phone number against the selected country's pattern.
     Returns true when valid. */
  window.validatePhoneInput = function (selectId, inputId) {
    var sel = document.getElementById(selectId);
    var num = document.getElementById(inputId).value.replace(/[\s\-()]/g, "");
    if (!sel || !sel.options || !sel.options[sel.selectedIndex]) return false;
    var opt = sel.options[sel.selectedIndex];
    var pattern = new RegExp(opt.getAttribute("data-regex"));
    return !!num.match(pattern);
  };
})();
