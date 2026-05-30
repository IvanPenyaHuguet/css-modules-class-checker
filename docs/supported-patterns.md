# Supported Patterns

## CSS Module Access

```tsx
import styles from "./button.module.css";

styles.primary;
styles["primary"];
styles[`primary`];

const variant = "primary";
styles[variant];

const kind = active ? "primary" : "secondary";
styles[kind];

type Variant = "primary" | "secondary";
styles[variant];

const classMap = { primary: "primary" } as const;
styles[classMap.primary];

enum VariantClass {
  Primary = "primary"
}
styles[VariantClass.Primary];

const tone: "Primary" | "Secondary" = "Primary";
const state: "Active" | "Disabled" = "Active";
styles[`button${tone}${state}`];
```

## Class Composition

`clsx` and `classnames` are supported, including common conditional patterns:

```tsx
className={clsx(styles.primary, active && styles.active)}
className={classNames(styles.primary)}
className={clsx({ primary: active })}
```

## Raw Class Strings

Raw class strings matching an imported CSS Module class are reported:

```tsx
import styles from "./button.module.css";

className="primary";
className={clsx("primary")}
className={clsx({ primary: active })}
```
