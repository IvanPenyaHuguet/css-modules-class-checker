# Supported Patterns

## CSS Module Access

```tsx
import styles from "./button.module.css";
import { secondary, danger as dangerClass } from "./button.module.css";

styles.primary;
styles["primary"];
styles[`primary`];
secondary;
dangerClass;

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

// With localsConvention: "camelCase"
// .primary_button and .is-active can be imported as:
styles.primaryButton;
styles.isActive;
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
class="primary";
className={clsx("primary")}
class={clsx("primary")}
className={clsx({ primary: active })}
```
