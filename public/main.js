/**
 * CareConnect — main application script
 *
 * This is a plain (non-module) script loaded directly by index.html so that
 * every top-level function declared here attaches to `window`, exactly as it
 * did inside the original inline <script> tags. Inline `onclick="..."`
 * handlers rendered into innerHTML throughout this file rely on that.
 *
 * Sections, in order:
 *   1. i18n dictionary
 *   2. "Database" layer (localStorage-backed) + helpers
 *   3. Router + app shell
 *   4. Landing page + authentication
 *   5. Onboarding
 *   6. Patient dashboard + medicines
 *   7. Appointments, healthcare discovery, health records
 *   8. Post-discharge care, remote consult, caregiver management, privacy
 *   9. Notifications, voice assistant, emergency support
 *  10. Profile, settings
 *  11. Caregiver dashboard
 *
 * See README.md for how to swap the localStorage-backed "database" layer
 * for a real backend (Supabase, your own API, etc.) without touching the
 * UI code in the other sections.
 */

/* =========================================================
   CARECONNECT — i18n
   Centralized translation dictionary. Real app would split
   these into /locales/en.json etc; kept in one object here
   since this is a single-file prototype.
========================================================= */
const LANGS = [
  {code:'en', label:'English'},
  {code:'ta', label:'தமிழ்'},
  {code:'hi', label:'हिन्दी'},
  {code:'te', label:'తెలుగు'},
  {code:'kn', label:'ಕನ್ನಡ'},
  {code:'ml', label:'മലയാളം'}
];

const I18N = {
en:{
  app_name:"CareConnect", tagline:"Connecting Care Beyond the Hospital",
  nav_home:"Home", nav_medicines:"Medicines", nav_appointments:"Appointments", nav_healthcare:"Healthcare",
  nav_records:"Records", nav_postdischarge:"Post-Discharge", nav_consult:"Consult", nav_caregiver:"Caregiver",
  nav_privacy:"Privacy Centre", nav_notifications:"Notifications", nav_voice:"Voice Assistant", nav_emergency:"Emergency",
  nav_profile:"Profile", nav_settings:"Settings", nav_more:"More", nav_logout:"Log out", nav_dashboard:"Dashboard",
  get_started:"Get Started", explore:"Explore CareConnect", login:"Log In", register:"Register",
  good_morning:"Good Morning", good_afternoon:"Good Afternoon", good_evening:"Good Evening",
  next_medicine:"Next Medicine", next_appointment:"Next Appointment", next_followup:"Next Follow-up",
  unread_notifications:"Unread Notifications", none_scheduled:"None scheduled",
  medicines_title:"Medicines", appointments_title:"Appointments", healthcare_title:"Healthcare Near Me",
  records_title:"Health Records", postdischarge_title:"Post-Discharge Care", consult_title:"Remote Care / Consult",
  caregiver_title:"Caregiver", privacy_title:"Consent & Privacy Centre", notifications_title:"Notifications",
  voice_title:"Voice Assistant", emergency_title:"Emergency Support", profile_title:"Profile", settings_title:"Settings",
  add:"Add", edit:"Edit", delete:"Delete", cancel:"Cancel", save:"Save", saved:"Saved", close:"Close",
  mark_taken:"Mark as Taken", mark_missed:"Mark as Missed", view_history:"View History",
  upcoming:"Upcoming", past:"Past", cancelled:"Cancelled",
  language_settings:"Language", accessibility:"Accessibility", text_size:"Text Size", contrast:"Contrast",
  reduced_motion:"Reduced Motion", text_to_speech:"Text-to-Speech", speech_to_text:"Speech-to-Text",
  standard:"Standard", large:"Large", extra_large:"Extra Large", high_contrast:"High Contrast",
  invite_caregiver:"Invite Caregiver", connected_caregivers:"Connected Caregivers",
  sharing_permissions:"Sharing Permissions", who_has_access:"Who has access?",
  revoke_access:"Revoke Access", revoke_all:"Revoke All Access",
  emergency_call:"Call Emergency Services", emergency_contact:"Emergency Contact", nearby_emergency:"Nearby Emergency Facility",
  welcome_back:"Welcome back", create_account:"Create your account", patient:"Patient", caregiver:"Caregiver",
  no_upcoming_appointments:"No upcoming appointments.", no_medicines:"No medicines added yet.",
  try_again:"Try Again", unable_to_load:"Unable to load this data.",
},
ta:{
  app_name:"கேர்கனெக்ட்", tagline:"மருத்துவமனையைத் தாண்டி கவனிப்பை இணைத்தல்",
  nav_home:"முகப்பு", nav_medicines:"மருந்துகள்", nav_appointments:"சந்திப்புகள்", nav_healthcare:"மருத்துவ சேவைகள்",
  nav_records:"பதிவுகள்", nav_postdischarge:"டிஸ்சார்ஜ் பின் கவனிப்பு", nav_consult:"தொலைநிலை ஆலோசனை", nav_caregiver:"பராமரிப்பாளர்",
  nav_privacy:"தனியுரிமை மையம்", nav_notifications:"அறிவிப்புகள்", nav_voice:"குரல் உதவியாளர்", nav_emergency:"அவசரநிலை",
  nav_profile:"சுயவிவரம்", nav_settings:"அமைப்புகள்", nav_more:"மேலும்", nav_logout:"வெளியேறு", nav_dashboard:"டாஷ்போர்டு",
  get_started:"தொடங்குங்கள்", explore:"கேர்கனெக்ட்டை ஆராயுங்கள்", login:"உள்நுழைய", register:"பதிவு செய்யவும்",
  good_morning:"காலை வணக்கம்", good_afternoon:"மதிய வணக்கம்", good_evening:"மாலை வணக்கம்",
  next_medicine:"அடுத்த மருந்து", next_appointment:"அடுத்த சந்திப்பு", next_followup:"அடுத்த பின்தொடர்தல்",
  unread_notifications:"படிக்காத அறிவிப்புகள்", none_scheduled:"திட்டமிடப்படவில்லை",
  medicines_title:"மருந்துகள்", appointments_title:"சந்திப்புகள்", healthcare_title:"அருகிலுள்ள மருத்துவமனைகள்",
  records_title:"சுகாதார பதிவுகள்", postdischarge_title:"டிஸ்சார்ஜ் பின் கவனிப்பு", consult_title:"தொலைநிலை ஆலோசனை",
  caregiver_title:"பராமரிப்பாளர்", privacy_title:"ஒப்புதல் மற்றும் தனியுரிமை மையம்", notifications_title:"அறிவிப்புகள்",
  voice_title:"குரல் உதவியாளர்", emergency_title:"அவசர உதவி", profile_title:"சுயவிவரம்", settings_title:"அமைப்புகள்",
  add:"சேர்க்க", edit:"திருத்த", delete:"நீக்கு", cancel:"ரத்து செய்", save:"சேமி", saved:"சேமிக்கப்பட்டது", close:"மூடு",
  mark_taken:"எடுத்ததாக குறி", mark_missed:"தவறவிட்டதாக குறி", view_history:"வரலாற்றைக் காண்க",
  upcoming:"வரவிருக்கும்", past:"கடந்த", cancelled:"ரத்து செய்யப்பட்டது",
  language_settings:"மொழி", accessibility:"அணுகல்தன்மை", text_size:"எழுத்து அளவு", contrast:"மாறுபாடு",
  reduced_motion:"குறைந்த அசைவு", text_to_speech:"உரையிலிருந்து பேச்சு", speech_to_text:"பேச்சிலிருந்து உரை",
  standard:"நிலையான", large:"பெரியது", extra_large:"மிகப் பெரியது", high_contrast:"அதிக மாறுபாடு",
  invite_caregiver:"பராமரிப்பாளரை அழைக்க", connected_caregivers:"இணைக்கப்பட்ட பராமரிப்பாளர்கள்",
  sharing_permissions:"பகிர்வு அனுமதிகள்", who_has_access:"யாருக்கு அணுகல் உள்ளது?",
  revoke_access:"அணுகலை திரும்பப் பெறு", revoke_all:"அனைத்து அணுகலையும் திரும்பப் பெறு",
  emergency_call:"அவசர சேவையை அழைக்கவும்", emergency_contact:"அவசர தொடர்பு", nearby_emergency:"அருகிலுள்ள அவசர வசதி",
  welcome_back:"மீண்டும் வருக", create_account:"உங்கள் கணக்கை உருவாக்கவும்", patient:"நோயாளி", caregiver:"பராமரிப்பாளர்",
  no_upcoming_appointments:"வரவிருக்கும் சந்திப்புகள் இல்லை.", no_medicines:"இதுவரை மருந்துகள் சேர்க்கப்படவில்லை.",
  try_again:"மீண்டும் முயற்சிக்கவும்", unable_to_load:"இந்த தரவை ஏற்ற முடியவில்லை.",
},
hi:{
  app_name:"केयरकनेक्ट", tagline:"अस्पताल से परे देखभाल को जोड़ना",
  nav_home:"होम", nav_medicines:"दवाइयाँ", nav_appointments:"अपॉइंटमेंट", nav_healthcare:"स्वास्थ्य सेवाएँ",
  nav_records:"रिकॉर्ड्स", nav_postdischarge:"डिस्चार्ज के बाद देखभाल", nav_consult:"रिमोट परामर्श", nav_caregiver:"देखभालकर्ता",
  nav_privacy:"गोपनीयता केंद्र", nav_notifications:"सूचनाएँ", nav_voice:"वॉइस असिस्टेंट", nav_emergency:"आपातकाल",
  nav_profile:"प्रोफ़ाइल", nav_settings:"सेटिंग्स", nav_more:"अधिक", nav_logout:"लॉग आउट", nav_dashboard:"डैशबोर्ड",
  get_started:"शुरू करें", explore:"केयरकनेक्ट देखें", login:"लॉग इन", register:"पंजीकरण करें",
  good_morning:"सुप्रभात", good_afternoon:"शुभ दोपहर", good_evening:"शुभ संध्या",
  next_medicine:"अगली दवा", next_appointment:"अगला अपॉइंटमेंट", next_followup:"अगला फॉलो-अप",
  unread_notifications:"अपठित सूचनाएँ", none_scheduled:"कुछ भी निर्धारित नहीं",
  medicines_title:"दवाइयाँ", appointments_title:"अपॉइंटमेंट", healthcare_title:"नज़दीकी स्वास्थ्य सेवाएँ",
  records_title:"स्वास्थ्य रिकॉर्ड्स", postdischarge_title:"डिस्चार्ज के बाद देखभाल", consult_title:"रिमोट परामर्श",
  caregiver_title:"देखभालकर्ता", privacy_title:"सहमति और गोपनीयता केंद्र", notifications_title:"सूचनाएँ",
  voice_title:"वॉइस असिस्टेंट", emergency_title:"आपातकालीन सहायता", profile_title:"प्रोफ़ाइल", settings_title:"सेटिंग्स",
  add:"जोड़ें", edit:"संपादित करें", delete:"हटाएँ", cancel:"रद्द करें", save:"सहेजें", saved:"सहेजा गया", close:"बंद करें",
  mark_taken:"ली गई के रूप में चिह्नित करें", mark_missed:"छूट गई के रूप में चिह्नित करें", view_history:"इतिहास देखें",
  upcoming:"आगामी", past:"पिछले", cancelled:"रद्द",
  language_settings:"भाषा", accessibility:"सुगम्यता", text_size:"टेक्स्ट आकार", contrast:"कंट्रास्ट",
  reduced_motion:"कम गति", text_to_speech:"टेक्स्ट-टू-स्पीच", speech_to_text:"स्पीच-टू-टेक्स्ट",
  standard:"मानक", large:"बड़ा", extra_large:"अतिरिक्त बड़ा", high_contrast:"उच्च कंट्रास्ट",
  invite_caregiver:"देखभालकर्ता को आमंत्रित करें", connected_caregivers:"जुड़े हुए देखभालकर्ता",
  sharing_permissions:"साझाकरण अनुमतियाँ", who_has_access:"किसके पास पहुँच है?",
  revoke_access:"पहुँच रद्द करें", revoke_all:"सारी पहुँच रद्द करें",
  emergency_call:"आपातकालीन सेवा को कॉल करें", emergency_contact:"आपातकालीन संपर्क", nearby_emergency:"नज़दीकी आपातकालीन सुविधा",
  welcome_back:"वापसी पर स्वागत है", create_account:"अपना खाता बनाएँ", patient:"मरीज़", caregiver:"देखभालकर्ता",
  no_upcoming_appointments:"कोई आगामी अपॉइंटमेंट नहीं।", no_medicines:"अभी तक कोई दवा नहीं जोड़ी गई।",
  try_again:"पुनः प्रयास करें", unable_to_load:"यह डेटा लोड नहीं हो सका।",
},
te:{
  app_name:"కేర్‌కనెక్ట్", tagline:"ఆసుపత్రిని మించి సంరక్షణను అనుసంధానించడం",
  nav_home:"హోమ్", nav_medicines:"మందులు", nav_appointments:"అపాయింట్‌మెంట్లు", nav_healthcare:"ఆరోగ్య సేవలు",
  nav_records:"రికార్డులు", nav_postdischarge:"డిశ్చార్జ్ తర్వాత సంరక్షణ", nav_consult:"రిమోట్ కన్సల్టేషన్", nav_caregiver:"సంరక్షకుడు",
  nav_privacy:"గోప్యతా కేంద్రం", nav_notifications:"నోటిఫికేషన్లు", nav_voice:"వాయిస్ అసిస్టెంట్", nav_emergency:"అత్యవసరం",
  nav_profile:"ప్రొఫైల్", nav_settings:"సెట్టింగ్‌లు", nav_more:"మరిన్ని", nav_logout:"లాగ్ అవుట్", nav_dashboard:"డాష్‌బోర్డ్",
  get_started:"ప్రారంభించండి", explore:"కేర్‌కనెక్ట్‌ను అన్వేషించండి", login:"లాగిన్", register:"నమోదు చేయండి",
  good_morning:"శుభోదయం", good_afternoon:"శుభ మధ్యాహ్నం", good_evening:"శుభ సాయంత్రం",
  next_medicine:"తదుపరి మందు", next_appointment:"తదుపరి అపాయింట్‌మెంట్", next_followup:"తదుపరి ఫాలో-అప్",
  unread_notifications:"చదవని నోటిఫికేషన్లు", none_scheduled:"ఏదీ షెడ్యూల్ చేయలేదు",
  medicines_title:"మందులు", appointments_title:"అపాయింట్‌మెంట్లు", healthcare_title:"సమీప ఆరోగ్య సేవలు",
  records_title:"ఆరోగ్య రికార్డులు", postdischarge_title:"డిశ్చార్జ్ తర్వాత సంరక్షణ", consult_title:"రిమోట్ కన్సల్టేషన్",
  caregiver_title:"సంరక్షకుడు", privacy_title:"సమ్మతి & గోప్యతా కేంద్రం", notifications_title:"నోటిఫికేషన్లు",
  voice_title:"వాయిస్ అసిస్టెంట్", emergency_title:"అత్యవసర సహాయం", profile_title:"ప్రొఫైల్", settings_title:"సెట్టింగ్‌లు",
  add:"జోడించు", edit:"సవరించు", delete:"తొలగించు", cancel:"రద్దు చేయి", save:"సేవ్ చేయి", saved:"సేవ్ చేయబడింది", close:"మూసివేయి",
  mark_taken:"తీసుకున్నట్లు గుర్తించు", mark_missed:"మిస్ అయినట్లు గుర్తించు", view_history:"చరిత్రను చూడండి",
  upcoming:"రాబోయే", past:"గత", cancelled:"రద్దు చేయబడింది",
  language_settings:"భాష", accessibility:"అందుబాటు", text_size:"టెక్స్ట్ పరిమాణం", contrast:"కాంట్రాస్ట్",
  reduced_motion:"తగ్గిన చలనం", text_to_speech:"టెక్స్ట్-టు-స్పీచ్", speech_to_text:"స్పీచ్-టు-టెక్స్ట్",
  standard:"ప్రామాణిక", large:"పెద్దది", extra_large:"మరింత పెద్దది", high_contrast:"అధిక కాంట్రాస్ట్",
  invite_caregiver:"సంరక్షకుడిని ఆహ్వానించండి", connected_caregivers:"అనుసంధానిత సంరక్షకులు",
  sharing_permissions:"భాగస్వామ్య అనుమతులు", who_has_access:"ఎవరికి యాక్సెస్ ఉంది?",
  revoke_access:"యాక్సెస్ ఉపసంహరించు", revoke_all:"మొత్తం యాక్సెస్ ఉపసంహరించు",
  emergency_call:"అత్యవసర సేవకు కాల్ చేయండి", emergency_contact:"అత్యవసర సంప్రదింపు", nearby_emergency:"సమీప అత్యవసర సదుపాయం",
  welcome_back:"తిరిగి స్వాగతం", create_account:"మీ ఖాతాను సృష్టించండి", patient:"రోగి", caregiver:"సంరక్షకుడు",
  no_upcoming_appointments:"రాబోయే అపాయింట్‌మెంట్లు లేవు.", no_medicines:"ఇంకా మందులు జోడించలేదు.",
  try_again:"మళ్ళీ ప్రయత్నించండి", unable_to_load:"ఈ డేటాను లోడ్ చేయలేకపోయాము.",
},
kn:{
  app_name:"ಕೇರ್‌ಕನೆಕ್ಟ್", tagline:"ಆಸ್ಪತ್ರೆಯನ್ನು ಮೀರಿ ಆರೈಕೆಯನ್ನು ಸಂಪರ್ಕಿಸುವುದು",
  nav_home:"ಮುಖಪುಟ", nav_medicines:"ಔಷಧಿಗಳು", nav_appointments:"ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು", nav_healthcare:"ಆರೋಗ್ಯ ಸೇವೆಗಳು",
  nav_records:"ದಾಖಲೆಗಳು", nav_postdischarge:"ಡಿಸ್ಚಾರ್ಜ್ ನಂತರದ ಆರೈಕೆ", nav_consult:"ರಿಮೋಟ್ ಸಮಾಲೋಚನೆ", nav_caregiver:"ಆರೈಕೆದಾರ",
  nav_privacy:"ಗೌಪ್ಯತಾ ಕೇಂದ್ರ", nav_notifications:"ಅಧಿಸೂಚನೆಗಳು", nav_voice:"ಧ್ವನಿ ಸಹಾಯಕ", nav_emergency:"ತುರ್ತು",
  nav_profile:"ಪ್ರೊಫೈಲ್", nav_settings:"ಸೆಟ್ಟಿಂಗ್‌ಗಳು", nav_more:"ಇನ್ನಷ್ಟು", nav_logout:"ಲಾಗ್ ಔಟ್", nav_dashboard:"ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
  get_started:"ಪ್ರಾರಂಭಿಸಿ", explore:"ಕೇರ್‌ಕನೆಕ್ಟ್ ಅನ್ವೇಷಿಸಿ", login:"ಲಾಗಿನ್", register:"ನೋಂದಣಿ",
  good_morning:"ಶುಭೋದಯ", good_afternoon:"ಶುಭ ಮಧ್ಯಾಹ್ನ", good_evening:"ಶುಭ ಸಂಜೆ",
  next_medicine:"ಮುಂದಿನ ಔಷಧಿ", next_appointment:"ಮುಂದಿನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್", next_followup:"ಮುಂದಿನ ಫಾಲೋ-ಅಪ್",
  unread_notifications:"ಓದದ ಅಧಿಸೂಚನೆಗಳು", none_scheduled:"ಯಾವುದೂ ನಿಗದಿಯಾಗಿಲ್ಲ",
  medicines_title:"ಔಷಧಿಗಳು", appointments_title:"ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು", healthcare_title:"ಹತ್ತಿರದ ಆರೋಗ್ಯ ಸೇವೆಗಳು",
  records_title:"ಆರೋಗ್ಯ ದಾಖಲೆಗಳು", postdischarge_title:"ಡಿಸ್ಚಾರ್ಜ್ ನಂತರದ ಆರೈಕೆ", consult_title:"ರಿಮೋಟ್ ಸಮಾಲೋಚನೆ",
  caregiver_title:"ಆರೈಕೆದಾರ", privacy_title:"ಸಮ್ಮತಿ ಮತ್ತು ಗೌಪ್ಯತಾ ಕೇಂದ್ರ", notifications_title:"ಅಧಿಸೂಚನೆಗಳು",
  voice_title:"ಧ್ವನಿ ಸಹಾಯಕ", emergency_title:"ತುರ್ತು ಸಹಾಯ", profile_title:"ಪ್ರೊಫೈಲ್", settings_title:"ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
  add:"ಸೇರಿಸಿ", edit:"ಸಂಪಾದಿಸಿ", delete:"ಅಳಿಸಿ", cancel:"ರದ್ದುಮಾಡಿ", save:"ಉಳಿಸಿ", saved:"ಉಳಿಸಲಾಗಿದೆ", close:"ಮುಚ್ಚಿ",
  mark_taken:"ತೆಗೆದುಕೊಂಡಂತೆ ಗುರುತಿಸಿ", mark_missed:"ತಪ್ಪಿಸಿದಂತೆ ಗುರುತಿಸಿ", view_history:"ಇತಿಹಾಸ ವೀಕ್ಷಿಸಿ",
  upcoming:"ಮುಂಬರುವ", past:"ಹಿಂದಿನ", cancelled:"ರದ್ದುಗೊಂಡಿದೆ",
  language_settings:"ಭಾಷೆ", accessibility:"ಪ್ರವೇಶಿಸುವಿಕೆ", text_size:"ಪಠ್ಯ ಗಾತ್ರ", contrast:"ಕಾಂಟ್ರಾಸ್ಟ್",
  reduced_motion:"ಕಡಿಮೆ ಚಲನೆ", text_to_speech:"ಪಠ್ಯದಿಂದ ಧ್ವನಿ", speech_to_text:"ಧ್ವನಿಯಿಂದ ಪಠ್ಯ",
  standard:"ಪ್ರಮಾಣಿತ", large:"ದೊಡ್ಡದು", extra_large:"ಹೆಚ್ಚು ದೊಡ್ಡದು", high_contrast:"ಹೆಚ್ಚಿನ ಕಾಂಟ್ರಾಸ್ಟ್",
  invite_caregiver:"ಆರೈಕೆದಾರರನ್ನು ಆಹ್ವಾನಿಸಿ", connected_caregivers:"ಸಂಪರ್ಕಿತ ಆರೈಕೆದಾರರು",
  sharing_permissions:"ಹಂಚಿಕೆ ಅನುಮತಿಗಳು", who_has_access:"ಯಾರಿಗೆ ಪ್ರವೇಶವಿದೆ?",
  revoke_access:"ಪ್ರವೇಶ ಹಿಂಪಡೆಯಿರಿ", revoke_all:"ಎಲ್ಲಾ ಪ್ರವೇಶ ಹಿಂಪಡೆಯಿರಿ",
  emergency_call:"ತುರ್ತು ಸೇವೆಗೆ ಕರೆ ಮಾಡಿ", emergency_contact:"ತುರ್ತು ಸಂಪರ್ಕ", nearby_emergency:"ಹತ್ತಿರದ ತುರ್ತು ಸೌಲಭ್ಯ",
  welcome_back:"ಮತ್ತೆ ಸ್ವಾಗತ", create_account:"ನಿಮ್ಮ ಖಾತೆ ರಚಿಸಿ", patient:"ರೋಗಿ", caregiver:"ಆರೈಕೆದಾರ",
  no_upcoming_appointments:"ಮುಂಬರುವ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳಿಲ್ಲ.", no_medicines:"ಇನ್ನೂ ಯಾವುದೇ ಔಷಧಿ ಸೇರಿಸಿಲ್ಲ.",
  try_again:"ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", unable_to_load:"ಈ ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡಲಾಗಲಿಲ್ಲ.",
},
ml:{
  app_name:"കെയർകണക്ട്", tagline:"ആശുപത്രിക്ക് അപ്പുറം പരിചരണം ബന്ധിപ്പിക്കുന്നു",
  nav_home:"ഹോം", nav_medicines:"മരുന്നുകൾ", nav_appointments:"അപ്പോയിന്റ്മെന്റുകൾ", nav_healthcare:"ആരോഗ്യ സേവനങ്ങൾ",
  nav_records:"രേഖകൾ", nav_postdischarge:"ഡിസ്ചാർജിന് ശേഷമുള്ള പരിചരണം", nav_consult:"വിദൂര കൺസൾട്ടേഷൻ", nav_caregiver:"പരിചാരകൻ",
  nav_privacy:"സ്വകാര്യതാ കേന്ദ്രം", nav_notifications:"അറിയിപ്പുകൾ", nav_voice:"വോയ്സ് അസിസ്റ്റന്റ്", nav_emergency:"അടിയന്തരം",
  nav_profile:"പ്രൊഫൈൽ", nav_settings:"ക്രമീകരണങ്ങൾ", nav_more:"കൂടുതൽ", nav_logout:"ലോഗ് ഔട്ട്", nav_dashboard:"ഡാഷ്ബോർഡ്",
  get_started:"ആരംഭിക്കുക", explore:"കെയർകണക്ട് പര്യവേക്ഷണം ചെയ്യുക", login:"ലോഗിൻ", register:"രജിസ്റ്റർ ചെയ്യുക",
  good_morning:"സുപ്രഭാതം", good_afternoon:"ശുഭ ഉച്ച", good_evening:"ശുഭ സന്ധ്യ",
  next_medicine:"അടുത്ത മരുന്ന്", next_appointment:"അടുത്ത അപ്പോയിന്റ്മെന്റ്", next_followup:"അടുത്ത ഫോളോ-അപ്പ്",
  unread_notifications:"വായിക്കാത്ത അറിയിപ്പുകൾ", none_scheduled:"ഒന്നും ഷെഡ്യൂൾ ചെയ്തിട്ടില്ല",
  medicines_title:"മരുന്നുകൾ", appointments_title:"അപ്പോയിന്റ്മെന്റുകൾ", healthcare_title:"സമീപത്തെ ആരോഗ്യ സേവനങ്ങൾ",
  records_title:"ആരോഗ്യ രേഖകൾ", postdischarge_title:"ഡിസ്ചാർജിന് ശേഷമുള്ള പരിചരണം", consult_title:"വിദൂര കൺസൾട്ടേഷൻ",
  caregiver_title:"പരിചാരകൻ", privacy_title:"സമ്മതവും സ്വകാര്യതാ കേന്ദ്രവും", notifications_title:"അറിയിപ്പുകൾ",
  voice_title:"വോയ്സ് അസിസ്റ്റന്റ്", emergency_title:"അടിയന്തര സഹായം", profile_title:"പ്രൊഫൈൽ", settings_title:"ക്രമീകരണങ്ങൾ",
  add:"ചേർക്കുക", edit:"തിരുത്തുക", delete:"ഇല്ലാതാക്കുക", cancel:"റദ്ദാക്കുക", save:"സംരക്ഷിക്കുക", saved:"സംരക്ഷിച്ചു", close:"അടയ്ക്കുക",
  mark_taken:"കഴിച്ചതായി അടയാളപ്പെടുത്തുക", mark_missed:"നഷ്ടമായതായി അടയാളപ്പെടുത്തുക", view_history:"ചരിത്രം കാണുക",
  upcoming:"വരാനിരിക്കുന്നത്", past:"കഴിഞ്ഞത്", cancelled:"റദ്ദാക്കി",
  language_settings:"ഭാഷ", accessibility:"പ്രാപ്യത", text_size:"ടെക്സ്റ്റ് വലുപ്പം", contrast:"കോൺട്രാസ്റ്റ്",
  reduced_motion:"കുറഞ്ഞ ചലനം", text_to_speech:"ടെക്സ്റ്റ്-ടു-സ്പീച്ച്", speech_to_text:"സ്പീച്ച്-ടു-ടെക്സ്റ്റ്",
  standard:"സാധാരണ", large:"വലുത്", extra_large:"അധിക വലുത്", high_contrast:"ഉയർന്ന കോൺട്രാസ്റ്റ്",
  invite_caregiver:"പരിചാരകനെ ക്ഷണിക്കുക", connected_caregivers:"ബന്ധിപ്പിച്ച പരിചാരകർ",
  sharing_permissions:"പങ്കിടൽ അനുമതികൾ", who_has_access:"ആർക്കാണ് ആക്സസ്?",
  revoke_access:"ആക്സസ് പിൻവലിക്കുക", revoke_all:"എല്ലാ ആക്സസും പിൻവലിക്കുക",
  emergency_call:"അടിയന്തര സേവനത്തെ വിളിക്കുക", emergency_contact:"അടിയന്തര ബന്ധപ്പെടൽ", nearby_emergency:"സമീപത്തെ അടിയന്തര സൗകര്യം",
  welcome_back:"തിരികെ സ്വാഗതം", create_account:"നിങ്ങളുടെ അക്കൗണ്ട് സൃഷ്ടിക്കുക", patient:"രോഗി", caregiver:"പരിചാരകൻ",
  no_upcoming_appointments:"വരാനിരിക്കുന്ന അപ്പോയിന്റ്മെന്റുകൾ ഇല്ല.", no_medicines:"ഇതുവരെ മരുന്നുകളൊന്നും ചേർത്തിട്ടില്ല.",
  try_again:"വീണ്ടും ശ്രമിക്കുക", unable_to_load:"ഈ ഡാറ്റ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല.",
}
};

