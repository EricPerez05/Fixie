# Fixie knowledge base

This folder is an Obsidian vault. Open it with **Obsidian → Open folder as vault → `fixie/knowledge`**.

Notes in `items/` are sent to the model with every scan. When a photographed item matches a note, Fixie follows the note's material, fairy and recycling verdict, and bases its steps on the note. Use it for items the model gets wrong and for your city's rules.

## Folders

| Folder | What goes there | Reaches the model? |
|---|---|---|
| `items/` | Notes a person has checked | Yes |
| `inbox/` | Drafts waiting for review | No |
| `templates/` | The note template for Obsidian's *Templates* core plugin | No |

## Adding or verifying a note

1. Start from `templates/item.md`, or open a draft in `inbox/`.
2. Check every fact against a real source, such as your hauler's website or the product's label.
3. Put your name in `verified_by`. Notes without it are rejected.
4. Move the note into `items/`.
5. Run `pnpm check`. A test validates every note, so a typo like `recyclable: maybe` fails before it ships.

## Fields

```yaml
item: Pizza box              # what the item is called
aliases: [pizza carton]      # other names the model might use
material: Corrugated cardboard
fairy: paper                 # glass | paper | metal | plastic | textile | organic | electronic | mixed
recyclable: "no"             # "yes" | "no" | special_dropoff  (quote yes/no)
verified_by: Your Name       # required in items/
```

The body below the frontmatter is plain guidance, up to 1,500 characters. Keep it to short, factual steps.

## Rules

- **Never copy a model answer in without checking it.** The point of this vault is facts a person has confirmed. Unchecked answers would repeat the model's own mistakes.
- **Hazard rules still apply.** Anything marked `special_dropoff` or given a caution never gets reuse ideas, whatever a note says.
- **One item per note.** Use `aliases` instead of duplicate notes.
