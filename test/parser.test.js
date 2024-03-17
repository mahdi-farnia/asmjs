import { describe, it } from "node:test";
import assert from "node:assert";
import Parser from "../src/Parser.js";
import Tree from "../src/Tree.js";
import { dataRangeArrayToString } from "./utils.js";

describe("Parser Test", () => {
  const emptyTree = new Tree();

  it("empty input", () => {
    const tree = new Parser("").parse();

    assert.deepStrictEqual(tree, emptyTree, "empty input should result in empty parsed tree!");
  });
  
  describe("parse section names", () => {
    it("all section names are present", () => {
      const input = `
section .text
section .data
`;
      const tree = new Parser(input).parse();
      assert.deepStrictEqual(tree, emptyTree);
    });

    it("text section only", () => {
      const input = "section .text";
      const tree = new Parser(input).parse();
      assert.deepStrictEqual(tree, emptyTree);
    });

    it("data section only", () => {
      const input = "section .data";
      const tree = new Parser(input).parse();
      assert.deepStrictEqual(tree, emptyTree);
    });
  });

  describe("parse data section", () => {
    it("data section with a non-string data", () => {
      const input = `
section .data
sample: 0x22
`;
      const tree = new Parser(input).parse();
      const expectedData = [["sample", "0x22"]];

      assert.deepStrictEqual(expectedData, dataRangeArrayToString(input, tree.data_section), "single data instruction only contains one symbol & data");
    });

    it("data section with a one-line string data", () => {
      const input = `
section .data
sample: "Hello World"
`;
      const tree = new Parser(input).parse();
      const expectedData = [["sample", '"Hello World"']];

      assert.deepStrictEqual(expectedData, dataRangeArrayToString(input, tree.data_section), "single data instruction only contains one symbol & one-line string");
    });

    it("data section with a multiline string data", () => {
      const input = `
section .data
sample: 'Hello World
Sample Data'
`;
      const tree = new Parser(input).parse();
      const expectedData = [["sample", "'Hello World\nSample Data'"]];

      assert.deepStrictEqual(expectedData, dataRangeArrayToString(input, tree.data_section), "single data instruction only contains one symbol & multiline string");
    });

    it("data section with seperated symbol and data lines", () => {
      const input = `
section .data
sample:
  'Hello World
Sample Data'
`;
      const tree = new Parser(input).parse();
      const expectedData = [["sample", "'Hello World\nSample Data'"]];

      assert.deepStrictEqual(expectedData, dataRangeArrayToString(input, tree.data_section), "single data instruction only contains one symbol & multiline string");
    })

    it("data section with a multiple data", () => {
      const input = `
section .data
sample: 0x22
sample2: 'Hello World'
sample3: 'Multi
line'
sample4:
  222
sample5:
  "Hello
  World"
`;
      const tree = new Parser(input).parse();
      const expectedData = [["sample", "0x22"]
                            ["sample2", "'Hello World'"],
                            ["sample3", "'Multi\nline'"],
                            ["sample4", "222"],
                            ["sample5", '"Hello\n  World"']];

      assert.deepStrictEqual(expectedData, dataRangeArrayToString(input, tree.data_section), "tokens are different than expected");
    });
  });
});

