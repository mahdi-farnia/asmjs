class Tree {
  /**
   * @type {Data[]}
   */
  #data_section;

  get data_section() {
    return this.#data_section;
  }

  /**
   * @type {Instruction[]}
   */
  #text_section;

  get text_section() {
    return this.#text_section;
  }

  constructor() {
    this.#data_section = [];
    this.#text_section = [];
  }

  /**
   * @param {Range} symbol
   * @param {Range} data
   */
  pushData(symbol, data) {
    this.#data_section.push(new Data(symbol, data));
  }

  /**
   * @param {Range} name
   * @param {Range[]} args
   * @param {Range} [symbol]
   */
  pushInstruction(name, args, symbol, line, column) {
    this.#text_section.push(new Instruction(name, args, symbol, line, column));
  }
}

class Data {
  /**
   * @type {Range}
   */
  #symbol;

  get symbol() {
    return this.#symbol;
  }
  /**
   * @type {Range}
   */
  #data;

  get data() {
    return this.#data;
  }
  /**
   * @type {{ line: number; column: number }}
   */
  #source_info;

  get source_info() {
    return this.#source_info;
  }

  constructor(symbol, data, line, column) {
    this.#symbol = symbol;
    this.#data = data;
    this.#source_info = { line, column };
  }
}

class Instruction {
  /**
   * @type {Range}
   */
  #name;

  get name() {
    return this.#name;
  }
  /**
   * @type {Range[]}
   */
  #args;

  get args() {
    return this.#args;
  }

  /**
   * @type {Range}
   */
  #symbol;

  get symbol() {
    return this.#symbol;
  }

  /**
   * @type {{ line: number; column: number; }}
   */
  #sourceInfo;

  constructor(name, args, symbol, line, column) {
    this.#name = name;
    this.#args = args;
    this.#symbol = symbol;
    this.#sourceInfo = { line, column };
    Object.freeze(this.#sourceInfo);
  }

  get sourceInfo() {
    return this.#sourceInfo;
  }

  hasSymbolAttached() {
    return Boolean(this.#symbol);
  }
}

export default Tree;
