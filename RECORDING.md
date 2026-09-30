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
1. **Cheering** and **Prompts**: about 31 short lines.
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

