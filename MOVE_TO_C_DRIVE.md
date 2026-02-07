# Move project to C:\ to fix path/encoding issues

Hebrew or other non-ASCII characters in the project path (e.g. `C:\Users\גבריאל\Documents\sim2me`) can cause 500 errors and blank pages with Next.js/Node on Windows. Moving the project to **C:\sim2me** (or another path with no special characters) fixes this.

## Option A: Manual copy (recommended)

1. **Stop the dev server** in Cursor (Ctrl+C in the terminal) and close Cursor.
2. **Open File Explorer** and go to your Documents folder (where the current `sim2me` folder is).
3. **Copy** the entire **sim2me** folder (right‑click → Copy).
4. **Paste** it into **C:\** so you get **C:\sim2me**.
   - You can delete the old folder from Documents later if you want.
5. **Delete** these inside **C:\sim2me** (to avoid copying huge/generated files):
   - `node_modules` (folder)
   - `.next` (folder)
6. **Open Cursor** → **File → Open Folder** → choose **C:\sim2me**.
7. **Open Terminal** in Cursor and run:
   ```powershell
   npm install
   npm run dev
   ```
8. Open **http://localhost:3000** (and **http://localhost:3000/he** for Hebrew).

From now on, work only from **C:\sim2me**.

## Option B: PowerShell copy script

Run this from **Windows PowerShell** (Start → type “PowerShell”). Replace the first path with your actual project folder if it’s different:

```powershell
$source = "C:\Users\גבריאל\Documents\sim2me"
$dest   = "C:\sim2me"
New-Item -ItemType Directory -Path $dest -Force
Get-ChildItem $source -Exclude node_modules,.next,.git | ForEach-Object { Copy-Item $_.FullName -Destination (Join-Path $dest $_.Name) -Recurse -Force }
```

Then open **C:\sim2me** in Cursor and run `npm install` and `npm run dev`.

## Option C: Robocopy (one command)

In **Command Prompt** or PowerShell:

```cmd
robocopy "C:\Users\גבריאל\Documents\sim2me" "C:\sim2me" /E /XD node_modules .next .git
```

Then open **C:\sim2me** in Cursor and run `npm install` and `npm run dev`.

## After moving

- Use **C:\sim2me** as your only project folder.
- If you use Git, run `git status` in **C:\sim2me**; if the repo is intact, you can keep working and push from there.
