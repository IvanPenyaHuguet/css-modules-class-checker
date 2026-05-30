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

  it("extracts standalone classes through media queries and pseudo selectors", () => {
    const source = `
      .card:hover {
        color: red;
      }

      .card:has(.icon) {
        color: blue;
      }

      .card:not(.disabled) {
        color: green;
      }

      @media (min-width: 40rem) {
        .responsive {
          display: grid;
        }
      }
    `;

    const result = extractCssClasses(source);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.message);
    }

    expect([...result.classes].sort()).toEqual(["card", "responsive"]);
  });

  it("keeps global classes out of CSS Module standalone class extraction", () => {
    const source = `
      .button :global(.external) {
        color: red;
      }

      :global(.reset) .button {
        color: blue;
      }

      .alone {
        color: purple;
      }
    `;

    const result = extractCssClasses(source);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.message);
    }

    expect([...result.classes].sort()).toEqual(["alone", "button"]);
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

  it("keeps standalone empty selectors as classes and marks them as empty", () => {
    const source = `
      .marker {
        /* EMPTY */
      }

      .button {
        color: red;
      }

      .one.two {
        /* EMPTY */
      }
    `;

    const result = extractCssClasses(source);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.message);
    }

    expect([...result.classes].sort()).toEqual(["button", "marker"]);
    expect([...result.emptyClasses].sort()).toEqual(["marker"]);
  });
});
