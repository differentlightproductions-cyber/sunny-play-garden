# Recording your own voice

The games speak every line with the tablet's built-in voice until you record your own. You can record a
**male** and a **female** voice; the games mix them (or use just one, your choice).

## Easiest way: record on the tablet
1. Open **Grown-ups** (lock icon), answer the sum, then **Voices > Record and choose voices**.
2. Pick **Male voice** or **Female voice** (whoever is recording).
3. Open a group, tap **Record**, say the line, tap **Stop**. Tap **Hear** to check it.
4. Every line has its own switch: turn off any line you don't want the games to say.
5. Set how often the games cheer ("Every time", "Sometimes", "Never").

Recordings are saved on that tablet. Anything you skip keeps using the built-in voice.
Quiet recordings are levelled and silence is trimmed automatically.

## Or: drop in files
Save MP3s as `audio/voice/male/<file>.mp3` and/or `audio/voice/female/<file>.mp3` using the names below, then run
`node tools/build-voice-manifest.mjs` and deploy. (File recordings work on every device; tablet recordings only on that tablet.)

## Suggested order (most useful first)
1. **Cheering** and **Prompts**: about 73 short lines.
2. **Letter sounds** and **Letter names**: the heart of the letter games.
3. **Critter noises**: make the noise yourself (bee buzz, frog ribbit).
4. **Picture words**, **Garden friend announcements**, **Player names**.

## Cheering

Said after she does something well. Turn down how often in the "Praise" setting.

| File | Say |
|---|---|
| `great-job.mp3` | Great job! |
| `wow.mp3` | Wow! |
| `you-did-it.mp3` | You did it! |
| `amazing.mp3` | Amazing! |
| `yay.mp3` | Yay! |

## Prompts and instructions

Short lines that tell her what to do.

| File | Say |
|---|---|
| `welcome.mp3` | Hi! Let's play! |
| `try-again.mp3` | Try again! |
| `find.mp3` | Can you find the letter |
| `follow-bee.mp3` | Follow the bee! |
| `is-for.mp3` | is for |
| `starts-with.mp3` | Which one starts with |
| `write-name.mp3` | Let's write your name! |
| `spell-name.mp3` | Your name is spelled |
| `catch-drops.mp3` | Catch the raindrops! |
| `rainbow.mp3` | A rainbow! |
| `fire-start.mp3` | Some little fires! Spray them with water! |
| `fire-pet.mp3` | Tap the pet to help them down! |
| `fire-done.mp3` | Everyone is safe! Hooray! |
| `band-start.mp3` | Touch the friends to make music! |
| `band-copy.mp3` | Listen... now you play! |
| `band-song.mp3` | Play some notes, then touch the red button! |
| `train-start.mp3` | All aboard! Fill up the train! |
| `train-go.mp3` | Choo choo! Off we go! |
| `train-wrong.mp3` | Try another one! |
| `puzzle-start.mp3` | Put the picture together! |
| `puzzle-done.mp3` | You made the picture! |
| `puzzle-next.mp3` | Tap the green arrow for another puzzle! |
| `care-start.mp3` | Take care of your friend! |
| `care-food.mp3` | Yum! Thank you! |
| `care-clean.mp3` | So fresh and clean! |
| `care-sleep.mp3` | Shhh... sleepy time. |
| `care-hungry.mp3` | Your friend is hungry! |
| `care-dirty.mp3` | Your friend needs a bath! |
| `care-tired.mp3` | Your friend is sleepy! |
| `hide-start.mp3` | Who is hiding? Walk around and look! |
| `hide-found.mp3` | Found you! |
| `hide-done.mp3` | You found everybody! |
| `num-1.mp3` | One! |
| `num-2.mp3` | Two! |
| `num-3.mp3` | Three! |
| `num-4.mp3` | Four! |
| `num-5.mp3` | Five! |
| `color-red.mp3` | Red! |
| `color-blue.mp3` | Blue! |
| `color-yellow.mp3` | Yellow! |
| `color-green.mp3` | Green! |
| `shape-circle.mp3` | Circle! |
| `shape-square.mp3` | Square! |
| `shape-triangle.mp3` | Triangle! |
| `shape-star.mp3` | Star! |
| `care-morning.mp3` | Good morning! |
| `fire-level.mp3` | A new place to help! |
| `fire-next.mp3` | Tap the green arrow to go somewhere new! |
| `storm-coming.mp3` | Here comes a big rainy storm! |
| `storm-over.mp3` | The storm is over. Look, the sun! |
| `raining-pets.mp3` | It's raining cats and dogs! |
| `pets-safe.mp3` | You saved them all! |
| `dig-first.mp3` | First, dig a hole with the shovel! |
| `dig-one.mp3` | Dig! One! |
| `dig-two.mp3` | Two! |
| `dig-three.mp3` | Three! A perfect hole! |
| `pat-it.mp3` | Now pat the dirt down! |
| `bye-bye.mp3` | Bye bye, friend! Have fun! |
| `pour-water.mp3` | Hold the can over the plant to water it! |
| `seed-in.mp3` | Now drop in a seed! |
| `water-me.mp3` | Tap the plant to water it! |
| `new-friend.mp3` | A new friend! |
| `new-seeds.mp3` | New seeds to plant! |
| `bigger-garden.mp3` | Your garden got bigger! |
| `confirm-bye.mp3` | Do you want to say bye-bye? Tap the soft pink button to say bye-bye, or the green one to stay. |
| `break-time.mp3` | Time for a little rest! |
| `hello.mp3` | Hello! |
| `welcome-home.mp3` | Welcome home, |

