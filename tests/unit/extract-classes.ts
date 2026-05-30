import { describe, expect, it } from "vitest";
import { extractCssClasses } from "../../src/css/extract-classes.js";

describe("CSS class extraction", () => {
  it("extracts standalone classes from nested CSS selectors", () => {
    const source = `
      .button {
        color: red;

        &.active {
          color: blue;
        }

        & .icon {
          display: inline-block;
        }

        .label {
          font-weight: 600;
        }

        @media (min-width: 40rem) {
          &.wide {
            padding: 1rem;
          }
        }
      }
    `;

    const result = extractCssClasses(source);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.message);
    }

    expect([...result.classes].sort()).toEqual(["button", "icon", "label"]);
  });

  it("does not extract classes that only exist in compound nested selectors", () => {
    const source = `
      .one {
        &.two {
          color: red;
        }
      }
    `;

    const result = extractCssClasses(source);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.message);
    }

    expect([...result.classes].sort()).toEqual([]);
  });

  it("ignores class-like text inside comments", () => {
    const source = `
      .button {
        color: red;

        /* &.commentedOut should not be extracted */

        &.active {
          color: blue;
        }
      }
    `;

    const result = extractCssClasses(source);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.message);
    }

    expect([...result.classes].sort()).toEqual(["button"]);
  });
});
