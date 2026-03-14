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
  promptText: string;
  copyPromptBtn: string;
  copiedBtn: string;
  sections: FAQSection[];
};

export default function FAQPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("en");
  const [openIndex, setOpenIndex] = useState<string | null>("sec-0-item-0");
  const [isCopied, setIsCopied] = useState(false);

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
      promptText: `Role: You are an Instructional Design Expert and a specialist in Active Recall methodology. Your task is to transform raw questions and source materials into a high-quality set of educational flashcards.

Objective: Create a database of Questions and Answers (Question | Answer) based on the provided list of questions and the attached presentation/document.

Execution Instructions (Step-by-Step):
1. Analysis and Correction: Read each question from the list. Correct any linguistic, spelling, or punctuation errors. If a question is vague, rephrase it to be specific while maintaining the original intent.
2. Content Development: Answer each question, treating the content of the attached presentation/document as the primary source of truth.
3. Filling Gaps: If the presentation does not contain the answer, use your broad expert knowledge to provide a full, factually correct, and comprehensive response.
4. Stylistics: Answers must be specific yet exhaustive (leaving no room for doubt). Use professional terminology appropriate to the subject matter.

CRITICAL FORMATTING RULES (Constraint Checklist):
- Generate ONLY one code block labeled as "plaintext".
- Each line must strictly follow the format: Question | Answer
- Absolute ban on using Markdown formatting inside the block (no bolding, italics, bullet points, or headers).
- Do not add any introduction, acknowledgments, comments, or summaries before or after the code block.
- Do not use quotation marks for entire lines.
- Write mathematical or technical formulas in LaTeX format (e.g., $E=mc^2$).
- Images: If the context allows, you may use the syntax: [img: URL].

Example of structure inside the block:
How do we define the data aggregation process? | Aggregation is the process of combining scattered data into a single entity to obtain synthetic information, such as sums or averages.
What is the formula for the area of a circle? | The area of a circle is expressed by the formula $P = \pi r^2$. [img: https://link-to-image.com/circle.png]

The input data is provided below. Process it according to the instructions above.

QUESTIONS:
[PASTE YOUR QUESTIONS HERE]`,
      copyPromptBtn: "Copy Prompt",
      copiedBtn: "Copied!",
      sections: [
        {
          title: "General Usage",
          icon: <Settings2 className="w-5 h-5" />,
          items: [
            {
              question: "How do I import existing flashcards?",
              answer:
                "Currently, you can import flashcards by dragging and dropping a .txt file onto the dashboard, or clicking the drop zone to select a file. The file should be formatted with 'Question | Answer' on each line.",
            },
            {
              question: "Is my data stored securely?",
              answer:
                "Yes! LetMeCook is a local-first application. By default, your decks are stored directly in your browser's local storage. If you choose to create an account, your progress is synced securely to our database.",
            },
            {
              question: "How does the Spaced Repetition work?",
              answer:
                "When you review cards, you rate how difficult they were. Cards you find hard will appear more frequently, while easy cards will be shown less often, optimizing your study time.",
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
                    When creating flashcards from your professor's presentations
                    or your own notes, aim for highly specific questions for
                    every definition, structural model, and complex concept.
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Break it down:</strong> Don't create one massive
                      flashcard for a large topic. Break it into atomic,
                      bite-sized questions.
                    </li>
                    <li>
                      <strong>Question formats:</strong> Use clear context.
                      Instead of "Mitochondria", use "What is the primary
                      function of the Mitochondria?".
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
                  flashcards from your professor's materials,{" "}
                  <strong>
                    you MUST uncheck the "Allow data training" option in your
                    LLM settings.
                  </strong>{" "}
                  This ensures the ethical use of academic materials and
                  protects your professor's Intellectual Property (IP) from
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
      promptTitle: "Generator zapytań AI",
      promptDescription:
        "Skopiuj poniższe zapytanie do swojego ulubionego modelu językowego (LLM), aby automatycznie wygenerować fiszki ze swoich notatek.",
      promptText: `Rola: Jesteś ekspertem ds. projektowania instruktażowego (Instructional Design) oraz specjalistą od metodologii Active Recall. Twoim zadaniem jest przekształcenie surowych pytań i materiałów źródłowych w wysokiej jakości zestaw fiszek do nauki.

Cel zadania: Stworzenie bazy pytań i odpowiedzi (Pytanie | Odpowiedź) na podstawie dostarczonej listy pytań oraz treści załączonej prezentacji/dokumentu.

Instrukcje wykonawcze (Krok po kroku):
1. Analiza i korekta: Przeczytaj każde pytanie z listy. Popraw błędy językowe, ortograficzne i interpunkcyjne. Jeśli pytanie jest niejasne, sformułuj je tak, aby było konkretne, zachowując pierwotny sens.
2. Opracowanie merytoryczne: Odpowiedz na każde pytanie, traktując treść załączonej prezentacji jako priorytetowe źródło prawdy. 
3. Uzupełnienie luk: Jeśli prezentacja nie zawiera odpowiedzi, wykorzystaj swoją szeroką wiedzę ekspercką, aby udzielić pełnej, poprawnej merytorycznie i wyczerpującej odpowiedzi.
4. Stylistyka: Odpowiedzi muszą być konkretne, ale wyczerpujące (bez niedomówień). Używaj profesjonalnej terminologii.

KRYTYCZNE ZASADY FORMATOWANIA (Constraint Checklist):
- Wygeneruj wyłącznie jeden blok kodu oznaczony jako "plaintext".
- Każdy wiersz musi ściśle trzymać się schematu: Pytanie | Odpowiedź
- Całkowity zakaz używania formatowania Markdown wewnątrz bloku (brak pogrubień, kursywy, list punktowanych, nagłówków).
- Zakaz dodawania jakiegokolwiek wstępu, podziękowań, komentarzy czy podsumowań przed i po bloku kodu.
- Zakaz używania cudzysłowów dla całych linii.
- Wzory matematyczne/techniczne zapisuj w formacie LaTeX (np. $E=mc^2$).
- Obrazy: Jeśli kontekst na to pozwala, możesz użyć składni: [img: URL].

Przykład struktury wewnątrz bloku:
Jak definiujemy proces agregacji? | Agregacja to proces łączenia rozproszonych danych w jedną całość w celu uzyskania syntetycznych informacji, np. sumy lub średniej.
Wzór na pole koła? | Pole koła wyraża się wzorem $P = \pi r^2$. [img: https://link-do-obrazka.pl/kolo.png]

Poniżej znajdują się dane wejściowe. Przetwórz je zgodnie z powyższymi instrukcjami.

PYTANIA:
[TUTAJ WKLEJ SWOJE PYTANIA]`,
      copyPromptBtn: "Skopiuj zapytanie",
      copiedBtn: "Skopiowano!",
      sections: [
        {
          title: "Podstawowe użytkowanie",
          icon: <Settings2 className="w-5 h-5" />,
          items: [
            {
              question: "Jak zaimportować istniejące fiszki?",
              answer:
                "Obecnie możesz importować fiszki, przeciągając i upuszczając plik .txt na panel główny lub klikając obszar zrzutu, aby wybrać plik. Twój plik powinien być sformatowany jako 'Pytanie | Odpowiedź' w każdej linijce.",
            },
            {
              question: "Czy moje dane są bezpieczne?",
              answer:
                "Tak! LetMeCook to aplikacja działająca lokalnie (local-first). Domyślnie Twoje talie są zapisywane bezpośrednio w pamięci przeglądarki. Jeśli zdecydujesz się założyć konto, Twoje postępy będą bezpiecznie synchronizowane z naszą bazą danych.",
            },
            {
              question:
                "Jak działa algorytm Spaced Repetition (Powtórki w odstępach)?",
              answer:
                "Podczas przeglądania kart oceniasz, jak trudne były. Karty, które uznasz za trudne, będą pojawiać się częściej, podczas gdy łatwe karty będą wyświetlane rzadziej, co optymalizuje czas Twojej nauki.",
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
                      kontekstu. Zamiast 'Mitochondria', zapytaj 'Jaka jest
                      główna funkcja mitochondriów?'.
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

  const t = content[language];

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "pl" : "en"));
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
              {t.header}
            </h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              {t.description}
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
          {t.languageToggle}
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
            {t.promptTitle}
          </h2>
          <p className="text-muted-foreground text-sm">{t.promptDescription}</p>
        </div>
        <div className="p-6">
          <div className="bg-muted p-4 rounded-xl font-mono text-sm leading-relaxed mb-4 whitespace-pre-wrap text-foreground/80 overflow-x-auto">
            {t.promptText}
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => handleCopyPrompt(t.promptText)}
              variant={isCopied ? "default" : "secondary"}
              className={`gap-2 transition-all ${isCopied ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
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
        <h3 className="text-xl font-medium mb-2">{t.readyToStart}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {t.readyDescription}
        </p>
        <Button
          onClick={() => router.push("/")}
          size="lg"
          className="rounded-full px-8"
        >
          {t.goDashboardBtn}
        </Button>
      </motion.div>
    </div>
  );
}
