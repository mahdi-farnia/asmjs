const CharCodes = {
  LF: cc('\n'),
  CR: cc('\r'),
  DOT: cc('.'),
  SPACE: cc(' '),
  SINGLE_QUOTE: cc("'"),
  DOUBLE_QUOTE: cc('"'),
  BACK_SLASH: cc('\\'),
  SEMI_COLON: cc(';'),
  SHARP: cc('#'),
  SLASH: cc('/')
};

function cc(char) {
  return char.charCodeAt(0);
}

export default CharCodes;
