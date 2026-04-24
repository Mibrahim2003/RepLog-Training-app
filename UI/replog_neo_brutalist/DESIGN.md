---
name: RepLog Neo-Brutalist
colors:
  surface: '#fff8f7'
  surface-dim: '#eed4d2'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0ef'
  surface-container: '#ffe9e7'
  surface-container-high: '#fde2e0'
  surface-container-highest: '#f7dddb'
  on-surface: '#261817'
  on-surface-variant: '#59413f'
  inverse-surface: '#3c2c2c'
  inverse-on-surface: '#ffedeb'
  outline: '#8d706e'
  outline-variant: '#e1bebc'
  surface-tint: '#b3272e'
  primary: '#b3272e'
  on-primary: '#ffffff'
  primary-container: '#ff5f5f'
  on-primary-container: '#64000d'
  inverse-primary: '#ffb3af'
  secondary: '#5e5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2e2e2'
  on-secondary-container: '#646464'
  tertiary: '#006c4e'
  on-tertiary: '#ffffff'
  tertiary-container: '#00aa7d'
  on-tertiary-container: '#003625'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3af'
  on-primary-fixed: '#410005'
  on-primary-fixed-variant: '#91081a'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#77fac7'
  tertiary-fixed-dim: '#58ddac'
  on-tertiary-fixed: '#002115'
  on-tertiary-fixed-variant: '#00513a'
  background: '#fff8f7'
  on-background: '#261817'
  surface-variant: '#f7dddb'
typography:
  display-xl:
    fontFamily: Epilogue
    fontSize: 48px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Epilogue
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Epilogue
    fontSize: 24px
    fontWeight: '800'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Lexend
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Lexend
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  data-lg:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  data-sm:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
---

## Brand & Style
The brand personality is raw, energetic, and unapologetically functional. Designed for athletes who value progress over aesthetics, this design system evokes a sense of "work-in-progress" and "industrial strength." The interface should feel like a physical logbook or a blueprint—utilitarian, high-contrast, and immediate.

The style is **Neo-Brutalism**. It rejects traditional "softness" and digital depth in favor of honest materials: heavy strokes, flat planes of color, and hard-edged geometry. It is built to feel fast, durable, and highly legible under the high-stress environment of a workout.

## Colors
This design system utilizes a high-contrast, limited palette to ensure maximum visibility. 

- **Main Background**: A flat Off-white (#FDFCF0) that reduces eye strain compared to pure white while maintaining a "paper-like" feel.
- **Primary Accent**: Coral Red (#FF5F5F) is reserved strictly for primary actions, success states, and critical highlights. It represents the "burn" and energy of the workout.
- **Neutrals**: Absolute Black (#000000) is used for all borders, shadows, and typography to maintain a heavy, grounded aesthetic. 
- **Surface**: Pure White (#FFFFFF) can be used inside cards or input fields to create a subtle distinction from the main background.

## Typography
Typography is divided into two distinct functional groups:

1.  **Headers and Brand**: Use **Epilogue** in its heaviest weights (800-900). This provides a distinctive, geometric, and editorial feel that anchors the Neo-Brutalist look.
2.  **Numbers and Technical Data**: Use **Space Grotesk**. Its technical, futuristic, and near-monospaced appearance is ideal for workout reps, sets, weights, and timers.
3.  **UI Elements and Body**: Use **Lexend** for standard interface text. Its athletic and highly readable character ensures users can digest information quickly mid-set.

All text must be rendered in #000000. Headers should frequently use Uppercase styling to emphasize the "raw" aesthetic.

## Layout & Spacing
The layout follows a strict 8px grid system. Spacing is rhythmic and predictable, favoring clear separation over fluid "airy" whitespace.

Sections are separated by visible **1px black grid lines**. This mimics the look of a technical chart or ledger. 

- **Grid Model**: A fluid 4-column grid for mobile, expanding to 12 columns for larger displays.
- **Alignment**: Elements should snap strictly to the grid. 
- **Dividers**: Use vertical and horizontal 1px lines (#000000) to partition the screen into functional zones (e.g., separating the navigation header from the workout timer).

## Elevation & Depth
In this design system, depth is conveyed through **Hard Shadows** rather than z-index blurs or lighting gradients. 

- **Shadow Style**: Every interactive element (cards, buttons, inputs) must feature a 4px 4px 0px #000000 shadow. 
- **Interaction**: On "Hover," the shadow may increase to 6px. On "Active/Press," the shadow should disappear (0px 0px), and the element should translate 4px down and 4px to the right to simulate a physical button being pressed into the page.
- **Layers**: Objects do not "float." They are either flat on the background or physically offset by their hard shadows.

## Shapes
The shape language is strictly **Rectangular**. There are no border-radii used in this design system. 

- **Corners**: All corners must be 90-degree sharp angles (0px radius).
- **Borders**: All primary containers, buttons, and input fields must feature a consistent 3px solid black (#000000) border.
- **Accents**: Small decorative elements (like progress bar fills) should also remain perfectly rectangular.

## Components
Consistent application of the border and shadow rules is critical for the component library.

- **Buttons**: Use the primary Coral Red (#FF5F5F) for "Start Workout" or "Save." Use the Off-white for secondary actions. All buttons must have the 3px black border and the 4px hard shadow. Text inside buttons should be Uppercase **Epilogue Bold**.
- **Cards**: Cards use a pure white background to pop against the off-white page. They feature the 3px border and 4px shadow. Use internal 1px grid lines to separate header sections of a card (e.g., Exercise Name) from the body (e.g., Sets/Reps).
- **Inputs**: Text inputs feature a 3px black border. When focused, the background can shift to a very light tint of Coral Red or simply maintain the 4px hard shadow to indicate activity.
- **Data Readouts**: Large numeric displays (e.g., Weight lifted) should use **Space Grotesk** and be enclosed in a 3px border box to look like a digital gauge.
- **Chips/Tags**: Small rectangular boxes with 2px borders, used for muscle groups (e.g., [CHEST], [TRICEPS]) using **Space Grotesk** in all caps.