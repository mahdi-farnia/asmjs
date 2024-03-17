import CharCodes from './ccode.js';
import Range from './helpers/Range.js';
import Tree from './Tree.js';

class Parser {
  /**
   * @type {string}
   */
  #source_string;
  /**
   * @type {ParserState}
   */
  #state;

  /**
   * @type {Tree}
   */
  #tree;

  /**
   * @type {number}
   */
  #current_section;

  get #SECTION_NONE() {
    return 0;
  }

  get #SECTION_TEXT() {
    return 1;
  }

  get #SECTION_DATA() {
    return 2;
  }

  constructor(asm_str) {
    this.#source_string = asm_str;
    this.#state = new ParserState(this.#source_string.length);
    this.#tree = new Tree();
    this.#current_section = this.#SECTION_NONE;
  }

  get #current_ccode() {
    return this.#ccodeAt(0);
  }

  /**
   * @param {number} delta_offset
   * @returns {number}
   */
  #ccodeAt(delta_offset) {
    return this.#source_string.charCodeAt(this.#state.index + delta_offset);
  }

  #next(panicOnEOF) {
    return this.#state.next(this.#current_ccode, panicOnEOF);
  }

  #current_ccode_isWhiteSpace() {
    switch (this.#current_ccode) {
      case CharCodes.SPACE:
      case CharCodes.LF:
      case CharCodes.CR:
        return true;

      default:
        return false;
    }
  }

  #skipWhiteSpace(panicOnEOF = true) {
    while (this.#current_ccode_isWhiteSpace() && this.#next(panicOnEOF));
  }

  /**
   * Skip characters while specified character is present
   * @param {number} ccode
   */
  #skipWhile(ccode, panicOnEOF = true) {
    while (this.#current_ccode === ccode && this.#next(panicOnEOF));
  }

  /**
   * for reading words
   */
  #skipToWhiteSpace(panicOnEOF = true) {
    while (!this.#current_ccode_isWhiteSpace() && this.#next(panicOnEOF));
  }

  #skipLine(panicOnEOF = true) {
    while (this.#current_ccode !== CharCodes.LF && this.#next(panicOnEOF));
  }

  /**
   * @param {number} which string termination character
   */
  #skipString(which) {
    while (this.#next(true)) {
      if (this.#current_ccode === which && this.#ccodeAt(-1) !== CharCodes.BACK_SLASH) break;
    }
    this.#next(true); // go to the ending quote
  }

  parse() {
    while (this.#next(false)) {
      switch (this.#current_ccode) {
        //
        // Single line comment
        //
        case CharCodes.SHARP:
        case CharCodes.SEMI_COLON:
          this.#skipLine();
          break;

        case CharCodes.SLASH:
          if (this.#ccodeAt(-1) === CharCodes.SLASH) this.#skipLine();
          break;

        //
        // Code
        //
        default:
          this.#parseWord();
          break;
      }
    }

    return this.#tree;
  }

  #parseWord() {
    // [word, range]
    const readResult = this.#readWord();

    // Section Detection
    if (readResult.word === 'section') return this.#parseSectionName();

    // Section should be specified before any instruction
    if (this.#current_section === this.#SECTION_NONE)
      throw new ParserError(
        'instruction for undefined section',
        this.#state.line,
        this.#state.column
      );

    // Instruction detection
    if (this.#current_section === this.#SECTION_TEXT) return this.#parseInstruction(readResult);

    // Data value detection
    if (this.#current_section === this.#SECTION_DATA) return this.#parseData(readResult);
  }

  /**
   * Reads next word, despite the LF & any whitespace
   * @returns {{word: string, range: Range}}
   */
  #readWord(panicOnEOF = false) {
    this.#skipWhiteSpace(panicOnEOF);
    const range = new Range(this.#state.index, NaN);
    this.#skipToWhiteSpace(false); // word is ended by eof, no problem
    range.extendUpperBound(this.#state.index);

    return { word: range.slice(this.#source_string), range };
  }

  /**
   * @returns {Range[]}
   */
  #readWordsTillEOL() {
    this.#skipWhile(CharCodes.SPACE, false);
    const lineRange = new Range(this.#state.index, NaN);
    this.#skipLine(false);
    lineRange.extendUpperBound(this.#state.index);

    const wordsRange = [];
    const line = lineRange.slice(this.#source_string);

    // Extract each word range
    for (const { index, 0: match_term } of [...line.matchAll(/\S+/g)]) {
      if (isInvalidOperand(match_term)) {
        throw new ParserError(
          'Invalid character in operand',
          this.#state.line,
          this.#state.index - (lineRange.lower + index + 1)
        );
      }

      wordsRange.push(
        new Range(lineRange.lower + index, lineRange.lower + index + match_term.trim().length)
      );
    }

    return wordsRange;
  }

  #parseSectionName() {
    const { word } = this.#readWord(true);
    let sec = this.#SECTION_NONE;

    switch (word) {
      case '.text':
        sec = this.#SECTION_TEXT;
        break;

      case '.data':
        sec = this.#SECTION_DATA;
        break;

      default:
        throw new ParserError('invalid section name', this.#state.line, this.#state.column);
    }

    // Already in that section
    if (this.#current_section === sec)
      throw new ParserError(
        `Redefinition of section ${word}`,
        this.#state.line,
        this.#state.column
      );

    this.#current_section = sec;
  }

  /**
   * @param {{word: string, range: Range}} readResult
   */
  #parseInstruction(readResult) {
    let symbol,
      instruction = readResult.range;

    // Word was symbol
    if (readResult.word.endsWith(':')) {
      symbol = readResult.range;
      const instruction_readResult = this.#readWord(true);

      if (instruction_readResult.word === 'section')
        throw new ParserError('Illegal instruction', this.#state.line, this.#state.column);

      instruction = instruction_readResult.range;
    }

    const args = this.#readWordsTillEOL();

    this.#tree.pushInstruction(instruction, args, symbol, this.#state.line, this.#state.column);
  }

  /**
   * @param {{word: string, range: Range}} readResult
   */
  #parseData(readResult) {
    if (!readResult.word.endsWith(':'))
      throw new ParserError('Data does not have any symbol', this.#state.line, this.#state.column);

    this.#skipWhiteSpace(true);

    const dataRange = new Range(this.#state.index, NaN);

    switch (this.#current_ccode) {
      case CharCodes.SINGLE_QUOTE:
      case CharCodes.DOUBLE_QUOTE: {
        this.#skipString(this.#current_ccode);
        break;
      }

      default:
        this.#readWord(true);
        break;
    }

    dataRange.extendUpperBound(this.#state.index);
    this.#tree.pushData(new Range(readResult.range.lower, readResult.range.upper - 1 /* do not contain trailing colon */), dataRange, this.#state.line, this.#state.column);
  }
}

class ParserState {
  /**
   * @type {number}
   */
  #index;
  /**
   * @type {number}
   */
  #max_length;
  /**
   * @type {number}
   */
  #line;

  get line() {
    return this.#line;
  }
  /**
   * @type {number}
   */
  #column;

  get column() {
    return this.#column;
  }

  constructor(source_length) {
    this.#index = -1;
    this.#max_length = source_length;
    this.#line = 1;
    this.#column = -1;
  }

  /**
   * @param {number} current_char to determine next line
   * @param {boolean} [panicOnEOF]
   * @returns
   */
  next(current_char, panicOnEOF = false) {
    if (current_char === CharCodes.LF) {
      ++this.#line;
      this.#column = -1;
    }

    ++this.#index;
    ++this.#column;

    const cond = this.#index < this.#max_length;

    if (panicOnEOF && !cond) {
      throw new ParserError('Unexpected EOF', this.#line, this.#column);
    }

    return cond;
  }

  get index() {
    return this.#index;
  }
}

class ParserError extends Error {
  /**
   * @type {number}
   */
  line;
  /**
   * @type {number}
   */
  column;

  /**
   * @param {string} msg
   * @param {number} line
   * @param {number} col
   */
  constructor(msg, line, col) {
    super(`Parse Error at ${line}:${col}: ${msg}`);

    this.name = 'ParserError';
    this.line = line;
    this.column = col;
  }
}

const invalidOperand = /\W/i;
function isInvalidOperand(str) {
  const match = invalidOperand.exec(str)?.[0];
  return match && match !== '-';
}

export default Parser;
