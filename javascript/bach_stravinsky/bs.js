// jshint esversion: 6


// Player prefers bach; opponent prefers stravinsky
class Player {
  constructor(name, description, strategy) {
    this.name = name;
    this.description = description;
    this.strategy = strategy;
  }
}


class Match {
  constructor(player1, player2) {
    this.player1 = player1;
    this.player2 = player2;
    this.history1 = [];
    this.history2 = [];
    this.score1 = 0;
    this.score2 = 0;
    this.nRounds = 100;
  }

  // Both players have a preference for Bach; in this class, player2 is modified
  // such that they prefer Stravinsky.
  flipChoice(choice) {
    if (choice == 'B') {
      return 'S';
    } else {
      return 'B';
    }
  }

  // Applying flipChoice to every element of history.
  // TODO: Consider Match containing four arrays to avoid flipping.
  flipHistory(history) {
    return history.map(this.flipChoice);
  }

  playMatch() {
    for (let i = 0; i < this.nRounds; i++) {
      this.playRound();
    }
  }

  playRound() {
    // Getting choices and checking that they are viable.
    let choice1 = this.player1.strategy(this.history1, this.flipHistory(this.history2));
    if (!['B', 'S'].includes(choice1)) {
      throw new Error(this.player1.name + " returning invalid outputs!");
    }
    let choice2 = this.player2.strategy(this.history2, this.flipHistory(this.history1));
    if (!['B', 'S'].includes(choice1)) {
      throw new Error(this.player2.name + " returning invalid outputs!");
    }

    // Appending current choices to the history arrays.
    this.history1.push(choice1);
    this.history2.push(choice2);

    // Flipping choice of player2
    choice2 = this.flipChoice(choice2);

    // Getting scores
    if (choice1 == 'B' && choice2 == 'B') {
      this.score1 += 3;
      this.score2 += 2;
    } else if (choice1 == 'S' && choice2 == 'S') {
      this.score1 += 2;
      this.score2 += 3;
    }

    // Printing
    console.log(this.score1, this.score2);
  }

  // Call this after match has already been played
  printWinner() {
    if (this.score1 > this.score2) {
      console.log('The winner is ' + this.player1.name);
    } else if (this.score1 < this.score2) {
      console.log('The winner is ' + this.player2.name);
    } else {
      console.log('The match was tied!');
    }
  }
}


selfish = new Player('selfish', 'Always chooses composer preference', function(myHist, oppHist) {
  return 'B';
});

var agreeableStrategy = function(myHist, oppHist) {
  if (myHist.length == 0) {
    return 'B';
  } else {
    return oppHist[myHist.length - 1];
  }
};

agreeable = new Player('agreeable', 'Chooses opponents last choice', agreeableStrategy);

random = new Player('random', 'Make a random choice', function(myHist, oppHist) {
  if (Math.random() < 0.5) {
    return 'B';
  } else {
    return 'S';
  }
});


m = new Match(selfish, random);
m.playMatch();
m.printWinner();
