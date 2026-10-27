const buildQuotes = (category, starts, endings, note) =>
  starts.flatMap((start, startIndex) => endings.map((ending, endingIndex) => ({
    category,
    title: `${category} moment ${startIndex * endings.length + endingIndex + 1}`,
    text: `${start} ${ending}`,
    note,
  })));

const emotionQuotes = (category, starts, endings, note) =>
  buildQuotes(category, starts, endings, note);

const goodStarts = [
  "A little kindness can",
  "The best kind of courage is the kind that",
  "A generous idea often",
  "When you share the light, it",
  "A patient heart knows how to",
  "Small steps become a path when",
  "A good friend reminds you that",
  "Hope is practical when",
  "The world gets softer when",
  "Your next good decision might",
];

const goodEndings = [
  "make an ordinary day feel possible.",
  "turn a closed door into a conversation.",
  "leave more warmth behind than noise.",
  "help someone keep going.",
  "grow quietly before anyone applauds.",
  "begin with listening.",
  "be exactly what someone needed.",
  "make room for another person to shine.",
  "arrive through the smallest gesture.",
  "be worth doing even when nobody sees it.",
];

const sillyStarts = [
  "Stupid Cupid points arrows",
  "My last brain cell decided to",
  "A pigeon with a tiny briefcase might",
  "The snack cupboard has learned how to",
  "Somewhere, a sock is",
  "If bananas could give advice, they would",
  "My alarm clock and I have agreed to",
  "A dramatic squirrel probably believes",
  "The moon looks suspiciously like",
  "Never trust a duck who says",
];

const sillyEndings = [
  "the teenagers like they were made for each other.",
  "file a complaint about Monday.",
  "pretend the sidewalk is a runway.",
  "hide the good biscuits from everybody.",
  "waiting for its missing partner.",
  "wear a tiny hat to important meetings.",
  "negotiate for five more minutes.",
  "own at least three imaginary castles.",
  "a snack wearing a very bright hat.",
  "it is definitely not planning something.",
];

const thoughtfulStarts = [
  "Sometimes the quietest moment",
  "A new chapter often begins when",
  "You do not have to understand everything to",
  "The future becomes less frightening when",
  "A question can be more useful than",
  "Rest is not a detour; it is",
  "Your attention is a home, so",
  "The person you are becoming may",
  "A mistake becomes a teacher when",
  "Peace can look like",
];

const thoughtfulEndings = [
  "reveals what the noise was hiding.",
  "you choose one honest next step.",
  "begin.",
  "you give the present your full attention.",
  "an answer you are not ready to hear.",
  "part of the journey.",
  "choose what deserves to live there.",
  "need more patience than proof.",
  "you meet it without cruelty.",
  "letting the day be unfinished.",
];

