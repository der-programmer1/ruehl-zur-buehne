# Rühl zur Bühne

**Drei Levels. Ein Pokal. Volle Masse.**

[Im Browser spielen](https://der-programmer1.github.io/ruehl-zur-buehne/)

Ein inoffizielles Fan-Jump’n’Run mit einem selbst gezeichneten Pixel-Markus Rühl.
Sammle Proteinshakes, setze deinen Pump gegen Kisten und Cardio-Bots ein und
erreiche die Wettkampfbühne. Dort brauchst du 100 Pump für deine Siegerpose.

## Spielen

| Aktion | Tastatur | Handy |
| --- | --- | --- |
| Laufen | A/D oder Pfeiltasten | LINKS / RECHTS halten |
| Springen | Leertaste, W oder Pfeil hoch | SPRUNG halten |
| Kraftaktion / Siegerpose | E | PUMP |
| Pause | Esc oder Pausentaste | Pausentaste |

- Ein Shake liefert 25 Pump und 100 Punkte. Eine Kraftaktion kostet 25 Pump.
- Die Spender laden deine Leiste automatisch nach, wenn du daneben stehen bleibst.
- Drei Leben pro Level, Checkpoints und kurze Schutzzeit nach Treffern.
- Checkpoints stellen bei einem Sturz Ressourcen, Kisten und Shakes gemeinsam wieder her.
- Ein verlorenes Level lässt sich neu beginnen; der komplette Lauf ebenfalls.
- Auf der letzten Bühne bei 100 Pump die Kraftaktion für die Siegerpose drücken.
- Bestwert und Ton werden unter `ruehl-zur-buehne:v1` lokal gespeichert. Das Spiel
  bleibt auch bei gesperrtem Browser-Speicher spielbar. Keine Anmeldung, Server-Datenbank
  oder gemeinsame Rangliste. Sound ist zunächst aus und kann eingeschaltet werden.

## Technik und Prüfung

Statisches HTML, CSS und JavaScript mit Canvas und Web Audio, ohne Laufzeit-Abhängigkeiten.
Alle Bilder, Pixelzeichnungen und Schriften werden lokal ausgeliefert. Die Pixel-Figur,
Umgebungen und Effekte werden direkt auf dem Canvas gezeichnet. Die drei Level sind
fest gestaltet. Texte und synthetische Geräusche sind für dieses Spiel erstellt.

Mit Node.js 22 oder neuer:

```sh
npm run check
npm test
python3 -m http.server 8080 --directory dist
```

Die Tests prüfen Ressourcen, Kollisionen, Gegner, Checkpoints, Niederlage, Pause,
Levelwechsel, Siegerpose, Mehrfinger-Eingaben und Browser-Speicher. Ein automatischer
Pilot durchläuft die vollständige Kampagne ohne Teleportieren oder zusätzliche Ressourcen.
GitHub Actions prüft Änderungen und veröffentlicht `dist/` nach einem Push auf `main`.
Relative Assetpfade unterstützen den GitHub-Pages-Unterpfad.

## Schriften

Space Grotesk und IBM Plex Mono stehen unter der SIL Open Font License.
Die zugehörigen Lizenzdateien liegen in `dist/assets/`. Die Bestwerte bleiben im Browser;
GitHub Pages verarbeitet technische Zugriffsdaten gemäß seiner Datenschutzerklärung.
