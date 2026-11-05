# Lumen – Study Helper (React)

A React + Vite website with three AI tools for students: **Summarize**, **Explain simply**, and **Quiz maker**.
The AI runs on OpenRouter's free models.

## Folder structure

```
Lumen-React/
├── index.html
├── vite.config.js        # Vite setup + the /api/ai route
├── server/ai.js          # talks to OpenRouter (keeps the key private)
├── .env                  # your OpenRouter key (never share or upload this)
└── src/
    ├── main.jsx          # starts React
    ├── App.jsx           # the page: tabs, input, options, results
    ├── api.js            # sends requests to /api/ai
    ├── index.css         # styles
    └── components/
        └── Quiz.jsx      # interactive quiz
```

## How to run

First time only:

1. Install [Node.js](https://nodejs.org) (LTS version) and check it with:

```
node -v
```

2. Go to the project folder:

```
cd "C:\Users\ninoa\Downloads\BSIT 3B workspace\Lumen-React"
```

3. Install the packages:

```
npm install
```

Every time you want to run it:

4. Start the site:

```
npm run dev
```

5. Open the address it prints in your browser (usually http://localhost:5173).

Keep the terminal open while you use the site. Press `Ctrl + C` in it to stop.

## Notes

- The key lives in `.env` as `OPENROUTER_API_KEY`. Don't put it in any file inside `src`, and don't upload `.env` to GitHub (it's already in `.gitignore`).
- The AI route runs inside the Vite dev server, so use `npm run dev` (or `npm run preview`). A plain `npm run build` produces static files that have no AI backend on their own.
- Free models have low limits (roughly 50 requests per day, 20 per minute). If you see a "busy" message, wait a bit and try again.
