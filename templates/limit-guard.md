# Limit-guard instrukce pro tento projekt

Když claude-limit-guard ohlásí překročení prahu, proveď v tomto pořadí:

1. Dokonči rozdělaný atomický krok — nenech žádnou poloviční editaci.
2. Zapiš/aktualizuj handoff (`.claude/RESUME.md`): co je hotové, co zbývá,
   aktuální git větev, dosud změněné soubory, konkrétní další krok pro
   navázání, čas resetu limitu.
3. (Volitelné) Pokud jsme v git repu, commitni rozdělanou práci do větve.
4. Oznam mi, že práce je uložená a můžu vypnout PC.
5. Přestaň brát nové úkoly do resetu limitu.

<!-- Uprav tento postup podle povahy projektu. -->
