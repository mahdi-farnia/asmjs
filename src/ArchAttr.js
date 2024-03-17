class ArchAttr {
  /**
   * @type {Map<string, any>}
   */
  #registers;
  /**
   * @type {Map<string, (registers: Map<string, any>, stack: any[], operands: string[]) => void>}
   */
  #instructions;

  get registers() {
    return this.#registers;
  }

  get instructions() {
    return this.#instructions;
  }

  /**
   * internal
   */
  __$setRegisters_(regs) {
    this.#registers = regs;
  }

  constructor() {
    this.#registers = new Map();
    this.#instructions = new Map();
  }

  /**
   * @param {string} name
   */
  #addRegister = (name, initValue) => {
    this.#registers.set(name, initValue);
    return this.#addRegister;
  };

  defineRegisters() {
    return this.#addRegister;
  }

  /**
   * @param {string} name
   * @param {(registers: Map<string, any>, stack: any[], operands: string[]) => void} fn
   */
  #addInstruction = (name, fn) => {
    this.#instructions.set(name, fn);
    return this.#addInstruction;
  };

  defineInstructions() {
    return this.#addInstruction;
  }
}

export default ArchAttr;