function t(key){
  const lang = (currentUser() && getSettings(currentUser().id).language) || 'en';
  return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
}

/* =========================================================
   CARECONNECT — "Database" layer (localStorage-backed)
   Tables mirror a relational schema:
   users, profiles, caregiver_connections, caregiver_permissions,
   medications, medication_logs, appointments, post_discharge_plans,
   post_discharge_tasks, health_records, notifications,
   healthcare_services, consultations, emergency_contacts,
   accessibility_preferences, user_settings, consents
========================================================= */
const DB_KEY = 'careconnect_db_v1';
const SESSION_KEY = 'careconnect_session_v1';

function uid(prefix){ return prefix + '_' + Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4); }
function nowISO(){ return new Date().toISOString(); }
function isoDate(d){ return d.toISOString().slice(0,10); }
function addDays(base, days){ const d = new Date(base); d.setDate(d.getDate()+days); return d; }

function emptyDB(){
  return {
    users: [], profiles: {}, caregiver_connections: [], caregiver_permissions: {},
    medications: [], medication_logs: [], appointments: [], post_discharge_plans: [],
    health_records: [], notifications: [], healthcare_services: [], consultations: [],
    emergency_contacts: [], accessibility_preferences: {}, user_settings: {}, consents: []
  };
}

function loadDB(){
  try{
    const raw = localStorage.getItem(DB_KEY);
    if(!raw) return seedDB();
    const db = JSON.parse(raw);
    return db;
  }catch(e){ return seedDB(); }
}
function saveDB(){
  // In Supabase mode, every mutation below already persists to Postgres via
  // an awaited call into window.CareConnectServices *before* this runs —
  // see e.g. openMedicineModal()'s submit handler. saveDB() only needs to
  // keep writing the in-memory DB to localStorage in local demo mode, so
  // every existing call site below can keep calling it unconditionally.
  if(window.BACKEND_MODE === 'supabase') return;
  try{ localStorage.setItem(DB_KEY, JSON.stringify(DB)); }catch(e){ console.error('storage error', e); }
}

function seedDB(){
  const db = emptyDB();

  // --- demo patient ---
  const patientId = 'user_patient_demo';
  const caregiverId = 'user_caregiver_demo';

  db.users.push({id:patientId, role:'patient', name:'Kamalam Devi', email:'kamalam@example.com', password:'demo1234', createdAt:nowISO()});
  db.users.push({id:caregiverId, role:'caregiver', name:'Priya Suresh', email:'priya@example.com', password:'demo1234', createdAt:nowISO()});

  db.profiles[patientId] = {
    fullName:'Kamalam Devi', age:68, gender:'Female', phone:'+91 98765 43210',
    preferredLanguage:'ta', location:'Erode, Tamil Nadu', emergencyContactName:'Priya Suresh',
    emergencyContactPhone:'+91 98450 11223', onboardingComplete:true
  };
  db.profiles[caregiverId] = {
    fullName:'Priya Suresh', age:39, gender:'Female', phone:'+91 98450 11223',
    preferredLanguage:'en', location:'Coimbatore, Tamil Nadu', onboardingComplete:true
  };

  db.accessibility_preferences[patientId] = {textSize:'large', contrast:'standard', reducedMotion:false, voiceAssist:true, textToSpeech:true};
  db.accessibility_preferences[caregiverId] = {textSize:'standard', contrast:'standard', reducedMotion:false, voiceAssist:false, textToSpeech:false};

  db.user_settings[patientId] = {language:'ta', notif_medicine:true, notif_appointment:true, notif_followup:true, notif_caregiver:true};
  db.user_settings[caregiverId] = {language:'en', notif_medicine:true, notif_appointment:true, notif_followup:true, notif_caregiver:true};

  db.emergency_contacts.push({id:uid('ec'), userId:patientId, name:'Priya Suresh (Daughter)', phone:'+91 98450 11223', relationship:'Daughter'});
  db.emergency_contacts.push({id:uid('ec'), userId:patientId, name:'Dr. Ramesh Babu', phone:'+91 422 224 5566', relationship:'Primary Doctor'});

  // Medicines
  const today = isoDate(new Date());
  const med1 = uid('med'); const med2 = uid('med'); const med3 = uid('med');
  db.medications.push({id:med1, userId:patientId, name:'Metformin 500mg', dosage:'1 tablet, as prescribed', frequency:'Twice daily', times:['08:00','20:00'], startDate:addDays(new Date(),-30).toISOString().slice(0,10), endDate:'', instructions:'Take after food, as advised by Dr. Ramesh Babu', active:true});
  db.medications.push({id:med2, userId:patientId, name:'Amlodipine 5mg', dosage:'1 tablet, as prescribed', frequency:'Once daily', times:['08:00'], startDate:addDays(new Date(),-60).toISOString().slice(0,10), endDate:'', instructions:'For blood pressure, take in the morning', active:true});
  db.medications.push({id:med3, userId:patientId, name:'Calcium + Vitamin D3', dosage:'1 tablet, as prescribed', frequency:'Once daily', times:['13:00'], startDate:addDays(new Date(),-10).toISOString().slice(0,10), endDate:'', instructions:'Take with lunch', active:true});
  db.medication_logs.push({id:uid('mlog'), medicationId:med1, date:addDays(new Date(),-1).toISOString().slice(0,10), time:'08:00', status:'taken'});
  db.medication_logs.push({id:uid('mlog'), medicationId:med1, date:addDays(new Date(),-1).toISOString().slice(0,10), time:'20:00', status:'missed'});
  db.medication_logs.push({id:uid('mlog'), medicationId:med2, date:addDays(new Date(),-1).toISOString().slice(0,10), time:'08:00', status:'taken'});

  // Appointments
  db.appointments.push({id:uid('appt'), userId:patientId, provider:'Dr. Ramesh Babu', hospital:'Erode General Hospital', date:addDays(new Date(),5).toISOString().slice(0,10), time:'10:30', type:'Follow-up Consultation', location:'Erode General Hospital, OPD Block', notes:'Bring recent blood sugar readings', status:'upcoming', reminder:true});
  db.appointments.push({id:uid('appt'), userId:patientId, provider:'Dr. Anitha Krishnan', hospital:'Sri Sai Diagnostics', date:addDays(new Date(),12).toISOString().slice(0,10), time:'09:00', type:'Lab Test', location:'Sri Sai Diagnostics, Gandhi Road', notes:'Fasting required', status:'upcoming', reminder:true});
  db.appointments.push({id:uid('appt'), userId:patientId, provider:'Dr. Ramesh Babu', hospital:'Erode General Hospital', date:addDays(new Date(),-20).toISOString().slice(0,10), time:'11:00', type:'Post-Discharge Review', location:'Erode General Hospital', notes:'Reviewed recovery progress', status:'past', reminder:false});

  // Post discharge plan
  const pdPlan = uid('pdp');
  db.post_discharge_plans.push({
    id:pdPlan, userId:patientId, hospital:'Erode General Hospital', dischargeDate:addDays(new Date(),-25).toISOString().slice(0,10),
    provider:'Dr. Ramesh Babu', followUpDate:addDays(new Date(),5).toISOString().slice(0,10),
    instructions:'Rest, low-salt diet, gentle walking 15 minutes daily, monitor blood pressure every morning.',
    medicationSchedule:'Metformin 500mg twice daily, Amlodipine 5mg once daily — see Medicines tab',
    testSchedule:'Fasting blood sugar test on ' + addDays(new Date(),12).toISOString().slice(0,10),
    notes:'Patient recovering well after cardiac observation stay.',
    tasks:[
      {id:uid('pdt'), label:'Discharge summary received', stage:'discharge', done:true},
      {id:uid('pdt'), label:'Medication schedule started', stage:'medication', done:true},
      {id:uid('pdt'), label:'Recovery instructions reviewed with caregiver', stage:'recovery', done:true},
      {id:uid('pdt'), label:'Follow-up appointment scheduled', stage:'followup', done:true},
      {id:uid('pdt'), label:'Fasting blood sugar test', stage:'diagnostic', done:false},
      {id:uid('pdt'), label:'Provider review of test results', stage:'review', done:false},
    ]
  });

  // Health records
  db.health_records.push({id:uid('hr'), userId:patientId, name:'Discharge Summary - Erode General Hospital', type:'Discharge Summary', date:addDays(new Date(),-25).toISOString().slice(0,10), uploadDate:addDays(new Date(),-24).toISOString().slice(0,10)});
  db.health_records.push({id:uid('hr'), userId:patientId, name:'Blood Test Report - Jan', type:'Lab Report', date:addDays(new Date(),-40).toISOString().slice(0,10), uploadDate:addDays(new Date(),-39).toISOString().slice(0,10)});
  db.health_records.push({id:uid('hr'), userId:patientId, name:'Prescription - Dr. Ramesh Babu', type:'Prescription', date:addDays(new Date(),-25).toISOString().slice(0,10), uploadDate:addDays(new Date(),-24).toISOString().slice(0,10)});

  // Healthcare services (demo/mock — would come from a maps API)
  db.healthcare_services = [
    {id:uid('svc'), name:'Erode General Hospital', type:'Hospital', address:'Perundurai Road, Erode', distance:'1.2 km', phone:'+91 424 225 1234', open:true},
    {id:uid('svc'), name:'Sri Sai Diagnostics', type:'Diagnostic Centre', address:'Gandhi Road, Erode', distance:'2.0 km', phone:'+91 424 225 5678', open:true},
    {id:uid('svc'), name:'Apollo Pharmacy', type:'Pharmacy', address:'Brough Road, Erode', distance:'0.6 km', phone:'+91 424 225 9012', open:true},
    {id:uid('svc'), name:'Lotus Family Clinic', type:'Clinic', address:'RKV Road, Erode', distance:'1.5 km', phone:'+91 424 225 3456', open:false},
    {id:uid('svc'), name:'Erode Emergency & Trauma Centre', type:'Emergency Facility', address:'Collector Office Road, Erode', distance:'2.8 km', phone:'108', open:true},
    {id:uid('svc'), name:'Nandha Medical Centre', type:'Hospital', address:'Perundurai, Erode', distance:'6.4 km', phone:'+91 424 226 7788', open:true},
  ];

  // Consultations
  db.consultations.push({id:uid('con'), userId:patientId, providerType:'General Physician', notes:'Follow-up on blood pressure readings', status:'Confirmed', requestedDate:addDays(new Date(),3).toISOString().slice(0,10)});

  // Caregiver connection
  const connId = uid('conn');
  db.caregiver_connections.push({id:connId, patientId, caregiverId, relationship:'Daughter', status:'accepted', invitedAt:addDays(new Date(),-50).toISOString()});
  db.caregiver_permissions[connId] = {appointments:true, medicines:true, postDischarge:true, healthRecords:false, notifications:true};

  // Notifications
  db.notifications.push({id:uid('note'), userId:patientId, type:'medicine', title:'Medicine reminder', message:'Time to take Metformin 500mg (08:00 AM).', date:nowISO(), read:false});
  db.notifications.push({id:uid('note'), userId:patientId, type:'appointment', title:'Appointment in 5 days', message:'Follow-up with Dr. Ramesh Babu on ' + db.appointments[0].date + ' at 10:30.', date:nowISO(), read:false});
  db.notifications.push({id:uid('note'), userId:patientId, type:'followup', title:'Follow-up scheduled', message:'Your post-discharge follow-up is coming up.', date:addDays(new Date(),-1).toISOString(), read:true});
  db.notifications.push({id:uid('note'), userId:patientId, type:'caregiver', title:'Caregiver connected', message:'Priya Suresh (Daughter) is now connected as your caregiver.', date:addDays(new Date(),-50).toISOString(), read:true});
  db.notifications.push({id:uid('note'), userId:caregiverId, type:'caregiver', title:'Connected to Kamalam Devi', message:'You can now view shared information for Kamalam Devi.', date:addDays(new Date(),-50).toISOString(), read:true});
  db.notifications.push({id:uid('note'), userId:caregiverId, type:'medicine', title:'Medicine missed', message:'Kamalam Devi missed her 08:00 PM Metformin dose yesterday.', date:nowISO(), read:false});

  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
}

let DB = emptyDB();

/**
 * Fetches everything the current session needs from Supabase and populates
 * the same in-memory `DB` shape that local mode builds from localStorage —
 * every render*() function below reads DB.medications / DB.appointments /
 * etc. and doesn't know or care which mode filled them in.
 *
 * For a caregiver, only the domains their patients have actually shared
 * (per caregiver_permissions) are fetched — Postgres RLS would block the
 * rest anyway, but there's no reason to ask for data we know is off.
 */