const emotionSets = {
  Happy: {
    starts: ["Happiness can feel like", "A joyful morning begins with", "The heart smiles when", "A bright day becomes brighter with", "Joy often arrives through", "A happy memory can", "Laughter has a way of", "A small celebration is", "Lightness returns when", "The sweetest kind of happiness is"],
    endings: ["sunlight finding the floor.", "someone laughs without pretending.", "an ordinary moment turns golden.", "good news is shared.", "a favorite song starts unexpectedly.", "your people feel close.", "making space for wonder.", "being grateful for what is here.", "you stop rushing past the good.", "having permission to be fully yourself."],
    note: "A little light for today",
  },
  Sad: {
    starts: ["Sadness sometimes asks for", "A heavy heart may need", "It is okay to grieve", "Tears can be a way of", "A difficult evening becomes gentler with", "When sadness visits, try", "The ache may be telling you", "A quiet room can offer", "You can miss someone and still", "Healing from sadness often begins with"],
    endings: ["a softer pace.", "a safe place to be honest.", "what mattered.", "letting the feeling move through.", "one kind person nearby.", "rest instead of answers.", "the truth without shame.", "time and tenderness.", "keep living.", "naming what hurts."],
    note: "For tender and difficult days",
  },
  Angry: {
    starts: ["Anger can be a signal that", "Before anger chooses your words, let", "A heated moment may need", "Rage often hides", "You can honor your anger by", "A boundary becomes clearer when", "The strongest response may be", "When your patience runs out, remember", "Anger deserves attention, not", "A calm answer can begin after"],
    endings: ["a boundary needs protecting.", "your breath return.", "a pause before action.", "hurt that has not been heard.", "asking what it protects.", "you name what is not okay.", "choosing what happens next.", "you are allowed to step away.", "permission to control you.", "the first wave passes."],
    note: "A steady place for strong feelings",
  },
  Anxious: {
    starts: ["An anxious mind often", "When worry gets loud, try", "A nervous heart can", "The future feels smaller when", "Anxiety asks for certainty, but", "One breath can", "You are not behind because", "A worried thought is not always", "When everything feels urgent, choose", "Safety can begin with"],
    endings: ["turns a maybe into a disaster.", "returning to what is true right now.", "remember that it is not alone.", "you focus on the next small step.", "life also asks for trust.", "give you a moment of choice.", "you need time to find your footing.", "a prediction.", "one manageable thing.", "your feet on the floor."],
    note: "A gentle reminder for worried moments",
  },
  Lonely: {
    starts: ["Loneliness can make", "A quiet evening becomes warmer with", "When you feel unseen, remember", "Connection sometimes begins with", "A lonely heart may forget", "You can reach outward through", "Being alone is not always", "The smallest message can", "Loneliness softens when", "Even in a crowd, you deserve"],
    endings: ["the room feel bigger than it is.", "a song that keeps you company.", "you still belong somewhere.", "one honest hello.", "how deeply it wants to connect.", "a simple invitation.", "the same as being unwanted.", "open a door.", "you let someone know the truth.", "to be met with care."],
    note: "For moments that feel distant",
  },
  Hopeful: {
    starts: ["Hope begins when", "A hopeful person keeps", "Even a small possibility can", "Tomorrow becomes inviting when", "Hope is not pretending that", "The next chapter may", "A seed of hope needs", "You can carry hope while", "A brighter future often starts with", "Hope grows stronger when"],
    endings: ["you leave room for change.", "one small promise to yourself.", "light a whole new direction.", "you imagine what could be.", "everything is easy.", "be closer than it seems.", "patience and a little water.", "still telling the truth.", "a choice made today.", "it is shared."],
    note: "For the part of you that keeps going",
  },
  Loving: {
    starts: ["Love often sounds like", "A loving person knows how to", "The gentlest kind of care is", "Love grows when", "A warm heart can", "To love someone is to", "Affection lives in", "A relationship becomes safer with", "Love is not always loud; sometimes it is", "The people we love deserve"],
    endings: ["remembering the small details.", "listen without preparing a reply.", "showing up consistently.", "making room for another truth.", "turn an ordinary day into a home.", "see the whole person.", "the everyday gestures.", "honesty and repair.", "a hand held quietly.", "patience, respect, and freedom."],
    note: "For hearts that care deeply",
  },
  Confused: {
    starts: ["Confusion can be a sign that", "When the path feels unclear, begin with", "A tangled thought may need", "You do not need to decide while", "Questions become useful when", "Being confused does not mean", "Clarity often arrives after", "A messy beginning can still", "When choices blur together, ask", "It is okay to say"],
    endings: ["something important is being reconsidered.", "the next honest question.", "a little daylight and time.", "your emotions are shouting.", "you let them be curious.", "you are failing.", "you stop forcing an answer.", "be a beginning.", "which choice feels most honest.", "I need more time."],
    note: "For days when the map is blurry",
  },
  Grateful: {
    starts: ["Gratitude begins with", "A grateful heart notices", "Thankfulness can turn", "One thing worth appreciating is", "Gratitude becomes real when", "A simple thank-you can", "The day feels richer after", "You may find gratitude in", "Being grateful does not erase pain; it", "A thankful pause can"],
    endings: ["what is already here.", "the kindness hiding in routine.", "a pause into a celebration.", "the person who made time.", "you name what helped.", "make someone feel remembered.", "you notice the ordinary.", "unexpected places.", "gives the heart another place to stand.", "change the temperature of a moment."],
    note: "For noticing what still matters",
  },
  Motivated: {
    starts: ["Motivation often follows", "A determined mind begins with", "Progress becomes visible when", "Your goal gets closer through", "Discipline can look like", "A strong start does not require", "You can build momentum by", "The work becomes lighter after", "A setback is useful when", "Keep going because"],
    endings: ["the first imperfect attempt.", "a reason that feels personal.", "you keep a promise to yourself.", "small actions repeated.", "doing the next right thing.", "a perfect plan.", "finishing one small task.", "you begin instead of waiting.", "it teaches you what to change.", "your future self is worth meeting."],
    note: "For starting, continuing, and trying again",
  },
  Calm: {
    starts: ["Calm can begin with", "A peaceful moment is often", "Your nervous system may need", "Stillness gives you room to", "A slower day can reveal", "Peace is not emptiness; it is", "When the world is loud, protect", "A calm answer grows from", "Rest can be a form of", "You can return to yourself through"],
    endings: ["one unhurried breath.", "closer than the noise suggests.", "a softer environment.", "hear your own thoughts.", "what speed was hiding.", "space to feel without rushing.", "one small quiet corner.", "a pause.", "wisdom.", "simple rituals."],
    note: "For finding a little quiet",
  },
  Nostalgic: {
    starts: ["Nostalgia often arrives with", "An old song can", "Memory keeps", "The past feels close when", "A familiar smell may", "Childhood lives in", "Looking back can teach you", "A photograph holds", "Some places remain inside us through", "Nostalgia is a reminder that"],
    endings: ["a song from another season.", "open a door without moving your feet.", "what the present cannot repeat.", "you revisit a familiar story.", "bring a whole afternoon back.", "the smallest details.", "what was worth carrying forward.", "more than one frozen second.", "the stories we tell.", "you have lived many lives already."],
    note: "For memories that still glow",
  },
};

export const quoteCategories = {
  "My writing": [
    {
      category: "My writing",
      title: "Stupid Cupid",
      text: "Stupid Cupid points arrows at all the teenagers like they were made for each other.",
      note: "A little bit of teenage chaos",
    },
  ],
  Good: buildQuotes("Good", goodStarts, goodEndings, "A little brightness for the day"),
  Silly: buildQuotes("Silly", sillyStarts, sillyEndings, "A small excuse to smile"),
  Thoughtful: buildQuotes("Thoughtful", thoughtfulStarts, thoughtfulEndings, "A question worth carrying"),
  ...Object.fromEntries(Object.entries(emotionSets).map(([category, set]) => [
    category,
    emotionQuotes(category, set.starts, set.endings, set.note),
  ])),
};
