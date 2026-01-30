import { pgTable, text, timestamp, boolean, uuid, primaryKey, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ============================================
// NextAuth.js Required Tables
// ============================================

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"),
    email: text("email").unique().notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    password: text("password"), // Hashed password for credentials provider
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
}, (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] })
]);

export const sessions = pgTable("sessions", {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
}, (vt) => [
    primaryKey({ columns: [vt.identifier, vt.token] })
]);

// ============================================
// Application Tables
// ============================================

export const decks = pgTable("decks", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    isPublic: boolean("is_public").default(false).notNull(),
    shareToken: text("share_token").unique(), // For private link sharing
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const flashcards = pgTable("flashcards", {
    id: uuid("id").defaultRandom().primaryKey(),
    deckId: uuid("deck_id").notNull().references(() => decks.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    level: text("level").default("Nowe").notNull(), // CardLevel type
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const deckPermissions = pgTable("deck_permissions", {
    id: uuid("id").defaultRandom().primaryKey(),
    deckId: uuid("deck_id").notNull().references(() => decks.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().$type<"viewer" | "editor">(), // Permission level
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ============================================
// Relations
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    sessions: many(sessions),
    decks: many(decks),
    deckPermissions: many(deckPermissions),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
    owner: one(users, {
        fields: [decks.ownerId],
        references: [users.id],
    }),
    flashcards: many(flashcards),
    permissions: many(deckPermissions),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
    deck: one(decks, {
        fields: [flashcards.deckId],
        references: [decks.id],
    }),
}));

export const deckPermissionsRelations = relations(deckPermissions, ({ one }) => ({
    deck: one(decks, {
        fields: [deckPermissions.deckId],
        references: [decks.id],
    }),
    user: one(users, {
        fields: [deckPermissions.userId],
        references: [users.id],
    }),
}));

// ============================================
// Type Exports
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Deck = typeof decks.$inferSelect;
export type NewDeck = typeof decks.$inferInsert;
export type Flashcard = typeof flashcards.$inferSelect;
export type NewFlashcard = typeof flashcards.$inferInsert;
export type DeckPermission = typeof deckPermissions.$inferSelect;