async function hydrateFromSupabase(){
  const svc = window.CareConnectServices;
  DB = emptyDB();

  const session = await svc.auth.getSession();
  if(!session){ clearSession(); return; }

  const userId = session.user.id;
  const profile = await svc.profiles.getProfile(userId);
  const role = profile.role;

  setSession(userId, role);
  DB.users.push({id:userId, role, name:profile.fullName, email:profile.email});
  DB.profiles[userId] = profile;
  DB.accessibility_preferences[userId] = await svc.profiles.getAccessibility(userId);
  DB.user_settings[userId] = await svc.profiles.getSettings(userId);
  DB.healthcare_services = await svc.healthcare.listServices();

  if(role === 'patient'){
    DB.notifications = await svc.notifications.listNotifications(userId);
    DB.medications = await svc.medicines.listMedications(userId);
    DB.medication_logs = await svc.medicines.listMedicationLogs(userId);
    DB.appointments = await svc.appointments.listAppointments(userId);
    DB.post_discharge_plans = await svc.postDischarge.listPlans(userId);
    DB.health_records = await svc.records.listRecords(userId);
    DB.consultations = await svc.consultations.listConsultations(userId);
    DB.emergency_contacts = await svc.emergencyContacts.listEmergencyContacts(userId);

    const connections = await svc.caregivers.listConnectionsForPatient(userId);
    DB.caregiver_connections = connections;
    for(const c of connections){
      DB.caregiver_permissions[c.id] = await svc.caregivers.getPermissions(c.id);
      if(c.caregiverId && !DB.users.find(u=>u.id===c.caregiverId)){
        const cgProfile = await svc.profiles.getProfile(c.caregiverId);
        DB.profiles[c.caregiverId] = cgProfile;
        DB.users.push({id:c.caregiverId, role:'caregiver', name:cgProfile.fullName, email:cgProfile.email});
      }
    }
  } else {
    // Caregiver: pull each connected, accepted patient's shared domains only.
    DB.notifications = await svc.notifications.listNotifications(userId);
    const connections = await svc.caregivers.listConnectionsForCaregiver(userId);
    DB.caregiver_connections = connections;
    for(const c of connections){
      const perms = await svc.caregivers.getPermissions(c.id);
      DB.caregiver_permissions[c.id] = perms;

      const patientProfile = await svc.profiles.getProfile(c.patientId);
      DB.profiles[c.patientId] = patientProfile;
      if(!DB.users.find(u=>u.id===c.patientId)){
        DB.users.push({id:c.patientId, role:'patient', name:patientProfile.fullName, email:patientProfile.email});
      }

      if(perms.appointments) DB.appointments.push(...await svc.appointments.listAppointments(c.patientId));
      if(perms.medicines) DB.medications.push(...await svc.medicines.listMedications(c.patientId));
      if(perms.postDischarge) DB.post_discharge_plans.push(...await svc.postDischarge.listPlans(c.patientId));
      if(perms.healthRecords) DB.health_records.push(...await svc.records.listRecords(c.patientId));
      if(perms.notifications) DB.notifications.push(...await svc.notifications.listNotifications(c.patientId));
    }
  }
}

/* ---------- session ---------- */
function getSession(){
  try{ return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }catch(e){ return null; }
}
function setSession(userId, role){
  localStorage.setItem(SESSION_KEY, JSON.stringify({userId, role}));
}
function clearSession(){ localStorage.removeItem(SESSION_KEY); }
function currentUser(){
  const s = getSession();
  if(!s) return null;
  return DB.users.find(u=>u.id===s.userId) || null;
}
function currentRole(){ const s = getSession(); return s ? s.role : null; }

/* ---------- generic helpers ---------- */
function getProfile(userId){ return DB.profiles[userId] || {}; }
function getA11y(userId){ return DB.accessibility_preferences[userId] || {textSize:'standard', contrast:'standard', reducedMotion:false, voiceAssist:false, textToSpeech:false}; }
function getSettings(userId){ return DB.user_settings[userId] || {language:'en', notif_medicine:true, notif_appointment:true, notif_followup:true, notif_caregiver:true}; }

function userMedications(userId){ return DB.medications.filter(m=>m.userId===userId); }
function userAppointments(userId){ return DB.appointments.filter(a=>a.userId===userId); }
function userRecords(userId){ return DB.health_records.filter(r=>r.userId===userId); }
function userPlans(userId){ return DB.post_discharge_plans.filter(p=>p.userId===userId); }
function userNotifications(userId){ return DB.notifications.filter(n=>n.userId===userId).sort((a,b)=> new Date(b.date)-new Date(a.date)); }
function userConsultations(userId){ return DB.consultations.filter(c=>c.userId===userId); }
function userEmergencyContacts(userId){ return DB.emergency_contacts.filter(e=>e.userId===userId); }

function caregiverConnectionsForPatient(patientId){ return DB.caregiver_connections.filter(c=>c.patientId===patientId); }
function patientConnectionsForCaregiver(caregiverId){ return DB.caregiver_connections.filter(c=>c.caregiverId===caregiverId); }

function applyA11y(){
  const u = currentUser();
  const prefs = u ? getA11y(u.id) : {textSize:'standard', contrast:'standard', reducedMotion:false};
  document.documentElement.setAttribute('data-textsize', prefs.textSize || 'standard');
  document.documentElement.setAttribute('data-contrast', prefs.contrast || 'standard');
  document.documentElement.setAttribute('data-reduced-motion', prefs.reducedMotion ? 'true' : 'false');
}

function fmtDate(dateStr){
  if(!dateStr) return '—';
  const d = new Date(dateStr + (dateStr.length<=10 ? 'T00:00:00' : ''));
  if(isNaN(d)) return dateStr;
  return d.toLocaleDateString(undefined, {day:'numeric', month:'short', year:'numeric'});
}
function fmtTime(timeStr){
  if(!timeStr) return '';
  const [h,m] = timeStr.split(':').map(Number);
  const ampm = h>=12?'PM':'AM';
  const hh = ((h+11)%12)+1;
  return hh+':'+String(m).padStart(2,'0')+' '+ampm;
}
function fmtDateTime(iso){
  const d = new Date(iso);
  return d.toLocaleDateString(undefined,{day:'numeric',month:'short'}) + ', ' + d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
}

/* ---------- toast ---------- */
function toast(message, type){
  const region = document.getElementById('toast-region');
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' '+type : '');
  el.textContent = message;
  region.appendChild(el);
  setTimeout(()=>{ el.remove(); }, 3200);
}

/* ---------- simple confirm modal ---------- */
function confirmDialog(opts, onConfirm){
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div class="modal-header">
        <h3 id="confirm-title">${escapeHtml(opts.title || 'Are you sure?')}</h3>
        <button class="modal-close" aria-label="${t('close')}">&times;</button>
      </div>
      <p>${escapeHtml(opts.message || '')}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-act="cancel">${t('cancel')}</button>
        <button class="btn ${opts.danger ? 'btn-danger':'btn-primary'}" data-act="confirm">${escapeHtml(opts.confirmLabel || 'Confirm')}</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  const close = ()=> backdrop.remove();
  backdrop.querySelector('.modal-close').onclick = close;
  backdrop.querySelector('[data-act="cancel"]').onclick = close;
  backdrop.querySelector('[data-act="confirm"]').onclick = ()=>{ close(); onConfirm(); };
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) close(); });
  backdrop.querySelector('[data-act="confirm"]').focus();
}

