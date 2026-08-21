import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { AppProvider } from "@/lib/app-context";
import { DeckEditorSessionProvider } from "@/lib/deck-editor-session-context";
import { I18nProvider } from "@/lib/i18n-context";
import { auth } from "@/lib/auth";
import { Language } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LetMeCook - Active Recall Flashcards",
  description:
    "Learn smarter with active recall flashcards. Local-first, privacy-focused study app.",
  keywords: ["flashcards", "active recall", "study", "learning", "education"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const langCookie = (await cookies()).get("lang")?.value;
  const initialLanguage: Language = langCookie === "en" || langCookie === "pl" ? langCookie : "en";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <AuthProvider session={session}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <I18nProvider initialLanguage={initialLanguage}>
              <AppProvider initialSession={session}>
                <DeckEditorSessionProvider>{children}</DeckEditorSessionProvider>
              </AppProvider>
            </I18nProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
