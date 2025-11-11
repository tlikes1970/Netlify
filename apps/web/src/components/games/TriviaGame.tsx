import { useState, useEffect, useCallback, useRef } from "react";
import { useSettings } from "@/lib/settings";
import { getCachedTrivia } from "../../lib/triviaApi";

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

interface TriviaGameProps {
  onClose?: () => void;
  onGameComplete?: (score: number, total: number) => void;
}

export default function TriviaGame({
  onClose,
  onGameComplete,
}: TriviaGameProps) {
  const settings = useSettings();
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<
    "loading" | "playing" | "completed" | "error"
  >("loading");
  const [showExplanation, setShowExplanation] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const [currentGame, setCurrentGame] = useState(1);
  const [gamesCompletedToday, setGamesCompletedToday] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState<number | null>(
    null
  );
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  const explanationRef = useRef<HTMLDivElement | null>(null);

  // Sample trivia questions (in a real app, these would come from an API)
  const sampleQuestions: TriviaQuestion[] = [
    {
      id: "1",
      question: "Which movie won the Academy Award for Best Picture in 2023?",
      options: [
        "Everything Everywhere All at Once",
        "The Banshees of Inisherin",
        "Top Gun: Maverick",
        "Avatar: The Way of Water",
      ],
      correctAnswer: 0,
      explanation:
        "Everything Everywhere All at Once won Best Picture at the 95th Academy Awards.",
      category: "Awards",
      difficulty: "medium",
    },
    {
      id: "2",
      question: "What is the highest-grossing movie of all time?",
      options: [
        "Avatar",
        "Avengers: Endgame",
        "Titanic",
        "Star Wars: The Force Awakens",
      ],
      correctAnswer: 0,
      explanation:
        "Avatar (2009) holds the record for highest-grossing movie worldwide.",
      category: "Box Office",
      difficulty: "easy",
    },
    {
      id: "3",
      question: 'Which streaming service produced "Stranger Things"?',
      options: ["Hulu", "Netflix", "Amazon Prime", "Disney+"],
      correctAnswer: 1,
      explanation: "Stranger Things is a Netflix original series.",
      category: "Streaming",
      difficulty: "easy",
    },
    {
      id: "4",
      question: 'Who directed "The Dark Knight"?',
      options: [
        "Christopher Nolan",
        "Zack Snyder",
        "Tim Burton",
        "Martin Scorsese",
      ],
      correctAnswer: 0,
      explanation: "Christopher Nolan directed The Dark Knight (2008).",
      category: "Directors",
      difficulty: "medium",
    },
    {
      id: "5",
      question: 'What year was the first "Star Wars" movie released?',
      options: ["1975", "1977", "1979", "1981"],
      correctAnswer: 1,
      explanation: "Star Wars: Episode IV - A New Hope was released in 1977.",
      category: "History",
      difficulty: "medium",
    },
    {
      id: "6",
      question: 'Which actor played Jack in "Titanic"?',
      options: ["Brad Pitt", "Leonardo DiCaprio", "Matt Damon", "Ryan Gosling"],
      correctAnswer: 1,
      explanation: "Leonardo DiCaprio played Jack Dawson in Titanic (1997).",
      category: "Actors",
      difficulty: "easy",
    },
    {
      id: "7",
      question: 'What is the name of the main character in "The Matrix"?',
      options: ["Neo", "Morpheus", "Trinity", "Agent Smith"],
      correctAnswer: 0,
      explanation:
        "Neo (played by Keanu Reeves) is the main character in The Matrix.",
      category: "Characters",
      difficulty: "easy",
    },
    {
      id: "8",
      question: 'Which movie features the quote "May the Force be with you"?',
      options: [
        "Star Trek",
        "Star Wars",
        "Guardians of the Galaxy",
        "Blade Runner",
      ],
      correctAnswer: 1,
      explanation: "This iconic quote is from the Star Wars franchise.",
      category: "Quotes",
      difficulty: "easy",
    },
    {
      id: "9",
      question: 'Who composed the music for "Jaws"?',
      options: [
        "John Williams",
        "Hans Zimmer",
        "Danny Elfman",
        "Alan Silvestri",
      ],
      correctAnswer: 0,
      explanation: "John Williams composed the iconic Jaws theme.",
      category: "Music",
      difficulty: "medium",
    },
    {
      id: "10",
      question: "What is the highest-rated movie on IMDb?",
      options: [
        "The Godfather",
        "The Shawshank Redemption",
        "The Dark Knight",
        "Pulp Fiction",
      ],
      correctAnswer: 1,
      explanation:
        "The Shawshank Redemption currently holds the #1 spot on IMDb.",
      category: "Ratings",
      difficulty: "medium",
    },
    {
      id: "11",
      question: "Which movie won Best Picture in 2020?",
      options: ["1917", "Joker", "Parasite", "Once Upon a Time in Hollywood"],
      correctAnswer: 2,
      explanation:
        "Parasite became the first non-English language film to win Best Picture.",
      category: "Awards",
      difficulty: "medium",
    },
    {
      id: "12",
      question: 'What is the name of the dinosaur in "Jurassic Park"?',
      options: ["Rex", "T-Rex", "Rexy", "Tyrannosaurus"],
      correctAnswer: 2,
      explanation:
        'The T-Rex in Jurassic Park is affectionately called "Rexy".',
      category: "Characters",
      difficulty: "easy",
    },
    {
      id: "13",
      question: 'Which director made "Inception"?',
      options: [
        "Steven Spielberg",
        "Christopher Nolan",
        "Martin Scorsese",
        "Quentin Tarantino",
      ],
      correctAnswer: 1,
      explanation: "Christopher Nolan directed Inception (2010).",
      category: "Directors",
      difficulty: "easy",
    },
    {
      id: "14",
      question: 'What year was "The Lion King" (animated) released?',
      options: ["1992", "1994", "1996", "1998"],
      correctAnswer: 1,
      explanation: "The animated Lion King was released in 1994.",
      category: "History",
      difficulty: "medium",
    },
    {
      id: "15",
      question: "Which movie features the character Tony Stark?",
      options: ["Batman", "Iron Man", "Superman", "Spider-Man"],
      correctAnswer: 1,
      explanation: "Tony Stark is the alter ego of Iron Man.",
      category: "Characters",
      difficulty: "easy",
    },
    {
      id: "16",
      question: "What is the highest-grossing movie franchise?",
      options: [
        "Marvel Cinematic Universe",
        "Star Wars",
        "Harry Potter",
        "Fast & Furious",
      ],
      correctAnswer: 0,
      explanation:
        "The Marvel Cinematic Universe is the highest-grossing movie franchise.",
      category: "Box Office",
      difficulty: "medium",
    },
    {
      id: "17",
      question: "Which actor played Wolverine in the X-Men movies?",
      options: [
        "Ryan Reynolds",
        "Hugh Jackman",
        "Chris Evans",
        "Robert Downey Jr.",
      ],
      correctAnswer: 1,
      explanation: "Hugh Jackman played Wolverine in the X-Men franchise.",
      category: "Actors",
      difficulty: "easy",
    },
    {
      id: "18",
      question: 'What year was "The Matrix" released?',
      options: ["1997", "1999", "2001", "2003"],
      correctAnswer: 1,
      explanation: "The Matrix was released in 1999.",
      category: "History",
      difficulty: "medium",
    },
    {
      id: "19",
      question: "Which movie won Best Picture in 2019?",
      options: [
        "Black Panther",
        "Bohemian Rhapsody",
        "Green Book",
        "A Star Is Born",
      ],
      correctAnswer: 2,
      explanation: "Green Book won Best Picture at the 91st Academy Awards.",
      category: "Awards",
      difficulty: "medium",
    },
    {
      id: "20",
      question: 'What is the name of the main character in "Forrest Gump"?',
      options: ["Forrest Gump", "Tom Hanks", "Jenny", "Bubba"],
      correctAnswer: 0,
      explanation: "Forrest Gump is the title character played by Tom Hanks.",
      category: "Characters",
      difficulty: "easy",
    },
    {
      id: "21",
      question: 'Which streaming service produced "The Crown"?',
      options: ["Netflix", "Amazon Prime", "Disney+", "HBO Max"],
      correctAnswer: 0,
      explanation: "The Crown is a Netflix original series.",
      category: "Streaming",
      difficulty: "easy",
    },
    {
      id: "22",
      question: 'Who directed "Pulp Fiction"?',
      options: [
        "Martin Scorsese",
        "Quentin Tarantino",
        "Steven Spielberg",
        "Christopher Nolan",
      ],
      correctAnswer: 1,
      explanation: "Quentin Tarantino directed Pulp Fiction (1994).",
      category: "Directors",
      difficulty: "medium",
    },
    {
      id: "23",
      question: "What is the highest-rated TV show on IMDb?",
      options: ["Breaking Bad", "The Wire", "Game of Thrones", "The Sopranos"],
      correctAnswer: 0,
      explanation:
        "Breaking Bad currently holds the #1 spot for TV shows on IMDb.",
      category: "Ratings",
      difficulty: "medium",
    },
    {
      id: "24",
      question: 'Which movie features the quote "I\'ll be back"?',
      options: ["Terminator", "Predator", "Total Recall", "Commando"],
      correctAnswer: 0,
      explanation: "This iconic quote is from The Terminator (1984).",
      category: "Quotes",
      difficulty: "easy",
    },
    {
      id: "25",
      question: 'What year was "Jurassic Park" released?',
      options: ["1991", "1993", "1995", "1997"],
      correctAnswer: 1,
      explanation: "Jurassic Park was released in 1993.",
      category: "History",
      difficulty: "medium",
    },
    {
      id: "26",
      question:
        'Which actor played Jack Nicholson\'s character in "The Shining"?',
      options: [
        "Jack Nicholson",
        "Shelley Duvall",
        "Danny Lloyd",
        "Scatman Crothers",
      ],
      correctAnswer: 0,
      explanation: "Jack Nicholson played Jack Torrance in The Shining.",
      category: "Actors",
      difficulty: "easy",
    },
    {
      id: "27",
      question: 'What is the name of the main character in "Casablanca"?',
      options: ["Rick Blaine", "Ilsa Lund", "Victor Laszlo", "Captain Renault"],
      correctAnswer: 0,
      explanation:
        "Rick Blaine (played by Humphrey Bogart) is the main character.",
      category: "Characters",
      difficulty: "medium",
    },
    {
      id: "28",
      question: "Which movie won Best Picture in 2018?",
      options: [
        "The Shape of Water",
        "Three Billboards Outside Ebbing, Missouri",
        "Dunkirk",
        "Get Out",
      ],
      correctAnswer: 0,
      explanation:
        "The Shape of Water won Best Picture at the 90th Academy Awards.",
      category: "Awards",
      difficulty: "medium",
    },
    {
      id: "29",
      question: "What is the highest-grossing animated movie franchise?",
      options: ["Toy Story", "Shrek", "Despicable Me", "Frozen"],
      correctAnswer: 2,
      explanation:
        "The Despicable Me franchise (including Minions) is the highest-grossing animated franchise.",
      category: "Box Office",
      difficulty: "medium",
    },
    {
      id: "30",
      question: 'Which streaming service produced "The Mandalorian"?',
      options: ["Netflix", "Disney+", "Amazon Prime", "HBO Max"],
      correctAnswer: 1,
      explanation: "The Mandalorian is a Disney+ original series.",
      category: "Streaming",
      difficulty: "easy",
    },
    {
      id: "31",
      question: 'Who composed the music for "Star Wars"?',
      options: [
        "John Williams",
        "Hans Zimmer",
        "Danny Elfman",
        "Alan Silvestri",
      ],
      correctAnswer: 0,
      explanation: "John Williams composed the iconic Star Wars theme.",
      category: "Music",
      difficulty: "easy",
    },
    {
      id: "32",
      question: 'What year was "Titanic" released?',
      options: ["1995", "1997", "1999", "2001"],
      correctAnswer: 1,
      explanation: "Titanic was released in 1997.",
      category: "History",
      difficulty: "easy",
    },
    {
      id: "33",
      question: "Which movie features the character Hannibal Lecter?",
      options: [
        "Silence of the Lambs",
        "Hannibal",
        "Red Dragon",
        "All of the above",
      ],
      correctAnswer: 3,
      explanation: "Hannibal Lecter appears in all three movies.",
      category: "Characters",
      difficulty: "medium",
    },
    {
      id: "34",
      question: 'What is the name of the main character in "Goodfellas"?',
      options: ["Henry Hill", "Jimmy Conway", "Tommy DeVito", "Paul Cicero"],
      correctAnswer: 0,
      explanation: "Henry Hill (played by Ray Liotta) is the main character.",
      category: "Characters",
      difficulty: "medium",
    },
    {
      id: "35",
      question: "Which movie won Best Picture in 2017?",
      options: ["La La Land", "Moonlight", "Arrival", "Hidden Figures"],
      correctAnswer: 1,
      explanation: "Moonlight won Best Picture at the 89th Academy Awards.",
      category: "Awards",
      difficulty: "medium",
    },
    {
      id: "36",
      question: "What is the highest-grossing R-rated movie?",
      options: ["Deadpool", "Joker", "It", "The Matrix"],
      correctAnswer: 1,
      explanation: "Joker (2019) is the highest-grossing R-rated movie.",
      category: "Box Office",
      difficulty: "medium",
    },
    {
      id: "37",
      question: 'Which streaming service produced "Stranger Things"?',
      options: ["Netflix", "Amazon Prime", "Disney+", "HBO Max"],
      correctAnswer: 0,
      explanation: "Stranger Things is a Netflix original series.",
      category: "Streaming",
      difficulty: "easy",
    },
    {
      id: "38",
      question: 'Who directed "The Godfather"?',
      options: [
        "Martin Scorsese",
        "Francis Ford Coppola",
        "Steven Spielberg",
        "Alfred Hitchcock",
      ],
      correctAnswer: 1,
      explanation: "Francis Ford Coppola directed The Godfather (1972).",
      category: "Directors",
      difficulty: "medium",
    },
    {
      id: "39",
      question: 'What year was "The Lion King" (live-action) released?',
      options: ["2017", "2019", "2021", "2023"],
      correctAnswer: 1,
      explanation: "The live-action Lion King was released in 2019.",
      category: "History",
      difficulty: "easy",
    },
    {
      id: "40",
      question: "Which movie features the character Rocky Balboa?",
      options: ["Rocky", "Rambo", "Creed", "Both Rocky and Creed"],
      correctAnswer: 3,
      explanation:
        "Rocky Balboa appears in both the Rocky and Creed franchises.",
      category: "Characters",
      difficulty: "medium",
    },
    {
      id: "41",
      question: 'What is the name of the main character in "The Godfather"?',
      options: [
        "Vito Corleone",
        "Michael Corleone",
        "Sonny Corleone",
        "Fredo Corleone",
      ],
      correctAnswer: 1,
      explanation:
        "Michael Corleone (played by Al Pacino) is the main character.",
      category: "Characters",
      difficulty: "medium",
    },
    {
      id: "42",
      question: "Which movie won Best Picture in 2016?",
      options: ["La La Land", "Moonlight", "Arrival", "Hidden Figures"],
      correctAnswer: 0,
      explanation:
        "La La Land won Best Picture at the 89th Academy Awards (though Moonlight was the actual winner).",
      category: "Awards",
      difficulty: "hard",
    },
    {
      id: "43",
      question: "What is the highest-grossing movie of 2023?",
      options: [
        "Barbie",
        "Oppenheimer",
        "Spider-Man: Across the Spider-Verse",
        "Guardians of the Galaxy Vol. 3",
      ],
      correctAnswer: 0,
      explanation: "Barbie was the highest-grossing movie of 2023.",
      category: "Box Office",
      difficulty: "easy",
    },
    {
      id: "44",
      question: 'Which streaming service produced "The Queen\'s Gambit"?',
      options: ["Netflix", "Amazon Prime", "Disney+", "HBO Max"],
      correctAnswer: 0,
      explanation: "The Queen's Gambit is a Netflix original series.",
      category: "Streaming",
      difficulty: "easy",
    },
    {
      id: "45",
      question: 'Who directed "Inception"?',
      options: [
        "Christopher Nolan",
        "Steven Spielberg",
        "Martin Scorsese",
        "Quentin Tarantino",
      ],
      correctAnswer: 0,
      explanation: "Christopher Nolan directed Inception (2010).",
      category: "Directors",
      difficulty: "easy",
    },
    {
      id: "46",
      question: 'What year was "Avatar" released?',
      options: ["2007", "2009", "2011", "2013"],
      correctAnswer: 1,
      explanation: "Avatar was released in 2009.",
      category: "History",
      difficulty: "easy",
    },
    {
      id: "47",
      question: "Which movie features the character Indiana Jones?",
      options: [
        "Raiders of the Lost Ark",
        "Indiana Jones and the Temple of Doom",
        "Indiana Jones and the Last Crusade",
        "All of the above",
      ],
      correctAnswer: 3,
      explanation: "Indiana Jones appears in all three original movies.",
      category: "Characters",
      difficulty: "medium",
    },
    {
      id: "48",
      question: 'What is the name of the main character in "Casino"?',
      options: [
        "Sam Rothstein",
        "Nicky Santoro",
        "Ginger McKenna",
        "Lester Diamond",
      ],
      correctAnswer: 0,
      explanation:
        "Sam Rothstein (played by Robert De Niro) is the main character.",
      category: "Characters",
      difficulty: "medium",
    },
    {
      id: "49",
      question: "Which movie won Best Picture in 2015?",
      options: ["Birdman", "Boyhood", "The Grand Budapest Hotel", "Whiplash"],
      correctAnswer: 0,
      explanation: "Birdman won Best Picture at the 87th Academy Awards.",
      category: "Awards",
      difficulty: "medium",
    },
    {
      id: "50",
      question: "What is the highest-grossing movie of all time (unadjusted)?",
      options: [
        "Avatar",
        "Avengers: Endgame",
        "Titanic",
        "Star Wars: The Force Awakens",
      ],
      correctAnswer: 0,
      explanation:
        "Avatar (2009) holds the record for highest-grossing movie worldwide.",
      category: "Box Office",
      difficulty: "easy",
    },
  ];

  // Get today's date in YYYY-MM-DD format
  const getTodayString = () => {
    return new Date().toISOString().slice(0, 10);
  };

  // Get today's questions based on date (deterministic rotation)
  // For pro users: returns 10 questions for the current game (game 1-5)
  // For free users: returns 5 questions (single game)
  const getTodaysQuestions = (
    isPro: boolean = false,
    gameNumber: number = 1
  ) => {
    const today = getTodayString();
    const dateSeed = today.split("-").join("");
    const seedNumber = parseInt(dateSeed, 10);

    // Use a simpler rotation - cycle through questions every 3 days
    const daysSinceEpoch = Math.floor(seedNumber / 10000); // Roughly days since 2000
    const cycleDay = daysSinceEpoch % 3; // 0, 1, or 2

    // Pro users: 10 questions per game (3 games = 30 total)
    // Free users: 5 questions per day
    const questionsPerGame = isPro ? 10 : 5;
    const totalQuestionsPerDay = isPro ? 50 : 5;

    const todaysQuestions = [];
    // Calculate starting index for this game
    const startIndex = isPro ? (gameNumber - 1) * 10 : 0;

    for (let i = 0; i < questionsPerGame; i++) {
      const globalIndex = startIndex + i;
      const questionIndex =
        (cycleDay * totalQuestionsPerDay + globalIndex) %
        sampleQuestions.length;
      todaysQuestions.push(sampleQuestions[questionIndex]);
    }

    console.log(
      `🎯 Game ${gameNumber} questions (${isPro ? "Pro" : "Free"} user, cycle day ${cycleDay}):`,
      todaysQuestions.map((q) => q.id)
    );
    return todaysQuestions;
  };

  // Get games completed today from localStorage
  const getGamesCompletedToday = (): number => {
    try {
      const today = getTodayString();
      const key = `flicklet:trivia:games:${today}`;
      const completed = localStorage.getItem(key);
      return completed ? parseInt(completed, 10) : 0;
    } catch {
      return 0;
    }
  };

  // Save games completed today to localStorage
  const saveGamesCompletedToday = (count: number): void => {
    try {
      const today = getTodayString();
      const key = `flicklet:trivia:games:${today}`;
      localStorage.setItem(key, String(count));
    } catch (error) {
      console.warn("Failed to save games completed:", error);
    }
  };

  // Update trivia stats after game completes
  const updateTriviaStats = (
    gameScore: number,
    totalQuestions: number
  ): void => {
    try {
      const existingData = JSON.parse(
        localStorage.getItem("flicklet-data") || "{}"
      );
      const currentStats = existingData.trivia || {
        games: 0,
        wins: 0,
        losses: 0,
        correct: 0,
        total: 0,
        streak: 0,
        maxStreak: 0,
      };

      const percentage =
        totalQuestions > 0 ? Math.round((gameScore / totalQuestions) * 100) : 0;
      const isWin = percentage >= 60; // 60% or higher is a win

      const newStats = {
        games: currentStats.games + 1,
        wins: currentStats.wins + (isWin ? 1 : 0),
        losses: currentStats.losses + (isWin ? 0 : 1),
        correct: currentStats.correct + gameScore,
        total: currentStats.total + totalQuestions,
        streak: isWin ? currentStats.streak + 1 : 0,
        maxStreak: isWin
          ? Math.max(currentStats.maxStreak, currentStats.streak + 1)
          : currentStats.maxStreak,
      };

      const updatedData = {
        ...existingData,
        trivia: newStats,
      };

      localStorage.setItem("flicklet-data", JSON.stringify(updatedData));
      localStorage.setItem("trivia:stats", JSON.stringify(newStats));

      // Notify listeners
      window.dispatchEvent(new CustomEvent("trivia:statsUpdated"));

      console.log("💾 Trivia stats saved:", newStats);
    } catch (error) {
      console.error("Failed to save trivia stats:", error);
    }
  };

  // Check if user is Pro and initialize games completed
  useEffect(() => {
    setIsProUser(settings.pro.isPro);
    const completed = getGamesCompletedToday();
    setGamesCompletedToday(completed);
    // Set current game to next game to play (completed + 1, or 1 if not pro)
    if (settings.pro.isPro) {
      const nextGame = Math.min(completed + 1, 3); // Max 3 games for Pro
      setCurrentGame(nextGame);
      console.log(
        "🎯 Pro user status:",
        settings.pro.isPro,
        "Games completed today:",
        completed,
        "Starting game:",
        nextGame
      );
    } else {
      setCurrentGame(1);
      console.log("🎯 Free user, starting game 1");
    }
  }, [settings.pro]);

  // Load questions from API (with fresh content for testing)
  // For pro users: loads 10 questions for the current game
  // For free users: loads 5 questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const gameNumber = isProUser ? currentGame : 1;
        console.log(
          `🧠 Loading trivia questions for ${isProUser ? "Pro" : "Free"} user, Game ${gameNumber}...`
        );

        // Use cached trivia to avoid rate limits
        const apiQuestions = await getCachedTrivia();

        let formattedQuestions;
        const questionsNeeded = isProUser ? 10 : 5;

        if (apiQuestions && apiQuestions.length > 0) {
          // Convert API format to our format
          // For pro users, take 10 questions starting from the appropriate offset for this game
          const startIndex = isProUser
            ? ((gameNumber - 1) * 10) % apiQuestions.length
            : 0;
          const selectedApiQuestions = apiQuestions.slice(
            startIndex,
            startIndex + questionsNeeded
          );

          formattedQuestions = selectedApiQuestions.map((q, index) => ({
            id: `fresh_${startIndex + index}`,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || undefined,
            category: q.category,
            difficulty: q.difficulty,
          }));

          // If we don't have enough from API, supplement with hardcoded questions
          if (formattedQuestions.length < questionsNeeded) {
            const additionalNeeded =
              questionsNeeded - formattedQuestions.length;
            const additionalQuestions = getTodaysQuestions(
              isProUser,
              gameNumber
            )
              .slice(
                formattedQuestions.length,
                formattedQuestions.length + additionalNeeded
              )
              .map((q) => ({
                ...q,
                explanation: q.explanation || undefined,
              }));
            formattedQuestions.push(...additionalQuestions);
          }
        } else {
          // No API questions available, use fallback
          console.log("📚 Using fallback trivia questions");
          formattedQuestions = getTodaysQuestions(isProUser, gameNumber).map(
            (q) => ({
              ...q,
              explanation: q.explanation || undefined,
            })
          );
        }

        console.log(
          `✅ Loaded ${formattedQuestions.length} trivia questions for Game ${gameNumber} (${isProUser ? "Pro" : "Free"} user)`
        );
        setQuestions(formattedQuestions);
        setGameState("playing");
        setErrorMessage(null);
        // Initialize option refs array
        optionRefs.current = new Array(
          formattedQuestions[0]?.options.length || 4
        ).fill(null);
      } catch (error) {
        console.error("❌ Failed to load trivia questions:", error);
        setErrorMessage(
          "Failed to load questions from server. Using backup questions."
        );
        // Fallback to hardcoded questions
        const fallbackQuestions = getTodaysQuestions(isProUser, currentGame);
        setQuestions(fallbackQuestions);
        setGameState("playing");
        optionRefs.current = new Array(
          fallbackQuestions[0]?.options.length || 4
        ).fill(null);
      }
    };

    if (gameState === "loading") {
      loadQuestions();
    }
  }, [gameState, isProUser, currentGame]);

  const handleAnswerSelect = useCallback(
    (answerIndex: number) => {
      if (selectedAnswer !== null) return;

      setSelectedAnswer(answerIndex);
      setShowExplanation(true);
      setFocusedOptionIndex(null);

      if (answerIndex === questions[currentQuestionIndex].correctAnswer) {
        setScore((prev) => prev + 1);
      }

      // Focus next button after a short delay for screen readers
      setTimeout(() => {
        nextButtonRef.current?.focus();
        explanationRef.current?.focus();
      }, 100);
    },
    [selectedAnswer, questions, currentQuestionIndex]
  );

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setFocusedOptionIndex(null);
      // Focus first option on next question
      setTimeout(() => {
        optionRefs.current[0]?.focus();
      }, 100);
    } else {
      // Game completed - update stats
      updateTriviaStats(score, questions.length);

      // Increment games completed today
      const newGamesCompleted = gamesCompletedToday + 1;
      setGamesCompletedToday(newGamesCompleted);
      saveGamesCompletedToday(newGamesCompleted);

      setGameState("completed");
      onGameComplete?.(score, questions.length);
    }
  }, [
    currentQuestionIndex,
    questions.length,
    score,
    onGameComplete,
    gamesCompletedToday,
    questions,
  ]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, optionIndex: number) => {
      if (selectedAnswer !== null) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNextQuestion();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const nextIndex =
            optionIndex < questions[currentQuestionIndex].options.length - 1
              ? optionIndex + 1
              : 0;
          setFocusedOptionIndex(nextIndex);
          optionRefs.current[nextIndex]?.focus();
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prevIndex =
            optionIndex > 0
              ? optionIndex - 1
              : questions[currentQuestionIndex].options.length - 1;
          setFocusedOptionIndex(prevIndex);
          optionRefs.current[prevIndex]?.focus();
          break;
        }
        case "Enter":
        case " ":
          e.preventDefault();
          handleAnswerSelect(optionIndex);
          break;
      }
    },
    [
      selectedAnswer,
      questions,
      currentQuestionIndex,
      handleAnswerSelect,
      handleNextQuestion,
    ]
  );

  const handleRestart = useCallback(() => {
    // Reset current game
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowExplanation(false);
    setGameState("loading");
  }, []);

  // Start next game (for pro users with games remaining)
  const handleNextGame = useCallback(() => {
    if (isProUser && gamesCompletedToday < 3) {
      const nextGame = gamesCompletedToday + 1;
      setCurrentGame(nextGame);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setShowExplanation(false);
      setGameState("loading");
    }
  }, [isProUser, gamesCompletedToday]);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  if (gameState === "loading") {
    return (
      <div
        className="trivia-game"
        role="status"
        aria-live="polite"
        aria-label="Loading trivia game"
      >
        <div className="trivia-loading">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Loading trivia questions...</p>
        </div>
      </div>
    );
  }

  if (gameState === "error") {
    return (
      <div className="trivia-game" role="alert">
        <div className="trivia-error">
          <h3>Error Loading Game</h3>
          <p>{errorMessage || "Something went wrong. Please try again."}</p>
          <button className="btn-primary" onClick={handleRestart}>
            Try Again
          </button>
          {onClose && (
            <button className="btn-secondary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (gameState === "completed") {
    const percentage = Math.round((score / questions.length) * 100);
    const canPlayNextGame = isProUser && gamesCompletedToday < 3;
    const gamesRemaining = isProUser ? 3 - gamesCompletedToday : 0;

    return (
      <div className="trivia-game" role="region" aria-label="Game completed">
        <div className="trivia-completed">
          <h3>🎉 Game {gamesCompletedToday} Complete!</h3>
          {isProUser && (
            <p className="game-progress">Game {gamesCompletedToday} of 3</p>
          )}
          <div className="score-display">
            <div
              className="score-circle"
              role="img"
              aria-label={`Score: ${score} out of ${questions.length} correct, ${percentage} percent`}
            >
              <span
                className={`score-percentage ${getScoreColor(percentage)}`}
                aria-hidden="true"
              >
                {percentage}%
              </span>
              <span className="score-fraction" aria-hidden="true">
                {score}/{questions.length}
              </span>
            </div>
          </div>

          <div className="score-message">
            {percentage >= 80 && (
              <p>🏆 Excellent! You&apos;re a movie trivia master!</p>
            )}
            {percentage >= 60 && percentage < 80 && (
              <p>👍 Good job! You know your movies!</p>
            )}
            {percentage < 60 && (
              <p>📚 Keep watching! You&apos;ll get better!</p>
            )}
          </div>

          <div className="completion-actions">
            {canPlayNextGame ? (
              <button
                className="btn-primary"
                onClick={handleNextGame}
                aria-label={`Play Game ${gamesCompletedToday + 1}, ${gamesRemaining} games remaining`}
              >
                <span className="btn-text-responsive">
                  Play Game {gamesCompletedToday + 1}
                </span>
                <span className="btn-text-responsive-mobile">
                  Game {gamesCompletedToday + 1}
                </span>
                <span className="btn-text-small">({gamesRemaining} left)</span>
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={handleRestart}
                aria-label="Play again"
              >
                Play Again
              </button>
            )}
            {onClose && (
              <button
                className="btn-secondary"
                onClick={onClose}
                aria-label="Close trivia game"
              >
                Close
              </button>
            )}
          </div>

          {!isProUser && (
            <div className="pro-upsell">
              <p>
                🔒 Get Pro for 2 more games! Upgrade to play 3 games per day
                instead of 1.
              </p>
            </div>
          )}
          {isProUser && gamesCompletedToday >= 3 && (
            <div className="games-limit">
              <p>
                ✅ You&apos;ve completed all 3 games today! Come back tomorrow
                for more!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Safety check - don't render if no questions or current question is undefined
  if (!questions.length || !currentQuestion) {
    return (
      <div className="trivia-game">
        <div className="trivia-header">
          <h3>🧠 Daily Trivia</h3>
        </div>
        <div className="trivia-content">
          <p>Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trivia-game" role="main" aria-label="Trivia game">
      {/* Error message banner */}
      {errorMessage && (
        <div className="trivia-error-banner" role="alert" aria-live="polite">
          <span className="error-icon" aria-hidden="true">
            ⚠️
          </span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Game progress indicator (for pro users) */}
      {isProUser && (
        <div
          className="trivia-game-header"
          aria-label={`Game ${currentGame} of 3`}
        >
          <span>Game {currentGame} of 3</span>
          {gamesCompletedToday > 0 && (
            <span
              className="games-completed"
              aria-label={`${gamesCompletedToday} games completed today`}
            >
              ({gamesCompletedToday} completed)
            </span>
          )}
        </div>
      )}

      {/* Progress indicator */}
      <div
        className="trivia-progress"
        role="progressbar"
        aria-valuenow={currentQuestionIndex + 1}
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-label={`Question ${currentQuestionIndex + 1} of ${questions.length}`}
      >
        <span aria-hidden="true">
          {currentQuestionIndex + 1}/{questions.length}
        </span>
        <div className="progress-bar" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="trivia-question">
        <div className="question-meta" aria-hidden="true">
          <span className="category">{currentQuestion.category}</span>
          <span
            className="difficulty"
            aria-label={`Difficulty: ${currentQuestion.difficulty}`}
          >
            {currentQuestion.difficulty}
          </span>
        </div>
        <h4 id="trivia-question-text">{currentQuestion.question}</h4>
      </div>

      {/* Options */}
      <div
        className="trivia-options"
        role="radiogroup"
        aria-labelledby="trivia-question-text"
        aria-required="true"
      >
        {currentQuestion.options.map((option, index) => {
          let className = "option-btn";
          const isCorrect = index === currentQuestion.correctAnswer;
          const isSelected = index === selectedAnswer;
          const isDisabled = selectedAnswer !== null;

          if (selectedAnswer !== null) {
            if (isCorrect) {
              className += " correct";
            } else if (isSelected && !isCorrect) {
              className += " incorrect";
            } else {
              className += " disabled";
            }
          }

          let ariaLabel = option;
          if (selectedAnswer !== null) {
            if (isCorrect) {
              ariaLabel = `${option} - Correct answer`;
            } else if (isSelected) {
              ariaLabel = `${option} - Incorrect answer`;
            } else {
              ariaLabel = `${option} - Not selected`;
            }
          }

          return (
            <button
              key={index}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              className={className}
              onClick={() => handleAnswerSelect(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={isDisabled}
              role="radio"
              aria-checked={isSelected}
              aria-label={ariaLabel}
              aria-describedby={
                isDisabled && !isSelected ? "disabled-explanation" : undefined
              }
              tabIndex={
                focusedOptionIndex === index ||
                (focusedOptionIndex === null && index === 0)
                  ? 0
                  : -1
              }
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Disabled explanation tooltip */}
      {selectedAnswer !== null && (
        <div id="disabled-explanation" className="sr-only">
          Other options are disabled because you have already selected an answer
        </div>
      )}

      {/* Explanation */}
      {showExplanation && currentQuestion.explanation && (
        <div
          ref={explanationRef}
          className="trivia-explanation"
          role="region"
          aria-live="polite"
          aria-label="Explanation"
          tabIndex={-1}
        >
          <p>{currentQuestion.explanation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="trivia-actions">
        {selectedAnswer !== null && (
          <button
            ref={nextButtonRef}
            className="btn-primary"
            onClick={handleNextQuestion}
            aria-label={
              currentQuestionIndex < questions.length - 1
                ? "Go to next question"
                : "Finish quiz"
            }
          >
            <span className="btn-text-responsive">
              {currentQuestionIndex < questions.length - 1
                ? "Next Question"
                : "Finish Quiz"}
            </span>
            <span className="btn-text-responsive-mobile">
              {currentQuestionIndex < questions.length - 1 ? "Next" : "Finish"}
            </span>
          </button>
        )}

        {onClose && (
          <button
            className="btn-secondary"
            onClick={onClose}
            aria-label="Close trivia game"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