## Names in the name pickers

Said when a name button is touched (player nicknames and pet names) and in "Welcome home, ...".

| File | Say |
|---|---|
| `name-Sunny.mp3` | Sunny |
| `name-Bunny.mp3` | Bunny |
| `name-Sprout.mp3` | Sprout |
| `name-Star.mp3` | Star |
| `name-Peanut.mp3` | Peanut |
| `name-Buttercup.mp3` | Buttercup |
| `name-Pumpkin.mp3` | Pumpkin |
| `name-Ladybug.mp3` | Ladybug |
| `name-Honey.mp3` | Honey |
| `name-Dot.mp3` | Dot |
| `name-Bee.mp3` | Bee |
| `name-Twinkle.mp3` | Twinkle |
| `name-Biscuit.mp3` | Biscuit |
| `name-Pip.mp3` | Pip |
| `name-Mochi.mp3` | Mochi |
| `name-Nugget.mp3` | Nugget |
| `name-Clover.mp3` | Clover |
| `name-Peaches.mp3` | Peaches |
| `name-Maple.mp3` | Maple |
| `name-Button.mp3` | Button |
| `name-Pebble.mp3` | Pebble |
| `name-Waffles.mp3` | Waffles |
| `name-Poppy.mp3` | Poppy |
| `name-Cocoa.mp3` | Cocoa |
| `name-Daisy.mp3` | Daisy |
| `name-Muffin.mp3` | Muffin |
| `name-Waddles.mp3` | Waddles |
| `name-Nibbles.mp3` | Nibbles |
| `name-Whiskers.mp3` | Whiskers |
| `name-Snowball.mp3` | Snowball |
| `name-Ginger.mp3` | Ginger |
| `name-Bubbles.mp3` | Bubbles |
| `name-Oreo.mp3` | Oreo |
| `name-Pepper.mp3` | Pepper |
| `name-Fluffy.mp3` | Fluffy |
| `name-Sparkle.mp3` | Sparkle |
| `name-Bean.mp3` | Bean |
| `name-Noodle.mp3` | Noodle |

## Style Studio names

Said when she touches a friend, a hairstyle or a piece of clothing in the dress-up game, like "A ball gown!" or "Fairy wings!".

