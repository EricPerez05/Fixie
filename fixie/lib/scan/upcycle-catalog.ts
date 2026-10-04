import "server-only";

/**
 * Verified upcycling projects, each from a real beginner tutorial: under an
 * hour, with common household supplies. The model adapts these to the item
 * and the person's profile instead of inventing projects.
 *
 * It sits in the system prompt, which is identical on every request, so it's
 * cached with the rest of the prefix. Never put anything per-request in here.
 */
export const UPCYCLE_CATALOG = `Verified project catalog

What a good idea looks like:
1. It uses the item's shape: the jug's handle becomes a scoop, the bottle's cap holds a wick, the carton's cells become pots.
2. It names a specific use ("holds remotes", "waters a plant for 3-5 days"), not just "storage" or "decor".
3. It has one clever trick that makes it work (freeze the can before punching it; use the box flaps as dividers).
4. Safety comes up at the step where it matters, not as a generic warning.

Safety rules for every idea:
- Never cut glass bottles or jars.
- Use battery tea lights or LED string lights only, never real candles.
- No food storage except in glass jars that already held food. Never in plastic bottles, coffee cups or foam containers.
- Every metal can project starts by blunting the rim (press it flat with the side of a screwdriver, or sand it) and says to wear gloves.
- Any idea with cut plastic or metal edges says how to cover or smooth them.

Glass jar:
- Herb jar: pebbles for drainage, then potting soil and a basil, mint, parsley or thyme cutting. Wide-mouth jars work best. [indoors+ · scissors_tape]
- Mini terrarium: layers of pebbles, activated charcoal, soil, then small succulents. [indoors+ · scissors_tape]
- Rope-wrapped organizer: hot-glue rope or twine around the jar; use it for makeup brushes, cotton swabs or pens. [indoors+ · glue_paint]
- Coin bank: cut a slot in the metal lid. [indoors+ · basic_tools]
- Pantry or spice jars: chalkboard-paint the lids and label them (safe: it was already a food jar). [indoors+ · glue_paint]
- Fairy-light jar: battery LED string lights inside, twine around the neck. [indoors+ · scissors_tape]

Aluminium or steel can (blunt the rim first, wear gloves):
- Punched-tin lantern: fill 3/4 with water and freeze so the can keeps its shape; tape on a paper pattern and hammer a nail along it; thaw and dry. The holes leave sharp burrs on the inside, so don't reach in. Battery tea light only. [indoors+ · basic_tools · not for kids]
- Planter: punch drainage holes in the base with a hammer and nail. [balcony+ · basic_tools]
- Napkin-decoupage pencil cup: glue patterned paper napkins on with decoupage glue. [indoors+ · glue_paint]

Plastic bottle:
- Self-watering planter: cut in half, flip the top into the bottom, and thread a cotton cord through a hole in the cap as a wick. It waters the plant for about 3-5 days. [indoors+ · scissors_tape]
- Bird feeder: push wooden spoons through opposite sides as perches, fill with seed, hang with string. Clean it every two weeks or so to stop disease spreading. [balcony+ · scissors_tape]
- Slow-drip waterer: poke small holes in the cap and sides, bury next to a plant's roots, fill. [yard · basic_tools]
- Seedling cloche: cut off the base and set the top half over a young plant. [balcony+ · scissors_tape]

Milk jug:
- Winter-sowing mini greenhouse: cut almost in half, leaving a hinge; poke drainage and air holes; add soil and seeds; tape it shut and leave it outside through winter. [balcony+ · scissors_tape]
- Watering can: poke small holes in the cap. [balcony+ · basic_tools]
- Scoop: cut away one side and keep the handle; use it for soil, birdseed or pet food. [indoors+ · scissors_tape]

Cardboard box:
- Desk or drawer organizer: cut the box to the height you need and use the flaps as dividers. [indoors+ · scissors_tape]
- Covered storage bin: wrap in contact paper or wallpaper for crafts, remotes or books. [indoors+ · scissors_tape]
- Sheet mulch: strip off tape and labels, use plain non-glossy cardboard, overlap pieces 1-2 inches, cover with mulch to smother weeds. [yard · scissors_tape]

Cereal box:
- Magazine file: mark 4.5 inches up one narrow side, draw a diagonal to the top corner on both wide faces, cut, and cover with contact paper or wallpaper. About 15 minutes. [indoors+ · scissors_tape]

Paper rolls, egg cartons, newspaper:
- Seed-starter pots: cut rolls into 2-3 inch sections, use cardboard egg-carton cells, or roll non-glossy newspaper around a can. Plant them whole, and bury the cardboard completely so an exposed edge doesn't wick moisture away. [indoors+ · scissors_tape]

T-shirt:
- No-sew tote bag: cut off the sleeves, cut a deep scoop neck, cut 1-2 cm fringe along the bottom, and double-knot the front and back strips together. About 10 minutes. Thick cotton holds the most weight. [indoors+ · scissors_tape]

Jeans:
- Coiled coasters: roll denim strips into a coil and hot-glue it. [indoors+ · glue_paint]
- No-sew basket: made from a trouser leg with safety pins or fabric glue. About 5 minutes. [indoors+ · scissors_tape]

Plastic bags:
- Plarn (plastic-bag yarn): cut a bag into 1 inch loops and loop them together; one bag makes about 8-10 yards. Crochet or weave it into a tote or a weatherproof mat. [indoors+ · scissors_tape]

Wine or glass bottle (no cutting):
- Fairy-light bottle lamp: battery LED string lights inside. [indoors+ · scissors_tape]
- Twine- or yarn-wrapped vase: glue twine or yarn around the bottle; the label can stay on. [indoors+ · glue_paint]
- Garden-bed edging: bury bottles neck-down in a trench, about half showing, packed close together. [yard · basic_tools]

Foam takeout container:
- Washable paint palette. [indoors+ · scissors_tape]
- Seed-starting tray that uses its own lid as a cover. [indoors+ · scissors_tape]
- Packing filler for shipping fragile things. [indoors+ · scissors_tape]

Paper coffee cup:
- Pen or desk cup decorated with washi tape. [indoors+ · scissors_tape]
- Seedling pot: poke drainage holes. The cup is plastic-lined and won't break down, so tip the seedling out to transplant it; don't plant the cup. [indoors+ · scissors_tape]

Tag key: "indoors+" fits any space; "balcony+" needs a balcony or yard; "yard" needs a yard. The tool tag is the least a person needs: scissors_tape is scissors and tape, basic_tools is a hammer and nails, glue_paint is glue and paint.`;
