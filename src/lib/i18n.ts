export type Language = 'en' | 'ta';

export interface Translations {
  appName: string;
  tagline: string;
  nav: {
    home: string;
    tournaments: string;
    myMatches: string;
    teams: string;
    leaderboard: string;
    rules: string;
    privacy: string;
    profile: string;
    organizer: string;
    moderator: string;
    admin: string;
    login: string;
    signup: string;
    logout: string;
    disputes: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    exploreBtn: string;
    quickPlayBtn: string;
    statTournaments: string;
    statFairPlay: string;
    statServerTick: string;
  };
  game: {
    reactionGridDuel: string;
    gameRulesTitle: string;
    rule1: string;
    rule2: string;
    rule3: string;
    rule4: string;
    anonymousModeNotice: string;
    round: string;
    score: string;
    opponentScore: string;
    latency: string;
    reactionTime: string;
    waitingForOpponent: string;
    readyPrompt: string;
    getReady: string;
    matchEnded: string;
    winner: string;
    forfeitNotice: string;
    antiCheatActive: string;
  };
  tournament: {
    format: string;
    entry: string;
    slots: string;
    status: string;
    singleElimination: string;
    roundRobin: string;
    registerNow: string;
    viewBracket: string;
    lobby: string;
    schedule: string;
    gracePeriodRemaining: string;
  };
  roles: {
    player: string;
    organizer: string;
    moderator: string;
    admin: string;
  };
  common: {
    demoData: string;
    anonymousAlias: string;
    verified: string;
    riskScore: string;
    status: string;
    actions: string;
    refresh: string;
    save: string;
    cancel: string;
    submit: string;
    back: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'NEXORA ARENA',
    tagline: 'Browser-Based Esports Tournament Platform',
    nav: {
      home: 'Arena Home',
      tournaments: 'Tournaments',
      myMatches: 'My Matches',
      teams: 'Teams',
      leaderboard: 'Leaderboard',
      rules: 'Fair-Play Rules',
      privacy: 'Privacy & Consent',
      profile: 'Player Profile',
      organizer: 'Organizer Hub',
      moderator: 'Mod Review',
      admin: 'Admin Center',
      login: 'Sign In',
      signup: 'Register',
      logout: 'Sign Out',
      disputes: 'Disputes & Appeals',
    },
    hero: {
      badge: 'Zero Client Trust • Server-Authoritative Esports',
      title: 'COMPETE ANONYMOUSLY. PROVE YOUR REACTION.',
      subtitle:
        'Join automated browser tournaments, battle in our original Reaction Grid Duel, and win through unadulterated human skill monitored by multi-tier anti-cheat and explainable AI.',
      exploreBtn: 'Explore Tournaments',
      quickPlayBtn: 'Launch Reaction Grid Duel',
      statTournaments: 'Automated Brackets',
      statFairPlay: 'Zero-Guess AI Audited',
      statServerTick: '100% Server Authoritative',
    },
    game: {
      reactionGridDuel: 'Reaction Grid Duel',
      gameRulesTitle: 'Reaction Grid Duel - Official Rules',
      rule1: '5 rounds of synchronized visual targets across a 4x4 grid.',
      rule2: 'Points awarded for speed and accuracy. Faster valid hits gain up to 1000 points.',
      rule3: 'Client sends raw action telemetry; server validates timestamps, round ID, and sequence.',
      rule4: 'Impossible reaction times (<110ms) or out-of-order clicks immediately trigger telemetry flags.',
      anonymousModeNotice: 'Identities are masked during matches (e.g. Player-4821) to eliminate targeted bias and intimidation.',
      round: 'Round',
      score: 'Your Score',
      opponentScore: 'Opponent Score',
      latency: 'RTT Sync',
      reactionTime: 'Reaction Time',
      waitingForOpponent: 'Waiting for opponent to connect...',
      readyPrompt: 'Click READY when prepared to initiate countdown.',
      getReady: 'GET READY!',
      matchEnded: 'Match Concluded',
      winner: 'Victor',
      forfeitNotice: 'Opponent disconnected or exceeded grace period. Forfeit victory awarded.',
      antiCheatActive: 'Anti-Cheat Guard Active',
    },
    tournament: {
      format: 'Format',
      entry: 'Entry Type',
      slots: 'Capacity',
      status: 'Status',
      singleElimination: 'Single Elimination',
      roundRobin: 'Round Robin',
      registerNow: 'Register Tournament',
      viewBracket: 'Interactive Bracket',
      lobby: 'Pre-Match Anonymous Lobby',
      schedule: 'Match Schedule',
      gracePeriodRemaining: 'Grace Period Window',
    },
    roles: {
      player: 'Player',
      organizer: 'Tournament Organizer',
      moderator: 'Anti-Cheat Moderator',
      admin: 'System Administrator',
    },
    common: {
      demoData: 'DEMO DATA',
      anonymousAlias: 'Anonymous Alias',
      verified: 'Server Verified',
      riskScore: 'Risk Score',
      status: 'Status',
      actions: 'Actions',
      refresh: 'Refresh',
      save: 'Save',
      cancel: 'Cancel',
      submit: 'Submit',
      back: 'Back',
    },
  },
  ta: {
    appName: 'நெக்ஸோரா அரீனா',
    tagline: 'இணைய உலாவி மின்-விளையாட்டு போட்டி தளம்',
    nav: {
      home: 'முகப்பு',
      tournaments: 'போட்டிகள்',
      myMatches: 'என் ஆட்டங்கள்',
      teams: 'அணிகள்',
      leaderboard: 'தரவரிசை',
      rules: 'நேர்மை விதிகள்',
      privacy: 'தனியுரிமை & ஒப்புதல்',
      profile: 'வீரர் விவரக்குறிப்பு',
      organizer: 'ஒருங்கிணைப்பாளர்',
      moderator: 'மதிப்பாய்வு',
      admin: 'நிர்வாக மையம்',
      login: 'உள்நுழைக',
      signup: 'பதிவு செய்க',
      logout: 'வெளியேறுக',
      disputes: 'முறையீடுகள்',
    },
    hero: {
      badge: 'சர்வர் அங்கீகாரம் • வெளிப்படையான மின்-விளையாட்டு',
      title: 'பெயரற்ற போட்டி. உங்கள் எதிர்வினைத் திறனை நிரூபியுங்கள்.',
      subtitle:
        'தானியங்கி இணைய உலாவி போட்டிகளில் இணையுங்கள், எங்கள் அசல் Reaction Grid Duel விளையாட்டில் மோதி வெல்லுங்கள். ஏமாற்று தடுப்பு மற்றும் வெளிப்படையான செயற்கை நுண்ணறிவு மூலம் கண்காணிக்கப்படுகிறது.',
      exploreBtn: 'போட்டிகளை காண்க',
      quickPlayBtn: 'Reaction Grid Duel விளையாடு',
      statTournaments: 'தானியங்கி அடைப்புக்குறிகள்',
      statFairPlay: 'ஏமாற்று இல்லாத பாதுகாப்பு',
      statServerTick: 'முழுமையான சர்வர் கட்டுப்பாடு',
    },
    game: {
      reactionGridDuel: 'ரியாக்ஷன் கிரிட் டூயல்',
      gameRulesTitle: 'Reaction Grid Duel - அதிகாரப்பூர்வ விதிகள்',
      rule1: '4x4 கட்டத்தில் 5 சுற்றுகள் கொண்ட இலக்கு வரிசை.',
      rule2: 'வேகம் மற்றும் துல்லியத்திற்கு ஏற்ப புள்ளிகள். வேகமான சரியான கிளிக்குகளுக்கு 1000 புள்ளிகள் வரை.',
      rule3: 'கிளையண்ட் வெறும் செயல்களை மட்டுமே அனுப்பும்; சர்வர் நேர முத்திரை மற்றும் வரிசையை சரிபார்க்கும்.',
      rule4: 'சாத்தியமற்ற எதிர்வினை நேரங்கள் (<110ms) உடனடியாக எச்சரிக்கை கொடியை உருவாக்கும்.',
      anonymousModeNotice: 'பயமுறுத்தல் மற்றும் சார்புகளைத் தடுக்க ஆட்டத்தின் போது அடையாளங்கள் மறைக்கப்படுகின்றன (எ.கா. Player-4821).',
      round: 'சுற்று',
      score: 'உங்கள் மதிப்பெண்',
      opponentScore: 'எதிராளி மதிப்பெண்',
      latency: 'சர்வர் தாமதம்',
      reactionTime: 'எதிர்வினை நேரம்',
      waitingForOpponent: 'எதிராளி இணையும் வரை காத்திருக்கிறது...',
      readyPrompt: 'தயாராக இருக்கும்போது READY என்பதைக் கிளிக் செய்யவும்.',
      getReady: 'தயாராக இருங்கள்!',
      matchEnded: 'போட்டி முடிந்தது',
      winner: 'வெற்றியாளர்',
      forfeitNotice: 'எதிராளி வெளியேறியதால் அல்லது நேரம் முடிந்ததால் உங்களுக்கு வெற்றி வழங்கப்பட்டது.',
      antiCheatActive: 'ஏமாற்று தடுப்புக் காவலர் செயல்படுகிறது',
    },
    tournament: {
      format: 'வடிவம்',
      entry: 'நுழைவு வகை',
      slots: 'வீரர் கொள்ளளவு',
      status: 'நிலை',
      singleElimination: 'ஒற்றை வெளியேற்றம் (Single Elimination)',
      roundRobin: 'ரவுண்ட் ராபின் (Round Robin)',
      registerNow: 'போட்டியில் பதிவு செய்',
      viewBracket: 'போட்டி அடைப்புக்குறி',
      lobby: 'பெயரற்ற முன்-போட்டி காத்திருப்புக்கூடம்',
      schedule: 'போட்டி அட்டவணை',
      gracePeriodRemaining: 'அனுமதிக்கப்பட்ட சலுகை நேரம்',
    },
    roles: {
      player: 'வீரர்',
      organizer: 'போட்டி ஒருங்கிணைப்பாளர்',
      moderator: 'மதிப்பாய்வாளர்',
      admin: 'முதன்மை நிர்வாகி',
    },
    common: {
      demoData: 'மாதிரி தரவு (Demo)',
      anonymousAlias: 'பெயரற்ற அடையாளம்',
      verified: 'சர்வர் சரிபார்க்கப்பட்டது',
      riskScore: 'ஆபத்து மதிப்பீடு',
      status: 'நிலை',
      actions: 'செயல்கள்',
      refresh: 'புதுப்பி',
      save: 'சேமி',
      cancel: 'ரத்து செய்',
      submit: 'சமர்ப்பி',
      back: 'பின்செல்',
    },
  },
};
