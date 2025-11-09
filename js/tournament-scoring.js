// ======== TOURNAMENT SCORING SYSTEM ========
// Shared across all Family Feud rounds
// Uses localStorage to persist team scores between pages

const TOURNAMENT_ROUNDS = [
  { id: 'restaurants', title: 'Houston Restaurants', file: 'family-feud-restaurants.html', question: 'Your favorite Houston area desi restaurant is?' },
  { id: 'nashta', title: 'Breakfast', file: 'family-feud-nashta.html', question: 'Your favorite breakfast/nashta is?' },
  { id: 'travel', title: 'Travel Destination', file: 'family-feud-travel.html', question: 'Your favorite city to travel to is?' },
  { id: 'tv', title: 'TV Obsession', file: 'family-feud-tv.html', question: 'Your favorite TV show obsession is?' },
  { id: 'crush', title: 'Celebrity Crush', file: 'family-feud-crush.html', question: 'Your celebrity crush was?' }
];

class TournamentScoring {
  constructor(currentRoundId) {
    this.currentRoundId = currentRoundId;
    this.currentRoundIndex = TOURNAMENT_ROUNDS.findIndex(r => r.id === currentRoundId);
    this.loadScores();
  }

  loadScores() {
    const stored = localStorage.getItem('feudTournamentScores');
    if (stored) {
      const data = JSON.parse(stored);
      this.teamScores = data.teamScores || { spades: 0, hearts: 0 };
      this.roundScores = data.roundScores || {};
    } else {
      this.teamScores = { spades: 0, hearts: 0 };
      this.roundScores = {};
    }

    // Get scores from URL params (takes precedence)
    const params = new URLSearchParams(window.location.search);
    if (params.has('spades') && params.has('hearts')) {
      this.teamScores.spades = parseInt(params.get('spades')) || 0;
      this.teamScores.hearts = parseInt(params.get('hearts')) || 0;
    }

    console.log('🏆 Tournament scores loaded:', this.teamScores);
  }

  saveScores() {
    const data = {
      teamScores: this.teamScores,
      roundScores: this.roundScores,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('feudTournamentScores', JSON.stringify(data));
    console.log('💾 Tournament scores saved:', this.teamScores);
  }

  addRoundScore(team, points) {
    this.teamScores[team] += points;
    
    if (!this.roundScores[this.currentRoundId]) {
      this.roundScores[this.currentRoundId] = { spades: 0, hearts: 0 };
    }
    this.roundScores[this.currentRoundId][team] += points;
    
    this.saveScores();
  }

  getTeamScores() {
    return { ...this.teamScores };
  }

  getRoundScore(roundId) {
    return this.roundScores[roundId] || { spades: 0, hearts: 0 };
  }

  getCurrentRound() {
    return TOURNAMENT_ROUNDS[this.currentRoundIndex];
  }

  getNextRound() {
    if (this.currentRoundIndex < TOURNAMENT_ROUNDS.length - 1) {
      return TOURNAMENT_ROUNDS[this.currentRoundIndex + 1];
    }
    return null;
  }

  getPreviousRound() {
    if (this.currentRoundIndex > 0) {
      return TOURNAMENT_ROUNDS[this.currentRoundIndex - 1];
    }
    return null;
  }

  isFirstRound() {
    return this.currentRoundIndex === 0;
  }

  isLastRound() {
    return this.currentRoundIndex === TOURNAMENT_ROUNDS.length - 1;
  }

  getTournamentProgress() {
    return {
      current: this.currentRoundIndex + 1,
      total: TOURNAMENT_ROUNDS.length,
      roundName: this.getCurrentRound().title
    };
  }

  navigateToNextRound() {
    const nextRound = this.getNextRound();
    if (nextRound) {
      const url = `${nextRound.file}?spades=${this.teamScores.spades}&hearts=${this.teamScores.hearts}`;
      window.location.href = url;
    } else {
      this.showFinalResults();
    }
  }

  navigateToPreviousRound() {
    const prevRound = this.getPreviousRound();
    if (prevRound) {
      const url = `${prevRound.file}?spades=${this.teamScores.spades}&hearts=${this.teamScores.hearts}`;
      window.location.href = url;
    }
  }

  resetTournament() {
    if (confirm('Reset entire tournament? This will clear all scores from all rounds.')) {
      localStorage.removeItem('feudTournamentScores');
      window.location.href = TOURNAMENT_ROUNDS[0].file;
    }
  }

  showFinalResults() {
    const winner = this.teamScores.spades > this.teamScores.hearts ? 'Spades & Clubs ♠️♣️' : 'Hearts & Diamonds ♥️♦️';
    const finalScore = `${this.teamScores.spades} - ${this.teamScores.hearts}`;
    
    alert(`🏆 TOURNAMENT COMPLETE! 🏆\n\nWinner: ${winner}\nFinal Score: ${finalScore}\n\nCongratulations!`);
  }
}