| File | Say |
|---|---|
| `style-tab-who.mp3` | Pick a friend! |
| `style-tab-hair.mp3` | Hair salon! |
| `style-tab-makeup.mp3` | Make-up! |
| `style-tab-dress.mp3` | Princess dresses! |
| `style-tab-top.mp3` | Tops! |
| `style-tab-bottom.mp3` | Skirts and pants! |
| `style-tab-shoes.mp3` | Shoes! |
| `style-tab-hat.mp3` | Crowns and hats! |
| `style-tab-extras.mp3` | Sparkly extras! |
| `style-tab-nails.mp3` | Nail salon! |
| `style-tab-places.mp3` | Places to go! |
| `style-who-0.mp3` | Poppy |
| `style-who-1.mp3` | Maya |
| `style-who-2.mp3` | Zoe |
| `style-who-3.mp3` | Ivy |
| `style-who-4.mp3` | Leo |
| `style-who-5.mp3` | Sam |
| `style-who-6.mp3` | Kai |
| `style-who-7.mp3` | Theo |
| `style-hair-long.mp3` | Long hair |
| `style-hair-wavy.mp3` | Wavy hair |
| `style-hair-ponytail.mp3` | A ponytail |
| `style-hair-pigtails.mp3` | Pigtails |
| `style-hair-buns.mp3` | Two buns |
| `style-hair-braid.mp3` | A braid |
| `style-hair-bob.mp3` | A bob |
| `style-hair-short.mp3` | Short hair |
| `style-hair-spiky.mp3` | Spiky hair |
| `style-hair-curly.mp3` | Curly hair |
| `style-hair-topknot.mp3` | A top knot |
| `style-hair-none.mp3` | No hair |
| `style-tool-comb.mp3` | A comb! |
| `style-tool-dryer.mp3` | A hair dryer! |
| `style-tool-spray.mp3` | Sparkle spray! |
| `style-tool-bubbles.mp3` | Bubbles! Wash the hair! |
| `style-dress-ball.mp3` | A ball gown! |
| `style-dress-aline.mp3` | A party dress! |
| `style-dress-tutu.mp3` | A ballet tutu! |
| `style-dress-mermaid.mp3` | A mermaid gown! |
| `style-dress-petal.mp3` | A flower fairy dress! |
| `style-dress-sun.mp3` | A sundress! |
| `style-top-tee.mp3` | A t-shirt |
| `style-top-tank.mp3` | A tank top |
| `style-top-stripes.mp3` | A stripy shirt |
| `style-top-hoodie.mp3` | A hoodie |
| `style-top-sweater.mp3` | A cozy sweater |
| `style-top-star.mp3` | A star shirt |
| `style-top-vest.mp3` | A fancy vest |
| `style-bottom-skirt.mp3` | A skirt |
| `style-bottom-shorts.mp3` | Shorts |
| `style-bottom-jeans.mp3` | Jeans |
| `style-bottom-leggings.mp3` | Leggings |
| `style-bottom-tutuskirt.mp3` | A tutu skirt |
| `style-shoes-sneakers.mp3` | Sneakers |
| `style-shoes-boots.mp3` | Boots |
| `style-shoes-sandals.mp3` | Sandals |
| `style-shoes-glass.mp3` | Glass slippers! |
| `style-shoes-flats.mp3` | Ballet shoes |
| `style-hat-crown.mp3` | A crown! |
| `style-hat-tiara.mp3` | A tiara! |
| `style-hat-bow.mp3` | A big bow |
| `style-hat-flowers.mp3` | A flower crown |
| `style-hat-cap.mp3` | A cap |
| `style-hat-beanie.mp3` | A woolly hat |
| `style-hat-party.mp3` | A party hat! |
| `style-hat-cowboy.mp3` | A cowboy hat |
| `style-hat-wizard.mp3` | A wizard hat! |
| `style-hat-bunny.mp3` | Bunny ears! |
| `style-hat-kitty.mp3` | Kitty ears! |
| `style-hat-princess.mp3` | A princess hat! |
| `style-face-glasses.mp3` | Glasses |
| `style-face-hearts.mp3` | Heart glasses! |
| `style-face-stars.mp3` | Star glasses! |
| `style-face-mask.mp3` | A fancy mask |
| `style-face-stache.mp3` | A silly mustache! |
| `style-neck-pearls.mp3` | Pearls |
| `style-neck-heart.mp3` | A heart necklace |
| `style-neck-star.mp3` | A star necklace |
| `style-neck-scarf.mp3` | A scarf |
| `style-neck-bowtie.mp3` | A bow tie |
| `style-back-cape.mp3` | A cape! |
| `style-back-fairy.mp3` | Fairy wings! |
| `style-back-butterfly.mp3` | Butterfly wings! |
| `style-back-angel.mp3` | Angel wings! |
| `style-back-pack.mp3` | A backpack |
| `style-hand-wand.mp3` | A magic wand! |
| `style-hand-flower.mp3` | Flowers |
| `style-hand-balloon.mp3` | A balloon! |
| `style-hand-purse.mp3` | A purse |
| `style-hand-teddy.mp3` | A teddy bear |
| `style-hand-lolly.mp3` | A lollipop! |
| `style-hair-pixie.mp3` | A pixie cut |
| `style-hair-afro.mp3` | A big afro |
| `style-hair-halfup.mp3` | Half up, half down |
| `style-hair-twinbraids.mp3` | Two braids |
| `style-hair-mohawk.mp3` | A mohawk! |
| `style-hair-bowl.mp3` | A bowl cut |
| `style-hair-longcurly.mp3` | Long curls |
| `style-hair-sidepony.mp3` | A side ponytail |
| `style-hair-locs.mp3` | Long locs |
| `style-hair-crownbraid.mp3` | A crown braid |
| `style-dress-royal.mp3` | A royal gown! |
| `style-dress-skater.mp3` | A twirly dress! |
| `style-dress-tiers.mp3` | A ruffle dress |
| `style-dress-pinafore.mp3` | A pinafore |
| `style-dress-snow.mp3` | An ice queen gown! |
| `style-top-polo.mp3` | A polo shirt |
| `style-top-jersey.mp3` | A sports shirt |
| `style-top-flannel.mp3` | A checked shirt |
| `style-top-cardigan.mp3` | A cardigan |
| `style-top-puffer.mp3` | A puffy jacket |
| `style-top-blazer.mp3` | A blazer |
| `style-top-hearttee.mp3` | A heart shirt |
| `style-bottom-capris.mp3` | Capri pants |
| `style-bottom-cargo.mp3` | Pocket pants |
| `style-bottom-joggers.mp3` | Joggers |
| `style-bottom-longskirt.mp3` | A long skirt |
| `style-bottom-plaid.mp3` | A checked skirt |
| `style-shoes-rainboots.mp3` | Rain boots |
| `style-shoes-heels.mp3` | Princess heels! |
| `style-shoes-fuzzy.mp3` | Fuzzy slippers |
| `style-shoes-skates.mp3` | Roller skates! |
| `style-hat-sun.mp3` | A sun hat |
| `style-hat-beret.mp3` | A beret |
| `style-hat-santa.mp3` | A Santa hat! |
| `style-hat-pirate.mp3` | A pirate hat! |
| `style-hat-chef.mp3` | A chef hat |
| `style-hat-halo.mp3` | A halo |
| `style-hat-ribbon.mp3` | A ribbon headband |
| `style-face-shades.mp3` | Sunglasses |
| `style-face-clown.mp3` | A red nose! |
| `style-face-whiskers.mp3` | Kitty whiskers! |
| `style-face-patch.mp3` | A pirate patch |
| `style-neck-lei.mp3` | A flower necklace |
| `style-neck-choker.mp3` | A choker |
| `style-neck-tie.mp3` | A necktie |
| `style-neck-medal.mp3` | A gold medal! |
| `style-back-bat.mp3` | Bat wings! |
| `style-back-dragon.mp3` | Dragon wings! |
| `style-back-rainbow.mp3` | Rainbow wings! |
| `style-hand-umbrella.mp3` | An umbrella |
| `style-hand-icecream.mp3` | Ice cream! |
| `style-hand-mirror.mp3` | A hand mirror |
| `style-hand-plush.mp3` | A bunny toy |
| `style-hand-starballoon.mp3` | A star balloon! |
| `style-place-0.mp3` | The castle ballroom |
| `style-place-1.mp3` | The garden |
| `style-place-2.mp3` | The beach |
| `style-place-3.mp3` | The salon |
| `style-place-4.mp3` | Under the stars |
| `style-place-5.mp3` | The rainbow meadow |
| `style-say-start.mp3` | Let's get dressed up! |
| `style-say-show.mp3` | Ta-da! Look at you! You look amazing! |
| `style-say-nails.mp3` | Pick a color and touch the nails! |
| `style-say-hair.mp3` | Touch the hair! |
| `style-say-lips.mp3` | Lipstick! |
| `style-say-shadow.mp3` | Sparkly eyes! |
| `style-say-blush.mp3` | Rosy cheeks! |
| `style-say-freckles.mp3` | Freckles! |
| `style-say-gems.mp3` | Face jewels! |
| `style-say-skin.mp3` | Skin color |
| `style-say-eyes.mp3` | Eye color |
| `style-say-glitter.mp3` | Glitter! |
| `style-say-all.mp3` | All the nails! |
| `style-say-clear.mp3` | Clean nails. |