function escapeHtml(str){
  if(str===undefined || str===null) return '';
  return String(str).replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/**
 * Adds a notification for `userId` and keeps DB.notifications in sync so it
 * shows up immediately without waiting for a re-hydrate. Works for both the
 * current user (a normal insert, allowed by RLS) and, in Supabase mode, the
 * *other* party in a caregiver connection (via the notify_user() RPC —
 * RLS deliberately won't let a client insert a row for someone else's
 * user_id directly; see the migration's notifications_write policy).
 */
async function addNotification(userId, type, title, message){
  if(window.BACKEND_MODE === 'supabase'){
    const user = currentUser();
    const svc = window.CareConnectServices.notifications;
    if(user && user.id === userId){
      const saved = await svc.addNotification(userId, type, title, message);
      DB.notifications.unshift(saved);
    } else {
      await svc.notifyOtherUser(userId, type, title, message);
      // Not our own notification list — nothing to add to DB locally.
    }
    return;
  }
  DB.notifications.push({id:uid('note'), userId, type, title, message, date:nowISO(), read:false});
  saveDB();
}

/* =========================================================
   ROUTER + APP SHELL
========================================================= */
const NAV_ITEMS_PATIENT = [
  {route:'dashboard', icon:'🏠', label:'nav_home'},
  {route:'medicines', icon:'💊', label:'nav_medicines'},
  {route:'appointments', icon:'📅', label:'nav_appointments'},
  {route:'healthcare', icon:'🏥', label:'nav_healthcare'},
  {route:'records', icon:'📋', label:'nav_records'},
  {route:'postdischarge', icon:'🩺', label:'nav_postdischarge'},
  {route:'consult', icon:'💻', label:'nav_consult'},
  {route:'caregiver', icon:'👨‍👩‍👧', label:'nav_caregiver'},
  {route:'privacy', icon:'🔒', label:'nav_privacy'},
  {route:'notifications', icon:'🔔', label:'nav_notifications'},
  {route:'voice', icon:'🎙', label:'nav_voice'},
  {route:'emergency', icon:'🆘', label:'nav_emergency'},
  {route:'profile', icon:'👤', label:'nav_profile'},
  {route:'settings', icon:'⚙️', label:'nav_settings'},
];
const NAV_ITEMS_CAREGIVER = [
  {route:'caregiver-dashboard', icon:'🏠', label:'nav_home'},
  {route:'notifications', icon:'🔔', label:'nav_notifications'},
  {route:'profile', icon:'👤', label:'nav_profile'},
  {route:'settings', icon:'⚙️', label:'nav_settings'},
];
const MOBILE_NAV_PATIENT = [
  {route:'dashboard', icon:'🏠', label:'nav_home'},
  {route:'medicines', icon:'💊', label:'nav_medicines'},
  {route:'appointments', icon:'📅', label:'nav_appointments'},
  {route:'healthcare', icon:'🏥', label:'nav_healthcare'},
  {route:'more', icon:'☰', label:'nav_more'},
];

const PUBLIC_ROUTES = ['landing','login','register'];

function currentRoute(){
  const hash = location.hash.replace(/^#\/?/, '');
  return hash || 'landing';
}
function navigate(route){ location.hash = '#/' + route; }

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', bootApp);

/**
 * App entry point. In local demo mode this is synchronous-fast (just reads
 * localStorage, same as the original build). In Supabase mode it awaits one
 * round trip to restore the session and hydrate DB before the first
 * render(), then keeps DB in sync with Supabase's own auth state changes
 * (e.g. a token refresh, or signing out in another tab).
 */
async function bootApp(){
  if(window.BACKEND_MODE === 'supabase'){
    try{
      await hydrateFromSupabase();
    }catch(err){
      console.error('Could not restore your session:', err);
      DB = emptyDB();
      clearSession();
    }
    window.CareConnectServices.auth.onAuthStateChange(async (event)=>{
      if(event === 'SIGNED_OUT'){
        DB = emptyDB();
        clearSession();
        render();
      }
    });
  } else {
    DB = loadDB();
  }
  applyA11y();
  render();
}

function render(){
  applyA11y();
  const route = currentRoute();
  const user = currentUser();

  if(!user && !PUBLIC_ROUTES.includes(route) && route.indexOf('onboarding')!==0){
    location.hash = '#/landing';
    return;
  }
  if(user && (route==='landing' || route==='login' || route==='register')){
    location.hash = '#/' + (currentRole()==='caregiver' ? 'caregiver-dashboard' : 'dashboard');
    return;
  }

  const app = document.getElementById('app');
  let html = '';

  switch(route){
    case 'landing': html = renderLanding(); break;
    case 'login': html = renderAuth('login'); break;
    case 'register': html = renderAuth('register'); break;
    case 'onboarding': html = renderOnboarding(); break;
    case 'dashboard': html = renderShell(renderPatientDashboard()); break;
    case 'medicines': html = renderShell(renderMedicines()); break;
    case 'appointments': html = renderShell(renderAppointments()); break;
    case 'healthcare': html = renderShell(renderHealthcareDiscovery()); break;
    case 'records': html = renderShell(renderHealthRecords()); break;
    case 'postdischarge': html = renderShell(renderPostDischarge()); break;
    case 'consult': html = renderShell(renderConsult()); break;
    case 'caregiver': html = renderShell(renderCaregiverManage()); break;
    case 'privacy': html = renderShell(renderPrivacyCentre()); break;
    case 'notifications': html = renderShell(renderNotifications()); break;
    case 'voice': html = renderShell(renderVoiceAssistant()); break;
    case 'emergency': html = renderShell(renderEmergency()); break;
    case 'profile': html = renderShell(renderProfile()); break;
    case 'settings': html = renderShell(renderSettings()); break;
    case 'more': html = renderShell(renderMoreMenu()); break;
    case 'caregiver-dashboard': html = renderShell(renderCaregiverDashboard()); break;
    default: html = renderShell(`<div class="state-block"><div class="state-icon">🔍</div><h3>Page not found</h3><p>That route doesn't exist.</p><button class="btn btn-primary" onclick="navigate('${user?(currentRole()==='caregiver'?'caregiver-dashboard':'dashboard'):'landing'}')">Go Home</button></div>`);
  }

  app.innerHTML = html;
  window.scrollTo(0,0);
  bindGlobalEvents();
}

function bindGlobalEvents(){
  document.querySelectorAll('[data-nav]').forEach(el=>{
    el.addEventListener('click', e=>{ e.preventDefault(); navigate(el.getAttribute('data-nav')); });
  });
}

function appShellHeader(){
  const user = currentUser();
  const role = currentRole();
  const profile = getProfile(user.id);
  const unread = userNotifications(user.id).filter(n=>!n.read).length;
  return `
  <header class="topbar">
    <button class="icon-btn" id="mobile-menu-btn" aria-label="${t('nav_more')}" style="display:none" onclick="navigate('more')">☰</button>
    <div style="font-family:var(--font-display);font-weight:600;color:var(--teal-900);font-size:1.15rem;">${escapeHtml(t('app_name'))}</div>
    <div class="topbar-actions">
      <label class="visually-hidden" for="lang-select-top">${t('language_settings')}</label>
      <select id="lang-select-top" class="input" style="min-height:40px;padding:6px 10px;width:auto;" onchange="changeLanguage(this.value)">
        ${LANGS.map(l=>`<option value="${l.code}" ${getSettings(user.id).language===l.code?'selected':''}>${l.label}</option>`).join('')}
      </select>
      <button class="icon-btn" aria-label="${t('nav_notifications')}" data-nav="notifications">
        🔔 ${unread>0?`<span class="badge-dot">${unread>9?'9+':unread}</span>`:''}
      </button>
      <button class="icon-btn" aria-label="${t('nav_profile')}" data-nav="profile">👤</button>
    </div>
  </header>`;
}

function renderShell(contentHtml){
  const user = currentUser();
  const role = currentRole();
  const route = currentRoute();
  const navItems = role==='caregiver' ? NAV_ITEMS_CAREGIVER : NAV_ITEMS_PATIENT;
  const mobileNav = role==='caregiver' ? [
    {route:'caregiver-dashboard', icon:'🏠', label:'nav_home'},
    {route:'notifications', icon:'🔔', label:'nav_notifications'},
    {route:'profile', icon:'👤', label:'nav_profile'},
    {route:'settings', icon:'⚙️', label:'nav_settings'},
  ] : MOBILE_NAV_PATIENT;

  return `
  <div class="app-shell">
    <nav class="sidebar" aria-label="Main navigation">
      <a href="#/${role==='caregiver'?'caregiver-dashboard':'dashboard'}" class="sidebar-brand" data-nav="${role==='caregiver'?'caregiver-dashboard':'dashboard'}">
        <span class="logo-mark">C</span>
        <span class="brand-name">${escapeHtml(t('app_name'))}</span>
      </a>
      ${navItems.map(item=>`
        <a href="#/${item.route}" class="nav-link ${route===item.route?'active':''}" data-nav="${item.route}">
          <span class="nav-icon" aria-hidden="true">${item.icon}</span> ${t(item.label)}
        </a>`).join('')}
      <div class="sidebar-footer">
        <button class="nav-link" style="width:100%;background:none;border:none;cursor:pointer;text-align:left;" onclick="doLogout()">
          <span class="nav-icon" aria-hidden="true">🚪</span> ${t('nav_logout')}
        </button>
      </div>
    </nav>
    <div class="main-col">
      ${appShellHeader()}
      <main class="page-content" id="main-content">${contentHtml}</main>
    </div>
  </div>
  <nav class="mobile-bottom-nav" aria-label="Mobile navigation">
    ${mobileNav.map(item=>`
      <a href="#/${item.route}" class="${route===item.route || (item.route==='more' && !mobileNav.find(m=>m.route===route))?'active':''}" data-nav="${item.route}">
        <span class="mbn-icon" aria-hidden="true">${item.icon}</span>${t(item.label)}
      </a>`).join('')}
  </nav>`;
}

async function changeLanguage(code){
  const user = currentUser();
  if(window.BACKEND_MODE === 'supabase'){
    DB.user_settings[user.id] = await window.CareConnectServices.profiles.updateSettings(user.id, {language:code});
  } else {
    DB.user_settings[user.id] = Object.assign(getSettings(user.id), {language:code});
  }
  saveDB();
  render();
  toast(t('saved'), 'success');
}

function doLogout(){
  confirmDialog({title:t('nav_logout'), message:'Are you sure you want to log out?', confirmLabel:t('nav_logout')}, async ()=>{
    if(window.BACKEND_MODE === 'supabase'){
      try{ await window.CareConnectServices.auth.signOut(); }catch(e){ console.error(e); }
      DB = emptyDB();
    }
    clearSession();
    navigate('landing');
  });
}

function renderMoreMenu(){
  const role = currentRole();
  const items = role==='caregiver' ? NAV_ITEMS_CAREGIVER : NAV_ITEMS_PATIENT;
  return `
  <div class="section-heading-row"><h1>${t('nav_more')}</h1></div>
  <div class="grid grid-2">
    ${items.map(item=>`
      <a class="feature-tile" href="#/${item.route}" data-nav="${item.route}">
        <span class="tile-icon" aria-hidden="true">${item.icon}</span>
        <span class="tile-title">${t(item.label)}</span>
      </a>`).join('')}
  </div>`;
}

/* =========================================================
   LANDING PAGE
========================================================= */
function renderLanding(){
  return `
  <div>
    <nav class="landing-nav">
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="logo-mark" style="width:36px;height:36px;border-radius:10px;background:var(--gold-500);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;color:var(--teal-900);">C</span>
        <span style="font-family:var(--font-display);font-size:1.3rem;font-weight:600;color:var(--teal-900);">CareConnect</span>
      </div>
      <div style="display:flex;gap:10px;align-items:center;">
        <button class="btn btn-outline btn-sm" onclick="navigate('login')">Log In</button>
        <button class="btn btn-primary btn-sm" onclick="navigate('register')">Get Started</button>
      </div>
    </nav>

    <section class="landing-hero">
      <div class="landing-hero-inner">
        <div>
          <div class="hero-eyebrow">Healthcare support, before and after the hospital</div>
          <h1>Connecting Care Beyond the Hospital</h1>
          <p style="font-size:1.15rem;color:var(--ink-soft);max-width:520px;">A multilingual and accessibility-focused digital healthcare platform helping patients manage everyday healthcare needs while staying connected with caregivers and healthcare services.</p>
          <div class="hero-actions">
            <button class="btn btn-primary" onclick="navigate('register')">Get Started</button>
            <button class="btn btn-outline" onclick="document.getElementById('solution').scrollIntoView({behavior:'smooth'})">Explore CareConnect</button>
          </div>
        </div>
        <div class="hero-art">
          <h4 style="margin-bottom:14px;">Today with CareConnect</h4>
          <div class="list-row"><div class="list-row-main"><span class="list-row-title">💊 Metformin 500mg</span><span class="list-row-sub">8:00 AM — as prescribed</span></div><span class="badge badge-teal">Reminder</span></div>
          <div class="list-row"><div class="list-row-main"><span class="list-row-title">📅 Dr. Ramesh Babu</span><span class="list-row-sub">Follow-up in 5 days</span></div><span class="badge badge-gold">Upcoming</span></div>
          <div class="list-row"><div class="list-row-main"><span class="list-row-title">👨‍👩‍👧 Priya (Daughter)</span><span class="list-row-sub">Caregiver connected</span></div><span class="badge badge-success">Shared</span></div>
        </div>
      </div>
    </section>

    <section class="landing-section">
      <h2>The problem</h2>
      <p class="section-lede">Healthcare continuity breaks down outside the hospital, especially for the people who need it most.</p>
      <div class="problem-grid">
        <div class="card"><h4>🚧 Accessibility barriers</h4><p class="helper-text">Complex apps and small text shut out elderly and disabled users.</p></div>
        <div class="card"><h4>🚜 Rural distance</h4><p class="helper-text">Long travel to reach a hospital or clinic delays basic care.</p></div>
        <div class="card"><h4>👵 Elderly self-management</h4><p class="helper-text">Tracking medicines and appointments alone becomes overwhelming.</p></div>
        <div class="card"><h4>🏥 Post-discharge gaps</h4><p class="helper-text">Recovery instructions are easily lost after leaving the hospital.</p></div>
        <div class="card"><h4>🗣 Language barriers</h4><p class="helper-text">Healthcare tools rarely work in a patient's own language.</p></div>
        <div class="card"><h4>👨‍👩‍👧 Caregiver disconnect</h4><p class="helper-text">Family members struggle to stay informed without overstepping privacy.</p></div>
      </div>
    </section>

    <section class="landing-section" id="solution" style="background:var(--teal-50);border-radius:var(--radius-lg);">
      <h2>Our solution</h2>
      <p class="section-lede">CareConnect brings medicine tracking, appointments, post-discharge care, health records, healthcare-service discovery and caregiver coordination into one accessible, multilingual platform — so care continues long after the hospital visit ends.</p>
      <div class="journey-flow">
        <span class="journey-step">Patient</span><span class="journey-arrow">→</span>
        <span class="journey-step">CareConnect</span><span class="journey-arrow">→</span>
        <span class="journey-step">Healthcare Services</span><span class="journey-arrow">→</span>
        <span class="journey-step">Trusted Caregiver</span>
      </div>
    </section>

    <section class="landing-section">
      <h2>Key features</h2>
      <div class="grid grid-3">
        <div class="feature-tile"><span class="tile-icon">💊</span><span class="tile-title">Medicine reminders</span><span class="tile-sub">Never miss a dose, with a full adherence history.</span></div>
        <div class="feature-tile"><span class="tile-icon">📅</span><span class="tile-title">Appointments</span><span class="tile-sub">Track upcoming, past and cancelled visits.</span></div>
        <div class="feature-tile"><span class="tile-icon">🩺</span><span class="tile-title">Post-discharge care</span><span class="tile-sub">A clear recovery timeline from discharge to review.</span></div>
        <div class="feature-tile"><span class="tile-icon">📋</span><span class="tile-title">Digital health records</span><span class="tile-sub">Store and share prescriptions and reports securely.</span></div>
        <div class="feature-tile"><span class="tile-icon">🏥</span><span class="tile-title">Healthcare near me</span><span class="tile-sub">Find hospitals, clinics, pharmacies and diagnostics nearby.</span></div>
        <div class="feature-tile"><span class="tile-icon">👨‍👩‍👧</span><span class="tile-title">Caregiver connection</span><span class="tile-sub">Share exactly what you choose, revoke anytime.</span></div>
      </div>
    </section>

    <section class="landing-section">
      <h2>Who we serve</h2>
      <div class="serve-grid">
        <div class="card card-accent">Elderly people</div>
        <div class="card card-accent">Rural communities</div>
        <div class="card card-accent">Post-discharge patients</div>
        <div class="card card-accent">People with disabilities</div>
        <div class="card card-accent">Family members &amp; caregivers</div>
      </div>
    </section>

    <section class="landing-section">
      <h2>How it works</h2>
      <div class="journey-flow">
        <span class="journey-step">1. Register</span><span class="journey-arrow">→</span>
        <span class="journey-step">2. Onboard</span><span class="journey-arrow">→</span>
        <span class="journey-step">3. Manage care</span><span class="journey-arrow">→</span>
        <span class="journey-step">4. Connect caregiver</span>
      </div>
    </section>

    <section class="landing-section">
      <h2>Privacy, on your terms</h2>
      <p class="section-lede">Nothing is shared with a caregiver unless the patient explicitly grants it. Every permission — appointments, medicines, records, post-discharge plans, notifications — can be switched on or off individually, and revoked at any time from the Consent &amp; Privacy Centre.</p>
    </section>

    <section class="landing-cta">
      <h2>Start Your Care Journey</h2>
      <p style="opacity:0.9;max-width:500px;margin:0 auto 22px;">Join CareConnect and keep your healthcare, medicines, and caregivers connected in one place.</p>
      <button class="btn btn-gold" onclick="navigate('register')">Get Started</button>
    </section>

    <footer class="landing-footer">
      <p>CareConnect is a healthcare support platform. It does not diagnose conditions, prescribe medication, or replace professional medical care. For emergencies, contact your local emergency service.</p>
      <p>© 2026 CareConnect — Connecting Care Beyond the Hospital</p>
    </footer>
  </div>`;
}

/* =========================================================
   AUTH — login / register (patient + caregiver)
========================================================= */
let authState = {mode:'login', role:'patient'};

function renderAuth(mode){
  authState.mode = mode;
  const isLogin = mode==='login';
  return `
  <div class="auth-shell">
    <div class="auth-card">
      <div style="text-align:center;margin-bottom:18px;">
        <span class="logo-mark" style="width:44px;height:44px;border-radius:12px;background:var(--gold-500);display:inline-flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;color:var(--teal-900);font-size:1.3rem;">C</span>
        <h2 style="margin-top:10px;">${isLogin? t('welcome_back') : t('create_account')}</h2>
      </div>
      <div class="auth-role-toggle" role="tablist" aria-label="Account type">
        <button role="tab" aria-selected="${authState.role==='patient'}" class="${authState.role==='patient'?'active':''}" onclick="setAuthRole('patient')">${t('patient')}</button>
        <button role="tab" aria-selected="${authState.role==='caregiver'}" class="${authState.role==='caregiver'?'active':''}" onclick="setAuthRole('caregiver')">${t('caregiver')}</button>
      </div>
      <div id="auth-error" role="alert" style="display:none;background:var(--danger-bg);color:var(--danger);padding:10px 14px;border-radius:8px;margin-bottom:14px;font-weight:700;"></div>
      <form id="auth-form" onsubmit="return handleAuthSubmit(event)">
        ${!isLogin ? `
        <div class="field">
          <label for="auth-name">Full name</label>
          <input class="input" id="auth-name" required autocomplete="name">
        </div>` : ''}
        <div class="field">
          <label for="auth-email">Email</label>
          <input class="input" id="auth-email" type="email" required autocomplete="email">
        </div>
        <div class="field">
          <label for="auth-password">Password</label>
          <input class="input" id="auth-password" type="password" required autocomplete="${isLogin?'current-password':'new-password'}" minlength="6">
          <span class="hint">At least 6 characters.</span>
        </div>
        <button type="submit" class="btn btn-primary btn-block" id="auth-submit-btn">${isLogin? t('login') : t('register')}</button>
      </form>
      ${isLogin ? `
        <p style="text-align:center;margin-top:14px;"><button class="btn btn-ghost btn-sm" onclick="handleForgotPassword()">Forgot password?</button></p>
        <p style="text-align:center;" class="helper-text">Don't have an account? <a href="#" onclick="event.preventDefault();navigate('register')">Register here</a></p>
        <div class="lang-note">Demo login — Patient: kamalam@example.com / demo1234 · Caregiver: priya@example.com / demo1234</div>
      ` : `
        <p style="text-align:center;margin-top:14px;" class="helper-text">Already have an account? <a href="#" onclick="event.preventDefault();navigate('login')">Log in</a></p>
      `}
      <p style="text-align:center;margin-top:10px;"><a href="#" onclick="event.preventDefault();navigate('landing')" class="helper-text">← Back to home</a></p>
    </div>
  </div>`;
}

function setAuthRole(role){ authState.role = role; render(); }

function handleForgotPassword(){
  if(window.BACKEND_MODE === 'supabase'){
    const email = (document.getElementById('auth-email')?.value || '').trim().toLowerCase();
    if(!email){ toast('Enter your email above first, then tap Forgot password?', 'error'); return; }
    window.CareConnectServices.auth.resetPasswordForEmail(email, window.location.origin)
      .then(()=> toast('If an account exists for this email, a password-reset link has been sent.', 'success'))
      .catch(err=> toast(err.message || 'Could not send reset email', 'error'));
  } else {
    toast('If an account exists for this email, a password-reset link has been sent.', 'success');
  }
}

async function handleAuthSubmit(e){
  e.preventDefault();
  const errEl = document.getElementById('auth-error');
  errEl.style.display='none';
  const email = document.getElementById('auth-email').value.trim().toLowerCase();
  const password = document.getElementById('auth-password').value;
  const btn = document.getElementById('auth-submit-btn');
  btn.classList.add('btn-loading');

  if(window.BACKEND_MODE === 'supabase'){
    const svc = window.CareConnectServices;
    try{
      if(authState.mode==='login'){
        await svc.auth.signIn(email, password);
        await hydrateFromSupabase();
        const user = currentUser();
        if(!user || user.role !== authState.role){
          await svc.auth.signOut();
          DB = emptyDB(); clearSession();
          throw new Error('Incorrect email, password, or account type.');
        }
        toast('Logged in successfully', 'success');
        navigate(user.role==='caregiver' ? 'caregiver-dashboard' : (getProfile(user.id).onboardingComplete ? 'dashboard' : 'onboarding'));
      } else {
        const name = document.getElementById('auth-name').value.trim();
        const { session } = await svc.auth.signUp(email, password, {role:authState.role, fullName:name});
        if(!session){
          toast('Account created — check your email to confirm it, then log in.', 'success');
          navigate('login');
          return;
        }
        await hydrateFromSupabase();
        toast('Account created', 'success');
        navigate(authState.role==='caregiver' ? 'caregiver-dashboard' : 'onboarding');
      }
    }catch(err){
      errEl.textContent = err.message || 'Something went wrong. Please try again.';
      errEl.style.display='block';
    }finally{
      btn.classList.remove('btn-loading');
    }
    return false;
  }

  // ---- local demo mode (unchanged) ----
  setTimeout(()=>{
    btn.classList.remove('btn-loading');
    if(authState.mode==='login'){
      const user = DB.users.find(u=>u.email.toLowerCase()===email && u.role===authState.role);
      if(!user || user.password !== password){
        errEl.textContent = 'Incorrect email, password, or account type.';
        errEl.style.display='block';
        return;
      }
      setSession(user.id, user.role);
      toast('Logged in successfully', 'success');
      navigate(user.role==='caregiver' ? 'caregiver-dashboard' : (getProfile(user.id).onboardingComplete ? 'dashboard' : 'onboarding'));
    } else {
      const name = document.getElementById('auth-name').value.trim();
      if(DB.users.find(u=>u.email.toLowerCase()===email)){
        errEl.textContent = 'An account with this email already exists.';
        errEl.style.display='block';
        return;
      }
      const id = uid('user');
      DB.users.push({id, role:authState.role, name, email, password, createdAt:nowISO()});
      DB.profiles[id] = {fullName:name, age:'', gender:'', phone:'', preferredLanguage:'en', location:'', emergencyContactName:'', emergencyContactPhone:'', onboardingComplete:false};
      DB.accessibility_preferences[id] = {textSize:'standard', contrast:'standard', reducedMotion:false, voiceAssist:false, textToSpeech:false};
      DB.user_settings[id] = {language:'en', notif_medicine:true, notif_appointment:true, notif_followup:true, notif_caregiver:true};
      saveDB();
      setSession(id, authState.role);
      toast('Account created', 'success');
      navigate(authState.role==='caregiver' ? 'caregiver-dashboard' : 'onboarding');
    }
  }, 450);
  return false;
}

/* =========================================================
   ONBOARDING
========================================================= */
let onboardStep = 1;
let onboardDraft = null;

function renderOnboarding(){
  const user = currentUser();
  if(!onboardDraft){
    const p = getProfile(user.id);
    onboardDraft = Object.assign({inviteCaregiverEmail:''}, p);
  }
  const steps = [
    {n:1, label:'Personal'},
    {n:2, label:'Language'},
    {n:3, label:'Accessibility'},
    {n:4, label:'Caregiver'},
    {n:5, label:'Complete'},
  ];

  return `
  <div class="onboard-shell">
    <div style="text-align:center;margin-bottom:10px;">
      <span class="logo-mark" style="width:40px;height:40px;border-radius:11px;background:var(--gold-500);display:inline-flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;color:var(--teal-900);">C</span>
    </div>
    <h1 style="text-align:center;">Let's set up your account</h1>
    <p style="text-align:center;color:var(--ink-soft);margin-bottom:20px;">A few quick details help CareConnect work better for you.</p>
    <div class="progress-steps" role="list" aria-label="Onboarding progress">
      ${steps.map(s=>`
        <div class="progress-step ${s.n<onboardStep?'done':''} ${s.n===onboardStep?'current':''}" role="listitem">
          <div class="dot">${s.n<onboardStep?'✓':s.n}</div>
          <div class="label">${s.label}</div>
        </div>`).join('')}
    </div>
    <div class="card">
      ${onboardStep===1?onboardStep1():''}
      ${onboardStep===2?onboardStep2():''}
      ${onboardStep===3?onboardStep3():''}
      ${onboardStep===4?onboardStep4():''}
      ${onboardStep===5?onboardStep5():''}
    </div>
  </div>`;
}

function onboardStep1(){
  const d = onboardDraft;
  return `
  <h3>Personal details</h3>
  <div class="field"><label for="ob-name">Full name</label><input class="input" id="ob-name" value="${escapeHtml(d.fullName||'')}" required></div>
  <div class="grid grid-2">
    <div class="field"><label for="ob-age">Age</label><input class="input" id="ob-age" type="number" min="0" max="120" value="${escapeHtml(d.age||'')}"></div>
    <div class="field"><label for="ob-gender">Gender</label>
      <select class="input" id="ob-gender">
        <option value="">Select</option>
        <option ${d.gender==='Female'?'selected':''}>Female</option>
        <option ${d.gender==='Male'?'selected':''}>Male</option>
        <option ${d.gender==='Other'?'selected':''}>Other</option>
        <option ${d.gender==='Prefer not to say'?'selected':''}>Prefer not to say</option>
      </select>
    </div>
  </div>
  <div class="field"><label for="ob-phone">Phone number</label><input class="input" id="ob-phone" type="tel" value="${escapeHtml(d.phone||'')}"></div>
  <div class="field"><label for="ob-location">Location</label><input class="input" id="ob-location" placeholder="City, State" value="${escapeHtml(d.location||'')}"></div>
  <fieldset>
    <legend>Emergency contact</legend>
    <div class="field"><label for="ob-ec-name">Contact name</label><input class="input" id="ob-ec-name" value="${escapeHtml(d.emergencyContactName||'')}"></div>
    <div class="field"><label for="ob-ec-phone">Contact phone</label><input class="input" id="ob-ec-phone" type="tel" value="${escapeHtml(d.emergencyContactPhone||'')}"></div>
  </fieldset>
  <div class="modal-actions" style="justify-content:space-between;">
    <span></span>
    <button class="btn btn-primary" onclick="onboardNext(1)">Continue</button>
  </div>`;
}

function onboardStep2(){
  const d = onboardDraft;
  return `
  <h3>Preferred language</h3>
  <p class="helper-text">Choose the language you're most comfortable with. You can change this anytime in Settings.</p>
  <div class="grid grid-2">
    ${LANGS.map(l=>`
      <label class="card" style="display:flex;align-items:center;gap:10px;cursor:pointer;border-color:${d.preferredLanguage===l.code?'var(--teal-700)':'var(--line)'};">
        <input type="radio" name="ob-lang" value="${l.code}" ${d.preferredLanguage===l.code?'checked':''} onchange="onboardDraft.preferredLanguage='${l.code}';render();" style="width:20px;height:20px;">
        <span style="font-weight:700;">${l.label}</span>
      </label>`).join('')}
  </div>
  <div class="modal-actions" style="justify-content:space-between;">
    <button class="btn btn-ghost" onclick="onboardStep=1;render();">Back</button>
    <button class="btn btn-primary" onclick="onboardNext(2)">Continue</button>
  </div>`;
}

function onboardStep3(){
  const a = currentUser() ? Object.assign({}, getA11y(currentUser().id), onboardDraft.a11y||{}) : {};
  onboardDraft.a11y = onboardDraft.a11y || Object.assign({textSize:'standard',contrast:'standard',reducedMotion:false,voiceAssist:false,textToSpeech:false}, {});
  const d = onboardDraft.a11y;
  return `
  <h3>Accessibility preferences</h3>
  <div class="field">
    <label for="ob-textsize">${t('text_size')}</label>
    <select class="input" id="ob-textsize" onchange="onboardDraft.a11y.textSize=this.value;document.documentElement.setAttribute('data-textsize',this.value);">
      <option value="standard" ${d.textSize==='standard'?'selected':''}>${t('standard')}</option>
      <option value="large" ${d.textSize==='large'?'selected':''}>${t('large')}</option>
      <option value="xl" ${d.textSize==='xl'?'selected':''}>${t('extra_large')}</option>
    </select>
  </div>
  <div class="field">
    <label for="ob-contrast">${t('contrast')}</label>
    <select class="input" id="ob-contrast" onchange="onboardDraft.a11y.contrast=this.value;document.documentElement.setAttribute('data-contrast',this.value);">
      <option value="standard" ${d.contrast==='standard'?'selected':''}>${t('standard')}</option>
      <option value="high" ${d.contrast==='high'?'selected':''}>${t('high_contrast')}</option>
    </select>
  </div>
  <div class="checkbox-row" style="margin-bottom:14px;">
    <input type="checkbox" id="ob-reduced" ${d.reducedMotion?'checked':''} onchange="onboardDraft.a11y.reducedMotion=this.checked;document.documentElement.setAttribute('data-reduced-motion',this.checked);">
    <label for="ob-reduced">${t('reduced_motion')}</label>
  </div>
  <div class="checkbox-row" style="margin-bottom:14px;">
    <input type="checkbox" id="ob-tts" ${d.textToSpeech?'checked':''} onchange="onboardDraft.a11y.textToSpeech=this.checked;">
    <label for="ob-tts">${t('text_to_speech')}</label>
  </div>
  <div class="checkbox-row">
    <input type="checkbox" id="ob-voice" ${d.voiceAssist?'checked':''} onchange="onboardDraft.a11y.voiceAssist=this.checked;">
    <label for="ob-voice">Enable voice assistant</label>
  </div>
  <div class="modal-actions" style="justify-content:space-between;">
    <button class="btn btn-ghost" onclick="onboardStep=2;render();">Back</button>
    <button class="btn btn-primary" onclick="onboardNext(3)">Continue</button>
  </div>`;
}

function onboardStep4(){
  return `
  <h3>Invite a caregiver <span class="helper-text">(optional)</span></h3>
  <p class="helper-text">You can invite a family member or caregiver now, or do this later from the Caregiver page.</p>
  <div class="field"><label for="ob-caregiver-email">Caregiver's email</label><input class="input" id="ob-caregiver-email" type="email" placeholder="name@example.com" value="${escapeHtml(onboardDraft.inviteCaregiverEmail||'')}" oninput="onboardDraft.inviteCaregiverEmail=this.value"></div>
  <div class="field"><label for="ob-caregiver-rel">Relationship</label><input class="input" id="ob-caregiver-rel" placeholder="e.g. Daughter, Son, Neighbor" value="${escapeHtml(onboardDraft.inviteCaregiverRel||'')}" oninput="onboardDraft.inviteCaregiverRel=this.value"></div>
  <div class="modal-actions" style="justify-content:space-between;">
    <button class="btn btn-ghost" onclick="onboardStep=3;render();">Back</button>
    <button class="btn btn-primary" onclick="onboardNext(4)">Continue</button>
  </div>`;
}

function onboardStep5(){
  return `
  <div class="state-block">
    <div class="state-icon">✅</div>
    <h3>You're all set, ${escapeHtml(onboardDraft.fullName||'')}!</h3>
    <p>Your profile, language and accessibility preferences are ready. You can update any of this anytime from Settings.</p>
    <button class="btn btn-primary" onclick="finishOnboarding()">Go to Dashboard</button>
  </div>`;
}

function onboardNext(fromStep){
  if(fromStep===1){
    onboardDraft.fullName = document.getElementById('ob-name').value.trim();
    onboardDraft.age = document.getElementById('ob-age').value;
    onboardDraft.gender = document.getElementById('ob-gender').value;
    onboardDraft.phone = document.getElementById('ob-phone').value;
    onboardDraft.location = document.getElementById('ob-location').value;
    onboardDraft.emergencyContactName = document.getElementById('ob-ec-name').value;
    onboardDraft.emergencyContactPhone = document.getElementById('ob-ec-phone').value;
    if(!onboardDraft.fullName){ toast('Please enter your name', 'error'); return; }
  }
  onboardStep++;
  render();
}

async function finishOnboarding(){
  const user = currentUser();
  onboardDraft.onboardingComplete = true;
  const profileFields = {
    fullName:onboardDraft.fullName, age:onboardDraft.age, gender:onboardDraft.gender, phone:onboardDraft.phone,
    location:onboardDraft.location, emergencyContactName:onboardDraft.emergencyContactName,
    emergencyContactPhone:onboardDraft.emergencyContactPhone, preferredLanguage:onboardDraft.preferredLanguage||'en',
    onboardingComplete:true
  };

  if(window.BACKEND_MODE === 'supabase'){
    const svc = window.CareConnectServices;
    DB.profiles[user.id] = await svc.profiles.updateProfile(user.id, profileFields);
    if(onboardDraft.a11y){ DB.accessibility_preferences[user.id] = await svc.profiles.updateAccessibility(user.id, onboardDraft.a11y); }
    DB.user_settings[user.id] = await svc.profiles.updateSettings(user.id, {language:onboardDraft.preferredLanguage||'en'});
    if(onboardDraft.emergencyContactName){
      const contact = await svc.emergencyContacts.addEmergencyContact(user.id, {name:onboardDraft.emergencyContactName, phone:onboardDraft.emergencyContactPhone||'', relationship:'Emergency Contact'});
      DB.emergency_contacts.push(contact);
    }
  } else {
    DB.profiles[user.id] = Object.assign(getProfile(user.id), profileFields);
    if(onboardDraft.a11y){ DB.accessibility_preferences[user.id] = onboardDraft.a11y; }
    DB.user_settings[user.id] = Object.assign(getSettings(user.id), {language:onboardDraft.preferredLanguage||'en'});
    if(onboardDraft.emergencyContactName){
      DB.emergency_contacts.push({id:uid('ec'), userId:user.id, name:onboardDraft.emergencyContactName, phone:onboardDraft.emergencyContactPhone||'', relationship:'Emergency Contact'});
    }
  }
  if(onboardDraft.inviteCaregiverEmail){
    await addNotification(user.id, 'caregiver', 'Caregiver invitation sent', 'An invitation was sent to ' + onboardDraft.inviteCaregiverEmail + '.');
  }
  saveDB();
  onboardStep = 1; onboardDraft = null;
  toast('Welcome to CareConnect!', 'success');
  navigate('dashboard');
}

/* =========================================================
   PATIENT DASHBOARD
========================================================= */
function greetingKey(){
  const h = new Date().getHours();
  if(h<12) return 'good_morning';
  if(h<17) return 'good_afternoon';
  return 'good_evening';
}

function renderPatientDashboard(){
  const user = currentUser();
  const profile = getProfile(user.id);
  const meds = userMedications(user.id);
  const appts = userAppointments(user.id).filter(a=>a.status==='upcoming').sort((a,b)=> new Date(a.date)-new Date(b.date));
  const plans = userPlans(user.id);
  const notes = userNotifications(user.id);
  const unread = notes.filter(n=>!n.read).length;

  const today = isoDate(new Date());
  const todayMeds = [];
  meds.forEach(m=>{ (m.times||[]).forEach(time=>{ todayMeds.push({med:m, time}); }); });
  todayMeds.sort((a,b)=> a.time.localeCompare(b.time));

  const nextMed = todayMeds[0];
  const nextAppt = appts[0];
  const nextFollowup = plans.map(p=>p.followUpDate).filter(Boolean).sort()[0];

  return `
  <div class="dash-greeting">
    <h1>${t(greetingKey())}, ${escapeHtml(profile.fullName||user.name)}</h1>
    <p class="helper-text">Here's what's happening with your care today.</p>
  </div>

  <div class="overview-row">
    <div class="overview-stat"><div class="stat-label">💊 ${t('next_medicine')}</div><div class="stat-value">${nextMed? escapeHtml(nextMed.med.name)+' · '+fmtTime(nextMed.time) : t('none_scheduled')}</div></div>
    <div class="overview-stat"><div class="stat-label">📅 ${t('next_appointment')}</div><div class="stat-value">${nextAppt? fmtDate(nextAppt.date) : t('none_scheduled')}</div></div>
    <div class="overview-stat"><div class="stat-label">🩺 ${t('next_followup')}</div><div class="stat-value">${nextFollowup? fmtDate(nextFollowup) : t('none_scheduled')}</div></div>
    <div class="overview-stat"><div class="stat-label">🔔 ${t('unread_notifications')}</div><div class="stat-value">${unread}</div></div>
  </div>

  <div class="grid grid-4">
    <a class="feature-tile" href="#/medicines" data-nav="medicines"><span class="tile-icon">💊</span><span class="tile-title">${t('nav_medicines')}</span><span class="tile-sub">${todayMeds.length} dose(s) scheduled today</span></a>
    <a class="feature-tile" href="#/appointments" data-nav="appointments"><span class="tile-icon">📅</span><span class="tile-title">${t('nav_appointments')}</span><span class="tile-sub">${nextAppt? 'Next: '+fmtDate(nextAppt.date) : 'None upcoming'}</span></a>
    <a class="feature-tile" href="#/healthcare" data-nav="healthcare"><span class="tile-icon">🏥</span><span class="tile-title">${t('nav_healthcare')}</span><span class="tile-sub">Find services nearby</span></a>
    <a class="feature-tile" href="#/records" data-nav="records"><span class="tile-icon">📋</span><span class="tile-title">${t('nav_records')}</span><span class="tile-sub">${userRecords(user.id).length} document(s)</span></a>
    <a class="feature-tile" href="#/postdischarge" data-nav="postdischarge"><span class="tile-icon">🩺</span><span class="tile-title">${t('nav_postdischarge')}</span><span class="tile-sub">${plans.length? 'Care plan active' : 'No plan yet'}</span></a>
    <a class="feature-tile" href="#/caregiver" data-nav="caregiver"><span class="tile-icon">👨‍👩‍👧</span><span class="tile-title">${t('nav_caregiver')}</span><span class="tile-sub">${caregiverConnectionsForPatient(user.id).length} connected</span></a>
    <a class="feature-tile" href="#/voice" data-nav="voice"><span class="tile-icon">🎙</span><span class="tile-title">${t('nav_voice')}</span><span class="tile-sub">Ask CareConnect anything</span></a>
    <a class="feature-tile" href="#/emergency" data-nav="emergency" style="border-color:var(--danger);"><span class="tile-icon">🆘</span><span class="tile-title" style="color:var(--danger);">${t('nav_emergency')}</span><span class="tile-sub">Get help quickly</span></a>
  </div>

  <div class="grid grid-2" style="margin-top:26px;">
    <div class="card">
      <div class="card-title-row"><h3>Today's medicines</h3><a href="#/medicines" data-nav="medicines" class="helper-text">View all →</a></div>
      ${todayMeds.length ? todayMeds.map(x=>`
        <div class="list-row">
          <div class="list-row-main"><span class="list-row-title">${escapeHtml(x.med.name)}</span><span class="list-row-sub">${fmtTime(x.time)} · ${escapeHtml(x.med.dosage)}</span></div>
          <button class="btn btn-outline btn-sm" onclick="quickMarkTaken('${x.med.id}','${x.time}')">${t('mark_taken')}</button>
        </div>`).join('') : `<div class="state-block"><div class="state-icon">💊</div><p>${t('no_medicines')}</p></div>`}
    </div>
    <div class="card">
      <div class="card-title-row"><h3>Upcoming appointments</h3><a href="#/appointments" data-nav="appointments" class="helper-text">View all →</a></div>
      ${appts.length ? appts.slice(0,3).map(a=>`
        <div class="list-row">
          <div class="list-row-main"><span class="list-row-title">${escapeHtml(a.provider)}</span><span class="list-row-sub">${fmtDate(a.date)} · ${fmtTime(a.time)} · ${escapeHtml(a.type)}</span></div>
        </div>`).join('') : `<div class="state-block"><div class="state-icon">📅</div><p>${t('no_upcoming_appointments')}</p></div>`}
    </div>
  </div>`;
}

async function quickMarkTaken(medId, time){
  const today = isoDate(new Date());
  if(window.BACKEND_MODE === 'supabase'){
    const user = currentUser();
    const log = await window.CareConnectServices.medicines.upsertMedicationLog(medId, user.id, today, time, 'taken');
    DB.medication_logs = DB.medication_logs.filter(l=>!(l.medicationId===medId && l.date===today && l.time===time));
    DB.medication_logs.push(log);
  } else {
    DB.medication_logs.push({id:uid('mlog'), medicationId:medId, date:today, time, status:'taken'});
  }
  saveDB();
  toast(t('mark_taken')+' ✓', 'success');
  render();
}

/* =========================================================
   MEDICINES
========================================================= */
function renderMedicines(){
  const user = currentUser();
  const meds = userMedications(user.id).filter(m=>m.active);
  const today = isoDate(new Date());
  const logs = DB.medication_logs;

  const todayEntries = [];
  meds.forEach(m=>{ (m.times||[]).forEach(time=>{
    const log = logs.find(l=>l.medicationId===m.id && l.date===today && l.time===time);
    todayEntries.push({med:m, time, status: log ? log.status : 'pending'});
  });});
  todayEntries.sort((a,b)=>a.time.localeCompare(b.time));

  return `
  <div class="section-heading-row">
    <h1>${t('medicines_title')}</h1>
    <button class="btn btn-primary" onclick="openMedicineModal()">+ ${t('add')} Medicine</button>
  </div>

  <div class="card" style="margin-bottom:22px;">
    <h3>Today</h3>
    ${todayEntries.length ? todayEntries.map(e=>`
      <div class="list-row">
        <div class="list-row-main">
          <span class="list-row-title">${fmtTime(e.time)} — ${escapeHtml(e.med.name)}</span>
          <span class="list-row-sub">${escapeHtml(e.med.dosage)} · ${escapeHtml(e.med.instructions||'')}</span>
        </div>
        <div class="list-row-actions">
          ${e.status==='pending' ? `
            <button class="btn btn-primary btn-sm" onclick="logMedicine('${e.med.id}','${e.time}','taken')">${t('mark_taken')}</button>
            <button class="btn btn-outline btn-sm" onclick="logMedicine('${e.med.id}','${e.time}','missed')">${t('mark_missed')}</button>
          ` : e.status==='taken' ? `<span class="badge badge-success">✓ Taken</span>` : `<span class="badge badge-danger">Missed</span>`}
        </div>
      </div>`).join('') : `<div class="state-block"><div class="state-icon">💊</div><p>${t('no_medicines')}</p></div>`}
  </div>

  <div class="card">
    <div class="card-title-row"><h3>All medicines</h3></div>
    ${meds.length ? meds.map(m=>`
      <div class="list-row">
        <div class="list-row-main">
          <span class="list-row-title">${escapeHtml(m.name)}</span>
          <span class="list-row-sub">${escapeHtml(m.dosage)} · ${escapeHtml(m.frequency)} · ${(m.times||[]).map(fmtTime).join(', ')}</span>
          <span class="list-row-sub">${escapeHtml(m.instructions||'')}</span>
        </div>
        <div class="list-row-actions">
          <button class="btn btn-ghost btn-sm" onclick="viewMedHistory('${m.id}')">${t('view_history')}</button>
          <button class="btn btn-outline btn-sm" onclick="openMedicineModal('${m.id}')">${t('edit')}</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteMedicine('${m.id}')">${t('delete')}</button>
        </div>
      </div>`).join('') : `<div class="state-block"><div class="state-icon">💊</div><h3>${t('no_medicines')}</h3><button class="btn btn-primary" onclick="openMedicineModal()">+ ${t('add')} Medicine</button></div>`}
  </div>
  <p class="helper-text" style="margin-top:16px;">CareConnect stores dosage information exactly as prescribed by your healthcare provider. It does not recommend doses or change prescriptions.</p>
  `;
}

async function logMedicine(medId, time, status){
  const today = isoDate(new Date());
  if(window.BACKEND_MODE === 'supabase'){
    const user = currentUser();
    const log = await window.CareConnectServices.medicines.upsertMedicationLog(medId, user.id, today, time, status);
    DB.medication_logs = DB.medication_logs.filter(l=>!(l.medicationId===medId && l.date===today && l.time===time));
    DB.medication_logs.push(log);
  } else {
    const existing = DB.medication_logs.find(l=>l.medicationId===medId && l.date===today && l.time===time);
    if(existing){ existing.status = status; } else {
      DB.medication_logs.push({id:uid('mlog'), medicationId:medId, date:today, time, status});
    }
  }
  saveDB();
  toast(status==='taken' ? t('mark_taken')+' ✓' : t('mark_missed'), status==='taken'?'success':undefined);
  render();
}

function deleteMedicine(medId){
  confirmDialog({title:'Delete medicine?', message:'This will remove the medicine and its schedule. This cannot be undone.', confirmLabel:t('delete'), danger:true}, async ()=>{
    if(window.BACKEND_MODE === 'supabase'){
      await window.CareConnectServices.medicines.deactivateMedication(medId);
    }
    const m = DB.medications.find(m=>m.id===medId);
    if(m) m.active = false;
    saveDB(); toast('Medicine deleted', 'success'); render();
  });
}

function viewMedHistory(medId){
  const m = DB.medications.find(x=>x.id===medId);
  const logs = DB.medication_logs.filter(l=>l.medicationId===medId).sort((a,b)=> (b.date+b.time).localeCompare(a.date+a.time));
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="hist-title">
      <div class="modal-header"><h3 id="hist-title">History — ${escapeHtml(m.name)}</h3><button class="modal-close" onclick="this.closest('.modal-backdrop').remove()" aria-label="${t('close')}">&times;</button></div>
      ${logs.length ? logs.map(l=>`
        <div class="list-row">
          <div class="list-row-main"><span class="list-row-title">${fmtDate(l.date)} · ${fmtTime(l.time)}</span></div>
          <span class="badge ${l.status==='taken'?'badge-success':'badge-danger'}">${l.status==='taken'?'✓ Taken':'Missed'}</span>
        </div>`).join('') : `<div class="state-block"><p>No history recorded yet.</p></div>`}
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.remove(); });
}

