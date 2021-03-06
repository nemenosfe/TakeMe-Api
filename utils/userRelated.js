const mysql = require('promise-mysql');

module.exports = {
  getNewLevel: function (level, experience) {
    let new_level = level;
    while (experience >= this.getNextLevelExperience(new_level+1)) { ++new_level; }
    return new_level;
  },
  getNextLevelExperience: function (nextLevel) { return Math.ceil(nextLevel * Math.log10(nextLevel) * 250); }
};
