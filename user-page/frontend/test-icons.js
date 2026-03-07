const lucide = require('lucide-react');
const icons = ['Gamepad2', 'Tv', 'Dices', 'Rocket', 'Layers', 'Joystick', 'Trophy', 'Zap', 'Spade', 'Club', 'Heart', 'Diamond'];
icons.forEach(i => {
  if (lucide[i]) console.log(i + ' exists');
  else console.log(i + ' missing');
});