## Letter names (A to Z)

Say the name of the letter: "Bee", "Cee".

| File | Say |
|---|---|
| `letter-a.mp3` | Ay |
| `letter-b.mp3` | Bee |
| `letter-c.mp3` | Cee |
| `letter-d.mp3` | Dee |
| `letter-e.mp3` | Ee |
| `letter-f.mp3` | Eff |
| `letter-g.mp3` | Gee |
| `letter-h.mp3` | Aitch |
| `letter-i.mp3` | Eye |
| `letter-j.mp3` | Jay |
| `letter-k.mp3` | Kay |
| `letter-l.mp3` | El |
| `letter-m.mp3` | Em |
| `letter-n.mp3` | En |
| `letter-o.mp3` | Oh |
| `letter-p.mp3` | Pee |
| `letter-q.mp3` | Cue |
| `letter-r.mp3` | Ar |
| `letter-s.mp3` | Ess |
| `letter-t.mp3` | Tee |
| `letter-u.mp3` | You |
| `letter-v.mp3` | Vee |
| `letter-w.mp3` | Double you |
| `letter-x.mp3` | Ex |
| `letter-y.mp3` | Why |
| `letter-z.mp3` | Zee |

## Letter sounds (A to Z)

Say the sound the letter makes: "buh", "kuh", "sss". Not the name.