function openMedicineModal(medId){
  const m = medId ? DB.medications.find(x=>x.id===medId) : null;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="med-modal-title">
      <div class="modal-header"><h3 id="med-modal-title">${m? t('edit') : t('add')} Medicine</h3><button class="modal-close" onclick="this.closest('.modal-backdrop').remove()" aria-label="${t('close')}">&times;</button></div>
      <form id="med-form">
        <div class="field"><label for="mf-name">Medicine name</label><input class="input" id="mf-name" required value="${m?escapeHtml(m.name):''}"></div>
        <div class="field"><label for="mf-dosage">Dosage, as prescribed</label><input class="input" id="mf-dosage" placeholder="e.g. 1 tablet" required value="${m?escapeHtml(m.dosage):''}"></div>
        <div class="field"><label for="mf-frequency">Frequency</label><input class="input" id="mf-frequency" placeholder="e.g. Twice daily" required value="${m?escapeHtml(m.frequency):''}"></div>
        <div class="field"><label for="mf-times">Time(s) — comma separated, 24h (e.g. 08:00, 20:00)</label><input class="input" id="mf-times" required value="${m?(m.times||[]).join(', '):''}"></div>
        <div class="grid grid-2">
          <div class="field"><label for="mf-start">Start date</label><input class="input" id="mf-start" type="date" value="${m?m.startDate:isoDate(new Date())}"></div>
          <div class="field"><label for="mf-end">End date (optional)</label><input class="input" id="mf-end" type="date" value="${m?m.endDate:''}"></div>
        </div>
        <div class="field"><label for="mf-instr">Instructions from healthcare provider</label><textarea class="input" id="mf-instr">${m?escapeHtml(m.instructions||''):''}</textarea></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">${t('cancel')}</button>
          <button type="submit" class="btn btn-primary">${t('save')}</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.remove(); });
  backdrop.querySelector('#med-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const user = currentUser();
    const name = document.getElementById('mf-name').value.trim();
    const dosage = document.getElementById('mf-dosage').value.trim();
    const frequency = document.getElementById('mf-frequency').value.trim();
    const times = document.getElementById('mf-times').value.split(',').map(s=>s.trim()).filter(Boolean);
    const startDate = document.getElementById('mf-start').value;
    const endDate = document.getElementById('mf-end').value;
    const instructions = document.getElementById('mf-instr').value.trim();
    if(!name || !dosage || !frequency || !times.length){ toast('Please fill in all required fields', 'error'); return; }
    const draft = {name, dosage, frequency, times, startDate, endDate, instructions};
    if(window.BACKEND_MODE === 'supabase'){
      if(m){
        const updated = await window.CareConnectServices.medicines.updateMedication(m.id, draft);
        Object.assign(m, updated);
      } else {
        const created = await window.CareConnectServices.medicines.addMedication(user.id, draft);
        DB.medications.push(created);
        await addNotification(user.id, 'medicine', 'Medicine added', name + ' has been added to your schedule.');
      }
    } else {
      if(m){
        Object.assign(m, draft);
      } else {
        DB.medications.push({id:uid('med'), userId:user.id, ...draft, active:true});
        await addNotification(user.id, 'medicine', 'Medicine added', name + ' has been added to your schedule.');
      }
    }
    saveDB();
    backdrop.remove();
    toast(t('saved'), 'success');
    render();
  });
}

/* =========================================================
   APPOINTMENTS
========================================================= */
let apptTab = 'upcoming';

function renderAppointments(){
  const user = currentUser();
  const all = userAppointments(user.id);
  const list = all.filter(a=>a.status===apptTab).sort((a,b)=> apptTab==='upcoming' ? new Date(a.date)-new Date(b.date) : new Date(b.date)-new Date(a.date));

  return `
  <div class="section-heading-row">
    <h1>${t('appointments_title')}</h1>
    <button class="btn btn-primary" onclick="openAppointmentModal()">+ ${t('add')} Appointment</button>
  </div>
  <div class="tabs" role="tablist">
    <button class="tab-btn ${apptTab==='upcoming'?'active':''}" role="tab" aria-selected="${apptTab==='upcoming'}" onclick="apptTab='upcoming';render();">${t('upcoming')} (${all.filter(a=>a.status==='upcoming').length})</button>
    <button class="tab-btn ${apptTab==='past'?'active':''}" role="tab" aria-selected="${apptTab==='past'}" onclick="apptTab='past';render();">${t('past')} (${all.filter(a=>a.status==='past').length})</button>
    <button class="tab-btn ${apptTab==='cancelled'?'active':''}" role="tab" aria-selected="${apptTab==='cancelled'}" onclick="apptTab='cancelled';render();">${t('cancelled')} (${all.filter(a=>a.status==='cancelled').length})</button>
  </div>
  <div class="card">
    ${list.length ? list.map(a=>`
      <div class="list-row">
        <div class="list-row-main">
          <span class="list-row-title">${escapeHtml(a.provider)} — ${escapeHtml(a.type)}</span>
          <span class="list-row-sub">${fmtDate(a.date)} · ${fmtTime(a.time)} · ${escapeHtml(a.hospital)}</span>
          ${a.notes? `<span class="list-row-sub">Note: ${escapeHtml(a.notes)}</span>` : ''}
        </div>
        <div class="list-row-actions">
          ${apptTab==='upcoming' ? `
            <button class="btn btn-outline btn-sm" onclick="openAppointmentModal('${a.id}')">${t('edit')}</button>
            <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="cancelAppointment('${a.id}')">${t('cancel')}</button>
          ` : `<button class="btn btn-ghost btn-sm" onclick="viewAppointmentDetail('${a.id}')">Details</button>`}
        </div>
      </div>`).join('') : `<div class="state-block"><div class="state-icon">📅</div><p>${apptTab==='upcoming'?t('no_upcoming_appointments'):'Nothing here yet.'}</p>${apptTab==='upcoming'?`<button class="btn btn-primary" onclick="openAppointmentModal()">+ ${t('add')} Appointment</button>`:''}</div>`}
  </div>`;
}

function viewAppointmentDetail(id){
  const a = DB.appointments.find(x=>x.id===id);
  const backdrop = document.createElement('div');
  backdrop.className='modal-backdrop';
  backdrop.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
    <div class="modal-header"><h3>${escapeHtml(a.provider)}</h3><button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button></div>
    <p><strong>${escapeHtml(a.type)}</strong></p>
    <p>${fmtDate(a.date)} at ${fmtTime(a.time)}</p>
    <p>${escapeHtml(a.hospital)} — ${escapeHtml(a.location)}</p>
    ${a.notes?`<p>${escapeHtml(a.notes)}</p>`:''}
  </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.remove(); });
}

function cancelAppointment(id){
  confirmDialog({title:'Cancel appointment?', message:'This appointment will be moved to Cancelled.', confirmLabel:t('cancel'), danger:true}, async ()=>{
    if(window.BACKEND_MODE === 'supabase'){
      await window.CareConnectServices.appointments.setAppointmentStatus(id, 'cancelled');
    }
    const a = DB.appointments.find(x=>x.id===id);
    a.status='cancelled';
    saveDB(); toast('Appointment cancelled', 'success'); render();
  });
}

