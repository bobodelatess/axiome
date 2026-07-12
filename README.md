# AXIOME — Cockpit PSP

AXIOME est un système local de pilotage académique conçu pour une L2 Parcours Spécial Physique à l’Université Toulouse III. Son but n’est pas d’afficher davantage de tâches : il choisit le travail qui a le meilleur rendement attendu, impose une production avant la correction, puis recalcule le plan à partir de la performance observée.

![Tableau de bord AXIOME](artifacts/axiome-desktop.png)

## Ce qui est personnalisé

- L2 PSP préconfigurée : optique ondulatoire, mécanique du solide, électromagnétisme 1, algèbre linéaire 2, outils mathématiques 2, atomistique, TP et anglais scientifique.
- Alternance systématique entre cours et exercices : rappel, exemple auto-expliqué, exercice jumeau, autonomie, puis annale.
- Réponse au principal échec de L1 : aucune compréhension n’est validée par la relecture seule.
- Objectif de haut niveau : priorité au transfert, à la rédaction et au choix autonome de méthode, pas seulement au résultat numérique.
- Diagnostic initial honnête : toutes les notions commencent « non calibrées » ; aucune maîtrise fictive n’est affichée.
- État du matin : sommeil, énergie et temps net changent la durée et l’intensité des blocs.
- Bilan du soir dédié : acquis récupérables, zone floue testable et première action du lendemain.

## Boucle de travail

1. **État réel** — sommeil, énergie, concentration, stress et temps disponible.
2. **Plan adaptatif** — lacune, oubli estimé, examen, priorité de l’UE, retard et erreurs récurrentes.
3. **Session focus** — protocole précis, minuteur, aide graduée et ressources explicitement autorisées.
4. **Prédiction** — confiance annoncée avant d’ouvrir la correction.
5. **Correction sévère** — score d’autonomie, erreur typée et règle de prévention.
6. **Replanification** — maîtrise, stabilité mnésique et date du prochain rappel mises à jour.

## Fonctionnalités

- tableau de bord quotidien et plan recalculable ;
- mode focus complet avec rappel actif, exercice, problème mixte et rejeu d’erreur ;
- carte de maîtrise par UE et chapitre ;
- file de révision espacée adaptée aux mathématiques et à la physique ;
- carnet d’erreurs causal ;
- agenda hebdomadaire et rampe d’examen J-21 / J-14 ;
- suivi production active, exécution et calibration confiance-performance ;
- corpus local par UE (poly, TD, annales, livres et fiches) ;
- export/import JSON ;
- stockage local sans compte ;
- interface responsive et manifeste d’installation mobile.

## Moteur adaptatif v1

Le score de priorité d’un chapitre combine :

| Signal | Poids |
| --- | ---: |
| Lacune de maîtrise | 27 % |
| Risque d’oubli | 20 % |
| Proximité de l’examen | 18 % |
| Priorité stratégique de l’UE | 13 % |
| Retard, rechutes et erreurs | 22 % |

La rétention estimée suit une décroissance exponentielle simple :

\[
R(t)=e^{-t/S},
\]

où `S` est une stabilité propre au chapitre, augmentée ou réduite après chaque rappel. Près d’un examen, l’intervalle est plafonné à environ 20 % du temps restant. Ce modèle sert de règle de décision transparente ; ce n’est pas une mesure biologique de la mémoire.

## Fondements scientifiques

- Roediger & Karpicke (2006), récupération active : <https://pubmed.ncbi.nlm.nih.gov/16507066/>
- Cepeda et al. (2008), espacement et horizon du test : <https://doi.org/10.1111/j.1467-9280.2008.02209.x>
- Rohrer et al. (2015), entrelacement en mathématiques : <https://files.eric.ed.gov/fulltext/ED557355.pdf>
- Butler & Roediger (2008), feedback après test : <https://doi.org/10.3758/MC.36.3.604>
- Chi et al. (1989), auto-explication : <https://doi.org/10.1207/s15516709cog1302_1>
- Curcio et al. (2006), sommeil et apprentissage : <https://pubmed.ncbi.nlm.nih.gov/16564189/>

## Lancer le logiciel

Prérequis : Node.js 20.9 ou plus récent.

```bash
npm install
npm run dev
```

Ouvrir ensuite <http://localhost:3000>.

### Lancement automatique avec GitHub Pages

Le dépôt contient déjà le workflow `.github/workflows/deploy-pages.yml`. À chaque
push sur `main`, GitHub teste puis publie automatiquement l’application à l’adresse :

```text
https://<utilisateur>.github.io/<nom-du-depot>/
```

Aucun serveur ni secret n’est nécessaire : l’application est exportée comme site
statique et les données de travail restent dans le navigateur.

Commandes de contrôle :

```bash
npm run lint
npm test
npm run build
```

## Architecture

- `src/lib/planner.ts` : classement, entrelacement, espacement et mise à jour après session ;
- `src/lib/initial-data.ts` : structure initiale du S3 PSP ;
- `src/hooks/use-study-store.ts` : persistance locale et mutations ;
- `src/components/` : vues et protocoles interactifs ;
- `src/lib/planner.test.ts` : tests du budget, du diagnostic, de l’oubli, de la rampe examen et de la replanification.

## Limites assumées de cette version

- Les intitulés de chapitres sont une structure de départ à remplacer par le découpage exact des polys 2026–2027.
- Les dates de CC et l’emploi du temps ne sont pas inventés : ils doivent être renseignés quand l’UT3 les publie.
- Le corpus enregistre actuellement les références des ressources ; l’indexation sémantique de PDF et le tutorat IA ligne par ligne nécessitent un backend et une clé de modèle.
- Avant cinq à dix sessions, le moteur explore davantage qu’il n’exploite : il ne prétend pas connaître un « profil cognitif » stable dès le premier jour.
