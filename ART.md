# Pixelgrafik und Animation

## Markus Rühl

`dist/assets/ruhl-atlas.png` enthält sechs eigens für das Spiel generierte Pixel-Sprites.
Die Fotoreferenzen dienen der Ähnlichkeit: kurze helle Haare, markantes rasiertes Gesicht,
massige Schultern und Arme, schwarzer Stringer und rote Shorts. Die Fotos selbst werden
nicht mit dem Spiel ausgeliefert.

- [Referenz für Gesicht und Körperbau](https://tikkaykhan.com/wp-content/uploads/2023/06/Markus-Ruhl-2.webp)
- [Referenz für die Doppelbizeps-Pose](https://i.pinimg.com/originals/2f/8b/f7/2f8bf7cca07d208f8fecce9e3c6e03f4.jpg)

Der transparente PNG-Atlas misst 1536 × 1024 Pixel, angeordnet in drei Spalten und
zwei Reihen mit jeweils 512 × 512 Pixeln. Die obere Reihe enthält Stand und zwei
Laufphasen, die untere Sprung, Kraftaktion und Siegerpose. Die Fußlinie liegt bei
y=496 innerhalb einer Zelle. `art.mjs` übernimmt Ausschnitt, Blickrichtung,
Animation und die Darstellung ohne Bildglättung. Der Kopf in der Bankdrück-Sequenz
stammt aus demselben Atlas.

## Shakes und Bankdrücken

Die Shakes werden auf einem Pixelraster gezeichnet: breiter Klappdeckel, transparenter
Becher, cremige Füllung, Messstriche und WHEY-Etikett.

Die Bankdrück-Szene wird in jedem Frame neu gezeichnet. Schulter, Ellenbogen und
Handgelenk bilden zwei verbundene Armsegmente; die Hände folgen derselben Hantel.
Die Zeitkurve in `bench.mjs` steuert kontrolliertes Absenken, Pause auf der Brust,
Hochdrücken und drei vollständige Wiederholungen. Hintergrund, Bank, Rack,
Hantelscheiben und Körper sind Canvas-Grafik. Die Spielgrafik zeigt pro Level
100, 140 und 180 kg als Teil des Spielablaufs.

Die eigentliche Spielzeit und Ressourcen bleiben während der Szene stehen. Pause
friert auch die Animation ein. Reduzierte Bewegung deaktiviert Kamerazoom,
Gewichtszittern und Kreidepartikel; die eigentliche Übung bleibt sichtbar.