function openAppointmentModal(apptId){
  const a = apptId ? DB.appointments.find(x=>x.id===apptId) : null;
  const backdrop = document.createElement('div');
  backdrop.className='modal-backdrop';
  backdrop.innerHTML = `
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="appt-modal-title">
    <div class="modal-header"><h3 id="appt-modal-title">${a?t('edit'):t('add')} Appointment</h3><button class="modal-close" onclick="this.closest('.modal-backdrop').remove()" aria-label="${t('close')}">&times;</button></div>
    <form id="appt-form">
      <div class="field"><label for="af-provider">Provider / Doctor name</label><input class="input" id="af-provider" required value="${a?escapeHtml(a.provider):''}"></div>
      <div class="field"><label for="af-hospital">Hospital / Clinic</label><input class="input" id="af-hospital" required value="${a?escapeHtml(a.hospital):''}"></div>
      <div class="grid grid-2">
        <div class="field"><label for="af-date">Date</label><input class="input" id="af-date" type="date" required value="${a?a.date:''}"></div>
        <div class="field"><label for="af-time">Time</label><input class="input" id="af-time" type="time" required value="${a?a.time:''}"></div>
      </div>
      <div class="field"><label for="af-type">Appointment type</label><input class="input" id="af-type" placeholder="e.g. Follow-up, Lab test" required value="${a?escapeHtml(a.type):''}"></div>
      <div class="field"><label for="af-location">Location</label><input class="input" id="af-location" value="${a?escapeHtml(a.location):''}"></div>
      <div class="field"><label for="af-notes">Notes</label><textarea class="input" id="af-notes">${a?escapeHtml(a.notes||''):''}</textarea></div>
      <div class="checkbox-row" style="margin-bottom:16px;"><input type="checkbox" id="af-reminder" ${!a||a.reminder?'checked':''}><label for="af-reminder">Remind me before this appointment</label></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">${t('cancel')}</button>
        <button type="submit" class="btn btn-primary">${t('save')}</button>
      </div>
    </form>
  </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.remove(); });
  backdrop.querySelector('#appt-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const user = currentUser();
    const provider = document.getElementById('af-provider').value.trim();
    const hospital = document.getElementById('af-hospital').value.trim();
    const date = document.getElementById('af-date').value;
    const time = document.getElementById('af-time').value;
    const type = document.getElementById('af-type').value.trim();
    const location = document.getElementById('af-location').value.trim();
    const notes = document.getElementById('af-notes').value.trim();
    const reminder = document.getElementById('af-reminder').checked;
    if(!provider||!hospital||!date||!time||!type){ toast('Please fill in all required fields', 'error'); return; }
    const draft = {provider, hospital, date, time, type, location, notes, reminder};
    if(window.BACKEND_MODE === 'supabase'){
      if(a){
        const updated = await window.CareConnectServices.appointments.updateAppointment(a.id, draft);
        Object.assign(a, updated);
      } else {
        const created = await window.CareConnectServices.appointments.addAppointment(user.id, draft);
        DB.appointments.push(created);
        await addNotification(user.id, 'appointment', 'Appointment scheduled', provider + ' on ' + fmtDate(date) + ' at ' + fmtTime(time) + '.');
      }
    } else {
      if(a){
        Object.assign(a, draft);
      } else {
        DB.appointments.push({id:uid('appt'), userId:user.id, ...draft, status:'upcoming'});
        await addNotification(user.id, 'appointment', 'Appointment scheduled', provider + ' on ' + fmtDate(date) + ' at ' + fmtTime(time) + '.');
      }
    }
    saveDB(); backdrop.remove(); toast(t('saved'), 'success'); render();
  });
}

/* =========================================================
   HEALTHCARE SERVICE DISCOVERY
========================================================= */
let healthcareFilter = 'All';
function renderHealthcareDiscovery(){
  const cats = ['All','Hospital','Clinic','Pharmacy','Diagnostic Centre','Emergency Facility'];
  const icons = {Hospital:'🏥', Clinic:'🩺', Pharmacy:'💊', 'Diagnostic Centre':'🧪', 'Emergency Facility':'🚑'};
  const list = DB.healthcare_services.filter(s=> healthcareFilter==='All' || s.type===healthcareFilter);

  return `
  <div class="section-heading-row"><h1>${t('healthcare_title')}</h1></div>
  <p class="lang-note">Showing demo healthcare locations near Erode, Tamil Nadu. Connect a live maps service to show real-time results.</p>
  <div class="tabs" role="tablist" style="flex-wrap:wrap;">
    ${cats.map(c=>`<button class="tab-btn ${healthcareFilter===c?'active':''}" onclick="healthcareFilter='${c}';render();">${icons[c]||'📍'} ${c}</button>`).join('')}
  </div>
  <div class="grid grid-2">
    ${list.length ? list.map(s=>`
      <div class="card">
        <div class="card-title-row">
          <h4 style="margin-bottom:0;">${icons[s.type]||'📍'} ${escapeHtml(s.name)}</h4>
          <span class="badge ${s.open?'badge-success':'badge-muted'}">${s.open?'Open now':'Closed'}</span>
        </div>
        <p class="helper-text">${escapeHtml(s.type)} · ${escapeHtml(s.distance)} away</p>
        <p class="helper-text">📍 ${escapeHtml(s.address)}</p>
        <p class="helper-text">📞 ${escapeHtml(s.phone)}</p>
        <div class="modal-actions" style="justify-content:flex-start;margin-top:14px;">
          <a class="btn btn-outline btn-sm" href="tel:${s.phone.replace(/\s/g,'')}">Call</a>
          <a class="btn btn-primary btn-sm" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name+' '+s.address)}" target="_blank" rel="noopener">Directions</a>
        </div>
      </div>`).join('') : `<div class="state-block"><div class="state-icon">🏥</div><p>No services found in this category.</p></div>`}
  </div>`;
}

/* =========================================================
   DIGITAL HEALTH RECORDS
========================================================= */
let recordsSearch = ''; let recordsFilter='All'; let recordsSort='date-desc';
function renderHealthRecords(){
  const user = currentUser();
  let recs = userRecords(user.id);
  if(recordsSearch) recs = recs.filter(r=> r.name.toLowerCase().includes(recordsSearch.toLowerCase()));
  if(recordsFilter!=='All') recs = recs.filter(r=> r.type===recordsFilter);
  recs = recs.slice().sort((a,b)=> recordsSort==='date-desc' ? new Date(b.date)-new Date(a.date) : new Date(a.date)-new Date(b.date));
  const types = ['All','Prescription','Lab Report','Discharge Summary','Medical Report','Other'];
  const typeIcon = {Prescription:'💊',"Lab Report":'🧪',"Discharge Summary":'🩺',"Medical Report":'📄',Other:'📁'};

  return `
  <div class="section-heading-row">
    <h1>${t('records_title')}</h1>
    <button class="btn btn-primary" onclick="openRecordModal()">+ Upload Record</button>
  </div>
  <div class="card" style="margin-bottom:18px;">
    <div class="grid grid-3">
      <div class="field" style="margin-bottom:0;"><label for="rec-search">Search</label><input class="input" id="rec-search" value="${escapeHtml(recordsSearch)}" oninput="recordsSearch=this.value;render();" placeholder="Search by name"></div>
      <div class="field" style="margin-bottom:0;"><label for="rec-filter">Filter by type</label><select class="input" id="rec-filter" onchange="recordsFilter=this.value;render();">${types.map(ty=>`<option ${recordsFilter===ty?'selected':''}>${ty}</option>`).join('')}</select></div>
      <div class="field" style="margin-bottom:0;"><label for="rec-sort">Sort by date</label><select class="input" id="rec-sort" onchange="recordsSort=this.value;render();"><option value="date-desc" ${recordsSort==='date-desc'?'selected':''}>Newest first</option><option value="date-asc" ${recordsSort==='date-asc'?'selected':''}>Oldest first</option></select></div>
    </div>
  </div>
  <div class="grid grid-2">
    ${recs.length ? recs.map(r=>`
      <div class="card">
        <h4>${typeIcon[r.type]||'📁'} ${escapeHtml(r.name)}</h4>
        <p class="helper-text">${escapeHtml(r.type)} · Document date ${fmtDate(r.date)}</p>
        <p class="helper-text">Uploaded ${fmtDate(r.uploadDate)}</p>
        <div class="modal-actions" style="justify-content:flex-start;">
          <button class="btn btn-outline btn-sm" onclick="viewRecordPreview('${r.id}')">View</button>
          <button class="btn btn-ghost btn-sm" onclick="downloadRecord('${r.id}')">Download</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteRecord('${r.id}')">${t('delete')}</button>
        </div>
      </div>`).join('') : `<div class="state-block"><div class="state-icon">📋</div><p>No health records found.</p></div>`}
  </div>`;
}

async function viewRecordPreview(id){
  const r = DB.health_records.find(x=>x.id===id);
  const backdrop = document.createElement('div');
  backdrop.className='modal-backdrop';
  let bodyHtml = `
    <div class="state-block" style="border:2px dashed var(--line);border-radius:12px;">
      <div class="state-icon">📄</div>
      <p>Preview of ${escapeHtml(r.type)}<br>Document date: ${fmtDate(r.date)}</p>
      <p class="helper-text">(Sample preview — connect real document storage to view the full file.)</p>
    </div>`;
  if(window.BACKEND_MODE === 'supabase' && r.storagePath){
    try{
      const url = await window.CareConnectServices.records.getSignedUrl(r.storagePath);
      bodyHtml = `<div class="state-block" style="border:2px solid var(--line);border-radius:12px;padding:12px;">
        <iframe src="${url}" title="${escapeHtml(r.name)}" style="width:100%;height:60vh;border:none;border-radius:8px;"></iframe>
        <p style="margin-top:10px;"><a class="btn btn-outline btn-sm" href="${url}" target="_blank" rel="noopener">Open in new tab</a></p>
      </div>`;
    }catch(e){
      bodyHtml = `<div class="state-block"><p>${t('unable_to_load')}</p></div>`;
    }
  }
  backdrop.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
    <div class="modal-header"><h3>${escapeHtml(r.name)}</h3><button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button></div>
    ${bodyHtml}
  </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.remove(); });
}

async function downloadRecord(id){
  const r = DB.health_records.find(x=>x.id===id);
  if(window.BACKEND_MODE === 'supabase' && r.storagePath){
    try{
      const url = await window.CareConnectServices.records.getSignedUrl(r.storagePath, 60);
      window.open(url, '_blank', 'noopener');
    }catch(e){
      toast('Could not generate a download link', 'error');
    }
    return;
  }
  toast('Downloading ' + r.name + '…', 'success');
}

function deleteRecord(id){
  confirmDialog({title:'Delete record?', message:'This document will be permanently removed.', confirmLabel:t('delete'), danger:true}, async ()=>{
    if(window.BACKEND_MODE === 'supabase'){
      const r = DB.health_records.find(x=>x.id===id);
      await window.CareConnectServices.records.deleteRecord(id, r ? r.storagePath : null);
    }
    DB.health_records = DB.health_records.filter(r=>r.id!==id);
    saveDB(); toast('Record deleted', 'success'); render();
  });
}

function openRecordModal(){
  const backdrop = document.createElement('div');
  backdrop.className='modal-backdrop';
  backdrop.innerHTML = `
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="rec-modal-title">
    <div class="modal-header"><h3 id="rec-modal-title">Upload Health Record</h3><button class="modal-close" onclick="this.closest('.modal-backdrop').remove()" aria-label="${t('close')}">&times;</button></div>
    <form id="rec-form">
      <div class="field"><label for="rf-name">Document name</label><input class="input" id="rf-name" required placeholder="e.g. Blood Test Report - March"></div>
      <div class="field"><label for="rf-type">Type</label>
        <select class="input" id="rf-type">
          <option>Prescription</option><option>Lab Report</option><option>Discharge Summary</option><option>Medical Report</option><option>Other</option>
        </select>
      </div>
      <div class="field"><label for="rf-date">Document date</label><input class="input" id="rf-date" type="date" value="${isoDate(new Date())}"></div>
      <div class="field"><label for="rf-file">File</label><input class="input" id="rf-file" type="file" accept=".pdf,.jpg,.jpeg,.png">
        <span class="hint">${window.BACKEND_MODE==='supabase' ? 'Uploaded securely to your own Supabase Storage — only you (and any caregiver you share records with) can access it.' : 'In this demo, files are recorded by name only and not uploaded anywhere.'}</span>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">${t('cancel')}</button>
        <button type="submit" class="btn btn-primary" id="rec-submit-btn">Upload</button>
      </div>
    </form>
  </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.remove(); });
  backdrop.querySelector('#rec-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const user = currentUser();
    const name = document.getElementById('rf-name').value.trim();
    const type = document.getElementById('rf-type').value;
    const date = document.getElementById('rf-date').value;
    const file = document.getElementById('rf-file').files[0];
    if(!name){ toast('Please enter a document name', 'error'); return; }
    const submitBtn = document.getElementById('rec-submit-btn');
    submitBtn.classList.add('btn-loading');
    try{
      if(window.BACKEND_MODE === 'supabase'){
        const created = await window.CareConnectServices.records.addRecord(user.id, {name, type, date}, file);
        DB.health_records.push(created);
      } else {
        DB.health_records.push({id:uid('hr'), userId:user.id, name, type, date, uploadDate:isoDate(new Date())});
      }
      await addNotification(user.id, 'record', 'Health record uploaded', name + ' has been added to your records.');
      saveDB(); backdrop.remove(); toast('Record uploaded', 'success'); render();
    }catch(err){
      submitBtn.classList.remove('btn-loading');
      toast(err.message || 'Could not upload this record', 'error');
    }
  });
}

/* =========================================================
   POST-DISCHARGE CARE
========================================================= */
function renderPostDischarge(){
  const user = currentUser();
  const plans = userPlans(user.id);
  const stageOrder = ['discharge','medication','recovery','followup','diagnostic','review'];
  const stageLabel = {discharge:'Discharge', medication:'Medication', recovery:'Recovery Instructions', followup:'Follow-up', diagnostic:'Diagnostic Test', review:'Provider Review'};

  if(!plans.length){
    return `
    <div class="section-heading-row"><h1>${t('postdischarge_title')}</h1><button class="btn btn-primary" onclick="openPlanModal()">+ Add Care Plan</button></div>
    <div class="state-block"><div class="state-icon">🩺</div><h3>No post-discharge plan yet</h3><p>Add the instructions your provider gave you at discharge to keep recovery on track.</p><button class="btn btn-primary" onclick="openPlanModal()">+ Add Care Plan</button></div>`;
  }

  return plans.map(p=>`
  <div class="section-heading-row"><h1>${t('postdischarge_title')}</h1><button class="btn btn-outline btn-sm" onclick="openPlanModal('${p.id}')">${t('edit')} Plan</button></div>
  <div class="card" style="margin-bottom:20px;">
    <h3>Discharge information</h3>
    <div class="grid grid-2">
      <div><span class="list-row-sub">Hospital</span><p style="font-weight:700;">${escapeHtml(p.hospital)}</p></div>
      <div><span class="list-row-sub">Discharge date</span><p style="font-weight:700;">${fmtDate(p.dischargeDate)}</p></div>
      <div><span class="list-row-sub">Provider</span><p style="font-weight:700;">${escapeHtml(p.provider)}</p></div>
      <div><span class="list-row-sub">Follow-up date</span><p style="font-weight:700;">${fmtDate(p.followUpDate)}</p></div>
    </div>
  </div>
  <div class="card" style="margin-bottom:20px;">
    <h3>Care timeline</h3>
    <div class="journey-flow" style="justify-content:flex-start;">
      ${stageOrder.map((s,i)=>{
        const stageTasks = (p.tasks||[]).filter(x=>x.stage===s);
        const done = stageTasks.length>0 && stageTasks.every(x=>x.done);
        return `<span class="journey-step" style="border-color:${done?'var(--success)':'var(--teal-600)'};color:${done?'var(--success)':'var(--teal-900)'};">${done?'✓ ':''}${stageLabel[s]}</span>${i<stageOrder.length-1?'<span class="journey-arrow">↓</span>':''}`;
      }).join('')}
    </div>
    <div class="divider"></div>
    ${(p.tasks||[]).map(task=>`
      <div class="list-row">
        <div class="list-row-main"><span class="list-row-title">${escapeHtml(task.label)}</span><span class="list-row-sub">${stageLabel[task.stage]||''}</span></div>
        <label class="checkbox-row"><input type="checkbox" ${task.done?'checked':''} onchange="togglePlanTask('${p.id}','${task.id}',this.checked)"><span class="visually-hidden">Mark complete</span></label>
      </div>`).join('')}
  </div>
  <div class="grid grid-2">
    <div class="card"><h4>Recovery instructions</h4><p>${escapeHtml(p.instructions||'—')}</p></div>
    <div class="card"><h4>Medication schedule</h4><p>${escapeHtml(p.medicationSchedule||'—')}</p></div>
    <div class="card"><h4>Test schedule</h4><p>${escapeHtml(p.testSchedule||'—')}</p></div>
    <div class="card"><h4>Provider notes</h4><p>${escapeHtml(p.notes||'—')}</p></div>
  </div>
  <p class="helper-text" style="margin-top:16px;">All instructions above were entered as issued by your healthcare provider. CareConnect does not generate treatment instructions independently.</p>
  `).join('');
}

async function togglePlanTask(planId, taskId, done){
  if(window.BACKEND_MODE === 'supabase'){
    await window.CareConnectServices.postDischarge.setTaskDone(taskId, done);
  }
  const p = DB.post_discharge_plans.find(x=>x.id===planId);
  const task = p.tasks.find(x=>x.id===taskId);
  task.done = done;
  saveDB(); render(); toast(done?'Marked complete':'Marked incomplete', 'success');
}

function openPlanModal(planId){
  const user = currentUser();
  const p = planId ? DB.post_discharge_plans.find(x=>x.id===planId) : null;
  const backdrop = document.createElement('div');
  backdrop.className='modal-backdrop';
  backdrop.innerHTML = `
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="plan-modal-title">
    <div class="modal-header"><h3 id="plan-modal-title">${p?t('edit'):t('add')} Post-Discharge Plan</h3><button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button></div>
    <form id="plan-form">
      <div class="field"><label for="pf-hospital">Hospital</label><input class="input" id="pf-hospital" required value="${p?escapeHtml(p.hospital):''}"></div>
      <div class="grid grid-2">
        <div class="field"><label for="pf-discharge">Discharge date</label><input class="input" id="pf-discharge" type="date" required value="${p?p.dischargeDate:''}"></div>
        <div class="field"><label for="pf-followup">Follow-up date</label><input class="input" id="pf-followup" type="date" value="${p?p.followUpDate:''}"></div>
      </div>
      <div class="field"><label for="pf-provider">Provider</label><input class="input" id="pf-provider" value="${p?escapeHtml(p.provider):''}"></div>
      <div class="field"><label for="pf-instructions">Recovery instructions</label><textarea class="input" id="pf-instructions">${p?escapeHtml(p.instructions||''):''}</textarea></div>
      <div class="field"><label for="pf-medschedule">Medication schedule</label><textarea class="input" id="pf-medschedule">${p?escapeHtml(p.medicationSchedule||''):''}</textarea></div>
      <div class="field"><label for="pf-testschedule">Test schedule</label><textarea class="input" id="pf-testschedule">${p?escapeHtml(p.testSchedule||''):''}</textarea></div>
      <div class="field"><label for="pf-notes">Notes</label><textarea class="input" id="pf-notes">${p?escapeHtml(p.notes||''):''}</textarea></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">${t('cancel')}</button>
        <button type="submit" class="btn btn-primary">${t('save')}</button>
      </div>
    </form>
  </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.remove(); });
  backdrop.querySelector('#plan-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const vals = {
      hospital: document.getElementById('pf-hospital').value.trim(),
      dischargeDate: document.getElementById('pf-discharge').value,
      followUpDate: document.getElementById('pf-followup').value,
      provider: document.getElementById('pf-provider').value.trim(),
      instructions: document.getElementById('pf-instructions').value.trim(),
      medicationSchedule: document.getElementById('pf-medschedule').value.trim(),
      testSchedule: document.getElementById('pf-testschedule').value.trim(),
      notes: document.getElementById('pf-notes').value.trim(),
    };
    if(!vals.hospital || !vals.dischargeDate){ toast('Please fill in required fields', 'error'); return; }

    if(window.BACKEND_MODE === 'supabase'){
      if(p){
        const updated = await window.CareConnectServices.postDischarge.updatePlan(p.id, vals);
        Object.assign(p, updated);
      } else {
        const created = await window.CareConnectServices.postDischarge.addPlan(user.id, vals);
        DB.post_discharge_plans.push(created);
        await addNotification(user.id, 'followup', 'Post-discharge plan added', 'Your care plan from ' + vals.hospital + ' has been saved.');
      }
    } else {
      if(p){ Object.assign(p, vals); }
      else {
        DB.post_discharge_plans.push(Object.assign({id:uid('pdp'), userId:user.id, tasks:[
          {id:uid('pdt'), label:'Discharge summary received', stage:'discharge', done:true},
          {id:uid('pdt'), label:'Medication schedule started', stage:'medication', done:false},
          {id:uid('pdt'), label:'Recovery instructions reviewed', stage:'recovery', done:false},
          {id:uid('pdt'), label:'Follow-up appointment scheduled', stage:'followup', done:!!vals.followUpDate},
          {id:uid('pdt'), label:'Diagnostic test completed', stage:'diagnostic', done:false},
          {id:uid('pdt'), label:'Provider review of results', stage:'review', done:false},
        ]}, vals));
        await addNotification(user.id, 'followup', 'Post-discharge plan added', 'Your care plan from ' + vals.hospital + ' has been saved.');
      }
    }
    saveDB(); backdrop.remove(); toast(t('saved'), 'success'); render();
  });
}

/* =========================================================
   REMOTE HEALTHCARE / CONSULT
========================================================= */
function renderConsult(){
  const user = currentUser();
  const list = userConsultations(user.id).sort((a,b)=> new Date(b.requestedDate)-new Date(a.requestedDate));
  const statusColor = {Requested:'badge-gold', Confirmed:'badge-teal', Completed:'badge-success'};

  return `
  <div class="section-heading-row"><h1>${t('consult_title')}</h1><button class="btn btn-primary" onclick="openConsultModal()">+ Request Consultation</button></div>
  <p class="lang-note">This is a prototype scheduling workflow. Actual medical consultation depends on participating healthcare providers — CareConnect does not provide live video consultations in this demo.</p>
  <div class="card">
    ${list.length ? list.map(c=>`
      <div class="list-row">
        <div class="list-row-main">
          <span class="list-row-title">${escapeHtml(c.providerType)}</span>
          <span class="list-row-sub">Requested for ${fmtDate(c.requestedDate)}</span>
          ${c.notes?`<span class="list-row-sub">${escapeHtml(c.notes)}</span>`:''}
        </div>
        <span class="badge ${statusColor[c.status]||'badge-muted'}">${c.status}</span>
      </div>`).join('') : `<div class="state-block"><div class="state-icon">💻</div><p>No consultations requested yet.</p></div>`}
  </div>`;
}

function openConsultModal(){
  const backdrop = document.createElement('div');
  backdrop.className='modal-backdrop';
  backdrop.innerHTML = `
  <div class="modal" role="dialog" aria-modal="true">
    <div class="modal-header"><h3>Request Consultation</h3><button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button></div>
    <form id="consult-form">
      <div class="field"><label for="cf-type">Consultation type</label>
        <select class="input" id="cf-type"><option>General Physician</option><option>Cardiologist</option><option>Diabetologist</option><option>Physiotherapist</option><option>Dietitian</option></select>
      </div>
      <div class="field"><label for="cf-date">Preferred date</label><input class="input" id="cf-date" type="date" value="${isoDate(addDays(new Date(),2))}"></div>
      <div class="field"><label for="cf-notes">Notes for the provider</label><textarea class="input" id="cf-notes" placeholder="What would you like to discuss?"></textarea></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">${t('cancel')}</button>
        <button type="submit" class="btn btn-primary">Request</button>
      </div>
    </form>
  </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.remove(); });
  backdrop.querySelector('#consult-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const user = currentUser();
    const providerType = document.getElementById('cf-type').value;
    const requestedDate = document.getElementById('cf-date').value;
    const notes = document.getElementById('cf-notes').value.trim();
    if(window.BACKEND_MODE === 'supabase'){
      const created = await window.CareConnectServices.consultations.addConsultation(user.id, {providerType, notes, requestedDate});
      DB.consultations.push(created);
    } else {
      DB.consultations.push({id:uid('con'), userId:user.id, providerType, notes, status:'Requested', requestedDate});
    }
    await addNotification(user.id, 'system', 'Consultation requested', providerType + ' consultation requested for ' + fmtDate(requestedDate) + '.');
    saveDB(); backdrop.remove(); toast('Consultation requested', 'success'); render();
  });
}