| File | Say |
|---|---|
| `sound-a.mp3` | ah |
| `sound-b.mp3` | buh |
| `sound-c.mp3` | kuh |
| `sound-d.mp3` | duh |
| `sound-e.mp3` | eh |
| `sound-f.mp3` | fuh |
| `sound-g.mp3` | guh |
| `sound-h.mp3` | huh |
| `sound-i.mp3` | ih |
| `sound-j.mp3` | juh |
| `sound-k.mp3` | kuh |
| `sound-l.mp3` | luh |
| `sound-m.mp3` | muh |
| `sound-n.mp3` | nuh |
| `sound-o.mp3` | aw |
| `sound-p.mp3` | puh |
| `sound-q.mp3` | kwuh |
| `sound-r.mp3` | ruh |
| `sound-s.mp3` | sss |
| `sound-t.mp3` | tuh |
| `sound-u.mp3` | uh |
| `sound-v.mp3` | vuh |
| `sound-w.mp3` | wuh |
| `sound-x.mp3` | ks |
| `sound-y.mp3` | yuh |
| `sound-z.mp3` | zzz |

## Picture words

The word for each letter picture: apple, bear, cat...

| File | Say |
|---|---|
| `word-a.mp3` | apple |
| `word-b.mp3` | bear |
| `word-c.mp3` | cat |
| `word-d.mp3` | dog |
| `word-e.mp3` | elephant |
| `word-f.mp3` | fish |
| `word-g.mp3` | giraffe |
| `word-h.mp3` | horse |
| `word-i.mp3` | ice cream |
| `word-j.mp3` | juice |
| `word-k.mp3` | koala |
| `word-l.mp3` | lion |
| `word-m.mp3` | moon |
| `word-n.mp3` | nose |
| `word-o.mp3` | octopus |
| `word-p.mp3` | pig |
| `word-q.mp3` | queen |
| `word-r.mp3` | rainbow |
| `word-s.mp3` | sun |
| `word-t.mp3` | turtle |
| `word-u.mp3` | umbrella |
| `word-v.mp3` | violin |
| `word-w.mp3` | whale |
| `word-x.mp3` | box |
| `word-y.mp3` | yarn |
| `word-z.mp3` | zebra |

