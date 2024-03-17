/**
 * @typedef {import("./ArchAttr").default} ArchAttr
 */

import Parser from './Parser';

// TODO support printing from data section (or indirection) via bracket syntax: [rax]
class Processor {
  #arch;
  #stack;
  #code;
  #intervalId;
  #state;
  #sourceASM;
  #listeners;

  /**
   *
   * @param {string} asm
   * @param {ArchAttr} arch
   */
  constructor(asm, arch) {
    this.#sourceASM = asm;
    this.#arch = arch;
    this.#listeners = new Map();
    this.#arch.defineRegisters()('ip', 0);
    this.#code = new Parser(asm).parse();
    this.saveState();
    this.restoreState();
  }

  saveState() {
    this.#state = new Map(this.#arch.registers);
  }

  /**
   * reset processor to last saved state
   */
  restoreState() {
    this.stop();
    this.#arch.__$setRegisters_(new Map(this.#state));
    this.#stack = [];
  }

  stop() {
    if (!this.isRunning) return;
    clearInterval(this.#intervalId);
    this.#intervalId = 0;
  }

  get isRunning() {
    return Boolean(this.#intervalId);
  }

  execute() {
    if (this.isRunning) return;

    this.#intervalId = setInterval(this.#exec, Processor.SPEED_PER_SEC * 1000);
  }

  #exec = () => {
    const ip = this.#arch.registers.get('ip');
    const { text_section } = this.#code;

    if (text_section.length <= ip) {
      this.#listeners.get('finish')?.();
      this.restoreState();
      return !1;
    }

    const thisInstruction = text_section[ip];
    const { instructions } = this.#arch;

    if (!instructions.has(thisInstruction.name.slice(this.#sourceASM)))
      this.#listeners.get('trap')?.(
        `Illegal instruction: ${thisInstruction.name.slice(this.#sourceASM)} at ${
          thisInstruction.sourceInfo.line
        }:${thisInstruction.sourceInfo.column}`
      );

    try {
      // TODO this arguments
      instructions.get(thisInstruction.name.slice(this.#sourceASM)).call(
        void 0,
        this.#arch.registers,
        this.#stack,
        thisInstruction.args.map((range) => range.slice(this.#sourceASM))
      );
    } catch (err) {
      this.#listeners.get('trap')?.(
        `Instruction ${thisInstruction.name.slice(this.#sourceASM)} execution error at ${
          thisInstruction.sourceInfo.line
        }:${thisInstruction.sourceInfo.column}: ${err instanceof Error ? err.message : err}`
      );
      this.stop();
    }

    this.#arch.registers.set('ip', ip + 1);
  };

  onFinish(fn) {
    if (typeof fn !== 'function') return;
    this.#listeners.set('finish', fn);
  }

  onTrap(fn) {
    if (typeof fn !== 'function') return;
    this.#listeners.set('trap', fn);
  }

  static SPEED_PER_SEC = 1;
}

export default Processor;
