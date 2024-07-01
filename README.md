## Letterboxd Parents Guide App

An app to check whether the films on your Letterboxd list are safe to watch in the living room.

### Please run it on your local server only!

Currently this directly fetches both Letterboxd and IMDB data, it's neither scaleable or nice to be doing . 

## Guide
To modify the parameters, go to the src/app/constants.ts file.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