/* =========================================================
   CAREGIVER MANAGEMENT (patient side)
========================================================= */
const PERM_KEYS = ['appointments','medicines','postDischarge','healthRecords','notifications'];
const PERM_LABELS = {appointments:'Appointments', medicines:'Medicine reminders', postDischarge:'Post-discharge schedule', healthRecords:'Health records', notifications:'Notifications'};

function renderCaregiverManage(){
  const user = currentUser();
  const conns = caregiverConnectionsForPatient(user.id);
  return `
  <div class="section-heading-row"><h1>${t('caregiver_title')}</h1><button class="btn btn-primary" onclick="openInviteModal()">+ ${t('invite_caregiver')}</button></div>

  <div class="card" style="margin-bottom:20px;">
    <h3>${t('connected_caregivers')}</h3>
    ${conns.length ? conns.map(c=>{
      const cg = DB.users.find(u=>u.id===c.caregiverId);
      const perms = DB.caregiver_permissions[c.id] || {};
      return `
      <div class="list-row">
        <div class="list-row-main">
          <span class="list-row-title">${escapeHtml(cg?cg.name:'Unknown')} <span class="helper-text">(${escapeHtml(c.relationship)})</span></span>
          <span class="list-row-sub">${c.status==='accepted'?'Connected':'Pending'} · ${PERM_KEYS.filter(k=>perms[k]).length} item(s) shared</span>
        </div>
        <div class="list-row-actions">
          <button class="btn btn-outline btn-sm" onclick="openPermissionModal('${c.id}')">${t('sharing_permissions')}</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="removeCaregiver('${c.id}')">Remove</button>
        </div>
      </div>`;
    }).join('') : `<div class="state-block"><div class="state-icon">👨‍👩‍👧</div><p>No caregivers connected yet.</p></div>`}
  </div>
  <p class="helper-text">Manage detailed sharing permissions and full access history in the <a href="#/privacy" data-nav="privacy">Consent &amp; Privacy Centre</a>.</p>`;
}

function openInviteModal(){
  const backdrop = document.createElement('div');
  backdrop.className='modal-backdrop';
  backdrop.innerHTML = `
  <div class="modal" role="dialog" aria-modal="true">
    <div class="modal-header"><h3>${t('invite_caregiver')}</h3><button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button></div>
    <form id="invite-form">
      <div class="field"><label for="if-email">Caregiver's email</label><input class="input" id="if-email" type="email" required></div>
      <div class="field"><label for="if-rel">Relationship</label><input class="input" id="if-rel" placeholder="e.g. Son, Daughter, Friend" required></div>
      <p class="helper-text">An invitation code will be generated. In this demo, if the email matches an existing caregiver account, the connection is made immediately.</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">${t('cancel')}</button>
        <button type="submit" class="btn btn-primary">Send Invitation</button>
      </div>
    </form>
  </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.remove(); });
  backdrop.querySelector('#invite-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const user = currentUser();
    const email = document.getElementById('if-email').value.trim().toLowerCase();
    const rel = document.getElementById('if-rel').value.trim();

    if(window.BACKEND_MODE === 'supabase'){
      const { connection, permissions } = await window.CareConnectServices.caregivers.inviteCaregiver(user.id, email, rel);
      DB.caregiver_connections.push(connection);
      DB.caregiver_permissions[connection.id] = permissions;
      if(connection.caregiverId && !DB.users.find(u=>u.id===connection.caregiverId)){
        DB.users.push({id:connection.caregiverId, role:'caregiver', name:'', email});
      }
      await addNotification(user.id, 'caregiver', 'Invitation sent', 'Invitation sent to ' + email + (connection.status==='accepted'?' — connected.':' — pending acceptance.'));
      saveDB(); backdrop.remove(); toast(connection.status==='accepted'?'Caregiver connected':'Invitation sent', 'success'); render();
      return;
    }

    const cgUser = DB.users.find(u=>u.email.toLowerCase()===email && u.role==='caregiver');
    const connId = uid('conn');
    DB.caregiver_connections.push({id:connId, patientId:user.id, caregiverId: cgUser? cgUser.id : uid('pending'), relationship:rel, status: cgUser?'accepted':'pending', invitedAt:nowISO(), invitedEmail:email});
    DB.caregiver_permissions[connId] = {appointments:false, medicines:false, postDischarge:false, healthRecords:false, notifications:false};
    if(cgUser) await addNotification(cgUser.id, 'caregiver', 'New patient connection', getProfile(user.id).fullName + ' invited you as a caregiver.');
    await addNotification(user.id, 'caregiver', 'Invitation sent', 'Invitation sent to ' + email + (cgUser?' — connected.':' — pending acceptance.'));
    saveDB(); backdrop.remove(); toast(cgUser?'Caregiver connected':'Invitation sent', 'success'); render();
  });
}

function removeCaregiver(connId){
  confirmDialog({title:'Remove caregiver?', message:'This caregiver will lose all access to your shared information.', confirmLabel:'Remove', danger:true}, async ()=>{
    if(window.BACKEND_MODE === 'supabase'){
      await window.CareConnectServices.caregivers.removeCaregiver(connId);
    }
    DB.caregiver_connections = DB.caregiver_connections.filter(c=>c.id!==connId);
    delete DB.caregiver_permissions[connId];
    saveDB(); toast('Caregiver removed', 'success'); render();
  });
}

function openPermissionModal(connId){
  const conn = DB.caregiver_connections.find(c=>c.id===connId);
  const cg = DB.users.find(u=>u.id===conn.caregiverId);
  const perms = DB.caregiver_permissions[connId] || {};
  const backdrop = document.createElement('div');
  backdrop.className='modal-backdrop';
  backdrop.innerHTML = `
  <div class="modal" role="dialog" aria-modal="true">
    <div class="modal-header"><h3>${t('sharing_permissions')}</h3><button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button></div>
    <p class="helper-text">Caregiver: <strong>${escapeHtml(cg?cg.name:'Pending')}</strong> (${escapeHtml(conn.relationship)})</p>
    ${PERM_KEYS.map(k=>`
      <div class="perm-row">
        <span>${PERM_LABELS[k]}</span>
        <label class="switch"><input type="checkbox" id="perm-${k}" ${perms[k]?'checked':''} onchange="updatePermission('${connId}','${k}',this.checked)"><span class="slider"></span></label>
      </div>`).join('')}
    <div class="modal-actions"><button class="btn btn-primary" onclick="this.closest('.modal-backdrop').remove()">${t('close')}</button></div>
  </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.remove(); });
}

async function updatePermission(connId, key, value){
  const conn = DB.caregiver_connections.find(c=>c.id===connId);
  if(window.BACKEND_MODE === 'supabase'){
    const updated = await window.CareConnectServices.caregivers.updatePermission(connId, conn.patientId, conn.caregiverId, key, value);
    DB.caregiver_permissions[connId] = updated;
  } else {
    DB.caregiver_permissions[connId][key] = value;
  }
  saveDB();
  toast(value?'Shared':'Access revoked', 'success');
  if(conn){
    await addNotification(conn.patientId, 'caregiver', 'Permission updated', PERM_LABELS[key] + ' is now ' + (value?'shared':'not shared') + '.');
  }
}

/* =========================================================
   CONSENT & PRIVACY CENTRE
========================================================= */
function renderPrivacyCentre(){
  const user = currentUser();
  const conns = caregiverConnectionsForPatient(user.id);
  return `
  <div class="section-heading-row"><h1>${t('privacy_title')}</h1></div>
  <p class="helper-text" style="margin-bottom:20px;">${t('who_has_access')} Review and control exactly what each caregiver can see. Changes apply immediately.</p>
  ${conns.length ? conns.map(c=>{
    const cg = DB.users.find(u=>u.id===c.caregiverId);
    const perms = DB.caregiver_permissions[c.id] || {};
    return `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-title-row">
        <h3>${escapeHtml(cg?cg.name:'Pending invitation')} <span class="helper-text">(${escapeHtml(c.relationship)})</span></h3>
        <span class="helper-text">Granted ${fmtDate(c.invitedAt ? c.invitedAt.slice(0,10) : '')}</span>
      </div>
      ${PERM_KEYS.map(k=>`
        <div class="perm-row">
          <span>${PERM_LABELS[k]}</span>
          <label class="switch"><input type="checkbox" ${perms[k]?'checked':''} onchange="updatePermission('${c.id}','${k}',this.checked); this.closest('.card').querySelector('.badge-danger-all') && null;"><span class="slider"></span></label>
        </div>`).join('')}
      <div class="modal-actions" style="justify-content:flex-start;">
        <button class="btn btn-danger btn-sm" onclick="revokeAll('${c.id}')">${t('revoke_all')}</button>
      </div>
    </div>`;
  }).join('') : `<div class="state-block"><div class="state-icon">🔒</div><p>No caregivers connected. Nothing is being shared.</p></div>`}
  `;
}

function revokeAll(connId){
  confirmDialog({title:t('revoke_all')+'?', message:'This will turn off all sharing for this caregiver immediately.', confirmLabel:t('revoke_all'), danger:true}, async ()=>{
    if(window.BACKEND_MODE === 'supabase'){
      const conn = DB.caregiver_connections.find(c=>c.id===connId);
      const updated = await window.CareConnectServices.caregivers.revokeAllPermissions(connId, conn.patientId, conn.caregiverId);
      DB.caregiver_permissions[connId] = updated;
    } else {
      PERM_KEYS.forEach(k=> DB.caregiver_permissions[connId][k] = false);
    }
    saveDB(); toast('All access revoked', 'success'); render();
  });
}

/* =========================================================
   NOTIFICATION CENTRE
========================================================= */
let notifFilter = 'All';
function renderNotifications(){
  const user = currentUser();
  let list = userNotifications(user.id);
  const typeIcon = {medicine:'💊', appointment:'📅', followup:'🏥', record:'📋', caregiver:'👨‍👩‍👧', system:'🔔'};
  const types = ['All','medicine','appointment','followup','record','caregiver','system'];
  if(notifFilter!=='All') list = list.filter(n=>n.type===notifFilter);

  return `
  <div class="section-heading-row">
    <h1>${t('notifications_title')}</h1>
    <button class="btn btn-outline btn-sm" onclick="markAllRead()">Mark all as read</button>
  </div>
  <div class="tabs" role="tablist" style="flex-wrap:wrap;">
    ${types.map(ty=>`<button class="tab-btn ${notifFilter===ty?'active':''}" onclick="notifFilter='${ty}';render();">${ty==='All'?'All':typeIcon[ty]+' '+ty.charAt(0).toUpperCase()+ty.slice(1)}</button>`).join('')}
  </div>
  <div class="card">
    ${list.length ? list.map(n=>`
      <div class="list-row" style="${n.read?'':'background:var(--teal-50);border-radius:8px;padding-left:10px;padding-right:10px;'}">
        <div class="list-row-main">
          <span class="list-row-title">${typeIcon[n.type]||'🔔'} ${escapeHtml(n.title)}</span>
          <span class="list-row-sub">${escapeHtml(n.message)}</span>
          <span class="list-row-sub">${fmtDateTime(n.date)}</span>
        </div>
        <div class="list-row-actions">
          ${!n.read?`<button class="btn btn-ghost btn-sm" onclick="markRead('${n.id}')">Mark read</button>`:''}
          <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteNotification('${n.id}')">${t('delete')}</button>
        </div>
      </div>`).join('') : `<div class="state-block"><div class="state-icon">🔔</div><p>No notifications.</p></div>`}
  </div>`;
}
async function markRead(id){
  if(window.BACKEND_MODE === 'supabase'){ await window.CareConnectServices.notifications.markRead(id); }
  const n = DB.notifications.find(x=>x.id===id); n.read=true; saveDB(); render();
}
async function markAllRead(){
  const user=currentUser();
  if(window.BACKEND_MODE === 'supabase'){ await window.CareConnectServices.notifications.markAllRead(user.id); }
  DB.notifications.filter(n=>n.userId===user.id).forEach(n=>n.read=true); saveDB(); toast('All marked as read','success'); render();
}
async function deleteNotification(id){
  if(window.BACKEND_MODE === 'supabase'){ await window.CareConnectServices.notifications.deleteNotification(id); }
  DB.notifications = DB.notifications.filter(n=>n.id!==id); saveDB(); render();
}

/* =========================================================
   VOICE ASSISTANT
========================================================= */
let voiceTranscriptLog = [];
let recognitionInstance = null;

function renderVoiceAssistant(){
  const user = currentUser();
  const supported = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  return `
  <div class="section-heading-row"><h1>${t('voice_title')}</h1></div>
  <div class="card" style="text-align:center;padding:40px 20px;margin-bottom:20px;">
    <button class="icon-btn" style="width:88px;height:88px;border-radius:50%;font-size:2.2rem;background:var(--teal-700);color:#fff;border:none;" id="voice-mic-btn" onclick="startVoiceListening()" aria-label="Start voice command">🎙</button>
    <p style="margin-top:16px;font-weight:700;" id="voice-status">${supported ? 'Tap the microphone and speak a command' : 'Voice recognition is not supported in this browser — type a command below instead'}</p>
  </div>
  <div class="card" style="margin-bottom:20px;">
    <form onsubmit="return submitVoiceText(event)">
      <div class="field"><label for="voice-text-input">Or type a command</label>
        <div style="display:flex;gap:10px;">
          <input class="input" id="voice-text-input" placeholder="e.g. Show my medicines">
          <button class="btn btn-primary" type="submit">Send</button>
        </div>
      </div>
    </form>
  </div>
  <div class="card">
    <h4>Try saying:</h4>
    <div class="grid grid-2">
      ${['Show my medicines','Show my appointments','Find nearby hospitals','Open my health records','Change language to Tamil','Show my caregiver'].map(cmd=>`
        <button class="btn btn-outline btn-sm" style="justify-content:flex-start;" onclick="handleVoiceCommand('${cmd}')">🗣 ${cmd}</button>`).join('')}
    </div>
  </div>
  ${voiceTranscriptLog.length ? `
  <div class="card" style="margin-top:20px;">
    <h4>Recent commands</h4>
    ${voiceTranscriptLog.slice(-5).reverse().map(v=>`<div class="list-row"><div class="list-row-main"><span class="list-row-title">"${escapeHtml(v.text)}"</span><span class="list-row-sub">${escapeHtml(v.response)}</span></div></div>`).join('')}
  </div>`:''}
  <p class="helper-text" style="margin-top:16px;">The voice assistant helps you navigate CareConnect. It does not diagnose conditions or prescribe medication.</p>
  `;
}

function startVoiceListening(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const statusEl = document.getElementById('voice-status');
  if(!SpeechRecognition){
    toast('Voice recognition not supported in this browser — please type your command', 'error');
    return;
  }
  try{
    recognitionInstance = new SpeechRecognition();
    recognitionInstance.lang = 'en-IN';
    recognitionInstance.onstart = ()=>{ if(statusEl) statusEl.textContent = 'Listening…'; };
    recognitionInstance.onresult = (ev)=>{
      const text = ev.results[0][0].transcript;
      handleVoiceCommand(text);
    };
    recognitionInstance.onerror = ()=>{ toast('Could not hear that — please try typing instead', 'error'); };
    recognitionInstance.onend = ()=>{ if(statusEl) statusEl.textContent = 'Tap the microphone and speak a command'; };
    recognitionInstance.start();
  }catch(e){
    toast('Voice recognition unavailable — please type your command', 'error');
  }
}

function submitVoiceText(e){
  e.preventDefault();
  const input = document.getElementById('voice-text-input');
  if(input.value.trim()){ handleVoiceCommand(input.value.trim()); input.value=''; }
  return false;
}

function speak(text){
  const user = currentUser();
  if(!user || !getA11y(user.id).textToSpeech) return;
  if('speechSynthesis' in window){
    try{ const u = new SpeechSynthesisUtterance(text); window.speechSynthesis.speak(u); }catch(e){}
  }
}

function handleVoiceCommand(text){
  const lower = text.toLowerCase();
  let response = "I didn't quite catch that. Try: 'show my medicines', 'show my appointments', 'find nearby hospitals'.";
  let route = null;

  if(lower.includes('medicine')){ response = 'Opening your medicines.'; route='medicines'; }
  else if(lower.includes('appointment')){ response = 'Opening your appointments.'; route='appointments'; }
  else if(lower.includes('hospital') || lower.includes('nearby') || lower.includes('clinic') || lower.includes('pharmacy')){ response='Opening healthcare services near you.'; route='healthcare'; }
  else if(lower.includes('record')){ response='Opening your health records.'; route='records'; }
  else if(lower.includes('caregiver')){ response='Opening your caregiver page.'; route='caregiver'; }
  else if(lower.includes('emergency')){ response='Opening emergency support.'; route='emergency'; }
  else if(lower.includes('tamil')){ response='Switching language to Tamil.'; changeLanguage('ta'); }
  else if(lower.includes('hindi')){ response='Switching language to Hindi.'; changeLanguage('hi'); }
  else if(lower.includes('telugu')){ response='Switching language to Telugu.'; changeLanguage('te'); }
  else if(lower.includes('kannada')){ response='Switching language to Kannada.'; changeLanguage('kn'); }
  else if(lower.includes('malayalam')){ response='Switching language to Malayalam.'; changeLanguage('ml'); }
  else if(lower.includes('english')){ response='Switching language to English.'; changeLanguage('en'); }

  voiceTranscriptLog.push({text, response});
  speak(response);
  toast(response);
  if(route){ setTimeout(()=>navigate(route), 400); } else { render(); }
}

/* =========================================================
   EMERGENCY SUPPORT
========================================================= */
function renderEmergency(){
  const user = currentUser();
  const contacts = userEmergencyContacts(user.id);
  const nearestEmergency = DB.healthcare_services.find(s=>s.type==='Emergency Facility');

  return `
  <div class="section-heading-row"><h1>${t('emergency_title')}</h1></div>
  <div class="emergency-hero">
    <h2 style="color:var(--danger);">In a medical emergency, call for help immediately</h2>
    <button class="emergency-call-btn" onclick="triggerEmergencyCall()">📞 ${t('emergency_call')} (108)</button>
    <p style="margin-top:16px;font-weight:700;color:var(--danger);">For medical emergencies, contact your local emergency service or seek immediate professional medical attention. CareConnect does not provide emergency diagnosis or treatment.</p>
  </div>

  <div class="grid grid-2">
    <div class="card">
      <h3>${t('emergency_contact')}</h3>
      ${contacts.length ? contacts.map(c=>`
        <div class="list-row">
          <div class="list-row-main"><span class="list-row-title">${escapeHtml(c.name)}</span><span class="list-row-sub">${escapeHtml(c.relationship)}</span></div>
          <a class="btn btn-primary btn-sm" href="tel:${c.phone.replace(/\s/g,'')}">Call</a>
        </div>`).join('') : `<div class="state-block"><p>No emergency contacts saved yet.</p></div>`}
    </div>
    <div class="card">
      <h3>${t('nearby_emergency')}</h3>
      ${nearestEmergency ? `
        <p style="font-weight:700;">${escapeHtml(nearestEmergency.name)}</p>
        <p class="helper-text">${escapeHtml(nearestEmergency.address)} · ${escapeHtml(nearestEmergency.distance)}</p>
        <a class="btn btn-outline btn-sm" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nearestEmergency.name+' '+nearestEmergency.address)}" target="_blank" rel="noopener">Get Directions</a>
      ` : `<p class="helper-text">No emergency facility data available.</p>`}
    </div>
  </div>

  <div class="card" style="margin-top:20px;">
    <h3>Current location</h3>
    <p class="helper-text" id="emergency-location-text">Location not shared yet.</p>
    <button class="btn btn-outline btn-sm" onclick="shareLocation()">Share my location</button>
  </div>`;
}

