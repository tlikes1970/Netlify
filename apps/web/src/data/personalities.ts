/**
 * Process: Personality Text System
 * Purpose: Provides personality-driven text variants for app commentary (empty states, errors, confirmations, marquee, etc.)
 * Data Source: Static data with 8 personalities × 20 keys × 3 variants each
 * Update Path: Edit this file to add/modify personalities or text variants
 * Dependencies: Used by getPersonalityText() helper, consumed by UI components
 */

// ============================================================================
// TYPES
// ============================================================================

export type PersonalityName = 
  | 'Valley Girl'
  | 'Detective Noir'
  | 'Sports Announcer'
  | 'Zen'
  | 'Surfer'
  | 'Medieval Bard'
  | 'Grumpy Old Man'
  | 'Fantasy Wizard';

export type TextKey = 
  | 'welcome'
  | 'empty'
  | 'add'
  | 'sarcasm'
  | 'emptyWatching'
  | 'emptyWishlist'
  | 'emptyWatched'
  | 'emptyUpNext'
  | 'itemAdded'
  | 'itemRemoved'
  | 'searchEmpty'
  | 'searchLoading'
  | 'errorGeneric'
  | 'errorNetwork'
  | 'errorNotFound'
  | 'successSave'
  | 'successImport'
  | 'successExport'
  | 'marquee1'
  | 'marquee2'
  | 'marquee3'
  | 'marquee4'
  | 'marquee5';

export type PersonalityTexts = {
  [key in TextKey]: string[];
};

export type PersonalityData = {
  [name in PersonalityName]: PersonalityTexts;
};

// ============================================================================
// PERSONALITY LIST (for UI)
// ============================================================================

export const PERSONALITY_LIST: Array<{
  name: PersonalityName;
  description: string;
}> = [
  { name: 'Valley Girl', description: 'Bubbly and enthusiastic' },
  { name: 'Detective Noir', description: 'Hard-boiled and cynical' },
  { name: 'Sports Announcer', description: 'Energetic and play-by-play' },
  { name: 'Zen', description: 'Calm and mindful' },
  { name: 'Surfer', description: 'Laid-back and chill' },
  { name: 'Medieval Bard', description: 'Theatrical and poetic' },
  { name: 'Grumpy Old Man', description: 'Blunt and cantankerous' },
  { name: 'Fantasy Wizard', description: 'Mystical and dramatic' },
];

export const DEFAULT_PERSONALITY: PersonalityName = 'Zen';

// ============================================================================
// PERSONALITY TEXT DATA
// ============================================================================

