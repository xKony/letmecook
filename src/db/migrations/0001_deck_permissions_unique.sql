CREATE UNIQUE INDEX "deck_permissions_deck_user_uidx" ON "deck_permissions" USING btree ("deck_id","user_id");
