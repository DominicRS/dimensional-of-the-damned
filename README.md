## Runescape Dimension of the Damned Event Analyzer.

There was a number of issues during the Dimension of the Damned final, this tool will attempt to identify users who fraudulently entered the final competition, and those that were unfairly wiped out because of the Miasma.

## Execution

Running the analyzer is simple enough, just install dependencies and away you go.

```
npm install
npm start
```

## Results

Given the results available through the Highscores, it's obvious there was issues within the final.

* Over 10% of entrants were not even supposed to be there, infact some players who have scored highly (e.x. 'X Gary' who came rank 36th), are in a position to win participant rewards, despite not being a real participant.
 * Worryingly, we have players who are obviously newly created accounts that were likely used to abuse the free tokens issue. Namely accounts such as 'DotDMeta', '4pawya2097', 'PinkkFloydd', etc.

* Over 27% of participants were killed before they could score more than 10 points. This likely seems to be an issue with the Miasma, this is an unacceptable number of participants wiped out before having a chance to do anything at all. 

### Report

* Total players in the final: 499
* Total players who did not pass the qualifier: 52 (10.42%)
* Total players killed by Miasma: 138 (27.66%)
* Total players with membership: 430 (86.17%)