export const PERSONALITIES: PersonalityData = {
  // -------------------------------------------------------------------------
  // VALLEY GIRL - Bubbly, enthusiastic, uses "like" and "totally"
  // -------------------------------------------------------------------------
  'Valley Girl': {
    welcome: [
      "Oh my God, {username}! You're, like, totally back!",
      "Hiii {username}! So happy you're here!",
      "OMG {username}! Finally! I was, like, waiting!",
    ],
    empty: [
      "This is, like, so empty right now.",
      "Umm, there's literally nothing here.",
      "It's giving... empty vibes.",
    ],
    add: [
      "You should, like, totally add something!",
      "Go ahead, add something cute!",
      "Don't be shy! Add something!",
    ],
    sarcasm: [
      "Oh, like, sure.",
      "Yeah, totally.",
      "As if!",
    ],
    emptyWatching: [
      "Your watch list is, like, totally waiting for you!",
      "Nothing here yet! So sad!",
      "Like, you're not watching anything? Wild!",
    ],
    emptyWishlist: [
      "Your wishlist is, like, so lonely!",
      "No wishes yet? That's, like, tragic!",
      "Add something you want! It'll be so fun!",
    ],
    emptyWatched: [
      "You haven't watched anything? That's, like, wild!",
      "This is totally blank! Time to binge!",
      "Nothing watched yet? We need to fix that!",
    ],
    emptyUpNext: [
      "Nothing up next? Time for a binge sesh!",
      "Your queue is, like, totally empty!",
      "No shows lined up? Let's change that!",
    ],
    itemAdded: [
      "Yay! So added!",
      "Done! That's, like, on your list now!",
      "Totally added! You're gonna love it!",
    ],
    itemRemoved: [
      "Bye-bye! Totally removed!",
      "Gone! Like it was never there!",
      "Removed! Out of sight, out of mind!",
    ],
    searchEmpty: [
      "Ugh, like, nothing? Try again!",
      "No results! That's so annoying!",
      "Can't find anything! Try something else!",
    ],
    searchLoading: [
      "Searching... so exciting!",
      "Looking, like, everywhere!",
      "One sec! Finding stuff!",
    ],
    errorGeneric: [
      "Ugh, that's, like, so annoying. Try again?",
      "Something broke! Not cute!",
      "Oops! That totally didn't work!",
    ],
    errorNetwork: [
      "The wifi is being, like, totally rude right now.",
      "No connection? Ugh, the worst!",
      "Internet's being dramatic. Try again!",
    ],
    errorNotFound: [
      "That's, like, nowhere to be found!",
      "Can't find it! It's totally gone!",
      "Not there! Maybe it never was?",
    ],
    successSave: [
      "Saved! So perf!",
      "Done! Totally saved!",
      "Yay! All saved!",
    ],
    successImport: [
      "Imported! You're, like, all set!",
      "Everything's in! So exciting!",
      "Import done! Let's gooo!",
    ],
    successExport: [
      "Exported! Go you!",
      "All packed up and ready!",
      "Export done! You're amazing!",
    ],
    marquee1: [
      "Find something, like, totally amazing!",
      "Discover your next obsession!",
      "So many shows! So little time!",
    ],
    marquee2: [
      "Keep track of your faves!",
      "Your shows, your way!",
      "Everything you love, like, right here!",
    ],
    marquee3: [
      "New eps are, like, everything!",
      "Never miss a new episode!",
      "Stay updated on all the things!",
    ],
    marquee4: [
      "Discover something adorbs!",
      "Find your next binge!",
      "Something new is waiting!",
    ],
    marquee5: [
      "Your streaming BFF!",
      "The cutest way to track shows!",
      "Like, totally your show tracker!",
    ],
  },

  // -------------------------------------------------------------------------
  // DETECTIVE NOIR - Hard-boiled, cynical, film noir vibes
  // -------------------------------------------------------------------------
  'Detective Noir': {
    welcome: [
      "Well, well, well... {username}. Back on the case.",
      "{username}. I had a feeling you'd show.",
      "Look who walked in. {username}. This ought to be good.",
    ],
    empty: [
      "Nothing here but shadows and regret.",
      "Empty. Like a broken promise.",
      "The void stares back. As usual.",
    ],
    add: [
      "Every list needs a lead. Add one.",
      "Got something to add? Make it count.",
      "Put something on the board. We need a break.",
    ],
    sarcasm: [
      "Sure. That'll solve everything.",
      "Right. Because that always works.",
      "Oh, perfect. Just perfect.",
    ],
    emptyWatching: [
      "The watch list is cold. Dead end.",
      "Nothing on the docket. Silence before the storm.",
      "Empty case file. Waiting for a lead.",
    ],
    emptyWishlist: [
      "Wishes. Everyone's got 'em. None here.",
      "The wishlist is as empty as my coffee cup.",
      "No wishes on file. Keep dreaming, kid.",
    ],
    emptyWatched: [
      "A blank slate. Like a crime scene before the chalk.",
      "Nothing in the record. Time to make history.",
      "The watched pile's empty. Virgin territory.",
    ],
    emptyUpNext: [
      "The docket's empty. Suspiciously quiet.",
      "Nothing queued. Calm before the storm.",
      "No leads on what's next. Keep digging.",
    ],
    itemAdded: [
      "Filed away. Case noted.",
      "Added to the dossier.",
      "It's on the board now.",
    ],
    itemRemoved: [
      "Erased. Like it never happened.",
      "Struck from the record.",
      "Gone. Some things are better forgotten.",
    ],
    searchEmpty: [
      "Trail's gone cold. Try another angle.",
      "Nothing. The case just got harder.",
      "Dead end. Time to rethink the approach.",
    ],
    searchLoading: [
      "Following the lead...",
      "Working the case...",
      "Checking the usual haunts...",
    ],
    errorGeneric: [
      "Something went sideways. It always does.",
      "Hit a snag. Nothing new in this business.",
      "The system choked. Figures.",
    ],
    errorNetwork: [
      "The connection's cut. Someone didn't want us finding out.",
      "Lost the signal. In this line of work, that's suspicious.",
      "Network's down. Could be coincidence. I don't believe in coincidences.",
    ],
    errorNotFound: [
      "Vanished. No trace. Typical.",
      "It's gone. Like it was never there.",
      "Missing. In this town, nothing stays found.",
    ],
    successSave: [
      "Evidence secured.",
      "Locked in the safe.",
      "On the record. Permanently.",
    ],
    successImport: [
      "Dossier received.",
      "Files transferred. The plot thickens.",
      "Import complete. New leads.",
    ],
    successExport: [
      "Files handed off. Don't ask where.",
      "Exported. Out of my hands now.",
      "Package delivered. Someone else's problem.",
    ],
    marquee1: [
      "Every show tells a story.",
      "The truth is out there. In your queue.",
      "Another night, another case to watch.",
    ],
    marquee2: [
      "Keep your files in order.",
      "A good detective keeps notes.",
      "Track every lead. Miss nothing.",
    ],
    marquee3: [
      "New episodes. New leads.",
      "Fresh intel just dropped.",
      "The case continues. New episode tonight.",
    ],
    marquee4: [
      "Another mystery to crack.",
      "Something new in the files.",
      "Discovery waits for no one.",
    ],
    marquee5: [
      "Where cases come to rest.",
      "Your headquarters for the hunt.",
      "The office that never sleeps.",
    ],
  },

  // -------------------------------------------------------------------------
  // SPORTS ANNOUNCER - Energetic, play-by-play, sports metaphors
  // -------------------------------------------------------------------------
  'Sports Announcer': {
    welcome: [
      "AND WE'RE BACK with {username} in the game!",
      "The crowd goes wild! {username} has entered the arena!",
      "Ladies and gentlemen, {username} is BACK IN ACTION!",
    ],
    empty: [
      "Empty bench! Time to draft some picks!",
      "The roster's looking bare, folks!",
      "No players on the field! Let's change that!",
    ],
    add: [
      "Step up to the plate and make a selection!",
      "Time to make a power play! Add something!",
      "Draft your next pick!",
    ],
    sarcasm: [
      "Oh, bold strategy there!",
      "Interesting play call!",
      "Well, that's certainly a choice!",
    ],
    emptyWatching: [
      "No active plays! Let's get something on the field!",
      "The watching roster is EMPTY! Time to recruit!",
      "Bench is clear! Get some shows in the game!",
    ],
    emptyWishlist: [
      "The wishlist roster is WIDE OPEN, folks!",
      "No prospects on the wishlist! Scout some shows!",
      "Empty draft board! Time to make some picks!",
    ],
    emptyWatched: [
      "Zero in the stats column! Time to rack 'em up!",
      "No completions on record! Let's change that!",
      "The trophy case is empty! Start your winning streak!",
    ],
    emptyUpNext: [
      "The lineup is clear! Ready for the next play!",
      "No shows warming up! Queue up your next move!",
      "On-deck circle is empty! Who's batting next?",
    ],
    itemAdded: [
      "AND IT'S IN! Great addition to the roster!",
      "SCORE! That's on the board!",
      "What a pickup! Added to the team!",
    ],
    itemRemoved: [
      "Off the board! That's a trade, folks!",
      "Released from the roster!",
      "Cleared from the lineup! Making room for new talent!",
    ],
    searchEmpty: [
      "No hits on that search! Swing again!",
      "Strike! Nothing found! Step back up to the plate!",
      "That's a miss! Try another pitch!",
    ],
    searchLoading: [
      "Scanning the field...",
      "Reviewing the playbook...",
      "Checking the stats...",
    ],
    errorGeneric: [
      "Fumble! Let's try that play again!",
      "Technical foul on the system! Reset and retry!",
      "Flag on the play! Something went wrong!",
    ],
    errorNetwork: [
      "Technical difficulties on the field!",
      "We've lost the broadcast signal, folks!",
      "Connection dropped! Weather delay!",
    ],
    errorNotFound: [
      "That one's out of bounds!",
      "Can't find it! It's left the stadium!",
      "That play's been called back! Not found!",
    ],
    successSave: [
      "SAVED! Right into the record books!",
      "That's a keeper! Saved!",
      "In the vault! Great save!",
    ],
    successImport: [
      "Roster imported! Looking strong!",
      "Trade complete! New players on board!",
      "Import successful! The team's loaded!",
    ],
    successExport: [
      "Stats exported! Ready for analysis!",
      "Playbook sent! Good luck out there!",
      "Export complete! Take that data and run!",
    ],
    marquee1: [
      "Find your next MVP!",
      "Draft your entertainment lineup!",
      "The big game starts here!",
    ],
    marquee2: [
      "Track your winning streak!",
      "Keep score of everything!",
      "Your personal stats tracker!",
    ],
    marquee3: [
      "New episodes hitting the field!",
      "Fresh content in the lineup!",
      "Tonight's matchup is looking good!",
    ],
    marquee4: [
      "Scout your next binge!",
      "Discover tomorrow's champions!",
      "The draft board awaits!",
    ],
    marquee5: [
      "Your entertainment playbook!",
      "Championship-level tracking!",
      "Where winners keep score!",
    ],
  },

  // -------------------------------------------------------------------------
  // ZEN - Calm, mindful, peaceful
  // -------------------------------------------------------------------------
  'Zen': {
    welcome: [
      "Welcome, {username}. The present moment awaits.",
      "Greetings, {username}. Find peace in what you seek.",
      "{username}. Breathe. You have arrived.",
    ],
    empty: [
      "Emptiness holds infinite possibility.",
      "In nothing, everything waits.",
      "The space is clear. Potential abounds.",
    ],
    add: [
      "When ready, choose what speaks to you.",
      "Add what brings you joy.",
      "Select mindfully. There is no rush.",
    ],
    sarcasm: [
      "All paths have meaning.",
      "Every choice teaches.",
      "Interesting. Reflect on this.",
    ],
    emptyWatching: [
      "A clear path. Nothing currently held.",
      "The watching space rests in stillness.",
      "No active journeys. When ready, begin.",
    ],
    emptyWishlist: [
      "The wishlist rests in stillness.",
      "Desires not yet named. That is okay.",
      "An empty vessel awaits your intentions.",
    ],
    emptyWatched: [
      "No journeys completed yet. Each begins with one step.",
      "The watched space is clear. Memories will come.",
      "A blank canvas. Your story will fill it.",
    ],
    emptyUpNext: [
      "The way forward is unwritten.",
      "Nothing queued. Stillness before motion.",
      "The next step will reveal itself.",
    ],
    itemAdded: [
      "Acknowledged. It joins your collection.",
      "Added with intention.",
      "Received. A new possibility.",
    ],
    itemRemoved: [
      "Released. Let it go freely.",
      "Removed. Space is restored.",
      "Let go. It served its purpose.",
    ],
    searchEmpty: [
      "Not all paths lead somewhere. Seek another.",
      "Nothing found. The journey continues.",
      "Empty results. A redirection, perhaps.",
    ],
    searchLoading: [
      "Searching with patience...",
      "Seeking in stillness...",
      "The answer approaches...",
    ],
    errorGeneric: [
      "A ripple in the stream. It will pass.",
      "An obstacle. Pause and try again.",
      "Something shifted. Breathe and retry.",
    ],
    errorNetwork: [
      "The connection wavers. Breathe and try again.",
      "The path is blocked. It will clear.",
      "A disruption. Patience will resolve it.",
    ],
    errorNotFound: [
      "What is sought is not here. Perhaps elsewhere.",
      "Not found. Accept and move forward.",
      "Gone from this place. Look anew.",
    ],
    successSave: [
      "Preserved in tranquility.",
      "Saved. Safe in stillness.",
      "Secured. Rest easy.",
    ],
    successImport: [
      "Received with gratitude.",
      "Imported. New beginnings.",
      "Welcomed into the fold.",
    ],
    successExport: [
      "Shared with the world.",
      "Released outward. May it serve.",
      "Exported. A gift given.",
    ],
    marquee1: [
      "Discover at your own pace.",
      "Find what resonates.",
      "The journey is the destination.",
    ],
    marquee2: [
      "Mindfully track your journey.",
      "Keep what matters close.",
      "Organize with intention.",
    ],
    marquee3: [
      "New stories arrive like seasons.",
      "Fresh content awaits discovery.",
      "Each episode, a new moment.",
    ],
    marquee4: [
      "Find what resonates.",
      "Explore without expectation.",
      "Discovery brings growth.",
    ],
    marquee5: [
      "A peaceful space for entertainment.",
      "Where entertainment meets mindfulness.",
      "Your calm corner of streaming.",
    ],
  },

  // -------------------------------------------------------------------------
  // SURFER - Laid-back, chill, beach vibes
  // -------------------------------------------------------------------------
  'Surfer': {
    welcome: [
      "Yo {username}! Stoked you're back, bro!",
      "Duuude, {username}! Welcome back to the lineup!",
      "'Sup {username}! Ready to catch some waves?",
    ],
    empty: [
      "Pretty mellow over here, dude.",
      "Nothing but calm waters.",
      "Empty, bro. Like a flat day at the beach.",
    ],
    add: [
      "Catch a wave, add something rad!",
      "Paddle in and grab something, dude!",
      "Add something gnarly to your board!",
    ],
    sarcasm: [
      "Sure, bro. Whatever floats your boat.",
      "Yeah, man. That's... something.",
      "Whoa. Okay then, dude.",
    ],
    emptyWatching: [
      "No shows in the lineup yet, bro.",
      "The watching waters are calm.",
      "Nothing on the board. Time to paddle out!",
    ],
    emptyWishlist: [
      "Wishlist's looking chill. Too chill maybe.",
      "No wishes on the horizon, dude.",
      "Empty lineup. Dream up some shows!",
    ],
    emptyWatched: [
      "Haven't caught any waves here yet, dude.",
      "No rides logged. Get out there!",
      "Clean slate, bro. Make some memories!",
    ],
    emptyUpNext: [
      "Flat seas ahead. Paddle out when ready.",
      "Nothing on deck, dude. Chill for now.",
      "Next wave's coming. Just wait for it.",
    ],
    itemAdded: [
      "Sick! That's on the board now!",
      "Gnarly! Added to your lineup!",
      "Rad pick, bro! It's in!",
    ],
    itemRemoved: [
      "Wiped out. It's gone, bro.",
      "Washed away, dude.",
      "Off the board! No worries!",
    ],
    searchEmpty: [
      "No waves on that one. Try another break.",
      "Nothing out there, bro. Paddle elsewhere!",
      "Flat, dude. Different search maybe?",
    ],
    searchLoading: [
      "Scanning the horizon...",
      "Looking for sets, bro...",
      "Checking the lineup...",
    ],
    errorGeneric: [
      "Bummer, dude. Give it another go.",
      "Wipeout! Try again, bro.",
      "That didn't work. No stress, retry!",
    ],
    errorNetwork: [
      "Signal's wiped out, bro.",
      "Lost the connection, dude. Gnarly.",
      "Network's gone surfing without us.",
    ],
    errorNotFound: [
      "That one drifted away, man.",
      "Can't find it. Like a lost board.",
      "Gone with the tide, bro.",
    ],
    successSave: [
      "Locked in! Gnarly!",
      "Saved, dude! All good!",
      "Stashed safely, bro!",
    ],
    successImport: [
      "Imported! Righteous!",
      "Brought it all in, dude!",
      "Import's in! Sick!",
    ],
    successExport: [
      "Sent out to sea, bro!",
      "Exported! Catch ya later!",
      "Off it goes! Cowabunga!",
    ],
    marquee1: [
      "Catch your next binge wave!",
      "Find your perfect ride!",
      "Endless waves of content!",
    ],
    marquee2: [
      "Ride the entertainment current!",
      "Track your sessions, bro!",
      "Your surf log for shows!",
    ],
    marquee3: [
      "New episodes rolling in!",
      "Fresh sets on the horizon!",
      "The swell's looking good!",
    ],
    marquee4: [
      "Discover some gnarly content!",
      "Scout the next big wave!",
      "Something rad awaits!",
    ],
    marquee5: [
      "Your chill streaming zone!",
      "Hang loose and watch shows!",
      "The beach house of streaming!",
    ],
  },

  // -------------------------------------------------------------------------
  // MEDIEVAL BARD - Theatrical, poetic, storytelling
  // -------------------------------------------------------------------------
  'Medieval Bard': {
    welcome: [
      "Hark! {username} returns to the grand hall!",
      "Rejoice! For {username} graces us once more!",
      "The bard sings of {username}'s triumphant return!",
    ],
    empty: [
      "Alas, this chamber stands barren.",
      "The scroll remains unwritten.",
      "Naught but echoes fill this empty hall.",
    ],
    add: [
      "Inscribe thy choice upon the scroll!",
      "Add to thy collection, noble patron!",
      "Let thy selection be known!",
    ],
    sarcasm: [
      "Truly, a choice most... unique.",
      "The muses weep with... joy?",
      "How... wonderfully peculiar.",
    ],
    emptyWatching: [
      "Thy watching chamber lies dormant!",
      "No tales currently unfold before thee.",
      "The stage awaits thy chosen performers!",
    ],
    emptyWishlist: [
      "Thy wishlist scroll remains blank!",
      "No desires have been proclaimed!",
      "Empty dreams await thy inscriptions!",
    ],
    emptyWatched: [
      "No sagas have been witnessed!",
      "Thy chronicle of tales is yet unwritten!",
      "The annals of watched shows stand empty!",
    ],
    emptyUpNext: [
      "No performances queue in the wings!",
      "The next act has yet to be chosen!",
      "Thy future viewings remain unscripted!",
    ],
    itemAdded: [
      "Huzzah! 'Tis added to thy collection!",
      "So it is written! So it shall be!",
      "The scroll records thy noble addition!",
    ],
    itemRemoved: [
      "Banished from the records!",
      "Struck from the chronicles!",
      "The tale is told no more!",
    ],
    searchEmpty: [
      "The search yields no treasures!",
      "Alas, the quest finds naught!",
      "Thy sought prize eludes thee!",
    ],
    searchLoading: [
      "The scribes search the archives...",
      "Seeking through ancient records...",
      "The quest for knowledge proceeds...",
    ],
    errorGeneric: [
      "Curses! Something hath gone awry!",
      "A mishap most foul! Try once more!",
      "The fates conspire against us!",
    ],
    errorNetwork: [
      "The messenger ravens have lost their way!",
      "Our connection to distant lands is severed!",
      "The network of couriers hath failed!",
    ],
    errorNotFound: [
      "Vanished like mist at dawn!",
      "'Twas not found in any kingdom!",
      "Lost to the annals of time!",
    ],
    successSave: [
      "Preserved for posterity!",
      "Inscribed upon the eternal scroll!",
      "Saved in the royal archives!",
    ],
    successImport: [
      "Treasures from afar have arrived!",
      "The caravan of data hath arrived!",
      "Imported from distant realms!",
    ],
    successExport: [
      "Dispatched to foreign lands!",
      "The scroll travels forth!",
      "Exported to the four corners!",
    ],
    marquee1: [
      "Discover tales most wondrous!",
      "Seek thy next great adventure!",
      "Stories await the worthy!",
    ],
    marquee2: [
      "Chronicle thy viewing journeys!",
      "Keep record of thy quests!",
      "The ledger awaits thy entries!",
    ],
    marquee3: [
      "New chapters emerge forthwith!",
      "Fresh tales from the storytellers!",
      "The saga continues anon!",
    ],
    marquee4: [
      "Uncover treasures unknown!",
      "Adventure calls to thee!",
      "What mysteries await?",
    ],
    marquee5: [
      "Thy entertainment kingdom!",
      "Where legends come to dwell!",
      "The grand hall of stories!",
    ],
  },

  // -------------------------------------------------------------------------
  // GRUMPY OLD MAN - Annoyed, blunt, dry but not cruel
  // -------------------------------------------------------------------------
  'Grumpy Old Man': {
    welcome: [
      "Oh, it's you, {username}. Back again, huh?",
      "{username}. What do you want now?",
      "Look who finally showed up. {username}.",
    ],
    empty: [
      "Empty. Just like my patience.",
      "Nothing here. Big surprise.",
      "Bare as a bone. What'd you expect?",
    ],
    add: [
      "Well? Add something already.",
      "Pick something. I haven't got all day.",
      "You gonna add something or just stare?",
    ],
    sarcasm: [
      "Oh, brilliant. Just brilliant.",
      "Wonderful. Truly spectacular.",
      "Great. Another one of those.",
    ],
    emptyWatching: [
      "Nothing being watched. Typical.",
      "Empty watch list. Color me shocked.",
      "No shows? What do you do all day?",
    ],
    emptyWishlist: [
      "Wishlist's empty. Dreams are free, you know.",
      "No wishes? Even I have wishes.",
      "Blank wishlist. You don't want anything?",
    ],
    emptyWatched: [
      "Haven't watched anything. Productive.",
      "Nothing completed. Par for the course.",
      "Empty watched list. We were all young once.",
    ],
    emptyUpNext: [
      "Nothing up next. Living dangerously.",
      "No queue? Flying by the seat of your pants.",
      "Up next: absolutely nothing. Great plan.",
    ],
    itemAdded: [
      "Fine. It's added.",
      "There. Happy now?",
      "Added. Don't thank me all at once.",
    ],
    itemRemoved: [
      "Gone. Good riddance.",
      "Removed. Finally some progress.",
      "Out of here. Next.",
    ],
    searchEmpty: [
      "Nothing. Shocking, I know.",
      "No results. Try harder.",
      "Couldn't find it. Story of my life.",
    ],
    searchLoading: [
      "Hold your horses. Searching...",
      "Working on it. Patience.",
      "Looking. Give me a second.",
    ],
    errorGeneric: [
      "It broke. Of course it did.",
      "Something went wrong. As usual.",
      "Error. What else is new?",
    ],
    errorNetwork: [
      "Connection's gone. Figures.",
      "Network's down. In my day, we had dial-up.",
      "Lost the connection. Modern technology...",
    ],
    errorNotFound: [
      "Can't find it. Probably never existed.",
      "Not there. Someone moved it.",
      "Gone. Things always disappear on me.",
    ],
    successSave: [
      "Saved. There.",
      "Done. Finally.",
      "It's saved. You're welcome.",
    ],
    successImport: [
      "Imported. All that nonsense.",
      "It's in. The whole lot.",
      "Import done. Happy?",
    ],
    successExport: [
      "Exported. Take it and go.",
      "Sent off. Not my problem now.",
      "Export complete. Don't lose it.",
    ],
    marquee1: [
      "Find something. Or don't. See if I care.",
      "Shows to watch. If you have the time.",
      "Discover stuff. It's all the rage.",
    ],
    marquee2: [
      "Keep track. Organization won't kill you.",
      "Your lists. Don't mess them up.",
      "Stay organized. For once.",
    ],
    marquee3: [
      "New episodes. They never stop.",
      "More content. Like we need more.",
      "New stuff coming. Brace yourself.",
    ],
    marquee4: [
      "Find something new. Or rewatch. Whatever.",
      "Discover shows. Knock yourself out.",
      "There's more out there. Unfortunately.",
    ],
    marquee5: [
      "Your show tracker. You're welcome.",
      "Track your shows. It's not rocket science.",
      "The app for your shows. Use it wisely.",
    ],
  },

  // -------------------------------------------------------------------------
  // FANTASY WIZARD - Mystical, wise, dramatic, slightly verbose
  // -------------------------------------------------------------------------
  'Fantasy Wizard': {
    welcome: [
      "Ah, {username}! The stars foretold your return!",
      "By the ancient runes, {username} has arrived!",
      "The crystal reveals {username}! Welcome, seeker!",
    ],
    empty: [
      "The void awaits to be filled with wonder.",
      "Empty as a spent mana pool.",
      "Naught but arcane potential resides here.",
    ],
    add: [
      "Summon forth your selection!",
      "Inscribe your choice in the arcane ledger!",
      "Add to your mystical collection!",
    ],
    sarcasm: [
      "How... enchantingly mundane.",
      "The prophecy mentioned this. Sort of.",
      "Truly, the magic is... somewhere.",
    ],
    emptyWatching: [
      "Thy scrying pool shows no visions!",
      "No magical tales currently unfolding!",
      "The watching crystal lies dormant!",
    ],
    emptyWishlist: [
      "Thy wishlist scroll is blank, young seeker!",
      "No enchantments have been desired!",
      "The grimoire of wishes stands empty!",
    ],
    emptyWatched: [
      "No sagas have passed before thine eyes!",
      "The tome of completed quests lies blank!",
      "No tales have been witnessed in this realm!",
    ],
    emptyUpNext: [
      "The future remains unwritten in the stars!",
      "No prophecies queue for revelation!",
      "The next chapter awaits your choosing!",
    ],
    itemAdded: [
      "The spell is cast! 'Tis added!",
      "Bound to your collection by arcane forces!",
      "The enchantment takes hold! Added!",
    ],
    itemRemoved: [
      "Banished to the shadow realm!",
      "The unbinding spell is complete!",
      "Removed from existence! Well, the list.",
    ],
    searchEmpty: [
      "The divination reveals nothing!",
      "My scrying fails to find thy quarry!",
      "The mists clear, yet nothing appears!",
    ],
    searchLoading: [
      "Consulting the ancient tomes...",
      "The crystal ball swirls with visions...",
      "Channeling the search enchantment...",
    ],
    errorGeneric: [
      "A dark force disrupts the spell!",
      "The enchantment falters! Try again!",
      "Chaos magic interferes! Retry, seeker!",
    ],
    errorNetwork: [
      "The ethereal connection is severed!",
      "The magical network has collapsed!",
      "Our link to the arcane realm wavers!",
    ],
    errorNotFound: [
      "Lost in the dimensional void!",
      "The item has been spirited away!",
      "Not found in any plane of existence!",
    ],
    successSave: [
      "Preserved in crystalline stasis!",
      "Sealed with protective wards!",
      "Saved by ancient enchantments!",
    ],
    successImport: [
      "Summoned from distant realms!",
      "The portal delivers thy treasures!",
      "Imported through arcane channels!",
    ],
    successExport: [
      "Dispatched through mystical portals!",
      "Sent forth on ethereal winds!",
      "The export spell is complete!",
    ],
    marquee1: [
      "Discover magical tales untold!",
      "Seek wonders in the streaming cosmos!",
      "Adventures await the worthy seeker!",
    ],
    marquee2: [
      "Catalogue thy magical journeys!",
      "The ledger of legends awaits!",
      "Track thy quests through realms!",
    ],
    marquee3: [
      "New visions emerge from the mist!",
      "Fresh prophecies unfold!",
      "The saga continues in new chapters!",
    ],
    marquee4: [
      "Uncover arcane entertainments!",
      "What mysteries shall you discover?",
      "New realms await exploration!",
    ],
    marquee5: [
      "Thy mystical entertainment sanctum!",
      "Where streaming meets sorcery!",
      "The wizard's choice for shows!",
    ],
  },
};

