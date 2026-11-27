# My Igloo panorama artwork

- `shell.webp` is the empty room artwork at 1536 × 1024. Slot positions and furniture layers use the same artboard in `src/home/panorama.ts`.
- `chair.webp` and `coffee-cabinet.webp` are transparent fixtures. Furniture catalog artwork, seasonal gifts, and interactive props are rendered independently. Run `node assets/home-customization/prepare-panorama.cjs` to refresh the painted bounds after changing a sprite.
- The previous customizable shell is preserved at `../archive/portrait-v1/foundation.jpg`. Its SHA-256 is `4f98a9fef73394185822f4f92e60b82c97864fc09ce1bc88c7fb3ed429437a43`.

## ImageGen prompt set

The original My Igloo shell was the illustration reference for the room. The generated room was the lighting and texture reference for the new furniture.

- **Room shell.** Paint an empty panoramic igloo interior for a cozy pastel storybook game. Keep the existing soft lavender and icy periwinkle blocks, cream highlights, warm peach light, and painterly texture. Use three connected shallow bays, a low ceiling, and a generous, continuous matte floor across the lower half. Use the same elevated three-quarter interior view throughout. Leave the walls and floor free of windows, furnishings, decorations, rugs, characters, and text so the app can layer each piece independently.
- **Study chair.** Illustrate a single honey-colored wooden study chair with a woven cream seat cushion, an exposed backrest and legs, and a subtle three-quarter angle toward the right. Match the original storybook furniture’s soft edges, scale, brush texture, and warm lighting. Isolate the full chair on a transparent background, with no character, floor, or other objects.
- **Coffee cabinet.** Illustrate a compact honey-wood cabinet with two doors, a clear solid countertop, warm brass details, and short visible feet, in the same storybook brushwork and camera angle. Keep the countertop empty for an independently rendered coffee machine. Isolate the full cabinet on a transparent background, with no floor or props.
