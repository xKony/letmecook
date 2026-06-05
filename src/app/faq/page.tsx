"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ArrowLeft,
  HelpCircle,
  Copy,
  Check,
  Languages,
  BookOpen,
  Settings2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { LatexRenderer } from "@/components/latex-renderer";
import { useApp } from "@/lib/app-context";

type Language = "en" | "pl";

type FAQSection = {
  title: string;
  icon: React.ReactNode;
  items: { question: string; answer: React.ReactNode }[];
};

type ContentDict = {
  header: string;
  description: string;
  languageToggle: string;
  readyToStart: string;
  readyDescription: string;
  goDashboardBtn: string;
  promptTitle: string;
  promptDescription: string;
  promptTextTemplate: string;
  subjectLabel: string;
  subjectPlaceholder: string;
  notesLabel: string;
  notesPlaceholder: string;
  questionsLabel: string;
  questionsPlaceholder: string;
  copyPromptBtn: string;
  copiedBtn: string;
  showMoreBtn: string;
  showLessBtn: string;
  sections: FAQSection[];
};

export default function FAQPage() {
  const router = useRouter();
  const { language, setLanguage, t: globalT } = useApp();
  const faqLang = language as Language;
  const [openIndex, setOpenIndex] = useState<string | null>("sec-0-item-0");
  const [isCopied, setIsCopied] = useState(false);
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);

  // States for prompt builder
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [questions, setQuestions] = useState("");

  const getFormattedPrompt = () => {
    const template = t.promptTextTemplate;
    let formatted = template;

    if (faqLang === "pl") {
      formatted = formatted
        .replace("{PRZEDMIOT}", subject.trim() || "{PRZEDMIOT}")
        .replace("{DODATKOWE_NOTATKI}", notes.trim() || "{DODATKOWE_NOTATKI}")
        .replace("[TUTAJ WKLEJ SWOJE PYTANIA]", questions.trim() || "[TUTAJ WKLEJ SWOJE PYTANIA]");
    } else {
      formatted = formatted
        .replace("{PRZEDMIOT}", subject.trim() || "{PRZEDMIOT}")
        .replace("{DODATKOWE_NOTATKI}", notes.trim() || "{DODATKOWE_NOTATKI}")
        .replace("[PASTE YOUR QUESTIONS HERE]", questions.trim() || "[PASTE YOUR QUESTIONS HERE]");
    }

    return formatted;
  };

  const toggleFaq = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  const handleCopyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const content: Record<Language, ContentDict> = {
    en: {
      header: "FAQ & Study Guide",
      description:
        "Everything you need to know about using LetMeCook effectively.",
      languageToggle: "Polski",
      readyToStart: "Ready to start?",
      readyDescription:
        "Head back to the dashboard to create your first deck or import an existing one.",
      goDashboardBtn: "Go to Dashboard",
      promptTitle: "AI Prompt Generator",
      promptDescription:
        "Use this prompt with your favorite LLM to automatically generate flashcards from your notes.",
      subjectLabel: "Subject Name (Optional)",
      subjectPlaceholder: "e.g., Biochemistry, Calculus II",
      notesLabel: "Additional Comments (Optional)",
      notesPlaceholder: "e.g., Focus on Krebs cycle, skip section 4",
      questionsLabel: "Your Questions / Raw Notes",
      questionsPlaceholder: "Paste your questions here (one per line) or raw text...",
      promptTextTemplate: `Role: You are an Instructional Design Expert and a specialist in Active Recall methodology. Your task is to transform raw questions and source materials into a high-quality set of educational flashcards.

Context (optional):
Subject name: {PRZEDMIOT}
Additional comments for the deck: {DODATKOWE_NOTATKI}

(If the context fields are empty, ignore them and rely solely on universal rules of logic for the provided questions).

Objective: Create a database of questions and answers based on the provided list of questions and the content of the attached materials. If a context is defined, take into account the specifics of the subject or additional guidelines.

Execution Instructions (Step-by-Step):
1. Analysis and Correction: Read each question from the list. Correct any linguistic, spelling, or punctuation errors. If a question is vague, rephrase it to be specific while maintaining the original intent.
2. Content Development: Answer each question, treating the content of the attached materials as the primary source of truth.
3. Filling Gaps: If the presentation/document does not contain the answer, use your broad expert knowledge to provide a full, factually correct, and comprehensive response.
4. Stylistics: Answers must be specific yet exhaustive (leaving no room for doubt). Use professional terminology.

CRITICAL FORMATTING RULES (Constraint Checklist):
- Generate ONLY one code block labeled as "json".
- The result must be a valid array of objects with keys: "question", "answer", and optionally "image".
- Absolute ban on adding any introduction, acknowledgments, comments, or summaries before or after the JSON block.
- Write mathematical/technical formulas in LaTeX format inside JSON strings (e.g., $E=mc^2$ or for blocks $$...$$).
- Remember to properly format the JSON — in particular, double-escape characters in LaTeX commands (e.g., \\\\frac, \\\\pi).
- The only allowed formatting inside string values (besides LaTeX equations) is indeed bold (**text**), italics (*text*), and newline characters (\\\\n) if needed. Do not use other formatting types like bullet points, numbered lists, or headers.

Examples of expected output structure:
[
  {
    "question": "What is the mitochondria?",
    "answer": "The powerhouse of the cell, responsible for generating ATP.",
    "image": "https://images.unsplash.com/photo.png"
  },
  {
    "question": "Who painted the Mona Lisa?",
    "answer": "Leonardo da Vinci",
    "image": "https://i.imgur.com/image.jpg"
  },
  {
    "question": "Wzór na pole koła o promieniu $r$?",
    "answer": "Wzór to $P = \\\\pi r^2$.",
    "image": "https://example.com/circle.png"
  },
  {
    "question": "Jakie są pierwiastki równania kwadratowego $ax^2 + bx + c = 0$?",
    "answer": "Pierwiastki wyznaczamy ze wzoru: $$x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a}$$"
  },
  {
    "question": "Zapisz definicję całki oznaczonej Newtona-Leibniza w bloku LaTeX.",
    "answer": "Całka oznaczona reprezentuje pole pod wykresem: $$\\int_{a}^{b} f(x) \\\\, dx = F(b) - F(a)$$"
  },
  {
    "question": "Jak zapisać ułamek $\\\\frac{a}{b}$ w LaTeX?",
    "answer": "We use the \`\\\\frac{a}{b}\` command, which we write in JSON with a double backslash as \`$\\\\frac{a}{b}$\`."
  }
]

Below is the input data. Process it according to the instructions above.

QUESTIONS:
[PASTE YOUR QUESTIONS HERE]`,
      copyPromptBtn: "Copy Prompt",
      copiedBtn: "Copied!",
      showMoreBtn: "Show more",
      showLessBtn: "Show less",
      sections: [
        {
          title: "General Usage",
          icon: <Settings2 className="w-5 h-5" />,
          items: [
            {
              question: "How do I import existing flashcards?",
              answer:
                "You can import flashcards by dragging and dropping a .json or .txt file onto the dashboard. We recommend using the JSON format for advanced features like images. Standard text files formatted with 'Question | Answer' on each line are also supported for backward compatibility.",
            },
            {
              question: "What is the recommended JSON format?",
              answer: (
                <div className="space-y-3">
                  <p>
                    The recommended format is a JSON array of objects. Each object should have <code>question</code>, <code>answer</code>, and an optional <code>image</code> key.
                  </p>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`[
  {
    "question": "What is 2+2?",
    "answer": "4",
    "image": "https://example.com/image.png"
  },
  {
    "question": "Formula for circle area?",
    "answer": "The formula is $P = \\\\pi r^2$."
  }
]`}
                  </pre>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    <strong>Note:</strong> In JSON, backslashes for LaTeX must be double-escaped (e.g., <code>\\\\pi</code> instead of <code>\\pi</code>).
                  </p>
                </div>
              ),
            },
            {
              question: "Is my data stored securely?",
              answer:
                "Yes! LetMeCook is a local-first application. By default, your decks are stored directly in your browser's local storage. If you choose to create an account, your progress is synced securely to our database.",
            },
            {
              question: "How does the mastery system work?",
              answer:
                "When you review cards, you rate how difficult they were. Your progress is tracked through levels (from New to Mastered), giving you a clear overview of which areas need more focus. While the current version doesn't automatically schedule reviews, it empowers you to filter and focus on specific mastery levels manually during your sessions.",
            },
          ],
        },
        {
          title: "Study Workflow Guide",
          icon: <BookOpen className="w-5 h-5" />,
          items: [
            {
              question: "What is Active Recall and why use it?",
              answer:
                "Active recall is a principle of efficient learning, which claims the need to actively stimulate memory during the learning process. It contrasts with passive review, in which the learning material is processed passively (e.g., by simply re-reading). Forcing your brain to retrieve information strengthens neural pathways, making future retrieval easier.",
            },
            {
              question: "How should I audit presentations and notes?",
              answer: (
                <div className="space-y-4">
                  <p>
                    When creating flashcards from your professor&apos;s presentations
                    or your own notes, aim for highly specific questions for
                    every definition, structural model, and complex concept.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Break it down:</strong> Don&apos;t create one massive
                      flashcard for a large topic. Break it into atomic,
                      bite-sized questions.
                    </li>
                    <li>
                      <strong>Question formats:</strong> Use clear context.
                      Instead of &quot;Mitochondria&quot;, use &quot;What is the primary
                      function of the Mitochondria?&quot;.
                    </li>
                    <li>
                      <strong>Visual models:</strong> If a concept relies
                      heavily on a structural model or diagram, use the image
                      feature (detailed below) to integrate it directly into the
                      flashcard.
                    </li>
                  </ul>
                </div>
              ),
            },
          ],
        },
        {
          title: "Technical Features",
          icon: <Sparkles className="w-5 h-5" />,
          items: [
            {
              question: "Does the app support mathematical equations?",
              answer: (
                <div className="space-y-3">
                  <p>
                    Yes, LetMeCook fully supports LaTeX and KaTeX formatting for
                    mathematical, statistical, and scientific equations.
                  </p>
                  <p>
                    You can write equations inline like this:{" "}
                    <code>$E=mc^2$</code>, or as block equations using double
                    dollar signs.
                  </p>
                  <div className="bg-muted p-4 rounded-lg text-center mt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Example Equation Render:
                    </p>
                    <LatexRenderer text="$I_{\chi}=\frac{\overline{x}_{1}}{\overline{x}_{0}}=\frac{\Sigma y_{1}}{\Sigma z_{1}}:\frac{\Sigma y_{0}}{\Sigma z_{0}}$" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground border-t border-border pt-2">
                    Note: Simply enclose your equation code within dollar signs
                    in your flashcard text file.
                  </p>
                </div>
              ),
            },
            {
              question: "Can I use images for visual learning?",
              answer:
                "Absolutely. You can include raw-format hosted images within questions or answers to study biological models, visual structures, or any relevant diagrams. Simply insert a direct image URL (such as a Dropbox link ending in `?raw=1` or an Imgur direct link like `i.imgur.com/image.png`). The application will automatically parse and display valid image URLs.",
            },
          ],
        },
        {
          title: "Ethical Considerations",
          icon: <AlertTriangle className="w-5 h-5" />,
          items: [
            {
              question: "Ethical AI Usage Disclaimer",
              answer: (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg text-amber-600 dark:text-amber-400">
                  <strong className="block mb-2 text-amber-700 dark:text-amber-300">
                    Important Note on Academic Integrity:
                  </strong>
                  When using AI tools (like ChatGPT, Claude, etc.) to generate
                  flashcards from your professor&apos;s materials,{" "}
                  <strong>
                    you MUST uncheck the &quot;Allow data training&quot; option in your
                    LLM settings.
                  </strong>{" "}
                  This ensures the ethical use of academic materials and
                  protects your professor&apos;s Intellectual Property (IP) from
                  being absorbed into public AI models without consent.
                </div>
              ),
            },
          ],
        },
      ],
    },
    pl: {
      header: "FAQ & Poradnik",
      description:
        "Wszystko, co musisz wiedzieć, aby skutecznie korzystać z LetMeCook.",
      languageToggle: "English",
      readyToStart: "Gotowy do nauki?",
      readyDescription:
        "Wróć do panelu głównego, aby utworzyć swoją pierwszą talię lub zaimportować istniejącą.",
      goDashboardBtn: "Przejdź do panelu głównego",
      promptTitle: "AI Prompt Generator",
      promptDescription:
        "Skopiuj poniższe zapytanie do swojego ulubionego modelu językowego (LLM), aby automatycznie wygenerować fiszki ze swoich notatek.",
      subjectLabel: "Nazwa przedmiotu (opcjonalnie)",
      subjectPlaceholder: "np. Biochemia, Analiza Matematyczna II",
      notesLabel: "Dodatkowe uwagi (opcjonalnie)",
      notesPlaceholder: "np. Skup się na cyklu Krebsa, pomiń rozdział 4",
      questionsLabel: "Twoje pytania / Surowe notatki",
      questionsPlaceholder: "Wklej tutaj swoje pytania (jedno w linii) lub surowy tekst...",
      promptTextTemplate: `Rola: Jesteś ekspertem ds. projektowania instruktażowego (Instructional Design) oraz specjalistą od metodologii Active Recall. Twoim zadaniem jest przekształcenie surowych pytań i materiałów źródłowych w wysokiej jakości zestaw fiszek do nauki.

Kontekst (opcjonalny):
Nazwa przedmiotu: {PRZEDMIOT}
Dodatkowe uwagi do zestawu: {DODATKOWE_NOTATKI}

(Jeśli pola kontekstu są puste, zignoruj je i opieraj się wyłącznie na uniwersalnych zasadach logiki dla podanych pytań).

Cel zadania: Stworzenie bazy pytań i odpowiedzi na podstawie dostarczonej listy pytań oraz treści załączonych materiałów. Jeśli zdefiniowano kontekst, uwzględnij specyfikę przedmiotu lub dodatkowe wytyczne.

Instrukcje wykonawcze (Krok po kroku):
1. Analiza i korekta: Przeczytaj każde pytanie z listy. Popraw błędy językowe, ortograficzne i interpunkcyjne. Jeśli pytanie jest niejasne, sformułuj je tak, aby było konkretne, zachowując pierwotny sens.
2. Opracowanie merytoryczne: Odpowiedz na każde pytanie, traktując treść załączonych materiałów jako priorytetowe źródło prawdy. 
3. Uzupełnienie luk: Jeśli prezentacja/dokument nie zawiera odpowiedzi, wykorzystaj swoją szeroką wiedzę ekspercką, aby udzielić pełnej, poprawnej merytorycznie i wyczerpującej odpowiedzi.
4. Stylistyka: Odpowiedzi muszą być konkretne, ale wyczerpujące (bez niedomówień). Używaj profesjonalnej terminologii.

KRYTYCZNE ZASADY FORMATOWANIA (Constraint Checklist):
- Wygeneruj wyłącznie jeden blok kodu oznaczony jako "json".
- Wynik musi być poprawną tablicą obiektów z kluczami: "question", "answer" oraz opcjonalnie "image".
- Całkowity zakaz dodawania jakiegokolwiek wstępu, podziękowań, komentarzy czy podsumowań przed i po bloku JSON.
- Wzory matematyczne/techniczne zapisuj w formacie LaTeX wewnątrz stringów JSON (np. $E=mc^2$ lub dla bloków $$...$$).
- Pamiętaj o poprawnym formatowaniu JSON — w szczególności o podwójnym uciekaniu znaków w komendach LaTeX (np. \\\\frac, \\\\pi).
- Jedyne dozwolone formatowanie tekstu wewnątrz wartości (poza równaniami LaTeX) to właśnie takie z pogrubieniami (**tekst**), kursywą (*tekst*) oraz znakami nowej linii (\\\\n) w razie potrzeby. Całkowity zakaz stosowania innych formatowań, w tym list punktowanych, numerowanych czy nagłówków.

Przykłady oczekiwanej struktury wyjściowej:
[
  {
    "question": "What is the mitochondria?",
    "answer": "The powerhouse of the cell, responsible for generating ATP.",
    "image": "https://images.unsplash.com/photo.png"
  },
  {
    "question": "Who painted the Mona Lisa?",
    "answer": "Leonardo da Vinci",
    "image": "https://i.imgur.com/image.jpg"
  },
  {
    "question": "Wzór na pole koła o promieniu $r$?",
    "answer": "Wzór to $P = \\\\pi r^2$.",
    "image": "https://example.com/circle.png"
  },
  {
    "question": "Jakie są pierwiastki równania kwadratowego $ax^2 + bx + c = 0$?",
    "answer": "Pierwiastki wyznaczamy ze wzoru: $$x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a}$$"
  },
  {
    "question": "Zapisz definicję całki oznaczonej Newtona-Leibniza w bloku LaTeX.",
    "answer": "Całka oznaczona reprezentuje pole pod wykresem: $$\\int_{a}^{b} f(x) \\\\, dx = F(b) - F(a)$$"
  },
  {
    "question": "Jak zapisać ułamek $\\\\frac{a}{b}$ w LaTeX?",
    "answer": "Używamy polecenia \`\\\\frac{a}{b}\`, co w JSON zapisujemy z podwójnym backslashem jako \`$\\\\frac{a}{b}$\`."
  }
]

Poniżej znajdują się dane wejściowe. Przetwórz je zgodnie z powyższymi instrukcjami.

PYTANIA:
[TUTAJ WKLEJ SWOJE PYTANIA]`,
      copyPromptBtn: "Skopiuj zapytanie",
      copiedBtn: "Skopiowano!",
      showMoreBtn: "Pokaż więcej",
      showLessBtn: "Pokaż mniej",
      sections: [
        {
          title: "Podstawowe użytkowanie",
          icon: <Settings2 className="w-5 h-5" />,
          items: [
            {
              question: "Jak zaimportować istniejące fiszki?",
              answer:
                "Obecnie możesz importować fiszki, przeciągając i upuszczając plik .txt na panel główny lub klikając obszar zrzutu, aby wybrać plik. Twój plik powinien być sformatowany jako &apos;Pytanie | Odpowiedź&apos; w każdej linijce.",
            },
            {
              question: "Czy moje dane są bezpieczne?",
              answer:
                "Tak! LetMeCook to aplikacja działająca lokalnie (local-first). Domyślnie Twoje talie są zapisywane bezpośrednio w pamięci przeglądarki. Jeśli zdecydujesz się założyć konto, Twoje postępy będą bezpiecznie synchronizowane z naszą bazą danych.",
            },
            {
              question: "Jak działa system opanowania materiału?",
              answer:
                "Podczas przeglądania kart oceniasz, jak trudne były. Twoje postępy są śledzone poprzez poziomy (od Nowych po Opanowane), co daje Ci jasny obraz tego, które obszary wymagają więcej uwagi. Choć obecna wersja nie planuje powtórek automatycznie, pozwala Ci na ręczne filtrowanie i skupienie się na konkretnych poziomach opanowania podczas sesji nauki.",
            },
          ],
        },
        {
          title: "Poradnik i metodyka nauki",
          icon: <BookOpen className="w-5 h-5" />,
          items: [
            {
              question: "Czym jest Active Recall (Aktywne przypominanie)?",
              answer:
                "Zasada aktywnego przypominania (Active recall) to metoda efektywnego uczenia się, która polega na aktywnym stymulowaniu pamięci podczas procesu nauki. Stanowi przeciwieństwo biernego powtarzania (np. poprzez zwykłe ponowne czytanie tekstu). Zmuszanie mózgu do wydobycia informacji z pamięci wzmacnia ścieżki neuronowe, ułatwiając przyszłe przypominanie.",
            },
            {
              question: "Jak audytować prezentacje i tworzyć notatki?",
              answer: (
                <div className="space-y-4">
                  <p>
                    Tworząc fiszki z prezentacji wykładowców lub własnych
                    notatek, staraj się projektować bardzo szczegółowe pytania
                    do każdej definicji, modelu strukturalnego i złożonego
                    pojęcia.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Rozbijaj materiał na części:</strong> Nie twórz
                      jednej, olbrzymiej fiszki na duży temat. Podziel go na
                      mniejsze, atomowe pytania.
                    </li>
                    <li>
                      <strong>Formatowanie pytań:</strong> Używaj jasnego
                      kontekstu. Zamiast &apos;Mitochondria&apos;, zapytaj &apos;Jaka jest
                      główna funkcja mitochondriów?&apos;.
                    </li>
                    <li>
                      <strong>Modele wizualne:</strong> Jeśli dana koncepcja w
                      dużej mierze opiera się na modelu strukturalnym lub
                      schemacie, użyj funkcji dodawania obrazów (opisanej
                      poniżej), aby zintegrować grafikę bezpośrednio z fiszką.
                    </li>
                  </ul>
                </div>
              ),
            },
          ],
        },
        {
          title: "Funkcje techniczne",
          icon: <Sparkles className="w-5 h-5" />,
          items: [
            {
              question: "Czy aplikacja obsługuje równania matematyczne?",
              answer: (
                <div className="space-y-3">
                  <p>
                    Tak, LetMeCook w pełni wspiera formatowanie LaTeX i KaTeX do
                    wyświetlania równań matematycznych, statystycznych i
                    naukowych.
                  </p>
                  <p>
                    Możesz zapisywać równania liniowo (inline) w ten sposób:{" "}
                    <code>$E=mc^2$</code>, lub jako bloki, używając podwójnych
                    znaków dolara.
                  </p>
                  <div className="bg-muted p-4 rounded-lg text-center mt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Przykładowe wyrenderowane równanie:
                    </p>
                    <LatexRenderer text="$I_{\chi}=\frac{\overline{x}_{1}}{\overline{x}_{0}}=\frac{\Sigma y_{1}}{\Sigma z_{1}}:\frac{\Sigma y_{0}}{\Sigma z_{0}}$" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground border-t border-border pt-2">
                    Uwaga: po prostu otocz kod Twojego równania znakami dolara w
                    pliku tekstowym z fiszkami.
                  </p>
                </div>
              ),
            },
            {
              question: "Czy mogę używać obrazów do nauki wzrokowej?",
              answer:
                "Jak najbardziej. Możesz zamieszczać surowe obrazy (raw-format) bezpośrednio w pytaniach i odpowiedziach, aby studiować m.in. modele biologiczne czy inne schematy. Wystarczy, że podasz na fiszce bezpośredni link do obrazka (np. udostępniony link z Dropboxa kończący się na `?raw=1` lub bezpośredni link z platformy Imgur: `i.imgur.com/image.png`). Aplikacja inteligentnie rozpozna poprawne adresy URL i wyrenderuje zamieszczone tam zdjęcia.",
            },
          ],
        },
        {
          title: "Kwestie etyczne",
          icon: <AlertTriangle className="w-5 h-5" />,
          items: [
            {
              question: "Zastrzeżenie do wykorzystania materiałów w AI",
              answer: (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg text-amber-600 dark:text-amber-400">
                  <strong className="block mb-2 text-amber-700 dark:text-amber-300">
                    Ważna uwaga dotycząca uczciwości akademickiej:
                  </strong>
                  Korzystając z narzędzi sztucznej inteligencji (takich jak
                  ChatGPT, Claude itp.) do generowania fiszek na podstawie na
                  materiałów wprost z wykładów Twojego profesora (np.
                  prezentacji z zajęć),{" "}
                  <strong>
                    MUSISZ odznaczyć opcję „Allow data training” (zezwól na
                    wykorzystanie danych do trenowania modelu) w ustawieniach na
                    swoim koncie.
                  </strong>{" "}
                  Ma to na w celu egzekwowanie etycznego wykorzystania tych
                  materiałów naukowych - chroni to własność intelektualną (tzw.
                  IP) danego profesora przed wchłonięciem w bazę modeli AI bez
                  jego wiedzy i zgody.
                </div>
              ),
            },
          ],
        },
      ],
    },
  };

  const t = content[faqLang];

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "pl" : "en");
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-12 mt-4 md:mt-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
              <HelpCircle className="w-7 h-7 md:w-10 md:h-10 text-primary hidden sm:block" />
              {globalT("faq.header")}
            </h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              {globalT("faq.description")}
            </p>
          </div>
        </div>

        {/* Language Toggle */}
        <Button
          variant="outline"
          onClick={toggleLanguage}
          className="gap-2 min-w-[100px]"
        >
          <Languages className="w-4 h-4" />
          {globalT("faq.languageToggle")}
        </Button>
      </div>

      {/* Prompt Generator Component */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
      >
        <div className="p-6 border-b border-border bg-muted/20">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {globalT("faq.promptTitle")}
          </h2>
          <p className="text-muted-foreground text-sm">{globalT("faq.promptDescription")}</p>
        </div>
        <div className="p-6">
          {/* Prompt Inputs/Builder */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="subject-input" className="text-xs font-semibold text-foreground/80">
                {t.subjectLabel}
              </label>
              <input
                id="subject-input"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t.subjectPlaceholder}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="notes-input" className="text-xs font-semibold text-foreground/80">
                {t.notesLabel}
              </label>
              <input
                id="notes-input"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-6">
            <label htmlFor="questions-input" className="text-xs font-semibold text-foreground/80">
              {t.questionsLabel}
            </label>
            <textarea
              id="questions-input"
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              placeholder={t.questionsPlaceholder}
              rows={4}
              className="w-full text-sm p-3 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono resize-y placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="relative">
            <motion.div
              animate={{ height: isPromptExpanded ? "auto" : "160px" }}
              transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="bg-muted p-4 rounded-xl font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground/80 overflow-hidden"
            >
              {getFormattedPrompt()}
            </motion.div>

            {!isPromptExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-muted to-transparent rounded-b-xl pointer-events-none" />
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPromptExpanded(!isPromptExpanded)}
              className="text-primary hover:text-primary/80 hover:bg-primary/10 gap-2 transition-colors order-2 sm:order-1"
            >
              <motion.div
                animate={{ rotate: isPromptExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
              {isPromptExpanded ? globalT("faq.showLessBtn") : globalT("faq.showMoreBtn")}
            </Button>

            <Button
              onClick={() => handleCopyPrompt(getFormattedPrompt())}
              variant={isCopied ? "default" : "secondary"}
              className={`w-full sm:w-auto gap-2 transition-all order-1 sm:order-2 ${isCopied ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isCopied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {t.copiedBtn}
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {t.copyPromptBtn}
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* FAQ Sections */}
      <div className="space-y-8">
        {t.sections.map((section, secIndex) => (
          <div key={`sec-${secIndex}`}>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-foreground/90 pl-1">
              {section.icon}
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.items.map((faq, itemIndex) => {
                const id = `sec-${secIndex}-item-${itemIndex}`;
                const isOpen = openIndex === id;

                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: secIndex * 0.1 + itemIndex * 0.05 }}
                    className={`border border-border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? "bg-card/80 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]" : "bg-card hover:border-primary/30"}`}
                  >
                    <button
                      onClick={() => toggleFaq(id)}
                      className="w-full text-left p-4 md:p-5 flex items-center justify-between focus:outline-none"
                    >
                      <h3
                        className={`text-base md:text-lg transition-colors duration-300 font-medium pr-8 ${isOpen ? "text-primary" : "text-foreground"}`}
                      >
                        {faq.question}
                      </h3>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className={`flex-shrink-0 transition-colors duration-300 ${isOpen ? "text-primary" : "text-muted-foreground"}`}
                      >
                        <ChevronDown className="w-5 h-5" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: 0.3,
                            ease: [0.04, 0.62, 0.23, 0.98],
                          }}
                        >
                          <div className="p-4 pt-0 md:p-5 md:pt-0 text-muted-foreground leading-relaxed text-sm md:text-base">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 text-center p-8 rounded-2xl bg-muted/30 border border-border backdrop-blur-sm"
      >
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-4">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-medium mb-2">{globalT("faq.readyToStart")}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {globalT("faq.readyDescription")}
        </p>
        <Button
          onClick={() => router.push("/")}
          size="lg"
          className="rounded-full px-8"
        >
          {globalT("faq.goDashboardBtn")}
        </Button>
      </motion.div>
    </div>
  );
}
