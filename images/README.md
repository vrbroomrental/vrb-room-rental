# Site images

These were generated from `../../Photos/` and `../../VRB/` and are already
cropped, resized and compressed for the web. To swap a photo, drop in a
replacement with the **same filename** — the page picks it up with no code
changes.

| File               | Where it appears                | Shape / size          |
|--------------------|---------------------------------|-----------------------|
| `hero.jpg`         | Full-screen hero background     | any; 1500px long edge |
| `suite.jpg`        | "The Rooms" split + gallery     | 4:5 portrait, 1200px  |
| `facade.jpg`       | "The Residence" split + gallery | 4:5 portrait, 1200px  |
| `room.jpg`         | Gallery                         | 4:5 portrait, 980px   |
| `corridor.jpg`     | Gallery                         | 4:5 portrait, 980px   |
| `lobby.jpg`        | Gallery                         | 4:5 portrait, 980px   |
| `bathroom.jpg`     | Gallery                         | 4:5 portrait, 980px   |
| `logo-lockup.png`  | Header, hero, footer            | transparent PNG       |
| `logo-mark.png`    | Favicon, "Welcome" divider      | transparent PNG       |

## Replacing a photo

Crop to **4:5 portrait** (e.g. 1200 × 1500), keep it under ~250 KB, and save
as JPEG. On a Mac you can do both from Terminal:

```bash
sips -Z 1200 yourphoto.jpg --out room.jpg && sips -s format jpeg -s formatOptions 62 room.jpg --out room.jpg
```

The hero is the exception — it is used full-bleed and the browser crops it,
so any orientation works. If the visible slice is wrong, adjust
`object-position` on `.hero__media img` in `index.html`.

## Logo files

Both logo files are derived from
`../../VRB/VRB Room Rental (Official Logo-Transparent).png`, which already has
a transparent background. `logo-lockup.png` is the full stacked lockup with the
empty margin trimmed; `logo-mark.png` is the chandelier on its own.