// ============================================================================
// HELPER: GET PERSONALITY TEXT
// ============================================================================

/**
 * Session seed for stable variant selection.
 * Generated once per page load so the same personality+key returns the same variant
 * throughout a session, eliminating flicker during re-renders.
 * Changes on page refresh for variety.
 */
const SESSION_SEED = Date.now();

/**
 * Cache for selected variants within a session.
 * Key: `${personality}:${key}` → selected variant index
 * This ensures the same text is returned for the same personality+key combo
 * throughout a session, preventing flicker during React re-renders.
 */
const variantCache = new Map<string, number>();

/**
 * Get a text string for a given personality and key.
 * Selects from available variants using a session-stable seed (no flicker).
 * Falls back to Zen if personality not found, empty string if key not found.
 * 
 * @param personality The personality name
 * @param key The text key (e.g., 'welcome', 'empty', 'itemAdded')
 * @param context Optional context for variable replacement (e.g., { username: 'John' })
 * @returns A session-stable text variant with variables replaced
 */
export function getPersonalityText(
  personality: PersonalityName | string,
  key: TextKey,
  context?: { username?: string }
): string {
  // Validate personality
  const validPersonality = (PERSONALITY_LIST.find(p => p.name === personality)?.name) || DEFAULT_PERSONALITY;
  
  // Get text array for this personality and key
  const personalityData = PERSONALITIES[validPersonality as PersonalityName];
  if (!personalityData) {
    console.warn(`[Personality] Unknown personality: ${personality}, using default`);
    return getPersonalityText(DEFAULT_PERSONALITY, key, context);
  }
  
  const variants = personalityData[key];
  if (!variants || variants.length === 0) {
    console.warn(`[Personality] No text for key: ${key} in personality: ${validPersonality}`);
    return '';
  }
  
  // Use cached variant index if available, otherwise compute and cache
  const cacheKey = `${validPersonality}:${key}`;
  let variantIndex = variantCache.get(cacheKey);
  
  if (variantIndex === undefined) {
    // Generate stable index using session seed + hash of the cache key
    // This gives variety between sessions while being stable within a session
    const hash = cacheKey.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);
    variantIndex = Math.abs((SESSION_SEED + hash) % variants.length);
    variantCache.set(cacheKey, variantIndex);
  }
  
  let text = variants[variantIndex];
  
  // Replace {username} placeholder if provided
  if (context?.username) {
    text = text.replace(/\{username\}/g, context.username);
  } else {
    // Remove {username} placeholder if no username provided
    text = text.replace(/\{username\},?\s*/g, '').replace(/\s+/g, ' ').trim();
  }
  
  return text;
}

/**
 * Force a new random variant for a specific personality+key (useful for "refresh" actions)
 * Call this if you want a user action to trigger a new variant.
 */
export function refreshVariant(personality: PersonalityName | string, key: TextKey): void {
  const validPersonality = (PERSONALITY_LIST.find(p => p.name === personality)?.name) || DEFAULT_PERSONALITY;
  const cacheKey = `${validPersonality}:${key}`;
  variantCache.delete(cacheKey);
}

/**
 * Clear all cached variants (useful when personality changes)
 */
export function clearVariantCache(): void {
  variantCache.clear();
}

/**
 * Get all variants for a given personality and key (for preview/testing)
 */
export function getAllVariants(
  personality: PersonalityName | string,
  key: TextKey
): string[] {
  const validPersonality = (PERSONALITY_LIST.find(p => p.name === personality)?.name) || DEFAULT_PERSONALITY;
  const personalityData = PERSONALITIES[validPersonality as PersonalityName];
  
  if (!personalityData || !personalityData[key]) {
    return [];
  }
  
  return personalityData[key];
}