function triggerEmergencyCall(){
  window.location.href = 'tel:108';
}
function shareLocation(){
  const el = document.getElementById('emergency-location-text');
  if(!navigator.geolocation){ el.textContent = 'Location services are not available on this device.'; return; }
  el.textContent = 'Locating…';
  navigator.geolocation.getCurrentPosition(
    pos=>{ el.textContent = `Location shared: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`; toast('Location shared','success'); },
    err=>{ el.textContent = 'Could not access your location. Please check permissions.'; }
  );
}

/* =========================================================
   PROFILE
========================================================= */
function renderProfile(){
  const user = currentUser();
  const p = getProfile(user.id);
  const a11y = getA11y(user.id);
  const settings = getSettings(user.id);
  return `
  <div class="section-heading-row"><h1>${t('profile_title')}</h1><button class="btn btn-outline" onclick="openProfileEditModal()">${t('edit')}</button></div>

  <div class="grid grid-2">
    <div class="card">
      <h3>Personal information</h3>
      <p><strong>Name:</strong> ${escapeHtml(p.fullName||user.name)}</p>
      <p><strong>Age:</strong> ${escapeHtml(p.age||'—')}</p>
      <p><strong>Gender:</strong> ${escapeHtml(p.gender||'—')}</p>
      <p><strong>Phone:</strong> ${escapeHtml(p.phone||'—')}</p>
      <p><strong>Email:</strong> ${escapeHtml(user.email)}</p>
    </div>
    <div class="card">
      <h3>Location</h3>
      <p>${escapeHtml(p.location||'Not set')}</p>
      <div class="divider"></div>
      <h3>Language</h3>
      <p>${LANGS.find(l=>l.code===settings.language)?.label || 'English'}</p>
    </div>
    <div class="card">
      <h3>${t('emergency_contact')}</h3>
      <p><strong>${escapeHtml(p.emergencyContactName||'Not set')}</strong></p>
      <p>${escapeHtml(p.emergencyContactPhone||'')}</p>
    </div>
    <div class="card">
      <h3>${t('accessibility')}</h3>
      <p>${t('text_size')}: ${a11y.textSize}</p>
      <p>${t('contrast')}: ${a11y.contrast}</p>
      <p>${t('reduced_motion')}: ${a11y.reducedMotion?'On':'Off'}</p>
    </div>
    ${currentRole()==='patient' ? `
    <div class="card">
      <h3>${t('nav_caregiver')}</h3>
      ${caregiverConnectionsForPatient(user.id).length ? caregiverConnectionsForPatient(user.id).map(c=>{
        const cg = DB.users.find(u=>u.id===c.caregiverId);
        return `<p>${escapeHtml(cg?cg.name:'Pending')} (${escapeHtml(c.relationship)})</p>`;
      }).join('') : `<p class="helper-text">No caregiver connected.</p>`}
      <a class="helper-text" href="#/caregiver" data-nav="caregiver">Manage caregivers →</a>
    </div>` : ''}
  </div>`;
}

function openProfileEditModal(){
  const user = currentUser();
  const p = getProfile(user.id);
  const backdrop = document.createElement('div');
  backdrop.className='modal-backdrop';
  backdrop.innerHTML = `
  <div class="modal" role="dialog" aria-modal="true">
    <div class="modal-header"><h3>${t('edit')} Profile</h3><button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button></div>
    <form id="profile-form">
      <div class="field"><label for="pe-name">Full name</label><input class="input" id="pe-name" required value="${escapeHtml(p.fullName||'')}"></div>
      <div class="grid grid-2">
        <div class="field"><label for="pe-age">Age</label><input class="input" id="pe-age" type="number" value="${escapeHtml(p.age||'')}"></div>
        <div class="field"><label for="pe-gender">Gender</label>
          <select class="input" id="pe-gender">
            <option value="">Select</option>
            <option ${p.gender==='Female'?'selected':''}>Female</option>
            <option ${p.gender==='Male'?'selected':''}>Male</option>
            <option ${p.gender==='Other'?'selected':''}>Other</option>
          </select>
        </div>
      </div>
      <div class="field"><label for="pe-phone">Phone</label><input class="input" id="pe-phone" value="${escapeHtml(p.phone||'')}"></div>
      <div class="field"><label for="pe-location">Location</label><input class="input" id="pe-location" value="${escapeHtml(p.location||'')}"></div>
      <div class="field"><label for="pe-ec-name">Emergency contact name</label><input class="input" id="pe-ec-name" value="${escapeHtml(p.emergencyContactName||'')}"></div>
      <div class="field"><label for="pe-ec-phone">Emergency contact phone</label><input class="input" id="pe-ec-phone" value="${escapeHtml(p.emergencyContactPhone||'')}"></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">${t('cancel')}</button>
        <button type="submit" class="btn btn-primary">${t('save')}</button>
      </div>
    </form>
  </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.remove(); });
  backdrop.querySelector('#profile-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const fields = {
      fullName: document.getElementById('pe-name').value.trim(),
      age: document.getElementById('pe-age').value,
      gender: document.getElementById('pe-gender').value,
      phone: document.getElementById('pe-phone').value.trim(),
      location: document.getElementById('pe-location').value.trim(),
      emergencyContactName: document.getElementById('pe-ec-name').value.trim(),
      emergencyContactPhone: document.getElementById('pe-ec-phone').value.trim(),
    };
    if(window.BACKEND_MODE === 'supabase'){
      DB.profiles[user.id] = await window.CareConnectServices.profiles.updateProfile(user.id, fields);
    } else {
      Object.assign(p, fields);
    }
    saveDB(); backdrop.remove(); toast(t('saved'),'success'); render();
  });
}

/* =========================================================
   SETTINGS
========================================================= */
let settingsTab = 'language';
function renderSettings(){
  const user = currentUser();
  const settings = getSettings(user.id);
  const a11y = getA11y(user.id);
  const tabs = [
    {k:'language', label:t('language_settings')},
    {k:'accessibility', label:t('accessibility')},
    {k:'notifications', label:'Notifications'},
    {k:'privacy', label:'Privacy'},
    {k:'account', label:'Account'},
  ];
  return `
  <div class="section-heading-row"><h1>${t('settings_title')}</h1></div>
  <div class="tabs" role="tablist">
    ${tabs.map(tb=>`<button class="tab-btn ${settingsTab===tb.k?'active':''}" onclick="settingsTab='${tb.k}';render();">${tb.label}</button>`).join('')}
  </div>
  <div class="card">
    ${settingsTab==='language' ? `
      <h3>${t('language_settings')}</h3>
      <div class="grid grid-2">
      ${LANGS.map(l=>`
        <label class="card" style="display:flex;align-items:center;gap:10px;cursor:pointer;border-color:${settings.language===l.code?'var(--teal-700)':'var(--line)'};">
          <input type="radio" name="settings-lang" value="${l.code}" ${settings.language===l.code?'checked':''} onchange="changeLanguage('${l.code}')" style="width:20px;height:20px;">
          <span style="font-weight:700;">${l.label}</span>
        </label>`).join('')}
      </div>
    ` : ''}
    ${settingsTab==='accessibility' ? `
      <h3>${t('accessibility')}</h3>
      <div class="field"><label for="set-textsize">${t('text_size')}</label>
        <select class="input" id="set-textsize" onchange="updateA11y('textSize', this.value)">
          <option value="standard" ${a11y.textSize==='standard'?'selected':''}>${t('standard')}</option>
          <option value="large" ${a11y.textSize==='large'?'selected':''}>${t('large')}</option>
          <option value="xl" ${a11y.textSize==='xl'?'selected':''}>${t('extra_large')}</option>
        </select>
      </div>
      <div class="field"><label for="set-contrast">${t('contrast')}</label>
        <select class="input" id="set-contrast" onchange="updateA11y('contrast', this.value)">
          <option value="standard" ${a11y.contrast==='standard'?'selected':''}>${t('standard')}</option>
          <option value="high" ${a11y.contrast==='high'?'selected':''}>${t('high_contrast')}</option>
        </select>
      </div>
      <div class="perm-row"><span>${t('reduced_motion')}</span><label class="switch"><input type="checkbox" ${a11y.reducedMotion?'checked':''} onchange="updateA11y('reducedMotion', this.checked)"><span class="slider"></span></label></div>
      <div class="perm-row"><span>${t('text_to_speech')}</span><label class="switch"><input type="checkbox" ${a11y.textToSpeech?'checked':''} onchange="updateA11y('textToSpeech', this.checked)"><span class="slider"></span></label></div>
      <div class="perm-row"><span>Voice assistance</span><label class="switch"><input type="checkbox" ${a11y.voiceAssist?'checked':''} onchange="updateA11y('voiceAssist', this.checked)"><span class="slider"></span></label></div>
    ` : ''}
    ${settingsTab==='notifications' ? `
      <h3>Notification settings</h3>
      <div class="perm-row"><span>Medicine reminders</span><label class="switch"><input type="checkbox" ${settings.notif_medicine?'checked':''} onchange="updateSetting('notif_medicine', this.checked)"><span class="slider"></span></label></div>
      <div class="perm-row"><span>Appointment reminders</span><label class="switch"><input type="checkbox" ${settings.notif_appointment?'checked':''} onchange="updateSetting('notif_appointment', this.checked)"><span class="slider"></span></label></div>
      <div class="perm-row"><span>Follow-up reminders</span><label class="switch"><input type="checkbox" ${settings.notif_followup?'checked':''} onchange="updateSetting('notif_followup', this.checked)"><span class="slider"></span></label></div>
      <div class="perm-row"><span>Caregiver notifications</span><label class="switch"><input type="checkbox" ${settings.notif_caregiver?'checked':''} onchange="updateSetting('notif_caregiver', this.checked)"><span class="slider"></span></label></div>
    ` : ''}
    ${settingsTab==='privacy' ? `
      <h3>Privacy</h3>
      <p class="helper-text">Manage caregiver consent and data-sharing controls in the Consent &amp; Privacy Centre.</p>
      <a class="btn btn-outline" href="#/privacy" data-nav="privacy">Open Privacy Centre</a>
    ` : ''}
    ${settingsTab==='account' ? `
      <h3>Account</h3>
      <div class="field"><label for="acct-email">Email</label><input class="input" id="acct-email" value="${escapeHtml(user.email)}" disabled></div>
      <button class="btn btn-outline" onclick="openChangePasswordModal()">Change password</button>
      <div class="divider"></div>
      <button class="btn btn-outline" onclick="doLogout()">${t('nav_logout')}</button>
      <div class="divider"></div>
      <button class="btn btn-danger" onclick="confirmDeleteAccount()">Delete account</button>
    ` : ''}
  </div>`;
}

async function updateA11y(key, value){
  const user = currentUser();
  if(window.BACKEND_MODE === 'supabase'){
    DB.accessibility_preferences[user.id] = await window.CareConnectServices.profiles.updateAccessibility(user.id, {[key]:value});
  } else {
    DB.accessibility_preferences[user.id] = Object.assign(getA11y(user.id), {[key]:value});
  }
  saveDB(); applyA11y(); render(); toast(t('saved'),'success');
}
async function updateSetting(key, value){
  const user = currentUser();
  if(window.BACKEND_MODE === 'supabase'){
    DB.user_settings[user.id] = await window.CareConnectServices.profiles.updateSettings(user.id, {[key]:value});
  } else {
    DB.user_settings[user.id] = Object.assign(getSettings(user.id), {[key]:value});
  }
  saveDB(); toast(t('saved'),'success');
}

function openChangePasswordModal(){
  const backdrop = document.createElement('div');
  backdrop.className='modal-backdrop';
  backdrop.innerHTML = `
  <div class="modal" role="dialog" aria-modal="true">
    <div class="modal-header"><h3>Change password</h3><button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button></div>
    <form id="pw-form">
      <div class="field"><label for="pw-current">Current password</label><input class="input" id="pw-current" type="password" required></div>
      <div class="field"><label for="pw-new">New password</label><input class="input" id="pw-new" type="password" required minlength="6"></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">${t('cancel')}</button>
        <button type="submit" class="btn btn-primary">${t('save')}</button>
      </div>
    </form>
  </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.remove(); });
  backdrop.querySelector('#pw-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const user = currentUser();
    const cur = document.getElementById('pw-current').value;
    const next = document.getElementById('pw-new').value;
    if(window.BACKEND_MODE === 'supabase'){
      try{
        // Re-verify the current password before changing it (Supabase's
        // updateUser() only requires an active session, not the old
        // password, so we confirm it ourselves first).
        await window.CareConnectServices.auth.signIn(user.email, cur);
        await window.CareConnectServices.auth.updatePassword(next);
        backdrop.remove(); toast('Password updated', 'success');
      }catch(err){
        toast(err.message || 'Current password is incorrect', 'error');
      }
      return;
    }
    if(cur !== user.password){ toast('Current password is incorrect', 'error'); return; }
    user.password = next;
    saveDB(); backdrop.remove(); toast('Password updated', 'success');
  });
}

function confirmDeleteAccount(){
  confirmDialog({title:'Delete account?', message:'This will permanently delete your account and all associated data. This cannot be undone.', confirmLabel:'Delete account', danger:true}, async ()=>{
    const user = currentUser();

    if(window.BACKEND_MODE === 'supabase'){
      // Deleting the underlying Supabase Auth user requires the
      // service-role key, which must never run in the browser — see
      // src/services/auth.js → deleteOwnAccount() and README.md →
      // "Deleting an account" for the Edge Function you'd deploy to do
      // this for real. For now, sign out and say so plainly rather than
      // claiming a deletion that didn't happen.
      await window.CareConnectServices.auth.signOut();
      DB = emptyDB(); clearSession();
      toast('Signed out. Full account deletion needs a server-side step — see README.md → "Deleting an account".', 'error');
      navigate('landing');
      return;
    }

    DB.users = DB.users.filter(u=>u.id!==user.id);
    delete DB.profiles[user.id]; delete DB.accessibility_preferences[user.id]; delete DB.user_settings[user.id];
    DB.medications = DB.medications.filter(m=>m.userId!==user.id);
    DB.appointments = DB.appointments.filter(a=>a.userId!==user.id);
    DB.post_discharge_plans = DB.post_discharge_plans.filter(p=>p.userId!==user.id);
    DB.health_records = DB.health_records.filter(r=>r.userId!==user.id);
    DB.notifications = DB.notifications.filter(n=>n.userId!==user.id);
    DB.caregiver_connections = DB.caregiver_connections.filter(c=>c.patientId!==user.id && c.caregiverId!==user.id);
    saveDB(); clearSession();
    toast('Account deleted', 'success');
    navigate('landing');
  });
}

/* =========================================================
   CAREGIVER DASHBOARD
========================================================= */
function renderCaregiverDashboard(){
  const user = currentUser();
  const conns = patientConnectionsForCaregiver(user.id).filter(c=>c.status==='accepted');

  return `
  <div class="dash-greeting">
    <h1>${t(greetingKey())}, ${escapeHtml(getProfile(user.id).fullName||user.name)}</h1>
    <p class="helper-text">Here's what your connected patients have shared with you.</p>
  </div>
  ${conns.length ? conns.map(c=>renderCaregiverPatientBlock(c)).join('') : `
    <div class="state-block"><div class="state-icon">👨‍👩‍👧</div><h3>No patients connected yet</h3><p>Ask a patient to invite you as their caregiver using this account's email: <strong>${escapeHtml(user.email)}</strong></p></div>
  `}`;
}

function renderCaregiverPatientBlock(conn){
  const patient = DB.users.find(u=>u.id===conn.patientId);
  const profile = getProfile(conn.patientId);
  const perms = DB.caregiver_permissions[conn.id] || {};

  return `
  <div class="card" style="margin-bottom:24px;">
    <div class="card-title-row">
      <h2 style="margin-bottom:0;">${escapeHtml(profile.fullName||patient.name)} <span class="helper-text" style="font-family:var(--font-body);font-size:0.85rem;">(${escapeHtml(conn.relationship)})</span></h2>
      <button class="btn btn-ghost btn-sm" onclick="viewPermissionCentre('${conn.id}')">Permission Centre</button>
    </div>

    ${perms.appointments ? `
      <h4 style="margin-top:16px;">📅 ${t('upcoming')} Appointments</h4>
      ${(()=>{ const appts = userAppointments(conn.patientId).filter(a=>a.status==='upcoming'); return appts.length ? appts.map(a=>`
        <div class="list-row"><div class="list-row-main"><span class="list-row-title">${escapeHtml(a.provider)}</span><span class="list-row-sub">${fmtDate(a.date)} · ${fmtTime(a.time)} · ${escapeHtml(a.type)}</span></div></div>`).join('')
        : `<p class="helper-text">${t('no_upcoming_appointments')}</p>`; })()}
    ` : `<p class="helper-text">📅 Appointments — <span class="badge badge-muted">Not shared</span></p>`}

    ${perms.medicines ? `
      <h4 style="margin-top:16px;">💊 Medicine reminders</h4>
      ${(()=>{ const meds = userMedications(conn.patientId).filter(m=>m.active); return meds.length ? meds.map(m=>`
        <div class="list-row"><div class="list-row-main"><span class="list-row-title">${escapeHtml(m.name)}</span><span class="list-row-sub">${escapeHtml(m.dosage)} · ${(m.times||[]).map(fmtTime).join(', ')}</span></div></div>`).join('')
        : `<p class="helper-text">${t('no_medicines')}</p>`; })()}
    ` : `<p class="helper-text">💊 Medicines — <span class="badge badge-muted">Not shared</span></p>`}

    ${perms.postDischarge ? `
      <h4 style="margin-top:16px;">🩺 Post-discharge schedule</h4>
      ${(()=>{ const plans = userPlans(conn.patientId); return plans.length ? plans.map(p=>`
        <div class="list-row"><div class="list-row-main"><span class="list-row-title">${escapeHtml(p.hospital)}</span><span class="list-row-sub">Follow-up: ${fmtDate(p.followUpDate)}</span></div></div>`).join('')
        : `<p class="helper-text">No plan shared.</p>`; })()}
    ` : `<p class="helper-text">🩺 Post-discharge — <span class="badge badge-muted">Not shared</span></p>`}

    ${perms.healthRecords ? `
      <h4 style="margin-top:16px;">📋 Shared health records</h4>
      ${(()=>{ const recs = userRecords(conn.patientId); return recs.length ? recs.map(r=>`
        <div class="list-row"><div class="list-row-main"><span class="list-row-title">${escapeHtml(r.name)}</span><span class="list-row-sub">${escapeHtml(r.type)} · ${fmtDate(r.date)}</span></div></div>`).join('')
        : `<p class="helper-text">No records shared.</p>`; })()}
    ` : `<p class="helper-text">📋 Health records — <span class="badge badge-muted">Not shared</span></p>`}

    ${perms.notifications ? `
      <h4 style="margin-top:16px;">🔔 Recent notifications</h4>
      ${(()=>{ const notes = userNotifications(conn.patientId).slice(0,4); return notes.length ? notes.map(n=>`
        <div class="list-row"><div class="list-row-main"><span class="list-row-title">${escapeHtml(n.title)}</span><span class="list-row-sub">${escapeHtml(n.message)}</span></div></div>`).join('')
        : `<p class="helper-text">No notifications.</p>`; })()}
    ` : `<p class="helper-text">🔔 Notifications — <span class="badge badge-muted">Not shared</span></p>`}
  </div>`;
}

function viewPermissionCentre(connId){
  const conn = DB.caregiver_connections.find(c=>c.id===connId);
  const perms = DB.caregiver_permissions[connId] || {};
  const patient = DB.users.find(u=>u.id===conn.patientId);
  const backdrop = document.createElement('div');
  backdrop.className='modal-backdrop';
  backdrop.innerHTML = `
  <div class="modal" role="dialog" aria-modal="true">
    <div class="modal-header"><h3>Permission Centre</h3><button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button></div>
    <p class="helper-text">Patient: <strong>${escapeHtml(getProfile(conn.patientId).fullName||patient.name)}</strong></p>
    ${PERM_KEYS.map(k=>`<div class="perm-row"><span>${PERM_LABELS[k]}</span><span class="badge ${perms[k]?'badge-success':'badge-muted'}">${perms[k]?'✓ Shared':'✕ Not Shared'}</span></div>`).join('')}
    <p class="helper-text" style="margin-top:14px;">Only the patient can change these permissions from their Consent &amp; Privacy Centre.</p>
  </div>`;
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) backdrop.remove(); });
}