## Garden friend announcements

Said when a new garden friend appears.

| File | Say |
|---|---|
| `creature-bee.mp3` | Bzzz! A bee! |
| `creature-butterfly.mp3` | A butterfly! |
| `creature-ladybug.mp3` | A ladybug! |
| `creature-bunny.mp3` | A bunny! |
| `creature-bird.mp3` | A little bird! |
| `creature-snail.mp3` | A snail! |
| `creature-hedgehog.mp3` | A hedgehog! |
| `creature-frog.mp3` | A frog! |
| `creature-duckling.mp3` | A duckling! |
| `creature-mouse.mp3` | A little mouse! |
| `creature-turtle.mp3` | A turtle! |
| `creature-dragonfly.mp3` | A dragonfly! |
| `creature-cat.mp3` | A kitty! |
| `creature-dog.mp3` | A puppy! |

## Critter noises (make the sound!)

Played when she taps a garden friend. Just make the noise, like a bee buzz or a frog ribbit.

| File | Say |
|---|---|
| `critter-bee.mp3` | Bzzzz! |
| `critter-butterfly.mp3` | a soft flutter noise |
| `critter-ladybug.mp3` | a tiny squeak |
| `critter-bunny.mp3` | a happy sniffle |
| `critter-bird.mp3` | Tweet tweet! |
| `critter-snail.mp3` | a slow, sleepy "sloooow" |
| `critter-hedgehog.mp3` | a little snuffle |
| `critter-frog.mp3` | Ribbit! |
| `critter-duckling.mp3` | Quack quack! |
| `critter-mouse.mp3` | Squeak squeak! |
| `critter-turtle.mp3` | a slow "hellooo" |
| `critter-dragonfly.mp3` | a quick buzzy zip |
| `critter-cat.mp3` | Meow! |
| `critter-dog.mp3` | Woof woof! |

## Purring and happy sounds

Played while she strokes a pet in the close-up view in Pet Care (it loops while she pets). If nothing is recorded the game makes a soft purr of its own. A few seconds of a real purr works best.

| File | Say |
|---|---|
| `purr-cat.mp3` | a long, happy purr (a real cat purring is best) |
| `purr-dog.mp3` | a happy, sleepy dog groan or soft pant |
| `purr-bunny.mp3` | a bunny "tooth purr", soft chattering teeth |
| `purr-bear.mp3` | a low, contented hum |
| `purr-fox.mp3` | a soft, chirpy fox chatter |
| `purr-panda.mp3` | a gentle panda bleat or hum |
| `purr-frog.mp3` | a soft, slow ribbit |

